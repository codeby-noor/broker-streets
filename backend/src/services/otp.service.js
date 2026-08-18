const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const OtpSession = require('../models/OtpSession');
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const generateOtp = () => {
  // Item 2: Secure random generator using crypto.randomInt
  const min = Math.pow(10, env.otpLength - 1);
  const max = Math.pow(10, env.otpLength) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

const sendSmsViaMsg91 = async (mobile, otp) => {
  if (!env.enableRealSms || !env.smsApiKey) {
    logger.info(`[MOCK MSG91 SMS] OTP for ${mobile} is ${otp}`);
    return { success: true, mocked: true };
  }

  try {
    const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;
    const response = await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {
        template_id: env.smsTemplateId,
        mobile: formattedMobile,
        otp: otp,
      },
      {
        headers: {
          authkey: env.smsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`[MSG91 SMS] Sent OTP to ${mobile}, response: ${JSON.stringify(response.data)}`);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error(`[MSG91 SMS Error] Failed to send OTP to ${mobile}: ${error.message}`);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to dispatch SMS OTP');
  }
};

const createAndSendOtp = async (mobile, pendingUserData = null) => {
  // Check for active lockout across any unused session for this mobile
  const existingSession = await OtpSession.findOne({ mobile, used: false }).sort({ createdAt: -1 });

  if (existingSession && existingSession.lockedUntil && existingSession.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((existingSession.lockedUntil - new Date()) / (1000 * 60));
    throw new ApiError(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      `Too many failed attempts. Account locked for OTP verification. Try again in ${remainingMinutes} minute(s).`
    );
  }

  const finalPendingUserData =
    pendingUserData ||
    (existingSession && existingSession.expiresAt > new Date() ? existingSession.pendingUserData : null);

  // Item 10: Invalidate prior unused active sessions for this mobile before creating a new one
  await OtpSession.updateMany({ mobile, used: false }, { $set: { used: true } });

  const rawOtp = generateOtp();
  const hashedOtp = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

  const newSession = await OtpSession.create({
    mobile,
    otp: hashedOtp,
    expiresAt,
    // Item 1: Store pending registration data on session so User record isn't mutated before verification
    pendingUserData: finalPendingUserData,
  });

  await sendSmsViaMsg91(mobile, rawOtp);

  return {
    mobile,
    expiresAt,
    sessionId: newSession._id,
    ...(env.nodeEnv === 'development' ? { otp: rawOtp } : {}),
  };
};

const verifyOtp = async (mobile, inputOtp) => {
  const session = await OtpSession.findOne({ mobile, used: false }).sort({ createdAt: -1 });

  if (!session) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP not requested or expired. Please request a new OTP.');
  }

  if (session.lockedUntil && session.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((session.lockedUntil - new Date()) / (1000 * 60));
    throw new ApiError(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      `Account locked for OTP verification. Try again in ${remainingMinutes} minute(s).`
    );
  }

  if (session.expiresAt < new Date()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP has expired. Please request a new OTP.');
  }

  const isValid = await bcrypt.compare(inputOtp, session.otp);

  if (!isValid) {
    // Item 5 (fixed): increment atomically first, then decide lockout from the
    // returned post-increment count — never from a value read before the $inc,
    // which is what let two concurrent invalid attempts both slip past the cap.
    const incremented = await OtpSession.findByIdAndUpdate(
      session._id,
      { $inc: { attempts: 1 } },
      { new: true }
    );

    const isLockingOut = incremented.attempts >= env.otpMaxAttempts;

    // Item 9: Ensure expiresAt extends to cover lockedUntil so MongoDB TTL index won't delete locked session early.
    // Only set on the request that actually crosses the threshold, so concurrent
    // requests that also cross it don't keep pushing lockedUntil further out.
    if (isLockingOut && !incremented.lockedUntil) {
      const lockedUntilDate = new Date(Date.now() + env.otpLockMinutes * 60 * 1000);
      await OtpSession.updateOne(
        { _id: session._id },
        { $set: { lockedUntil: lockedUntilDate, expiresAt: lockedUntilDate } }
      );
    }

    if (isLockingOut) {
      throw new ApiError(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        `Maximum invalid OTP attempts reached. Locked for ${env.otpLockMinutes} minutes.`
      );
    }

    const remainingAttempts = env.otpMaxAttempts - incremented.attempts;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
  }

  // Item 4: Atomic update marking OTP as used to prevent race conditions and replay attacks
  const updatedSession = await OtpSession.findOneAndUpdate(
    { _id: session._id, used: false },
    { $set: { used: true } },
    { new: true }
  );

  if (!updatedSession) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP has already been used or expired.');
  }

  return {
    verified: true,
    pendingUserData: updatedSession.pendingUserData || null,
  };
};

module.exports = {
  createAndSendOtp,
  verifyOtp,
  sendSmsViaMsg91,
};
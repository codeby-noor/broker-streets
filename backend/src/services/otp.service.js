const bcrypt = require('bcryptjs');
const axios = require('axios');
const OtpSession = require('../models/OtpSession');
const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const generateOtp = () => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < env.otpLength; i += 1) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
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

const createAndSendOtp = async (mobile) => {
  // Check for active lockout
  const existingSession = await OtpSession.findOne({ mobile, used: false }).sort({ createdAt: -1 });

  if (existingSession && existingSession.lockedUntil && existingSession.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((existingSession.lockedUntil - new Date()) / (1000 * 60));
    throw new ApiError(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      `Too many failed attempts. Account locked for OTP verification. Try again in ${remainingMinutes} minute(s).`
    );
  }

  const rawOtp = generateOtp();
  const hashedOtp = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

  await OtpSession.create({
    mobile,
    otp: hashedOtp,
    expiresAt,
  });

  await sendSmsViaMsg91(mobile, rawOtp);

  return {
    mobile,
    expiresAt,
    ...(env.nodeEnv === 'development' || !env.enableRealSms ? { otp: rawOtp } : {}),
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
    session.attempts += 1;
    if (session.attempts >= env.otpMaxAttempts) {
      session.lockedUntil = new Date(Date.now() + env.otpLockMinutes * 60 * 1000);
      await session.save();
      throw new ApiError(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        `Maximum invalid OTP attempts reached. Locked for ${env.otpLockMinutes} minutes.`
      );
    }
    await session.save();
    const remainingAttempts = env.otpMaxAttempts - session.attempts;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
  }

  session.used = true;
  await session.save();

  return true;
};

module.exports = {
  createAndSendOtp,
  verifyOtp,
  sendSmsViaMsg91,
};

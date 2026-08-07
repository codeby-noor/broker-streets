const User = require('../models/User');
const { createAndSendOtp, verifyOtp } = require('../services/otp.service');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/jwt.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

// Item 14: Centralized auth response formatter maintaining legacy key compatibility
const formatAuthPayload = (user, accessToken, refreshToken) => ({
  user,
  token: accessToken,
  accessToken,
  refreshToken,
});

// Item 12: Deduplicated user lookup & creation helper
const syncUserData = async (mobile, userData = {}) => {
  let user = await User.findOne({ mobile });

  if (user) {
    let updated = false;
    if (userData.name && userData.name !== user.name) { user.name = userData.name; updated = true; }
    if (userData.email !== undefined && userData.email !== user.email) { user.email = userData.email; updated = true; }
    if (userData.city && userData.city !== user.city) { user.city = userData.city; updated = true; }
    if (userData.state && userData.state !== user.state) { user.state = userData.state; updated = true; }
    if (userData.district && userData.district !== user.district) { user.district = userData.district; updated = true; }
    if (userData.subDistrict && userData.subDistrict !== user.subDistrict) { user.subDistrict = userData.subDistrict; updated = true; }
    if (updated) await user.save();
  } else if (userData.name && userData.city) {
    user = await User.create({
      name: userData.name,
      mobile,
      email: userData.email || '',
      city: userData.city,
      state: userData.state || 'Gujarat',
      district: userData.district || '',
      subDistrict: userData.subDistrict || '',
    });
  }

  return user;
};

const register = asyncHandler(async (req, res) => {
  const { name, mobile, email, city, state, district, subDistrict } = req.body;

  const pendingUserData = { name, email, city, state, district, subDistrict };

  // Item 1: Unauthenticated profile overwrite fix — store registration data on OTP session instead of mutating User document immediately
  const otpData = await createAndSendOtp(mobile, pendingUserData);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        mobile,
        otpSent: true,
        expiresAt: otpData.expiresAt,
        ...(otpData.otp ? { devOtp: otpData.otp } : {}),
      },
      'Registration requested. OTP sent for verification.'
    )
  );
});

const sendOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  const otpData = await createAndSendOtp(mobile);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        mobile,
        expiresAt: otpData.expiresAt,
        ...(otpData.otp ? { devOtp: otpData.otp } : {}),
      },
      'OTP sent successfully.'
    )
  );
});

const verifyOtpController = asyncHandler(async (req, res) => {
  const { mobile, otp, name, email, city, state, district, subDistrict } = req.body;

  // Verify OTP and retrieve any pending registration data attached to the session
  const { pendingUserData } = await verifyOtp(mobile, otp);

  // Combine body parameters with session's pendingUserData (session data takes priority if supplied via /register)
  const userData = {
    ...(name || city ? { name, email, city, state, district, subDistrict } : {}),
    ...(pendingUserData || {}),
  };

  // Item 1 & 12: Mutate/Create User record NOW after OTP has been verified
  const user = await syncUserData(mobile, userData);

  if (!user) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Account does not exist. Please complete registration with name and city.'
    );
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      formatAuthPayload(user, accessToken, refreshToken),
      'OTP verified successfully.'
    )
  );
});

const getMe = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user: req.user }, 'Current user profile fetched successfully.')
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Refresh token is required');
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token or user inactive');
    }

    // Item 8: Verify tokenVersion matches user.tokenVersion to handle token revocation
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token has been revoked. Please sign in again.');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        formatAuthPayload(user, newAccessToken, newRefreshToken),
        'Access token refreshed successfully.'
      )
    );
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
  }
});

module.exports = {
  register,
  sendOtp,
  verifyOtp: verifyOtpController,
  getMe,
  refreshAccessToken,
};

const User = require('../models/User');
const { createAndSendOtp, verifyOtp } = require('../services/otp.service');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../services/jwt.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const register = asyncHandler(async (req, res) => {
  const { name, mobile, email, city, state, district, subDistrict } = req.body;

  let user = await User.findOne({ mobile });

  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    user.city = city || user.city;
    if (state) user.state = state;
    if (district) user.district = district;
    if (subDistrict) user.subDistrict = subDistrict;
    await user.save();
  } else {
    user = await User.create({
      name,
      mobile,
      email: email || '',
      city,
      state: state || 'Gujarat',
      district: district || '',
      subDistrict: subDistrict || '',
    });
  }

  const otpData = await createAndSendOtp(mobile);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        user,
        otpSent: true,
        expiresAt: otpData.expiresAt,
        ...(otpData.otp ? { devOtp: otpData.otp } : {}),
      },
      'User registered successfully. OTP sent for verification.'
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
  const { mobile, otp, name, email, city } = req.body;

  await verifyOtp(mobile, otp);

  let user = await User.findOne({ mobile });

  if (!user) {
    if (!name || !city) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Account does not exist. Please complete registration with name and city.'
      );
    }
    user = await User.create({
      name,
      mobile,
      email: email || '',
      city,
      state: 'Gujarat',
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        user,
        token: accessToken,
        accessToken,
        refreshToken,
      },
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

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          token: newAccessToken,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
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

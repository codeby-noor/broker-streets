const AdminUser = require('../../models/AdminUser');
const AdminActivityLog = require('../../models/AdminActivityLog');
const { createAndSendOtp, verifyOtp } = require('../../services/otp.service');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../services/jwt.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { HTTP_STATUS } = require('../../utils/constants');

const sendOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  const normalizedMobile = String(mobile || '').replace(/\D/g, '');
  const admin = await AdminUser.findOne({ mobile: normalizedMobile, isActive: true });

  if (!admin) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'This mobile number is not authorized for admin access'
    );
  }

  const otpData = await createAndSendOtp(normalizedMobile);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        mobile: normalizedMobile,
        expiresAt: otpData.expiresAt,
        ...(otpData.otp ? { devOtp: otpData.otp } : {}),
      },
      'Admin OTP sent successfully.'
    )
  );
});

const verifyOtpController = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;
  const normalizedMobile = String(mobile || '').replace(/\D/g, '');

  await verifyOtp(normalizedMobile, otp);

  const admin = await AdminUser.findOne({ mobile: normalizedMobile, isActive: true });
  if (!admin) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'This mobile number is not authorized for admin access or account is deactivated'
    );
  }

  admin.lastLogin = new Date();
  await admin.save();

  // Record admin login activity log
  try {
    await AdminActivityLog.create({
      adminId: admin._id,
      mobile: admin.mobile,
      name: admin.name || '',
      role: admin.role,
      type: 'login',
      status: 'Login',
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      sessionInfo: 'Session started via Mobile OTP',
    });
  } catch (err) {
    console.error('[AdminActivityLog] Error creating login audit entry:', err.message);
  }

  const accessToken = generateAccessToken(admin);
  const refreshToken = generateRefreshToken(admin);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        user: admin,
        token: accessToken,
        accessToken,
        refreshToken,
      },
      'Admin authenticated successfully.'
    )
  );
});

const logout = asyncHandler(async (req, res) => {
  await AdminUser.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

  // Record admin logout activity log
  try {
    await AdminActivityLog.create({
      adminId: req.user._id,
      mobile: req.user.mobile,
      name: req.user.name || '',
      role: req.user.role,
      type: 'logout',
      status: 'Logout',
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      sessionInfo: 'Session closed via explicit logout',
    });
  } catch (err) {
    console.error('[AdminActivityLog] Error creating logout audit entry:', err.message);
  }

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {}, 'Admin logged out successfully.')
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Refresh token is required');
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const admin = await AdminUser.findById(decoded.userId);

    if (!admin || !admin.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token or admin account inactive');
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== admin.tokenVersion) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token has been revoked. Please sign in again.');
    }

    const newAccessToken = generateAccessToken(admin);
    const newRefreshToken = generateRefreshToken(admin);

    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          user: admin,
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
  sendOtp,
  verifyOtp: verifyOtpController,
  logout,
  refreshAccessToken,
};

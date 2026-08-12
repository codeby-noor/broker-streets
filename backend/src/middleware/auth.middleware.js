const { verifyAccessToken } = require('../services/jwt.service');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    let user = await User.findById(decoded.userId);
    if (!user) {
      const AdminUser = require('../models/AdminUser');
      user = await AdminUser.findById(decoded.userId);
    }

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User no longer exists');
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'User account is deactivated');
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token has been revoked. Please sign in again.');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired access token');
  }
});

module.exports = authenticateToken;

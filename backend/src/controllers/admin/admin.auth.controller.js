const bcrypt = require('bcryptjs');
const AdminUser = require('../../models/AdminUser');
const { generateAccessToken, generateRefreshToken } = require('../../services/jwt.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { HTTP_STATUS } = require('../../utils/constants');

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
  }

  const admin = await AdminUser.findOne({ email: email.trim().toLowerCase(), isActive: true });
  if (!admin) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid admin email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid admin email or password');
  }

  admin.lastLogin = new Date();
  await admin.save();

  const accessToken = generateAccessToken(admin);
  const refreshToken = generateRefreshToken(admin);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      {
        token: accessToken,
        accessToken,
        refreshToken,
        admin,
      },
      'Admin logged in successfully'
    )
  );
});

const adminLogout = asyncHandler(async (req, res) => {
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, {}, 'Admin logged out successfully')
  );
});

module.exports = {
  adminLogin,
  adminLogout,
};

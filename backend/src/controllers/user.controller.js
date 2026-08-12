const User = require('../models/User');
const uploadService = require('../services/upload.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

// GET /api/users/me — return the current authenticated user's profile
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user }, 'User profile fetched successfully.')
  );
});

// PUT /api/users/me — update the current user's profile
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  const allowedFields = ['name', 'email', 'whatsapp', 'district', 'subDistrict', 'address'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user }, 'User profile updated successfully.')
  );
});

// PUT /api/users/me/profile-image — persist the uploaded URL onto User.profileImage
const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No profile image file provided');
  }

  const processed = await uploadService.processFile(req.file, 'profiles');

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  // Best-effort cleanup of the previous profile image after the new one is saved
  const previousImage = user.profileImage;
  user.profileImage = processed.url;
  await user.save();

  if (previousImage) {
    try {
      await uploadService.deleteFile(previousImage);
    } catch (cleanupErr) {
      console.warn(`Failed to clean up previous profile image for user ${user._id}:`, cleanupErr.message);
    }
  }

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { user }, 'Profile image updated successfully.')
  );
});

module.exports = {
  getMe,
  updateMe,
  updateProfileImage,
};
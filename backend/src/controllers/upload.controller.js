const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const uploadImagesHandler = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No image files provided');
  }

  const processed = await uploadService.processFiles(req.files, 'properties');
  const data = processed.map((item) => ({
    url: item.url,
    name: item.name,
  }));

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, data, 'Images uploaded successfully')
  );
});

const uploadVideosHandler = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No video files provided');
  }

  const processed = await uploadService.processFiles(req.files, 'videos');
  const data = processed.map((item) => ({
    url: item.url,
    name: item.name,
  }));

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, data, 'Videos uploaded successfully')
  );
});

const uploadDocumentHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No document file provided');
  }

  const processed = await uploadService.processFile(req.file, 'documents');
  const data = {
    url: processed.url,
    name: processed.name,
    type: processed.mimetype,
    size: processed.size,
  };

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, data, 'Document uploaded successfully')
  );
});

const uploadAudioHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No audio file provided');
  }

  const processed = await uploadService.processFile(req.file, 'audio');
  const data = {
    url: processed.url,
    name: processed.name,
  };

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, data, 'Voice recording uploaded successfully')
  );
});

const uploadProfileImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No profile image file provided');
  }

  const processed = await uploadService.processFile(req.file, 'profiles');
  const data = {
    url: processed.url,
  };

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, data, 'Profile image uploaded successfully')
  );
});

module.exports = {
  uploadImagesHandler,
  uploadVideosHandler,
  uploadDocumentHandler,
  uploadAudioHandler,
  uploadProfileImageHandler,
};

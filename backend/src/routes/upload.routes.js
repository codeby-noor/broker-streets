const express = require('express');
const uploadController = require('../controllers/upload.controller');
const authenticateToken = require('../middleware/auth.middleware');
const { uploadRateLimiter } = require('../middleware/rateLimiter.middleware');
const {
  uploadImages,
  uploadVideos,
  uploadDocument,
  uploadAudio,
  uploadProfileImage,
} = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(uploadRateLimiter);

router.post('/images', uploadImages, uploadController.uploadImagesHandler);
router.post('/videos', uploadVideos, uploadController.uploadVideosHandler);
router.post('/documents', uploadDocument, uploadController.uploadDocumentHandler);
router.post('/audio', uploadAudio, uploadController.uploadAudioHandler);
router.post('/profile-image', uploadProfileImage, uploadController.uploadProfileImageHandler);

module.exports = router;

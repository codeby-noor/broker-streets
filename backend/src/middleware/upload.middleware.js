const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Per BACKEND_SPEC.md §11.4 — Use memoryStorage for cloud/local stream processing
const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
        `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`
      ),
      false
    );
  }
};

const uploadImages = multer({
  storage,
  limits: { fileSize: env.uploadMaxImageSizeMb * 1024 * 1024 },
  fileFilter: fileFilter(env.uploadAllowedImageTypes),
}).array('images', 10);

const uploadVideos = multer({
  storage,
  limits: { fileSize: env.uploadMaxVideoSizeMb * 1024 * 1024 },
  fileFilter: fileFilter(env.uploadAllowedVideoTypes),
}).array('videos', 3);

const uploadDocument = multer({
  storage,
  limits: { fileSize: env.uploadMaxDocumentSizeMb * 1024 * 1024 },
  fileFilter: fileFilter(env.uploadAllowedDocumentTypes),
}).single('document');

const uploadAudio = multer({
  storage,
  limits: { fileSize: env.uploadMaxAudioSizeMb * 1024 * 1024 },
  fileFilter: fileFilter(env.uploadAllowedAudioTypes),
}).single('audio');

const uploadProfileImage = multer({
  storage,
  limits: { fileSize: env.uploadMaxProfileImageSizeMb * 1024 * 1024 },
  fileFilter: fileFilter(env.uploadAllowedImageTypes),
}).single('image');

const uploadListingFilesMulter = multer({
  storage,
  limits: { fileSize: env.uploadMaxVideoSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allAllowed = [
      ...env.uploadAllowedImageTypes,
      ...env.uploadAllowedVideoTypes,
      ...env.uploadAllowedDocumentTypes,
    ];
    if (allAllowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
          `Invalid file type: ${file.mimetype}`
        ),
        false
      );
    }
  },
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 3 },
  { name: 'document', maxCount: 1 },
]);

// Per-field size limit validation for uploadListingFiles
const validateListingFileSizes = (req, res, next) => {
  if (!req.files) return next();

  const maxImageBytes = env.uploadMaxImageSizeMb * 1024 * 1024;
  const maxVideoBytes = env.uploadMaxVideoSizeMb * 1024 * 1024;
  const maxDocBytes = env.uploadMaxDocumentSizeMb * 1024 * 1024;

  if (req.files.images) {
    for (const file of req.files.images) {
      const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
      if (fileSize > maxImageBytes) {
        return next(
          new ApiError(
            HTTP_STATUS.PAYLOAD_TOO_LARGE,
            `Image file ${file.originalname} exceeds max size limit of ${env.uploadMaxImageSizeMb}MB`
          )
        );
      }
    }
  }

  if (req.files.videos) {
    for (const file of req.files.videos) {
      const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
      if (fileSize > maxVideoBytes) {
        return next(
          new ApiError(
            HTTP_STATUS.PAYLOAD_TOO_LARGE,
            `Video file ${file.originalname} exceeds max size limit of ${env.uploadMaxVideoSizeMb}MB`
          )
        );
      }
    }
  }

  if (req.files.document && req.files.document[0]) {
    const file = req.files.document[0];
    const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
    if (fileSize > maxDocBytes) {
      return next(
        new ApiError(
          HTTP_STATUS.PAYLOAD_TOO_LARGE,
          `Document file ${file.originalname} exceeds max size limit of ${env.uploadMaxDocumentSizeMb}MB`
        )
      );
    }
  }

  next();
};

const uploadListingFiles = (req, res, next) => {
  uploadListingFilesMulter(req, res, (err) => {
    if (err) return next(err);
    validateListingFileSizes(req, res, next);
  });
};

const uploadBuyerLeadFilesMulter = multer({
  storage,
  limits: { fileSize: env.uploadMaxAudioSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (env.uploadAllowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
          `Invalid file type: ${file.mimetype}. Allowed audio types: ${env.uploadAllowedAudioTypes.join(', ')}`
        ),
        false
      );
    }
  },
}).fields([
  { name: 'voiceRecording', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

const validateBuyerLeadFileSizes = (req, res, next) => {
  if (!req.files) return next();

  const maxAudioBytes = env.uploadMaxAudioSizeMb * 1024 * 1024;
  const audioFile = req.files.voiceRecording?.[0] || req.files.audio?.[0];

  if (audioFile) {
    const fileSize = audioFile.size || (audioFile.buffer ? audioFile.buffer.length : 0);
    if (fileSize > maxAudioBytes) {
      return next(
        new ApiError(
          HTTP_STATUS.PAYLOAD_TOO_LARGE,
          `Audio file ${audioFile.originalname} exceeds max size limit of ${env.uploadMaxAudioSizeMb}MB`
        )
      );
    }
  }

  next();
};

const uploadBuyerLeadFiles = (req, res, next) => {
  uploadBuyerLeadFilesMulter(req, res, (err) => {
    if (err) return next(err);
    validateBuyerLeadFileSizes(req, res, next);
  });
};

module.exports = {
  uploadImages,
  uploadVideos,
  uploadDocument,
  uploadAudio,
  uploadProfileImage,
  uploadListingFiles,
  uploadBuyerLeadFiles,
};

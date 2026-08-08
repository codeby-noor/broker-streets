const multer = require('multer');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err instanceof multer.MulterError) {
    let statusCode = HTTP_STATUS.BAD_REQUEST;
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = HTTP_STATUS.PAYLOAD_TOO_LARGE;
    }
    error = new ApiError(statusCode, `Upload error: ${err.message}`);
  } else if (err.name === 'CastError') {
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid ${err.path || 'resource ID'}`);
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(env.nodeEnv === 'development' && { stack: error.stack }),
  };

  logger.error(`${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}`);

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

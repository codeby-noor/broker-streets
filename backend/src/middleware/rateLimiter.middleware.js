const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

// Note: express-rate-limit defaults to MemoryStore. For distributed multi-instance production deployments,
// pass a RedisStore or MemcachedStore via options.store.
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, 'Too many requests from this IP, please try again after 15 minutes.'));
  },
});

const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, 'Too many OTP requests. Please wait 15 minutes before requesting again.'));
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, 'Too many authentication attempts. Please try again after 15 minutes.'));
  },
});

const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, 'Too many upload attempts. Please try again after 15 minutes.'));
  },
});

module.exports = {
  apiRateLimiter,
  otpRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
};

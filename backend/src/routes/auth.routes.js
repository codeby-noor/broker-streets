const express = require('express');
const {
  register,
  sendOtp,
  verifyOtp,
  getMe,
  refreshAccessToken,
} = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const authenticateToken = require('../middleware/auth.middleware');
const { otpRateLimiter, authRateLimiter } = require('../middleware/rateLimiter.middleware');
const { registerSchema, sendOtpSchema, verifyOtpSchema, refreshTokenSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/send-otp', otpRateLimiter, validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), verifyOtp);
router.get('/me', authenticateToken, getMe);
router.post('/refresh-token', validate(refreshTokenSchema), refreshAccessToken);

module.exports = router;

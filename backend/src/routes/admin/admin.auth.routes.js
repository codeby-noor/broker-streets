const express = require('express');
const adminAuthController = require('../../controllers/admin/admin.auth.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const { authRateLimiter } = require('../../middleware/rateLimiter.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} = require('../../validators/auth.validator');

const router = express.Router();

router.post('/send-otp', authRateLimiter, validate(sendOtpSchema), adminAuthController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), adminAuthController.verifyOtp);
router.post('/refresh-token', validate(refreshTokenSchema), adminAuthController.refreshAccessToken);
router.post('/logout', authenticateToken, adminMiddleware, adminAuthController.logout);

module.exports = router;

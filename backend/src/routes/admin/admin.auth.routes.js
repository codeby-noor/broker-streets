const express = require('express');
const { adminLogin, adminLogout } = require('../../controllers/admin/admin.auth.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const { authRateLimiter } = require('../../middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/login', authRateLimiter, adminLogin);
router.post('/logout', authenticateToken, adminMiddleware, adminLogout);

module.exports = router;

const express = require('express');
const adminDashboardController = require('../../controllers/admin/admin.dashboard.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);

router.get('/stats', adminDashboardController.getDashboardStats);

module.exports = router;

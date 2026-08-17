const express = require('express');
const adminActivityController = require('../../controllers/admin/admin.activity.controller');
const authenticateToken = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');
const superAdminMiddleware = require('../../middleware/superAdmin.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(adminMiddleware);
router.use(superAdminMiddleware);

router.get('/', adminActivityController.getAdminActivity);

module.exports = router;

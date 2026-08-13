// Item 6: Notification Routes
const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authenticateToken = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { idParamSchema } = require('../validators/notification.validator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', validate({ params: idParamSchema }), notificationController.markAsRead);
router.delete('/', notificationController.clearAllNotifications);
router.delete('/:id', validate({ params: idParamSchema }), notificationController.deleteNotification);

module.exports = router;

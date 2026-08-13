// Item 6: Notification Controller
const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../utils/constants');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getNotifications(req.user._id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, notifications, 'Notifications retrieved successfully')
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, notification, 'Notification marked as read')
  );
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result, 'All notifications marked as read')
  );
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

const clearAllNotifications = asyncHandler(async (req, res) => {
  await notificationService.clearAllNotifications(req.user._id);
  return res.status(HTTP_STATUS.NO_CONTENT).send();
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};

// Item 6: Notification Service
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

class NotificationService {
  /**
   * Internal helper to create a notification doc
   */
  async createNotification({ userId = null, type, message, category = 'general' }) {
    try {
      const notification = new Notification({
        userId,
        type,
        message,
        category,
      });
      return await notification.save();
    } catch (error) {
      console.error('Failed to create notification:', error.message);
      return null;
    }
  }

  /**
   * Get notifications for current user (including global notifications)
   */
  async getNotifications(userId) {
    return await Notification.find({
      $or: [{ userId }, { userId: null }],
    }).sort({ createdAt: -1 });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(id, userId) {
    // Note: True per-user read-state on global notifications (userId: null) would need a separate read-receipt model, which is out of scope for now.
    const notification = await Notification.findOne({
      _id: id,
      userId,
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found');
    }

    notification.read = true;
    await notification.save();
    return notification;
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(userId) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return { success: true };
  }

  /**
   * Delete single notification for current user
   */
  async deleteNotification(id, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found');
    }

    return true;
  }

  /**
   * Clear all notifications for current user
   */
  async clearAllNotifications(userId) {
    await Notification.deleteMany({ userId });
    return true;
  }
}

const notificationServiceInstance = new NotificationService();

module.exports = notificationServiceInstance;

const Notification = require('../models/notification.model');
const pino = require('pino');

const logger = pino();

class NotificationRepository {
  async create(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      logger.debug(`Notification created: ${notification._id}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Notification.findById(id);
    } catch (error) {
      logger.error(`Error finding notification ${id}:`, error.message);
      throw error;
    }
  }

  async findByUserId(userId, filters = {}) {
    try {
      const query = { userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.type) {
        query.type = filters.type;
      }

      const skip = filters.skip || 0;
      const limit = filters.limit || 20;

      const total = await Notification.countDocuments(query);
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return { notifications, total };
    } catch (error) {
      logger.error(`Error finding notifications for user ${userId}:`, error.message);
      throw error;
    }
  }

  async updateStatus(id, status) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        id,
        { status, sentAt: new Date() },
        { new: true }
      );
      return notification;
    } catch (error) {
      logger.error(`Error updating notification ${id}:`, error.message);
      throw error;
    }
  }

  async markAsRead(id) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        id,
        { status: 'read', readAt: new Date() },
        { new: true }
      );
      return notification;
    } catch (error) {
      logger.error(`Error marking notification ${id} as read:`, error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      await Notification.findByIdAndDelete(id);
      logger.debug(`Notification deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting notification ${id}:`, error.message);
      throw error;
    }
  }

  async findByRelatedId(relatedId, relatedType) {
    try {
      return await Notification.find({ relatedId, relatedType });
    } catch (error) {
      logger.error(`Error finding notifications for ${relatedType} ${relatedId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new NotificationRepository();

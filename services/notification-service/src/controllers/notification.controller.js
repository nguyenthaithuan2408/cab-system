const notificationService = require('../services/notification.service');
const pino = require('pino');

const logger = pino();

class NotificationController {
  async send(req, res, next) {
    try {
      const { userId, title, message, type, channel, metadata, relatedId, relatedType } = req.body;

      // Validation
      if (!userId || !message) {
        return res.status(400).json({
          success: false,
          error: 'userId and message are required',
        });
      }

      const notification = await notificationService.sendNotification({
        userId,
        title,
        message,
        type,
        channel,
        metadata,
        relatedId,
        relatedType,
      });

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error('Error in send controller:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, type, skip = 0, limit = 20 } = req.query;

      const result = await notificationService.getNotificationsByUser(userId, {
        status,
        type,
        skip: Number(skip),
        limit: Number(limit),
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: {
          skip: Number(skip),
          limit: Number(limit),
          total: result.total,
        },
      });
    } catch (error) {
      logger.error('Error in getByUser controller:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;

      const notification = await notificationService.markNotificationAsRead(notificationId);

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error('Error in markAsRead controller:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async delete(req, res, next) {
    try {
      const { notificationId } = req.params;

      await notificationService.deleteNotification(notificationId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      logger.error('Error in delete controller:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async health(req, res) {
    res.status(200).json({
      success: true,
      message: 'Notification Service is running',
      timestamp: new Date(),
    });
  }
}

module.exports = new NotificationController();

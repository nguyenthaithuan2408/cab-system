const notificationRepository = require('../repositories/notification.repository');
const notificationProducer = require('../events/notification.producer');
const pino = require('pino');

const logger = pino();

class NotificationService {
  async sendNotification(notificationData) {
    try {
      // Validate data
      if (!notificationData.userId || !notificationData.message) {
        throw new Error('userId and message are required');
      }

      // Create notification in DB
      const notification = await notificationRepository.create({
        userId: notificationData.userId,
        title: notificationData.title || 'Notification',
        message: notificationData.message,
        type: notificationData.type || 'alert',
        channel: notificationData.channel || 'in-app',
        metadata: notificationData.metadata || {},
        relatedId: notificationData.relatedId,
        relatedType: notificationData.relatedType,
      });

      // Emit event to other services
      await notificationProducer.sendNotificationEvent({
        notificationId: notification._id.toString(),
        userId: notification.userId,
        type: notification.type,
        channel: notification.channel,
        title: notification.title,
        message: notification.message,
        timestamp: new Date(),
      });

      logger.info(`Notification sent to user ${notification.userId}: ${notification._id}`);
      return notification;
    } catch (error) {
      logger.error('Error sending notification:', error.message);
      throw error;
    }
  }

  async getNotificationsByUser(userId, filters = {}) {
    try {
      const result = await notificationRepository.findByUserId(userId, filters);
      return result;
    } catch (error) {
      logger.error(`Error fetching notifications for user ${userId}:`, error.message);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const notification = await notificationRepository.markAsRead(notificationId);
      return notification;
    } catch (error) {
      logger.error(`Error marking notification ${notificationId} as read:`, error.message);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      await notificationRepository.delete(notificationId);
      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error(`Error deleting notification ${notificationId}:`, error.message);
      throw error;
    }
  }

  async handleBookingEvent(event) {
    try {
      logger.info('Processing booking event:', event.type);
      
      let title = '';
      let message = '';

      switch (event.type) {
        case 'booking.created':
          title = 'Booking Confirmed';
          message = `Your booking #${event.bookingId} has been confirmed`;
          break;
        case 'booking.cancelled':
          title = 'Booking Cancelled';
          message = `Your booking #${event.bookingId} has been cancelled`;
          break;
        default:
          return;
      }

      await this.sendNotification({
        userId: event.userId,
        title,
        message,
        type: 'booking',
        channel: 'in-app',
        relatedId: event.bookingId,
        relatedType: 'booking',
        metadata: { bookingId: event.bookingId },
      });
    } catch (error) {
      logger.error('Error handling booking event:', error.message);
    }
  }

  async handleRideEvent(event) {
    try {
      logger.info('Processing ride event:', event.type);

      let title = '';
      let message = '';

      switch (event.type) {
        case 'ride.started':
          title = 'Ride Started';
          message = `Your ride #${event.rideId} has started`;
          break;
        case 'ride.completed':
          title = 'Ride Completed';
          message = `Your ride #${event.rideId} has been completed`;
          break;
        default:
          return;
      }

      await this.sendNotification({
        userId: event.userId,
        title,
        message,
        type: 'ride',
        channel: 'in-app',
        relatedId: event.rideId,
        relatedType: 'ride',
        metadata: { rideId: event.rideId },
      });
    } catch (error) {
      logger.error('Error handling ride event:', error.message);
    }
  }

  async handlePaymentEvent(event) {
    try {
      logger.info('Processing payment event:', event.type);

      let title = '';
      let message = '';

      switch (event.type) {
        case 'payment.completed':
          title = 'Payment Successful';
          message = `Payment of ${event.amount} has been completed`;
          break;
        case 'payment.failed':
          title = 'Payment Failed';
          message = `Payment failed. Please try again`;
          break;
        default:
          return;
      }

      await this.sendNotification({
        userId: event.userId,
        title,
        message,
        type: 'payment',
        channel: 'in-app',
        relatedId: event.paymentId,
        relatedType: 'payment',
        metadata: { paymentId: event.paymentId, amount: event.amount },
      });
    } catch (error) {
      logger.error('Error handling payment event:', error.message);
    }
  }
}

module.exports = new NotificationService();

const { Kafka } = require('kafkajs');
const pino = require('pino');

const logger = pino();

const BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'notification-service';

const TOPICS = {
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_READ: 'notification.read',
};

class NotificationProducer {
  constructor() {
    this.kafka = new Kafka({
      clientId: CLIENT_ID,
      brokers: BROKERS,
      retry: {
        retries: 5,
        minTimeout: 1000,
        maxTimeout: 30000,
      },
    });
    this.producer = this.kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('✅ Kafka producer connected');
    } catch (error) {
      logger.error('❌ Kafka producer connection error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('✅ Kafka producer disconnected');
      }
    } catch (error) {
      logger.error('❌ Kafka producer disconnection error:', error.message);
    }
  }

  async sendNotificationEvent(event) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.producer.send({
        topic: TOPICS.NOTIFICATION_SENT,
        messages: [
          {
            key: event.userId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });

      logger.debug(`Event sent to ${TOPICS.NOTIFICATION_SENT}:`, event);
    } catch (error) {
      logger.error('Error sending notification event:', error.message);
      throw error;
    }
  }

  async sendReadEvent(notificationId, userId) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.producer.send({
        topic: TOPICS.NOTIFICATION_READ,
        messages: [
          {
            key: userId,
            value: JSON.stringify({
              notificationId,
              userId,
              readAt: new Date(),
            }),
          },
        ],
      });

      logger.debug(`Read event sent for notification ${notificationId}`);
    } catch (error) {
      logger.error('Error sending read event:', error.message);
      throw error;
    }
  }
}

module.exports = new NotificationProducer();
module.exports.TOPICS = TOPICS;

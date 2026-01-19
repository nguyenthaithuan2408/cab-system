const { Kafka } = require('kafkajs');
const pino = require('pino');
const notificationService = require('../services/notification.service');

const logger = pino();

const BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'notification-service';
const GROUP_ID = process.env.KAFKA_GROUP_ID || 'notification-group';

const TOPICS = {
  BOOKING_EVENTS: 'booking.events',
  RIDE_EVENTS: 'ride.events',
  PAYMENT_EVENTS: 'payment.events',
};

class NotificationConsumer {
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
    this.consumer = this.kafka.consumer({ groupId: GROUP_ID });
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      logger.info('✅ Kafka consumer connected');
    } catch (error) {
      logger.error('❌ Kafka consumer connection error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await this.consumer.disconnect();
        this.isConnected = false;
        logger.info('✅ Kafka consumer disconnected');
      }
    } catch (error) {
      logger.error('❌ Kafka consumer disconnection error:', error.message);
    }
  }

  async subscribe() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Subscribe to topics
      await this.consumer.subscribe({
        topics: [
          TOPICS.BOOKING_EVENTS,
          TOPICS.RIDE_EVENTS,
          TOPICS.PAYMENT_EVENTS,
        ],
        fromBeginning: false,
      });

      logger.info('✅ Subscribed to topics:', Object.values(TOPICS));

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value?.toString() || '{}');
            logger.debug(`Event received from ${topic}:`, event);

            switch (topic) {
              case TOPICS.BOOKING_EVENTS:
                await notificationService.handleBookingEvent(event);
                break;
              case TOPICS.RIDE_EVENTS:
                await notificationService.handleRideEvent(event);
                break;
              case TOPICS.PAYMENT_EVENTS:
                await notificationService.handlePaymentEvent(event);
                break;
            }
          } catch (error) {
            logger.error('Error processing message:', error.message);
          }
        },
      });
    } catch (error) {
      logger.error('Error subscribing to topics:', error.message);
      throw error;
    }
  }
}

module.exports = new NotificationConsumer();
module.exports.TOPICS = TOPICS;

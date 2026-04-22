'use strict';
const { Kafka, logLevel } = require('kafkajs');
const env = require('./env');

/**
 * KafkaJS Configuration
 * Test Case TC105: Service connect Kafka
 * Test Case TC25: Event ride_requested được publish/consume
 */

let kafkaInstance = null;

/**
 * Tạo Kafka instance (singleton)
 */
function getKafka() {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: env.KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 300,
        retries: 10,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });
  }
  return kafkaInstance;
}

/**
 * Kafka Topics được sử dụng trong ride-service
 */
const TOPICS = {
  // Topics mà ride-service consume (lắng nghe)
  RIDE_EVENTS: 'ride_events',       // ride.requested từ booking-service
  BOOKING_EVENTS: 'booking_events', // booking events

  // Topics mà ride-service publish
  RIDE_STATUS_EVENTS: 'ride_status_events', // ride.started, ride.completed, etc.
  PAYMENT_EVENTS: 'payment_events',         // yêu cầu thanh toán sau khi hoàn thành
  NOTIFICATION_EVENTS: 'notification_events',
};

/**
 * Event types
 */
const EVENT_TYPES = {
  // Consumed from booking-service
  RIDE_REQUESTED: 'ride.requested',
  RIDE_ACCEPTED: 'ride.accepted',
  RIDE_CANCELLED: 'ride.cancelled',

  // Published by ride-service
  RIDE_STARTED: 'ride.started',
  RIDE_COMPLETED: 'ride.completed',
  RIDE_STATUS_CHANGED: 'ride.status_changed',
  PAYMENT_REQUESTED: 'payment.requested',
};

module.exports = { getKafka, TOPICS, EVENT_TYPES };

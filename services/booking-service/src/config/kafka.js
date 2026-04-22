'use strict';
const { Kafka, logLevel } = require('kafkajs');
const env = require('./env');

/**
 * KafkaJS Configuration
 * Test Case TC105: Service connect Kafka
 * Test Case TC25: Event ride_requested được publish lên Kafka
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
 * Kafka Topics được sử dụng trong booking-service
 */
const TOPICS = {
  // Topics mà booking-service publish
  RIDE_EVENTS: 'ride_events',
  BOOKING_EVENTS: 'booking_events',

  // Topics mà booking-service consume
  DRIVER_EVENTS: 'driver_events',
  PAYMENT_EVENTS: 'payment_events',
};

/**
 * Event types
 */
const EVENT_TYPES = {
  // Published
  RIDE_REQUESTED: 'ride.requested',
  RIDE_ACCEPTED: 'ride.accepted',
  RIDE_CANCELLED: 'ride.cancelled',
  BOOKING_CREATED: 'booking.created',
  BOOKING_UPDATED: 'booking.updated',

  // Consumed
  DRIVER_ASSIGNED: 'driver.assigned',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
};

module.exports = { getKafka, TOPICS, EVENT_TYPES };

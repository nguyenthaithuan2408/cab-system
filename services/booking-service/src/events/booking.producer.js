'use strict';
const { getKafka, TOPICS, EVENT_TYPES } = require('../config/kafka');
const logger = require('../utils/logger');

/**
 * Kafka Producer - Publish booking events
 * Test Case TC25: Event ride_requested được publish lên Kafka
 * Test Case TC27: Event ride_accepted được publish
 * Test Case TC38: Outbox pattern - DB commit + Kafka event đồng bộ
 * Test Case TC105: Service connect Kafka thành công
 */

let producer = null;
let isConnected = false;

/**
 * Khởi tạo và kết nối producer
 */
async function connectProducer() {
  const kafka = getKafka();
  producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
  });

  await producer.connect();
  isConnected = true;
  logger.info('Kafka producer connected');
}

/**
 * Publish một event lên Kafka
 * @param {string} topic - Kafka topic
 * @param {string} eventType - Loại event
 * @param {object} payload - Dữ liệu event
 * @param {string} key - Kafka message key (thường là booking_id để đảm bảo ordering)
 */
async function publishEvent(topic, eventType, payload, key = null) {
  if (!isConnected || !producer) {
    logger.warn('Kafka producer not connected, skipping event publish', { eventType });
    return false;
  }

  const message = {
    event_type: eventType,
    service: 'booking-service',
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: key ? String(key) : null,
          value: JSON.stringify(message),
          headers: {
            'event-type': eventType,
            'source-service': 'booking-service',
            'content-type': 'application/json',
          },
        },
      ],
    });

    logger.info('Kafka event published', {
      topic,
      event_type: eventType,
      key,
    });

    return true;
  } catch (err) {
    logger.error('Failed to publish Kafka event', {
      topic,
      event_type: eventType,
      error: err.message,
    });
    // KHÔNG throw - event failure không nên block HTTP response
    // Dùng Outbox pattern trong production để đảm bảo at-least-once delivery
    return false;
  }
}

/**
 * Publish event: ride.requested
 * Khi user tạo booking mới
 * Test Case TC25: Kafka event ride_requested được publish
 */
async function publishRideRequested(booking) {
  return publishEvent(
    TOPICS.RIDE_EVENTS,
    EVENT_TYPES.RIDE_REQUESTED,
    {
      booking_id: booking.id,
      user_id: booking.user_id,
      pickup: {
        lat: parseFloat(booking.pickup_lat),
        lng: parseFloat(booking.pickup_lng),
        address: booking.pickup_address,
      },
      drop: {
        lat: parseFloat(booking.drop_lat),
        lng: parseFloat(booking.drop_lng),
        address: booking.drop_address,
      },
      distance_km: parseFloat(booking.distance_km),
      estimated_price: booking.estimated_price ? parseFloat(booking.estimated_price) : null,
      eta_minutes: booking.eta_minutes,
      payment_method: booking.payment_method,
      status: booking.status,
      created_at: booking.created_at,
    },
    booking.id
  );
}

/**
 * Publish event: ride.accepted
 * Khi driver accept booking
 * Test Case TC27: Event ride_accepted được publish
 */
async function publishRideAccepted(booking) {
  return publishEvent(
    TOPICS.RIDE_EVENTS,
    EVENT_TYPES.RIDE_ACCEPTED,
    {
      booking_id: booking.id,
      user_id: booking.user_id,
      driver_id: booking.driver_id,
      status: booking.status,
      accepted_at: booking.accepted_at,
    },
    booking.id
  );
}

/**
 * Publish event: ride.cancelled
 * Khi booking bị hủy
 */
async function publishRideCancelled(booking) {
  return publishEvent(
    TOPICS.RIDE_EVENTS,
    EVENT_TYPES.RIDE_CANCELLED,
    {
      booking_id: booking.id,
      user_id: booking.user_id,
      driver_id: booking.driver_id || null,
      cancel_reason: booking.cancel_reason,
      status: booking.status,
      cancelled_at: booking.cancelled_at,
    },
    booking.id
  );
}

/**
 * Đóng producer khi service shutdown
 */
async function disconnectProducer() {
  if (producer && isConnected) {
    await producer.disconnect();
    isConnected = false;
    logger.info('Kafka producer disconnected');
  }
}

module.exports = {
  connectProducer,
  disconnectProducer,
  publishRideRequested,
  publishRideAccepted,
  publishRideCancelled,
  publishEvent,
};

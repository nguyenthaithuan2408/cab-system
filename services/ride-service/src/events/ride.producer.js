'use strict';
const { getKafka, TOPICS, EVENT_TYPES } = require('../config/kafka');
const logger = require('../utils/logger');

/**
 * Kafka Producer - Publish ride status events
 *
 * Test Case TC25: Event ride_requested được publish lên Kafka
 * Test Case TC38: Outbox pattern - DB commit + Kafka event đồng bộ
 * Test Case TC105: Service connect Kafka thành công
 *
 * Pattern: fire-and-forget với silent catch để không crash HTTP server
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
 * Publish một event lên Kafka (internal helper)
 * Pattern: fire-and-forget - KHÔNG throw lỗi, không làm crash HTTP flow
 *
 * @param {string} topic - Kafka topic
 * @param {string} eventType - Loại event
 * @param {object} payload - Dữ liệu event
 * @param {string} key - Kafka message key (ride_id để đảm bảo ordering)
 */
async function publishEvent(topic, eventType, payload, key = null) {
  if (!isConnected || !producer) {
    logger.warn('Kafka producer not connected, skipping event publish', { eventType });
    return false;
  }

  const message = {
    event_type: eventType,
    service: 'ride-service',
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
            'source-service': 'ride-service',
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
    // KHÔNG throw - event failure không nên block HTTP response
    // Dùng Outbox pattern trong production để đảm bảo at-least-once delivery
    logger.error('Failed to publish Kafka event', {
      topic,
      event_type: eventType,
      error: err.message,
    });
    return false;
  }
}

/**
 * Publish event: ride.started
 * Khi driver bắt đầu chuyến đi (đã đón khách)
 * Test Case TC25: Kafka event được publish đúng topic
 */
async function publishRideStarted(ride) {
  return publishEvent(
    TOPICS.RIDE_STATUS_EVENTS,
    EVENT_TYPES.RIDE_STARTED,
    {
      ride_id: ride.id,
      booking_id: ride.booking_id,
      user_id: ride.user_id,
      driver_id: ride.driver_id,
      status: ride.status,
      started_at: ride.started_at,
      pickup: {
        lat: parseFloat(ride.pickup_lat),
        lng: parseFloat(ride.pickup_lng),
        address: ride.pickup_address,
      },
      drop: {
        lat: parseFloat(ride.drop_lat),
        lng: parseFloat(ride.drop_lng),
        address: ride.drop_address,
      },
    },
    ride.id
  );
}

/**
 * Publish event: ride.completed
 * Khi chuyến đi kết thúc tại điểm đích
 * Sau đó Notification Service và Payment Service sẽ consume
 */
async function publishRideCompleted(ride) {
  return publishEvent(
    TOPICS.RIDE_STATUS_EVENTS,
    EVENT_TYPES.RIDE_COMPLETED,
    {
      ride_id: ride.id,
      booking_id: ride.booking_id,
      user_id: ride.user_id,
      driver_id: ride.driver_id,
      status: ride.status,
      final_price: ride.final_price ? parseFloat(ride.final_price) : null,
      payment_method: ride.payment_method,
      completed_at: ride.completed_at,
    },
    ride.id
  );
}

/**
 * Publish event: ride.status_changed
 * Mỗi khi trạng thái thay đổi - Notification Service lắng nghe
 * Test Case TC25: Topic đúng format, payload đúng format
 */
async function publishRideStatusChanged(ride, previousStatus) {
  return publishEvent(
    TOPICS.RIDE_STATUS_EVENTS,
    EVENT_TYPES.RIDE_STATUS_CHANGED,
    {
      ride_id: ride.id,
      booking_id: ride.booking_id,
      user_id: ride.user_id,
      driver_id: ride.driver_id,
      previous_status: previousStatus,
      new_status: ride.status,
      updated_at: ride.updated_at,
    },
    ride.id
  );
}

/**
 * Publish event: payment.requested
 * Yêu cầu Payment Service xử lý thanh toán sau khi hoàn thành
 * Test Case TC24: Booking → Payment → Notification flow
 */
async function publishPaymentRequested(ride) {
  return publishEvent(
    TOPICS.PAYMENT_EVENTS,
    EVENT_TYPES.PAYMENT_REQUESTED,
    {
      ride_id: ride.id,
      booking_id: ride.booking_id,
      user_id: ride.user_id,
      driver_id: ride.driver_id,
      amount: ride.final_price ? parseFloat(ride.final_price) : null,
      payment_method: ride.payment_method,
      completed_at: ride.completed_at,
    },
    ride.id
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
  publishRideStarted,
  publishRideCompleted,
  publishRideStatusChanged,
  publishPaymentRequested,
  publishEvent,
};

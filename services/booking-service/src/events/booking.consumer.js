'use strict';
const { getKafka, TOPICS, EVENT_TYPES } = require('../config/kafka');
const logger = require('../utils/logger');

/**
 * Kafka Consumer - Lắng nghe events từ các services khác
 * Test Case TC25: Consume driver.assigned event để cập nhật booking
 */

let consumer = null;
let isRunning = false;

// Dependency injection để tránh circular
let bookingServiceRef = null;

function setBookingService(service) {
  bookingServiceRef = service;
}

/**
 * Khởi động consumer và subscribe topics
 */
async function startConsumer() {
  const kafka = getKafka();
  const env = require('../config/env');

  consumer = kafka.consumer({
    groupId: env.KAFKA_GROUP_ID,
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  await consumer.connect();
  logger.info('Kafka consumer connected');

  // Subscribe các topic cần lắng nghe
  await consumer.subscribe({
    topics: [TOPICS.DRIVER_EVENTS, TOPICS.PAYMENT_EVENTS],
    fromBeginning: false,
  });

  isRunning = true;

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const raw = message.value?.toString();
        if (!raw) return;

        const event = JSON.parse(raw);
        const eventType = event.event_type || message.headers?.['event-type']?.toString();

        logger.info('Kafka event received', {
          topic,
          partition,
          event_type: eventType,
          offset: message.offset,
        });

        await handleEvent(topic, eventType, event.payload || event);
      } catch (err) {
        logger.error('Error processing Kafka message', {
          topic,
          partition,
          offset: message.offset,
          error: err.message,
        });
        // Không throw - tránh consumer crash. Dead Letter Queue trong production.
      }
    },
  });
}

/**
 * Router xử lý từng loại event
 */
async function handleEvent(topic, eventType, payload) {
  if (!bookingServiceRef) {
    logger.warn('BookingService not injected, skipping event', { eventType });
    return;
  }

  switch (eventType) {
    case EVENT_TYPES.DRIVER_ASSIGNED:
      await handleDriverAssigned(payload);
      break;

    case EVENT_TYPES.PAYMENT_SUCCESS:
      await handlePaymentSuccess(payload);
      break;

    case EVENT_TYPES.PAYMENT_FAILED:
      await handlePaymentFailed(payload);
      break;

    default:
      logger.debug('Unhandled event type, skipping', { eventType, topic });
  }
}

/**
 * Xử lý khi driver được assign
 * Driver Service publish event này sau khi tìm được driver
 */
async function handleDriverAssigned(payload) {
  const { booking_id, driver_id } = payload;
  if (!booking_id || !driver_id) {
    logger.warn('driver.assigned event missing fields', payload);
    return;
  }

  try {
    await bookingServiceRef.acceptBooking(booking_id, driver_id);
    logger.info('Booking updated after driver assigned', { booking_id, driver_id });
  } catch (err) {
    logger.error('Failed to update booking for driver.assigned', {
      booking_id,
      driver_id,
      error: err.message,
    });
  }
}

/**
 * Xử lý khi payment thành công
 * Test Case TC33: Payment success → PAID
 */
async function handlePaymentSuccess(payload) {
  const { booking_id } = payload;
  if (!booking_id) return;

  try {
    await bookingServiceRef.markAsPaid(booking_id);
    logger.info('Booking marked as PAID', { booking_id });
  } catch (err) {
    logger.error('Failed to mark booking as PAID', {
      booking_id,
      error: err.message,
    });
  }
}

/**
 * Xử lý khi payment thất bại
 * Test Case TC33: Payment fail → CANCELLED (Saga compensation)
 */
async function handlePaymentFailed(payload) {
  const { booking_id, reason } = payload;
  if (!booking_id) return;

  try {
    await bookingServiceRef.cancelBooking(booking_id, null, reason || 'Payment failed');
    logger.info('Booking cancelled due to payment failure', { booking_id });
  } catch (err) {
    logger.error('Failed to cancel booking on payment failure', {
      booking_id,
      error: err.message,
    });
  }
}

/**
 * Dừng consumer khi service shutdown
 */
async function stopConsumer() {
  if (consumer && isRunning) {
    isRunning = false;
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  }
}

module.exports = {
  startConsumer,
  stopConsumer,
  setBookingService,
};

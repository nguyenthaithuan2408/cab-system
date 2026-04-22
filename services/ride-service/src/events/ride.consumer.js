'use strict';
const { getKafka, TOPICS, EVENT_TYPES } = require('../config/kafka');
const logger = require('../utils/logger');

/**
 * Kafka Consumer - Lắng nghe events từ booking-service và driver-service
 *
 * Consume:
 * - ride.requested  → Tạo ride record mới trong DB
 * - ride.accepted   → Cập nhật driver_id và status ASSIGNED
 * - ride.cancelled  → Cập nhật status CANCELLED (Saga compensation)
 *
 * Test Case TC25: ride.requested được consume đúng
 * Test Case TC27: Booking update trạng thái ACCEPTED
 */

let consumer = null;
let isRunning = false;

// Dependency injection để tránh circular dependency
let rideServiceRef = null;

function setRideService(service) {
  rideServiceRef = service;
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
    topics: [TOPICS.RIDE_EVENTS],
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
          stack: err.stack,
        });
        // Không throw - tránh consumer crash
        // Dead Letter Queue (DLQ) trong production để replay messages lỗi
      }
    },
  });
}

/**
 * Router xử lý từng loại event từ Kafka
 */
async function handleEvent(topic, eventType, payload) {
  if (!rideServiceRef) {
    logger.warn('RideService not injected, skipping event', { eventType });
    return;
  }

  switch (eventType) {
    // ======= Events từ booking-service =======
    case EVENT_TYPES.RIDE_REQUESTED:
      // Booking được tạo → Tạo ride record và bắt đầu matching
      await handleRideRequested(payload);
      break;

    case EVENT_TYPES.RIDE_ACCEPTED:
      // Driver đã accept booking → Cập nhật driver_id vào ride
      await handleRideAccepted(payload);
      break;

    case EVENT_TYPES.RIDE_CANCELLED:
      // Booking bị hủy → Hủy ride (Saga compensation)
      await handleRideCancelled(payload);
      break;

    default:
      logger.debug('Unhandled event type, skipping', { eventType, topic });
  }
}

/**
 * Xử lý khi booking mới được tạo (ride.requested)
 * Test Case TC25: Kafka event ride_requested được consume → tạo ride
 * Test Case TC3: Booking tạo thành công → Ride được khởi tạo
 */
async function handleRideRequested(payload) {
  const { booking_id, user_id } = payload;

  if (!booking_id || !user_id) {
    logger.warn('ride.requested event missing required fields', { payload });
    return;
  }

  try {
    // Kiểm tra idempotency - không tạo duplicate ride
    const existing = await rideServiceRef.getRideByBookingId(booking_id);
    if (existing) {
      logger.info('Ride already exists for booking, skipping', { booking_id, ride_id: existing.id });
      return;
    }

    const ride = await rideServiceRef.createRideFromBooking(payload);
    logger.info('Ride created from booking event', {
      ride_id: ride.id,
      booking_id,
      user_id,
    });
  } catch (err) {
    logger.error('Failed to create ride from ride.requested event', {
      booking_id,
      user_id,
      error: err.message,
    });
  }
}

/**
 * Xử lý khi driver accept booking (ride.accepted)
 * Test Case TC27: Booking update trạng thái ACCEPTED → Ride cập nhật driver
 */
async function handleRideAccepted(payload) {
  const { booking_id, driver_id } = payload;

  if (!booking_id || !driver_id) {
    logger.warn('ride.accepted event missing required fields', { payload });
    return;
  }

  try {
    await rideServiceRef.assignDriverToRide(booking_id, driver_id);
    logger.info('Driver assigned to ride via event', { booking_id, driver_id });
  } catch (err) {
    logger.error('Failed to assign driver to ride', {
      booking_id,
      driver_id,
      error: err.message,
    });
  }
}

/**
 * Xử lý khi booking bị hủy (ride.cancelled)
 * Saga Compensation Pattern - Test Case TC37
 */
async function handleRideCancelled(payload) {
  const { booking_id, cancel_reason } = payload;

  if (!booking_id) {
    logger.warn('ride.cancelled event missing booking_id', { payload });
    return;
  }

  try {
    await rideServiceRef.cancelRideByBookingId(booking_id, cancel_reason || 'Booking cancelled');
    logger.info('Ride cancelled via Saga compensation', { booking_id });
  } catch (err) {
    logger.error('Failed to cancel ride via event', {
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
  setRideService,
};

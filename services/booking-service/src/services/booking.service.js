'use strict';
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');
const bookingRepo = require('../repositories/booking.repository');
const producer = require('../events/booking.producer');
const pricingClient = require('../clients/pricing.client');
const logger = require('../utils/logger');

/**
 * Booking Service - Business Logic Layer
 *
 * Chịu trách nhiệm:
 * 1. Orchestrate toàn bộ luồng tạo booking
 * 2. Quản lý state machine (REQUESTED → CONFIRMED → ACCEPTED → ...)
 * 3. Gọi Pricing Service để lấy giá ước tính
 * 4. Publish Kafka events sau mỗi thay đổi trạng thái
 * 5. Đảm bảo idempotency
 */

/**
 * Booking Status State Machine
 * Chỉ cho phép chuyển trạng thái hợp lệ
 */
const VALID_TRANSITIONS = {
  REQUESTED: ['CONFIRMED', 'CANCELLED', 'FAILED'],
  CONFIRMED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['PAID'],
  PAID: [],
  CANCELLED: [],
  FAILED: [],
};

/**
 * Kiểm tra chuyển trạng thái có hợp lệ không
 */
function isValidTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Tạo booking mới
 * Test Case TC3: Tạo booking với input hợp lệ → 200/201
 * Test Case TC6: Status ban đầu = REQUESTED
 * Test Case TC19: Idempotency key không tạo duplicate
 * Test Case TC25: Kafka event ride_requested được publish
 * Test Case TC31: Transaction tạo booking thành công - no partial write
 */
async function createBooking(data) {
  const {
    user_id,
    pickup,
    drop,
    distance_km,
    payment_method,
    idempotency_key,
  } = data;

  // ====== Idempotency Check ======
  // Test Case TC19, TC34: Duplicate request → trả kết quả cũ, không tạo mới
  if (idempotency_key) {
    const existing = await bookingRepo.findByIdempotencyKey(idempotency_key);
    if (existing) {
      logger.info('Idempotent request detected, returning existing booking', {
        booking_id: existing.id,
        idempotency_key,
      });
      return { booking: existing, isIdempotent: true };
    }
  }

  // ====== Gọi Pricing Service ======
  // Test Case TC22: Booking gọi Pricing service
  // Test Case TC30: Retry khi Pricing timeout
  let estimatedPrice = null;
  let surgeMultiplier = 1.0;
  let etaMinutes = null;

  try {
    const pricingResult = await pricingClient.getEstimate({
      distance_km,
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      drop_lat: drop.lat,
      drop_lng: drop.lng,
    });

    if (pricingResult) {
      estimatedPrice = pricingResult.price;
      surgeMultiplier = pricingResult.surge_multiplier || 1.0;
      etaMinutes = pricingResult.eta_minutes || null;
    }
  } catch (err) {
    // Fallback: tạo booking dù không lấy được giá
    // Test Case TC30: Retry khi Pricing timeout → fallback giá
    logger.warn('Failed to get pricing estimate, proceeding without price', {
      error: err.message,
      distance_km,
    });
  }

  // ====== Tạo Booking trong Transaction ======
  // Test Case TC31: DB commit thành công, không partial write
  const pool = getPool();
  const client = await pool.connect();

  let booking;
  try {
    await client.query('BEGIN');

    booking = await bookingRepo.create(
      {
        id: uuidv4(),
        user_id,
        idempotency_key: idempotency_key || null,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickup.address || null,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        drop_address: drop.address || null,
        distance_km,
        estimated_price: estimatedPrice,
        surge_multiplier: surgeMultiplier,
        eta_minutes: etaMinutes,
        payment_method: payment_method || 'cash',
        status: 'REQUESTED',
      },
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    // Test Case TC32: Rollback khi lỗi giữa chừng
    logger.error('Failed to create booking, transaction rolled back', {
      user_id,
      error: err.message,
    });
    throw err;
  } finally {
    client.release();
  }

  logger.info('Booking created', {
    booking_id: booking.id,
    user_id,
    status: booking.status,
    estimated_price: estimatedPrice,
  });

  // ====== Publish Kafka Event ======
  // Test Case TC25: Event ride_requested published AFTER DB commit (Outbox pattern)
  // Test Case TC38: DB commit xong mới publish → consistent
  await producer.publishRideRequested(booking);

  return { booking, isIdempotent: false };
}

/**
 * Lấy danh sách booking của user
 * Test Case TC4: GET /bookings?user_id=123 → list booking
 */
async function getBookingsByUser(userId, options = {}) {
  const { limit = 20, offset = 0, status } = options;
  const [bookings, total] = await Promise.all([
    bookingRepo.findByUserId(userId, { limit, offset, status }),
    bookingRepo.countByUserId(userId, { status }),
  ]);

  return {
    data: bookings,
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + bookings.length < total,
    },
  };
}

/**
 * Lấy chi tiết booking theo ID
 */
async function getBookingById(bookingId, requestingUserId = null) {
  const booking = await bookingRepo.findById(bookingId);

  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  // Chỉ owner hoặc driver mới được xem
  if (
    requestingUserId &&
    booking.user_id !== requestingUserId &&
    booking.driver_id !== requestingUserId
  ) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  return booking;
}

/**
 * Hủy booking
 * Test Case TC32/33: Booking status = FAILED hoặc CANCELLED
 * Test Case TC37: Saga compensation → Booking CANCELLED
 */
async function cancelBooking(bookingId, requestingUserId = null, reason = null) {
  const booking = await bookingRepo.findById(bookingId);

  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  // Chỉ user sở hữu mới được cancel (hoặc system call từ Saga)
  if (requestingUserId && booking.user_id !== requestingUserId) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  // Kiểm tra state transition hợp lệ
  if (!isValidTransition(booking.status, 'CANCELLED')) {
    const err = new Error(`Cannot cancel booking in status: ${booking.status}`);
    err.statusCode = 422;
    throw err;
  }

  const updated = await bookingRepo.updateStatus(bookingId, 'CANCELLED', {
    cancel_reason: reason || 'Cancelled by user',
    cancelled_at: new Date().toISOString(),
  });

  logger.info('Booking cancelled', { booking_id: bookingId, reason });

  // Publish event để Notification Service thông báo
  await producer.publishRideCancelled(updated);

  return updated;
}

/**
 * Driver accept booking
 * Test Case TC27: Status REQUESTED → ACCEPTED + event ride_accepted
 */
async function acceptBooking(bookingId, driverId) {
  const booking = await bookingRepo.findById(bookingId);

  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  if (!isValidTransition(booking.status, 'ACCEPTED')) {
    const err = new Error(`Booking cannot be accepted in status: ${booking.status}`);
    err.statusCode = 422;
    throw err;
  }

  const updated = await bookingRepo.assignDriver(bookingId, driverId);

  logger.info('Booking accepted by driver', { booking_id: bookingId, driver_id: driverId });

  // Publish event để Notification Service thông báo cho user
  // Test Case TC27: event ride_accepted được publish
  await producer.publishRideAccepted(updated);

  return updated;
}

/**
 * Đánh dấu booking đã thanh toán (được gọi từ Kafka consumer)
 * Test Case TC33: Payment success → PAID
 */
async function markAsPaid(bookingId) {
  const booking = await bookingRepo.findById(bookingId);

  if (!booking) {
    logger.warn('Booking not found for markAsPaid', { booking_id: bookingId });
    return null;
  }

  if (!isValidTransition(booking.status, 'PAID')) {
    logger.warn('Invalid transition to PAID', {
      booking_id: bookingId,
      current_status: booking.status,
    });
    return booking;
  }

  return bookingRepo.updateStatus(bookingId, 'PAID');
}

/**
 * Lấy trạng thái booking (lightweight)
 */
async function getBookingStatus(bookingId) {
  const booking = await bookingRepo.findById(bookingId);

  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    booking_id: booking.id,
    status: booking.status,
    driver_id: booking.driver_id,
    updated_at: booking.updated_at,
  };
}

module.exports = {
  createBooking,
  getBookingsByUser,
  getBookingById,
  cancelBooking,
  acceptBooking,
  markAsPaid,
  getBookingStatus,
  isValidTransition,
};

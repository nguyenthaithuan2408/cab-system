'use strict';
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/database');
const rideRepo = require('../repositories/ride.repository');
const producer = require('../events/ride.producer');
const { isValidTransition, RIDE_STATUS } = require('../models/ride.model');
const logger = require('../utils/logger');

/**
 * Ride Service - Business Logic Layer
 *
 * Chịu trách nhiệm:
 * 1. Orchestrate vòng đời chuyến đi (ride lifecycle)
 * 2. Quản lý State Machine: CREATED → MATCHING → ASSIGNED → PICKUP → IN_PROGRESS → COMPLETED → PAID
 * 3. Publish Kafka events sau mỗi thay đổi trạng thái
 * 4. Saga compensation khi booking bị hủy
 *
 * Test Case TC3:  Booking tạo thành công → Ride được khởi tạo
 * Test Case TC24: Booking → Payment → Notification end-to-end flow
 * Test Case TC25: ride.requested event được consume và xử lý
 * Test Case TC27: Status ACCEPTED → Driver được assign
 * Test Case TC32: Rollback khi lỗi giữa chừng
 * Test Case TC37: Saga compensation → Ride CANCELLED
 */

// ============================================================
// Ride Lifecycle - Called from Kafka Consumer
// ============================================================

/**
 * Tạo ride record mới từ Kafka event ride.requested
 * Được gọi khi booking-service publish event sau khi booking được tạo thành công
 *
 * Test Case TC25: ride.requested được consume → tạo ride trong DB
 * Test Case TC31: Transaction tạo ride - no partial write
 */
async function createRideFromBooking(bookingPayload) {
  const {
    booking_id,
    user_id,
    pickup,
    drop,
    distance_km,
    estimated_price,
    payment_method,
    eta_minutes,
  } = bookingPayload;

  // Kiểm tra idempotency - không tạo duplicate ride
  const existing = await rideRepo.findByBookingId(booking_id);
  if (existing) {
    logger.info('Ride already exists for booking, skipping', { booking_id, ride_id: existing.id });
    return existing;
  }

  // Transaction để đảm bảo atomic write
  const pool = getPool();
  const client = await pool.connect();

  let ride;
  try {
    await client.query('BEGIN');

    ride = await rideRepo.create(
      {
        id: uuidv4(),
        booking_id,
        user_id,
        driver_id: null,
        pickup_lat: pickup?.lat,
        pickup_lng: pickup?.lng,
        pickup_address: pickup?.address || null,
        drop_lat: drop?.lat,
        drop_lng: drop?.lng,
        drop_address: drop?.address || null,
        distance_km: distance_km || null,
        estimated_price: estimated_price || null,
        payment_method: payment_method || 'cash',
        eta_minutes: eta_minutes || null,
        status: RIDE_STATUS.CREATED,
      },
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to create ride, transaction rolled back', {
      booking_id,
      user_id,
      error: err.message,
    });
    throw err;
  } finally {
    client.release();
  }

  logger.info('Ride created from booking', {
    ride_id: ride.id,
    booking_id,
    user_id,
    status: ride.status,
  });

  // Publish status changed event - AFTER DB commit (Outbox pattern)
  // Test Case TC38: DB commit xong mới publish
  await producer.publishRideStatusChanged(ride, null);

  return ride;
}

/**
 * Assign driver vào ride khi driver accept booking
 * Được gọi từ Kafka consumer khi nhận event ride.accepted từ booking-service
 *
 * Test Case TC27: Driver assign → status ASSIGNED
 */
async function assignDriverToRide(bookingId, driverId) {
  const ride = await rideRepo.findByBookingId(bookingId);

  if (!ride) {
    logger.warn('Ride not found for booking, cannot assign driver', { booking_id: bookingId });
    return null;
  }

  if (!isValidTransition(ride.status, RIDE_STATUS.ASSIGNED)) {
    logger.warn('Invalid transition: cannot assign driver', {
      ride_id: ride.id,
      current_status: ride.status,
      target_status: RIDE_STATUS.ASSIGNED,
    });
    return ride;
  }

  const previousStatus = ride.status;

  const updated = await rideRepo.assignDriver(ride.id, driverId);

  logger.info('Driver assigned to ride', {
    ride_id: ride.id,
    booking_id: bookingId,
    driver_id: driverId,
  });

  // Publish status changed event
  await producer.publishRideStatusChanged(updated, previousStatus);

  return updated;
}

/**
 * Hủy ride theo booking_id (từ Saga compensation)
 * Test Case TC37: Saga compensation - ride bị hủy khi booking cancel
 */
async function cancelRideByBookingId(bookingId, reason = 'Booking cancelled') {
  const ride = await rideRepo.findByBookingId(bookingId);

  if (!ride) {
    logger.warn('Ride not found for cancellation', { booking_id: bookingId });
    return null;
  }

  // Nếu đã ở terminal state thì không cancel nữa
  if ([RIDE_STATUS.PAID, RIDE_STATUS.CANCELLED, RIDE_STATUS.FAILED].includes(ride.status)) {
    logger.info('Ride already in terminal state, skipping cancellation', {
      ride_id: ride.id,
      status: ride.status,
    });
    return ride;
  }

  if (!isValidTransition(ride.status, RIDE_STATUS.CANCELLED)) {
    logger.warn('Invalid transition to CANCELLED', {
      ride_id: ride.id,
      current_status: ride.status,
    });
    // Force cancel trong trường hợp Saga compensation
    const forceCancelled = await rideRepo.updateStatus(ride.id, RIDE_STATUS.CANCELLED, {
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    });
    return forceCancelled;
  }

  const previousStatus = ride.status;

  const updated = await rideRepo.updateStatus(ride.id, RIDE_STATUS.CANCELLED, {
    cancel_reason: reason,
    cancelled_at: new Date().toISOString(),
  });

  logger.info('Ride cancelled via Saga compensation', {
    ride_id: ride.id,
    booking_id: bookingId,
    reason,
  });

  await producer.publishRideStatusChanged(updated, previousStatus);

  return updated;
}

// ============================================================
// Ride Lifecycle - Called from HTTP API (Driver actions)
// ============================================================

/**
 * Driver báo hiệu đang đến điểm đón (ASSIGNED → PICKUP)
 * Driver gọi API này sau khi được assign chuyến
 *
 * Test Case TC5: Driver chuyển trạng thái
 */
async function driverEnRoute(rideId, driverId, driverLocation = null) {
  const ride = await rideRepo.findById(rideId);

  if (!ride) {
    const err = new Error('Ride not found');
    err.statusCode = 404;
    throw err;
  }

  // Chỉ driver được assign mới có quyền thay đổi
  if (ride.driver_id !== driverId) {
    const err = new Error('Access denied: not the assigned driver');
    err.statusCode = 403;
    throw err;
  }

  if (!isValidTransition(ride.status, RIDE_STATUS.PICKUP)) {
    const err = new Error(`Cannot change to PICKUP from status: ${ride.status}`);
    err.statusCode = 422;
    throw err;
  }

  const previousStatus = ride.status;

  const extraFields = { pickup_at: new Date().toISOString() };
  if (driverLocation?.lat) extraFields.driver_pickup_lat = driverLocation.lat;
  if (driverLocation?.lng) extraFields.driver_pickup_lng = driverLocation.lng;

  const updated = await rideRepo.updateStatus(rideId, RIDE_STATUS.PICKUP, extraFields);

  logger.info('Driver en route to pickup', { ride_id: rideId, driver_id: driverId });

  await producer.publishRideStatusChanged(updated, previousStatus);

  return updated;
}

/**
 * Bắt đầu chuyến đi - Driver đã đón khách (PICKUP → IN_PROGRESS)
 * Test Case TC3: Ride tracking sau khi start
 *
 * @param {string} rideId
 * @param {string} driverId - Phải là driver được assign
 * @param {object} driverLocation - optional GPS location
 */
async function startRide(rideId, driverId, driverLocation = null) {
  const ride = await rideRepo.findById(rideId);

  if (!ride) {
    const err = new Error('Ride not found');
    err.statusCode = 404;
    throw err;
  }

  // Chỉ driver được assign mới có quyền start
  if (ride.driver_id !== driverId) {
    const err = new Error('Access denied: not the assigned driver');
    err.statusCode = 403;
    throw err;
  }

  if (!isValidTransition(ride.status, RIDE_STATUS.IN_PROGRESS)) {
    const err = new Error(`Cannot start ride from status: ${ride.status}`);
    err.statusCode = 422;
    throw err;
  }

  const previousStatus = ride.status;

  const updated = await rideRepo.updateStatus(rideId, RIDE_STATUS.IN_PROGRESS, {
    started_at: new Date().toISOString(),
  });

  logger.info('Ride started', {
    ride_id: rideId,
    driver_id: driverId,
    booking_id: ride.booking_id,
  });

  // Publish ride.started event - Notification Service sẽ notify user
  await producer.publishRideStarted(updated);
  await producer.publishRideStatusChanged(updated, previousStatus);

  return updated;
}

/**
 * Hoàn thành chuyến đi - Driver đã đến điểm đích (IN_PROGRESS → COMPLETED)
 * Sau đó trigger payment flow
 *
 * Test Case TC24: Booking → Payment → Notification end-to-end
 * Test Case TC38: DB commit → Kafka event consistent
 *
 * @param {string} rideId
 * @param {string} driverId
 * @param {number} finalPrice - Giá cuối cùng (có thể khác estimated nếu có thay đổi route)
 */
async function completeRide(rideId, driverId, finalPrice = null) {
  const ride = await rideRepo.findById(rideId);

  if (!ride) {
    const err = new Error('Ride not found');
    err.statusCode = 404;
    throw err;
  }

  if (ride.driver_id !== driverId) {
    const err = new Error('Access denied: not the assigned driver');
    err.statusCode = 403;
    throw err;
  }

  if (!isValidTransition(ride.status, RIDE_STATUS.COMPLETED)) {
    const err = new Error(`Cannot complete ride from status: ${ride.status}`);
    err.statusCode = 422;
    throw err;
  }

  const previousStatus = ride.status;

  // Nếu không truyền final_price, dùng estimated_price
  const price = finalPrice || (ride.estimated_price ? parseFloat(ride.estimated_price) : null);

  const updated = await rideRepo.updateStatus(rideId, RIDE_STATUS.COMPLETED, {
    final_price: price,
    completed_at: new Date().toISOString(),
  });

  logger.info('Ride completed', {
    ride_id: rideId,
    driver_id: driverId,
    booking_id: ride.booking_id,
    final_price: price,
  });

  // Publish ride.completed → Notification Service
  await producer.publishRideCompleted(updated);
  await producer.publishRideStatusChanged(updated, previousStatus);

  // Publish payment.requested → Payment Service (Saga choreography)
  // Test Case TC24: Payment được khởi tạo sau khi ride hoàn thành
  await producer.publishPaymentRequested(updated);

  return updated;
}

/**
 * Hủy chuyến đi (từ HTTP API - user hoặc driver hủy)
 * Test Case TC32: Cancel → status CANCELLED
 */
async function cancelRide(rideId, requestingUserId, requestingRole, reason = null) {
  const ride = await rideRepo.findById(rideId);

  if (!ride) {
    const err = new Error('Ride not found');
    err.statusCode = 404;
    throw err;
  }

  // Chỉ user sở hữu hoặc driver được assign mới có quyền cancel
  const isOwner = ride.user_id === requestingUserId;
  const isAssignedDriver = ride.driver_id === requestingUserId;
  const isAdmin = requestingRole === 'admin';

  if (!isOwner && !isAssignedDriver && !isAdmin) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  if (!isValidTransition(ride.status, RIDE_STATUS.CANCELLED)) {
    const err = new Error(`Cannot cancel ride in status: ${ride.status}`);
    err.statusCode = 422;
    throw err;
  }

  const previousStatus = ride.status;

  const updated = await rideRepo.updateStatus(rideId, RIDE_STATUS.CANCELLED, {
    cancel_reason: reason || 'Cancelled by user',
    cancelled_at: new Date().toISOString(),
  });

  logger.info('Ride cancelled via API', {
    ride_id: rideId,
    requesting_user: requestingUserId,
    reason,
  });

  await producer.publishRideStatusChanged(updated, previousStatus);

  return updated;
}

// ============================================================
// Query Methods
// ============================================================

/**
 * Lấy ride theo ID
 * Test Case TC4: Lấy thông tin chi tiết
 */
async function getRideById(rideId, requestingUserId = null) {
  const ride = await rideRepo.findById(rideId);

  if (!ride) {
    const err = new Error('Ride not found');
    err.statusCode = 404;
    throw err;
  }

  // Chỉ user sở hữu hoặc driver mới được xem chi tiết
  if (
    requestingUserId &&
    ride.user_id !== requestingUserId &&
    ride.driver_id !== requestingUserId
  ) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  return ride;
}

/**
 * Lấy ride theo booking_id
 */
async function getRideByBookingId(bookingId) {
  return rideRepo.findByBookingId(bookingId);
}

/**
 * Lấy danh sách rides của user
 * Test Case TC4: GET /rides → list rides
 */
async function getRidesByUser(userId, options = {}) {
  const { limit = 20, offset = 0, status } = options;

  const [rides, total] = await Promise.all([
    rideRepo.findByUserId(userId, { limit, offset, status }),
    rideRepo.countByUserId(userId, { status }),
  ]);

  return {
    data: rides,
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + rides.length < total,
    },
  };
}

/**
 * Lấy danh sách rides của driver
 */
async function getRidesByDriver(driverId, options = {}) {
  const { limit = 20, offset = 0, status } = options;

  const rides = await rideRepo.findByDriverId(driverId, { limit, offset, status });

  return {
    data: rides,
    pagination: {
      total: rides.length,
      limit,
      offset,
      has_more: false,
    },
  };
}

/**
 * Lấy trạng thái ride (lightweight)
 */
async function getRideStatus(rideId) {
  const ride = await rideRepo.findById(rideId);

  if (!ride) {
    const err = new Error('Ride not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    ride_id: ride.id,
    booking_id: ride.booking_id,
    status: ride.status,
    driver_id: ride.driver_id,
    updated_at: ride.updated_at,
  };
}

module.exports = {
  // Kafka-driven
  createRideFromBooking,
  assignDriverToRide,
  cancelRideByBookingId,

  // HTTP API-driven (driver actions)
  driverEnRoute,
  startRide,
  completeRide,
  cancelRide,

  // Query
  getRideById,
  getRideByBookingId,
  getRidesByUser,
  getRidesByDriver,
  getRideStatus,

  // Export for testing
  isValidTransition,
};

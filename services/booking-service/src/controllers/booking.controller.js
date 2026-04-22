'use strict';
const bookingService = require('../services/booking.service');
const logger = require('../utils/logger');

/**
 * Booking Controller - HTTP Request Handlers
 * Chỉ chịu trách nhiệm: parse request, call service, format response
 * Business logic nằm hoàn toàn trong booking.service.js
 */

/**
 * POST /bookings
 * Tạo booking mới
 *
 * Test Case TC3: 200/201 + status REQUESTED + booking_id
 * Test Case TC6: Status ban đầu = REQUESTED, có created_at
 * Test Case TC19: Idempotency key - trả kết quả cũ nếu duplicate
 * Test Case TC25: Kafka event ride_requested được publish
 */
async function createBooking(req, res) {
  try {
    const {
      pickup,
      drop,
      distance_km,
      payment_method,
    } = req.body;

    // Idempotency key từ header (theo RFC)
    const idempotency_key = req.headers['idempotency-key'] || null;

    const user_id = req.user.id;

    const { booking, isIdempotent } = await bookingService.createBooking({
      user_id,
      pickup,
      drop,
      distance_km: parseFloat(distance_km),
      payment_method,
      idempotency_key,
    });

    const statusCode = isIdempotent ? 200 : 201;

    logger.info('Booking created via API', {
      booking_id: booking.id,
      user_id,
      status: booking.status,
      is_idempotent: isIdempotent,
      trace_id: req.traceId,
    });

    return res.status(statusCode).json({
      success: true,
      data: {
        booking_id: booking.id,
        status: booking.status,
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
        surge_multiplier: parseFloat(booking.surge_multiplier),
        eta_minutes: booking.eta_minutes,
        payment_method: booking.payment_method,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      },
      message: isIdempotent ? 'Existing booking returned' : 'Booking created successfully',
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * GET /bookings
 * Lấy danh sách booking của user hiện tại
 *
 * Test Case TC4: GET /bookings?user_id=123 → list booking, có booking_id và status
 */
async function getBookings(req, res) {
  try {
    // user_id lấy từ JWT, không phải từ query để đảm bảo security
    const user_id = req.user.id;
    const {
      limit = 20,
      offset = 0,
      status,
    } = req.query;

    const result = await bookingService.getBookingsByUser(user_id, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
      status,
    });

    return res.status(200).json({
      success: true,
      data: result.data.map(formatBookingListItem),
      pagination: result.pagination,
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * GET /bookings/:id
 * Lấy chi tiết một booking
 */
async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const booking = await bookingService.getBookingById(id, user_id);

    return res.status(200).json({
      success: true,
      data: formatBookingDetail(booking),
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * GET /bookings/:id/status
 * Lấy trạng thái booking (lightweight)
 *
 * Test Case TC4: Có booking_id, status trong response
 */
async function getBookingStatus(req, res) {
  try {
    const { id } = req.params;

    const status = await bookingService.getBookingStatus(id);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * POST /bookings/:id/cancel
 * Hủy booking
 *
 * Test Case TC32/33: Cancel → status CANCELLED
 */
async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.id;

    const booking = await bookingService.cancelBooking(id, user_id, reason);

    logger.info('Booking cancelled via API', {
      booking_id: id,
      user_id,
      trace_id: req.traceId,
    });

    return res.status(200).json({
      success: true,
      data: formatBookingDetail(booking),
      message: 'Booking cancelled successfully',
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * POST /bookings/:id/accept
 * Driver accept booking
 *
 * Test Case TC27: Status REQUESTED → ACCEPTED + event ride_accepted
 */
async function acceptBooking(req, res) {
  try {
    const { id } = req.params;
    const driver_id = req.user.id; // Driver là người đang login

    const booking = await bookingService.acceptBooking(id, driver_id);

    logger.info('Booking accepted via API', {
      booking_id: id,
      driver_id,
      trace_id: req.traceId,
    });

    return res.status(200).json({
      success: true,
      data: formatBookingDetail(booking),
      message: 'Booking accepted successfully',
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

// ====== Helper Functions ======

/**
 * Format booking cho list response (gọn hơn)
 */
function formatBookingListItem(booking) {
  return {
    booking_id: booking.id,
    status: booking.status,
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
    payment_method: booking.payment_method,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
  };
}

/**
 * Format booking cho detail response (đầy đủ)
 */
function formatBookingDetail(booking) {
  return {
    booking_id: booking.id,
    user_id: booking.user_id,
    driver_id: booking.driver_id,
    status: booking.status,
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
    final_price: booking.final_price ? parseFloat(booking.final_price) : null,
    surge_multiplier: parseFloat(booking.surge_multiplier),
    eta_minutes: booking.eta_minutes,
    payment_method: booking.payment_method,
    cancel_reason: booking.cancel_reason,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    accepted_at: booking.accepted_at,
    completed_at: booking.completed_at,
    cancelled_at: booking.cancelled_at,
  };
}

/**
 * Xử lý lỗi thống nhất
 */
function handleError(res, err, traceId) {
  const statusCode = err.statusCode || 500;

  logger.error('Controller error', {
    error: err.message,
    status_code: statusCode,
    trace_id: traceId,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Lỗi duplicate idempotency key từ DB
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Duplicate request detected',
      },
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: getErrorCode(statusCode),
      message: statusCode === 500 ? 'Internal server error' : err.message,
    },
  });
}

function getErrorCode(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    500: 'INTERNAL_ERROR',
  };
  return codes[statusCode] || 'ERROR';
}

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  getBookingStatus,
  cancelBooking,
  acceptBooking,
};

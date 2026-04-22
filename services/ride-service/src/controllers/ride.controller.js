'use strict';
const rideService = require('../services/ride.service');
const { formatRideListItem, formatRideDetail } = require('../models/ride.model');
const logger = require('../utils/logger');

/**
 * Ride Controller - HTTP Request Handlers
 * Chỉ chịu trách nhiệm: parse request, call service, format response
 * Business logic nằm hoàn toàn trong ride.service.js
 *
 * Route → Controller → Service → Repository (luồng chuẩn)
 */

/**
 * GET /rides
 * Lấy danh sách rides của user hiện tại
 * Test Case TC4: Trả về list ride có ride_id, status
 */
async function getRides(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, status } = req.query;

    const result = await rideService.getRidesByUser(userId, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
      status,
    });

    return res.status(200).json({
      success: true,
      data: result.data.map(formatRideListItem),
      pagination: result.pagination,
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * GET /rides/:id
 * Lấy chi tiết một ride
 */
async function getRideById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ride = await rideService.getRideById(id, userId);

    return res.status(200).json({
      success: true,
      data: formatRideDetail(ride),
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * GET /rides/booking/:bookingId
 * Lấy ride theo booking_id
 */
async function getRideByBookingId(req, res) {
  try {
    const { bookingId } = req.params;

    const ride = await rideService.getRideByBookingId(bookingId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Ride not found for this booking',
        },
      });
    }

    // Authorization: chỉ user sở hữu hoặc driver mới xem được
    const userId = req.user.id;
    const userRole = req.user.role;
    if (
      userRole !== 'admin' &&
      ride.user_id !== userId &&
      ride.driver_id !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied' },
      });
    }

    return res.status(200).json({
      success: true,
      data: formatRideDetail(ride),
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * GET /rides/:id/status
 * Lấy trạng thái ride (lightweight - dành cho polling)
 * Test Case TC4: Mỗi item có ride_id, status
 */
async function getRideStatus(req, res) {
  try {
    const { id } = req.params;

    const status = await rideService.getRideStatus(id);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * POST /rides/:id/en-route
 * Driver báo hiệu đang trên đường đến điểm đón (ASSIGNED → PICKUP)
 * Test Case TC5: Driver chuyển trạng thái thành công
 */
async function driverEnRoute(req, res) {
  try {
    const { id } = req.params;
    const driverId = req.user.id;
    const { driver_lat, driver_lng } = req.body;

    const driverLocation = (driver_lat && driver_lng)
      ? { lat: parseFloat(driver_lat), lng: parseFloat(driver_lng) }
      : null;

    const ride = await rideService.driverEnRoute(id, driverId, driverLocation);

    logger.info('Driver en route to pickup', {
      ride_id: id,
      driver_id: driverId,
      trace_id: req.traceId,
    });

    return res.status(200).json({
      success: true,
      data: formatRideDetail(ride),
      message: 'Driver is on the way to pickup',
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * POST /rides/:id/start
 * Driver bắt đầu chuyến đi - đã đón khách (PICKUP → IN_PROGRESS)
 * Test Case TC3: Ride tracking sau khi start
 */
async function startRide(req, res) {
  try {
    const { id } = req.params;
    const driverId = req.user.id;
    const { driver_lat, driver_lng } = req.body;

    const driverLocation = (driver_lat && driver_lng)
      ? { lat: parseFloat(driver_lat), lng: parseFloat(driver_lng) }
      : null;

    const ride = await rideService.startRide(id, driverId, driverLocation);

    logger.info('Ride started via API', {
      ride_id: id,
      driver_id: driverId,
      booking_id: ride.booking_id,
      trace_id: req.traceId,
    });

    return res.status(200).json({
      success: true,
      data: formatRideDetail(ride),
      message: 'Ride started successfully',
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * POST /rides/:id/complete
 * Driver hoàn thành chuyến đi tại điểm đích (IN_PROGRESS → COMPLETED)
 * Test Case TC24: Flow hoàn chỉnh → trigger payment
 */
async function completeRide(req, res) {
  try {
    const { id } = req.params;
    const driverId = req.user.id;
    const { final_price } = req.body;

    const ride = await rideService.completeRide(id, driverId, final_price || null);

    logger.info('Ride completed via API', {
      ride_id: id,
      driver_id: driverId,
      booking_id: ride.booking_id,
      final_price: ride.final_price,
      trace_id: req.traceId,
    });

    return res.status(200).json({
      success: true,
      data: formatRideDetail(ride),
      message: 'Ride completed successfully',
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * POST /rides/:id/cancel
 * Hủy chuyến đi (user hoặc driver có thể hủy)
 * Test Case TC32: Cancel → status CANCELLED
 */
async function cancelRide(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ride = await rideService.cancelRide(id, userId, userRole, reason);

    logger.info('Ride cancelled via API', {
      ride_id: id,
      user_id: userId,
      reason,
      trace_id: req.traceId,
    });

    return res.status(200).json({
      success: true,
      data: formatRideDetail(ride),
      message: 'Ride cancelled successfully',
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

/**
 * GET /rides/driver/my-rides
 * Driver lấy danh sách rides của mình
 */
async function getMyRidesAsDriver(req, res) {
  try {
    const driverId = req.user.id;
    const { limit = 20, offset = 0, status } = req.query;

    const result = await rideService.getRidesByDriver(driverId, {
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      offset: parseInt(offset, 10) || 0,
      status,
    });

    return res.status(200).json({
      success: true,
      data: result.data.map(formatRideListItem),
      pagination: result.pagination,
    });
  } catch (err) {
    return handleError(res, err, req.traceId);
  }
}

// ====== Helper Functions ======

/**
 * Xử lý lỗi thống nhất - trả về format chuẩn theo developer-guideline.md
 */
function handleError(res, err, traceId) {
  const statusCode = err.statusCode || 500;

  logger.error('Controller error', {
    error: err.message,
    status_code: statusCode,
    trace_id: traceId,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

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
  getRides,
  getRideById,
  getRideByBookingId,
  getRideStatus,
  driverEnRoute,
  startRide,
  completeRide,
  cancelRide,
  getMyRidesAsDriver,
};

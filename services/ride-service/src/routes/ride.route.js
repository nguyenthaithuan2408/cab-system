'use strict';
const express = require('express');
const router = express.Router();

const rideController = require('../controllers/ride.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  validateStartRide,
  validateCompleteRide,
  validateUpdateLocation,
  validateCancelRide,
} = require('../middlewares/validate.middleware');

/**
 * Ride Routes
 *
 * Zero Trust: Tất cả routes đều yêu cầu authentication (x-user-id header từ Gateway)
 * Test Case TC91: Request không có token → 401 (enforced by authenticate)
 * Test Case TC95: User role không gọi được driver endpoints
 * Test Case TC96: Driver không truy cập thông tin user khác
 */

// ============================================================
// Customer Routes - Xem thông tin ride
// ============================================================

/**
 * GET /rides
 * Lấy danh sách rides của user hiện tại
 * Test Case TC4: Trả về list với ride_id, status
 */
router.get(
  '/',
  authenticate,
  rideController.getRides
);

/**
 * GET /rides/driver/my-rides
 * Driver lấy danh sách rides của mình
 * Đặt trước /:id để tránh conflict
 * Test Case TC5: Driver xem lịch sử chuyến
 */
router.get(
  '/driver/my-rides',
  authenticate,
  authorize('driver', 'admin'),
  rideController.getMyRidesAsDriver
);

/**
 * GET /rides/booking/:bookingId
 * Lấy ride theo booking_id
 * Đặt trước /:id để tránh conflict
 */
router.get(
  '/booking/:bookingId',
  authenticate,
  rideController.getRideByBookingId
);

/**
 * GET /rides/:id
 * Lấy chi tiết một ride
 */
router.get(
  '/:id',
  authenticate,
  rideController.getRideById
);

/**
 * GET /rides/:id/status
 * Lấy trạng thái ride (lightweight - cho polling)
 * Test Case TC4: Có ride_id, status trong response
 */
router.get(
  '/:id/status',
  authenticate,
  rideController.getRideStatus
);

// ============================================================
// Driver Routes - Thay đổi trạng thái chuyến đi
// ============================================================

/**
 * POST /rides/:id/en-route
 * Driver báo đang đến điểm đón (ASSIGNED → PICKUP)
 * Test Case TC5: Driver chuyển trạng thái thành công
 */
router.post(
  '/:id/en-route',
  authenticate,
  authorize('driver', 'admin'),
  rideController.driverEnRoute
);

/**
 * POST /rides/:id/start
 * Driver bắt đầu chuyến - đã đón khách (PICKUP → IN_PROGRESS)
 * Test Case TC3: Ride tracking sau khi start
 */
router.post(
  '/:id/start',
  authenticate,
  authorize('driver', 'admin'),
  validateStartRide,
  rideController.startRide
);

/**
 * POST /rides/:id/complete
 * Driver hoàn thành chuyến đi (IN_PROGRESS → COMPLETED)
 * Test Case TC24: Flow hoàn chỉnh → trigger payment
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize('driver', 'admin'),
  validateCompleteRide,
  rideController.completeRide
);

/**
 * POST /rides/:id/cancel
 * Hủy chuyến đi (customer hoặc driver)
 * Test Case TC32: Cancel → status CANCELLED
 * Test Case TC37: Saga compensation
 */
router.post(
  '/:id/cancel',
  authenticate,
  validateCancelRide,
  rideController.cancelRide
);

module.exports = router;

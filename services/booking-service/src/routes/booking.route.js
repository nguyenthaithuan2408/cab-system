'use strict';
const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  validateCreateBooking,
  validateCancelBooking,
  validateAcceptBooking,
} = require('../middlewares/validate.middleware');

/**
 * Booking Routes
 *
 * Zero Trust: Tất cả routes đều yêu cầu authentication
 * Test Case TC91: GET /booking không có token → 401 (enforced by authenticate)
 * Test Case TC95: User role không gọi được admin endpoints
 */

// ============================================================
// Public Routes (không cần auth) - chỉ health check
// ============================================================
// Health check được đăng ký trong app.js

// ============================================================
// Protected Routes (yêu cầu JWT)
// ============================================================

/**
 * POST /bookings
 * Tạo booking mới
 * Test Case TC3, TC6, TC11, TC12, TC14, TC19, TC20, TC25
 */
router.post(
  '/',
  authenticate,
  authorize('customer', 'admin'), // Chỉ customer và admin mới được đặt xe
  validateCreateBooking,
  bookingController.createBooking
);

/**
 * GET /bookings
 * Lấy danh sách booking của user hiện tại
 * Test Case TC4
 */
router.get(
  '/',
  authenticate,
  bookingController.getBookings
);

/**
 * GET /bookings/:id
 * Lấy chi tiết một booking
 */
router.get(
  '/:id',
  authenticate,
  bookingController.getBookingById
);

/**
 * GET /bookings/:id/status
 * Lấy trạng thái booking
 * Test Case TC4: Mỗi item có booking_id, status
 */
router.get(
  '/:id/status',
  authenticate,
  bookingController.getBookingStatus
);

/**
 * POST /bookings/:id/cancel
 * Hủy booking
 * Test Case TC32, TC33
 */
router.post(
  '/:id/cancel',
  authenticate,
  validateCancelBooking,
  bookingController.cancelBooking
);

/**
 * POST /bookings/:id/accept
 * Driver accept booking
 * Test Case TC27: Status REQUESTED → ACCEPTED
 */
router.post(
  '/:id/accept',
  authenticate,
  authorize('driver', 'admin'),
  validateAcceptBooking,
  bookingController.acceptBooking
);

module.exports = router;

'use strict';

/**
 * Booking Model - Schema Definition & Constants
 * Định nghĩa cấu trúc dữ liệu và các hằng số liên quan đến booking
 */

/**
 * Booking Status Enum
 * State Machine: REQUESTED → CONFIRMED → ACCEPTED → IN_PROGRESS → COMPLETED → PAID
 *
 * Theo tài liệu cab-booking-system.md - Phụ lục D:
 * CREATED → MATCHING → ASSIGNED → PICKUP → IN_PROGRESS → COMPLETED → PAID
 * (đã map lại tên cho phù hợp với context)
 */
const BOOKING_STATUS = {
  REQUESTED: 'REQUESTED',   // Vừa tạo, đang chờ xử lý
  CONFIRMED: 'CONFIRMED',   // Đã xác nhận, đang tìm tài xế
  ACCEPTED: 'ACCEPTED',     // Tài xế đã nhận chuyến
  IN_PROGRESS: 'IN_PROGRESS', // Đang di chuyển
  COMPLETED: 'COMPLETED',   // Chuyến đi hoàn thành
  PAID: 'PAID',             // Đã thanh toán
  CANCELLED: 'CANCELLED',   // Đã hủy
  FAILED: 'FAILED',         // Thất bại (hệ thống)
};

/**
 * Valid Payment Methods
 * Test Case TC14: Payment method invalid → 400
 */
const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
  E_WALLET: 'e_wallet',
};

/**
 * Booking state transitions hợp lệ
 */
const VALID_TRANSITIONS = {
  [BOOKING_STATUS.REQUESTED]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.FAILED],
  [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED],
  [BOOKING_STATUS.COMPLETED]: [BOOKING_STATUS.PAID],
  [BOOKING_STATUS.PAID]: [],
  [BOOKING_STATUS.CANCELLED]: [],
  [BOOKING_STATUS.FAILED]: [],
};

/**
 * Schema mô tả cấu trúc booking object trả về từ API
 * (Để làm tài liệu, không có validation runtime ở đây)
 */
const BOOKING_SCHEMA = {
  booking_id: 'UUID - Primary key',
  user_id: 'VARCHAR - Passenger user ID from JWT',
  driver_id: 'VARCHAR - Assigned driver ID (nullable)',
  idempotency_key: 'VARCHAR UNIQUE - Client-generated idempotency key',
  pickup: {
    lat: 'DECIMAL(10,8) - Latitude (-90 to 90)',
    lng: 'DECIMAL(11,8) - Longitude (-180 to 180)',
    address: 'TEXT - Human-readable address (optional)',
  },
  drop: {
    lat: 'DECIMAL(10,8)',
    lng: 'DECIMAL(11,8)',
    address: 'TEXT (optional)',
  },
  distance_km: 'DECIMAL(8,2) - Trip distance in kilometers',
  estimated_price: 'DECIMAL(10,2) - Price estimate from Pricing Service',
  final_price: 'DECIMAL(10,2) - Actual price after completion',
  surge_multiplier: 'DECIMAL(4,2) - Surge pricing multiplier (>= 1.0)',
  payment_method: 'VARCHAR - cash | card | wallet | e_wallet',
  eta_minutes: 'INTEGER - Estimated arrival time in minutes',
  status: 'booking_status ENUM',
  cancel_reason: 'TEXT (nullable)',
  created_at: 'TIMESTAMPTZ',
  updated_at: 'TIMESTAMPTZ',
  accepted_at: 'TIMESTAMPTZ (nullable)',
  completed_at: 'TIMESTAMPTZ (nullable)',
  cancelled_at: 'TIMESTAMPTZ (nullable)',
};

module.exports = {
  BOOKING_STATUS,
  PAYMENT_METHODS,
  VALID_TRANSITIONS,
  BOOKING_SCHEMA,
};

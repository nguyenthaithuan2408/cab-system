'use strict';

/**
 * Ride Model - Constants & State Machine Definition
 * State machine: CREATED → MATCHING → ASSIGNED → PICKUP → IN_PROGRESS → COMPLETED → PAID
 * (Theo Phụ lục D - cab-booking-system.md)
 */

/**
 * Ride Status Enum
 */
const RIDE_STATUS = {
  CREATED: 'CREATED',
  MATCHING: 'MATCHING',
  ASSIGNED: 'ASSIGNED',
  PICKUP: 'PICKUP',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

/**
 * State Machine - Valid Transitions
 * Chỉ cho phép chuyển trạng thái hợp lệ theo đúng flow nghiệp vụ
 *
 * CREATED      → Ride vừa được tạo từ Kafka event ride.requested
 * MATCHING     → Đang tìm tài xế
 * ASSIGNED     → Đã tìm được tài xế (driver.assigned event)
 * PICKUP       → Tài xế đang đến điểm đón
 * IN_PROGRESS  → Chuyến đi đang diễn ra (driver đã đón khách)
 * COMPLETED    → Chuyến đi kết thúc
 * PAID         → Đã thanh toán
 * CANCELLED    → Bị hủy
 * FAILED       → Thất bại do lỗi hệ thống
 */
const VALID_TRANSITIONS = {
  CREATED: ['MATCHING', 'CANCELLED', 'FAILED'],
  MATCHING: ['ASSIGNED', 'CANCELLED', 'FAILED'],
  ASSIGNED: ['PICKUP', 'CANCELLED'],
  PICKUP: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['PAID'],
  PAID: [],
  CANCELLED: [],
  FAILED: [],
};

/**
 * Kiểm tra chuyển trạng thái có hợp lệ không
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
function isValidTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Format ride record thành response object chuẩn (cho list)
 */
function formatRideListItem(ride) {
  return {
    ride_id: ride.id,
    booking_id: ride.booking_id,
    status: ride.status,
    driver_id: ride.driver_id,
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
    distance_km: ride.distance_km ? parseFloat(ride.distance_km) : null,
    estimated_price: ride.estimated_price ? parseFloat(ride.estimated_price) : null,
    final_price: ride.final_price ? parseFloat(ride.final_price) : null,
    payment_method: ride.payment_method,
    created_at: ride.created_at,
    updated_at: ride.updated_at,
  };
}

/**
 * Format ride record thành response object đầy đủ (cho detail)
 */
function formatRideDetail(ride) {
  return {
    ride_id: ride.id,
    booking_id: ride.booking_id,
    user_id: ride.user_id,
    driver_id: ride.driver_id,
    status: ride.status,
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
    distance_km: ride.distance_km ? parseFloat(ride.distance_km) : null,
    estimated_price: ride.estimated_price ? parseFloat(ride.estimated_price) : null,
    final_price: ride.final_price ? parseFloat(ride.final_price) : null,
    payment_method: ride.payment_method,
    eta_minutes: ride.eta_minutes,
    cancel_reason: ride.cancel_reason,
    created_at: ride.created_at,
    updated_at: ride.updated_at,
    assigned_at: ride.assigned_at,
    pickup_at: ride.pickup_at,
    started_at: ride.started_at,
    completed_at: ride.completed_at,
    cancelled_at: ride.cancelled_at,
  };
}

module.exports = {
  RIDE_STATUS,
  VALID_TRANSITIONS,
  isValidTransition,
  formatRideListItem,
  formatRideDetail,
};

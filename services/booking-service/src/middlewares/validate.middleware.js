'use strict';

/**
 * Input Validation Middleware
 * Test Case TC11: Booking thiếu pickup → 400 "pickup is required"
 * Test Case TC12: Sai format lat/lng → 422 Unprocessable Entity
 * Test Case TC14: Payment method invalid → 400
 * Test Case TC20: Payload quá lớn → 413 (handled by express json limit)
 */

const VALID_PAYMENT_METHODS = ['cash', 'card', 'wallet', 'e_wallet'];

/**
 * Validate request tạo booking
 * Test Case TC11, TC12, TC14
 */
function validateCreateBooking(req, res, next) {
  const { pickup, drop, distance_km, payment_method } = req.body;
  const errors = [];

  // ====== Validate pickup ======
  // TC11: Thiếu pickup → 400
  if (!pickup) {
    errors.push({ field: 'pickup', message: 'pickup is required' });
  } else {
    // TC12: Sai format lat/lng
    if (pickup.lat === undefined || pickup.lat === null) {
      errors.push({ field: 'pickup.lat', message: 'pickup.lat is required' });
    } else if (!isValidLatitude(pickup.lat)) {
      errors.push({
        field: 'pickup.lat',
        message: 'pickup.lat must be a valid latitude (-90 to 90)',
      });
    }

    if (pickup.lng === undefined || pickup.lng === null) {
      errors.push({ field: 'pickup.lng', message: 'pickup.lng is required' });
    } else if (!isValidLongitude(pickup.lng)) {
      errors.push({
        field: 'pickup.lng',
        message: 'pickup.lng must be a valid longitude (-180 to 180)',
      });
    }
  }

  // ====== Validate drop ======
  if (!drop) {
    errors.push({ field: 'drop', message: 'drop is required' });
  } else {
    if (drop.lat === undefined || drop.lat === null) {
      errors.push({ field: 'drop.lat', message: 'drop.lat is required' });
    } else if (!isValidLatitude(drop.lat)) {
      errors.push({
        field: 'drop.lat',
        message: 'drop.lat must be a valid latitude (-90 to 90)',
      });
    }

    if (drop.lng === undefined || drop.lng === null) {
      errors.push({ field: 'drop.lng', message: 'drop.lng is required' });
    } else if (!isValidLongitude(drop.lng)) {
      errors.push({
        field: 'drop.lng',
        message: 'drop.lng must be a valid longitude (-180 to 180)',
      });
    }
  }

  // ====== Validate distance_km ======
  if (distance_km === undefined || distance_km === null) {
    errors.push({ field: 'distance_km', message: 'distance_km is required' });
  } else if (typeof distance_km !== 'number' || isNaN(distance_km)) {
    errors.push({ field: 'distance_km', message: 'distance_km must be a number' });
  } else if (distance_km < 0) {
    errors.push({ field: 'distance_km', message: 'distance_km must be >= 0' });
  }

  // ====== Validate payment_method ======
  // TC14: Payment method invalid → 400
  if (payment_method && !VALID_PAYMENT_METHODS.includes(payment_method)) {
    errors.push({
      field: 'payment_method',
      message: `Invalid payment method. Allowed: ${VALID_PAYMENT_METHODS.join(', ')}`,
    });
  }

  // ====== Có lỗi type mismatch → 422 ======
  // TC12: Sai kiểu dữ liệu → 422
  const hasTypeMismatch = errors.some(
    (e) => e.field.includes('lat') || e.field.includes('lng')
  );

  if (errors.length > 0) {
    const statusCode = hasTypeMismatch ? 422 : 400;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 422 ? 'VALIDATION_ERROR' : 'BAD_REQUEST',
        message: errors[0].message, // message đầu tiên
        details: errors,
      },
    });
  }

  next();
}

/**
 * Validate request cancel booking
 */
function validateCancelBooking(req, res, next) {
  // booking_id được lấy từ params, không cần validate thêm
  next();
}

/**
 * Validate request accept booking (Driver)
 */
function validateAcceptBooking(req, res, next) {
  const { driver_id } = req.body;

  if (!driver_id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'driver_id is required',
      },
    });
  }

  next();
}

// ====== Helper validation functions ======

function isValidLatitude(lat) {
  const num = parseFloat(lat);
  return !isNaN(num) && isFinite(num) && num >= -90 && num <= 90;
}

function isValidLongitude(lng) {
  const num = parseFloat(lng);
  return !isNaN(num) && isFinite(num) && num >= -180 && num <= 180;
}

module.exports = {
  validateCreateBooking,
  validateCancelBooking,
  validateAcceptBooking,
};

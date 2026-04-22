'use strict';

/**
 * Input Validation Middleware for Ride Service
 * Test Case TC11: Thiếu field bắt buộc → 400
 * Test Case TC12: Sai format lat/lng → 422
 */

/**
 * Validate request bắt đầu chuyến đi (driver action)
 * Driver gọi khi đến điểm đón khách
 */
function validateStartRide(req, res, next) {
  const { driver_lat, driver_lng } = req.body;
  const errors = [];

  // driver_lat và driver_lng là optional nhưng nếu có phải hợp lệ
  if (driver_lat !== undefined && !isValidLatitude(driver_lat)) {
    errors.push({ field: 'driver_lat', message: 'driver_lat must be a valid latitude (-90 to 90)' });
  }
  if (driver_lng !== undefined && !isValidLongitude(driver_lng)) {
    errors.push({ field: 'driver_lng', message: 'driver_lng must be a valid longitude (-180 to 180)' });
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors[0].message,
        details: errors,
      },
    });
  }

  next();
}

/**
 * Validate request hoàn thành chuyến đi
 * Driver gọi khi đã đến điểm đích
 */
function validateCompleteRide(req, res, next) {
  const { final_price } = req.body;
  const errors = [];

  if (final_price !== undefined) {
    if (typeof final_price !== 'number' || isNaN(final_price)) {
      errors.push({ field: 'final_price', message: 'final_price must be a number' });
    } else if (final_price < 0) {
      errors.push({ field: 'final_price', message: 'final_price must be >= 0' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: errors[0].message,
        details: errors,
      },
    });
  }

  next();
}

/**
 * Validate request cập nhật vị trí tài xế
 * Test Case TC12: Sai format lat/lng → reject
 */
function validateUpdateLocation(req, res, next) {
  const { lat, lng } = req.body;
  const errors = [];

  if (lat === undefined || lat === null) {
    errors.push({ field: 'lat', message: 'lat is required' });
  } else if (!isValidLatitude(lat)) {
    errors.push({ field: 'lat', message: 'lat must be a valid latitude (-90 to 90)' });
  }

  if (lng === undefined || lng === null) {
    errors.push({ field: 'lng', message: 'lng is required' });
  } else if (!isValidLongitude(lng)) {
    errors.push({ field: 'lng', message: 'lng must be a valid longitude (-180 to 180)' });
  }

  const hasTypeMismatch = errors.some((e) => e.field === 'lat' || e.field === 'lng');

  if (errors.length > 0) {
    const statusCode = hasTypeMismatch && lat !== undefined && lng !== undefined ? 422 : 400;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 422 ? 'VALIDATION_ERROR' : 'BAD_REQUEST',
        message: errors[0].message,
        details: errors,
      },
    });
  }

  next();
}

/**
 * Validate request hủy chuyến đi
 */
function validateCancelRide(req, res, next) {
  // reason là optional
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
  validateStartRide,
  validateCompleteRide,
  validateUpdateLocation,
  validateCancelRide,
};

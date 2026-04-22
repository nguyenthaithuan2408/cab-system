'use strict';
const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * HTTP Client để gọi Pricing Service
 * Test Case TC21: Booking gọi ETA service thành công
 * Test Case TC22: Booking gọi Pricing service
 * Test Case TC30: Retry khi Pricing service timeout
 */

// Tạo axios instance với timeout và retry
const pricingAxios = axios.create({
  baseURL: env.PRICING_SERVICE_URL,
  timeout: 5000, // 5 giây timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Source-Service': 'booking-service',
  },
});

/**
 * Retry logic với exponential backoff
 * Test Case TC30: Retry khi Pricing service timeout
 * Test Case TC77: Retry exponential backoff
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 300) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isRetryable =
        err.code === 'ECONNABORTED' || // timeout
        err.code === 'ECONNREFUSED' || // service down
        err.code === 'ETIMEDOUT' ||
        (err.response && err.response.status >= 500);

      if (!isRetryable || attempt === maxRetries) break;

      const delay = baseDelay * Math.pow(2, attempt - 1); // exponential backoff
      logger.warn('Pricing service call failed, retrying', {
        attempt,
        maxRetries,
        delay_ms: delay,
        error: err.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Lấy ước tính giá và ETA từ Pricing Service
 * Test Case TC8: Pricing API trả về giá hợp lệ
 * Test Case TC22: Booking gọi Pricing service → price > 0
 */
async function getEstimate({ distance_km, pickup_lat, pickup_lng, drop_lat, drop_lng }) {
  try {
    const result = await withRetry(async () => {
      const response = await pricingAxios.post('/pricing/estimate', {
        distance_km,
        pickup: { lat: pickup_lat, lng: pickup_lng },
        drop: { lat: drop_lat, lng: drop_lng },
        demand_index: 1.0, // default, sẽ được tính trong pricing-service
      });
      return response.data;
    });

    logger.info('Pricing estimate received', {
      distance_km,
      price: result.price,
      surge: result.surge_multiplier,
    });

    return {
      price: result.price || result.estimated_price || null,
      surge_multiplier: result.surge_multiplier || result.surge || 1.0,
      eta_minutes: result.eta_minutes || result.eta || null,
    };
  } catch (err) {
    logger.error('Pricing service unavailable after retries', {
      error: err.message,
      distance_km,
    });
    // Trả null để caller có thể fallback
    return null;
  }
}

module.exports = { getEstimate };

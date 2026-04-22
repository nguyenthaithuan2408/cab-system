'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const logger = require('./utils/logger');
const { requestLogger } = require('./middlewares/logger.middleware');
const rideRoutes = require('./routes/ride.route');

/**
 * Express Application Configuration for Ride Service
 *
 * Test Case TC98:  Rate limiting chống abuse → 429
 * Test Case TC20:  Payload > 1MB → 413
 * Test Case TC101: GET /health → 200 {"status": "ok"}
 * Test Case TC113: GET /metrics → Prometheus metrics
 */

const app = express();

// ====== Security Headers (Helmet) ======
// Thêm các security headers: X-Frame-Options, X-XSS-Protection, etc.
app.use(helmet());

// ====== CORS ======
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id', 'X-Request-Id', 'x-user-id', 'x-user-role'],
  exposedHeaders: ['X-Trace-Id'],
}));

// ====== Body Parser ======
// Test Case TC20: Payload quá lớn → 413 Payload Too Large
app.use(express.json({
  limit: env.MAX_PAYLOAD_SIZE,
  strict: true,
}));
app.use(express.urlencoded({ extended: true, limit: env.MAX_PAYLOAD_SIZE }));

// ====== Rate Limiting ======
// Test Case TC98: > 100 requests/second → 429
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  skip: (req) => req.path === '/health', // Không rate-limit health check
});
app.use(limiter);

// ====== Request Logging ======
// TC111/112/115: Structured logging với trace_id
app.use(requestLogger);

// ====== Health Check ======
// Test Case TC101-103: GET /health → 200 {"status": "ok"}
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: env.SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ====== Metrics Endpoint ======
// Test Case TC112/113: GET /metrics được đọc bởi Prometheus
app.get('/metrics', (req, res) => {
  // Trong production: dùng prom-client để expose metrics thật
  res.status(200).set('Content-Type', 'text/plain').send([
    '# HELP ride_service_requests_total Total HTTP requests',
    '# TYPE ride_service_requests_total counter',
    `ride_service_requests_total{service="${env.SERVICE_NAME}"} 0`,
    '',
    '# HELP ride_service_uptime_seconds Service uptime in seconds',
    '# TYPE ride_service_uptime_seconds gauge',
    `ride_service_uptime_seconds ${process.uptime()}`,
    '',
    '# HELP ride_service_active_rides_total Active rides',
    '# TYPE ride_service_active_rides_total gauge',
    `ride_service_active_rides_total{service="${env.SERVICE_NAME}"} 0`,
  ].join('\n'));
});

// ====== API Routes ======
app.use('/rides', rideRoutes);

// ====== 404 Handler ======
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ====== Global Error Handler ======
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // TC20: Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large',
      },
    });
  }

  // JSON parse error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
    });
  }

  logger.error('Unhandled Express error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
});

module.exports = app;

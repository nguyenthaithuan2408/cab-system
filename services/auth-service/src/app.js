'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const { register: metricsRegistry, httpRequestsTotal, httpRequestDurationSeconds } = require('./utils/metrics');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.route');
const healthRoutes = require('./routes/health.route');

const app = express();

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// CORS — whitelist from ENV; falls back to allow-all only when not configured
// (Zero Trust: explicit allowlist, not implicit open)
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      allowedOrigins.length > 0
        ? (origin, callback) => {
            // Allow server-to-server requests (no origin) and whitelisted origins
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS: origin '${origin}' not allowed`));
          }
        : true, // dev fallback — all origins allowed when CORS_ORIGINS is unset
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Body parsing — size limit prevents TC#20 (413 Payload Too Large)
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Trace ID — inject X-Request-ID into every request/response (TC#115)
// ---------------------------------------------------------------------------
app.use((req, _res, next) => {
  req.traceId = req.headers['x-request-id'] || uuidv4();
  _res.setHeader('X-Request-ID', req.traceId);
  next();
});

// ---------------------------------------------------------------------------
// HTTP request logging (structured JSON, replaces morgan 'dev')
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const durationSec = durationMs / 1000;
    const route = req.route?.path || req.path;

    // Prometheus metrics
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    httpRequestDurationSeconds.observe(
      { method: req.method, route, status_code: res.statusCode },
      durationSec,
    );

    // Structured HTTP log
    logger.info({
      traceId: req.traceId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: durationMs.toFixed(2),
    });
  });

  next();
});

// ---------------------------------------------------------------------------
// Audit logging — security trail for all /api/auth/* actions (TC#100)
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/auth')) return next();

  res.on('finish', () => {
    logger.info({
      type: 'AUDIT',
      traceId: req.traceId,
      userId: req.user?.sub || null,
      action: `${req.method} ${req.path}`,
      statusCode: res.statusCode,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  });

  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

// ---------------------------------------------------------------------------
// Prometheus metrics endpoint (TC#113)
// ---------------------------------------------------------------------------
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    const metrics = await metricsRegistry.metrics();
    res.end(metrics);
  } catch (err) {
    logger.error({ err }, '[auth-service] Error generating metrics');
    res.status(500).end(err.message);
  }
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  logger.error({ err, traceId: req.traceId }, '[auth-service] Unhandled error');
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;

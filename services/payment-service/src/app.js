require('dotenv').config();
const express = require('express');
const paymentRoutes = require('./routes/payment.route');
const { sendError } = require('./utils/response');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.info(
      `[payment-service] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`
    );
  });
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: process.env.SERVICE_NAME || 'payment-service',
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

app.use('/payments', paymentRoutes);

app.use((req, res) => sendError(res, 404, 'Route not found', 'ROUTE_NOT_FOUND'));

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const details = error.details || null;

  console.error('[payment-service] unhandled error:', error);
  return sendError(res, statusCode, error.message || 'Internal server error', code, details);
});

module.exports = app;

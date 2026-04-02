require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/user.route');
const { sendError } = require('./utils/response');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.info(
      `[user-service] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`
    );
  });
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: process.env.SERVICE_NAME || 'user-service',
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

app.use('/users', userRoutes);

app.use((req, res) => sendError(res, 404, 'Route not found', 'ROUTE_NOT_FOUND'));

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const details = error.details || null;

  console.error('[user-service] unhandled error:', error);
  return sendError(res, statusCode, error.message || 'Internal server error', code, details);
});

module.exports = app;

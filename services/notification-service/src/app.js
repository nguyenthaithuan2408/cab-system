const express = require('express');
const pino = require('pino');
const notificationRoutes = require('./routes/notification.route');

const logger = pino();

const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

module.exports = app;

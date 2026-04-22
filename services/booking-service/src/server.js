'use strict';
const app = require('./app');
const env = require('./config/env');
const { connectDB, closeDB } = require('./config/database');
const logger = require('./utils/logger');
const producer = require('./events/booking.producer');
const consumer = require('./events/booking.consumer');
const bookingService = require('./services/booking.service');

/**
 * Server Entry Point
 * - Khởi động theo thứ tự: DB → Kafka Producer → HTTP Server → Kafka Consumer
 * - Graceful shutdown xử lý SIGTERM/SIGINT
 *
 * Test Case TC101: Deploy service - Pod chạy, không crash
 * Test Case TC103: Health check /health = 200
 * Test Case TC109: Config sai → fail fast (đã xử lý trong env.js)
 */

let server = null;

async function startServer() {
  try {
    logger.info('Starting booking-service...', { port: env.PORT, node_env: env.NODE_ENV });

    // ====== Step 1: Kết nối DB ======
    // Test Case TC104: Service connect database
    await connectDB();
    logger.info('Database connected and migrations applied');

    // ====== Step 2: Kết nối Kafka Producer ======
    // Test Case TC105: Service connect Kafka
    try {
      await producer.connectProducer();
      logger.info('Kafka producer ready');
    } catch (err) {
      // Kafka không bắt buộc để service hoạt động cơ bản
      logger.warn('Kafka producer connection failed, events will be skipped', {
        error: err.message,
      });
    }

    // ====== Step 3: Khởi động HTTP Server ======
    server = app.listen(env.PORT, () => {
      logger.info(`Booking Service is running`, {
        port: env.PORT,
        health: `http://localhost:${env.PORT}/health`,
        api: `http://localhost:${env.PORT}/bookings`,
      });
    });

    // Handle server errors
    server.on('error', (err) => {
      logger.error('HTTP server error', { error: err.message });
      process.exit(1);
    });

    // ====== Step 4: Khởi động Kafka Consumer ======
    try {
      consumer.setBookingService(bookingService);
      await consumer.startConsumer();
      logger.info('Kafka consumer started');
    } catch (err) {
      logger.warn('Kafka consumer failed to start, event consumption disabled', {
        error: err.message,
      });
    }

  } catch (err) {
    logger.error('Failed to start booking-service', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 * Test Case TC106: Rolling update - zero downtime
 * Đảm bảo xử lý xong requests đang chạy trước khi tắt
 */
async function shutdown(signal) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // 1. Ngừng nhận request mới
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
    });
  }

  try {
    // 2. Dừng Kafka consumer
    await consumer.stopConsumer();

    // 3. Dừng Kafka producer
    await producer.disconnectProducer();

    // 4. Đóng DB pool
    await closeDB();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
}

// ====== Signal Handlers ======
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Xử lý unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  // Không exit để tránh crash toàn service vì 1 promise lỗi
});

// Xử lý uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception - shutting down', {
    error: err.message,
    stack: err.stack,
  });
  shutdown('uncaughtException');
});

// ====== Start ======
startServer();

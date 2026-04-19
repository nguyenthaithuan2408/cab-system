'use strict';

require('dotenv').config();

// ---------------------------------------------------------------------------
// Startup validation — fail fast if any required ENV var is missing (TC#109)
// ---------------------------------------------------------------------------
const REQUIRED_ENV = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Use console.error here — logger may not be initialised yet
  console.error(
    `[auth-service] FATAL: Missing required environment variables: ${missing.join(', ')}`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// App bootstrap
// ---------------------------------------------------------------------------

const app = require('./app');
const prisma = require('./config/database');
const redisClient = require('./config/redis');
const logger = require('./utils/logger');
const { startConsumer } = require('./events/auth.consumer');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, '[auth-service] Auth-Service is running');

  // Start Kafka consumer — non-blocking, failure is tolerated
  startConsumer().catch((err) =>
    logger.error({ err }, '[auth-service] Consumer startup failed'),
  );
});

// ---------------------------------------------------------------------------
// Graceful shutdown — required for K8s rolling updates (TC#106)
// ---------------------------------------------------------------------------

/**
 * Close the HTTP server, then disconnect from Prisma and Redis before exiting.
 * @param {string} signal  e.g. 'SIGTERM' or 'SIGINT'
 */
const shutdown = async (signal) => {
  logger.info({ signal }, '[auth-service] Shutdown signal received — draining connections...');

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('[auth-service] Prisma disconnected');
      await redisClient.quit();
      logger.info('[auth-service] Redis disconnected');
      logger.info('[auth-service] Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, '[auth-service] Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force exit after 10 s if server doesn't close in time
  setTimeout(() => {
    logger.error('[auth-service] Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

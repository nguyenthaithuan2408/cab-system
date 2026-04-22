'use strict';
require('dotenv').config();

/**
 * ENV Validation - Fail Fast Pattern
 * Nếu ENV bị thiếu hoặc sai, service sẽ crash ngay lúc start.
 * Test Case TC109: Config sai fail fast
 */

const REQUIRED_VARS = [
  'PORT',
  'DATABASE_URL',
];

const missingVars = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'ride-service',
      timestamp: new Date().toISOString(),
      message: `Missing required environment variables: ${missingVars.join(', ')}`,
      missing: missingVars,
    })
  );
  process.exit(1);
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3003,
  SERVICE_NAME: process.env.SERVICE_NAME || 'ride-service',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || 'cab_booking',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_SSL: process.env.DB_SSL === 'true',

  // Kafka
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'ride-service',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'ride-service-group',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

  // Payload
  MAX_PAYLOAD_SIZE: process.env.MAX_PAYLOAD_SIZE || '1mb',
};

module.exports = env;

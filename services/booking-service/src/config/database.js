'use strict';
const { Pool } = require('pg');
const env = require('./env');

/**
 * PostgreSQL Connection Pool
 * Database per service pattern - booking-service có DB riêng
 * Test Case TC104: Service connect database thành công
 */

let pool = null;

/**
 * Khởi tạo connection pool
 */
function createPool() {
  const config = env.DATABASE_URL
    ? {
        connectionString: env.DATABASE_URL,
        ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      };

  return new Pool({
    ...config,
    max: 20,                // max connections trong pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Kết nối DB và chạy schema migration
 * Fail-fast nếu không kết nối được
 */
async function connectDB() {
  pool = createPool();

  // Test connection
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger().info('PostgreSQL connected successfully');
    await runMigrations(client);
  } finally {
    client.release();
  }

  pool.on('error', (err) => {
    logger().error('Unexpected PostgreSQL pool error', { error: err.message });
  });

  return pool;
}

/**
 * Chạy schema migration tự động
 * Tạo bảng bookings nếu chưa tồn tại
 */
async function runMigrations(client) {
  // Tạo ENUM type cho booking status
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE booking_status AS ENUM (
        'REQUESTED',
        'CONFIRMED',
        'ACCEPTED',
        'IN_PROGRESS',
        'COMPLETED',
        'PAID',
        'CANCELLED',
        'FAILED'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // Tạo bảng bookings
  await client.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         VARCHAR(255) NOT NULL,
      driver_id       VARCHAR(255),
      idempotency_key VARCHAR(255) UNIQUE,
      
      -- Location
      pickup_lat      DECIMAL(10, 8) NOT NULL,
      pickup_lng      DECIMAL(11, 8) NOT NULL,
      pickup_address  TEXT,
      drop_lat        DECIMAL(10, 8) NOT NULL,
      drop_lng        DECIMAL(11, 8) NOT NULL,
      drop_address    TEXT,
      distance_km     DECIMAL(8, 2) NOT NULL,
      
      -- Pricing
      estimated_price DECIMAL(10, 2),
      final_price     DECIMAL(10, 2),
      surge_multiplier DECIMAL(4, 2) DEFAULT 1.0,
      payment_method  VARCHAR(50) DEFAULT 'cash',
      
      -- ETA
      eta_minutes     INTEGER,
      
      -- Status
      status          booking_status NOT NULL DEFAULT 'REQUESTED',
      cancel_reason   TEXT,
      
      -- Timestamps
      created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      accepted_at     TIMESTAMP WITH TIME ZONE,
      completed_at    TIMESTAMP WITH TIME ZONE,
      cancelled_at    TIMESTAMP WITH TIME ZONE
    );
  `);

  // Indexes cho performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency ON bookings(idempotency_key)
      WHERE idempotency_key IS NOT NULL;
  `);

  logger().info('Database migrations completed successfully');
}

/**
 * Trả về pool instance (lazy initialization)
 */
function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return pool;
}

/**
 * Đóng kết nối DB khi shutdown
 */
async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
    logger().info('PostgreSQL pool closed');
  }
}

/**
 * Lazy logger để tránh circular dependency
 */
function logger() {
  try {
    return require('../utils/logger');
  } catch {
    return console;
  }
}

module.exports = { connectDB, getPool, closeDB };

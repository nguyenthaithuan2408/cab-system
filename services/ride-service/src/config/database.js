'use strict';
const { Pool } = require('pg');
const env = require('./env');

/**
 * PostgreSQL Connection Pool
 * Database per service pattern - ride-service có DB riêng (share postgres cluster, schema riêng)
 * Test Case TC104: Service connect database thành công
 * Test Case TC109: Config sai → fail fast
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
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Kết nối DB và chạy schema migration
 * Fail-fast nếu không kết nối được
 * Test Case TC104: Kết nối DB thành công
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
 * Tạo bảng rides nếu chưa tồn tại
 *
 * State machine: CREATED → MATCHING → ASSIGNED → PICKUP → IN_PROGRESS → COMPLETED → PAID
 * (theo Phụ lục D trong cab-booking-system.md)
 */
async function runMigrations(client) {
  // Tạo ENUM type cho ride status
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE ride_status AS ENUM (
        'CREATED',
        'MATCHING',
        'ASSIGNED',
        'PICKUP',
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

  // Tạo bảng rides
  await client.query(`
    CREATE TABLE IF NOT EXISTS rides (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id      VARCHAR(255) NOT NULL UNIQUE,
      user_id         VARCHAR(255) NOT NULL,
      driver_id       VARCHAR(255),

      -- Location
      pickup_lat      DECIMAL(10, 8) NOT NULL,
      pickup_lng      DECIMAL(11, 8) NOT NULL,
      pickup_address  TEXT,
      drop_lat        DECIMAL(10, 8) NOT NULL,
      drop_lng        DECIMAL(11, 8) NOT NULL,
      drop_address    TEXT,
      distance_km     DECIMAL(8, 2),

      -- Pricing
      estimated_price DECIMAL(10, 2),
      final_price     DECIMAL(10, 2),
      payment_method  VARCHAR(50) DEFAULT 'cash',

      -- ETA
      eta_minutes     INTEGER,

      -- Status (State Machine)
      status          ride_status NOT NULL DEFAULT 'CREATED',
      cancel_reason   TEXT,

      -- Driver location snapshot at pickup
      driver_pickup_lat  DECIMAL(10, 8),
      driver_pickup_lng  DECIMAL(11, 8),

      -- Timestamps
      created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      assigned_at     TIMESTAMP WITH TIME ZONE,
      pickup_at       TIMESTAMP WITH TIME ZONE,
      started_at      TIMESTAMP WITH TIME ZONE,
      completed_at    TIMESTAMP WITH TIME ZONE,
      cancelled_at    TIMESTAMP WITH TIME ZONE
    );
  `);

  // Indexes cho performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_rides_booking_id ON rides(booking_id);
    CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
    CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
    CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
    CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);
  `);

  logger().info('Ride service database migrations completed successfully');
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

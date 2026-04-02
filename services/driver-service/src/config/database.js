const { Pool } = require('pg');

const sslEnabled = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'driver_service_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: sslEnabled ? { rejectUnauthorized: false } : false
    });

async function connectDatabase() {
  await pool.query('SELECT 1');
  console.info('[driver-service] PostgreSQL connected');
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS driver_profiles (
      id TEXT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL UNIQUE,
      license_number VARCHAR(80) NOT NULL UNIQUE,
      vehicle_type VARCHAR(50) NOT NULL,
      vehicle_plate VARCHAR(30) NOT NULL UNIQUE,
      availability_status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
      current_latitude DOUBLE PRECISION,
      current_longitude DOUBLE PRECISION,
      rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query('ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION;');
  await pool.query('ALTER TABLE driver_profiles ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION;');

  await pool.query('CREATE INDEX IF NOT EXISTS idx_driver_availability ON driver_profiles(availability_status);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_driver_is_active ON driver_profiles(is_active);');
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_driver_coordinates ON driver_profiles(current_latitude, current_longitude);'
  );
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  pool,
  connectDatabase,
  initSchema,
  closeDatabase
};

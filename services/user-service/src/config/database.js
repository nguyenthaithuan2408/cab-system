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
      database: process.env.DB_NAME || 'user_service_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: sslEnabled ? { rejectUnauthorized: false } : false
    });

async function connectDatabase() {
  await pool.query('SELECT 1');
  console.info('[user-service] PostgreSQL connected');
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS passenger_profiles (
      id TEXT PRIMARY KEY,
      account_ref TEXT UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL UNIQUE,
      avatar_url TEXT,
      gender VARCHAR(20),
      date_of_birth DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_passenger_account_ref ON passenger_profiles(account_ref);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_passenger_is_active ON passenger_profiles(is_active);');
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

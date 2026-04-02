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
      database: process.env.DB_NAME || 'payment_service_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: sslEnabled ? { rejectUnauthorized: false } : false
    });

async function connectDatabase() {
  await pool.query('SELECT 1');
  console.info('[payment-service] PostgreSQL connected');
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
      currency VARCHAR(10) NOT NULL,
      payment_method VARCHAR(30) NOT NULL,
      payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      transaction_ref VARCHAR(120) NOT NULL UNIQUE,
      provider_ref VARCHAR(120),
      idempotency_key VARCHAR(120),
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_idempotency_key
    ON payment_transactions(idempotency_key)
    WHERE idempotency_key IS NOT NULL;
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_payment_booking_id ON payment_transactions(booking_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_transactions(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(payment_status);');
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

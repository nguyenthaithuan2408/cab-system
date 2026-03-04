export async function ensurePaymentTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      user_id UUID PRIMARY KEY,
      balance_cents BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ride_id UUID NOT NULL,
      user_id UUID NOT NULL,
      amount_cents BIGINT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'USD',
      status VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payments_user_id_created_at
      ON payments (user_id, created_at DESC);
  `);
}


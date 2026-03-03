export async function ensureDriverTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drivers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      vehicle VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'offline',
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );
  `);
}


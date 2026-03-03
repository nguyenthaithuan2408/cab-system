export async function ensureUserTable(pool) {
    // Enable the pgcrypto extension if it's not already enabled.
    // This is required for gen_random_uuid().
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );
  `);
}
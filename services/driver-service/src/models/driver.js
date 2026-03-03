export async function ensureDriverTable(pool) {
    // Note: In a real production app, you would use a migration tool.
    // This is simplified for the example.
    // Enable the pgcrypto extension if it's not already enabled.
    // This is required for gen_random_uuid().
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await pool.query(`
    CREATE TABLE IF NOT EXISTS drivers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE, -- Foreign key to the users table
      license_number VARCHAR(100) NOT NULL UNIQUE,
      vehicle_details JSONB, -- e.g., {"make": "Toyota", "model": "Camry", "year": 2021, "plate": "51F-12345"}
      status VARCHAR(20) NOT NULL DEFAULT 'offline', -- e.g., offline, available, on_trip
      current_latitude DOUBLE PRECISION,
      current_longitude DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );
  `);
    // In a real app, you might add: FOREIGN KEY (user_id) REFERENCES users(id)
    // But that requires inter-service dependency which adds complexity.
    // We'll manage the relationship at the application level for now.
}
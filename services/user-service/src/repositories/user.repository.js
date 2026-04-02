const { pool } = require('../config/database');

async function createProfile(payload) {
  const query = `
    INSERT INTO passenger_profiles (
      id, account_ref, full_name, email, phone, avatar_url,
      gender, date_of_birth, status, is_active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *;
  `;

  const values = [
    payload.id,
    payload.accountRef,
    payload.fullName,
    payload.email,
    payload.phone,
    payload.avatarUrl,
    payload.gender,
    payload.dateOfBirth,
    payload.status,
    payload.isActive
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getById(id) {
  const result = await pool.query('SELECT * FROM passenger_profiles WHERE id = $1 LIMIT 1;', [id]);
  return result.rows[0] || null;
}

async function getByAccountRef(accountRef) {
  const result = await pool.query('SELECT * FROM passenger_profiles WHERE account_ref = $1 LIMIT 1;', [accountRef]);
  return result.rows[0] || null;
}

async function getByEmail(email) {
  const result = await pool.query('SELECT * FROM passenger_profiles WHERE email = $1 LIMIT 1;', [email]);
  return result.rows[0] || null;
}

async function getByPhone(phone) {
  const result = await pool.query('SELECT * FROM passenger_profiles WHERE phone = $1 LIMIT 1;', [phone]);
  return result.rows[0] || null;
}

async function updateById(id, payload) {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(payload)) {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index += 1;
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE passenger_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *;`,
    values
  );

  return result.rows[0] || null;
}

async function deactivateById(id) {
  const result = await pool.query(
    `
      UPDATE passenger_profiles
      SET is_active = FALSE,
          status = 'INACTIVE',
          deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  createProfile,
  getById,
  getByAccountRef,
  getByEmail,
  getByPhone,
  updateById,
  deactivateById
};

const { pool } = require('../config/database');

async function createDriver(payload) {
  const query = `
    INSERT INTO driver_profiles (
      id, full_name, email, phone, license_number,
      vehicle_type, vehicle_plate, availability_status,
      rating_avg, is_active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *;
  `;

  const values = [
    payload.id,
    payload.fullName,
    payload.email,
    payload.phone,
    payload.licenseNumber,
    payload.vehicleType,
    payload.vehiclePlate,
    payload.availabilityStatus,
    payload.ratingAvg,
    payload.isActive
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

async function getById(id) {
  const result = await pool.query('SELECT * FROM driver_profiles WHERE id = $1 LIMIT 1;', [id]);
  return result.rows[0] || null;
}

async function getByEmail(email) {
  const result = await pool.query('SELECT * FROM driver_profiles WHERE email = $1 LIMIT 1;', [email]);
  return result.rows[0] || null;
}

async function getByPhone(phone) {
  const result = await pool.query('SELECT * FROM driver_profiles WHERE phone = $1 LIMIT 1;', [phone]);
  return result.rows[0] || null;
}

async function getByLicenseNumber(licenseNumber) {
  const result = await pool.query('SELECT * FROM driver_profiles WHERE license_number = $1 LIMIT 1;', [licenseNumber]);
  return result.rows[0] || null;
}

async function getByVehiclePlate(vehiclePlate) {
  const result = await pool.query('SELECT * FROM driver_profiles WHERE vehicle_plate = $1 LIMIT 1;', [vehiclePlate]);
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
    `UPDATE driver_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *;`,
    values
  );

  return result.rows[0] || null;
}

async function listAvailableDrivers({ availabilityStatus, vehicleType, limit }) {
  const values = [availabilityStatus, Number(limit || 20)];
  const filters = ['availability_status = $1', 'is_active = TRUE', 'deleted_at IS NULL'];

  if (vehicleType) {
    values.push(vehicleType);
    filters.push(`vehicle_type = $${values.length}`);
  }

  const query = `
    SELECT *
    FROM driver_profiles
    WHERE ${filters.join(' AND ')}
    ORDER BY rating_avg DESC, updated_at DESC
    LIMIT $2;
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function listNearbyDrivers({ latitude, longitude, radiusDegrees, vehicleType, limit }) {
  const values = [latitude, longitude, Number(limit || 20)];
  const filters = [
    'availability_status = \'ONLINE\'',
    'is_active = TRUE',
    'deleted_at IS NULL',
    'current_latitude IS NOT NULL',
    'current_longitude IS NOT NULL'
  ];

  if (radiusDegrees !== null && radiusDegrees !== undefined) {
    values.push(radiusDegrees);
    const radiusIndex = values.length;
    filters.push(`ABS(current_latitude - $1) <= $${radiusIndex}`);
    filters.push(`ABS(current_longitude - $2) <= $${radiusIndex}`);
  }

  if (vehicleType) {
    values.push(vehicleType);
    filters.push(`vehicle_type = $${values.length}`);
  }

  const query = `
    SELECT *,
      POWER(current_latitude - $1, 2) + POWER(current_longitude - $2, 2) AS distance_score
    FROM driver_profiles
    WHERE ${filters.join(' AND ')}
    ORDER BY distance_score ASC, rating_avg DESC, updated_at DESC
    LIMIT $3;
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

module.exports = {
  createDriver,
  getById,
  getByEmail,
  getByPhone,
  getByLicenseNumber,
  getByVehiclePlate,
  updateById,
  listAvailableDrivers,
  listNearbyDrivers
};

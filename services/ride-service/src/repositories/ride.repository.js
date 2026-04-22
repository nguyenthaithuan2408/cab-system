'use strict';
const { getPool } = require('../config/database');

/**
 * Ride Repository - Pure DB Queries
 * Tách biệt hoàn toàn khỏi business logic
 * Áp dụng Repository Pattern để dễ test và swap DB
 */

/**
 * Tạo ride mới trong DB
 * Test Case TC31: Transaction tạo ride - no partial write
 */
async function create(data, client = null) {
  const db = client || getPool();
  const {
    id,
    booking_id,
    user_id,
    driver_id,
    pickup_lat,
    pickup_lng,
    pickup_address,
    drop_lat,
    drop_lng,
    drop_address,
    distance_km,
    estimated_price,
    payment_method,
    eta_minutes,
    status,
  } = data;

  const result = await db.query(
    `INSERT INTO rides (
        id, booking_id, user_id, driver_id,
        pickup_lat, pickup_lng, pickup_address,
        drop_lat, drop_lng, drop_address,
        distance_km, estimated_price, payment_method,
        eta_minutes, status
     ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13,
        $14, $15
     )
     RETURNING *`,
    [
      id,
      booking_id,
      user_id,
      driver_id || null,
      pickup_lat,
      pickup_lng,
      pickup_address || null,
      drop_lat,
      drop_lng,
      drop_address || null,
      distance_km || null,
      estimated_price || null,
      payment_method || 'cash',
      eta_minutes || null,
      status || 'CREATED',
    ]
  );

  return result.rows[0];
}

/**
 * Tìm ride theo ID
 */
async function findById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM rides WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Tìm ride theo booking_id (1-1 relationship)
 */
async function findByBookingId(bookingId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM rides WHERE booking_id = $1`,
    [bookingId]
  );
  return result.rows[0] || null;
}

/**
 * Lấy danh sách rides của user có phân trang
 * Test Case TC4: Lấy danh sách theo user
 */
async function findByUserId(userId, { limit = 20, offset = 0, status } = {}) {
  const pool = getPool();
  const params = [userId, limit, offset];
  let query = `
    SELECT * FROM rides
    WHERE user_id = $1
  `;

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Đếm tổng rides của user
 */
async function countByUserId(userId, { status } = {}) {
  const pool = getPool();
  const params = [userId];
  let query = `SELECT COUNT(*) FROM rides WHERE user_id = $1`;

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Lấy danh sách rides của driver
 */
async function findByDriverId(driverId, { limit = 20, offset = 0, status } = {}) {
  const pool = getPool();
  const params = [driverId, limit, offset];
  let query = `
    SELECT * FROM rides
    WHERE driver_id = $1
  `;

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Cập nhật trạng thái ride
 * Test Case TC27: Status chuyển đổi hợp lệ
 * Test Case TC32: Rollback khi lỗi
 */
async function updateStatus(id, status, extraFields = {}, client = null) {
  const db = client || getPool();

  const allowedExtras = [
    'driver_id',
    'final_price',
    'cancel_reason',
    'assigned_at',
    'pickup_at',
    'started_at',
    'completed_at',
    'cancelled_at',
    'driver_pickup_lat',
    'driver_pickup_lng',
  ];

  const setClauses = ['status = $2', 'updated_at = NOW()'];
  const params = [id, status];

  for (const [key, value] of Object.entries(extraFields)) {
    if (allowedExtras.includes(key) && value !== undefined) {
      params.push(value);
      setClauses.push(`${key} = $${params.length}`);
    }
  }

  const result = await db.query(
    `UPDATE rides
     SET ${setClauses.join(', ')}
     WHERE id = $1
     RETURNING *`,
    params
  );

  return result.rows[0] || null;
}

/**
 * Assign driver vào ride
 */
async function assignDriver(rideId, driverId, client = null) {
  return updateStatus(
    rideId,
    'ASSIGNED',
    {
      driver_id: driverId,
      assigned_at: new Date().toISOString(),
    },
    client
  );
}

/**
 * Xóa ride (chỉ dùng trong tests)
 */
async function deleteById(id) {
  const pool = getPool();
  await pool.query(`DELETE FROM rides WHERE id = $1`, [id]);
}

module.exports = {
  create,
  findById,
  findByBookingId,
  findByUserId,
  countByUserId,
  findByDriverId,
  updateStatus,
  assignDriver,
  deleteById,
};

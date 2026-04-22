'use strict';
const { getPool } = require('../config/database');

/**
 * Booking Repository - Pure DB Queries
 * Tách biệt hoàn toàn khỏi business logic
 * Áp dụng Repository Pattern để dễ test và swap DB
 */

/**
 * Tạo booking mới trong DB
 * Test Case TC31: Transaction tạo booking - no partial write
 * Test Case TC19: Idempotency key - UNIQUE constraint
 */
async function create(data, client = null) {
  const db = client || getPool();
  const {
    id,
    user_id,
    idempotency_key,
    pickup_lat,
    pickup_lng,
    pickup_address,
    drop_lat,
    drop_lng,
    drop_address,
    distance_km,
    estimated_price,
    surge_multiplier,
    eta_minutes,
    payment_method,
    status,
  } = data;

  const result = await db.query(
    `INSERT INTO bookings (
        id, user_id, idempotency_key,
        pickup_lat, pickup_lng, pickup_address,
        drop_lat, drop_lng, drop_address,
        distance_km, estimated_price, surge_multiplier,
        eta_minutes, payment_method, status
     ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15
     )
     RETURNING *`,
    [
      id,
      user_id,
      idempotency_key || null,
      pickup_lat,
      pickup_lng,
      pickup_address || null,
      drop_lat,
      drop_lng,
      drop_address || null,
      distance_km,
      estimated_price || null,
      surge_multiplier || 1.0,
      eta_minutes || null,
      payment_method || 'cash',
      status || 'REQUESTED',
    ]
  );

  return result.rows[0];
}

/**
 * Tìm booking theo ID
 * Test Case TC4: Lấy danh sách booking
 */
async function findById(id) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM bookings WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Tìm booking theo idempotency_key
 * Test Case TC19: Duplicate booking prevention
 * Test Case TC34: Idempotent transaction
 */
async function findByIdempotencyKey(key) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM bookings WHERE idempotency_key = $1`,
    [key]
  );
  return result.rows[0] || null;
}

/**
 * Lấy danh sách booking của user có phân trang
 * Test Case TC4: GET /bookings?user_id=123
 */
async function findByUserId(userId, { limit = 20, offset = 0, status } = {}) {
  const pool = getPool();
  const params = [userId, limit, offset];
  let query = `
    SELECT * FROM bookings
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
 * Đếm tổng booking của user
 */
async function countByUserId(userId, { status } = {}) {
  const pool = getPool();
  const params = [userId];
  let query = `SELECT COUNT(*) FROM bookings WHERE user_id = $1`;

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Cập nhật trạng thái booking
 * Test Case TC27: Status chuyển REQUESTED → ACCEPTED
 * Test Case TC32: Rollback khi lỗi
 */
async function updateStatus(id, status, extraFields = {}, client = null) {
  const db = client || getPool();

  const allowedExtras = [
    'driver_id',
    'final_price',
    'cancel_reason',
    'accepted_at',
    'completed_at',
    'cancelled_at',
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
    `UPDATE bookings
     SET ${setClauses.join(', ')}
     WHERE id = $1
     RETURNING *`,
    params
  );

  return result.rows[0] || null;
}

/**
 * Cập nhật driver_id cho booking
 */
async function assignDriver(bookingId, driverId, client = null) {
  return updateStatus(
    bookingId,
    'ACCEPTED',
    {
      driver_id: driverId,
      accepted_at: new Date().toISOString(),
    },
    client
  );
}

/**
 * Xóa booking (chỉ dùng trong tests)
 */
async function deleteById(id) {
  const pool = getPool();
  await pool.query(`DELETE FROM bookings WHERE id = $1`, [id]);
}

module.exports = {
  create,
  findById,
  findByIdempotencyKey,
  findByUserId,
  countByUserId,
  updateStatus,
  assignDriver,
  deleteById,
};

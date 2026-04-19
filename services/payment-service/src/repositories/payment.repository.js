const { pool } = require('../config/database');

async function createTransaction(payload) {
  const query = `
    INSERT INTO payment_transactions (
      id, booking_id, user_id, amount, currency, payment_method,
      payment_status, transaction_ref, provider_ref, idempotency_key, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *;
  `;

  const values = [
    payload.id,
    payload.bookingId,
    payload.userId,
    payload.amount,
    payload.currency,
    payload.paymentMethod,
    payload.paymentStatus,
    payload.transactionRef,
    payload.providerRef,
    payload.idempotencyKey,
    payload.metadata
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

async function getById(id) {
  const result = await pool.query('SELECT * FROM payment_transactions WHERE id = $1 LIMIT 1;', [id]);
  return result.rows[0] || null;
}

async function getByIdempotencyKey(idempotencyKey) {
  const result = await pool.query(
    'SELECT * FROM payment_transactions WHERE idempotency_key = $1 LIMIT 1;',
    [idempotencyKey]
  );

  return result.rows[0] || null;
}

async function getByTransactionRef(transactionRef) {
  const result = await pool.query('SELECT * FROM payment_transactions WHERE transaction_ref = $1 LIMIT 1;', [transactionRef]);
  return result.rows[0] || null;
}

async function listByBookingId(bookingId) {
  const result = await pool.query(
    'SELECT * FROM payment_transactions WHERE booking_id = $1 ORDER BY created_at DESC;',
    [bookingId]
  );

  return result.rows;
}

async function listByUserId(userId) {
  const result = await pool.query(
    'SELECT * FROM payment_transactions WHERE user_id = $1 ORDER BY created_at DESC;',
    [userId]
  );

  return result.rows;
}

async function updateStatusById(id, status, providerRef = null) {
  const result = await pool.query(
    `
      UPDATE payment_transactions
      SET payment_status = $2,
          provider_ref = COALESCE($3, provider_ref),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `,
    [id, status, providerRef]
  );

  return result.rows[0] || null;
}

async function updateStatusByTransactionRef(transactionRef, status, providerRef = null) {
  const result = await pool.query(
    `
      UPDATE payment_transactions
      SET payment_status = $2,
          provider_ref = COALESCE($3, provider_ref),
          updated_at = NOW()
      WHERE transaction_ref = $1
      RETURNING *;
    `,
    [transactionRef, status, providerRef]
  );

  return result.rows[0] || null;
}

module.exports = {
  createTransaction,
  getById,
  getByIdempotencyKey,
  getByTransactionRef,
  listByBookingId,
  listByUserId,
  updateStatusById,
  updateStatusByTransactionRef
};

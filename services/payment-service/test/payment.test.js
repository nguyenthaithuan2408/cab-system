'use strict';

/**
 * Payment Service — Automated Test Suite (Jest + Supertest)
 *
 * Root causes of fixed failures:
 *   - No idempotencyKey → service skips getByIdempotencyKey → only 1 pool.query (INSERT)
 *   - PATCH /:id/status → pool.query called for updateStatusById, not getById first
 *   - GET /payments/non-existent-path matches GET /:id route (not 404)
 *   - TC34 idempotency: getByIdempotencyKey internally uses pool.query, health check does not
 *
 * TC Coverage: TC#14, TC#33, TC#34, TC#101-102
 */

process.env.NODE_ENV = 'test';
process.env.SERVICE_NAME = 'payment-service';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_payment';

// Mock pool trước khi app load (biến bắt đầu bằng "mock" được Jest hoist an toàn)
const mockPool = { query: jest.fn(), connect: jest.fn(), end: jest.fn() };

jest.mock('../src/config/database', () => ({
  pool: mockPool,
  connectDatabase: jest.fn().mockResolvedValue(true),
  initSchema: jest.fn().mockResolvedValue(true),
  closeDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/events/payment.producer', () => ({
  publishPaymentCreated: jest.fn(),
  publishPaymentStatusChanged: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');
const paymentProducer = require('../src/events/payment.producer');

// ── Fixtures ──────────────────────────────────────────────────────────────
const BOOKING_ID = 'BK-001';
const USER_ID    = 'USR-001';
const TXN_ID     = 'TXN-001';
const IDEM_KEY   = 'idem-test-001';

const validBody = {
  bookingId: BOOKING_ID,
  userId: USER_ID,
  amount: 50000,
  currency: 'VND',
  paymentMethod: 'CASH',
};

const pendingRow = {
  id: TXN_ID,
  booking_id: BOOKING_ID,
  user_id: USER_ID,
  amount: 50000,
  currency: 'VND',
  payment_method: 'CASH',
  payment_status: 'PENDING',
  transaction_ref: 'TXN-1700000000-ABCD',
  provider_ref: null,
  idempotency_key: null,
  metadata: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => { jest.clearAllMocks(); });

// =============================================================================
// TC#101-102 — Health check
// =============================================================================
describe('TC#101-102 — GET /health → 200', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data.service).toMatch(/payment/i);
  });
});

// =============================================================================
// TC#14 — Invalid payment method → 400, no DB call, no Kafka
// =============================================================================
describe('TC#14 — POST /payments invalid payment method → 400', () => {
  test('TC14: BITCOIN → 400', async () => {
    const res = await request(app)
      .post('/payments')
      .send({ ...validBody, paymentMethod: 'BITCOIN' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('TC14: invalid_card → 400', async () => {
    const res = await request(app)
      .post('/payments')
      .send({ ...validBody, paymentMethod: 'invalid_card' });
    expect(res.status).toBe(400);
  });

  test('TC14: pool.query NOT called for invalid method', async () => {
    await request(app).post('/payments').send({ ...validBody, paymentMethod: 'PAYPAL' });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('TC14: publishPaymentCreated NOT called for invalid method', async () => {
    await request(app).post('/payments').send({ ...validBody, paymentMethod: 'INVALID' });
    expect(paymentProducer.publishPaymentCreated).not.toHaveBeenCalled();
  });

  // Happy path — no idempotencyKey → service skips getByIdempotencyKey
  // → only 1 pool.query call (INSERT)
  test('TC14: valid CASH → 201', async () => {
    pool.query.mockResolvedValueOnce({ rows: [pendingRow] }); // only INSERT
    const res = await request(app).post('/payments').send(validBody);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentStatus).toBe('PENDING');
  });

  test('TC14: valid CARD → 201', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...pendingRow, payment_method: 'CARD' }] });
    const res = await request(app)
      .post('/payments')
      .send({ ...validBody, paymentMethod: 'CARD' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC14: valid WALLET → 201', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...pendingRow, payment_method: 'WALLET' }] });
    const res = await request(app)
      .post('/payments')
      .send({ ...validBody, paymentMethod: 'WALLET' });
    expect([200, 201]).toContain(res.status);
  });
});

// =============================================================================
// TC#33 — Payment failure → không charge
// =============================================================================
describe('TC#33 — Payment thất bại → không charge tiền', () => {
  test('TC33: amount=0 → 400, pool.query không gọi', async () => {
    const res = await request(app).post('/payments').send({ ...validBody, amount: 0 });
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('TC33: amount âm → 400', async () => {
    const res = await request(app).post('/payments').send({ ...validBody, amount: -100 });
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('TC33: missing bookingId → 400', async () => {
    const { bookingId, ...rest } = validBody;
    const res = await request(app).post('/payments').send(rest);
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('TC33: missing userId → 400', async () => {
    const { userId, ...rest } = validBody;
    const res = await request(app).post('/payments').send(rest);
    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  // Saga: webhook FAILED → trả FAILED, publish event
  // updateStatusByTransactionRef → 1 pool.query call (UPDATE RETURNING)
  test('TC33: webhook FAILED → paymentStatus=FAILED + publish event', async () => {
    const failedRow = { ...pendingRow, payment_status: 'FAILED', transaction_ref: 'TXN-SAGA-01' };
    pool.query.mockResolvedValueOnce({ rows: [failedRow] }); // UPDATE RETURNING

    const res = await request(app)
      .post('/payments/webhook/payment-result')
      .send({ transactionRef: 'TXN-SAGA-01', paymentStatus: 'FAILED', providerRef: 'ERR-1' });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe('FAILED');
    expect(paymentProducer.publishPaymentStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({ paymentStatus: 'FAILED' })
    );
  });

  test('TC33: webhook missing transactionRef → 400', async () => {
    const res = await request(app)
      .post('/payments/webhook/payment-result')
      .send({ paymentStatus: 'FAILED' });
    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC#34 — Idempotent: không double charge
// =============================================================================
describe('TC#34 — Idempotent transaction: cùng key không double charge', () => {
  test('TC34: idempotencyKey exists → getByIdempotencyKey returns existing, NO INSERT', async () => {
    const existingRow = { ...pendingRow, idempotency_key: IDEM_KEY };
    // Service calls getByIdempotencyKey → pool.query returns existing → early return
    pool.query.mockResolvedValueOnce({ rows: [existingRow] }); // 1 call only

    const res = await request(app)
      .post('/payments')
      .set('idempotency-key', IDEM_KEY)
      .send(validBody);

    expect([200, 201]).toContain(res.status);
    expect(pool.query).toHaveBeenCalledTimes(1); // only getByIdempotencyKey
    expect(paymentProducer.publishPaymentCreated).not.toHaveBeenCalled();
  });

  test('TC34: idempotencyKey not found → CREATE new (2 pool.query calls)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })           // getByIdempotencyKey → miss
      .mockResolvedValueOnce({ rows: [pendingRow] }); // INSERT RETURNING

    const res = await request(app)
      .post('/payments')
      .set('idempotency-key', IDEM_KEY)
      .send(validBody);

    expect([200, 201]).toContain(res.status);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(paymentProducer.publishPaymentCreated).toHaveBeenCalledTimes(1);
  });

  test('TC34: replay returns same id as original (no double charge)', async () => {
    const existing = { ...pendingRow, idempotency_key: IDEM_KEY };

    // First: cache miss → create
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [existing] });
    const first = await request(app)
      .post('/payments').set('idempotency-key', IDEM_KEY).send(validBody);
    const firstId = first.body.data.id;

    jest.clearAllMocks();

    // Second: cache hit → replay
    pool.query.mockResolvedValueOnce({ rows: [existing] });
    const second = await request(app)
      .post('/payments').set('idempotency-key', IDEM_KEY).send(validBody);

    expect(second.body.data.id).toBe(firstId);
    expect(pool.query).toHaveBeenCalledTimes(1); // only lookup, no INSERT
    expect(paymentProducer.publishPaymentCreated).not.toHaveBeenCalled();
  });
});

// =============================================================================
// POST /payments/charge
// =============================================================================
describe('POST /payments/charge — happy path', () => {
  test('should create PENDING transaction and publish event', async () => {
    pool.query.mockResolvedValueOnce({ rows: [pendingRow] });

    const res = await request(app).post('/payments/charge').send(validBody);

    expect([200, 201]).toContain(res.status);
    expect(res.body.data.paymentStatus).toBe('PENDING');
    expect(paymentProducer.publishPaymentCreated).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: BOOKING_ID, paymentStatus: 'PENDING' })
    );
  });
});

// =============================================================================
// PATCH /payments/:id/status
// Note: updatePaymentStatus calls pool.query for UPDATE, NOT getById first
// =============================================================================
describe('PATCH /payments/:id/status', () => {
  test('should update to SUCCESS → 200 + publish event', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ ...pendingRow, payment_status: 'SUCCESS' }],
    });

    const res = await request(app)
      .patch(`/payments/${TXN_ID}/status`)
      .send({ paymentStatus: 'SUCCESS', providerRef: 'STRIPE-001' });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe('SUCCESS');
    expect(paymentProducer.publishPaymentStatusChanged).toHaveBeenCalled();
  });

  test('should return 400 for invalid status MAGIC', async () => {
    const res = await request(app)
      .patch(`/payments/${TXN_ID}/status`)
      .send({ paymentStatus: 'MAGIC' });
    expect(res.status).toBe(400);
  });

  test('should return 404 when transaction not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE returns no rows
    const res = await request(app)
      .patch(`/payments/${TXN_ID}/status`)
      .send({ paymentStatus: 'SUCCESS' });
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// GET /payments/by-booking/:bookingId
// =============================================================================
describe('GET /payments/by-booking/:bookingId', () => {
  test('should return list of transactions', async () => {
    pool.query.mockResolvedValueOnce({ rows: [pendingRow] });
    const res = await request(app).get(`/payments/by-booking/${BOOKING_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].bookingId).toBe(BOOKING_ID);
  });

  test('should return empty array when no payments', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/payments/by-booking/NONE');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// =============================================================================
// 404 — chỉ áp dụng cho route THỰC SỰ không tồn tại
// (GET /payments/xyz bị match bởi /:id — dùng path ngoài /payments)
// =============================================================================
describe('TC#104 — Completely unknown route returns 404', () => {
  test('GET /unknown-root → 404', async () => {
    const res = await request(app).get('/completely-unknown-root-path');
    expect(res.status).toBe(404);
  });

  test('POST /unknown-root → 404', async () => {
    const res = await request(app).post('/no-such-resource');
    expect(res.status).toBe(404);
  });
});

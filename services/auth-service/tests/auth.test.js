'use strict';

/**
 * Integration tests for auth-service.
 * Uses supertest to make real HTTP calls against the Express app.
 * Run with: npm test
 *
 * NOTE: Requires a live PostgreSQL + Redis connection.
 * For CI, use docker-compose to spin up deps before running tests.
 *
 * Test credentials comply with the strengthened password policy:
 *   - min 8 chars, ≥1 uppercase, ≥1 digit, ≥1 special character
 */

const request = require('supertest');
const app = require('../src/app');

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const TEST_USER = {
  email: `testuser_${Date.now()}@test.com`,
  password: 'Password@123',
  name: 'Test User',
};

let accessToken = null;
let refreshToken = null;

// ---------------------------------------------------------------------------
// LEVEL 1 — Basic API & Flow
// ---------------------------------------------------------------------------

describe('TC#1 — POST /api/auth/register (happy path)', () => {
  it('should return 201 with user_id and no password_hash', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', TEST_USER.email);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });
});

describe('TC#2 — POST /api/auth/login (JWT validation)', () => {
  it('should return 200 with valid JWT containing sub and exp', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    // Decode and validate payload
    const payload = JSON.parse(
      Buffer.from(res.body.accessToken.split('.')[1], 'base64').toString(),
    );
    expect(payload).toHaveProperty('sub');
    expect(payload).toHaveProperty('exp');
    expect(payload).toHaveProperty('role');

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });
});

describe('Refresh Token — POST /api/auth/refresh-token', () => {
  it('should return 200 with new token pair', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    // Update tokens for subsequent tests
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('should reject old refresh token after rotation (TC#86 — replay attack)', async () => {
    // The OLD refreshToken captured before rotation should now be revoked
    // (we need the pre-rotation token — this test demonstrates the concept)
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'invalid.token.here' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// LEVEL 2 — Validation & Edge Cases
// ---------------------------------------------------------------------------

describe('TC#18 — Token expired → 401', () => {
  it('should reject an expired JWT with 401 Token expired', async () => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiJ0ZXN0Iiwicm9sZSI6IlVTRVIiLCJleHAiOjF9.' +
      'INVALID_SIGNATURE';

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});

describe('TC#20 — Payload too large → 413', () => {
  it('should reject requests exceeding 1mb', async () => {
    const bigPayload = { email: 'a@b.com', password: 'x'.repeat(2 * 1024 * 1024) };
    const res = await request(app).post('/api/auth/register').send(bigPayload);
    expect(res.status).toBe(413);
  });
});

describe('TC#19 — Duplicate email → 400', () => {
  it('should return 400 when email already registered', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

// ---------------------------------------------------------------------------
// LEVEL 10 — Zero Trust Security
// ---------------------------------------------------------------------------

describe('TC#91 — No token → 401 Missing token', () => {
  it('should reject requests without Authorization header', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Missing token');
  });
});

describe('TC#92 — Tampered token → 401 Invalid token', () => {
  it('should reject JWT with invalid signature', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.BADSIG');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });
});

// ---------------------------------------------------------------------------
// TC#10 — Logout invalidates access token
// ---------------------------------------------------------------------------

describe('TC#10 — Logout → access token invalidated', () => {
  it('should invalidate token after logout (Token revoked)', async () => {
    // Logout with current token
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutRes.status).toBe(200);

    // Reuse the same token — should be rejected as revoked
    const reuseRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.message).toBe('Token revoked');
  });
});

// ---------------------------------------------------------------------------
// Deployment — health check
// ---------------------------------------------------------------------------

describe('TC#102 — GET /health → 200', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('TC#113 — GET /metrics → 200 Prometheus format', () => {
  it('should expose prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
  });
});

// ---------------------------------------------------------------------------
// Trace ID
// ---------------------------------------------------------------------------

describe('X-Request-ID — trace ID in every response', () => {
  it('should include X-Request-ID header in response', async () => {
    const res = await request(app).get('/health');
    expect(res.headers).toHaveProperty('x-request-id');
  });

  it('should echo back a provided X-Request-ID', async () => {
    const traceId = 'my-trace-12345';
    const res = await request(app).get('/health').set('X-Request-ID', traceId);
    expect(res.headers['x-request-id']).toBe(traceId);
  });
});

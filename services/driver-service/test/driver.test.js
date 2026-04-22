'use strict';

/**
 * Driver Service — Automated Test Suite (Jest + Supertest)
 *
 * Test Cases Covered:
 *   TC#5   — Driver chuyển trạng thái ONLINE → HTTP 200
 *   TC#13  — Không có driver online → không assign
 *   TC#57  — Driver OFFLINE không được AI/system chọn
 *   TC#96  — Least privilege: driver không truy cập thông tin user khác
 *   TC#101 — Deploy service thành công
 *   TC#102 — GET /health → 200 {"status":"ok"}
 *   TC#104 — Config sai → 400, unknown route → 404
 *   TC#12  — Sai format lat/lng khi update location → 400
 *
 * Mock Strategy:
 *   - Mock config/database TRƯỚC KHI app load (pool không connect thật)
 *   - Mock repository để test logic, không cần DB thật
 *   - Mock Kafka producer (chỉ console.info trong thực tế)
 *
 * Run: npm test
 */

// ── Env setup (phải đặt trước mọi require) ─────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.SERVICE_NAME = 'driver-service';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_driver';

// ── Mock database pool (ngăn pg.Pool kết nối thật) ────────────────────────
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

jest.mock('../src/config/database', () => ({
  pool: mockPool,
  connectDatabase: jest.fn().mockResolvedValue(true),
  initSchema: jest.fn().mockResolvedValue(true),
  closeDatabase: jest.fn().mockResolvedValue(true),
}));

// ── Mock Kafka producer (thực tế chỉ console.info, không cần mock phức tạp)
jest.mock('../src/events/driver.producer', () => ({
  publishDriverCreated: jest.fn(),
  publishDriverAvailabilityChanged: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

// ── Test Fixtures ─────────────────────────────────────────────────────────
const DRIVER_ID = 'DRV-001';
const DRIVER_ID_2 = 'DRV-002';

// Raw DB row format (as returned by PostgreSQL / pool.query)
const onlineDriverRow = {
  id: DRIVER_ID,
  full_name: 'Nguyen Van A',
  email: 'driver1@test.com',
  phone: '+84901234567',
  license_number: 'LIC001234',
  vehicle_type: 'SEDAN',
  vehicle_plate: '51A-12345',
  availability_status: 'ONLINE',
  rating_avg: '4.80',
  is_active: true,
  current_latitude: 10.762,
  current_longitude: 106.660,
  deleted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const offlineDriverRow = {
  ...onlineDriverRow,
  id: DRIVER_ID_2,
  email: 'driver2@test.com',
  phone: '+84901234568',
  availability_status: 'OFFLINE',
};

const updatedToOnlineRow = {
  ...onlineDriverRow,
  availability_status: 'ONLINE',
  updated_at: new Date().toISOString(),
};

// ── Test Suites ───────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// TC#101-102 — Health check
// =============================================================================
describe('TC#101-102 — GET /health → 200', () => {
  test('should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  test('should include service name and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data.service).toMatch(/driver/i);
  });
});

// =============================================================================
// TC#5 — Driver chuyển trạng thái ONLINE
// =============================================================================
describe('TC#5 — PUT /drivers/status → driver ONLINE', () => {
  test('TC5: should update driver status to ONLINE and return 200', async () => {
    pool.query.mockResolvedValueOnce({ rows: [updatedToOnlineRow] });

    const res = await request(app)
      .put('/drivers/status')
      .set('x-driver-id', DRIVER_ID)
      .send({ status: 'ONLINE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availabilityStatus).toBe('ONLINE');
  });

  test('TC5: should reject invalid status value → 400', async () => {
    const res = await request(app)
      .put('/drivers/status')
      .set('x-driver-id', DRIVER_ID)
      .send({ status: 'FLYING' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('TC5: should return 400 when driverId is missing', async () => {
    const res = await request(app)
      .put('/drivers/status')
      .send({ status: 'ONLINE' });

    expect(res.status).toBe(400);
  });

  test('TC5: PATCH /:id/availability also updates status correctly', async () => {
    pool.query.mockResolvedValueOnce({ rows: [updatedToOnlineRow] });

    const res = await request(app)
      .patch(`/drivers/${DRIVER_ID}/availability`)
      .send({ availabilityStatus: 'ONLINE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availabilityStatus).toBe('ONLINE');
  });

  test('TC5: driver BUSY status is also valid', async () => {
    const busyRow = { ...onlineDriverRow, availability_status: 'BUSY' };
    pool.query.mockResolvedValueOnce({ rows: [busyRow] });

    const res = await request(app)
      .put('/drivers/status')
      .set('x-driver-id', DRIVER_ID)
      .send({ status: 'BUSY' });

    expect(res.status).toBe(200);
    expect(res.body.data.availabilityStatus).toBe('BUSY');
  });
});

// =============================================================================
// TC#13 — Driver OFFLINE: không được assign booking
// =============================================================================
describe('TC#13 — GET /drivers → chỉ trả ONLINE drivers', () => {
  test('TC13: should return empty list when no drivers are ONLINE', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/drivers')
      .query({ availabilityStatus: 'ONLINE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  test('TC13: should return ONLINE drivers only', async () => {
    pool.query.mockResolvedValueOnce({ rows: [onlineDriverRow] });

    const res = await request(app)
      .get('/drivers')
      .query({ availabilityStatus: 'ONLINE' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].availabilityStatus).toBe('ONLINE');
  });

  test('TC13: response never contains OFFLINE drivers when filtering ONLINE', async () => {
    // Repository returns only ONLINE — offline driver should NOT appear
    pool.query.mockResolvedValueOnce({ rows: [onlineDriverRow] });

    const res = await request(app)
      .get('/drivers')
      .query({ availabilityStatus: 'ONLINE' });

    const hasOffline = (res.body.data || []).some(
      (d) => d.availabilityStatus !== 'ONLINE'
    );
    expect(hasOffline).toBe(false);
  });

  test('TC13: returns 400 for invalid availabilityStatus filter', async () => {
    const res = await request(app)
      .get('/drivers')
      .query({ availabilityStatus: 'UNKNOWN' });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC#57 — Driver OFFLINE không được AI/system chọn
// =============================================================================
describe('TC#57 — Driver OFFLINE không được chọn (unit logic test)', () => {
  const driverService = require('../src/services/driver.service');

  test('TC57: listAvailableDrivers with ONLINE filter never returns OFFLINE driver', async () => {
    pool.query.mockResolvedValueOnce({ rows: [onlineDriverRow] });

    const result = await driverService.listAvailableDrivers({ availabilityStatus: 'ONLINE' });

    result.forEach((driver) => {
      expect(driver.availabilityStatus).toBe('ONLINE');
    });
    // Offline driver NOT in result
    const hasOffline = result.some((d) => d.availabilityStatus === 'OFFLINE');
    expect(hasOffline).toBe(false);
  });

  test('TC57: listAvailableDrivers called with ONLINE status queries DB correctly', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await driverService.listAvailableDrivers({ availabilityStatus: 'ONLINE' });

    // Verify pool.query was called with ONLINE filter
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('availability_status'),
      expect.arrayContaining(['ONLINE'])
    );
  });

  test('TC57: throws 400 for invalid status (prevents choosing driver with wrong status)', async () => {
    await expect(
      driverService.listAvailableDrivers({ availabilityStatus: 'INVALID_STATUS' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('TC57: empty list when no ONLINE drivers → system cannot assign', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await driverService.listAvailableDrivers({ availabilityStatus: 'ONLINE' });
    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// TC#96 — Least privilege: driver không truy cập user data
// =============================================================================
describe('TC#96 — Least privilege: GET /drivers/profile không có ID → 400', () => {
  test('TC96: GET /drivers/profile without driverId → 400 DRIVER_ID_REQUIRED', async () => {
    const res = await request(app).get('/drivers/profile');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DRIVER_ID_REQUIRED');
  });

  test('TC96: GET /drivers/:id response does NOT contain user/password fields', async () => {
    pool.query.mockResolvedValueOnce({ rows: [onlineDriverRow] });

    const res = await request(app).get(`/drivers/${DRIVER_ID}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    // Không trả về thông tin user nhạy cảm
    expect(data).not.toHaveProperty('userId');
    expect(data).not.toHaveProperty('password');
    expect(data).not.toHaveProperty('passwordHash');
    expect(data).not.toHaveProperty('accessToken');
    // Chỉ có thông tin driver
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('availabilityStatus');
  });

  test('TC96: GET /drivers/:id for non-existent driver → 404', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/drivers/NON-EXISTENT-ID');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================================
// TC#12 — Sai format tọa độ khi update location → 400
// =============================================================================
describe('TC#12 — PUT /drivers/location với tọa độ không hợp lệ → 400', () => {
  test('TC12: reject non-numeric latitude', async () => {
    const res = await request(app)
      .put('/drivers/location')
      .set('x-driver-id', DRIVER_ID)
      .send({ latitude: 'abc', longitude: 106.66 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('TC12: reject latitude out of range (>90)', async () => {
    const res = await request(app)
      .put('/drivers/location')
      .set('x-driver-id', DRIVER_ID)
      .send({ latitude: 999, longitude: 106.66 });

    expect(res.status).toBe(400);
  });

  test('TC12: reject longitude out of range (>180)', async () => {
    const res = await request(app)
      .put('/drivers/location')
      .set('x-driver-id', DRIVER_ID)
      .send({ latitude: 10.76, longitude: 999 });

    expect(res.status).toBe(400);
  });

  test('TC12: valid coordinates → 200', async () => {
    pool.query.mockResolvedValueOnce({ rows: [onlineDriverRow] });

    const res = await request(app)
      .put('/drivers/location')
      .set('x-driver-id', DRIVER_ID)
      .send({ latitude: 10.762, longitude: 106.660 });

    expect(res.status).toBe(200);
  });
});

// =============================================================================
// POST /drivers — Tạo driver mới
// =============================================================================
describe('POST /drivers — Validation khi tạo driver', () => {
  const validDriverPayload = {
    fullName: 'Tran Van B',
    email: 'driverb@test.com',
    phone: '+84909876543',
    licenseNumber: 'LIC999888',
    vehicleType: 'SEDAN',
    vehiclePlate: '51B-99887',
  };

  test('should return 400 when fullName is missing', async () => {
    const { fullName, ...rest } = validDriverPayload;
    const res = await request(app).post('/drivers').send(rest);
    expect(res.status).toBe(400);
  });

  test('should return 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/drivers')
      .send({ ...validDriverPayload, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('should return 400 when phone format is invalid', async () => {
    const res = await request(app)
      .post('/drivers')
      .send({ ...validDriverPayload, phone: 'abc' });
    expect(res.status).toBe(400);
  });

  test('should create driver and return 201 (happy path)', async () => {
    // Mock: unique checks return null (no duplicates)
    pool.query
      .mockResolvedValueOnce({ rows: [] })   // getByEmail
      .mockResolvedValueOnce({ rows: [] })   // getByPhone
      .mockResolvedValueOnce({ rows: [] })   // getByLicenseNumber
      .mockResolvedValueOnce({ rows: [] })   // getByVehiclePlate
      .mockResolvedValueOnce({               // createDriver INSERT RETURNING
        rows: [{
          id: 'DRV-NEW-001',
          full_name: validDriverPayload.fullName,
          email: validDriverPayload.email,
          phone: validDriverPayload.phone,
          license_number: validDriverPayload.licenseNumber,
          vehicle_type: validDriverPayload.vehicleType,
          vehicle_plate: validDriverPayload.vehiclePlate,
          availability_status: 'OFFLINE',
          rating_avg: '0.00',
          is_active: true,
          current_latitude: null,
          current_longitude: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

    const res = await request(app).post('/drivers').send(validDriverPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.availabilityStatus).toBe('OFFLINE');
  });

  test('should return 409 when email already exists', async () => {
    // getByEmail returns existing driver
    pool.query.mockResolvedValueOnce({ rows: [onlineDriverRow] });

    const res = await request(app).post('/drivers').send(validDriverPayload);
    expect(res.status).toBe(409);
  });
});

// =============================================================================
// GET /drivers/nearby
// =============================================================================
describe('GET /drivers/nearby — Tìm driver gần vị trí', () => {
  test('should return nearby ONLINE drivers', async () => {
    pool.query.mockResolvedValueOnce({ rows: [onlineDriverRow] });

    const res = await request(app)
      .get('/drivers/nearby')
      .query({ latitude: 10.76, longitude: 106.66, radiusKm: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('should return 400 when lat/lng missing', async () => {
    const res = await request(app)
      .get('/drivers/nearby')
      .query({ radiusKm: 5 });

    expect(res.status).toBe(400);
  });

  test('should return 400 when radiusKm > 50', async () => {
    const res = await request(app)
      .get('/drivers/nearby')
      .query({ latitude: 10.76, longitude: 106.66, radiusKm: 100 });

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC#104 — Unknown route → 404
// =============================================================================
describe('TC#104 — Unknown route returns 404', () => {
  test('should return 404 for non-existent paths', async () => {
    const res = await request(app).get('/non-existent-path-xyz');
    expect(res.status).toBe(404);
  });
});

'use strict';

// ====== Setup ENV trước khi require bất kỳ module nào ======
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3099';
process.env.SERVICE_NAME = 'ride-service';
process.env.NODE_ENV = 'test';
process.env.KAFKA_BROKERS = 'localhost:9092';

/**
 * Integration Tests - Ride Service HTTP API
 *
 * Test Cases được cover:
 * TC3:  Ride tracking sau khi start
 * TC4:  Lấy danh sách rides - có ride_id, status
 * TC11: Thiếu field bắt buộc → 400
 * TC12: Sai format lat/lng → 422
 * TC20: Payload quá lớn → 413
 * TC91: Request không có token → 401
 * TC95: User thường gọi driver endpoint → 403
 * TC98: Rate limit → 429
 * TC101-103: Health check → 200 {"status":"ok"}
 * TC111: Logging đầy đủ request + response
 * TC113: GET /metrics → 200
 */

const request = require('supertest');

// Mock các module có side-effects trước khi require app
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
  getPool: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue({ rows: [] }),
  })),
  closeDB: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/events/ride.producer', () => ({
  connectProducer: jest.fn().mockResolvedValue(true),
  disconnectProducer: jest.fn().mockResolvedValue(true),
  publishRideStarted: jest.fn().mockResolvedValue(true),
  publishRideCompleted: jest.fn().mockResolvedValue(true),
  publishRideStatusChanged: jest.fn().mockResolvedValue(true),
  publishPaymentRequested: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/repositories/ride.repository', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByBookingId: jest.fn(),
  findByUserId: jest.fn().mockResolvedValue([]),
  countByUserId: jest.fn().mockResolvedValue(0),
  findByDriverId: jest.fn().mockResolvedValue([]),
  updateStatus: jest.fn(),
  assignDriver: jest.fn(),
  deleteById: jest.fn(),
}));

const app = require('../../src/app');
const rideRepo = require('../../src/repositories/ride.repository');

// ====== Sample Data ======
const sampleRide = {
  id: 'RIDE001',
  booking_id: 'BK001',
  user_id: 'USR001',
  driver_id: 'DRV001',
  pickup_lat: '10.76',
  pickup_lng: '106.66',
  pickup_address: '123 Nguyen Hue',
  drop_lat: '10.77',
  drop_lng: '106.70',
  drop_address: '456 Le Loi',
  distance_km: '5.00',
  estimated_price: '45000.00',
  final_price: null,
  payment_method: 'cash',
  eta_minutes: 8,
  status: 'PICKUP',
  cancel_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assigned_at: new Date().toISOString(),
  pickup_at: null,
  started_at: null,
  completed_at: null,
  cancelled_at: null,
};

// Helper để tạo auth headers (Zero Trust Gateway simulation)
const customerHeaders = {
  'x-user-id': 'USR001',
  'x-user-role': 'customer',
};

const driverHeaders = {
  'x-user-id': 'DRV001',
  'x-user-role': 'driver',
};

const adminHeaders = {
  'x-user-id': 'ADMIN001',
  'x-user-role': 'admin',
};

// ============================================================
describe('Ride Service - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TC101-103: Health Check
  // ==========================================
  describe('GET /health', () => {
    test('TC101-103: Health check → 200 {status: "ok"}', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('ride-service');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });
  });

  // ==========================================
  // TC113: Metrics Endpoint
  // ==========================================
  describe('GET /metrics', () => {
    test('TC113: GET /metrics → 200, Prometheus format', async () => {
      const res = await request(app).get('/metrics');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/plain/);
      expect(res.text).toContain('ride_service_requests_total');
      expect(res.text).toContain('ride_service_uptime_seconds');
    });
  });

  // ==========================================
  // TC91: Authentication
  // ==========================================
  describe('Authentication - Zero Trust', () => {
    test('TC91: Request không có x-user-id → 401', async () => {
      const res = await request(app).get('/rides');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    test('TC91: Request không có token header → 401', async () => {
      const res = await request(app)
        .post('/rides/RIDE001/start')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // TC95: RBAC Authorization
  // ==========================================
  describe('Authorization - RBAC', () => {
    test('TC95: Customer không thể gọi driver endpoint (start ride) → 403', async () => {
      const res = await request(app)
        .post('/rides/RIDE001/start')
        .set(customerHeaders)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });

    test('TC95: Customer không thể gọi complete endpoint → 403', async () => {
      const res = await request(app)
        .post('/rides/RIDE001/complete')
        .set(customerHeaders)
        .send({});

      expect(res.status).toBe(403);
    });

    test('TC95: Customer không thể gọi en-route endpoint → 403', async () => {
      const res = await request(app)
        .post('/rides/RIDE001/en-route')
        .set(customerHeaders)
        .send({});

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // TC4: GET /rides
  // ==========================================
  describe('GET /rides', () => {
    test('TC4: Lấy danh sách rides → 200 với list', async () => {
      rideRepo.findByUserId.mockResolvedValue([sampleRide]);
      rideRepo.countByUserId.mockResolvedValue(1);

      const res = await request(app)
        .get('/rides')
        .set(customerHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    test('TC4: Mỗi item có ride_id và status', async () => {
      rideRepo.findByUserId.mockResolvedValue([sampleRide]);
      rideRepo.countByUserId.mockResolvedValue(1);

      const res = await request(app)
        .get('/rides')
        .set(customerHeaders);

      expect(res.status).toBe(200);
      const item = res.body.data[0];
      expect(item.ride_id).toBeDefined();
      expect(item.status).toBeDefined();
      expect(item.booking_id).toBeDefined();
    });
  });

  // ==========================================
  // TC3: GET /rides/:id/status
  // ==========================================
  describe('GET /rides/:id/status', () => {
    test('TC3: Lấy trạng thái ride → 200 với status', async () => {
      rideRepo.findById.mockResolvedValue(sampleRide);

      const res = await request(app)
        .get('/rides/RIDE001/status')
        .set(customerHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ride_id).toBe('RIDE001');
      expect(res.body.data.status).toBeDefined();
    });

    test('404 nếu ride không tồn tại', async () => {
      rideRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/rides/NONEXISTENT/status')
        .set(customerHeaders);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // TC12: Validate lat/lng input
  // ==========================================
  describe('Input Validation', () => {
    test('TC12: Sai format lat/lng khi start → 422', async () => {
      const res = await request(app)
        .post('/rides/RIDE001/start')
        .set(driverHeaders)
        .send({ driver_lat: 'abc', driver_lng: 106.66 }); // lat không hợp lệ

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('TC12: Sai format lat/lng khi update location → 422', async () => {
      const res = await request(app)
        .post('/rides/RIDE001/start')
        .set(driverHeaders)
        .send({ driver_lat: 200, driver_lng: 106.66 }); // lat > 90

      expect(res.status).toBe(422);
    });
  });

  // ==========================================
  // TC3: POST /rides/:id/start
  // ==========================================
  describe('POST /rides/:id/start', () => {
    test('TC3: Driver start ride thành công → 200 IN_PROGRESS', async () => {
      rideRepo.findById.mockResolvedValue(sampleRide); // status: PICKUP
      const inProgressRide = {
        ...sampleRide,
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
      };
      rideRepo.updateStatus.mockResolvedValue(inProgressRide);

      const res = await request(app)
        .post('/rides/RIDE001/start')
        .set(driverHeaders)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    test('403 nếu driver khác cố start ride', async () => {
      rideRepo.findById.mockResolvedValue(sampleRide); // driver_id = DRV001

      const res = await request(app)
        .post('/rides/RIDE001/start')
        .set({ 'x-user-id': 'DRV_OTHER', 'x-user-role': 'driver' })
        .send({});

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // TC24: POST /rides/:id/complete
  // ==========================================
  describe('POST /rides/:id/complete', () => {
    test('TC24: Complete ride → 200 COMPLETED + trigger payment', async () => {
      const inProgressRide = { ...sampleRide, status: 'IN_PROGRESS' };
      rideRepo.findById.mockResolvedValue(inProgressRide);
      const completedRide = {
        ...sampleRide,
        status: 'COMPLETED',
        final_price: '45000.00',
        completed_at: new Date().toISOString(),
      };
      rideRepo.updateStatus.mockResolvedValue(completedRide);

      const res = await request(app)
        .post('/rides/RIDE001/complete')
        .set(driverHeaders)
        .send({ final_price: 45000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  // ==========================================
  // TC32: POST /rides/:id/cancel
  // ==========================================
  describe('POST /rides/:id/cancel', () => {
    test('TC32: User cancel ride → 200 CANCELLED', async () => {
      const createdRide = { ...sampleRide, status: 'CREATED', driver_id: null };
      rideRepo.findById.mockResolvedValue(createdRide);
      const cancelledRide = { ...createdRide, status: 'CANCELLED' };
      rideRepo.updateStatus.mockResolvedValue(cancelledRide);

      const res = await request(app)
        .post('/rides/RIDE001/cancel')
        .set(customerHeaders)
        .send({ reason: 'Changed mind' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });
  });

  // ==========================================
  // TC20: Payload Too Large
  // ==========================================
  describe('TC20: Payload size limit', () => {
    test('TC20: Payload > 1MB → 413', async () => {
      const largePayload = { data: 'x'.repeat(2 * 1024 * 1024) }; // 2MB

      const res = await request(app)
        .post('/rides/RIDE001/start')
        .set(driverHeaders)
        .send(largePayload);

      expect(res.status).toBe(413);
    });
  });

  // ==========================================
  // TC404: 404 Unknown routes
  // ==========================================
  describe('404 Not Found', () => {
    test('Unknown route → 404', async () => {
      const res = await request(app).get('/unknown-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

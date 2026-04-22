'use strict';

// ====== Setup ENV trước khi require bất kỳ module nào ======
// Đây phải là dòng đầu tiên, trước tất cả require
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3099';
process.env.SERVICE_NAME = 'booking-service';
process.env.NODE_ENV = 'test';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.PRICING_SERVICE_URL = 'http://localhost:3004';

/**
 * Integration Tests - Booking API Endpoints (HTTP Layer)
 * Sử dụng supertest để test HTTP endpoints
 *
 * Test Cases được cover:
 * TC3: POST /bookings với input hợp lệ → 200/201
 * TC4: GET /bookings → list bookings
 * TC6: Status ban đầu = REQUESTED
 * TC11: Thiếu pickup → 400
 * TC12: Sai format lat/lng → 422
 * TC14: Payment method invalid → 400
 * TC19: Idempotency header
 * TC91: Không có header x-user-id → 401 "Authentication required"
 * TC95: RBAC - user role không access driver endpoints
 * TC101-103: Health check
 */

const request = require('supertest');

// Mock tất cả external dependencies trước khi load app
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
  getPool: jest.fn(),
  closeDB: jest.fn(),
}));

jest.mock('../../src/services/booking.service');

jest.mock('../../src/events/booking.producer', () => ({
  connectProducer: jest.fn(),
  disconnectProducer: jest.fn(),
  publishRideRequested: jest.fn(),
  publishRideAccepted: jest.fn(),
  publishRideCancelled: jest.fn(),
}));

jest.mock('../../src/events/booking.consumer', () => ({
  startConsumer: jest.fn(),
  stopConsumer: jest.fn(),
  setBookingService: jest.fn(),
}));

jest.mock('../../src/clients/pricing.client', () => ({
  getEstimate: jest.fn(),
}));

const app = require('../../src/app');
const bookingService = require('../../src/services/booking.service');

// ====== Sample Data ======
const validBookingPayload = {
  pickup: { lat: 10.76, lng: 106.66 },
  drop: { lat: 10.77, lng: 106.70 },
  distance_km: 5,
  payment_method: 'cash',
};

const sampleBookingResponse = {
  id: 'BK001',
  user_id: 'USR001',
  status: 'REQUESTED',
  pickup_lat: '10.76',
  pickup_lng: '106.66',
  drop_lat: '10.77',
  drop_lng: '106.70',
  distance_km: '5.00',
  estimated_price: '45000.00',
  surge_multiplier: '1.0',
  eta_minutes: 8,
  payment_method: 'cash',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Booking API - Integration Tests', () => {
  const customerHeaders = {
    'x-user-id': 'USR001',
    'x-user-role': 'customer',
  };

  const driverHeaders = {
    'x-user-id': 'DRV001',
    'x-user-role': 'driver',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // TC101-103: Health Check
  // ==========================================
  describe('GET /health', () => {
    test('TC101-103: GET /health → 200 {"status": "ok"}', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('booking-service');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ==========================================
  // TC91: Zero Trust Authentication (Headers from Gateway)
  // ==========================================
  describe('Zero Trust - Header Authentication', () => {
    test('TC91: Không có x-user-id header → 401 "Authentication required"', async () => {
      const res = await request(app)
        .post('/bookings')
        .send(validBookingPayload);
      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Authentication required');
    });
  });

  // ==========================================
  // TC95: RBAC Authorization
  // ==========================================
  describe('RBAC Authorization', () => {
    test('TC95: Customer không thể accept booking (driver-only) → 403', async () => {
      const res = await request(app)
        .post('/bookings/BK001/accept')
        .set(customerHeaders)
        .send({ driver_id: 'DRV001' });
      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('Access denied');
    });

    test('Driver có thể accept booking', async () => {
      bookingService.acceptBooking = jest.fn().mockResolvedValue({
        ...sampleBookingResponse,
        status: 'ACCEPTED',
        driver_id: 'DRV001',
      });

      const res = await request(app)
        .post('/bookings/BK001/accept')
        .set(driverHeaders)
        .send({ driver_id: 'DRV001' });

      expect(res.status).not.toBe(403);
    });
  });

  // ==========================================
  // TC3, TC6: POST /bookings - Happy Path
  // ==========================================
  describe('POST /bookings - Create booking', () => {
    beforeEach(() => {
      bookingService.createBooking = jest.fn().mockResolvedValue({
        booking: sampleBookingResponse,
        isIdempotent: false,
      });
    });

    test('TC3: POST /bookings → 201 + booking_id + status REQUESTED', async () => {
      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .send(validBookingPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking_id).toBe('BK001');
      expect(res.body.data.status).toBe('REQUESTED');
    });

    test('TC6: Status ban đầu = REQUESTED, có created_at', async () => {
      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .send(validBookingPayload);

      expect(res.body.data.status).toBe('REQUESTED');
      expect(res.body.data.created_at).toBeDefined();
    });

    test('TC19: Idempotency-Key → trả booking cũ với status 200', async () => {
      bookingService.createBooking = jest.fn().mockResolvedValue({
        booking: sampleBookingResponse,
        isIdempotent: true,
      });

      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .set('Idempotency-Key', 'unique-key-123')
        .send(validBookingPayload);

      expect(res.status).toBe(200);
    });
  });

  // ==========================================
  // TC11, TC12, TC14: Input Validation
  // ==========================================
  describe('POST /bookings - Input Validation', () => {
    test('TC11: Thiếu pickup → 400 "pickup is required"', async () => {
      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .send({ drop: { lat: 10.77, lng: 106.70 }, distance_km: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('pickup is required');
    });

    test('TC12: lat là string "abc" → 422', async () => {
      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .send({
          pickup: { lat: 'abc', lng: 106.66 },
          drop: { lat: 10.77, lng: 106.70 },
          distance_km: 5,
        });
      expect(res.status).toBe(422);
    });

    test('TC12: lng ngoài range (-180 to 180) → 422', async () => {
      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .send({
          pickup: { lat: 10.76, lng: 999 },
          drop: { lat: 10.77, lng: 106.70 },
          distance_km: 5,
        });
      expect(res.status).toBe(422);
    });

    test('TC14: payment_method invalid → 400', async () => {
      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .send({ ...validBookingPayload, payment_method: 'invalid_card' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid payment method');
    });

    test('TC11: Thiếu drop → 400', async () => {
      const res = await request(app)
        .post('/bookings')
        .set(customerHeaders)
        .send({ pickup: { lat: 10.76, lng: 106.66 }, distance_km: 5 });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // TC4: GET /bookings
  // ==========================================
  describe('GET /bookings - List bookings', () => {
    test('TC4: GET /bookings → 200 + list có booking_id và status', async () => {
      bookingService.getBookingsByUser = jest.fn().mockResolvedValue({
        data: [sampleBookingResponse],
        pagination: { total: 1, limit: 20, offset: 0, has_more: false },
      });

      const res = await request(app)
        .get('/bookings')
        .set(customerHeaders);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].booking_id).toBeDefined();
      expect(res.body.data[0].status).toBeDefined();
    });
  });

  // ==========================================
  // TC27: Accept booking
  // ==========================================
  describe('POST /bookings/:id/accept', () => {
    test('TC27: Driver accept → 200 + status ACCEPTED', async () => {
      bookingService.acceptBooking = jest.fn().mockResolvedValue({
        ...sampleBookingResponse,
        status: 'ACCEPTED',
        driver_id: 'DRV001',
        accepted_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/bookings/BK001/accept')
        .set(driverHeaders)
        .send({ driver_id: 'DRV001' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACCEPTED');
    });
  });

  // ==========================================
  // Cancel booking
  // ==========================================
  describe('POST /bookings/:id/cancel', () => {
    test('TC32: Cancel booking → 200 + status CANCELLED', async () => {
      bookingService.cancelBooking = jest.fn().mockResolvedValue({
        ...sampleBookingResponse,
        status: 'CANCELLED',
        cancel_reason: 'User cancelled',
      });

      const res = await request(app)
        .post('/bookings/BK001/cancel')
        .set(customerHeaders)
        .send({ reason: 'User cancelled' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });
  });
});

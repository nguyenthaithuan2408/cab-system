'use strict';

// ====== Setup ENV trước khi require bất kỳ module nào ======
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3099';
process.env.JWT_SECRET = 'test-secret';
process.env.SERVICE_NAME = 'booking-service';
process.env.NODE_ENV = 'test';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.PRICING_SERVICE_URL = 'http://localhost:3004';

/**
 * Unit Tests - Booking Service (Business Logic)
 *
 * Test Cases được cover:
 * TC3: Tạo booking với input hợp lệ
 * TC6: Status ban đầu = REQUESTED
 * TC13: Driver offline → PENDING
 * TC19: Idempotency key - không tạo duplicate
 * TC27: Cập nhật trạng thái ACCEPTED
 * TC32: Rollback khi lỗi
 * TC33: Payment failure → CANCELLED
 */

// Mock modules trước khi require service
jest.mock('../../src/repositories/booking.repository');
jest.mock('../../src/events/booking.producer');
jest.mock('../../src/clients/pricing.client');
jest.mock('../../src/config/database');

const bookingService = require('../../src/services/booking.service');
const bookingRepo = require('../../src/repositories/booking.repository');
const producer = require('../../src/events/booking.producer');
const pricingClient = require('../../src/clients/pricing.client');
const { getPool } = require('../../src/config/database');

// Mock pool với transaction support
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn(),
};

getPool.mockReturnValue(mockPool);

// Mock producer
producer.publishRideRequested = jest.fn().mockResolvedValue(true);
producer.publishRideAccepted = jest.fn().mockResolvedValue(true);
producer.publishRideCancelled = jest.fn().mockResolvedValue(true);

// Sample data
const sampleBookingInput = {
  user_id: 'USR001',
  pickup: { lat: 10.76, lng: 106.66, address: '123 Nguyen Hue' },
  drop: { lat: 10.77, lng: 106.70, address: '456 Le Loi' },
  distance_km: 5,
  payment_method: 'cash',
};

const sampleBookingRecord = {
  id: 'BK001',
  user_id: 'USR001',
  driver_id: null,
  idempotency_key: null,
  pickup_lat: '10.76',
  pickup_lng: '106.66',
  pickup_address: '123 Nguyen Hue',
  drop_lat: '10.77',
  drop_lng: '106.70',
  drop_address: '456 Le Loi',
  distance_km: '5.00',
  estimated_price: '45000.00',
  surge_multiplier: '1.0',
  eta_minutes: 8,
  payment_method: 'cash',
  status: 'REQUESTED',
  cancel_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  accepted_at: null,
  completed_at: null,
  cancelled_at: null,
};

describe('BookingService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: transaction thành công
    mockClient.query.mockResolvedValue({ rows: [] });
    mockPool.connect.mockResolvedValue(mockClient);

    // Default: Pricing service trả về giá
    pricingClient.getEstimate.mockResolvedValue({
      price: 45000,
      surge_multiplier: 1.0,
      eta_minutes: 8,
    });

    // Default: repo create thành công
    bookingRepo.create.mockResolvedValue(sampleBookingRecord);
    bookingRepo.findById.mockResolvedValue(sampleBookingRecord);
    bookingRepo.findByIdempotencyKey.mockResolvedValue(null);
  });

  // ==========================================
  // TC3 & TC6: Tạo booking hợp lệ
  // ==========================================
  describe('createBooking', () => {
    test('TC3: Tạo booking với input hợp lệ → trả về booking với booking_id', async () => {
      const result = await bookingService.createBooking(sampleBookingInput);

      expect(result.booking).toBeDefined();
      expect(result.booking.id).toBe('BK001');
      expect(result.isIdempotent).toBe(false);
    });

    test('TC6: Status ban đầu phải là REQUESTED', async () => {
      const result = await bookingService.createBooking(sampleBookingInput);

      expect(result.booking.status).toBe('REQUESTED');
    });

    test('TC6: Booking có created_at timestamp', async () => {
      const result = await bookingService.createBooking(sampleBookingInput);

      expect(result.booking.created_at).toBeDefined();
    });

    test('TC25: Kafka event ride_requested được publish sau khi tạo booking', async () => {
      await bookingService.createBooking(sampleBookingInput);

      expect(producer.publishRideRequested).toHaveBeenCalledTimes(1);
      expect(producer.publishRideRequested).toHaveBeenCalledWith(sampleBookingRecord);
    });

    test('TC25: Event publish CHỈ sau khi DB commit thành công (Outbox pattern)', async () => {
      // Simulate DB commit fail
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('DB error')) // INSERT fails
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      bookingRepo.create.mockRejectedValue(new Error('DB error'));

      await expect(bookingService.createBooking(sampleBookingInput)).rejects.toThrow();

      // Kafka KHÔNG được publish khi DB fail (TC38)
      expect(producer.publishRideRequested).not.toHaveBeenCalled();
    });

    test('TC32: Transaction rollback khi DB lỗi giữa chừng', async () => {
      bookingRepo.create.mockRejectedValue(new Error('DB write error'));

      await expect(bookingService.createBooking(sampleBookingInput)).rejects.toThrow('DB write error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('TC30: Fallback khi Pricing Service timeout → vẫn tạo được booking', async () => {
      pricingClient.getEstimate.mockResolvedValue(null); // Pricing unavailable

      bookingRepo.create.mockResolvedValue({
        ...sampleBookingRecord,
        estimated_price: null,
      });

      const result = await bookingService.createBooking(sampleBookingInput);

      // Booking vẫn được tạo dù không có giá
      expect(result.booking).toBeDefined();
      expect(result.booking.status).toBe('REQUESTED');
    });

    // TC19: Idempotency
    test('TC19: Request trùng idempotency_key → trả booking cũ, không tạo mới', async () => {
      bookingRepo.findByIdempotencyKey.mockResolvedValue(sampleBookingRecord);

      const result = await bookingService.createBooking({
        ...sampleBookingInput,
        idempotency_key: 'idem-key-123',
      });

      expect(result.isIdempotent).toBe(true);
      expect(result.booking.id).toBe('BK001');
      // Không gọi create
      expect(bookingRepo.create).not.toHaveBeenCalled();
      // Không publish event
      expect(producer.publishRideRequested).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // TC27: Accept booking
  // ==========================================
  describe('acceptBooking', () => {
    // Booking ở trạng thái CONFIRMED mới có thể chuyển sang ACCEPTED theo state machine
    const confirmedBookingRecord = {
      ...sampleBookingRecord,
      status: 'CONFIRMED',
    };

    test('TC27: Driver accept → status chuyển sang ACCEPTED', async () => {
      // Setup: booking đang ở trạng thái CONFIRMED
      bookingRepo.findById.mockResolvedValue(confirmedBookingRecord);

      const acceptedBooking = {
        ...confirmedBookingRecord,
        status: 'ACCEPTED',
        driver_id: 'DRV001',
        accepted_at: new Date().toISOString(),
      };

      bookingRepo.updateStatus = jest.fn().mockResolvedValue(acceptedBooking);
      bookingRepo.assignDriver = jest.fn().mockResolvedValue(acceptedBooking);

      const result = await bookingService.acceptBooking('BK001', 'DRV001');

      expect(result.status).toBe('ACCEPTED');
      expect(result.driver_id).toBe('DRV001');
    });

    test('TC27: Event ride_accepted được publish sau khi accept', async () => {
      // Setup: booking đang ở trạng thái CONFIRMED
      bookingRepo.findById.mockResolvedValue(confirmedBookingRecord);

      const acceptedBooking = { ...confirmedBookingRecord, status: 'ACCEPTED', driver_id: 'DRV001' };
      bookingRepo.assignDriver = jest.fn().mockResolvedValue(acceptedBooking);

      await bookingService.acceptBooking('BK001', 'DRV001');

      expect(producer.publishRideAccepted).toHaveBeenCalledTimes(1);
    });

    test('Không thể accept booking đã CANCELLED', async () => {
      bookingRepo.findById.mockResolvedValue({
        ...sampleBookingRecord,
        status: 'CANCELLED',
      });

      await expect(bookingService.acceptBooking('BK001', 'DRV001')).rejects.toThrow();
    });
  });

  // ==========================================
  // TC32/33: Cancel & Saga compensation
  // ==========================================
  describe('cancelBooking', () => {
    test('TC32: Cancel booking → status = CANCELLED', async () => {
      const cancelledBooking = {
        ...sampleBookingRecord,
        status: 'CANCELLED',
        cancel_reason: 'User cancelled',
      };

      bookingRepo.updateStatus = jest.fn().mockResolvedValue(cancelledBooking);

      const result = await bookingService.cancelBooking('BK001', 'USR001', 'User cancelled');

      expect(result.status).toBe('CANCELLED');
    });

    test('TC37: Saga compensation - event ride_cancelled được publish', async () => {
      const cancelledBooking = { ...sampleBookingRecord, status: 'CANCELLED' };
      bookingRepo.updateStatus = jest.fn().mockResolvedValue(cancelledBooking);

      await bookingService.cancelBooking('BK001', 'USR001', 'Payment failed');

      expect(producer.publishRideCancelled).toHaveBeenCalledTimes(1);
    });

    test('TC33: Không thể cancel booking đã PAID', async () => {
      bookingRepo.findById.mockResolvedValue({
        ...sampleBookingRecord,
        status: 'PAID',
      });

      await expect(
        bookingService.cancelBooking('BK001', 'USR001')
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    test('Access denied khi user_id không khớp', async () => {
      await expect(
        bookingService.cancelBooking('BK001', 'OTHER_USER')
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ==========================================
  // State Machine validation
  // ==========================================
  describe('isValidTransition', () => {
    test('REQUESTED → CONFIRMED là hợp lệ (bước đầu tiên)', () => {
      expect(bookingService.isValidTransition('REQUESTED', 'CONFIRMED')).toBe(true);
    });

    test('CONFIRMED → ACCEPTED là hợp lệ (driver nhận chuyến)', () => {
      expect(bookingService.isValidTransition('CONFIRMED', 'ACCEPTED')).toBe(true);
    });

    test('REQUESTED → CANCELLED là hợp lệ', () => {
      expect(bookingService.isValidTransition('REQUESTED', 'CANCELLED')).toBe(true);
    });

    test('REQUESTED → ACCEPTED KHÔNG hợp lệ (phải qua CONFIRMED trước)', () => {
      expect(bookingService.isValidTransition('REQUESTED', 'ACCEPTED')).toBe(false);
    });

    test('PAID → CANCELLED là không hợp lệ', () => {
      expect(bookingService.isValidTransition('PAID', 'CANCELLED')).toBe(false);
    });

    test('COMPLETED → PAID là hợp lệ', () => {
      expect(bookingService.isValidTransition('COMPLETED', 'PAID')).toBe(true);
    });
  });

  // ==========================================
  // getBookingById - Security
  // ==========================================
  describe('getBookingById', () => {
    test('404 khi booking không tồn tại', async () => {
      bookingRepo.findById.mockResolvedValue(null);

      await expect(bookingService.getBookingById('NONEXISTENT')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    test('TC96: 403 khi user khác cố xem booking', async () => {
      await expect(
        bookingService.getBookingById('BK001', 'OTHER_USER')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('Owner có thể xem booking của mình', async () => {
      const result = await bookingService.getBookingById('BK001', 'USR001');
      expect(result.id).toBe('BK001');
    });
  });
});

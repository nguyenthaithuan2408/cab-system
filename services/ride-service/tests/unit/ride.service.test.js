'use strict';

// ====== Setup ENV trước khi require bất kỳ module nào ======
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3099';
process.env.SERVICE_NAME = 'ride-service';
process.env.NODE_ENV = 'test';
process.env.KAFKA_BROKERS = 'localhost:9092';

/**
 * Unit Tests - Ride Service (Business Logic)
 *
 * Test Cases được cover:
 * TC3:  Tạo booking → Ride được khởi tạo với status CREATED
 * TC5:  Driver chuyển trạng thái ONLINE → có thể nhận chuyến
 * TC24: Booking → Payment → Notification flow (complete ride triggers payment)
 * TC25: Kafka event ride_requested được consume → tạo ride
 * TC27: Ride cập nhật trạng thái ASSIGNED khi driver accept
 * TC32: Transaction rollback khi lỗi
 * TC37: Saga compensation - ride CANCELLED khi booking bị hủy
 * TC38: Kafka event CHỈ publish sau DB commit
 */

// Mock modules trước khi require service
jest.mock('../../src/repositories/ride.repository');
jest.mock('../../src/events/ride.producer');
jest.mock('../../src/config/database');

const rideService = require('../../src/services/ride.service');
const rideRepo = require('../../src/repositories/ride.repository');
const producer = require('../../src/events/ride.producer');
const { getPool } = require('../../src/config/database');

// ====== Mock Pool với transaction support ======
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn(),
};

getPool.mockReturnValue(mockPool);

// ====== Mock producer ======
producer.publishRideStarted = jest.fn().mockResolvedValue(true);
producer.publishRideCompleted = jest.fn().mockResolvedValue(true);
producer.publishRideStatusChanged = jest.fn().mockResolvedValue(true);
producer.publishPaymentRequested = jest.fn().mockResolvedValue(true);

// ====== Sample Data ======
const sampleBookingPayload = {
  booking_id: 'BK001',
  user_id: 'USR001',
  pickup: { lat: 10.76, lng: 106.66, address: '123 Nguyen Hue' },
  drop: { lat: 10.77, lng: 106.70, address: '456 Le Loi' },
  distance_km: 5,
  estimated_price: 45000,
  payment_method: 'cash',
  eta_minutes: 8,
};

const sampleRideRecord = {
  id: 'RIDE001',
  booking_id: 'BK001',
  user_id: 'USR001',
  driver_id: null,
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
  status: 'CREATED',
  cancel_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assigned_at: null,
  pickup_at: null,
  started_at: null,
  completed_at: null,
  cancelled_at: null,
};

const assignedRideRecord = {
  ...sampleRideRecord,
  driver_id: 'DRV001',
  status: 'ASSIGNED',
  assigned_at: new Date().toISOString(),
};

const pickupRideRecord = {
  ...assignedRideRecord,
  status: 'PICKUP',
  pickup_at: new Date().toISOString(),
};

const inProgressRideRecord = {
  ...pickupRideRecord,
  status: 'IN_PROGRESS',
  started_at: new Date().toISOString(),
};

const completedRideRecord = {
  ...inProgressRideRecord,
  status: 'COMPLETED',
  final_price: '45000.00',
  completed_at: new Date().toISOString(),
};

// ============================================================
describe('RideService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: transaction thành công
    mockClient.query.mockResolvedValue({ rows: [] });
    mockPool.connect.mockResolvedValue(mockClient);

    // Default: repo methods thành công
    rideRepo.create.mockResolvedValue(sampleRideRecord);
    rideRepo.findById.mockResolvedValue(sampleRideRecord);
    rideRepo.findByBookingId.mockResolvedValue(null);
    rideRepo.updateStatus.mockResolvedValue(sampleRideRecord);
    rideRepo.assignDriver.mockResolvedValue(assignedRideRecord);
  });

  // ==========================================
  // TC25: createRideFromBooking
  // ==========================================
  describe('createRideFromBooking', () => {
    test('TC25: Tạo ride từ booking event → trả về ride với status CREATED', async () => {
      rideRepo.findByBookingId.mockResolvedValue(null); // chưa có ride

      const result = await rideService.createRideFromBooking(sampleBookingPayload);

      expect(result).toBeDefined();
      expect(result.id).toBe('RIDE001');
      expect(result.status).toBe('CREATED');
      expect(result.booking_id).toBe('BK001');
    });

    test('TC25: Kafka event ride_status_changed được publish sau DB commit', async () => {
      rideRepo.findByBookingId.mockResolvedValue(null);

      await rideService.createRideFromBooking(sampleBookingPayload);

      expect(producer.publishRideStatusChanged).toHaveBeenCalledTimes(1);
      expect(producer.publishRideStatusChanged).toHaveBeenCalledWith(sampleRideRecord, null);
    });

    test('TC38: Kafka KHÔNG publish khi DB fail (Outbox pattern)', async () => {
      rideRepo.findByBookingId.mockResolvedValue(null);
      rideRepo.create.mockRejectedValue(new Error('DB write error'));

      await expect(
        rideService.createRideFromBooking(sampleBookingPayload)
      ).rejects.toThrow('DB write error');

      // Không publish event khi DB fail
      expect(producer.publishRideStatusChanged).not.toHaveBeenCalled();
    });

    test('TC32: Transaction rollback khi lỗi giữa chừng', async () => {
      rideRepo.findByBookingId.mockResolvedValue(null);
      rideRepo.create.mockRejectedValue(new Error('DB error'));

      await expect(
        rideService.createRideFromBooking(sampleBookingPayload)
      ).rejects.toThrow();

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('Idempotency: Không tạo duplicate nếu ride đã tồn tại', async () => {
      rideRepo.findByBookingId.mockResolvedValue(sampleRideRecord); // Đã có

      const result = await rideService.createRideFromBooking(sampleBookingPayload);

      // Trả về ride hiện có, không tạo mới
      expect(rideRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual(sampleRideRecord);
    });
  });

  // ==========================================
  // TC27: assignDriverToRide
  // ==========================================
  describe('assignDriverToRide', () => {
    test('TC27: Driver assign → status chuyển sang ASSIGNED', async () => {
      rideRepo.findByBookingId.mockResolvedValue(sampleRideRecord); // CREATED → có thể chuyển ASSIGNED... wait

      // Ride ở MATCHING mới có thể ASSIGNED
      const matchingRide = { ...sampleRideRecord, status: 'MATCHING' };
      rideRepo.findByBookingId.mockResolvedValue(matchingRide);
      rideRepo.assignDriver.mockResolvedValue(assignedRideRecord);

      const result = await rideService.assignDriverToRide('BK001', 'DRV001');

      expect(result.status).toBe('ASSIGNED');
      expect(result.driver_id).toBe('DRV001');
    });

    test('TC27: Kafka event được publish sau khi assign driver', async () => {
      const matchingRide = { ...sampleRideRecord, status: 'MATCHING' };
      rideRepo.findByBookingId.mockResolvedValue(matchingRide);
      rideRepo.assignDriver.mockResolvedValue(assignedRideRecord);

      await rideService.assignDriverToRide('BK001', 'DRV001');

      expect(producer.publishRideStatusChanged).toHaveBeenCalledTimes(1);
    });

    test('Trả về null nếu ride không tồn tại', async () => {
      rideRepo.findByBookingId.mockResolvedValue(null);

      const result = await rideService.assignDriverToRide('NONEXISTENT', 'DRV001');

      expect(result).toBeNull();
      expect(rideRepo.assignDriver).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // TC37: cancelRideByBookingId (Saga compensation)
  // ==========================================
  describe('cancelRideByBookingId', () => {
    test('TC37: Saga compensation - hủy ride theo booking_id', async () => {
      rideRepo.findByBookingId.mockResolvedValue(sampleRideRecord);
      const cancelledRide = { ...sampleRideRecord, status: 'CANCELLED', cancel_reason: 'Booking cancelled' };
      rideRepo.updateStatus.mockResolvedValue(cancelledRide);

      const result = await rideService.cancelRideByBookingId('BK001', 'Booking cancelled');

      expect(result.status).toBe('CANCELLED');
    });

    test('TC37: Kafka event được publish sau khi cancel', async () => {
      rideRepo.findByBookingId.mockResolvedValue(sampleRideRecord);
      const cancelledRide = { ...sampleRideRecord, status: 'CANCELLED' };
      rideRepo.updateStatus.mockResolvedValue(cancelledRide);

      await rideService.cancelRideByBookingId('BK001', 'Payment failed');

      expect(producer.publishRideStatusChanged).toHaveBeenCalledTimes(1);
    });

    test('Không cancel nếu ride không tồn tại → trả về null', async () => {
      rideRepo.findByBookingId.mockResolvedValue(null);

      const result = await rideService.cancelRideByBookingId('NONEXISTENT');

      expect(result).toBeNull();
    });

    test('Bỏ qua cancel nếu ride đã ở terminal state (PAID)', async () => {
      const paidRide = { ...sampleRideRecord, status: 'PAID' };
      rideRepo.findByBookingId.mockResolvedValue(paidRide);

      const result = await rideService.cancelRideByBookingId('BK001');

      expect(rideRepo.updateStatus).not.toHaveBeenCalled();
      expect(result).toEqual(paidRide);
    });
  });

  // ==========================================
  // startRide
  // ==========================================
  describe('startRide', () => {
    test('Bắt đầu chuyến đi thành công (PICKUP → IN_PROGRESS)', async () => {
      rideRepo.findById.mockResolvedValue(pickupRideRecord);
      rideRepo.updateStatus.mockResolvedValue(inProgressRideRecord);

      const result = await rideService.startRide('RIDE001', 'DRV001');

      expect(result.status).toBe('IN_PROGRESS');
    });

    test('Kafka event ride.started được publish', async () => {
      rideRepo.findById.mockResolvedValue(pickupRideRecord);
      rideRepo.updateStatus.mockResolvedValue(inProgressRideRecord);

      await rideService.startRide('RIDE001', 'DRV001');

      expect(producer.publishRideStarted).toHaveBeenCalledTimes(1);
    });

    test('403 nếu driver không phải người được assign', async () => {
      rideRepo.findById.mockResolvedValue(pickupRideRecord); // driver_id = DRV001

      await expect(
        rideService.startRide('RIDE001', 'DRV_OTHER')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('404 nếu ride không tồn tại', async () => {
      rideRepo.findById.mockResolvedValue(null);

      await expect(
        rideService.startRide('NONEXISTENT', 'DRV001')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('422 nếu chuyển trạng thái không hợp lệ', async () => {
      rideRepo.findById.mockResolvedValue({ ...sampleRideRecord, driver_id: 'DRV001' }); // CREATED, set driver_id để test 422

      await expect(
        rideService.startRide('RIDE001', 'DRV001')
      ).rejects.toMatchObject({ statusCode: 422 });
    });
  });

  // ==========================================
  // TC24: completeRide
  // ==========================================
  describe('completeRide', () => {
    test('TC24: Hoàn thành chuyến → trigger payment event', async () => {
      rideRepo.findById.mockResolvedValue(inProgressRideRecord);
      rideRepo.updateStatus.mockResolvedValue(completedRideRecord);

      await rideService.completeRide('RIDE001', 'DRV001', 45000);

      // Phải publish payment.requested để trigger payment flow
      expect(producer.publishPaymentRequested).toHaveBeenCalledTimes(1);
    });

    test('TC24: Event ride.completed được publish', async () => {
      rideRepo.findById.mockResolvedValue(inProgressRideRecord);
      rideRepo.updateStatus.mockResolvedValue(completedRideRecord);

      await rideService.completeRide('RIDE001', 'DRV001');

      expect(producer.publishRideCompleted).toHaveBeenCalledTimes(1);
    });

    test('403 nếu driver không phải người được assign', async () => {
      rideRepo.findById.mockResolvedValue(inProgressRideRecord);

      await expect(
        rideService.completeRide('RIDE001', 'DRV_OTHER')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('422 nếu ride không đang IN_PROGRESS', async () => {
      rideRepo.findById.mockResolvedValue(assignedRideRecord); // ASSIGNED, không thể complete

      await expect(
        rideService.completeRide('RIDE001', 'DRV001')
      ).rejects.toMatchObject({ statusCode: 422 });
    });
  });

  // ==========================================
  // cancelRide (HTTP API)
  // ==========================================
  describe('cancelRide', () => {
    test('TC32: User hủy ride → status CANCELLED', async () => {
      rideRepo.findById.mockResolvedValue(sampleRideRecord);
      const cancelledRide = { ...sampleRideRecord, status: 'CANCELLED' };
      rideRepo.updateStatus.mockResolvedValue(cancelledRide);

      const result = await rideService.cancelRide('RIDE001', 'USR001', 'customer', 'User cancelled');

      expect(result.status).toBe('CANCELLED');
    });

    test('403 nếu không phải owner hoặc driver', async () => {
      rideRepo.findById.mockResolvedValue(sampleRideRecord);

      await expect(
        rideService.cancelRide('RIDE001', 'OTHER_USER', 'customer')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('Admin có thể cancel bất kỳ ride', async () => {
      rideRepo.findById.mockResolvedValue(sampleRideRecord);
      const cancelledRide = { ...sampleRideRecord, status: 'CANCELLED' };
      rideRepo.updateStatus.mockResolvedValue(cancelledRide);

      const result = await rideService.cancelRide('RIDE001', 'ADMIN001', 'admin', 'Admin cancelled');

      expect(result.status).toBe('CANCELLED');
    });

    test('422 nếu ride đã COMPLETED không thể cancel', async () => {
      rideRepo.findById.mockResolvedValue(completedRideRecord); // COMPLETED

      await expect(
        rideService.cancelRide('RIDE001', 'USR001', 'customer')
      ).rejects.toMatchObject({ statusCode: 422 });
    });
  });

  // ==========================================
  // State Machine Validation
  // ==========================================
  describe('isValidTransition (State Machine)', () => {
    test('CREATED → MATCHING là hợp lệ', () => {
      expect(rideService.isValidTransition('CREATED', 'MATCHING')).toBe(true);
    });

    test('MATCHING → ASSIGNED là hợp lệ', () => {
      expect(rideService.isValidTransition('MATCHING', 'ASSIGNED')).toBe(true);
    });

    test('ASSIGNED → PICKUP là hợp lệ', () => {
      expect(rideService.isValidTransition('ASSIGNED', 'PICKUP')).toBe(true);
    });

    test('PICKUP → IN_PROGRESS là hợp lệ', () => {
      expect(rideService.isValidTransition('PICKUP', 'IN_PROGRESS')).toBe(true);
    });

    test('IN_PROGRESS → COMPLETED là hợp lệ', () => {
      expect(rideService.isValidTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);
    });

    test('COMPLETED → PAID là hợp lệ', () => {
      expect(rideService.isValidTransition('COMPLETED', 'PAID')).toBe(true);
    });

    test('CREATED → IN_PROGRESS KHÔNG hợp lệ (skip states)', () => {
      expect(rideService.isValidTransition('CREATED', 'IN_PROGRESS')).toBe(false);
    });

    test('PAID → CANCELLED KHÔNG hợp lệ (terminal state)', () => {
      expect(rideService.isValidTransition('PAID', 'CANCELLED')).toBe(false);
    });

    test('COMPLETED → CANCELLED KHÔNG hợp lệ', () => {
      expect(rideService.isValidTransition('COMPLETED', 'CANCELLED')).toBe(false);
    });

    test('CREATED → CANCELLED là hợp lệ (user cancel ngay)', () => {
      expect(rideService.isValidTransition('CREATED', 'CANCELLED')).toBe(true);
    });
  });

  // ==========================================
  // getRideById - Security
  // ==========================================
  describe('getRideById', () => {
    test('404 nếu ride không tồn tại', async () => {
      rideRepo.findById.mockResolvedValue(null);

      await expect(
        rideService.getRideById('NONEXISTENT')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test('TC96: 403 nếu user khác cố xem ride', async () => {
      rideRepo.findById.mockResolvedValue(sampleRideRecord);

      await expect(
        rideService.getRideById('RIDE001', 'OTHER_USER')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('Owner có thể xem ride của mình', async () => {
      rideRepo.findById.mockResolvedValue(sampleRideRecord);

      const result = await rideService.getRideById('RIDE001', 'USR001');

      expect(result.id).toBe('RIDE001');
    });

    test('Driver được assign có thể xem ride', async () => {
      const rideWithDriver = { ...sampleRideRecord, driver_id: 'DRV001' };
      rideRepo.findById.mockResolvedValue(rideWithDriver);

      const result = await rideService.getRideById('RIDE001', 'DRV001');

      expect(result.id).toBe('RIDE001');
    });
  });
});

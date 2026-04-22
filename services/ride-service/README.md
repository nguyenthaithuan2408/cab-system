# Ride Service

Microservice quản lý vòng đời chuyến đi (Ride Lifecycle) trong hệ thống CAB Booking System.

## Tổng quan

Ride Service chịu trách nhiệm theo dõi và quản lý trạng thái của từng chuyến đi từ khi booking được tạo đến khi thanh toán hoàn tất. Service hoạt động theo mô hình **Event-Driven**, tiêu thụ events từ Booking Service và phát ra events đến Payment Service và Notification Service.

**Port:** `3003`  
**Database:** PostgreSQL  
**Broker:** Kafka

---

## State Machine

```
CREATED → MATCHING → ASSIGNED → PICKUP → IN_PROGRESS → COMPLETED → PAID
    ↓          ↓          ↓         ↓
CANCELLED  CANCELLED  CANCELLED CANCELLED
```

| Trạng thái  | Mô tả                                           |
|-------------|--------------------------------------------------|
| CREATED     | Ride vừa được tạo từ Kafka event `ride.requested` |
| MATCHING    | Đang tìm tài xế phù hợp                          |
| ASSIGNED    | Đã tìm được tài xế                               |
| PICKUP      | Tài xế đang đến điểm đón                         |
| IN_PROGRESS | Chuyến đi đang diễn ra                           |
| COMPLETED   | Chuyến đi đã kết thúc, chờ thanh toán            |
| PAID        | Đã thanh toán xong                               |
| CANCELLED   | Bị hủy                                           |
| FAILED      | Thất bại do lỗi hệ thống                         |

---

## Cấu trúc thư mục

```
src/
├── config/
│   ├── database.js    # PostgreSQL pool + auto migration
│   ├── env.js         # ENV validation (fail-fast)
│   └── kafka.js       # KafkaJS singleton + topics
├── controllers/
│   └── ride.controller.js    # HTTP handlers
├── services/
│   └── ride.service.js       # Business logic + state machine
├── repositories/
│   └── ride.repository.js    # Data Access Layer (SQL queries)
├── events/
│   ├── ride.producer.js      # Kafka event publisher
│   └── ride.consumer.js      # Kafka event consumer
├── middlewares/
│   ├── auth.middleware.js     # Zero Trust (x-user-id header)
│   ├── logger.middleware.js   # Structured request logging
│   └── validate.middleware.js # Input validation
├── models/
│   └── ride.model.js          # Constants, state machine, formatters
├── utils/
│   └── logger.js              # Structured JSON logger (ELK-ready)
├── app.js                     # Express configuration
└── server.js                  # Entry point
tests/
├── unit/
│   └── ride.service.test.js   # Business logic tests
└── integration/
    └── ride.api.test.js       # HTTP API tests (supertest)
```

---

## Cài đặt & Chạy

### Yêu cầu
- Node.js >= 20
- PostgreSQL
- Kafka

### Development

```bash
# Cài dependencies
npm install

# Copy và cấu hình ENV
cp .env.example .env

# Chạy dev server (hot reload)
npm run dev
```

### Production (Docker)

```bash
docker build -t ride-service .
docker run -p 3003:3003 --env-file .env ride-service
```

---

## Biến môi trường

| Biến                | Bắt buộc | Mặc định           | Mô tả                      |
|---------------------|----------|--------------------|---------------------------|
| `PORT`              | ✅       | 3003               | Port lắng nghe             |
| `DATABASE_URL`      | ✅       | -                  | PostgreSQL connection URL  |
| `KAFKA_BROKERS`     | ❌       | localhost:9092     | Kafka broker addresses     |
| `KAFKA_CLIENT_ID`   | ❌       | ride-service       | Kafka client ID            |
| `KAFKA_GROUP_ID`    | ❌       | ride-service-group | Consumer group ID          |
| `LOG_LEVEL`         | ❌       | info               | debug/info/warn/error      |
| `RATE_LIMIT_MAX`    | ❌       | 100                | Max requests/window        |
| `MAX_PAYLOAD_SIZE`  | ❌       | 1mb                | Max request body size      |

---

## API Endpoints

### Public
| Method | Path      | Mô tả         |
|--------|-----------|---------------|
| GET    | /health   | Health check  |
| GET    | /metrics  | Prometheus metrics |

### Protected (yêu cầu `x-user-id` header từ Gateway)

| Method | Path                       | Role              | Mô tả                        |
|--------|----------------------------|-------------------|------------------------------|
| GET    | /rides                     | customer/driver   | Danh sách rides của user     |
| GET    | /rides/:id                 | customer/driver   | Chi tiết một ride            |
| GET    | /rides/:id/status          | customer/driver   | Trạng thái ride (lightweight)|
| GET    | /rides/booking/:bookingId  | customer/driver   | Ride theo booking_id         |
| GET    | /rides/driver/my-rides     | driver            | Rides của driver             |
| POST   | /rides/:id/en-route        | driver            | Driver đang đến điểm đón     |
| POST   | /rides/:id/start           | driver            | Bắt đầu chuyến đi            |
| POST   | /rides/:id/complete        | driver            | Hoàn thành chuyến đi         |
| POST   | /rides/:id/cancel          | customer/driver   | Hủy chuyến đi                |

---

## Kafka Events

### Consume (Lắng nghe)
| Topic        | Event Type       | Mô tả                         |
|--------------|------------------|-------------------------------|
| ride_events  | ride.requested   | Tạo ride record mới           |
| ride_events  | ride.accepted    | Assign driver vào ride        |
| ride_events  | ride.cancelled   | Hủy ride (Saga compensation)  |

### Publish (Phát ra)
| Topic              | Event Type          | Mô tả                              |
|--------------------|---------------------|------------------------------------|
| ride_status_events | ride.started        | Chuyến đi đã bắt đầu              |
| ride_status_events | ride.completed      | Chuyến đi hoàn thành              |
| ride_status_events | ride.status_changed | Mọi thay đổi trạng thái           |
| payment_events     | payment.requested   | Yêu cầu thanh toán sau khi hoàn thành |

---

## Test

```bash
# Tất cả tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage report
npm run test:coverage
```

---

## Kiến trúc bảo mật (Zero Trust)

Service **không** tự verify JWT. API Gateway xác thực token và inject headers:
- `x-user-id`: ID của user đã xác thực
- `x-user-role`: Role của user (customer/driver/admin)

Service chỉ đọc headers này để xác định danh tính (RBAC).

# Payment Service

## Overview
Payment Service xử lý transaction thanh toán cho booking.

## Responsibilities
- Tạo transaction thanh toán.
- Quản lý trạng thái payment (`PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED`).
- Hỗ trợ idempotency để dedup request tạo transaction.

## Main Features
- Create payment transaction.
- Get transaction by id.
- List transactions by bookingId.
- List transactions by userId.
- Update payment status.
- Webhook/internal callback stub cho kết quả thanh toán.
- Health check endpoint.

## Project Structure
- `src/app.js`: middleware + route mounting + error handling.
- `src/server.js`: bootstrap app + database.
- `src/config/database.js`: PostgreSQL config + schema bootstrap.
- `src/models/payment.model.js`: response mapper.
- `src/repositories/payment.repository.js`: data access layer.
- `src/services/payment.service.js`: domain logic, validation, idempotency.
- `src/controllers/payment.controller.js`: request handlers.
- `src/routes/payment.route.js`: route definitions.
- `src/events/*`: producer/consumer stubs.
- `src/utils/*`: helper utilities.

## Environment Variables
Xem `.env.example`.

Biến chính:
- `PORT`
- `SERVICE_NAME`
- `NODE_ENV`
- `LOG_LEVEL`
- `DATABASE_URL` hoặc cụm `DB_*`
- `PAYMENT_WEBHOOK_SECRET`

## How To Run Locally
```bash
cd services/payment-service
npm install
npm run start
```

## Available Scripts
- `npm run start`
- `npm run dev`

## Main API Endpoints
- `GET /health`
- `POST /payments`
- `GET /payments/:id`
- `GET /payments/by-booking/:bookingId`
- `GET /payments/by-user/:userId`
- `PATCH /payments/:id/status`
- `POST /payments/webhook/payment-result`

## Sample Request / Response
### Create Payment
`POST /payments`
```json
{
  "bookingId": "booking_001",
  "userId": "user_001",
  "amount": 125000,
  "currency": "VND",
  "paymentMethod": "CARD",
  "idempotencyKey": "pay-booking_001-attempt_1"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingId": "booking_001",
    "userId": "user_001",
    "amount": 125000,
    "currency": "VND",
    "paymentMethod": "CARD",
    "paymentStatus": "PENDING",
    "transactionRef": "TXN-...",
    "idempotencyKey": "pay-booking_001-attempt_1"
  }
}
```

## Database Notes
- PostgreSQL table: `payment_transactions`
- Partial unique index cho `idempotency_key` (chỉ áp dụng khi khác null)

## Integration Notes / TODO
- Webhook signature verification hiện là stub placeholder, cần tích hợp provider cụ thể.

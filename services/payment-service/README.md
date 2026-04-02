# Payment Service

## Purpose
Payment Service xử lý transaction thanh toán cho booking.

## Default Config
- Port: `3007`
- Database: PostgreSQL
- Table bootstrap tự động khi service khởi động: `payment_transactions`

## Required Environment
Tạo `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Biến quan trọng:
- `PORT`
- `DATABASE_URL` hoặc nhóm `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`
- `PAYMENT_WEBHOOK_SECRET`

## Run Local
```bash
npm install
npm run dev
```

Hoặc production mode:
```bash
npm run start
```

## Smoke Test
```bash
npm test
```

## Health Check
- `GET /health`
- Ví dụ: `curl http://localhost:3007/health`

## Main APIs
- `POST /payments`
- `GET /payments/:id`
- `GET /payments/by-booking/:bookingId`
- `GET /payments/by-user/:userId`
- `PATCH /payments/:id/status`
- `POST /payments/webhook/payment-result`

## Notes
- Webhook signature verification hiện là placeholder/stub.
- Event producer/consumer hiện là stub để tích hợp broker ở bước sau.

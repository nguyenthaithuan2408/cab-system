# Review Service

## Purpose
Review Service lưu trữ rating và feedback cho tài xế/booking.

## Default Config
- Port: `3008`
- Database: MongoDB
- Collection bootstrap khi service khởi động: `reviews`

## Required Environment
Tạo `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Biến quan trọng:
- `PORT`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `MONGO_REVIEW_COLLECTION`

Mongo mặc định trong `.env.example` là `mongodb://localhost:27018` (khớp `docker-compose.mongo.yml`).

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
- Ví dụ: `curl http://localhost:3008/health`

## Main APIs
- `POST /reviews`
- `GET /reviews/:id`
- `GET /reviews/by-driver/:driverId`
- `GET /reviews/by-user/:userId`
- `GET /reviews/by-booking/:bookingId`
- `PUT /reviews/:id`
- `DELETE /reviews/:id`
- `GET /reviews/summary/driver/:driverId`

## Notes
- Event producer/consumer hiện là stub để tích hợp broker ở bước sau.

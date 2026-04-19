# Review Service

<<<<<<< HEAD
<<<<<<< HEAD
## Overview
Review Service lưu trữ ratings & feedback cho tài xế/booking.
=======
## Purpose
Review Service lưu trữ rating và feedback cho tài xế/booking.
>>>>>>> origin/service/payment

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
<<<<<<< HEAD
- `SERVICE_NAME`
- `NODE_ENV`
- `LOG_LEVEL`
=======
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
>>>>>>> origin/service/driver
=======
>>>>>>> origin/service/payment
- `MONGO_URI`
- `MONGO_DB_NAME`
- `MONGO_REVIEW_COLLECTION`

<<<<<<< HEAD
<<<<<<< HEAD
## How To Run Locally
=======
Mongo mặc định trong `.env.example` là `mongodb://localhost:27018` (khớp `docker-compose.mongo.yml`).

## Run Local
>>>>>>> origin/service/payment
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
<<<<<<< HEAD
=======
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
>>>>>>> origin/service/driver
=======
- Ví dụ: `curl http://localhost:3008/health`

## Main APIs
>>>>>>> origin/service/payment
- `POST /reviews`
- `GET /reviews/:id`
- `GET /reviews/by-driver/:driverId`
- `GET /reviews/by-user/:userId`
- `GET /reviews/by-booking/:bookingId`
- `PUT /reviews/:id`
- `DELETE /reviews/:id`
- `GET /reviews/summary/driver/:driverId`

<<<<<<< HEAD
<<<<<<< HEAD
## Sample Request / Response
### Create Review
`POST /reviews`
```json
{
  "bookingId": "booking_001",
  "driverId": "driver_001",
  "userId": "user_001",
  "rating": 5,
  "comment": "Tai xe than thien va dung gio"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "mongo_object_id",
    "bookingId": "booking_001",
    "driverId": "driver_001",
    "userId": "user_001",
    "rating": 5,
    "comment": "Tai xe than thien va dung gio"
  }
}
```

## Database Notes
Collection: `reviews`
- Indexes:
  - `{ driverId: 1, createdAt: -1 }`
  - `{ userId: 1, createdAt: -1 }`
  - `{ bookingId: 1, createdAt: -1 }`
  - Unique partial index `{ bookingId: 1, userId: 1 }` với `isDeleted=false`

## Integration Notes / TODO
- Event producer đang là stub để tích hợp broker thật.
=======
## Notes
- Event producer/consumer hiện là stub để tích hợp broker ở bước sau.
>>>>>>> origin/service/driver
=======
## Notes
- Event producer/consumer hiện là stub để tích hợp broker ở bước sau.
>>>>>>> origin/service/payment

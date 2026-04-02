# Review Service

## Overview
Review Service lưu trữ ratings & feedback cho tài xế/booking.

## Responsibilities
- Quản lý review theo booking/user/driver.
- Cung cấp thống kê điểm trung bình cho tài xế.
- Hỗ trợ soft delete review.

## Main Features
- Create review.
- Get review by id.
- List reviews by driverId.
- List reviews by userId.
- List reviews by bookingId.
- Update review.
- Delete review (soft delete).
- Driver rating summary.
- Health check endpoint.

## Project Structure
- `src/app.js`: middleware + routes + errors.
- `src/server.js`: bootstrap app + MongoDB.
- `src/config/database.js`: MongoDB client + indexes bootstrap.
- `src/models/review.model.js`: mapper document -> response.
- `src/repositories/review.repository.js`: data access.
- `src/services/review.service.js`: business logic + validation.
- `src/controllers/review.controller.js`: HTTP handlers.
- `src/routes/review.route.js`: route definitions.
- `src/events/*`: event stubs.
- `src/utils/*`: helper utilities.

## Environment Variables
Xem `.env.example`.

Biến chính:
- `PORT`
- `SERVICE_NAME`
- `NODE_ENV`
- `LOG_LEVEL`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `MONGO_REVIEW_COLLECTION`

## How To Run Locally
```bash
cd services/review-service
npm install
npm run start
```

## Available Scripts
- `npm run start`
- `npm run dev`

## Main API Endpoints
- `GET /health`
- `POST /reviews`
- `GET /reviews/:id`
- `GET /reviews/by-driver/:driverId`
- `GET /reviews/by-user/:userId`
- `GET /reviews/by-booking/:bookingId`
- `PUT /reviews/:id`
- `DELETE /reviews/:id`
- `GET /reviews/summary/driver/:driverId`

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

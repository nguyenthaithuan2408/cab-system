# User Service

## Overview
User Service quản lý hồ sơ hành khách (passenger profile) cho hệ thống Cab Booking System.

## Responsibilities
- Quản lý thông tin profile hành khách.
- Cung cấp API tra cứu theo `id` hoặc `accountRef`.
- Hỗ trợ deactivation (soft delete semantics qua trạng thái `isActive` + `deletedAt`).

## Main Features
- Create passenger profile.
- Get passenger profile by id.
- Get passenger profile by account reference.
- Update passenger profile.
- Deactivate passenger profile.
- Health check endpoint.

## Project Structure
- `src/app.js`: Express app, middleware, error handling.
- `src/server.js`: bootstrap service và database.
- `src/config/database.js`: cấu hình PostgreSQL + schema bootstrap.
- `src/models/user.model.js`: mapping database row -> response model.
- `src/repositories/user.repository.js`: data access layer.
- `src/services/user.service.js`: business logic + validation.
- `src/controllers/user.controller.js`: request/response handlers.
- `src/routes/user.route.js`: route definitions.
- `src/events/*`: event producer/consumer stubs.
- `src/utils/*`: app error + response helpers.

## Environment Variables
Xem `.env.example`.

Biến chính:
- `PORT`
- `SERVICE_NAME`
- `NODE_ENV`
- `LOG_LEVEL`
- `DATABASE_URL` hoặc cụm `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`

## How To Run Locally
```bash
cd services/user-service
npm install
npm run start
```

## Available Scripts
- `npm run start`: chạy production mode.
- `npm run dev`: chạy watch mode.

## Main API Endpoints
- `GET /health`
- `POST /users`
- `GET /users/:id`
- `GET /users/account/:accountRef`
- `PUT /users/:id`
- `PATCH /users/:id/deactivate`

## Sample Request / Response
### Create Passenger
`POST /users`
```json
{
  "accountRef": "auth_123",
  "fullName": "Huynh Gia Quan",
  "email": "quan@example.com",
  "phone": "+84901234567",
  "avatarUrl": "https://example.com/avatar.png",
  "gender": "male",
  "dateOfBirth": "2000-10-10"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "accountRef": "auth_123",
    "fullName": "Huynh Gia Quan",
    "email": "quan@example.com",
    "phone": "+84901234567",
    "avatarUrl": "https://example.com/avatar.png",
    "gender": "male",
    "dateOfBirth": "2000-10-10",
    "status": "ACTIVE",
    "isActive": true,
    "createdAt": "2026-04-02T00:00:00.000Z",
    "updatedAt": "2026-04-02T00:00:00.000Z"
  }
}
```

## Database Notes
- PostgreSQL table: `passenger_profiles`
- Unique constraints: `email`, `phone`, `account_ref` (nullable)
- Soft delete field: `deleted_at`

## Integration Notes / TODO
- Event publisher hiện đang là stub (`src/events/user.producer.js`) để tích hợp message broker thật ở bước tiếp theo.

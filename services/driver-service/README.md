# Driver Service

## Overview
Driver Service quản lý hồ sơ tài xế và trạng thái sẵn sàng nhận cuốc.

## Responsibilities
- Quản lý thông tin profile tài xế.
- Quản lý availability status (`ONLINE`, `OFFLINE`, `BUSY`).
- Cung cấp API list tài xế sẵn sàng.

## Main Features
- Create driver profile.
- Get driver profile by id.
- Update driver profile.
- Update/get current availability.
- List available drivers theo filter.
- Health check endpoint.

## Project Structure
- `src/app.js`: middleware + routes + error handling.
- `src/server.js`: bootstrap service.
- `src/config/database.js`: PostgreSQL config và schema bootstrap.
- `src/models/driver.model.js`: row mapping.
- `src/repositories/driver.repository.js`: data access.
- `src/services/driver.service.js`: business logic + validation.
- `src/controllers/driver.controller.js`: HTTP handlers.
- `src/routes/driver.route.js`: route definitions.
- `src/events/*`: event stubs.
- `src/utils/*`: response helper + app error.

## Environment Variables
Xem `.env.example`.

Biến chính:
- `PORT`
- `SERVICE_NAME`
- `NODE_ENV`
- `LOG_LEVEL`
- `DATABASE_URL` hoặc cụm `DB_*`

## How To Run Locally
```bash
cd services/driver-service
npm install
npm run start
```

## Available Scripts
- `npm run start`
- `npm run dev`

## Main API Endpoints
- `GET /health`
- `POST /drivers`
- `GET /drivers/:id`
- `PUT /drivers/:id`
- `PATCH /drivers/:id/availability`
- `GET /drivers/:id/availability`
- `GET /drivers?availabilityStatus=ONLINE&vehicleType=sedan&limit=20`

## Sample Request / Response
### Update Availability
`PATCH /drivers/:id/availability`
```json
{
  "availabilityStatus": "ONLINE"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "availabilityStatus": "ONLINE",
    "updatedAt": "2026-04-02T00:00:00.000Z"
  }
}
```

## Database Notes
- PostgreSQL table: `driver_profiles`
- Unique constraints: `email`, `phone`, `license_number`, `vehicle_plate`

## Integration Notes / TODO
- Event producer đang là stub để tích hợp broker thật.

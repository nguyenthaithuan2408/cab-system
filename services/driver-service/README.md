# Driver Service

## Purpose
Driver Service quản lý hồ sơ tài xế và trạng thái sẵn sàng nhận cuốc.

## Default Config
- Port: `3003`
- Database: PostgreSQL
- Table bootstrap tự động khi service khởi động: `driver_profiles`

## Required Environment
Tạo `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Biến quan trọng:
- `PORT`
- `DATABASE_URL` hoặc nhóm `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`

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
- Ví dụ: `curl http://localhost:3003/health`

## Main APIs
- `POST /drivers`
- `GET /drivers/:id`
- `PUT /drivers/:id`
- `PATCH /drivers/:id/availability`
- `GET /drivers/:id/availability`
- `GET /drivers?availabilityStatus=ONLINE&vehicleType=sedan&limit=20`

## Notes
- Event producer/consumer hiện là stub để tích hợp broker ở bước sau.

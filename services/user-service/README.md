# User Service

## Purpose
User Service quản lý hồ sơ hành khách (passenger profile).

## Default Config
- Port: `3002`
- Database: PostgreSQL
- Table bootstrap tự động khi service khởi động: `passenger_profiles`

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
- Ví dụ: `curl http://localhost:3002/health`

## Main APIs
- `POST /users`
- `GET /users/:id`
- `GET /users/account/:accountRef`
- `PUT /users/:id`
- `PATCH /users/:id/deactivate`

## Notes
- Event producer/consumer hiện là stub để tích hợp broker ở bước sau.

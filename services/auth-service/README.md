# Auth Service — CAB Booking System (DHHTTT18A N32)

Microservice xác thực và phân quyền người dùng trong hệ thống đặt xe CAB Booking.

---

## 📋 Tổng quan

| Mục | Giá trị |
|-----|---------|
| **Port** | `3001` |
| **Database** | PostgreSQL (`cab_booking`) |
| **Cache / Blocklist** | Redis |
| **Auth** | JWT (Access 15m + Refresh 7d) |

---

## 🗂 Cấu trúc thư mục

```
auth-service/
├── prisma/
│   └── schema.prisma          # Prisma schema (User model)
├── src/
│   ├── config/
│   │   ├── database.js        # Prisma client singleton
│   │   └── redis.js           # Redis client
│   ├── controllers/
│   │   └── auth.controller.js # Request handlers
│   ├── events/
│   │   ├── auth.producer.js   # Kafka producer (TODO)
│   │   └── auth.consumer.js   # Kafka consumer (TODO)
│   ├── middlewares/
│   │   └── auth.middleware.js # JWT + Redis blocklist check
│   ├── models/
│   │   └── auth.model.js      # Prisma model docs
│   ├── repositories/
│   │   └── auth.repository.js # DB query layer (TODO)
│   ├── routes/
│   │   ├── auth.route.js      # /api/auth/* routes
│   │   └── health.route.js    # /health route
│   ├── services/
│   │   └── auth.service.js    # Business logic
│   ├── utils/
│   │   └── validations.js     # Zod schemas
│   ├── app.js                 # Express app setup
│   ├── server.js              # Entry point
│   └── test_auth.js           # Manual test script
├── .env                       # Local env vars (gitignored)
├── .env.example               # Template for env vars
├── .gitignore
├── Dockerfile
└── package.json
```

---

## 🔌 API Endpoints

| Method | Route | Auth | Mô tả |
|--------|-------|------|-------|
| `GET`  | `/health` | Public | Health check |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Public | Đăng nhập |
| `POST` | `/api/auth/logout` | Bearer | Đăng xuất (revoke token) |
| `GET`  | `/api/auth/me` | Bearer | Lấy thông tin user hiện tại |

### Ví dụ Register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123","name":"Test User","role":"USER"}'
```

### Ví dụ Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
```

### Ví dụ Me

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## 🚀 Khởi chạy (Local Dev)

### 1. Đảm bảo infrastructure đang chạy

Từ thư mục gốc `cab-system-main/` (hoặc thư mục có `docker-compose.yml`):

```bash
docker-compose up -d postgres redis
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Tạo Prisma client

```bash
npx prisma generate
```

### 4. Migrate database (tạo bảng `users`)

```bash
npx prisma migrate dev --name init
```

### 5. Chạy service

```bash
npm run dev
```

Service sẽ chạy trên `http://localhost:3001`

---

## 🧪 Test thủ công

```bash
node src/test_auth.js
```

---

## 🔒 Cơ chế bảo mật

- **Password**: bcrypt hash với salt 10 rounds
- **Access Token**: JWT, hết hạn sau 15 phút
- **Refresh Token**: JWT, hết hạn sau 7 ngày
- **Logout**: Token bị revoke bằng cách lưu vào Redis blocklist cho đến khi hết hạn tự nhiên

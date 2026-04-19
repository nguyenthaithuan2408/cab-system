# CAB Booking System (Backend Microservices)

Repository này hiện được khôi phục về trạng thái ổn định để tiếp tục phát triển backend microservices.

## Current Scope

Các service đang có mã nguồn và README chạy thực tế:
- `services/user-service` (PostgreSQL)
- `services/driver-service` (PostgreSQL)
- `services/payment-service` (PostgreSQL)
- `services/review-service` (MongoDB)

Các service khác trong repo là nền ban đầu/chưa chuẩn hóa tài liệu vận hành.

## Service Matrix

| Service | Path | Port mặc định | Database |
|---|---|---:|---|
| User | `services/user-service` | `3002` | PostgreSQL |
| Driver | `services/driver-service` | `3003` | PostgreSQL |
| Payment | `services/payment-service` | `3007` | PostgreSQL |
| Review | `services/review-service` | `3008` | MongoDB |

## Prerequisites

- Node.js `>= 18`
- npm
- PostgreSQL `>= 14` (cho user/driver/payment)
- MongoDB `>= 6` (cho review)

## Quick Start

### 1) Chuẩn bị môi trường

- Mỗi service dùng file `.env` riêng.
- Repo đã có `.env.example` cho tất cả service trong thư mục `services/`.

Tạo `.env` hàng loạt từ template:
```bash
for d in services/*-service; do
  cp "$d/.env.example" "$d/.env"
done
```

Nếu bạn chỉ chạy 4 service đang hoàn thiện:
```bash
cp services/user-service/.env.example services/user-service/.env
cp services/driver-service/.env.example services/driver-service/.env
cp services/payment-service/.env.example services/payment-service/.env
cp services/review-service/.env.example services/review-service/.env
```

### 2) Chạy MongoDB local (cho review-service)

```bash
docker compose -f docker-compose.mongo.yml up -d
```

### 3) Chạy PostgreSQL local

Bạn có thể dùng PostgreSQL local hoặc container riêng. Tối thiểu cần tạo DB:
- `user_service_db`
- `driver_service_db`
- `payment_service_db`

### 4) Chạy từng service

```bash
cd services/user-service && npm install && npm run dev
cd services/driver-service && npm install && npm run dev
cd services/payment-service && npm install && npm run dev
cd services/review-service && npm install && npm run dev
```

## Health Checks

- User: `GET http://localhost:3002/health`
- Driver: `GET http://localhost:3003/health`
- Payment: `GET http://localhost:3007/health`
- Review: `GET http://localhost:3008/health`

## Test

Trong từng service:
```bash
npm test
```

## Branch Notes

Các nhánh `service/user`, `service/driver`, `service/payment`, `service/review` đã được khôi phục về full project để tránh lỗi mất source khi chuyển nhánh.

## Important Notes

- `docker-compose.yml` hiện chưa được cấu hình (đang trống).
- Các module event producer/consumer đang ở mức stub để tích hợp broker thật ở bước tiếp theo.

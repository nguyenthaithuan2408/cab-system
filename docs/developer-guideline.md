# Cab Booking System - Developer Guideline

Tài liệu này định nghĩa các quy chuẩn bắt buộc khi phát triển và bảo trì các service trong hệ thống. Mọi service mới hoặc quá trình refactor đều phải tuân thủ nghiêm ngặt chuẩn này, được đúc kết từ kiến trúc mã nguồn hiện tại của các service chuẩn mẫu (như `auth-service`, `user-service`).

---

## 1. Quy chuẩn Cấu trúc Thư mục (Directory Structure)

Các service phải tuân theo mô hình phân lớp rõ ràng tương tự `auth-service` và `user-service`. Cấu trúc của thư mục `src/` cần có:

```text
src/
├── config/        # Chứa cấu hình kết nối Database (Prisma/PG thô), Redis, Kafka...
├── controllers/   # Validate Request, gọi Service tương ứng và trả về Response (HTTP layer).
├── services/      # Chứa core Business Logic thuần túy (không gọi thư viện DB trực tiếp).
├── repositories/  # Data Access Layer: Chịu trách nhiệm tương tác trực tiếp với Database (Prisma hoặc pg thô).
├── events/        # Cấu hình Event-driven qua Kafka: Chứa các Producers và Consumers.
├── middlewares/   # Các Express middleware cục bộ (Local error handler, custom auth roles...).
├── routes/        # Định nghĩa các endpoint của Express Router.
├── utils/         # Hàm tiện dụng chung (logger, định dạng response chuẩn, schema validator).
├── app.js         # Nơi khởi tạo Express app, cấu hình CORS, bảo mật (Helmet), và Global Middleware.
└── server.js      # Entry point: Nơi lắng nghe (listen) cổng mạng, kết nối DB/Kafka và khởi chạy server.
```

**Quy tắc bất biến:**
- **Không** viết câu truy vấn DB (Query) tại thư mục `controllers` hay `services`. Mọi giao tiếp với DB bắt buộc phải thông qua `repositories`.
- Chỉ `controllers` mới nhận tham số HTTP (`req, res, next`), `services` không biết về Request/Response.

---

## 2. Mô hình Kiến trúc Code (Code Architecture)

Luồng đi của một request chuẩn: **Route -> Controller -> Service -> Repository**

- **Controller**: Nhận Request, xác thực tính hợp lệ của dữ liệu đầu vào (ví dụ sử dụng `zod`). Gọi logic của `Service` và trả JSON Response. Nếu có ngoại lệ (`catch`), đẩy lỗi vào hàm `next(error)` để Global Error Handler bắt.
- **Service**: Xử lý logic nghiệp vụ, tính toán. Nếu có lỗi (Ví dụ: "User đã tồn tại" hay "Sai mật khẩu"), sẽ **`throw error`** thay vì tự phản hồi HTTP.
- **Repository**: Chỉ chứa các Query gọi Database (VD: `prisma.user.findUnique()`). Nhờ tách bạch tầng này, `Service` có thể dễ dàng bị Mock lại cho việc Unit Test.

**Code Snippets mẫu tại Controller (`auth-service/src/controllers/auth.controller.js`)**:
```javascript
const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body); // Validate
    const user = await authService.registerUser(validatedData); // Bước sang Service
    
    res.status(201).json({ message: 'User registered successfully', user }); // Phản hồi
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
    }
    next(error); // Chuyển lỗi về Global Middleware
  }
};
```

---

## 3. Chuẩn hóa API Response & Error Handling

Hệ thống có Format quy ước trả về chuẩn hóa giúp cho App Mobile và API Frontend Frontend dễ dàng tích hợp.

### Success Response (200 / 201)
Format trả về sử dụng utility `sendSuccess` được dùng tại `user-service` (hoặc cấu trúc JSON trực tiếp ở `auth-service`):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

### Error Response (400, 401, 500)
Tại các tầng `Service`, project hiện tại **không** tự định nghĩa thêm class `AppError` riêng mà sử dụng trực tiếp đối tượng `Error` nguyên bản của Node.js, đồng thời gán thêm thuộc tính `status` cho lỗi.

**Cách ném lỗi tại Service (`auth-service/src/services/auth.service.js`)**
```javascript
const loginUser = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401; // <--- Gán trực tiếp HTTP status
    throw error;
  }
}
```

**Global Error Handler (`user-service/src/app.js` và `utils/response.js`)**
Các app Expressều có middleware hứng lỗi ở cuối cùng có nhiệm vụ bóc tách `status` và `message` nhằm trả về Front-end format như sau:
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "ERROR",
    "details": null
  }
}
```

---

## 4. Quy chuẩn Database Connection

Project sử dụng cấu hình linh hoạt cho 2 hình thức kết nối Database:
- Đối với PostgreSQL (các core resource mạnh): Có thể sử dụng **Prisma ORM** (chuẩn mới ở `auth-service`) hoặc thư viện **`pg` pooling** thuần túy (ở `user-service`, `payment-service`).
- Đối với MongoDB: Dành cho `review-service` hoặc `notification-service`.

**Mẫu kết nối Prisma (`auth-service/src/config/database.js`)**
Khuyến khích tạo một instance Singleton global để chống sập Pool do HMR (Hot Module Replacement) khi DEV:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;
module.exports = prisma;
```

**Mẫu kết nối sử dụng thư viện `pg` thô (`user-service/src/config/database.js`)**
```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
module.exports = { pool, connectDatabase: async () => pool.query('SELECT 1') };
```

---

## 5. Giao tiếp Event-Driven (Kafka)

Những quy trình không yêu cầu tính nhất quán tức thì (Asynchronous) sẽ được thông điệp hóa vào **Kafka** (thông qua library `kafkajs`).
- **Naming Convention (Topic)**: Sử dụng cấu trúc "[entity].events" (VD: `user.events`). Tên các event là động từ dạng bị động quá khứ ở viết hoa: `USER_REGISTERED`, `USER_DELETED`.

### Phía Producer (Gửi Event)
Producer của Kafka hoạt động dưới dạng _fire-and-forget_. Bất kỳ hàm Push Event nào cũng phải được đặt trong khối `try/catch` có bắt lỗi dạng silent để **không làm ngưng trệ HTTP server chính** dù Kafka gặp sự cố rớt mạng.

**Code snippet (`auth-service/src/events/auth.producer.js`)**
```javascript
const publishUserRegistered = async (user) => {
  try {
    const prod = await _getProducer();
    await prod.send({
      topic: 'user.events',
      messages: [{ 
          key: user.id, 
          value: JSON.stringify({ event: 'USER_REGISTERED', data: user }) 
      }],
    });
  } catch (err) {
    // KHÔNG TỰ QUĂNG LỖI LÊN - Ghi log để flow API HTTP không bị crash
    logger.error('Failed to publish user.registered event');
  }
};
```

### Phía Consumer (Lắng nghe Event)
Dịch vụ đích sẽ tạo Consumer và Subscribe vào topic ở background trong entry point (file `server.js`).
```javascript
// user.events Consumer worker
await consumer.subscribe({ topic: 'user.events', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ message }) => {
    const payload = JSON.parse(message.value.toString());
    if (payload.event === 'USER_DELETED') {
      // Gọi repository nhằm xoá session
    }
  }
});
```

---

## 6. Quy chuẩn API Gateway, Port & Môi trường (Ports & Env)

Bảng Port Mapping chuẩn sử dụng xuyên suốt Infrastructure, mọi Service phải thiết lập cứng tại ENV (`docker-compose.yml`) cho đồng bộ.

| Microservice           | Port Cục bộ | Tùy chọn DataStore         | Khuyên dùng Broker ? |
|------------------------|-------------|----------------------------|----------------------|
| **API Gateway**        | 3000        | Redis (Cache/Rate Limiter) | Không                |
| **Auth Service**       | 3001        | PostgreSQL                 | Có (Sản xuất Topic)  |
| **Booking Service**    | 3002        | PostgreSQL                 | Có                   |
| **Ride Service**       | 3003        | PostgreSQL                 | Có                   |
| **Pricing Service**    | 3004        | PostgreSQL                 | Yêu cầu tối thiểu    |
| **Payment Service**    | 3005        | PostgreSQL                 | Có                   |
| **Notification Srv**   | 3006        | MongoDB                    | Có (Là Consumer)     |
| **Driver Service**     | 3007        | PostgreSQL                 | Yêu cầu tối thiểu    |
| **Review Service**     | 3008        | MongoDB                    | Yêu cầu tối thiểu    |
| **User Service**       | 3009        | PostgreSQL                 | Yêu cầu tối thiểu    |

**Tham số `.env` cốt lõi bắt buộc mọi Service cần có:**
- `PORT`: (Theo bảng trên).
- `DATABASE_URL` hoặc `MONGO_URI`: Biến trỏ thẳng đến CSDL.
- `KAFKA_BROKERS`: Định danh địa chỉ cụm cluster Broker (thường là `kafka:9092`).

---

## 7. Middleware & Authentication

Mô hình hiện tại triển khai **Zero Trust Layer** ủy quyền hoàn toàn khâu xác thực lên tuyến đầu là lớp **API Gateway**. Cách thông qua payload xuống backend bên dưới:

1. Request tới Gateway mang Token dạng `Authorization: Bearer <jwt>`.
2. **API Gateway (`api-gateway/src/middlewares/auth.middleware.js`)**: Kiểm định tính toàn vẹn (Verify JWK/RS256) đồng thời check Blacklist trên Redis phòng khi token đã bị đăng xuất trước đó.
3. Nếu hợp lệ, Gateway trực tiếp giải mã token rồi nhồi tham số vào HTTP Request Headers nhằm đi theo đường nội bộ (`x-user-id`, `x-user-role`).

**Mẫu Propagation Header:**
```javascript
// Tại api-gateway middleware:
req.headers['x-user-id'] = decoded.id;
req.headers['x-user-role'] = decoded.role;
next();
```

4. Các service con hạ tầng (như Booking, Payment) **không** bắt buộc phải implement lại core JWT xác định danh tính. Chúng có thể yên tâm lấy ID của requester vô cùng ngắn gọn thông qua:
```javascript
// Lấy ID tại mọi controller bên dưới Gateway
const requestorId = req.headers['x-user-id'];
const requestorRole = req.headers['x-user-role'];
```
Quy trình này làm giảm thiểu chi phí mã hóa không cần thiết, gia tăng hiệu suất IO cho cả hệ thống siêu tải Cab System.

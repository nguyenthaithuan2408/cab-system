# HƯỚNG DẪN LÀM VIỆC NHÓM - CAB BOOKING SYSTEM

## I. MỤC TIÊU

Project **Cab Booking System** được xây dựng theo kiến trúc Microservices.
Mỗi microservice được phát triển độc lập trên một branch riêng để các thành viên có thể làm việc song song và dễ dàng tổng hợp.

## II. QUY ĐỊNH CHUNG

1. **KHÔNG** ai được commit trực tiếp lên branch `main`.
2. Mỗi thành viên **CHỈ** được code trên branch được phân công.
3. Mỗi branch **CHỈ** làm việc với 1 microservice.
4. **Không** tự ý sửa `docker-compose.yml`, `README`, `docs`.
5. Commit message phải đúng format quy định.

## III. PHÂN CHIA BRANCH

**Branch chính:**

- `main`

**Branch cho microservice:**

- `service/auth` -> Auth Service
- `service/user` -> User Service
- `service/driver` -> Driver Service
- `service/booking` -> Booking Service
- `service/ride` -> Ride Service
- `service/pricing` -> Pricing Service
- `service/payment` -> Payment Service
- `service/review` -> Review Service
- `service/notification` -> Notification Service
- `service/api-gateway` -> API Gateway

## IV. HƯỚNG DẪN CHO MEMBER

### 1. Clone repository về máy

```bash
git clone [https://github.com/DHHTTT18A-N32-cab-system.git](https://github.com/DHHTTT18A-N32-cab-system.git)
cd DHHTTT18A-N32-cab-system
```

### 2. Chuyển sang đúng branch được giao

Ví dụ: User Service

```bash
git checkout service/user
```

### 3. Chỉ code trong đúng thư mục

Ví dụ: `services/user-service/**`

- **KHÔNG** sửa code của service khác.
- **KHÔNG** sửa branch `main`.

### 4. Commit code

```bash
git add services/user-service
git commit -m "feat(user-service): implement user APIs"
```

**Format commit:** `feat(service-name): mo ta ngan gon`

### 5. Push lên GitHub

```bash
git push origin service/user
```

### 6. Tạo Pull Request (PR)

- **Base branch:** `main`
- **Compare branch:** `service/user`
- **Mô tả PR:** Implement user service

## V. YÊU CẦU CHUNG CHO MỖI SERVICE

- Có thư mục riêng cho service.
- Có file `README.md` mô tả service.
- Có file `env.example`.
- API tuân thủ tài liệu `api-design.md`.
- Code chạy độc lập (`docker` / `npm start`).

## VI. QUY TẮC BẮT BUỘC

1. Mỗi commit chỉ nên làm 1 việc rõ ràng.
2. Không commit nhiều chức năng không liên quan trong 1 commit.
3. Commit message phải viết bằng tiếng Anh.
4. Không dùng commit message chung chung.
5. Không commit trực tiếp lên branch `main`.

## VII. FORMAT COMMIT CHUẨN

**Cú pháp:**

```text
<type>(<service>): <short description>
```

**Trong đó:**

- **type:** loại commit.
- **service:** tên service (auth, booking, payment, ...).
- **short description:** mô tả ngắn gọn (dưới 72 ký tự).

## VIII. CÁC LOẠI COMMIT (TYPE)

### 1. feat – Thêm chức năng mới

Ví dụ:

- `feat(auth): implement login API`
- `feat(booking): create booking endpoint`
- `feat(payment): emit payment.completed event`

### 2. fix – Sửa lỗi

Ví dụ:

- `fix(auth): handle expired refresh token`
- `fix(booking): prevent duplicate booking`

### 3. docs – Cập nhật tài liệu

Ví dụ:

- `docs(auth): add README`
- `docs: update commit guide`

### 4. refactor – Tối ưu code, không thay đổi logic

Ví dụ:

- `refactor(ride): split service and controller layer`

### 5. test – Viết hoặc sửa test

Ví dụ:

- `test(auth): add unit test for login`

### 6. chore – Công việc phụ trợ

Ví dụ:

- `chore: update eslint config`
- `chore: bump dependencies`

## IX. QUY TẮC ĐẶT MÔ TẢ (DESCRIPTION)

- Dùng động từ ở thì hiện tại.
- Không viết hoa chữ cái đầu.
- Không kết thúc bằng dấu chấm.

**Ví dụ đúng:**

- `implement login API`
- `add JWT validation middleware`

**Ví dụ sai:**

- `Implement Login API.` (Viết hoa, có dấu chấm)
- `fixed bug` (Dùng thì quá khứ)
- `update code` (Quá chung chung)

## X. VÍ DỤ COMMIT THỰC TẾ

```bash
git checkout service/auth
git add .
git commit -m "feat(auth): implement login and JWT refresh token"
git push origin service/auth
```

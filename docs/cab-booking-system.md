# CAB BOOKING SYSTEM

**Tác giả:** MR. HUYNH NAM
**Email:** giangdayit@gmail.com
**Aims:** Microservices - Real-time - Event-driven - AI-enabled - Zero Trust Architecture

## Tóm tắt (Abstract) / Tóm tắt điều hành (Executive Summary)
Tài liệu này trình bày việc phân tích, thiết kế và đánh giá một hệ thống ứng dụng đặt xe taxi hiện đại (CAB Booking System) dựa trên kiến trúc Microservices. Hệ thống sử dụng Node.js cho backend và React.js cho frontend, đáp ứng các yêu cầu về khả năng mở rộng, độ tin cậy, xử lý thời gian thực, bảo mật theo mô hình Zero Trust và tích hợp trí tuệ nhân tạo. Hệ thống được thiết kế hướng cloud-native, sẵn sàng triển khai trên Docker Swarm / Cloud & Kubernetes, đảm bảo tính khả thi triển khai thực tế. 

Tài liệu phù hợp sử dụng cho:
* Hồ sơ thiết kế hệ thống (System Design Document)
* Khóa luận tốt nghiệp đại học chuyên ngành Hệ thống thông tin
* Tài liệu kỹ thuật cho team phát triển & vận hành

## Technology Stack
* **Back-end:** NodeJS / ExpressJS / NestJS
* **Front-end:** React JS / Next JS + Tailwind CSS
* **Deployment:** AWS Cloud / Terraform / Kubernetes
* **Event-driven:** Kafka, RabbitMQ
* **Communication:** gRPC, restful api
* **Real-time:** web socket, hook
* **Security:** Zero trust Architecture
* **Monitor:** Grafana, Prometheus
* **Logging:** ELK

---

## Mục lục (Table of Contents)
1. Tổng quan hệ thống
2. Mục tiêu & Nguyên tắc thiết kế
3. Kiến trúc tổng thể (Overall Architecture)
4. Kiến trúc triển khai (Deployment Architecture)
5. Kiến trúc Real-time & Event-driven
6. Kiến trúc bảo mật & Zero Trust
7. Kiến trúc mở rộng & chịu lỗi (Scalability & Resilience)
8. Kiến trúc AI & Machine Learning
9. Thiết kế chi tiết (Sequence Diagrams)
   9A. Thiết kế UI/UX
10. Phương pháp nghiên cứu & tiếp cận luận văn
11. Đánh giá kiến trúc (Architecture Evaluation)
12. Failure Scenarios & Fault Handling
13. Phân tích so sánh & Trade-off
14. Stack công nghệ & Chi phí triển khai
15. Hướng phát triển tương lai (Future Work)
16. Phụ lục (Appendix)

---

## 1. Tổng quan hệ thống
Hệ thống CAB Booking là nền tảng kết nối khách hàng – tài xế – nhà vận hành theo thời gian thực, hỗ trợ:
* Đặt xe
* Định vị GPS real-time
* Ghép tài xế thông minh
* Thanh toán
* Đánh giá & quản trị

Kiến trúc áp dụng Microservices + Event-driven, cho phép từng dịch vụ mở rộng độc lập và giảm phụ thuộc lẫn nhau.

## 2. Mục tiêu & Nguyên tắc thiết kế
### 2.1 Mục tiêu
* **Scalability:** mở rộng theo lưu lượng
* **High Availability:** hệ thống luôn sẵn sàng
* **Fault Tolerance:** không có single point of failure (SPOF)
* **Real-time:** cập nhật trạng thái & vị trí tức thời
* **Cloud-native:** Docker container / Pod, orchestration (Docker Swarm / Kubernetes), CI/CD (Github Action)

### 2.2 Nguyên tắc kiến trúc
* Database per service
* Stateless services
* Async first (Event-driven)
* Zero trust security
* Observability by design

## 3. Kiến trúc tổng thể (Overall Architecture) - Microservices
* **Client Layer:** Admin Dashboard (ReactJS), Customer App (ReactJS), Driver App (ReactJS)
* **API Gateway:** NodeJs
* **Microservices Layer:** Pricing Service, Payment Service, Booking Service, Auth Service, User Service, Review Service, Driver Service, Notification Service, Ride Service
* **Message Broker:** Kafka / RabbitMQ
* **Data Layer:** PostgreSQL, MongoDB, Redis

## 4. Kiến trúc triển khai (Deployment Architecture)
Hệ thống được triển khai trên Docker Swarm / Cloud (AWS/GCP/Azure) + Terraform + Kubernetes, hỗ trợ multi-region và auto-scaling. Bao gồm Global/Regional Load Balancer định tuyến đến API Gateway Layer, sau đó gọi xuống các Microservices Pods liên kết với Managed Data Services (MongoDB Atlas, Redis Elasticache, PostgreSQL RDS/CloudSQL).

## 5. Kiến trúc Real-time & Event-driven
Sử dụng WebSocket/Socket.IO để giao tiếp real-time giữa Client Apps (Customer, Driver) và hệ thống. Các luồng event (ví dụ: `Ride Update Event`, `Driver Assigned`, `DriverLocationUpdated`) được đẩy qua Event Broker (Kafka / RabbitMQ) để xử lý bất đồng bộ. Dữ liệu GPS được stream và lưu In-memory qua Redis Geo.

## 6. Kiến trúc bảo mật & Zero Trust
### 6.1 Nguyên lý Zero Trust áp dụng
Kiến trúc thiết kế theo mô hình Zero Trust, cốt lõi:
* Never trust, always verify
* Mọi request đều phải được xác thực và ủy quyền
* Không giả định an toàn dù request đến từ mạng nội bộ
* Zero Trust áp dụng xuyên suốt: Client → Gateway → Microservices → Data.

### 6.3 - 6.10 Các lớp bảo mật
* **Client & Edge:** HTTPS/TLS 1.3 bắt buộc, WAF chống SQLi/XSS/DDoS, Rate limiting, Device fingerprinting.
* **API Gateway (PEP):** Xác thực JWT/OAuth2, kiểm tra RBAC/ABAC, Rate limit, Request validation.
* **Service-to-Service:** Sử dụng Service Mesh (Istio/Linkerd) cấp mTLS, Service identity giúp ngăn lateral movement và mã hóa traffic nội bộ.
* **IAM & Data:** Central Auth Service cấp JWT/Refresh token, HashiCorp Vault quản lý Secrets, Encryption at-rest/in-transit tuân thủ GDPR/PDPA.
* **Observability:** Audit log, Centralized logging (ELK), SIEM phát hiện bất thường.

### 6.11 Mapping Zero Trust → Failure
| Cơ chế Zero Trust | Nguy cơ |
| :--- | :--- |
| Token rotation + revoke | Token bị lộ |
| Service identity | Lateral movement / Service compromise |
| Audit & SIEM | Insider threat |
| WAF + rate limit | DDOS |

## 7. Kiến trúc mở rộng & chịu lỗi (Scalability & Resilience)
Hệ thống hỗ trợ Global Users qua Global Load Balancer phân tải xuống các Kubernetes Clusters ở nhiều Region. Áp dụng các Resilience Patterns:
* Horizontal Pod Autoscaling (HPA)
* Circuit Breaker
* Retry / Timeout
* Graceful Degradation (Fallback)
* Eventual Consistency qua Async & Back-pressure (Kafka/RabbitMQ).

## 8. Kiến trúc AI & Machine Learning
Tích hợp ML Platform (Feature Store, Model Training, Model Serving API). Dữ liệu đầu vào: GPS, Trip History, Ratings. Các Use-case chính:
1. **AI Driver Matching:** Ghép tài xế dựa trên khoảng cách (GPS), Lịch sử chuyến đi, Rating.
2. **Surge Pricing:** Giá động theo cung cầu, thời gian, khu vực.
3. **ETA Prediction:** Dự đoán ETA chính xác theo lịch sử dữ liệu.

## 9. Thiết kế chi tiết & Sequence Diagrams
* **Login & Refresh Token:** Xác thực thông qua API Gateway → Auth Service, lưu Refresh token trên Redis để xoay vòng token chuẩn enterprise.
* **Real-time GPS Update:** Driver gửi GPS qua WebSocket, Ride Service lưu vào Redis Geo và publish sự kiện `DriverLocationUpdated` qua Event Broker cho AI/ETA và hành khách.
* **AI Driver Matching:** Lọc hard constraint qua Redis Geo, đưa dữ liệu vào Feature Store & AI Service tính điểm tối ưu, sau đó trả kết quả qua Kafka. Hỗ trợ fallback rule-based.
* **Payment Failure & Retry / Saga:** Xử lý thanh toán qua 3rd-party PSP dùng Retry + Exponential Backoff. Sử dụng Saga Pattern (event-driven/choreography) để roll-back/refund khi lỗi, đảm bảo no double charge.
* **Surge Pricing & ETA:** Tính toán near real-time độc lập với luồng booking, broadcast kết quả qua Kafka và cache tại Redis để giảm độ trễ.

### 9A. Thiết kế UI/UX cho hệ thống CAB Booking
Thiết kế theo nguyên tắc Mobile-first, Real-time feedback, Role-based (Customer, Driver, Admin).

#### 9A.1 Tổng quan các ứng dụng giao diện
| Ứng dụng | Người dùng | Mục tiêu |
| :--- | :--- | :--- |
| Customer App | Hành khách | Đặt xe, theo dõi, thanh toán |
| Driver App | Tài xế | Nhận chuyến, dẫn đường, thu nhập |
| Admin Dashboard | Vận hành | Giám sát, cấu hình, phân tích |

#### 9A.2 Customer App (Hành khách)
*Danh sách màn hình chính:*
| ID | Màn hình | Mục tiêu |
| :--- | :--- | :--- |
| C1 | Splash/Onboarding | Giới thiệu & quyền truy cập |
| C2 | Login/Register | Xác thực người dùng |
| C3 | Home Map & Pickup | Đặt điểm đón |
| C4 | Destination | Nhập điểm đến |
| C5 | Ride Options | Chọn loại xe & giá |
| C6 | Searching Driver | Matching real-time |
| C7 | Ride Tracking | Theo dõi chuyến đi |
| C8 | Payment | Thanh toán |
| C9 | Rating & Feedback | Đánh giá |
| C10 | Ride History | Lịch sử |
| C11 | Profile & Wallet | Thông tin cá nhân |

*(Các màn hình Driver App và Admin Dashboard cũng được quy hoạch tương tự phục vụ nghiệp vụ cụ thể).* Công nghệ frontend sử dụng ReactJS/NextJS, Redux/React Query, Socket.IO, Mapbox, Tailwind.

## 10. Phương pháp nghiên cứu
Sử dụng Design Science Research (DSR): Xác định vấn đề -> Đề xuất kiến trúc -> Triển khai mô hình -> Đánh giá kịch bản. Trọng tâm vào backend, phân tán, AI pipeline, không đi sâu chi tiết UI/UX hay train model.

## 11. Đánh giá kiến trúc
| Thuộc tính | Giải pháp kiến trúc |
| :--- | :--- |
| Scalability | Microservices, HPA, Kafka |
| Availability | Multi-region, stateless services |
| Performance | Redis cache, async processing |
| Security | JWT, mTLS, Zero Trust |
| Maintainability | Service isolation, API contract |

## 12. Failure Scenarios & Fault Handling
| Nhóm Lỗi | Failure Scenario | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- | :--- |
| **Auth** | Auth Service down | Pod crash/ overload | API Gateway trả 503, dùng circuit breaker, cho phép refresh token cache ngắn hạn |
| **Auth** | Brute-force login | Attack | Rate limit + CAPTCHA |
| **Booking** | Không tìm thấy tài xế | Supply thấp | Retry mở rộng bán kính, fallback rule-based |
| **Booking** | Booking duplicate | Network retry | Idempotency key |
| **Real-time** | Mất kết nối WebSocket | Mobile network | Auto-reconnect, fallback polling |
| **Real-time** | Kafka lag | High throughput | Scale consumer group |
| **Payment** | Payment timeout | PSP chậm | Retry + exponential backoff |
| **Data** | PostgreSQL fail | Node crash | Read replica + failover |
| **Data** | Redis eviction | Memory pressure | TTL + recompute |
| **Infra** | Region outage | Disaster | Multi-region failover, Eventual consistency |

## 13. Phân tích so sánh & Trade-off
* **Microservices vs Monolithic:** Microservices dễ scale ngang nhưng độ phức tạp ban đầu cao hơn.
* **Trade-off:** Tăng chi phí infra và độ phức tạp vận hành để đáp ứng real-time lớn, đổi lấy khả năng scale. Dùng Eventual consistency thay cho Strong consistency.

## 14. Stack công nghệ & Chi phí triển khai
* **Message Broker:** Apache Kafka (Streams, Schema Registry)
* **Data Layer:** PostgreSQL (Transactional), MongoDB (NoSQL), Redis (Cache), OpenSearch (Search)
* **AI/ML:** Python, PyTorch/TensorFlow, FastAPI/TorchServe, Feast, Airflow
* **DevOps & Security:** Kubernetes, Istio, Terraform, GitHub Actions, Prometheus+Grafana, ELK, Vault
* **Chi phí ước tính:** Startup (10k MAU): ~$500-800; Scale-up (100k MAU): ~$2,500-4,000; Large scale (1M+ MAU): $15,000+ / tháng.

## 15. Hướng phát triển tương lai
* Nâng cao AI bằng Reinforcement Learning, Graph Neural Networks (GNN), Online Learning.
* Xây dựng Data Lakehouse, Real-time analytics với Apache Flink.
* Đa vùng, Privacy-Preserving ML, và FinOps để tối ưu năng lượng.

## 16. Phụ lục (Appendix)
* **Phụ lục A - D:** Sơ đồ kiến trúc Mermaid, OpenAPI Specification cho Restful API (`/auth/login`, `/bookings`, `/rides/{id}/start`, `/payments/charge`...), State Machine cho Ride (CREATED -> MATCHING -> ASSIGNED -> PICKUP -> IN_PROGRESS -> COMPLETED -> PAID) và Payment, sơ đồ thiết kế Kafka Topics (`ride.created`, `driver.location.updated`, v.v.).
* **Phụ lục E – Threat Model (STRIDE):**
  | STRIDE | Threat | Mitigation |
  | :--- | :--- | :--- |
  | Spoofing | Token giả | JWT+mTLS |
  | Tampering | Sửa payload | TLS + HMAC |
  | Repudiation | Chối giao dịch | Audit log |
  | Information Disclosure | Lộ PII | Encryption |
  | DoS | Flood API | Rate limit, WAF |
  | Elevation of Privilege | Leo quyền | RBAC/ABAC |
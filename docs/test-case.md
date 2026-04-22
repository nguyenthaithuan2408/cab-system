# 121 TESTCASES PROJECT CAB-SYSTEM
Mỗi level gồm 10 test cases, bao phủ: API, business logic, transaction, AI services, event-driven, resilience, security, deployment và monitor.

| Test case | Test level / Test priority | Test-cases | Context | Input | Expected Result Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **LEVEL 1 - CƠ BẢN (Basic API & Flow)**<br>Mục tiêu: kiểm tra chức năng cơ bản. Hệ thống chạy đúng (happy path).<br><br>CI pipeline (unit + integration)<br>Docker hoặc non-docker<br><br>Các dịch vụ được test:<br>Auth, Booking, Driver, AI ETA, Pricing, Notification | Đăng ký user thành công | Hệ thống hoạt động bình thường, chưa tồn tại user | `"email": "user@test.com", "password": "123456", "name": "Test User"` | HTTP 201 Created<br>User được lưu DB<br>Trả về user_id<br>Không có lỗi validation |
| **2** | - | Đăng nhập trả JWT hợp lệ | User đã tồn tại trong hệ thống | `{"email": "user@test.com", "password": "123456"}` | HTTP 200 OK<br>Trả về access token (JWT)<br>Token decode hợp lệ (exp, sub): đọc được phần payload.<br>sub (Subject): Đại diện cho user_id.<br>exp (Expiration Time): Thời điểm token hết hạn. |
| **3** | - | Tạo booking với input hợp lệ | User đã login, driver available | `{"pickup": {"lat": 10.76, "lng": 106.66}, "drop": {"lat": 10.77, "lng": 106.70}, "distance_km": 5}` | HTTP 200 hoặc 201<br>status REQUESTED hoặc CONFIRMED<br>Có booking_id<br>Gọi ETA + Pricing thành công |
| **4** | - | Lấy danh sách booking của user | User đã có ít nhất 1 booking | `GET /bookings?user_id=123` | HTTP 200<br>Trả về list booking<br>Mỗi item có booking_id, status |
| **5** | - | Driver chuyển trạng thái online | Driver tồn tại trong hệ thống | `{"driver_id": "DRV001", "status": "ONLINE"}` | HTTP 200<br>Driver status updated = ONLINE<br>Có thể nhận booking |
| **6** | - | Booking được tạo với status = REQUESTED | Tạo booking thành công | `{"pickup": {"lat": 10.76, "lng": 106.66}, "drop": {"lat": 10.77, "lng": 106.70}, "distance_km": 5}` | status ban đầu = REQUESTED<br>Không bị skip sang trạng thái khác<br>Có timestamp created_at |
| **7** | - | Gọi API ETA trả về giá trị > 0 | AI ETA service hoạt động | `{"distance_km": 5, "traffic_level": 0.5}` | HTTP 200<br>eta > 0<br>eta hợp lý (ví dụ < 60 phút) |
| **8** | - | Pricing API trả về giá hợp lệ | Pricing service hoạt động | `{"distance_km": 5, "demand_index": 1.0}` | HTTP 200<br>price > base fare<br>surge >= 1 |
| **9** | - | Notification gửi thành công | Booking đã được tạo | `{"user_id": "USR123", "message": "Your ride is confirmed"}` | HTTP 200<br>Notification được gửi (log hoặc queue)<br>Không lỗi timeout |
| **10** | - | Logout invalidate token | User đang login | `Header: Authorization Bearer token` | HTTP 200<br>Token bị invalidate<br>Gọi lại API với token cũ -> 401 |
| **11** | **LEVEL 2 - VALIDATION & EDGE CASES**<br>Mục tiêu: Hệ thống phản ứng thế nào khi input sai hoặc bất thường?<br><br>CI pipeline (unit + integration)<br>Docker hoặc non-docker | Booking thiếu pickup -> lỗi 400 | User gửi request tạo booking nhưng thiếu field bắt buộc | `{"drop": {"lat": 10.77, "lng": 106.70}}` | HTTP 400 Bad Request<br>Message: "pickup is required"<br>Không tạo booking |
| **12** | - | Sai format lat/lng -> reject | Input sai kiểu dữ liệu (string thay vì float) | `{"pickup": {"lat": "abc", "lng": 106.66}, "drop": {"lat": 10.77, "lng": 106.70}}` | HTTP 422 Unprocessable Entity<br>Validation error từ schema<br>Không gọi AI services |
| **13** | - | Driver offline không nhận booking | Không có driver online trong khu vực | Booking hợp lệ | Booking status = PENDING hoặc FAILED<br>Không assign driver<br>Trả message: "No drivers available" |
| **14** | Các mục kiểm thử: Validation, Edge cases, Security basic, Idempotency, Error handling.<br>Không tin input từ client. Hệ thống luôn fail an toàn (fail-safe). Không có hành vi "undefined" | Payment method invalid -> reject | User chọn phương thức thanh toán không tồn tại | `{"payment_method": "invalid_card"}` | HTTP 400<br>Message: "Invalid payment method"<br>Không gọi Payment Service |
| **15** | - | ETA với distance = 0 | Pickup = Drop | `"distance_km": 0` | eta = 0 hoặc rất nhỏ<br>Không crash<br>Không trả giá trị âm |
| **16** | - | Pricing với demand_index = 0 | Không có nhu cầu (off-peak).<br>Nguyên tắc: 1. Giá KHÔNG BAO GIỜ = 0. 2. Surge KHÔNG BAO GIỜ < 1 | `"distance_km": 5, "demand_index": 0, "supply_index": 1` | surge_multiplier = 1 (không được < 1)<br>Giá vẫn hợp lệ<br>Không chia cho 0 |
| **17** | - | Fraud API với input thiếu field | Gọi Fraud detection thiếu dữ liệu | `{"user_id": "USR123"}` | HTTP 400<br>Message: "missing required fields"<br>Không chạy model |
| **18** | - | Token expired -> 401 | User dùng token hết hạn | `Header: Authorization Bearer expired_token` | HTTP 401 Unauthorized<br>Message: "Token expired"<br>Không xử lý request |
| **19** | - | Duplicate booking request (idempotency) | User gửi request giống nhau 2 lần | Giống nhau + same idempotency_key | Chỉ tạo 1 booking<br>Request thứ 2 trả kết quả cũ<br>Không tạo duplicate |
| **20** | - | Input quá lớn (payload size test) | Client gửi request quá lớn | JSON > limit (ví dụ >1MB) | HTTP 413 Payload Too Large<br>Request bị reject<br>Không xử lý logic bên trong |
| **21** | **LEVEL 3 - INTEGRATION TEST**<br>Mục tiêu: kiểm tra các service tương tác với nhau đúng cách.<br><br>CI pipeline (unit + integration) | Booking gọi ETA service thành công | Booking Service gọi AI ETA service | `{"pickup": {"lat": 10.76, "lng": 106.66}, "drop": {"lat": 10.77, "lng": 106.70}}` | Response chứa eta > 0<br>Không timeout |
| **22** | - | Booking gọi Pricing service | Booking cần tính giá | Gọi Pricing service | Trả price > 0 |
| **23** | Các mục kiểm thử: Service-to-service, AI integration, Kafka event, API Gateway, Retry logic | AI Agent chọn driver từ Driver Service | AI Agent cần chọn driver | Danh sách driver từ service | surge >= 1<br>AI Agent nhận danh sách driver<br>Chọn driver hợp lệ<br>Driver tồn tại và online |
| **24** | - | Booking -> Payment -> Notification flow | Booking hoàn chỉnh | request booking + payment method | Booking tạo thành công<br>Payment được khởi tạo<br>Notification gửi đến user<br>Flow end-to-end thành công |
| **25** | - | Kafka event ride_requested được publish | Booking mới được tạo | Bước 1: User đặt xe<br>Bước 2: Tạo booking<br>Bước 3: Publish event<br>Bước 4: Các service nhận event | Event `ride_requested` được publish lên Kafka<br>Topic đúng: `ride_events`<br>Payload đúng format |
| **26** | - | Driver nhận notification | Booking đã assign driver | `driver_id` | Notification Service gửi message<br>Driver nhận được thông báo<br>Không bị delay lớn |
| **27** | - | Booking update trạng thái ACCEPTED | Driver accept chuyến | `{"booking_id": "BK123", "status": "ACCEPTED"}` | Status chuyển từ REQUESTED -> ACCEPTED<br>DB update thành công<br>Event `ride_accepted` được publish |
| **28<br>29** | - | MCP context được fetch thành công<br><br>API Gateway route đúng service | AI Agent cần context để đưa ra quyết định đúng. | Request từ AI Agent<br><br>Booking endpoint | MCP Gateway trả context hợp lệ<br>Có đầy đủ data (ETA, pricing, driver)<br>Không lỗi permission<br><br>Gateway route đúng Booking Service<br>Không route sai service<br>Response đúng |
| **30** | - | Retry khi Pricing service timeout | Pricing service chậm | Simulate timeout | Booking Service retry<br>Hoặc fallback giá<br>Không crash |
| **31** | **LEVEL 4 - TRANSACTION**<br>Mục tiêu: Hệ thống có giữ được tính nhất quán dữ liệu không | Transaction tạo booking thành công | User tạo booking hợp lệ | request/booking | Booking được tạo<br>Status REQUESTED<br>DB commit thành công<br>Không partial write |
| **32<br>33** | Transaction test đảm bảo: Không mất tiền, Không duplicate booking, Không trạng thái lỗi. | Rollback khi lỗi giữa chừng<br><br>Payment thất bại -> rollback booking | Lỗi xảy ra sau khi insert DB<br><br>Payment service fail | Simulate lỗi sau bước tạo booking<br><br>booking + payment | Transaction rollback<br>Không có booking trong DB<br>System consistent<br><br>Booking status = FAILED hoặc CANCELLED<br>Không charge tiền |
| **34** | Không có transaction global | Idempotent transaction (duplicate request) | Client retry request | Cùng Idempotency-Key | Chỉ 1 transaction được thực hiện<br>Không double charge<br>Trả kết quả cũ<br>Không tạo duplicate |
| **35<br>36** | Phải dùng: Saga pattern, Event-driven, Compensation | Concurrent booking (race condition)<br><br>Saga transaction success flow | 2 request cùng lúc<br><br>Distributed transaction | 2 request booking song song<br><br>Full flow | Lock hoặc conflict resolve<br>System consistent<br><br>Tất cả bước thành công<br>Saga complete<br>State nhất quán |
| **37** | - | Saga transaction - failure + compensation | Payment fail sau booking | Simulate failure | Trigger compensation<br>Booking CANCELLED<br>Refund (nếu cần) |
| **38** | - | Kafka event consistency (outbox pattern) | DB update + publish event | Create booking | DB commit và Kafka event đồng bộ<br>Không mất event |
| **39** | - | Partial failure (network issue) | Network fail khi gọi Payment | Simulate timeout | Không duplicate event<br>Retry hoặc fallback<br>Không inconsistent state<br>Transaction không "kẹt" |
| **40<br>41<br>42** | Data integrity (ACID)<br><br>**LEVEL 5 - AI SERVICE VALIDATION** | ETA model output trong range hợp lý<br>Pricing surge > 1 khi demand cao | User đặt xe tạo booking tính giá -> thanh toán -> assign driver | - | Atomic, Consistent, Isolated, Durable |
| **43** | - | Fraud score > threshold flagged | - | - | - |
| **44** | - | Recommendation trả top-3 drivers | - | - | - |
| **45** | - | Forecast trả dữ liệu đúng format | - | - | - |
| **46** | - | Model version được trả về đúng | - | - | - |
| **47** | - | AI latency < 200ms | - | - | - |
| **48** | - | Drift detection trigger | - | - | - |
| **49** | - | Model fallback khi lỗi | - | - | - |
| **50** | - | Input bất thường -> model không crash | - | - | - |
| **51** | **LEVEL 6 - AI AGENT LOGIC** | Agent chọn driver gần nhất | - | - | - |
| **52** | - | Agent chọn driver có rating cao hơn | - | - | - |
| **53** | - | Agent cân bằng ETA vs price | - | - | - |
| **54** | - | Agent gọi đúng tool (ETA vs Pricing) | - | - | - |
| **55** | - | Agent xử lý context thiếu dữ liệu | - | - | - |
| **56** | - | Agent retry khi service lỗi | - | - | - |
| **57** | - | Agent không chọn driver offline | - | - | - |
| **58** | - | Agent log decision đầy đủ | - | - | - |
| **59** | - | Agent xử lý nhiều request song song | - | - | - |
| **60** | - | Agent fallback rule-based khi AI fail | - | - | - |
| **61<br>62** | **LEVEL 7 - PERFORMANCE & LOAD TEST** | 1000 requests/second booking<br>ETA service under load | - | - | - |
| **63** | - | Pricing service under spike | - | - | - |
| **64** | - | Kafka throughput test | - | - | - |
| **65** | - | DB connection pool exhaustion | - | - | - |
| **66** | - | Redis cache hit rate > 90% | - | - | - |
| **67** | - | API Gateway rate limit | - | - | - |
| **68** | - | P95 latency < 300ms | - | - | - |
| **69** | - | Load test giờ cao điểm | - | - | - |
| **70** | - | Auto scaling hoạt động | - | - | - |
| **71<br>72** | **LEVEL 8 - FAILURE & RESILIENCE** | Driver service down fallback<br>Pricing service timeout retry | - | - | - |
| **73** | - | Kafka down -> buffer event | - | - | - |
| **74** | - | DB failover | - | - | - |
| **75** | - | Circuit breaker open | - | - | - |
| **76** | - | Partial system failure handling | - | - | - |
| **77** | - | Retry exponential backoff | - | - | - |
| **78** | - | Service mesh routing fail | - | - | - |
| **79** | - | Network partition test | - | - | - |
| **80** | - | Graceful degradation | - | - | - |
| **81** | **LEVEL 9 - SECURITY TEST** | SQL injection attempt | - | - | - |
| **82** | - | XSS input test | - | - | - |
| **83** | - | JWT tampering | - | - | - |
| **84** | - | Unauthorized API access | - | - | - |
| **85** | - | Rate limit attack | - | - | - |
| **86** | - | Replay attack (idempotency) | - | - | - |
| **87** | - | Data encryption at rest | Service cần config (DB, Kafka, Redis) | ENV: DATABASE_URL, KAFKA_BROKER | Environment variables đúng |
| **88** | - | mTLS communication | - | - | - |
| **89** | - | RBAC enforcement | - | - | - |
| **90** | - | Sensitive data masking | - | - | - |
| **91<br>92** | **LEVEL 10 - ZERO TRUST SECURITY**<br>"Never trust, always verify" - Không tin bất kỳ request nào even internal.<br>Mỗi request đều phải được xác thực + phân quyền. | Request không có token<br><br>Token bị sửa payload | Client gọi API nhưng không gửi JWT<br><br>Token không hợp lệ (tampered) | GET /booking (không Authorization header)<br><br>JWT đã bị thay đổi signature | HTTP 401 Unauthorized<br>Message: "Missing token"<br>Request bị reject ngay tại API Gateway<br><br>HTTP 401<br>Message: "Invalid token"<br>Không decode được |
| **93<br>94<br>95<br>96** | Các thành phần: Authentication, Authorization, mTLS, API Gateway security, Rate limiting, Encryption, Audit logging | Token hết hạn<br><br>Service-to-service authentication (mTLS)<br><br>User thường gọi API admin<br><br>Driver cố truy cập thông tin user khác | Token đã expired<br><br>Service A gọi Service B<br><br>RBAC - user không có quyền<br><br>Least privilege (driver không truy cập user data) | JWT có exp < current_time<br><br>Request không có certificate hợp lệ<br><br>Token role = USER gọi /admin/dashboard<br><br>driver_id gọi API /users/{user_id} | HTTP 401<br>Message: "Token expired"<br>Không cho truy cập<br><br>Request bị từ chối<br>mTLS handshake fail<br><br>HTTP 403 Forbidden<br>Message: "Access denied"<br><br>HTTP 403<br>Không trả dữ liệu user |
| **97** | - | API Gateway kiểm tra tất cả request | Request bypass service trực tiếp | Gọi trực tiếp service nội bộ (không qua gateway) | Request bị chặn<br>Chỉ cho phép traffic qua API Gateway |
| **98** | - | Rate limiting chống abuse | Client spam request | >100 requests/second | HTTP 429 Too Many Requests<br>Rate limit được áp dụng<br>Không overload hệ thống |
| **99** | - | Giao tiếp giữa các service | Data encryption in transit | Request qua HTTP (không TLS) | Request bị từ chối<br>Chỉ cho phép HTTPS/mTLS |
| **100** | - | Audit logging (security trace) | User truy cập hệ thống | Login + API call | Log đầy đủ: user_id, action, timestamp<br>Có thể trace hành vi<br>Không missing log |
| **101<br>102<br>103** | **LEVEL 11 - DEPLOYMENT**<br>Virtual Machine Cluster / Swarm / K8S<br><br>Mục tiêu: System chạy được trong môi trường thật, Không downtime khi update, Recover được khi lỗi. | Deploy service thành công (basic)<br><br>Health check endpoint<br><br>- | Deploy một microservice (Booking Service) lên môi trường staging<br><br>Service đã deploy | Docker image hợp lệ<br>Kubernetes manifest đúng<br><br>GET /health | Pod chạy thành công (status = Running)<br>Không crash (CrashLoopBackOff=false)<br>Health check pass (/health = 200)<br>HTTP 200<br>Response: "status": "ok"<br>Không timeout |
| **104** | Các thành phần kiểm thử: Deploy cơ bản, Config & ENV, DB/Kafka connectivity, Scaling, Resilience | Service connect database | DB đã deploy (Postgres) | Service start | Service connect được DB/Kafka<br>Không lỗi config missing<br>Logs không có error<br>Kết nối DB thành công<br>Query test chạy OK<br>Không timeout / connection refused |
| **105** | - | Service connect Kafka | Kafka cluster hoạt động | Service publish event | Event được gửi thành công<br>Không lỗi broker connection<br>Topic tồn tại |
| **106** | Rollback | Rolling update (zero downtime) | Deploy version mới của service | Update image version | Service không downtime<br>Request vẫn xử lý bình thường<br>Pod cũ bị terminate sau khi pod mới ready |
| **107<br>108** | - | Auto scaling (HPA)<br><br>Service mesh routing | Tải tăng cao<br><br>Sử dụng Istio/Linkerd | Simulate CPU > threshold<br><br>Request đi qua mesh | Pod scale từ 2 -> N<br>Load được phân phối đều<br>Không quá tải<br><br>Traffic route đúng service<br>mTLS hoạt động<br>Không bị drop request |
| **109** | - | Config sai fail fast | ENV sai (DB URL sai) | DATABASE_URL invalid | Service fail ngay khi start<br>Log rõ lỗi<br>Không chạy ở trạng thái "half-broken" |
| **110** | - | Rollback deployment | Deploy version lỗi | Trigger rollback | Service quay về version trước<br>Hệ thống hoạt động lại bình thường<br>Không mất dữ liệu |
| **111** | **LEVEL 12: MONITORING TESTCASES**<br>Giám sát hệ thống (Observability/ Monitoring Testing)<br>Mục tiêu: Hệ thống đang hoạt động thế nào trong production | Logging đầy đủ request | User gọi API/booking | Request booking hợp lệ | Log được ghi lại (request + response)<br>Có request_id/trace_id<br>Không thiếu thông tin quan trọng |
| **112<br>113<br>114** | Các thành phần: Logging, Metrics, Tracing, Alerting, AI Monitoring, Kafka Monitoring | Structured logging format<br><br>Metrics được expose<br><br>Dashboard hiển thị đúng | Logging system hoạt động<br><br>Service chạy với monitoring | Trigger API call<br><br>GET /metrics<br><br>Xem dashboard | Log ở dạng JSON (timestamp, service_name, level)<br>Parse được bởi Elasticsearch<br><br>HTTP 200<br>Có metrics: request count, latency<br>Đọc được bởi Prometheus<br><br>Dashboard hiển thị request rate<br>Latency (p95, p99) đúng<br>Không missing data |
| **115** | - | Distributed tracing hoạt động | Request đi qua nhiều service | Booking flow (API -> AI -> Payment) | Trace hiển thị đầy đủ span<br>Có trace_id xuyên suốt<br>Xem được trên Jaeger |
| **116<br>117** | - | Alert khi error rate cao<br><br>Alert khi latency cao | System bị lỗi nhiều<br><br>Service chậm | Simulate error rate > threshold<br><br>Latency > SLA (ví dụ >500ms) | Alert được trigger<br>Gửi notification (Slack/Email)<br>Không bị delay<br><br>Alert được trigger<br>Dashboard hiển thị spike<br>Có log liên quan |
| **118** | - | AI service monitoring | AI model chạy inference | Gọi ETA / Pricing API | Log inference time<br>Track model version<br>Monitor drift (input distribution) |
| **119** | - | Kafka monitoring | Event streaming hoạt động | Publish ride_requested | Kafka lag được ghi nhận<br>Consumer offset tracking<br>Không bị backlog lớn |
| **120** | - | Resource monitoring (CPU, Memory) | System chạy production | Load cao | CPU/memory metrics được ghi nhận<br>Không vượt ngưỡng nguy hiểm<br>Auto scaling trigger nếu cần |

---

### Lưu ý quan trọng từ tài liệu:

* Project bắt buộc phải tuân thủ theo yêu cầu về hệ thống.
# Kiến trúc tổng thể (Overall Architecture)

## 3.1 Kiến trúc tổng thể – Microservices

The Cab-BookingSystem follows a **Microservices Architecture** pattern, designed for scalability, maintainability, and distinct separation of concerns. The system is composed of four main layers:

### 1. Client Layer
The front-end interface for different user roles, built with **ReactJS**.
*   **Admin Dashboard**: For system administrators to manage users, drivers, and view analytics.
*   **Customer App**: For users to book rides, track drivers, and make payments.
*   **Driver App**: For drivers to accept rides, view routes, and update status.

### 2. Gateway Layer
The entry point for all client requests.
*   **API Gateway (Node.js)**: Handles routing, authentication, rate limiting, and protocol translation (HTTP/WebSocket).
    *   **HTTPS**: Secure REST API communication.
    *   **WebSocket**: Real-time updates for location tracking and notifications.

### 3. Microservices Layer
A suite of independent services, each responsible for specific domain logic.
*   **Auth Service**: User authentication and authorization (JWT).
*   **User Service**: User profile management (passengers).
*   **Driver Service**: Driver profile and status management.
*   **Ride Service**: Core logic for ride lifecycle (start, end, tracking).
*   **Booking Service**: Handles ride requests and dispatching.
*   **Pricing Service**: Calculates fares based on distance, time, and demand.
*   **Payment Service**: Processes transactions and manages wallets.
*   **Review Service**: Handles ratings and reviews for drivers and passengers.
*   **Notification Service**: Sends push notifications, emails, and SMS.

### 4. Data Layer & Message Broker
Persistent storage and asynchronous communication infrastructure.
*   **PostgreSQL**: Relational database for structured data (Users, Bookings, Payments).
*   **MongoDB**: NoSQL database for flexible data (Reviews, Logs).
*   **Redis**: In-memory store for caching and real-time session data.
*   **Message Broker (Kafka / RabbitMQ)**: Handles asynchronous event-driven communication between services (e.g., `RideCreated`, `PaymentSuccess`, `RideStatusChanged`).

---

## Data Flow Highlights
*   **Ride Creation**: `Booking Service` publishes `RideCreated` event -> `Message Broker` -> Consumed by `Driver Service`.
*   **Payment**: `Payment Service` publishes `PaymentSuccess` event -> `Message Broker` -> Consumed by `Notification Service`.
*   **Status Updates**: `Ride Service` publishes `RideStatusChanged` event -> `Message Broker` -> Consumed by `Notification Service` and `User Service`.

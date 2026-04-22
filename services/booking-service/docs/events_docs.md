# Booking Service - Event-Driven Architecture

This document describes the asynchronous communication of the Booking Service via Kafka.

## Kafka Configuration
- **Broker:** Defined by `KAFKA_BROKERS` env var (e.g., `kafka:9092`)
- **Group ID:** `booking-service-group`

## 1. Events Produced (Published)
Booking Service acts as a producer and fires events asynchronously (fire-and-forget outbox pattern) AFTER the database transaction commits successfully.

### Topic: `ride.events`

#### Event: `RIDE_REQUESTED`
Fired when a new booking is created successfully.
```json
{
  "event": "RIDE_REQUESTED",
  "data": {
    "id": "BK001",
    "user_id": "USR001",
    "status": "REQUESTED",
    "pickup_lat": 10.76,
    ...
  }
}
```

#### Event: `RIDE_ACCEPTED`
Fired when a driver accepts the booking.
```json
{
  "event": "RIDE_ACCEPTED",
  "data": {
    "id": "BK001",
    "driver_id": "DRV001",
    "status": "ACCEPTED",
    ...
  }
}
```

#### Event: `RIDE_CANCELLED`
Fired when a booking is cancelled by user/driver or due to system failure (Saga compensation).
```json
{
  "event": "RIDE_CANCELLED",
  "data": {
    "id": "BK001",
    "status": "CANCELLED",
    "cancel_reason": "Payment failed"
  }
}
```

## 2. Events Consumed (Listened)
Booking Service listens to events from other services to update the booking status.

### Topic: `driver.events`
- **Event:** `DRIVER_ASSIGNED`
- **Action:** Updates booking status to `ACCEPTED` and sets `driver_id`.

### Topic: `payment.events`
- **Event:** `PAYMENT_SUCCESS`
- **Action:** Updates booking status from `COMPLETED` to `PAID`.
- **Event:** `PAYMENT_FAILED`
- **Action:** Triggers Saga Compensation. Cancels the booking with reason "Payment failed" and fires `RIDE_CANCELLED` event.

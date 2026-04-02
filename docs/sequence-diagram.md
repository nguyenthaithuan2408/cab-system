# Sequence Diagrams

## 1. Ride Booking Flow
**Scenario**: A customer requests a ride, and the system matches them with a driver.

```mermaid
sequenceDiagram
    participant C as Customer App
    participant GW as API Gateway
    participant BS as Booking Service
    participant PS as Pricing Service
    participant DS as Driver Service
    participant MB as Message Broker
    participant NT as Notification Service
    participant D as Driver App

    C->>GW: POST /bookings (pickup, dropoff)
    GW->>BS: Create Booking
    BS->>PS: Get Fare Estimate()
    PS-->>BS: return Estimated Fare
    BS->>BS: Save Booking (Status: PENDING)
    BS-->>C: Return Booking ID (Waiting for driver)
    
    par Async Dispatch
        BS->>MB: Publish Event: RideCreated
        MB->>DS: Consume: RideCreated
    end

    DS->>DS: Find Nearby Drivers
    DS->>MB: Publish Event: DriverMatchRequest
    MB->>NT: Send Notify to Driver
    NT->>D: Push Notification (New Ride Request)
    
    D->>GW: POST /bookings/accept
    GW->>BS: Update Status (ACCEPTED)
    BS->>MB: Publish Event: RideAccepted
    MB->>NT: Notify Customer and Driver
    NT->>C: Push Notification (Driver Found)
```

## 2. Payment Flow
**Scenario**: Ride is completed, and payment is processed.

```mermaid
sequenceDiagram
    participant D as Driver App
    participant GW as API Gateway
    participant RS as Ride Service
    participant PayS as Payment Service
    participant MB as Message Broker
    participant NT as Notification Service
    participant C as Customer App

    D->>GW: POST /rides/{id}/complete
    GW->>RS: Complete Ride & Calculate Final Amount
    RS->>PayS: Initiate Charge (User ID, Amount)
    
    alt Payment Successful
        PayS->>PayS: Deduct Balance / Charge Card
        PayS->>MB: Publish Event: PaymentSuccess
        PayS-->>RS: Return Success
        RS-->>D: Ride Closed (Success)
        
        MB->>NT: Consume: PaymentSuccess
        NT->>C: Email Receipt / Push Notice
    else Insufficient Funds
        PayS-->>RS: Payment Failed
        RS->>MB: Publish Event: PaymentFailed
        MB->>NT: Notify User (Payment Failed)
    end
```

## 3. Real-time Location Update
**Scenario**: Driver updates location while moving.

```mermaid
sequenceDiagram
    participant D as Driver App
    participant GW as API Gateway (WebSocket)
    participant RS as Ride Service
    participant C as Customer App

    loop Every 5 Seconds
        D->>GW: WebSocket: UpdateLocation(lat, lng)
        GW->>RS: Process Location Update
        RS->>RS: Update Ride Tracking
        RS->>GW: Push Location to Subscriber (Customer)
        GW->>C: WebSocket: DriverLocationUpdate(lat, lng)
    end
```

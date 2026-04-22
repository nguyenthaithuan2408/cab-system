# Booking Service API Documentation

## Overview
Booking Service REST APIs for Cab Booking System.

## Base URL
`/bookings`

## Authentication
This service implements Zero Trust Layer as per `developer-guideline.md`. All requests must be authenticated and routed through the API Gateway.
The API Gateway verifies the JWT token and passes the user identity via HTTP Headers.

**Required Headers:**
- `x-user-id`: string (User ID)
- `x-user-role`: string (`customer` | `driver` | `admin`)
- `x-trace-id`: string (Optional, generated if missing)

## Endpoints

### 1. Create a Booking
- **Method:** `POST`
- **Path:** `/bookings`
- **Roles:** `customer`, `admin`
- **Headers:** `Idempotency-Key` (Optional, string)

**Request Body:**
```json
{
  "pickup": { "lat": 10.76, "lng": 106.66, "address": "123 Nguyen Hue" },
  "drop": { "lat": 10.77, "lng": 106.70, "address": "456 Le Loi" },
  "distance_km": 5,
  "payment_method": "cash"
}
```

**Success Response (201 Created) / (200 OK if Idempotent):**
```json
{
  "success": true,
  "data": {
    "booking_id": "BK001",
    "status": "REQUESTED",
    "created_at": "2023-10-25T10:00:00Z"
  }
}
```

### 2. Get Bookings
- **Method:** `GET`
- **Path:** `/bookings`
- **Roles:** All

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": "BK001",
      "status": "REQUESTED"
    }
  ],
  "pagination": {
     "total": 1,
     "limit": 20,
     "offset": 0
  }
}
```

### 3. Accept Booking
- **Method:** `POST`
- **Path:** `/bookings/:id/accept`
- **Roles:** `driver`, `admin`

**Request Body:**
```json
{
  "driver_id": "DRV001"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ACCEPTED",
    "driver_id": "DRV001",
    "accepted_at": "2023-10-25T10:05:00Z"
  }
}
```

### 4. Cancel Booking
- **Method:** `POST`
- **Path:** `/bookings/:id/cancel`
- **Roles:** All

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "CANCELLED",
    "cancel_reason": "Changed my mind"
  }
}
```

## Standard Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": null
  }
}
```

# API Specification (High-Level)

This document outlines the primary REST API endpoints exposed by the API Gateway for the Cab-BookingSystem.

## Base URL
`https://api.cab-booking-system.com/api/v1`

## 1. Authentication Service (`/auth`)
*   `POST /auth/register`: Register a new user or driver.
*   `POST /auth/login`: Authenticate and receive a JWT.
*   `POST /auth/refresh-token`: Refresh an expired access token.
*   `POST /auth/logout`: Invalidate the current session.

## 2. User Service (`/users`)
*   `GET /users/profile`: Get current user profile.
*   `PUT /users/profile`: Update user profile information.
*   `GET /users/{id}`: Get public profile of a user.

## 3. Driver Service (`/drivers`)
*   `GET /drivers/profile`: Get current driver profile.
*   `PUT /drivers/status`: Update driver availability (online/offline).
*   `PUT /drivers/location`: Update real-time driver location (Internal/WebSocket).
*   `GET /drivers/nearby`: Find drivers near a coordinate (Internal).

## 4. Ride Service (`/rides`)
*   `GET /rides/{id}`: Get details of a specific ride.
*   `POST /rides/{id}/start`: Mark a ride as started (Driver only).
*   `POST /rides/{id}/complete`: Mark a ride as completed (Driver only).
*   `GET /rides/history`: Get ride history for user or driver.

## 5. Booking Service (`/bookings`)
*   `POST /bookings`: Request a new ride.
*   `POST /bookings/cancel`: Cancel an active booking request.
*   `GET /bookings/{id}/status`: Check the status of a booking.

## 6. Pricing Service (`/pricing`)
*   `POST /pricing/estimate`: Get a fare estimate for a route.

## 7. Payment Service (`/payments`)
*   `POST /payments/charge`: Process a payment for a ride.
*   `GET /payments/history`: Get transaction history.
*   `POST /payments/wallet/topup`: Add funds to wallet.

## 8. Review Service (`/reviews`)
*   `POST /reviews`: Submit a rating and review.
*   `GET /reviews/driver/{driverId}`: Get reviews for a driver.

## 9. Notification Service (`/notifications`)
*   `GET /notifications`: Get list of user notifications.
*   `PUT /notifications/{id}/read`: Mark notification as read.
*   `POST /notifications/device-token`: Register device for push notifications.

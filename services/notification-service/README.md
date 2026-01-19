# Notification Service

## Description
Notification Service is responsible for handling and delivering notifications to users across multiple channels (email, SMS, push, in-app) in the Cab Booking System.

## Features
- Send notifications to users
- Retrieve user notifications with pagination
- Mark notifications as read
- Delete notifications
- Event-driven architecture (Kafka integration)
- MongoDB for persistence
- Redis caching support

## Tech Stack
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Message Broker**: Kafka
- **Caching**: Redis (optional)
- **Logging**: Pino

## Installation

### Prerequisites
- Node.js v16+
- MongoDB running on `mongodb://localhost:27017`
- Kafka broker running on `localhost:9092`
- Redis (optional)

### Steps
1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

## Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Send Notification
```
POST /notifications/send
Content-Type: application/json

{
  "userId": "user-123",
  "title": "Booking Confirmed",
  "message": "Your booking has been confirmed",
  "type": "booking",
  "channel": "in-app",
  "relatedId": "booking-456",
  "relatedType": "booking",
  "metadata": {
    "bookingId": "booking-456"
  }
}

Response:
{
  "success": true,
  "data": {
    "_id": "notification-789",
    "userId": "user-123",
    "title": "Booking Confirmed",
    "message": "Your booking has been confirmed",
    "type": "booking",
    "status": "sent",
    "channel": "in-app",
    "createdAt": "2024-02-07T10:00:00Z"
  }
}
```

### Get User Notifications
```
GET /notifications/user/:userId?status=sent&type=booking&skip=0&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "_id": "notification-789",
      "userId": "user-123",
      "title": "Booking Confirmed",
      "message": "Your booking has been confirmed",
      "type": "booking",
      "status": "sent",
      "channel": "in-app",
      "createdAt": "2024-02-07T10:00:00Z"
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 100
  }
}
```

### Mark Notification as Read
```
PATCH /notifications/:notificationId/read

Response:
{
  "success": true,
  "data": {
    "_id": "notification-789",
    "userId": "user-123",
    "status": "read",
    "readAt": "2024-02-07T10:05:00Z"
  }
}
```

### Delete Notification
```
DELETE /notifications/:notificationId

Response:
{
  "success": true,
  "message": "Notification deleted"
}
```

### Health Check
```
GET /notifications/health

Response:
{
  "success": true,
  "message": "Notification Service is running",
  "timestamp": "2024-02-07T10:00:00Z"
}
```

## Kafka Events

### Subscribed Topics
- `booking.events` - Events from Booking Service
- `ride.events` - Events from Ride Service
- `payment.events` - Events from Payment Service

### Published Topics
- `notification.sent` - Emitted when notification is sent
- `notification.read` - Emitted when notification is read

### Event Examples

**Booking Event**
```json
{
  "type": "booking.created",
  "bookingId": "booking-123",
  "userId": "user-456",
  "timestamp": "2024-02-07T10:00:00Z"
}
```

**Ride Event**
```json
{
  "type": "ride.started",
  "rideId": "ride-123",
  "userId": "user-456",
  "timestamp": "2024-02-07T10:00:00Z"
}
```

**Payment Event**
```json
{
  "type": "payment.completed",
  "paymentId": "payment-123",
  "userId": "user-456",
  "amount": 25.50,
  "timestamp": "2024-02-07T10:00:00Z"
}
```

## Database Schema

### Notification Model
```javascript
{
  userId: String (indexed),
  title: String,
  message: String,
  type: String (enum: booking, payment, ride, promotion, alert),
  status: String (enum: sent, delivered, read),
  channel: String (enum: email, sms, push, in-app),
  metadata: Object,
  relatedId: String (indexed),
  relatedType: String (enum: booking, payment, ride, review),
  sentAt: Date,
  readAt: Date,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

## Error Handling
- 400: Bad Request - Missing required fields
- 404: Not Found - Notification not found
- 500: Internal Server Error - Server error

## Testing
```bash
npm test
```

## Git Workflow
1. Create branch: `git checkout -b service/notification`
2. Commit changes: `git commit -m "feat(notification): description"`
3. Push: `git push origin service/notification`
4. Create Pull Request

## Environment Variables
See `.env.example` for all required environment variables.

## Author
ĐĂNG – DevOps Engineer

## License
MIT

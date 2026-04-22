# Booking Service

Booking Service is a core microservice in the Cab Booking System responsible for managing the lifecycle of a ride (creation, acceptance, cancellation, and status tracking).

## Architecture Compliance
This service strictly complies with the `docs/developer-guideline.md`:
- **Zero Trust Auth:** Authentication is handled by API Gateway. This service reads `x-user-id` and `x-user-role` headers.
- **Database:** Uses `pg` pooling. DB interactions are isolated in the `repositories` layer.
- **Event-Driven:** Integrates with Kafka for asynchronous events (`ride.events`, `payment.events`, `driver.events`).
- **Standardized Responses:** All APIs return `{"success": true, "data": ...}` or `{"success": false, "error": ...}`.

## Environment Variables
Create a `.env` file based on `.env.example`:
```ini
PORT=3002
NODE_ENV=development
SERVICE_NAME=booking-service

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/cab_booking

# Kafka
KAFKA_BROKERS=localhost:9092

# External Services
PRICING_SERVICE_URL=http://localhost:3004
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the service (Development):
   ```bash
   npm run dev
   ```
3. Run tests:
   ```bash
   npm test
   ```

## Docker
Build and run using Docker:
```bash
docker-compose up --build booking-service
```

## Documentation
- [API Documentation](docs/api_docs.md)
- [Events Documentation](docs/events_docs.md)

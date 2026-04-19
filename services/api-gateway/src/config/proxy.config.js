const { AUTH_SERVICE_URL, BOOKING_SERVICE_URL, RIDE_SERVICE_URL, PRICING_SERVICE_URL, PAYMENT_SERVICE_URL } = process.env;

const proxyRoutes = [
  {
    path: '/api/v1/auth',
    target: AUTH_SERVICE_URL || 'http://localhost:3001',
    authRequired: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 requests per `windowMs` for login/register (Strict for Auth)
    }
  },
  {
    path: '/api/v1/booking',
    target: BOOKING_SERVICE_URL || 'http://localhost:3002',
    authRequired: true,
    roles: ['CUSTOMER', 'DRIVER', 'ADMIN'], // RBAC
    rateLimit: {
      windowMs: 1 * 60 * 1000, 
      max: 60, 
    }
  },
  {
    path: '/api/v1/ride',
    target: RIDE_SERVICE_URL || 'http://localhost:3003',
    authRequired: true,
    roles: ['CUSTOMER', 'DRIVER', 'ADMIN'],
    rateLimit: {
      windowMs: 1 * 60 * 1000, 
      max: 60, 
    }
  },
  {
    path: '/api/v1/pricing',
    target: PRICING_SERVICE_URL || 'http://localhost:3004',
    authRequired: true,
    roles: ['CUSTOMER', 'DRIVER', 'ADMIN'],
  },
  {
    path: '/api/v1/payment',
    target: PAYMENT_SERVICE_URL || 'http://localhost:3005',
    authRequired: true,
    roles: ['CUSTOMER', 'ADMIN'],
  },
  // WebSocket Route Example
  {
    path: '/ws/ride',
    target: RIDE_SERVICE_URL || 'http://localhost:3003',
    authRequired: true,
    isWebSocket: true
  }
];

module.exports = {
  proxyRoutes,
};

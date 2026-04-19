'use strict';

const client = require('prom-client');

// Create a dedicated registry so we don't pollute the global one
const register = new client.Registry();

// Collect default Node.js metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({
  register,
  labels: { service: 'auth-service' },
});

// Custom counter: total HTTP requests by method, route, status
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom histogram: HTTP request duration in seconds
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

module.exports = { register, httpRequestsTotal, httpRequestDurationSeconds };

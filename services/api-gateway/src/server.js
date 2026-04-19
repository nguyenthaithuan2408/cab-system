require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { proxyRoutes } = require('./config/proxy.config');
const { verifyToken } = require('./middlewares/auth.middleware');
const { rbacMiddleware } = require('./middlewares/rbac.middleware');
const { abacMiddleware } = require('./middlewares/abac.middleware');
const { globalLimiter, createDynamicLimiter } = require('./middlewares/rate-limit.middleware');

// Schemas & Validation setup for specific routes
const { validateResult } = require('./middlewares/validation.middleware');
const { loginSchema, registerSchema } = require('./schemas/auth.schema');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. GLOBAL MIDDLEWARES (Zero Trust Edge)
// ==========================================

// Security Headers
app.use(helmet()); 
// CORS
app.use(cors());
// Logging
app.use(morgan('combined'));
// Global Rate Limiting by IP
app.use(globalLimiter);

// Note: express.json() is ONLY applied to routes where Gateway needs to validate the body.
// We DO NOT apply it globally because http-proxy-middleware needs the raw request stream to forward.
// If body gets parsed globally, the proxy stream breaks unless handled explicitly.

// ==========================================
// 2. SPECIFIC PRE-PROXY VALIDATION
// ==========================================
// Example: Validate Login Payload before proxying to Auth Service
app.post(
  '/api/v1/auth/login', 
  express.json(), 
  validateResult(loginSchema), 
  (req, res, next) => next() // Pass to proxy
);

app.post(
  '/api/v1/auth/register', 
  express.json(), 
  validateResult(registerSchema), 
  (req, res, next) => next() // Pass to proxy
);

// We must reconstruct the body stream for http-proxy-middleware if it was parsed by express.json()
const fixRequestBody = (proxyReq, req, res, options) => {
    if (req.body && Object.keys(req.body).length > 0) {
        let bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
};

// ==========================================
// 3. PROXY ROUTING SETUP
// ==========================================
proxyRoutes.forEach(route => {
  const middlewares = [];

  // Apply Auth Middlewares if required
  if (route.authRequired) {
    middlewares.push(verifyToken);
    
    // RBAC
    if (route.roles && route.roles.length > 0) {
      middlewares.push(rbacMiddleware(route.roles));
    }
    
    // ABAC
    middlewares.push(abacMiddleware);
  }

  // Apply Dynamic Rate Limiting if configured for this route
  if (route.rateLimit) {
    middlewares.push(createDynamicLimiter(route.rateLimit));
  }

  // Setup the Proxy configuration
  const proxyOptions = {
    target: route.target,
    changeOrigin: true,
    ws: route.isWebSocket || false,
    onProxyReq: fixRequestBody // Fix the body if express.json() intercepted it earlier
  };

  if (route.isWebSocket) {
     app.use(route.path, createProxyMiddleware(proxyOptions));
  } else {
     app.use(route.path, ...middlewares, createProxyMiddleware(proxyOptions));
  }
});

// ==========================================
// 4. ERROR HANDLING & FALLBACK
// ==========================================
app.use((req, res, next) => {
  res.status(404).json({ message: 'Gateway: Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err);
  res.status(500).json({ message: 'Gateway: Internal Server Error' });
});

// ==========================================
// 5. SERVER STARTUP (TLS 1.3/HTTPS OR HTTP)
// ==========================================
let server;
if (fs.existsSync(process.env.SSL_KEY_PATH) && fs.existsSync(process.env.SSL_CERT_PATH)) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    minVersion: 'TLSv1.3' // Enforce TLS 1.3
  };
  server = https.createServer(options, app);
  console.log('Secure (HTTPS) server configured');
} else {
  server = http.createServer(app);
  console.warn('WARNING: SSL Certificates not found. Starting Unsecure HTTP Server.');
}

const { connectRedis } = require('./config/redis');

connectRedis().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 API Gateway is running on port ${PORT}`);
  });
});

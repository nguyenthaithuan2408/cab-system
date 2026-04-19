const rateLimit = require('express-rate-limit');

/**
 * Global Rate Limiter to prevent brute force and DDoS Layer 7 on public endpoints
 * Ex: limits everyone to 100 requests per 10 minutes total
 */
const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  message: { message: 'Too many requests from this IP, please try again after 10 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Dynamic Rate limiter builder based on route configs
 */
const createDynamicLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: { message: `Too many requests, please try again later.` },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // If user is authenticated, limit by user ID, else by IP
      return req.user ? req.user.id : req.ip;
    }
  });
};

module.exports = {
  globalLimiter,
  createDynamicLimiter
};

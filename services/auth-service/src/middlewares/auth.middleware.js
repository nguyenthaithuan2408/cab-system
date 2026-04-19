'use strict';

const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

// ---------------------------------------------------------------------------
// authenticate — verifies JWT and checks Redis blocklist
// ---------------------------------------------------------------------------

/**
 * Middleware: verify Bearer JWT in Authorization header.
 * Attaches `req.user` (decoded payload) and `req.token` (raw string) on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];

    // Check Redis blocklist (tokens revoked via logout)
    const isBlocklisted = await redisClient.get(`bl_${token}`);
    if (isBlocklisted) {
      return res.status(401).json({ message: 'Token revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ---------------------------------------------------------------------------
// authorize — RBAC enforcement
// ---------------------------------------------------------------------------

/**
 * Middleware factory: restrict route access to specific roles.
 * Must be used AFTER `authenticate` (requires req.user to be set).
 *
 * @param {...string} roles  Allowed role strings (e.g. 'ADMIN', 'DRIVER')
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/admin/users', authenticate, authorize('ADMIN'), handler);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };

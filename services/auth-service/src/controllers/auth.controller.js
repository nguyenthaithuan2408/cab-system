'use strict';

const authService = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../utils/validations');
const { publishUserRegistered } = require('../events/auth.producer');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.registerUser(validatedData);

    // Publish event — fire-and-forget, failure must NOT affect the HTTP response
    publishUserRegistered(user).catch((err) =>
      logger.error({ err, traceId: req.traceId }, '[auth-service] Kafka publish failed after register'),
    );

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData.email, validatedData.password);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors[0].message, errors: error.errors });
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/refresh-token
// ---------------------------------------------------------------------------
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: incomingToken } = req.body;
    if (!incomingToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    const tokens = await authService.refreshUserToken(incomingToken);
    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout   (requires authenticate middleware)
// ---------------------------------------------------------------------------
const logout = async (req, res, next) => {
  try {
    // Pass both the raw token and the user's ID so the service can revoke
    // both the access token blocklist entry AND the refresh token in Redis
    await authService.logoutUser(req.token, req.user?.sub);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, refreshToken };

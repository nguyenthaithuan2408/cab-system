'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const authRepository = require('../repositories/auth.repository');
const { TOKEN_TTL, REDIS_KEYS } = require('../models/auth.model');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generate a fresh (accessToken, refreshToken) pair for a user.
 * @param {{ id: string, role: string }} user
 */
const _generateTokens = (user) => {
  const payload = { sub: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: TOKEN_TTL.ACCESS,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: TOKEN_TTL.REFRESH_JWT,
  });
  return { accessToken, refreshToken };
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Register a new user.
 * Throws 400 if email already exists.
 */
const registerUser = async (data) => {
  const existingUser = await authRepository.findUserByEmail(data.email);
  if (existingUser) {
    const error = new Error('Email already registered');
    error.status = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(data.password, salt);

  const newUser = await authRepository.createUser({
    email: data.email,
    password_hash,
    name: data.name,
    role: data.role || 'USER',
  });

  logger.info({ userId: newUser.id }, '[auth-service] New user registered');
  return { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
};

/**
 * Authenticate a user with email + password.
 * Issues dual tokens and persists refresh token in Redis.
 * Throws 401 on invalid credentials.
 */
const loginUser = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const { accessToken, refreshToken } = _generateTokens(user);

  // Persist refresh token in Redis (overwrites any previous session)
  await redisClient.setEx(
    REDIS_KEYS.REFRESH_TOKEN(user.id),
    TOKEN_TTL.REFRESH_SECONDS,
    refreshToken,
  );

  logger.info({ userId: user.id }, '[auth-service] User logged in');
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
};

/**
 * Rotate tokens using a valid refresh token.
 * Verifies signature, checks Redis for current stored token,
 * then issues a new pair and revokes the old refresh token.
 * Throws 401 on any validation failure.
 */
const refreshUserToken = async (incomingRefreshToken) => {
  // Step 1: Verify JWT signature + expiry
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    const error = new Error(message);
    error.status = 401;
    throw error;
  }

  const userId = decoded.sub;

  // Step 2: Check Redis — the stored token must exactly match the incoming one
  // (prevents reuse of old refresh tokens after rotation)
  const storedToken = await redisClient.get(REDIS_KEYS.REFRESH_TOKEN(userId));
  if (!storedToken || storedToken !== incomingRefreshToken) {
    const error = new Error('Token revoked');
    error.status = 401;
    throw error;
  }

  // Step 3: Fetch current user from DB
  const user = await authRepository.findUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 401;
    throw error;
  }

  // Step 4: Issue new token pair and store new refresh token (rotation)
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = _generateTokens(user);
  await redisClient.setEx(
    REDIS_KEYS.REFRESH_TOKEN(userId),
    TOKEN_TTL.REFRESH_SECONDS,
    newRefreshToken,
  );

  logger.info({ userId }, '[auth-service] Token pair rotated');
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout: blocklist the access token and delete the refresh token from Redis.
 * @param {string} accessToken  — raw JWT string from the Authorization header
 * @param {string} [userId]     — user ID from decoded JWT (req.user.sub)
 */
const logoutUser = async (accessToken, userId) => {
  if (!accessToken) return;

  // Add access token to blocklist until it naturally expires
  const decoded = jwt.decode(accessToken);
  if (decoded && decoded.exp) {
    const remainingTtl = decoded.exp - Math.floor(Date.now() / 1000);
    if (remainingTtl > 0) {
      await redisClient.setEx(REDIS_KEYS.BLOCKLIST(accessToken), remainingTtl, 'revoked');
    }
  }

  // Revoke the user's refresh token so rotation is immediately invalidated
  if (userId) {
    await redisClient.del(REDIS_KEYS.REFRESH_TOKEN(userId));
  }

  logger.info({ userId }, '[auth-service] User logged out');
};

module.exports = { registerUser, loginUser, logoutUser, refreshUserToken };

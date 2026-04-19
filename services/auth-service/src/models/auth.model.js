'use strict';

/**
 * Domain constants for auth-service.
 * Centralizes magic strings and TTL values so they don't scatter across the codebase.
 */

/** Kafka event names published / consumed by auth-service */
const AUTH_EVENTS = Object.freeze({
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  // Consumed from other services
  USER_DELETED: 'user.deleted',
});

/** Kafka topic names */
const KAFKA_TOPICS = Object.freeze({
  USER_EVENTS: 'user.events',
});

/** Token TTL configuration */
const TOKEN_TTL = Object.freeze({
  /** JWT access token lifetime — used as jwt.sign expiresIn */
  ACCESS: '15m',
  /** Refresh token lifetime in SECONDS — used as Redis TTL */
  REFRESH_SECONDS: 7 * 24 * 60 * 60, // 7 days
  /** Refresh token lifetime as JWT duration string */
  REFRESH_JWT: '7d',
});

/** Redis key factory functions */
const REDIS_KEYS = Object.freeze({
  /** Blocklist key for a revoked access token */
  BLOCKLIST: (token) => `bl_${token}`,
  /** Stored refresh token for a user — at most one active session per user */
  REFRESH_TOKEN: (userId) => `rt_${userId}`,
});

module.exports = { AUTH_EVENTS, KAFKA_TOPICS, TOKEN_TTL, REDIS_KEYS };

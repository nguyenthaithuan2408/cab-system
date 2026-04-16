'use strict';

const pino = require('pino');

/**
 * Structured JSON logger for auth-service.
 * Outputs JSON in all environments.
 * Use LOG_LEVEL env to control verbosity (default: 'info').
 */
const logger = pino({
  name: 'auth-service',
  level: process.env.LOG_LEVEL || 'info',
  // ISO timestamp instead of epoch ms
  timestamp: pino.stdTimeFunctions.isoTime,
  // Normalize 'level' field to label string (e.g. "info") instead of number
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

module.exports = logger;

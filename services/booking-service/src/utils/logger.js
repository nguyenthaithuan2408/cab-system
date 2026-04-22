'use strict';
const env = require('../config/env');

/**
 * Structured JSON Logger
 * Test Case TC111: Logging đầy đủ request (JSON format)
 * Test Case TC112: Structured logging format - parse được bởi Elasticsearch
 * Test Case TC115: Distributed tracing - có trace_id xuyên suốt
 */

const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LEVELS[env.LOG_LEVEL] !== undefined ? LEVELS[env.LOG_LEVEL] : LEVELS.info;

/**
 * Tạo log entry dạng JSON chuẩn ELK
 */
function createLogEntry(level, message, meta = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: env.SERVICE_NAME,
    environment: env.NODE_ENV,
    message,
    ...meta,
  };
}

function log(level, message, meta) {
  if (LEVELS[level] > currentLevel) return;

  const entry = createLogEntry(level, message, meta);
  const output = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};

module.exports = logger;

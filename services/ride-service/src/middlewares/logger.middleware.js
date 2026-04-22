'use strict';
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * HTTP Request/Response Logger Middleware
 * Test Case TC111: Logging đầy đủ request + response
 * Test Case TC112: Structured JSON format - parse được bởi Elasticsearch
 * Test Case TC115: Distributed tracing - có trace_id/request_id xuyên suốt
 * Test Case TC100: Audit logging - user_id, action, timestamp
 */

function requestLogger(req, res, next) {
  // Tạo trace_id cho mỗi request (Distributed Tracing)
  const traceId =
    req.headers['x-trace-id'] ||
    req.headers['x-request-id'] ||
    uuidv4();

  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);

  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    trace_id: traceId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection?.remoteAddress,
    user_agent: req.headers['user-agent'],
    user_id: req.user?.id || null, // TC100: audit logging
  });

  // Capture response
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    const duration = Date.now() - startTime;

    const logData = {
      trace_id: traceId,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms: duration,
      user_id: req.user?.id || null,
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }

    return originalSend(body);
  };

  next();
}

module.exports = { requestLogger };

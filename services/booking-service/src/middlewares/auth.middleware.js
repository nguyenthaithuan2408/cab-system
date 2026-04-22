'use strict';
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Áp dụng kiến trúc Zero Trust Layer:
 * - API Gateway đã verify JWT và truyền tải payload qua headers nội bộ.
 * - Service bên dưới chỉ cần đọc `x-user-id` và `x-user-role` từ request.
 * - Tránh lặp lại việc giải mã JWT.
 */
function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    logger.warn('Unauthenticated request: missing x-user-id header', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required: missing user identity',
      },
    });
  }

  // Gắn user info vào request
  req.user = {
    id: userId,
    role: userRole || 'customer',
  };

  logger.debug('User authenticated via gateway headers', {
    user_id: req.user.id,
    role: req.user.role,
    path: req.path,
  });

  next();
}

/**
 * RBAC Authorization Middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      logger.warn('RBAC: Access denied', {
        user_id: req.user.id,
        user_role: req.user.role,
        required_roles: roles,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied',
        },
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };

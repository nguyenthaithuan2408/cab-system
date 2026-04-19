/**
 * Role-Based Access Control Middleware
 * @param {Array<string>} allowedRoles - List of roles permitted to access the route
 */
const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied: No role assigned' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: role ${req.user.role} is not permitted to perform this action`
      });
    }

    next();
  };
};

module.exports = {
  rbacMiddleware
};

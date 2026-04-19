const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization token not found or malformed' });
  }

  try {
    // [ZERO TRUST POLICY]: Check Token Revocation (Blacklist) using Redis
    if (redisClient.isReady) {
      const isBlacklisted = await redisClient.get(`bl_token:${token}`);
      if (isBlacklisted) {
        console.warn(`[SECURITY ALERT] Revoked token used from IP: ${req.ip}`);
        return res.status(401).json({ message: 'This token has been revoked.' });
      }
    }

    // Verify JWT. Using RS256 if JWT_PUBLIC_KEY is provided, else fallback to HS256 for dev compatibility
    const publicKey = process.env.JWT_PUBLIC_KEY ? process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n') : null;
    const secretKey = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    
    let decoded;
    if (publicKey) {
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } else {
      decoded = jwt.verify(token, secretKey);
    }

    // Attach decoded user info for ABAC/RBAC later
    req.user = decoded;
    
    // Pass headers to internal services
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-role'] = decoded.role;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', error: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
};

module.exports = {
  verifyToken
};

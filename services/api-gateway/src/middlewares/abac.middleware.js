/**
 * Attribute-Based Access Control (ABAC) Middleware
 * Real-time context evaluation for Zero Trust Architecture.
 */
const abacMiddleware = async (req, res, next) => {
  // Extract patterns assuming paths like /api/../user/:userId or /api/../driver/:driverId
  const matchUserPath = req.path.match(/\/user\/([^/]+)/);
  const matchDriverPath = req.path.match(/\/driver\/([^/]+)/);

  if (!req.user) {
     return res.status(401).json({ message: 'User context missing for ABAC' });
  }

  if (req.user.role === 'ADMIN') {
    // Admin overrides ABAC
    return next();
  }

  // 1. Static Attribute Checks
  if (matchUserPath && matchUserPath[1]) {
    const targetUserId = matchUserPath[1];
    if (req.user.id !== targetUserId) {
      console.warn(`[AUDIT] User ${req.user.id} attempted to access resource of ${targetUserId}`);
      return res.status(403).json({ 
        message: 'ABAC Error: You are not authorized to access resources belonging to another user.' 
      });
    }
  }

  if (matchDriverPath && matchDriverPath[1]) {
    const targetDriverId = matchDriverPath[1];
    if (req.user.id !== targetDriverId) {
       console.warn(`[AUDIT] User ${req.user.id} attempted to access resource of ${targetDriverId}`);
      return res.status(403).json({ 
        message: 'ABAC Error: You are not authorized to access resources belonging to another driver.' 
      });
    }
  }

  // 2. Dynamic Attribute Checks (Zero Trust Example)
  // For instance: Driver can only update GPS if they have an active ride
  const isUpdatingLocation = req.method === 'PUT' && req.path.includes('/location');
  if (req.user.role === 'DRIVER' && isUpdatingLocation) {
    // Ideally, we query Ride Service or Redis cache for current Ride Status.
    // For now, this is architected to allow async calls:
    const rideId = req.body?.rideId || req.params?.rideId;
    if (rideId) {
      // Mock call: const rideState = await rideService.getRideState(rideId);
      // if (rideState !== 'ACTIVE') return res.status(403)...
      req.abacContext = { checkedRideId: rideId, note: 'Passed Dynamic Context checking' };
    }
  }

  next();
};

module.exports = {
  abacMiddleware
};

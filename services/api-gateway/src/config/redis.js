const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Connected to Redis cache'));

// Connect asynchronously (we will call this during server start or just let it connect without awaiting in some cases, 
// but it's recommended to await it in server.js)
const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis. Zero Trust Revocation will fail open or closed based on policy.', err);
    }
};

module.exports = {
  redisClient,
  connectRedis
};

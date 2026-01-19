require('dotenv').config();
const http = require('http');
const pino = require('pino');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');
const notificationConsumer = require('./events/notification.consumer');
const notificationProducer = require('./events/notification.producer');

const logger = pino();

const server = http.createServer(app);

const PORT = process.env.PORT || 3006;

async function startServer() {
  try {
    // Connect to MongoDB (optional for development)
    try {
      await connectDB();
    } catch (dbError) {
      logger.warn('⚠️  MongoDB not available, running in development mode');
    }

    // Connect Kafka Producer & Consumer (optional)
    // Disabled in dev mode to avoid connection errors
    if (process.env.NODE_ENV === 'production') {
      try {
        await notificationProducer.connect();
        logger.info('✅ Kafka producer started');
        
        await notificationConsumer.subscribe();
        logger.info('✅ Kafka consumer subscribed');
      } catch (kafkaError) {
        logger.warn('⚠️  Kafka not available, running without event streaming');
      }
    } else {
      console.log('\n⚠️  Kafka disabled in development mode');
      console.log('To enable Kafka, set NODE_ENV=production in .env\n');
    }

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Notification Service running on port ${PORT}`);
      logger.info(`📡 API Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');

  server.close(async () => {
    try {
      await notificationProducer.disconnect();
      await notificationConsumer.disconnect();
      await disconnectDB();
      logger.info('✅ Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error.message);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

module.exports = server;

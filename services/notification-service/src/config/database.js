const mongoose = require('mongoose');
const pino = require('pino');

const logger = pino();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/notification';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info('✅ MongoDB Connected');
  } catch (error) {
    logger.error('❌ MongoDB Connection Error:', error.message);
    throw error; // Throw error instead of exit
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB Disconnected');
  } catch (error) {
    logger.error('❌ MongoDB Disconnection Error:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  mongoose,
};

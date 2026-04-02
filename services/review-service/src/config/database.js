const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'review_service_db';
const reviewCollectionName = process.env.MONGO_REVIEW_COLLECTION || 'reviews';

let client;
let db;

function getReviewCollection() {
  if (!db) {
    throw new Error('MongoDB is not connected');
  }

  return db.collection(reviewCollectionName);
}

async function connectDatabase() {
  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(dbName);
  console.info('[review-service] MongoDB connected');
}

async function initSchema() {
  const reviews = getReviewCollection();

  await reviews.createIndex({ driverId: 1, createdAt: -1 });
  await reviews.createIndex({ userId: 1, createdAt: -1 });
  await reviews.createIndex({ bookingId: 1, createdAt: -1 });
  await reviews.createIndex(
    { bookingId: 1, userId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        isDeleted: false
      },
      name: 'uniq_booking_user_active_review'
    }
  );
}

async function closeDatabase() {
  if (client) {
    await client.close();
  }
}

module.exports = {
  connectDatabase,
  initSchema,
  closeDatabase,
  getReviewCollection
};

const { ObjectId } = require('mongodb');
const { getReviewCollection } = require('../config/database');

function buildActiveFilter(filter) {
  return {
    ...filter,
    isDeleted: false
  };
}

async function createReview(payload) {
  const reviews = getReviewCollection();
  const now = new Date();

  const doc = {
    bookingId: payload.bookingId,
    driverId: payload.driverId,
    userId: payload.userId,
    rating: payload.rating,
    comment: payload.comment,
    isDeleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  };

  const result = await reviews.insertOne(doc);
  return {
    ...doc,
    _id: result.insertedId
  };
}

async function getById(id) {
  const reviews = getReviewCollection();
  return reviews.findOne(buildActiveFilter({ _id: new ObjectId(id) }));
}

async function listByDriverId(driverId) {
  const reviews = getReviewCollection();
  return reviews.find(buildActiveFilter({ driverId })).sort({ createdAt: -1 }).toArray();
}

async function listByUserId(userId) {
  const reviews = getReviewCollection();
  return reviews.find(buildActiveFilter({ userId })).sort({ createdAt: -1 }).toArray();
}

async function listByBookingId(bookingId) {
  const reviews = getReviewCollection();
  return reviews.find(buildActiveFilter({ bookingId })).sort({ createdAt: -1 }).toArray();
}

async function updateById(id, payload) {
  const reviews = getReviewCollection();

  const updateResult = await reviews.findOneAndUpdate(
    buildActiveFilter({ _id: new ObjectId(id) }),
    {
      $set: {
        ...payload,
        updatedAt: new Date()
      }
    },
    {
      returnDocument: 'after'
    }
  );

  return updateResult;
}

async function softDeleteById(id) {
  const reviews = getReviewCollection();

  return reviews.findOneAndUpdate(
    buildActiveFilter({ _id: new ObjectId(id) }),
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      returnDocument: 'after'
    }
  );
}

async function getDriverRatingSummary(driverId) {
  const reviews = getReviewCollection();

  const result = await reviews
    .aggregate([
      {
        $match: {
          driverId,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$driverId',
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ])
    .toArray();

  if (!result.length) {
    return {
      driverId,
      totalReviews: 0,
      averageRating: 0
    };
  }

  return {
    driverId,
    totalReviews: result[0].totalReviews,
    averageRating: Number(result[0].averageRating.toFixed(2))
  };
}

module.exports = {
  createReview,
  getById,
  listByDriverId,
  listByUserId,
  listByBookingId,
  updateById,
  softDeleteById,
  getDriverRatingSummary
};

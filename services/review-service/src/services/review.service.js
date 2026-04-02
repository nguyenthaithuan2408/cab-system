const { ObjectId } = require('mongodb');
const AppError = require('../utils/app-error');
const reviewRepository = require('../repositories/review.repository');
const { toReviewDocument } = require('../models/review.model');
const reviewProducer = require('../events/review.producer');

const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_COMMENT_LENGTH = 1000;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateObjectId(id, fieldName) {
  if (!ObjectId.isValid(id)) {
    throw new AppError(`${fieldName} is invalid`, 400, 'INVALID_OBJECT_ID');
  }
}

function validateRating(rating) {
  if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    throw new AppError(`rating must be an integer from ${MIN_RATING} to ${MAX_RATING}`, 400, 'INVALID_RATING');
  }
}

function validateComment(comment) {
  if (comment === undefined || comment === null) {
    return;
  }

  if (typeof comment !== 'string') {
    throw new AppError('comment must be a string', 400, 'INVALID_COMMENT');
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    throw new AppError(
      `comment exceeds max length ${MAX_COMMENT_LENGTH}`,
      400,
      'COMMENT_TOO_LONG'
    );
  }
}

function validateCreatePayload(payload) {
  if (!payload.bookingId) {
    throw new AppError('bookingId is required', 400, 'BOOKING_ID_REQUIRED');
  }

  if (!payload.driverId) {
    throw new AppError('driverId is required', 400, 'DRIVER_ID_REQUIRED');
  }

  if (!payload.userId) {
    throw new AppError('userId is required', 400, 'USER_ID_REQUIRED');
  }

  validateRating(payload.rating);
  validateComment(payload.comment);
}

async function createReview(payload) {
  const normalized = {
    bookingId: normalizeText(payload.bookingId),
    driverId: normalizeText(payload.driverId),
    userId: normalizeText(payload.userId),
    rating: Number(payload.rating),
    comment: normalizeText(payload.comment) || ''
  };

  validateCreatePayload(normalized);

  try {
    const created = await reviewRepository.createReview(normalized);
    const review = toReviewDocument(created);
    reviewProducer.publishReviewCreated({
      id: review.id,
      bookingId: review.bookingId,
      driverId: review.driverId,
      userId: review.userId,
      rating: review.rating
    });
    return review;
  } catch (error) {
    if (error && error.code === 11000) {
      throw new AppError(
        'Review for this booking by this user already exists',
        409,
        'REVIEW_ALREADY_EXISTS'
      );
    }

    throw error;
  }
}

async function getReviewById(id) {
  validateObjectId(id, 'reviewId');

  const review = await reviewRepository.getById(id);
  if (!review) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  return toReviewDocument(review);
}

async function listReviewsByDriverId(driverId) {
  const reviews = await reviewRepository.listByDriverId(driverId);
  return reviews.map(toReviewDocument);
}

async function listReviewsByUserId(userId) {
  const reviews = await reviewRepository.listByUserId(userId);
  return reviews.map(toReviewDocument);
}

async function listReviewsByBookingId(bookingId) {
  const reviews = await reviewRepository.listByBookingId(bookingId);
  return reviews.map(toReviewDocument);
}

async function updateReview(id, payload) {
  validateObjectId(id, 'reviewId');

  const updates = {};

  if (payload.rating !== undefined) {
    const rating = Number(payload.rating);
    validateRating(rating);
    updates.rating = rating;
  }

  if (payload.comment !== undefined) {
    const comment = normalizeText(payload.comment) || '';
    validateComment(comment);
    updates.comment = comment;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No updatable fields provided', 400, 'NO_UPDATES');
  }

  const updated = await reviewRepository.updateById(id, updates);
  if (!updated) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  const review = toReviewDocument(updated);
  reviewProducer.publishReviewUpdated({ id: review.id, updatedFields: Object.keys(updates) });

  return review;
}

async function deleteReview(id) {
  validateObjectId(id, 'reviewId');

  const deleted = await reviewRepository.softDeleteById(id);
  if (!deleted) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  const review = toReviewDocument(deleted);
  reviewProducer.publishReviewUpdated({ id: review.id, action: 'SOFT_DELETE' });

  return review;
}

async function getDriverRatingSummary(driverId) {
  return reviewRepository.getDriverRatingSummary(driverId);
}

module.exports = {
  createReview,
  getReviewById,
  listReviewsByDriverId,
  listReviewsByUserId,
  listReviewsByBookingId,
  updateReview,
  deleteReview,
  getDriverRatingSummary
};

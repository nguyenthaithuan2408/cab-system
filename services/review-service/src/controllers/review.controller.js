const reviewService = require('../services/review.service');
const { sendSuccess } = require('../utils/response');

async function createReview(req, res, next) {
  try {
    const data = await reviewService.createReview(req.body);
    return sendSuccess(res, 201, data);
  } catch (error) {
    return next(error);
  }
}

async function getReviewById(req, res, next) {
  try {
    const data = await reviewService.getReviewById(req.params.id);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function listReviewsByDriverId(req, res, next) {
  try {
    const data = await reviewService.listReviewsByDriverId(req.params.driverId);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function listReviewsByUserId(req, res, next) {
  try {
    const data = await reviewService.listReviewsByUserId(req.params.userId);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function listReviewsByBookingId(req, res, next) {
  try {
    const data = await reviewService.listReviewsByBookingId(req.params.bookingId);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function updateReview(req, res, next) {
  try {
    const data = await reviewService.updateReview(req.params.id, req.body);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const data = await reviewService.deleteReview(req.params.id);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function getDriverRatingSummary(req, res, next) {
  try {
    const data = await reviewService.getDriverRatingSummary(req.params.driverId);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
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

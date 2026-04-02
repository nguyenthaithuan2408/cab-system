const express = require('express');
const reviewController = require('../controllers/review.controller');

const router = express.Router();

// Spec-aligned endpoints from docs/api-spec.md
router.post('/', reviewController.createReview);
router.get('/driver/:driverId', reviewController.listReviewsByDriverId);

// Backward-compatible endpoints
router.get('/summary/driver/:driverId', reviewController.getDriverRatingSummary);
router.get('/by-driver/:driverId', reviewController.listReviewsByDriverId);
router.get('/by-user/:userId', reviewController.listReviewsByUserId);
router.get('/by-booking/:bookingId', reviewController.listReviewsByBookingId);
router.get('/:id', reviewController.getReviewById);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;

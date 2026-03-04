const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewsByDriver,
    getReviewsByUser,
    getAverageRatingByDriver,
} = require('../controllers/review.controller');

// Route to create a new review
router.post('/', createReview);

// Route to get all reviews for a specific driver
router.get('/driver/:driverId', getReviewsByDriver);

// Route to get all reviews written by a specific user
router.get('/user/:userId', getReviewsByUser);

// Route to get the average rating for a specific driver
router.get('/driver/:driverId/average-rating', getAverageRatingByDriver);

module.exports = router;
const mongoose = require('mongoose');
const Review = require('../models/review.model');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async(req, res) => {
    try {
        const { bookingId, userId, driverId, rating, comment } = req.body;

        // Check if a review for this booking already exists
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'A review for this booking already exists.' });
        }

        const review = new Review({
            bookingId,
            userId,
            driverId,
            rating,
            comment,
        });

        const createdReview = await review.save();
        res.status(201).json({ success: true, data: createdReview });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all reviews for a specific driver
// @route   GET /api/reviews/driver/:driverId
// @access  Public
const getReviewsByDriver = async(req, res) => {
    try {
        const reviews = await Review.find({ driverId: req.params.driverId }).populate('userId', 'name');
        if (!reviews) {
            return res.status(404).json({ success: false, message: 'No reviews found for this driver.' });
        }
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all reviews written by a specific user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getReviewsByUser = async(req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId }).populate('driverId', 'name');
        if (!reviews) {
            return res.status(404).json({ success: false, message: 'No reviews found from this user.' });
        }
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get average rating for a specific driver
// @route   GET /api/reviews/driver/:driverId/average-rating
// @access  Public
const getAverageRatingByDriver = async(req, res) => {
    try {
        const { driverId } = req.params;
        const stats = await Review.aggregate([{
                $match: { driverId: mongoose.Types.ObjectId(driverId) }
            },
            {
                $group: {
                    _id: '$driverId',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            res.status(200).json({ success: true, data: stats[0] });
        } else {
            res.status(404).json({ success: false, message: 'No ratings found for this driver, cannot calculate average.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};


module.exports = {
    createReview,
    getReviewsByDriver,
    getReviewsByUser,
    getAverageRatingByDriver,
};
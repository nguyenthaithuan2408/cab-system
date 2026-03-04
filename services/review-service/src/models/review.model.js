const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Booking ID is required.'],
        unique: true, // Mỗi chuyến đi chỉ có 1 đánh giá
        ref: 'Booking' // Tham chiếu đến model Booking (giả định)
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'User ID is required.'],
        ref: 'User' // Tham chiếu đến model User
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Driver ID is required.'],
        ref: 'Driver' // Tham chiếu đến model Driver
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required.'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters.']
    }
}, {
    timestamps: true // Tự động thêm trường createdAt và updatedAt
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
const express = require('express');
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());

// API Routes
const reviewRoutes = require('./routes/review.routes');
app.use('/api/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.send('Review service is running');
});

const PORT = process.env.PORT || 3008;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
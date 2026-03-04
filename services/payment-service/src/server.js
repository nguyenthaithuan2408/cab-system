import express from 'express';
import dotenv from 'dotenv';
import { createPool } from './config/database.js';

dotenv.config();

// Initialize Database Pool
createPool();

const app = express();

// Middleware
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Payment service is running with PostgreSQL!');
});

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
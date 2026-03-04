import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import {
    createPool
} from "./config/database.js";
import {
    userRouter
} from "./routes/users.js";
import {
    ensureUserTable
} from "./models/user.js";

dotenv.config();

const app = express();

// Middlewares
app.use(helmet()); // Basic security headers
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")); // Logging

const PORT = process.env.PORT || 3002;

// Database initialization
const pool = createPool();

// Attach DB pool to all requests for easy access in controllers/repositories
app.use((req, _res, next) => {
    req.db = pool;
    next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "user-service"
    });
});

// API routes
app.use("/api/users", userRouter);

// Start server function
const startServer = async () => {
    try {
        // Ensure database table exists before starting the server.
        await ensureUserTable(pool);
        console.log('"users" table checked/created successfully.');
    } catch (error) {
        console.error("Database initialization failed, starting server anyway:", error);
    }

    app.listen(PORT, () => {
        console.log(`User service listening on port ${PORT}`);
    });
};

startServer();
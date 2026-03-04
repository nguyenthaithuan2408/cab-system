import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createPool } from "./config/database.js";
import { driverRouter } from "./routes/drivers.js";
import { ensureDriverTable } from "./models/driver.js";

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const PORT = process.env.PORT || 3003;

// Database initialization
const pool = createPool();

// Attach DB pool to all requests
app.use((req, _res, next) => {
    req.db = pool;
    next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "driver-service" });
});

// API routes
app.use("/api/drivers", driverRouter);

// Start server function
const startServer = async() => {
    try {
        await ensureDriverTable(pool);
        console.log('"drivers" table checked/created successfully.');
    } catch (error) {
        console.error("Database initialization failed, starting server anyway:", error);
    }

    app.listen(PORT, () => {
        console.log(`Driver service listening on port ${PORT}`);
    });
};

startServer();
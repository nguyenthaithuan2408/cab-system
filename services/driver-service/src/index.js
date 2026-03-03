import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createPool } from "./lib/db.js";
import { driverRouter } from "./routes/drivers.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

const PORT = process.env.PORT || 3003;
const pool = createPool();

app.use((req, _res, next) => {
  req.db = pool;
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "driver-service" });
});

app.use("/drivers", driverRouter);

app.listen(PORT, () => {
  console.log(`Driver service listening on port ${PORT}`);
});


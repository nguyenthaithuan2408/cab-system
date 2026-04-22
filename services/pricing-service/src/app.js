const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const setupPricingRoutes = require("./routes/pricing.route");
const logger = require("./utils/logger");

const createApp = (pricingController) => {
	const app = express();

	app.use(helmet());
	app.use(express.json({ limit: "1mb" }));
	app.use(express.urlencoded({ extended: true }));

	// Trace ID middleware
	app.use((req, res, next) => {
		req.trace_id = req.headers["x-trace-id"] || crypto.randomUUID();
		res.setHeader("X-Trace-Id", req.trace_id);
		next();
	});

	app.get("/health", (_req, res) => {
		res.status(200).json({ status: "ok", service: "pricing-service" });
	});

	if (pricingController) {
		const pricingRoutes = setupPricingRoutes(pricingController);
		app.use("/pricing", pricingRoutes);
	}

	app.use((err, req, res, next) => {
		const status = err.status || err.statusCode || 500;
		const code = err.code || "INTERNAL_ERROR";
		
		logger.error("Unhandled error", {
			trace_id: req.trace_id,
			error: err.message,
			stack: err.stack,
			path: req.path
		});

		res.status(status).json({
			message: err.message || "Internal Server Error",
			code: code,
			details: err.details,
			trace_id: req.trace_id
		});
	});

	return app;
};

module.exports = createApp;

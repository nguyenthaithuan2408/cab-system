const express = require("express");
const pricingRoutes = require("./routes/pricing.route");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok", service: "pricing-service" });
});

app.use("/pricing", pricingRoutes);

app.use((err, _req, res, _next) => {
	const status = err.status || 500;
	res.status(status).json({
		message: err.message || "Internal Server Error",
		code: err.code || "INTERNAL_ERROR",
		details: err.details,
	});
});

module.exports = app;

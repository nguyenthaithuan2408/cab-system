const express = require("express");
const Joi = require("joi");
const { validateRequest } = require("../utils/validator");
const { authenticateJWT } = require("../utils/auth");

const setupPricingRoutes = (pricingController) => {
	const router = express.Router();

	const calculateSchema = Joi.object({
		zoneId: Joi.string().required(),
		distanceKm: Joi.number().min(0).required(),
		durationMin: Joi.number().min(0).required(),
		bookingId: Joi.string().optional(),
		demandFactor: Joi.number().optional(),
		supplyFactor: Joi.number().optional(),
		isPeak: Joi.boolean().optional(),
		weather: Joi.string().valid("clear", "rain", "storm").optional(),
		currency: Joi.string().optional(),
	});

	const currentSchema = Joi.object({
		zoneId: Joi.string().required(),
	});

	router.post(
		"/calculate",
		authenticateJWT,
		validateRequest(calculateSchema, "body"),
		pricingController.calculate
	);

	router.get(
		"/current",
		authenticateJWT,
		validateRequest(currentSchema, "query"),
		pricingController.getCurrent
	);

	return router;
};

module.exports = setupPricingRoutes;

const express = require("express");
const pricingController = require("../controllers/pricing.controller");

const router = express.Router();

router.post("/calculate", async (req, res, next) => {
	try {
		const result = await pricingController.calculate(req.body);
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
});

router.get("/current", async (req, res, next) => {
	try {
		const zoneId = req.query.zoneId;
		const result = await pricingController.getCurrent({ zoneId });
		res.status(200).json(result);
	} catch (err) {
		next(err);
	}
});

module.exports = router;

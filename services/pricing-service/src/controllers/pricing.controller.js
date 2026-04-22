const logger = require("../utils/logger");

const createPricingController = (pricingService) => {
	return {
		calculate: async (req, res, next) => {
			try {
				logger.info("Calculate pricing request received", { trace_id: req.trace_id, data: req.body });
				const result = await pricingService.calculate({ ...req.body, trace_id: req.trace_id });
				res.status(200).json(result);
			} catch (err) {
				logger.error("Calculate pricing error", { trace_id: req.trace_id, error: err.message });
				next(err);
			}
		},
		getCurrent: async (req, res, next) => {
			try {
				const zoneId = req.query.zoneId;
				logger.info("Get current pricing request received", { trace_id: req.trace_id, zoneId });
				const result = await pricingService.getCurrent({ zoneId });
				res.status(200).json(result);
			} catch (err) {
				logger.error("Get current pricing error", { trace_id: req.trace_id, error: err.message });
				next(err);
			}
		},
	};
};

module.exports = {
	createPricingController,
};

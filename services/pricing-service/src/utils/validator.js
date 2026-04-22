const Joi = require("joi");

const validateRequest = (schema, property = "body") => {
	return (req, res, next) => {
		const { error } = schema.validate(req[property], { abortEarly: false });
		if (error) {
			const details = error.details.map((d) => d.message);
			return res.status(422).json({
				message: "Validation Error",
				code: "VALIDATION_FAILED",
				details,
			});
		}
		next();
	};
};

module.exports = {
	validateRequest,
};

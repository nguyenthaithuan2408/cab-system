const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (authHeader) {
		const token = authHeader.split(" ")[1];

		jwt.verify(token, process.env.JWT_SECRET || "default_secret_key", (err, user) => {
			if (err) {
				return res.status(403).json({
					message: "Invalid token",
					code: "FORBIDDEN",
				});
			}
			req.user = user;
			next();
		});
	} else {
		res.status(401).json({
			message: "Missing token",
			code: "UNAUTHORIZED",
		});
	}
};

module.exports = {
	authenticateJWT,
};

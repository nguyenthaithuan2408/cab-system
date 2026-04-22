const http = require("http");
require("dotenv").config();
const createApp = require("./app");
const { pool } = require("./config/database");
const { initDatabase } = require("./models/pricing.model");
const { PricingRepository } = require("./repositories/pricing.repository");
const { PricingService } = require("./services/pricing.service");
const { PricingProducer } = require("./events/pricing.producer");
const { startPricingConsumer } = require("./events/pricing.consumer");
const { createPricingController } = require("./controllers/pricing.controller");
const logger = require("./utils/logger");

const PORT = Number(process.env.PORT || 3004);

const startServer = async () => {
	try {
		await pool.query("SELECT 1");
		await initDatabase(pool);

		const pricingRepository = new PricingRepository();
		const pricingProducer = new PricingProducer();
		await pricingProducer.connect();

		const pricingService = new PricingService({
			pricingRepository,
			pricingProducer,
		});

		await startPricingConsumer({
			service: pricingService,
			producer: pricingProducer,
		});

		const pricingController = createPricingController(pricingService);
		const app = createApp(pricingController);

		const server = http.createServer(app);

		server.listen(PORT, () => {
			logger.info(`Pricing service running on port ${PORT}`);
		});
	} catch (err) {
		logger.error("Failed to start pricing service", { error: err.message, stack: err.stack });
		process.exit(1);
	}
};

startServer();

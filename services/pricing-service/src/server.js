const http = require("http");
const app = require("./app");
const { pool } = require("./config/database");
const { PricingRepository } = require("./repositories/pricing.repository");
const { PricingService } = require("./services/pricing.service");
const { PricingProducer } = require("./events/pricing.producer");
const { startPricingConsumer } = require("./events/pricing.consumer");

const PORT = Number(process.env.PORT || 4005);

const startServer = async () => {
	await pool.query("SELECT 1");

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

	const server = http.createServer(app);

	server.listen(PORT, () => {
		console.log(`Pricing service running on port ${PORT}`);
	});
};

startServer().catch((err) => {
	console.error("Failed to start pricing service", err);
	process.exit(1);
});

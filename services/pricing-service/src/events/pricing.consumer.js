const { Kafka } = require("kafkajs");
const { TOPICS } = require("./pricing.producer");

const BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || "pricing-service";
const GROUP_ID = process.env.KAFKA_GROUP_ID || "pricing-service-group";

const EVENTS = {
	BOOKING_CREATED: "BOOKING_CREATED",
};

const startPricingConsumer = async ({ service, producer }) => {
	if (!service) {
		throw new Error("Pricing service is required for consumer");
	}

	const kafka = new Kafka({ clientId: CLIENT_ID, brokers: BROKERS });
	const consumer = kafka.consumer({ groupId: GROUP_ID });

	await consumer.connect();
	await consumer.subscribe({ topic: EVENTS.BOOKING_CREATED, fromBeginning: false });

	await consumer.run({
		eachMessage: async ({ message }) => {
			try {
				const payload = JSON.parse(message.value?.toString() || "{}");

				const pricingResult = await service.calculate({
					zoneId: payload.zoneId,
					distanceKm: payload.distanceKm,
					durationMin: payload.durationMin,
					bookingId: payload.bookingId,
					demandFactor: payload.demandFactor,
					supplyFactor: payload.supplyFactor,
					isPeak: payload.isPeak,
					weather: payload.weather,
					currency: payload.currency,
				});

				if (producer?.publishPriceCalculated) {
					await producer.publishPriceCalculated({
						...pricingResult,
						type: TOPICS.PRICE_CALCULATED,
						bookingId: payload.bookingId,
					});
				}
			} catch (err) {
				console.error("Pricing consumer error", err);
			}
		},
	});

	return consumer;
};

module.exports = {
	startPricingConsumer,
	EVENTS,
};

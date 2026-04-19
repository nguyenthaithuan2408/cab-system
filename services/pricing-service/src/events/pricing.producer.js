const { Kafka } = require("kafkajs");

const BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || "pricing-service";

const TOPICS = {
	PRICE_CALCULATED: "PRICE_CALCULATED",
	SURGE_UPDATED: "SURGE_UPDATED",
};

class PricingProducer {
	constructor({ kafka } = {}) {
		this.kafka = kafka || new Kafka({ clientId: CLIENT_ID, brokers: BROKERS });
		this.producer = this.kafka.producer();
		this.connected = false;
	}

	async connect() {
		if (!this.connected) {
			await this.producer.connect();
			this.connected = true;
		}
	}

	async disconnect() {
		if (this.connected) {
			await this.producer.disconnect();
			this.connected = false;
		}
	}

	async publishPriceCalculated(payload) {
		return this.publish(TOPICS.PRICE_CALCULATED, payload);
	}

	async publishSurgeUpdated(payload) {
		return this.publish(TOPICS.SURGE_UPDATED, payload);
	}

	async publish(topic, payload) {
		await this.connect();

		const message = {
			value: JSON.stringify(payload),
			timestamp: Date.now().toString(),
		};

		await this.producer.send({
			topic,
			messages: [message],
		});

		return true;
	}
}

module.exports = {
	PricingProducer,
	TOPICS,
};

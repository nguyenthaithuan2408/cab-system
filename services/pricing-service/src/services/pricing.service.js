const Redis = require("ioredis");

class PricingError extends Error {
	constructor(message, { code = "PRICING_ERROR", status = 500, details } = {}) {
		super(message);
		this.name = "PricingError";
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

class PricingService {
	constructor({ pricingRepository, pricingProducer, redisClient, cacheTtlSeconds } = {}) {
		if (!pricingRepository) {
			throw new PricingError("Pricing repository is required", {
				code: "PRICING_REPOSITORY_MISSING",
				status: 500,
			});
		}

		this.pricingRepository = pricingRepository;
		this.pricingProducer = pricingProducer || null;
		this.cacheTtlSeconds = Number(cacheTtlSeconds || process.env.PRICING_CACHE_TTL || 120);
		this.redisClient = redisClient || this.createRedisClient();
	}

	createRedisClient() {
		const redisUrl = process.env.REDIS_URL;
		if (!redisUrl) return null;

		const client = new Redis(redisUrl, {
			lazyConnect: true,
			maxRetriesPerRequest: 1,
		});

		client.on("error", (err) => {
			console.warn("Redis error", err);
		});

		return client;
	}

	async getCurrent({ zoneId }) {
		if (!zoneId) {
			throw new PricingError("zoneId is required", {
				code: "ZONE_ID_REQUIRED",
				status: 400,
			});
		}

		const cacheKey = `pricing:config:${zoneId}`;

		if (this.redisClient) {
			try {
				await this.redisClient.connect();
				const cached = await this.redisClient.get(cacheKey);
				if (cached) return JSON.parse(cached);
			} catch (err) {
				console.warn("Redis read failed", err);
			}
		}

		const pricingConfig = await this.pricingRepository.getPricingByZoneId(zoneId);
		if (!pricingConfig) {
			throw new PricingError(`Pricing config not found for zone ${zoneId}`, {
				code: "PRICING_NOT_FOUND",
				status: 404,
			});
		}

		if (this.redisClient) {
			try {
				await this.redisClient.set(
					cacheKey,
					JSON.stringify(pricingConfig),
					"EX",
					this.cacheTtlSeconds
				);
			} catch (err) {
				console.warn("Redis write failed", err);
			}
		}

		return pricingConfig;
	}

	async calculate(input) {
		const zoneId = input?.zoneId;
		const distanceKm = Number(input?.distanceKm);
		const durationMin = Number(input?.durationMin);
		const currency = input?.currency || "USD";

		if (!zoneId) {
			throw new PricingError("zoneId is required", {
				code: "ZONE_ID_REQUIRED",
				status: 400,
			});
		}

		if (!Number.isFinite(distanceKm) || distanceKm < 0) {
			throw new PricingError("distanceKm must be a non-negative number", {
				code: "INVALID_DISTANCE",
				status: 400,
			});
		}

		if (!Number.isFinite(durationMin) || durationMin < 0) {
			throw new PricingError("durationMin must be a non-negative number", {
				code: "INVALID_DURATION",
				status: 400,
			});
		}

		const pricingConfig = await this.getCurrent({ zoneId });
		const basePrice = this.calculateBasePrice({
			baseFare: pricingConfig.baseFare,
			perKm: pricingConfig.perKm,
			perMin: pricingConfig.perMin,
			distanceKm,
			durationMin,
		});

		const surgeMultiplier = this.applySurgeRules({
			baseMultiplier: pricingConfig.surgeMultiplier,
			demandFactor: input?.demandFactor,
			supplyFactor: input?.supplyFactor,
			isPeak: input?.isPeak,
			weather: input?.weather,
		});

		const finalPrice = this.roundCurrency(basePrice * surgeMultiplier);
		const calculatedAt = new Date();

		const result = {
			zoneId,
			distanceKm,
			durationMin,
			baseFare: pricingConfig.baseFare,
			perKm: pricingConfig.perKm,
			perMin: pricingConfig.perMin,
			surgeMultiplier,
			basePrice: this.roundCurrency(basePrice),
			finalPrice,
			currency,
			bookingId: input?.bookingId,
			calculatedAt,
		};

		await this.pricingRepository.savePricingHistory(result);

		if (this.pricingProducer?.publishPriceCalculated) {
			await this.pricingProducer.publishPriceCalculated({
				...result,
				type: "PRICE_CALCULATED",
			});
		}

		return result;
	}

	calculateBasePrice({ baseFare, perKm, perMin, distanceKm, durationMin }) {
		return Number(baseFare) + Number(perKm) * distanceKm + Number(perMin) * durationMin;
	}

	applySurgeRules({ baseMultiplier, demandFactor, supplyFactor, isPeak, weather }) {
		let multiplier = Number(baseMultiplier || 1);
		const maxSurge = Number(process.env.MAX_SURGE_MULTIPLIER || 3);

		if (Number.isFinite(demandFactor) && Number.isFinite(supplyFactor)) {
			const ratio = demandFactor / Math.max(supplyFactor, 1);
			if (ratio > 1.2) {
				multiplier = Math.max(multiplier, 1 + (ratio - 1) * 0.5);
			}
		}

		if (isPeak) {
			multiplier = Math.max(multiplier, 1.25);
		}

		if (weather === "rain") {
			multiplier = Math.max(multiplier, 1.15);
		}

		if (weather === "storm") {
			multiplier = Math.max(multiplier, 1.35);
		}

		if (multiplier > maxSurge) multiplier = maxSurge;

		return this.roundCurrency(multiplier);
	}

	roundCurrency(value) {
		return Number(Number(value).toFixed(2));
	}
}

module.exports = {
	PricingService,
	PricingError,
};

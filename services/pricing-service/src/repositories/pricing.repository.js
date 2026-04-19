const { query } = require("../config/database");
const {
	PRICING_CONFIG_TABLE,
	PRICING_HISTORY_TABLE,
	mapPricingRow,
} = require("../models/pricing.model");

class PricingRepository {
	async getPricingByZoneId(zoneId) {
		const result = await query(
			`
			SELECT id, zone_id, base_fare, per_km, per_min, surge_multiplier, created_at, updated_at
			FROM ${PRICING_CONFIG_TABLE}
			WHERE zone_id = $1
			ORDER BY updated_at DESC
			LIMIT 1
			`,
			[zoneId]
		);

		return mapPricingRow(result.rows[0]);
	}

	async savePricingHistory(history) {
		const {
			zoneId,
			distanceKm,
			durationMin,
			baseFare,
			perKm,
			perMin,
			surgeMultiplier,
			basePrice,
			finalPrice,
			currency,
			bookingId,
			calculatedAt,
		} = history;

		const result = await query(
			`
			INSERT INTO ${PRICING_HISTORY_TABLE}
			(zone_id, distance_km, duration_min, base_fare, per_km, per_min, surge_multiplier, base_price, final_price, currency, booking_id, calculated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
			RETURNING id
			`,
			[
				zoneId,
				distanceKm,
				durationMin,
				baseFare,
				perKm,
				perMin,
				surgeMultiplier,
				basePrice,
				finalPrice,
				currency,
				bookingId || null,
				calculatedAt || new Date(),
			]
		);

		return result.rows[0];
	}
}

module.exports = {
	PricingRepository,
};

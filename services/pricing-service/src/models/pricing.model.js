const PRICING_CONFIG_TABLE = "pricing_config";
const PRICING_HISTORY_TABLE = "pricing_history";

const PRICING_CONFIG_SCHEMA = `
CREATE TABLE IF NOT EXISTS ${PRICING_CONFIG_TABLE} (
	id SERIAL PRIMARY KEY,
	zone_id VARCHAR(64) NOT NULL,
	base_fare NUMERIC(10, 2) NOT NULL,
	per_km NUMERIC(10, 2) NOT NULL,
	per_min NUMERIC(10, 2) NOT NULL,
	surge_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pricing_config_zone ON ${PRICING_CONFIG_TABLE}(zone_id);
`;

const PRICING_HISTORY_SCHEMA = `
CREATE TABLE IF NOT EXISTS ${PRICING_HISTORY_TABLE} (
	id SERIAL PRIMARY KEY,
	zone_id VARCHAR(64) NOT NULL,
	distance_km NUMERIC(10, 2) NOT NULL,
	duration_min NUMERIC(10, 2) NOT NULL,
	base_fare NUMERIC(10, 2) NOT NULL,
	per_km NUMERIC(10, 2) NOT NULL,
	per_min NUMERIC(10, 2) NOT NULL,
	surge_multiplier NUMERIC(5, 2) NOT NULL,
	base_price NUMERIC(12, 2) NOT NULL,
	final_price NUMERIC(12, 2) NOT NULL,
	currency VARCHAR(8) NOT NULL DEFAULT 'USD',
	booking_id VARCHAR(64),
	calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pricing_history_zone ON ${PRICING_HISTORY_TABLE}(zone_id);
`;

const mapPricingRow = (row) => {
	if (!row) return null;

	return {
		id: row.id,
		zoneId: row.zone_id,
		baseFare: Number(row.base_fare),
		perKm: Number(row.per_km),
		perMin: Number(row.per_min),
		surgeMultiplier: Number(row.surge_multiplier),
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
};

const initDatabase = async (pool) => {
	try {
		await pool.query(PRICING_CONFIG_SCHEMA);
		await pool.query(PRICING_HISTORY_SCHEMA);
		console.log("Pricing database tables initialized successfully.");
	} catch (err) {
		console.error("Error initializing database tables:", err);
		throw err;
	}
};

module.exports = {
	PRICING_CONFIG_TABLE,
	PRICING_HISTORY_TABLE,
	PRICING_CONFIG_SCHEMA,
	PRICING_HISTORY_SCHEMA,
	mapPricingRow,
	initDatabase,
};

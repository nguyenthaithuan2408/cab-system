const { Pool } = require("pg");

const pool = new Pool({
	host: process.env.PGHOST || "localhost",
	port: Number(process.env.PGPORT || 5432),
	user: process.env.PGUSER || "postgres",
	password: process.env.PGPASSWORD || "postgres",
	database: process.env.PGDATABASE || "pricing_service",
	max: Number(process.env.PG_POOL_MAX || 10),
	idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
	connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 2000),
});

pool.on("error", (err) => {
	console.error("PostgreSQL pool error", err);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();
const close = () => pool.end();

module.exports = {
	pool,
	query,
	getClient,
	close,
};

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'driver_service_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5433,
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database!');
});

export const createPool = () => pool;
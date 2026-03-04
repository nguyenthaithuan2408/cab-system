class DriverRepository {
    async findById(pool, id) {
        const { rows } = await pool.query(
            'SELECT id, user_id, license_number, vehicle_details, status, current_latitude, current_longitude, created_at FROM drivers WHERE id = $1', [id]
        );
        return rows[0];
    }

    async updateStatus(pool, id, status) {
        const { rows } = await pool.query(
            'UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]
        );
        return rows[0];
    }

    async updateLocation(pool, id, { latitude, longitude }) {
        const { rows } = await pool.query(
            'UPDATE drivers SET current_latitude = $1, current_longitude = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [latitude, longitude, id]
        );
        return rows[0];
    }

    async findNearby(pool, { lat, lng, radiusKm }) {
        // This is a simplified bounding-box search. For production, consider PostGIS for accuracy.
        const degRadius = radiusKm / 111; // Approx. degrees per km
        const { rows } = await pool.query(
            `
      SELECT id, user_id, vehicle_details, status, current_latitude, current_longitude
      FROM drivers
      WHERE status = 'available' -- Changed from 'online' to be more specific
        AND current_latitude BETWEEN $1 AND $2
        AND current_longitude BETWEEN $3 AND $4
      LIMIT 50
      `, [lat - degRadius, lat + degRadius, lng - degRadius, lng + degRadius]
        );
        return rows;
    }

    // We will add create, etc. here later
}

export const driverRepository = new DriverRepository();
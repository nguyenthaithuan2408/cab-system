import { driverRepository } from '../repositories/driver.repository.js';

class DriverController {
    async getDriverProfile(req, res) {
        const driverId = req.header('x-driver-id'); // To be replaced by auth
        if (!driverId) {
            return res.status(400).json({ error: 'x-driver-id header is required' });
        }

        try {
            const driver = await driverRepository.findById(req.db, driverId);
            if (!driver) {
                return res.status(404).json({ error: 'Driver not found' });
            }
            return res.json(driver);
        } catch (err) {
            console.error('Error fetching driver profile', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateDriverStatus(req, res) {
        const driverId = req.header('x-driver-id'); // To be replaced by auth
        const { status } = req.body || {};

        if (!driverId) {
            return res.status(400).json({ error: 'x-driver-id header is required' });
        }
        if (!['available', 'offline', 'on_trip'].includes(status)) {
            return res.status(400).json({ error: "status must be one of 'available', 'offline', 'on_trip'" });
        }

        try {
            const updatedDriver = await driverRepository.updateStatus(req.db, driverId, status);
            if (!updatedDriver) {
                return res.status(404).json({ error: 'Driver not found' });
            }
            return res.json(updatedDriver);
        } catch (err) {
            console.error('Error updating driver status', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateDriverLocation(req, res) {
        const driverId = req.header('x-driver-id'); // To be replaced by auth
        const { latitude, longitude } = req.body || {};

        if (!driverId) {
            return res.status(400).json({ error: 'x-driver-id header is required' });
        }
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ error: 'latitude and longitude must be valid numbers' });
        }

        try {
            const updatedDriver = await driverRepository.updateLocation(req.db, driverId, { latitude, longitude });
            if (!updatedDriver) {
                return res.status(404).json({ error: 'Driver not found' });
            }
            return res.json(updatedDriver);
        } catch (err) {
            console.error('Error updating driver location', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async findNearbyDrivers(req, res) {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const radiusKm = Number(req.query.radiusKm || 5);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ error: 'lat and lng query params are required and must be numbers' });
        }

        try {
            const drivers = await driverRepository.findNearby(req.db, { lat, lng, radiusKm });
            return res.json({ drivers });
        } catch (err) {
            console.error('Error fetching nearby drivers', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export const driverController = new DriverController();
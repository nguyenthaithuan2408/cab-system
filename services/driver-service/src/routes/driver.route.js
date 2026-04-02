const express = require('express');
const driverController = require('../controllers/driver.controller');

const router = express.Router();

// Spec-aligned endpoints from docs/api-spec.md
router.get('/profile', driverController.getDriverProfile);
router.put('/status', driverController.updateDriverStatus);
router.put('/location', driverController.updateDriverLocation);
router.get('/nearby', driverController.listNearbyDrivers);

// Backward-compatible endpoints
router.post('/', driverController.createDriver);
router.get('/', driverController.listAvailableDrivers);
router.get('/:id', driverController.getDriverById);
router.put('/:id', driverController.updateDriver);
router.patch('/:id/availability', driverController.updateAvailability);
router.get('/:id/availability', driverController.getAvailability);

module.exports = router;

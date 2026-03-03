import { Router } from 'express';
import { driverController } from '../controllers/driver.controller.js';

export const driverRouter = Router();

// Authenticated routes (currently using x-driver-id header)
driverRouter.get('/profile', driverController.getDriverProfile);
driverRouter.put('/status', driverController.updateDriverStatus);
driverRouter.put('/location', driverController.updateDriverLocation);

// Public routes
driverRouter.get('/nearby', driverController.findNearbyDrivers);
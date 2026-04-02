const driverService = require('../services/driver.service');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/app-error');

function resolveDriverId(req) {
  const driverId = req.query.driverId || req.query.id || req.body.driverId || req.headers['x-driver-id'] || null;
  if (!driverId) {
    throw new AppError('driverId is required', 400, 'DRIVER_ID_REQUIRED');
  }

  return driverId;
}

async function createDriver(req, res, next) {
  try {
    const data = await driverService.createDriver(req.body);
    return sendSuccess(res, 201, data);
  } catch (error) {
    return next(error);
  }
}

async function getDriverById(req, res, next) {
  try {
    const data = await driverService.getDriverById(req.params.id);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function updateDriver(req, res, next) {
  try {
    const data = await driverService.updateDriver(req.params.id, req.body);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function updateAvailability(req, res, next) {
  try {
    const data = await driverService.updateAvailability(req.params.id, req.body.availabilityStatus);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function getAvailability(req, res, next) {
  try {
    const data = await driverService.getAvailability(req.params.id);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function listAvailableDrivers(req, res, next) {
  try {
    const data = await driverService.listAvailableDrivers(req.query);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function getDriverProfile(req, res, next) {
  try {
    const driverId = resolveDriverId(req);
    const data = await driverService.getDriverById(driverId);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function updateDriverStatus(req, res, next) {
  try {
    const driverId = resolveDriverId(req);
    const status = req.body.status || req.body.availabilityStatus;
    const data = await driverService.updateAvailability(driverId, status);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function updateDriverLocation(req, res, next) {
  try {
    const driverId = resolveDriverId(req);
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const data = await driverService.updateDriverLocation(driverId, latitude, longitude);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function listNearbyDrivers(req, res, next) {
  try {
    const data = await driverService.listNearbyDrivers(req.query);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDriver,
  getDriverById,
  updateDriver,
  updateAvailability,
  getAvailability,
  listAvailableDrivers,
  getDriverProfile,
  updateDriverStatus,
  updateDriverLocation,
  listNearbyDrivers
};

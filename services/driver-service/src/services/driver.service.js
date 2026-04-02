const { randomUUID } = require('crypto');
const AppError = require('../utils/app-error');
const driverRepository = require('../repositories/driver.repository');
const { toDriverProfile } = require('../models/driver.model');
const driverProducer = require('../events/driver.producer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;
const AVAILABILITY_STATUSES = new Set(['ONLINE', 'OFFLINE', 'BUSY']);

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateRequired(payload) {
  if (!payload.fullName || payload.fullName.length < 2) {
    throw new AppError('fullName must be at least 2 characters', 400, 'INVALID_FULL_NAME');
  }

  if (!payload.email || !EMAIL_REGEX.test(payload.email)) {
    throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
  }

  if (!payload.phone || !PHONE_REGEX.test(payload.phone)) {
    throw new AppError('Invalid phone format', 400, 'INVALID_PHONE');
  }

  if (!payload.licenseNumber || payload.licenseNumber.length < 6) {
    throw new AppError('licenseNumber is invalid', 400, 'INVALID_LICENSE_NUMBER');
  }

  if (!payload.vehicleType) {
    throw new AppError('vehicleType is required', 400, 'VEHICLE_TYPE_REQUIRED');
  }

  if (!payload.vehiclePlate) {
    throw new AppError('vehiclePlate is required', 400, 'VEHICLE_PLATE_REQUIRED');
  }
}

function validateAvailabilityStatus(availabilityStatus) {
  if (!AVAILABILITY_STATUSES.has(availabilityStatus)) {
    throw new AppError(
      `availabilityStatus must be one of ${Array.from(AVAILABILITY_STATUSES).join(', ')}`,
      400,
      'INVALID_AVAILABILITY_STATUS'
    );
  }
}

function validateCoordinates(latitude, longitude) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new AppError('latitude must be a number from -90 to 90', 400, 'INVALID_LATITUDE');
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError('longitude must be a number from -180 to 180', 400, 'INVALID_LONGITUDE');
  }
}

async function ensureUniqueConstraints(payload, driverId = null) {
  const checks = [
    ['email', driverRepository.getByEmail],
    ['phone', driverRepository.getByPhone],
    ['licenseNumber', driverRepository.getByLicenseNumber],
    ['vehiclePlate', driverRepository.getByVehiclePlate]
  ];

  for (const [field, getter] of checks) {
    if (payload[field] === undefined) {
      continue;
    }

    const existing = await getter(payload[field]);
    if (existing && existing.id !== driverId) {
      throw new AppError(`${field} already exists`, 409, `${field.toUpperCase()}_ALREADY_EXISTS`);
    }
  }
}

async function createDriver(payload) {
  const normalized = {
    fullName: normalizeText(payload.fullName),
    email: normalizeText(payload.email)?.toLowerCase(),
    phone: normalizeText(payload.phone),
    licenseNumber: normalizeText(payload.licenseNumber),
    vehicleType: normalizeText(payload.vehicleType),
    vehiclePlate: normalizeText(payload.vehiclePlate),
    availabilityStatus: normalizeText(payload.availabilityStatus || 'OFFLINE').toUpperCase(),
    ratingAvg: Number(payload.ratingAvg || 0),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true
  };

  validateRequired(normalized);
  validateAvailabilityStatus(normalized.availabilityStatus);
  await ensureUniqueConstraints(normalized);

  const created = await driverRepository.createDriver({
    id: randomUUID(),
    ...normalized
  });

  const profile = toDriverProfile(created);
  driverProducer.publishDriverCreated({ id: profile.id });

  return profile;
}

async function getDriverById(id) {
  const driver = await driverRepository.getById(id);
  if (!driver) {
    throw new AppError('Driver profile not found', 404, 'DRIVER_NOT_FOUND');
  }

  return toDriverProfile(driver);
}

async function updateDriver(id, payload) {
  const existing = await driverRepository.getById(id);
  if (!existing) {
    throw new AppError('Driver profile not found', 404, 'DRIVER_NOT_FOUND');
  }

  const updates = {};
  const uniqueFields = {};

  if (payload.fullName !== undefined) {
    const fullName = normalizeText(payload.fullName);
    if (!fullName || fullName.length < 2) {
      throw new AppError('fullName must be at least 2 characters', 400, 'INVALID_FULL_NAME');
    }
    updates.full_name = fullName;
  }

  if (payload.email !== undefined) {
    const email = normalizeText(payload.email)?.toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
    }
    updates.email = email;
    uniqueFields.email = email;
  }

  if (payload.phone !== undefined) {
    const phone = normalizeText(payload.phone);
    if (!PHONE_REGEX.test(phone)) {
      throw new AppError('Invalid phone format', 400, 'INVALID_PHONE');
    }
    updates.phone = phone;
    uniqueFields.phone = phone;
  }

  if (payload.licenseNumber !== undefined) {
    const licenseNumber = normalizeText(payload.licenseNumber);
    if (!licenseNumber || licenseNumber.length < 6) {
      throw new AppError('licenseNumber is invalid', 400, 'INVALID_LICENSE_NUMBER');
    }
    updates.license_number = licenseNumber;
    uniqueFields.licenseNumber = licenseNumber;
  }

  if (payload.vehicleType !== undefined) {
    const vehicleType = normalizeText(payload.vehicleType);
    if (!vehicleType) {
      throw new AppError('vehicleType is invalid', 400, 'INVALID_VEHICLE_TYPE');
    }
    updates.vehicle_type = vehicleType;
  }

  if (payload.vehiclePlate !== undefined) {
    const vehiclePlate = normalizeText(payload.vehiclePlate);
    if (!vehiclePlate) {
      throw new AppError('vehiclePlate is invalid', 400, 'INVALID_VEHICLE_PLATE');
    }
    updates.vehicle_plate = vehiclePlate;
    uniqueFields.vehiclePlate = vehiclePlate;
  }

  if (payload.isActive !== undefined) {
    updates.is_active = Boolean(payload.isActive);
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No updatable fields provided', 400, 'NO_UPDATES');
  }

  await ensureUniqueConstraints(uniqueFields, id);

  const updated = await driverRepository.updateById(id, updates);
  return toDriverProfile(updated);
}

async function updateAvailability(id, availabilityStatus) {
  const normalizedStatus = normalizeText(availabilityStatus || '').toUpperCase();
  validateAvailabilityStatus(normalizedStatus);

  const updated = await driverRepository.updateById(id, {
    availability_status: normalizedStatus
  });

  if (!updated) {
    throw new AppError('Driver profile not found', 404, 'DRIVER_NOT_FOUND');
  }

  const profile = toDriverProfile(updated);
  driverProducer.publishDriverAvailabilityChanged({
    id: profile.id,
    availabilityStatus: profile.availabilityStatus
  });

  return profile;
}

async function getAvailability(id) {
  const profile = await getDriverById(id);
  return {
    id: profile.id,
    availabilityStatus: profile.availabilityStatus,
    updatedAt: profile.updatedAt
  };
}

async function listAvailableDrivers(filters) {
  const availabilityStatus = normalizeText(filters.availabilityStatus || 'ONLINE').toUpperCase();
  validateAvailabilityStatus(availabilityStatus);

  const vehicleType = filters.vehicleType ? normalizeText(filters.vehicleType) : null;
  const limit = Number(filters.limit || 20);

  if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
    throw new AppError('limit must be an integer from 1 to 200', 400, 'INVALID_LIMIT');
  }

  const drivers = await driverRepository.listAvailableDrivers({
    availabilityStatus,
    vehicleType,
    limit
  });

  return drivers.map(toDriverProfile);
}

async function updateDriverLocation(id, latitude, longitude) {
  const normalizedLatitude = Number(latitude);
  const normalizedLongitude = Number(longitude);
  validateCoordinates(normalizedLatitude, normalizedLongitude);

  const updated = await driverRepository.updateById(id, {
    current_latitude: normalizedLatitude,
    current_longitude: normalizedLongitude
  });

  if (!updated) {
    throw new AppError('Driver profile not found', 404, 'DRIVER_NOT_FOUND');
  }

  return toDriverProfile(updated);
}

async function listNearbyDrivers(filters) {
  const latitude = Number(filters.latitude);
  const longitude = Number(filters.longitude);
  validateCoordinates(latitude, longitude);

  const radiusKm = filters.radiusKm !== undefined ? Number(filters.radiusKm) : null;
  if (radiusKm !== null && (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 50)) {
    throw new AppError('radiusKm must be a number from 0 to 50', 400, 'INVALID_RADIUS');
  }

  const limit = Number(filters.limit || 20);
  if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
    throw new AppError('limit must be an integer from 1 to 200', 400, 'INVALID_LIMIT');
  }

  const vehicleType = filters.vehicleType ? normalizeText(filters.vehicleType) : null;
  const radiusDegrees = radiusKm === null ? null : radiusKm / 111;

  const drivers = await driverRepository.listNearbyDrivers({
    latitude,
    longitude,
    radiusDegrees,
    vehicleType,
    limit
  });

  return drivers.map(toDriverProfile);
}

module.exports = {
  createDriver,
  getDriverById,
  updateDriver,
  updateAvailability,
  updateDriverLocation,
  getAvailability,
  listAvailableDrivers,
  listNearbyDrivers
};

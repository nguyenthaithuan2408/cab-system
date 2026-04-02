const { randomUUID } = require('crypto');
const AppError = require('../utils/app-error');
const userRepository = require('../repositories/user.repository');
const { toPassengerProfile } = require('../models/user.model');
const userProducer = require('../events/user.producer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateEmail(email) {
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
  }
}

function validatePhone(phone) {
  if (!PHONE_REGEX.test(phone)) {
    throw new AppError('Invalid phone format', 400, 'INVALID_PHONE');
  }
}

function validateAvatarUrl(avatarUrl) {
  if (!avatarUrl) {
    return;
  }

  try {
    const parsed = new URL(avatarUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('invalid protocol');
    }
  } catch (error) {
    throw new AppError('Invalid avatarUrl', 400, 'INVALID_AVATAR_URL');
  }
}

function validateDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    return;
  }

  const parsed = new Date(dateOfBirth);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid dateOfBirth', 400, 'INVALID_DATE_OF_BIRTH');
  }
}

function validateCreatePayload(payload) {
  if (!payload.fullName || payload.fullName.length < 2) {
    throw new AppError('fullName must be at least 2 characters', 400, 'INVALID_FULL_NAME');
  }

  if (!payload.email) {
    throw new AppError('email is required', 400, 'EMAIL_REQUIRED');
  }

  if (!payload.phone) {
    throw new AppError('phone is required', 400, 'PHONE_REQUIRED');
  }

  validateEmail(payload.email);
  validatePhone(payload.phone);
  validateAvatarUrl(payload.avatarUrl);
  validateDateOfBirth(payload.dateOfBirth);
}

async function ensureUniqueEmailAndPhone(email, phone, profileId = null) {
  const existingEmail = await userRepository.getByEmail(email);
  if (existingEmail && existingEmail.id !== profileId) {
    throw new AppError('Email already exists', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const existingPhone = await userRepository.getByPhone(phone);
  if (existingPhone && existingPhone.id !== profileId) {
    throw new AppError('Phone already exists', 409, 'PHONE_ALREADY_EXISTS');
  }
}

async function createProfile(payload) {
  const normalizedPayload = {
    accountRef: normalizeText(payload.accountRef) || null,
    fullName: normalizeText(payload.fullName),
    email: normalizeText(payload.email)?.toLowerCase(),
    phone: normalizeText(payload.phone),
    avatarUrl: normalizeText(payload.avatarUrl) || null,
    gender: normalizeText(payload.gender) || null,
    dateOfBirth: payload.dateOfBirth || null,
    status: 'ACTIVE',
    isActive: true
  };

  validateCreatePayload(normalizedPayload);
  await ensureUniqueEmailAndPhone(normalizedPayload.email, normalizedPayload.phone);

  if (normalizedPayload.accountRef) {
    const existingByAccountRef = await userRepository.getByAccountRef(normalizedPayload.accountRef);
    if (existingByAccountRef) {
      throw new AppError('accountRef already exists', 409, 'ACCOUNT_REF_ALREADY_EXISTS');
    }
  }

  const created = await userRepository.createProfile({
    id: randomUUID(),
    ...normalizedPayload
  });

  const profile = toPassengerProfile(created);
  userProducer.publishUserCreated({ id: profile.id, accountRef: profile.accountRef });
  return profile;
}

async function getProfileById(id) {
  const profile = await userRepository.getById(id);
  if (!profile) {
    throw new AppError('Passenger profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  return toPassengerProfile(profile);
}

async function getProfileByAccountRef(accountRef) {
  const profile = await userRepository.getByAccountRef(accountRef);
  if (!profile) {
    throw new AppError('Passenger profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  return toPassengerProfile(profile);
}

async function updateProfile(id, payload) {
  const existing = await userRepository.getById(id);
  if (!existing) {
    throw new AppError('Passenger profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  const updates = {};

  if (payload.fullName !== undefined) {
    const fullName = normalizeText(payload.fullName);
    if (!fullName || fullName.length < 2) {
      throw new AppError('fullName must be at least 2 characters', 400, 'INVALID_FULL_NAME');
    }
    updates.full_name = fullName;
  }

  if (payload.email !== undefined) {
    const email = normalizeText(payload.email)?.toLowerCase();
    validateEmail(email);
    updates.email = email;
  }

  if (payload.phone !== undefined) {
    const phone = normalizeText(payload.phone);
    validatePhone(phone);
    updates.phone = phone;
  }

  if (payload.avatarUrl !== undefined) {
    const avatarUrl = normalizeText(payload.avatarUrl);
    validateAvatarUrl(avatarUrl);
    updates.avatar_url = avatarUrl || null;
  }

  if (payload.gender !== undefined) {
    updates.gender = normalizeText(payload.gender) || null;
  }

  if (payload.dateOfBirth !== undefined) {
    validateDateOfBirth(payload.dateOfBirth);
    updates.date_of_birth = payload.dateOfBirth || null;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No updatable fields provided', 400, 'NO_UPDATES');
  }

  await ensureUniqueEmailAndPhone(updates.email || existing.email, updates.phone || existing.phone, id);

  const updated = await userRepository.updateById(id, updates);
  const profile = toPassengerProfile(updated);

  userProducer.publishUserUpdated({ id: profile.id, changedFields: Object.keys(updates) });
  return profile;
}

async function deactivateProfile(id) {
  const deactivated = await userRepository.deactivateById(id);
  if (!deactivated) {
    throw new AppError('Passenger profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  userProducer.publishUserUpdated({ id, status: 'INACTIVE' });
  return toPassengerProfile(deactivated);
}

module.exports = {
  createProfile,
  getProfileById,
  getProfileByAccountRef,
  updateProfile,
  deactivateProfile
};

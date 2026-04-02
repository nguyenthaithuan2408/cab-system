const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/app-error');

function resolveProfileSelector(req) {
  const accountRef = req.query.accountRef || req.headers['x-account-ref'] || null;
  const id = req.query.id || req.headers['x-user-id'] || null;

  if (!accountRef && !id) {
    throw new AppError(
      'profile selector is required: provide accountRef (query/header) or id (query/header)',
      400,
      'PROFILE_SELECTOR_REQUIRED'
    );
  }

  return { accountRef, id };
}

async function createProfile(req, res, next) {
  try {
    const profile = await userService.createProfile(req.body);
    return sendSuccess(res, 201, profile);
  } catch (error) {
    return next(error);
  }
}

async function getProfileById(req, res, next) {
  try {
    const profile = await userService.getProfileById(req.params.id);
    return sendSuccess(res, 200, profile);
  } catch (error) {
    return next(error);
  }
}

async function getProfileByAccountRef(req, res, next) {
  try {
    const profile = await userService.getProfileByAccountRef(req.params.accountRef);
    return sendSuccess(res, 200, profile);
  } catch (error) {
    return next(error);
  }
}

async function getCurrentProfile(req, res, next) {
  try {
    const selector = resolveProfileSelector(req);
    const profile = selector.accountRef
      ? await userService.getProfileByAccountRef(selector.accountRef)
      : await userService.getProfileById(selector.id);

    return sendSuccess(res, 200, profile);
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await userService.updateProfile(req.params.id, req.body);
    return sendSuccess(res, 200, profile);
  } catch (error) {
    return next(error);
  }
}

async function updateCurrentProfile(req, res, next) {
  try {
    const selector = resolveProfileSelector(req);
    const targetProfile = selector.accountRef
      ? await userService.getProfileByAccountRef(selector.accountRef)
      : await userService.getProfileById(selector.id);

    const profile = await userService.updateProfile(targetProfile.id, req.body);
    return sendSuccess(res, 200, profile);
  } catch (error) {
    return next(error);
  }
}

async function deactivateProfile(req, res, next) {
  try {
    const profile = await userService.deactivateProfile(req.params.id);
    return sendSuccess(res, 200, profile);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProfile,
  getProfileById,
  getProfileByAccountRef,
  getCurrentProfile,
  updateProfile,
  updateCurrentProfile,
  deactivateProfile
};

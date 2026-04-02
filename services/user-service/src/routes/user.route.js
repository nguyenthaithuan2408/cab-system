const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Spec-aligned endpoints from docs/api-spec.md
router.get('/profile', userController.getCurrentProfile);
router.put('/profile', userController.updateCurrentProfile);

// Backward-compatible endpoints
router.post('/', userController.createProfile);
router.get('/account/:accountRef', userController.getProfileByAccountRef);
router.get('/:id', userController.getProfileById);
router.put('/:id', userController.updateProfile);
router.patch('/:id/deactivate', userController.deactivateProfile);

module.exports = router;

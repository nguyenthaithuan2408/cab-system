const express = require('express');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// Send notification
router.post('/send', async (req, res, next) => {
  try {
    await notificationController.send(req, res, next);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get notifications by user
router.get('/user/:userId', async (req, res, next) => {
  try {
    await notificationController.getByUser(req, res, next);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark as read
router.patch('/:notificationId/read', async (req, res, next) => {
  try {
    await notificationController.markAsRead(req, res, next);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res, next) => {
  try {
    await notificationController.delete(req, res, next);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  notificationController.health(req, res);
});

module.exports = router;

const express = require('express');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

// Spec-aligned endpoints from docs/api-spec.md
router.post('/charge', paymentController.chargePayment);
router.get('/history', paymentController.getPaymentHistory);
router.post('/wallet/topup', paymentController.walletTopup);

// Backward-compatible endpoints
router.post('/', paymentController.createTransaction);
router.post('/webhook/payment-result', paymentController.processWebhook);
router.get('/by-booking/:bookingId', paymentController.listTransactionsByBookingId);
router.get('/by-user/:userId', paymentController.listTransactionsByUserId);
router.get('/:id', paymentController.getTransactionById);
router.patch('/:id/status', paymentController.updatePaymentStatus);

module.exports = router;

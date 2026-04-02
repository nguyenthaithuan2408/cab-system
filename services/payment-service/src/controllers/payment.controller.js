const paymentService = require('../services/payment.service');
const { sendSuccess } = require('../utils/response');

async function createTransaction(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    const data = await paymentService.createTransaction(req.body, idempotencyKey);
    return sendSuccess(res, 201, data);
  } catch (error) {
    return next(error);
  }
}

async function chargePayment(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    const data = await paymentService.createTransaction(req.body, idempotencyKey);
    return sendSuccess(res, 201, data);
  } catch (error) {
    return next(error);
  }
}

async function getTransactionById(req, res, next) {
  try {
    const data = await paymentService.getTransactionById(req.params.id);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function listTransactionsByBookingId(req, res, next) {
  try {
    const data = await paymentService.listTransactionsByBookingId(req.params.bookingId);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function listTransactionsByUserId(req, res, next) {
  try {
    const data = await paymentService.listTransactionsByUserId(req.params.userId);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function getPaymentHistory(req, res, next) {
  try {
    const data = await paymentService.getTransactionHistory(req.query);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const data = await paymentService.updatePaymentStatus(
      req.params.id,
      req.body.paymentStatus,
      req.body.providerRef
    );
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function processWebhook(req, res, next) {
  try {
    const data = await paymentService.processPaymentWebhook(req.body);
    return sendSuccess(res, 200, data);
  } catch (error) {
    return next(error);
  }
}

async function walletTopup(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    const data = await paymentService.createWalletTopup(req.body, idempotencyKey);
    return sendSuccess(res, 201, data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTransaction,
  chargePayment,
  getTransactionById,
  listTransactionsByBookingId,
  listTransactionsByUserId,
  getPaymentHistory,
  updatePaymentStatus,
  processWebhook,
  walletTopup
};

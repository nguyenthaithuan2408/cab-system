const { randomUUID } = require('crypto');
const AppError = require('../utils/app-error');
const paymentRepository = require('../repositories/payment.repository');
const { toPaymentTransaction } = require('../models/payment.model');
const paymentProducer = require('../events/payment.producer');

const PAYMENT_STATUSES = new Set(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']);
const PAYMENT_METHODS = new Set(['CASH', 'CARD', 'WALLET', 'BANK_TRANSFER']);

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeCurrency(currency) {
  return normalizeText(currency || 'USD')?.toUpperCase();
}

function normalizePaymentMethod(paymentMethod) {
  return normalizeText(paymentMethod || 'CARD')?.toUpperCase();
}

function validateCreatePayload(payload) {
  if (!payload.bookingId) {
    throw new AppError('bookingId is required', 400, 'BOOKING_ID_REQUIRED');
  }

  if (!payload.userId) {
    throw new AppError('userId is required', 400, 'USER_ID_REQUIRED');
  }

  if (payload.amount === undefined || payload.amount === null) {
    throw new AppError('amount is required', 400, 'AMOUNT_REQUIRED');
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new AppError('amount must be a positive number', 400, 'INVALID_AMOUNT');
  }

  if (!/^[A-Z]{3,10}$/.test(payload.currency)) {
    throw new AppError('currency must be uppercase alphanumeric (3-10 chars)', 400, 'INVALID_CURRENCY');
  }

  if (!PAYMENT_METHODS.has(payload.paymentMethod)) {
    throw new AppError(
      `paymentMethod must be one of ${Array.from(PAYMENT_METHODS).join(', ')}`,
      400,
      'INVALID_PAYMENT_METHOD'
    );
  }
}

function validatePaymentStatus(status) {
  const normalizedStatus = normalizeText(status || '').toUpperCase();
  if (!PAYMENT_STATUSES.has(normalizedStatus)) {
    throw new AppError(
      `paymentStatus must be one of ${Array.from(PAYMENT_STATUSES).join(', ')}`,
      400,
      'INVALID_PAYMENT_STATUS'
    );
  }

  return normalizedStatus;
}

function buildTransactionRef() {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TXN-${Date.now()}-${randomPart}`;
}

async function createTransaction(payload, idempotencyKey = null) {
  const normalized = {
    bookingId: normalizeText(payload.bookingId),
    userId: normalizeText(payload.userId),
    amount: Number(payload.amount),
    currency: normalizeCurrency(payload.currency),
    paymentMethod: normalizePaymentMethod(payload.paymentMethod),
    paymentStatus: 'PENDING',
    providerRef: normalizeText(payload.providerRef) || null,
    metadata: payload.metadata || null,
    idempotencyKey: normalizeText(idempotencyKey || payload.idempotencyKey) || null
  };

  validateCreatePayload(normalized);

  if (normalized.idempotencyKey) {
    const existing = await paymentRepository.getByIdempotencyKey(normalized.idempotencyKey);
    if (existing) {
      return {
        ...toPaymentTransaction(existing),
        isIdempotentReplay: true
      };
    }
  }

  const created = await paymentRepository.createTransaction({
    id: randomUUID(),
    transactionRef: buildTransactionRef(),
    ...normalized
  });

  const transaction = toPaymentTransaction(created);
  paymentProducer.publishPaymentCreated({
    id: transaction.id,
    bookingId: transaction.bookingId,
    paymentStatus: transaction.paymentStatus
  });

  return transaction;
}

async function getTransactionById(id) {
  const row = await paymentRepository.getById(id);
  if (!row) {
    throw new AppError('Payment transaction not found', 404, 'PAYMENT_NOT_FOUND');
  }

  return toPaymentTransaction(row);
}

async function listTransactionsByBookingId(bookingId) {
  const rows = await paymentRepository.listByBookingId(bookingId);
  return rows.map(toPaymentTransaction);
}

async function listTransactionsByUserId(userId) {
  const rows = await paymentRepository.listByUserId(userId);
  return rows.map(toPaymentTransaction);
}

async function getTransactionHistory(filters) {
  const bookingId = normalizeText(filters.bookingId);
  const userId = normalizeText(filters.userId);
  const limit = Number(filters.limit || 50);

  if (!bookingId && !userId) {
    throw new AppError('bookingId or userId is required', 400, 'HISTORY_FILTER_REQUIRED');
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
    throw new AppError('limit must be an integer from 1 to 200', 400, 'INVALID_LIMIT');
  }

  const rows = bookingId
    ? await paymentRepository.listByBookingId(bookingId)
    : await paymentRepository.listByUserId(userId);

  return rows.slice(0, limit).map(toPaymentTransaction);
}

async function updatePaymentStatus(id, paymentStatus, providerRef = null) {
  const normalizedStatus = validatePaymentStatus(paymentStatus);

  const updated = await paymentRepository.updateStatusById(id, normalizedStatus, providerRef);
  if (!updated) {
    throw new AppError('Payment transaction not found', 404, 'PAYMENT_NOT_FOUND');
  }

  const transaction = toPaymentTransaction(updated);
  paymentProducer.publishPaymentStatusChanged({
    id: transaction.id,
    transactionRef: transaction.transactionRef,
    paymentStatus: transaction.paymentStatus
  });

  return transaction;
}

async function processPaymentWebhook(payload) {
  const transactionRef = normalizeText(payload.transactionRef);
  if (!transactionRef) {
    throw new AppError('transactionRef is required', 400, 'TRANSACTION_REF_REQUIRED');
  }

  const paymentStatus = validatePaymentStatus(payload.paymentStatus);
  const providerRef = normalizeText(payload.providerRef) || null;

  const updated = await paymentRepository.updateStatusByTransactionRef(
    transactionRef,
    paymentStatus,
    providerRef
  );

  if (!updated) {
    throw new AppError('Payment transaction not found', 404, 'PAYMENT_NOT_FOUND');
  }

  const transaction = toPaymentTransaction(updated);
  paymentProducer.publishPaymentStatusChanged({
    id: transaction.id,
    transactionRef: transaction.transactionRef,
    paymentStatus: transaction.paymentStatus,
    source: 'webhook'
  });

  return transaction;
}

async function createWalletTopup(payload, idempotencyKey = null) {
  const userId = normalizeText(payload.userId);
  if (!userId) {
    throw new AppError('userId is required', 400, 'USER_ID_REQUIRED');
  }

  const created = await createTransaction(
    {
      bookingId: `WALLET_TOPUP_${userId}_${Date.now()}`,
      userId,
      amount: payload.amount,
      currency: payload.currency,
      paymentMethod: 'WALLET',
      providerRef: payload.providerRef,
      metadata: {
        ...(payload.metadata || {}),
        purpose: 'WALLET_TOPUP'
      },
      idempotencyKey
    },
    idempotencyKey
  );

  return updatePaymentStatus(created.id, 'SUCCESS', payload.providerRef);
}

module.exports = {
  createTransaction,
  getTransactionById,
  listTransactionsByBookingId,
  listTransactionsByUserId,
  getTransactionHistory,
  updatePaymentStatus,
  processPaymentWebhook,
  createWalletTopup
};

function toPaymentTransaction(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    bookingId: row.booking_id,
    userId: row.user_id,
    amount: Number(row.amount),
    currency: row.currency,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    transactionRef: row.transaction_ref,
    providerRef: row.provider_ref,
    idempotencyKey: row.idempotency_key,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  toPaymentTransaction
};

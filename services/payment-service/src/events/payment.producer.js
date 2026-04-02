function publishPaymentCreated(payload) {
  console.info('[payment-service:event] payment.created', payload);
}

function publishPaymentStatusChanged(payload) {
  console.info('[payment-service:event] payment.status.changed', payload);
}

module.exports = {
  publishPaymentCreated,
  publishPaymentStatusChanged
};

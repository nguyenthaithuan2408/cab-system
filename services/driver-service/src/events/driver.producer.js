function publishDriverCreated(payload) {
  console.info('[driver-service:event] driver.created', payload);
}

function publishDriverAvailabilityChanged(payload) {
  console.info('[driver-service:event] driver.availability.changed', payload);
}

module.exports = {
  publishDriverCreated,
  publishDriverAvailabilityChanged
};

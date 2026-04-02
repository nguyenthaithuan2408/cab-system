function publishUserCreated(payload) {
  console.info('[user-service:event] user.created', payload);
}

function publishUserUpdated(payload) {
  console.info('[user-service:event] user.updated', payload);
}

module.exports = {
  publishUserCreated,
  publishUserUpdated
};

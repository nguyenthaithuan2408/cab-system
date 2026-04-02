function publishReviewCreated(payload) {
  console.info('[review-service:event] review.created', payload);
}

function publishReviewUpdated(payload) {
  console.info('[review-service:event] review.updated', payload);
}

module.exports = {
  publishReviewCreated,
  publishReviewUpdated
};

function toReviewDocument(document) {
  if (!document) {
    return null;
  }

  return {
    id: document._id.toString(),
    bookingId: document.bookingId,
    driverId: document.driverId,
    userId: document.userId,
    rating: document.rating,
    comment: document.comment,
    isDeleted: document.isDeleted,
    deletedAt: document.deletedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

module.exports = {
  toReviewDocument
};

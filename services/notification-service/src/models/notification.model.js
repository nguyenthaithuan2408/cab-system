const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['booking', 'payment', 'ride', 'promotion', 'alert'],
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'in-app'],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedId: {
      type: String,
      index: true,
    },
    relatedType: {
      type: String,
      enum: ['booking', 'payment', 'ride', 'review'],
    },
    sentAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

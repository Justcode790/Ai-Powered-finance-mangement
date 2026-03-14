const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['budget_exceeded', 'goal_achieved', 'tip', 'general', 'piggy_bank_suggest', 'badge_earned']
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    category: {
      type: String
    },
    amount: {
      type: Number
    },
    suggestedAmount: {
      type: Number
    },
    badgeName: {
      type: String
    },
    badgeIcon: {
      type: String
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

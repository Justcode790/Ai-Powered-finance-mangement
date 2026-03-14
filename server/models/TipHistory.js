const mongoose = require('mongoose');

const tipHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tip',
      required: true
    },
    shownAt: {
      type: Date,
      default: Date.now
    },
    markedHelpful: {
      type: Boolean,
      default: false
    },
    markedHelpfulAt: {
      type: Date
    },
    context: {
      type: String,
      enum: ['transaction', 'budget_exceeded', 'goal_achieved', 'general']
    }
  },
  { timestamps: true }
);

// Compound index for efficient queries
tipHistorySchema.index({ userId: 1, tipId: 1 });
tipHistorySchema.index({ userId: 1, shownAt: -1 });

module.exports = mongoose.model('TipHistory', tipHistorySchema);

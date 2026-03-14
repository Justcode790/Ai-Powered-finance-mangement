const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    category: {
      type: String,
      required: true,
      enum: ['budgeting', 'saving', 'investing', 'debt', 'income', 'planning']
    },
    context: {
      type: String,
      required: true,
      enum: ['transaction', 'budget_exceeded', 'goal_achieved', 'general']
    },
    tags: {
      type: [String],
      default: []
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tip', tipSchema);

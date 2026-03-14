const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['budgeting', 'saving', 'investing', 'debt', 'income', 'planning']
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    tags: {
      type: [String],
      default: []
    },
    readingTimeMinutes: {
      type: Number,
      min: 1
    },
    author: {
      type: String,
      default: 'SmartVault Team'
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Create text index for search functionality
articleSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Article', articleSchema);

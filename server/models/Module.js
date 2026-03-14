const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  lessonId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  quiz: {
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number
      }
    ]
  }
});

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    category: {
      type: String,
      required: true,
      enum: ['budgeting', 'saving', 'investing', 'debt', 'income', 'planning']
    },
    lessons: {
      type: [lessonSchema],
      default: []
    },
    estimatedHours: {
      type: Number,
      min: 0.5
    }
  },
  { timestamps: true }
);

// Create text index for search functionality
moduleSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Module', moduleSchema);

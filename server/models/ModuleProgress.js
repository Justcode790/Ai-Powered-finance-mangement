const mongoose = require('mongoose');

const quizScoreSchema = new mongoose.Schema({
  lessonId: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const moduleProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    lessonsCompleted: {
      type: [String],
      default: []
    },
    quizScores: {
      type: [quizScoreSchema],
      default: []
    },
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  { timestamps: true }
);

// Compound index for efficient user-module queries
moduleProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

module.exports = mongoose.model('ModuleProgress', moduleProgressSchema);

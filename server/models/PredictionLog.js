const mongoose = require('mongoose');

const predictionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modelVersion: {
      type: String,
      required: true
    },
    inputFeatures: {
      type: Object,
      required: true
    },
    predictedSavings: {
      type: Number,
      required: true
    },
    confidenceInterval: {
      lower: {
        type: Number,
        required: true
      },
      upper: {
        type: Number,
        required: true
      }
    },
    actualSavings: {
      type: Number
    },
    predictionDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    evaluationDate: {
      type: Date
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
predictionLogSchema.index({ userId: 1, predictionDate: -1 });
predictionLogSchema.index({ predictionDate: -1 });
predictionLogSchema.index({ actualSavings: 1 }); // For filtering records with ground truth

module.exports = mongoose.model('PredictionLog', predictionLogSchema);

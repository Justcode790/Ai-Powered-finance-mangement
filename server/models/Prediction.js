const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    predictedSavings: {
      type: Number,
      required: true
    },
    financialHealthScore: {
      type: Number,
      required: true
    },
    budgetStatus: {
      type: String
    },
    suggestedBudget: {
      type: Object
    }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Prediction', predictionSchema);


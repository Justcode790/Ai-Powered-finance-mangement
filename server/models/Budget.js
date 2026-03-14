const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    period: {
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
      },
      year: {
        type: Number,
        required: true,
        min: 2020
      }
    },
    categoryAllocations: {
      rent: {
        type: Number,
        required: true,
        min: 0
      },
      food: {
        type: Number,
        required: true,
        min: 0
      },
      transport: {
        type: Number,
        required: true,
        min: 0
      },
      entertainment: {
        type: Number,
        required: true,
        min: 0
      },
      shopping: {
        type: Number,
        required: true,
        min: 0
      },
      education: {
        type: Number,
        required: true,
        min: 0
      },
      misc: {
        type: Number,
        required: true,
        min: 0
      },
      savings: {
        type: Number,
        required: true,
        min: 0
      }
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BudgetTemplate'
    }
  },
  { timestamps: true }
);

// Compound index for efficient user-period queries
budgetSchema.index({ userId: 1, 'period.month': 1, 'period.year': 1 });

module.exports = mongoose.model('Budget', budgetSchema);

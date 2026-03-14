const mongoose = require('mongoose');

const budgetTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    targetUser: {
      type: String,
      required: true,
      enum: ['student', 'entry-level', 'freelancer', 'general']
    },
    categoryPercentages: {
      rent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      food: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      transport: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      entertainment: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      shopping: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      education: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      misc: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      savings: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BudgetTemplate', budgetTemplateSchema);

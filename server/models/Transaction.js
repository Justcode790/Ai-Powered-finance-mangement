const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense', 'transfer'],
      default: 'expense'
    },
    category: {
      type: String,
      required: true,
      enum: ['rent', 'food', 'transport', 'entertainment', 'shopping', 'education', 'misc', 'salary', 'freelance', 'investment', 'other', 'emergency_fund_deposit', 'emergency_fund_withdrawal']
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);


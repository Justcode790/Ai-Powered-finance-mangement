const mongoose = require('mongoose');

const piggyBankTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['contribution', 'withdrawal']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    source: {
      type: String,
      enum: ['manual', 'auto_suggest'],
      default: 'manual'
    },
    emergencyReason: {
      type: String,
      enum: ['Medical Emergency', 'Job Loss', 'Vehicle Repair', 'Home Repair', 'Family Emergency'],
      required: function() { return this.type === 'withdrawal'; }
    },
    emergencyProof: {
      type: String,
      minlength: 20,
      required: function() { return this.type === 'withdrawal'; }
    },
    warningShown: {
      type: Boolean,
      default: false
    },
    balanceAfter: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

piggyBankTransactionSchema.index({ userId: 1, createdAt: -1 });
piggyBankTransactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('PiggyBankTransaction', piggyBankTransactionSchema);

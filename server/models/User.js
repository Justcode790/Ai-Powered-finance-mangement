const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    min: 18
  },
  income: {
    type: Number,
    min: 0
  },
  bank_balance: {
    type: Number,
    default: 0,
    min: 0
  },
  financial_literacy_score: {
    type: Number,
    min: 1,
    max: 10
  },
  saving_habit_score: {
    type: Number,
    min: 1,
    max: 10
  },
  learningProgress: {
    completedModules: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Module',
      default: []
    },
    totalModulesCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActivityDate: {
      type: Date
    }
  },
  preferences: {
    contentDifficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  piggyBank: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    goal: {
      type: Number,
      default: 15000,
      min: 1000,
      max: 100000
    },
    streak: {
      count: {
        type: Number,
        default: 0,
        min: 0
      },
      lastContributionMonth: {
        type: String,
        default: null
      }
    },
    badges: [{
      name: String,
      icon: String,
      earnedAt: Date
    }],
    untouchedStatus: {
      type: Boolean,
      default: true
    },
    totalContributions: {
      type: Number,
      default: 0
    },
    totalWithdrawals: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);


const User = require('../models/User');
const Transaction = require('../models/Transaction');
const PiggyBankTransaction = require('../models/PiggyBankTransaction');
const Notification = require('../models/Notification');
const streakService = require('../services/streakService');
const badgeService = require('../services/badgeService');
const autoSuggestService = require('../services/autoSuggestService');
const mongoose = require('mongoose');

const MOTIVATIONAL_MESSAGES = [
  "Great job! Your future self will thank you! 💪",
  "Building wealth one rupee at a time! 🐷",
  "Emergency fund growing strong! 🌱",
  "You're securing your financial future! 🛡️",
  "Smart saving today = peace of mind tomorrow! ✨",
  "Every contribution counts! Keep it up! 🎯",
  "Financial discipline at its finest! 👏",
  "Your piggy bank is getting fatter! 🐷💰",
  "Emergency preparedness level: Expert! 🏆",
  "Saving like a pro! Your wallet will thank you! 💼"
];

const NON_EMERGENCY_KEYWORDS = ['shopping', 'vacation', 'party', 'concert', 'trip', 'entertainment', 'fun', 'celebration'];

const contribute = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, source = 'manual' } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize piggyBank if not exists (for existing users)
    if (!user.piggyBank) {
      user.piggyBank = {
        balance: 0,
        goal: 15000,
        streak: { count: 0, lastContributionMonth: null },
        badges: [],
        untouchedStatus: true,
        totalContributions: 0,
        totalWithdrawals: 0
      };
    }

    if (amount > user.bank_balance) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient funds in spending account',
        code: 'INSUFFICIENT_FUNDS'
      });
    }

    // Update balances
    user.bank_balance -= amount;
    user.piggyBank.balance += amount;
    user.piggyBank.totalContributions += amount;

    // Update streak
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (user.piggyBank.streak.lastContributionMonth !== currentMonthKey) {
      // Calculate new streak
      const transactions = await PiggyBankTransaction.find({
        userId,
        type: 'contribution'
      }).sort({ createdAt: -1 }).session(session);

      const monthsWithContributions = new Set();
      transactions.forEach(t => {
        const date = new Date(t.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsWithContributions.add(monthKey);
      });

      // Add current month
      monthsWithContributions.add(currentMonthKey);

      const sortedMonths = Array.from(monthsWithContributions).sort().reverse();
      let streak = 0;
      let checkMonth = currentMonthKey;

      for (const month of sortedMonths) {
        if (month === checkMonth) {
          streak++;
          const [year, monthNum] = checkMonth.split('-').map(Number);
          const prevDate = new Date(year, monthNum - 2, 1);
          checkMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        } else {
          break;
        }
      }

      user.piggyBank.streak.count = streak;
      user.piggyBank.streak.lastContributionMonth = currentMonthKey;
    }

    // Check and award badges
    const existingBadgeNames = user.piggyBank.badges.map(b => b.name);
    const newBadges = [];

    const BADGE_DEFINITIONS = {
      EMERGENCY_MASTER: {
        name: 'Emergency Master',
        icon: '🏆',
        condition: (u) => u.piggyBank.streak.count >= 3
      },
      FINANCIAL_FORTRESS: {
        name: 'Financial Fortress',
        icon: '🏰',
        condition: (u) => u.piggyBank.balance >= 10000
      },
      GOAL_CRUSHER: {
        name: 'Goal Crusher',
        icon: '💪',
        condition: (u) => u.piggyBank.balance >= u.piggyBank.goal
      }
    };

    for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
      if (badge.condition(user) && !existingBadgeNames.includes(badge.name)) {
        const newBadge = {
          name: badge.name,
          icon: badge.icon,
          earnedAt: new Date()
        };
        user.piggyBank.badges.push(newBadge);
        newBadges.push(newBadge);
      }
    }

    await user.save({ session });

    // Create piggy bank transaction record
    await PiggyBankTransaction.create([{
      userId,
      type: 'contribution',
      amount,
      source,
      balanceAfter: user.piggyBank.balance
    }], { session });

    // Create regular transaction record
    await Transaction.create([{
      userId,
      type: 'transfer',
      category: 'emergency_fund_deposit',
      amount,
      date: new Date(),
      description: `Added to Piggy Bank (${source})`
    }], { session });

    // Create badge notifications
    for (const badge of newBadges) {
      await Notification.create([{
        userId,
        type: 'badge_earned',
        title: `🎉 New Badge Earned!`,
        message: `Congratulations! You've earned the "${badge.name}" badge!`,
        badgeName: badge.name,
        badgeIcon: badge.icon
      }], { session });
    }

    await session.commitTransaction();

    const motivationalMessage = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

    res.json({
      success: true,
      newBalance: user.piggyBank.balance,
      streak: user.piggyBank.streak.count,
      newBadges,
      motivationalMessage
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Contribution error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process contribution',
      code: 'DATABASE_ERROR',
      details: err.message
    });
  } finally {
    session.endSession();
  }
};

const withdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, reason, proof } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    if (!reason) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Emergency reason is required',
        code: 'INVALID_REASON'
      });
    }

    if (!proof || proof.length < 20) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Emergency proof must be at least 20 characters',
        code: 'INVALID_PROOF'
      });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize piggyBank if not exists (for existing users)
    if (!user.piggyBank) {
      user.piggyBank = {
        balance: 0,
        goal: 15000,
        streak: { count: 0, lastContributionMonth: null },
        badges: [],
        untouchedStatus: true,
        totalContributions: 0,
        totalWithdrawals: 0
      };
    }

    if (user.piggyBank.balance === 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'No funds available in emergency fund',
        code: 'INSUFFICIENT_PIGGY_BANK'
      });
    }

    if (amount > user.piggyBank.balance) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient balance in piggy bank',
        code: 'INSUFFICIENT_PIGGY_BANK'
      });
    }

    const proofLower = proof.toLowerCase();
    const hasNonEmergencyKeyword = NON_EMERGENCY_KEYWORDS.some(keyword => proofLower.includes(keyword));
    let warning = null;

    if (hasNonEmergencyKeyword) {
      warning = "This doesn't sound like an emergency. Emergency funds are for unexpected urgent situations only.";
    }

    user.piggyBank.balance -= amount;
    user.bank_balance += amount;
    user.piggyBank.totalWithdrawals += amount;
    user.piggyBank.untouchedStatus = false;
    await user.save({ session });

    await PiggyBankTransaction.create([{
      userId,
      type: 'withdrawal',
      amount,
      emergencyReason: reason,
      emergencyProof: proof,
      warningShown: hasNonEmergencyKeyword,
      balanceAfter: user.piggyBank.balance
    }], { session });

    await Transaction.create([{
      userId,
      type: 'transfer',
      category: 'emergency_fund_withdrawal',
      amount,
      date: new Date(),
      description: `Emergency Withdrawal: ${reason}`
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      newBalance: user.piggyBank.balance,
      warning
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Withdrawal error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process withdrawal',
      code: 'DATABASE_ERROR'
    });
  } finally {
    session.endSession();
  }
};

const getBalance = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Initialize piggyBank if not exists (for existing users)
    if (!user.piggyBank) {
      user.piggyBank = {
        balance: 0,
        goal: 15000,
        streak: { count: 0, lastContributionMonth: null },
        badges: [],
        untouchedStatus: true,
        totalContributions: 0,
        totalWithdrawals: 0
      };
      await user.save();
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentMonthContributions = await PiggyBankTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'contribution',
          createdAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentMonthContribution = currentMonthContributions.length > 0 
      ? currentMonthContributions[0].total 
      : 0;

    res.json({
      balance: user.piggyBank.balance,
      goal: user.piggyBank.goal,
      streak: user.piggyBank.streak.count,
      badges: user.piggyBank.badges,
      untouchedStatus: user.piggyBank.untouchedStatus,
      currentMonthContribution
    });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch balance',
      code: 'DATABASE_ERROR'
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const months = parseInt(req.query.months) || 4;

    const transactions = await PiggyBankTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(months * 10);

    const historyByMonth = {};

    transactions.forEach(txn => {
      const date = new Date(txn.createdAt);
      const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!historyByMonth[monthKey]) {
        historyByMonth[monthKey] = {
          month: monthKey,
          contributions: 0,
          withdrawals: 0,
          transactions: []
        };
      }

      if (txn.type === 'contribution') {
        historyByMonth[monthKey].contributions += txn.amount;
      } else {
        historyByMonth[monthKey].withdrawals += txn.amount;
      }

      historyByMonth[monthKey].transactions.push({
        date: txn.createdAt,
        type: txn.type,
        amount: txn.amount,
        source: txn.source,
        emergencyReason: txn.emergencyReason
      });
    });

    const history = Object.values(historyByMonth).slice(0, months);

    res.json({ history });
  } catch (err) {
    console.error('Get history error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch history',
      code: 'DATABASE_ERROR',
      details: err.message
    });
  }
};

const updateGoal = async (req, res) => {
  try {
    const { goal } = req.body;
    const userId = req.userId;

    if (!goal || goal < 1000 || goal > 100000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Goal must be between ₹1,000 and ₹100,000',
        code: 'INVALID_GOAL'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.piggyBank.goal = goal;
    await user.save();

    res.json({
      success: true,
      newGoal: goal
    });
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update goal',
      code: 'DATABASE_ERROR'
    });
  }
};

const getAutoSuggest = async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await autoSuggestService.createSuggestionNotification(userId);

    if (!result.shouldSuggest) {
      return res.json({
        shouldSuggest: false,
        suggestedAmount: 0,
        reason: result.reason,
        details: result.details,
        message: null
      });
    }

    res.json({
      shouldSuggest: true,
      suggestedAmount: Math.round(result.suggestedAmount),
      message: result.message
    });
  } catch (err) {
    console.error('Get auto-suggest error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get suggestion',
      code: 'DATABASE_ERROR'
    });
  }
};

module.exports = {
  contribute,
  withdraw,
  getBalance,
  getHistory,
  updateGoal,
  getAutoSuggest
};

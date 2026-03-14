const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

const calculateLeftoverBudget = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get current month's budget
  const currentBudget = await Budget.findOne({
    userId,
    'period.month': now.getMonth() + 1,
    'period.year': now.getFullYear()
  });

  if (!currentBudget) {
    return {
      leftoverBudget: 0,
      eligible: false,
      reason: 'No budget set for this month',
      bankBalance: user.bank_balance
    };
  }

  const transactions = await Transaction.find({
    userId,
    date: { $gte: thisMonthStart }
  });

  let monthlyIncome = 0;
  const categorySpending = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      monthlyIncome += t.amount;
    } else if (t.type === 'expense') {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    }
  });

  // STRICT RULE 1: Check if savings goal is met
  const savingsSpent = categorySpending['savings'] || 0;
  const savingsGoal = currentBudget.categoryAllocations.savings || 0;
  
  if (savingsSpent < savingsGoal) {
    return {
      leftoverBudget: 0,
      eligible: false,
      reason: 'Savings goal not met',
      savingsActual: savingsSpent,
      savingsGoal: savingsGoal,
      needed: savingsGoal - savingsSpent,
      bankBalance: user.bank_balance
    };
  }

  // STRICT RULE 2: Check if any category is overspent
  const overspentCategories = [];
  Object.entries(currentBudget.categoryAllocations).forEach(([category, budgeted]) => {
    if (category === 'savings') return; // Skip savings, already checked
    const spent = categorySpending[category] || 0;
    if (spent > budgeted && budgeted > 0) {
      overspentCategories.push({
        category,
        budgeted,
        spent,
        overspent: spent - budgeted
      });
    }
  });

  if (overspentCategories.length > 0) {
    return {
      leftoverBudget: 0,
      eligible: false,
      reason: 'Categories overspent',
      overspentCategories,
      bankBalance: user.bank_balance
    };
  }

  // ALL CLEAR! Calculate leftover after meeting all goals
  const totalExpenses = Object.values(categorySpending).reduce((sum, amt) => sum + amt, 0);
  const leftoverBudget = user.bank_balance + monthlyIncome - totalExpenses;
  
  return {
    leftoverBudget: Math.max(0, leftoverBudget),
    eligible: true,
    bankBalance: user.bank_balance,
    monthlyIncome,
    totalExpenses,
    savingsActual: savingsSpent,
    savingsGoal: savingsGoal
  };
};

const shouldSuggest = async (userId) => {
  // STRICT RULE 3: Month-end only (last 3 days of month)
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  if (currentDay < daysInMonth - 2) {
    return false; // Not month-end yet
  }

  const result = await calculateLeftoverBudget(userId);
  return result.eligible && result.leftoverBudget > 100;
};

const createSuggestionNotification = async (userId) => {
  const result = await calculateLeftoverBudget(userId);
  
  // Check eligibility first
  if (!result.eligible) {
    return {
      shouldSuggest: false,
      reason: result.reason,
      details: result
    };
  }

  if (result.leftoverBudget <= 100) {
    return {
      shouldSuggest: false,
      reason: 'Leftover amount too small',
      leftoverBudget: result.leftoverBudget
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingNotification = await Notification.findOne({
    userId,
    type: 'piggy_bank_suggest',
    createdAt: { $gte: today }
  });

  if (existingNotification) {
    return {
      shouldSuggest: true,
      suggestedAmount: result.leftoverBudget,
      message: `You have ₹${Math.round(result.leftoverBudget).toLocaleString()} left this month. Add it to your emergency fund?`,
      notification: existingNotification
    };
  }

  const notification = await Notification.create({
    userId,
    type: 'piggy_bank_suggest',
    title: '🐷 Piggy Bank Time!',
    message: `You have ₹${Math.round(result.leftoverBudget).toLocaleString()} left this month. Add it to your emergency fund?`,
    suggestedAmount: Math.round(result.leftoverBudget)
  });

  return {
    shouldSuggest: true,
    suggestedAmount: result.leftoverBudget,
    message: notification.message,
    notification
  };
};

module.exports = {
  calculateLeftoverBudget,
  shouldSuggest,
  createSuggestionNotification
};

const User = require('../models/User');
const PiggyBankTransaction = require('../models/PiggyBankTransaction');

const calculateStreak = async (userId) => {
  const transactions = await PiggyBankTransaction.find({
    userId,
    type: 'contribution'
  }).sort({ createdAt: -1 });

  if (transactions.length === 0) return 0;

  const monthsWithContributions = new Set();
  transactions.forEach(t => {
    const date = new Date(t.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsWithContributions.add(monthKey);
  });

  const sortedMonths = Array.from(monthsWithContributions).sort().reverse();
  
  const now = new Date();
  let currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let streak = 0;

  for (const month of sortedMonths) {
    if (month === currentMonth) {
      streak++;
      const [year, monthNum] = currentMonth.split('-').map(Number);
      const prevDate = new Date(year, monthNum - 2, 1);
      currentMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    } else {
      break;
    }
  }

  return streak;
};

const updateStreakOnContribution = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  if (user.piggyBank.streak.lastContributionMonth === currentMonthKey) {
    return user.piggyBank.streak.count;
  }

  const newStreak = await calculateStreak(userId);
  
  user.piggyBank.streak.count = newStreak;
  user.piggyBank.streak.lastContributionMonth = currentMonthKey;
  await user.save();

  return newStreak;
};

const resetStreakOnMonthEnd = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  if (user.piggyBank.streak.lastContributionMonth !== lastMonthKey) {
    user.piggyBank.streak.count = 0;
    await user.save();
  }
};

module.exports = {
  calculateStreak,
  updateStreakOnContribution,
  resetStreakOnMonthEnd
};

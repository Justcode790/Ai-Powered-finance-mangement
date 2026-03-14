const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const CATEGORY_KEYS = [
  'rent',
  'food',
  'transport',
  'entertainment',
  'shopping',
  'education',
  'misc'
];

function emptyCategoryTotals() {
  return CATEGORY_KEYS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {});
}

async function buildMonthlyFeaturesForUser(userId, startDate, endDate) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('USER_NOT_FOUND');

  const totals = emptyCategoryTotals();

  const agg = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        category: { $in: CATEGORY_KEYS }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  agg.forEach((entry) => {
    if (totals.hasOwnProperty(entry._id)) {
      totals[entry._id] = entry.totalAmount;
    }
  });

  const featureObject = {
    age: Number(user.age || 0),
    income: Number(user.income || 0),
    rent: totals.rent,
    food: totals.food,
    transport: totals.transport,
    entertainment: totals.entertainment,
    shopping: totals.shopping,
    education: totals.education,
    misc: totals.misc,
    financial_literacy_score: Number(user.financial_literacy_score || 0),
    saving_habit_score: Number(user.saving_habit_score || 0)
  };

  const featureArray = [
    featureObject.age,
    featureObject.income,
    featureObject.rent,
    featureObject.food,
    featureObject.transport,
    featureObject.entertainment,
    featureObject.shopping,
    featureObject.education,
    featureObject.misc,
    featureObject.financial_literacy_score,
    featureObject.saving_habit_score
  ];

  const totalExpenses =
    totals.rent +
    totals.food +
    totals.transport +
    totals.entertainment +
    totals.shopping +
    totals.education +
    totals.misc;

  return { user, totals, totalExpenses, featureObject, featureArray };
}

module.exports = { buildMonthlyFeaturesForUser, CATEGORY_KEYS };


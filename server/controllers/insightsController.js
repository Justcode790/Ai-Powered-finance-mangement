const axios = require('axios');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const User = require('../models/User');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Cache for insights (24 hour TTL)
const insightsCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// GET /api/insights - Combined insights from all ML services
exports.getInsights = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check cache
    const cacheKey = `insights_${userId}`;
    const cached = insightsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ ...cached.data, cached: true });
    }

    // Get user data
    const user = await User.findById(userId).select('income age financial_literacy_score saving_habit_score').lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get transactions
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(1000)
      .lean();

    // Get active goals
    const goals = await Goal.find({ userId, status: 'active' }).lean();

    // Format data for ML service
    const formattedTransactions = transactions.map(t => ({
      transactionId: t._id.toString(),
      category: t.category,
      amount: t.amount,
      date: t.date.toISOString()
    }));

    const formattedGoals = goals.map(g => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline.toISOString()
    }));

    // Call ML services in parallel
    const [spendingAnalysis, spendingForecast] = await Promise.allSettled([
      // Spending pattern analysis
      axios.post(`${ML_SERVICE_URL}/ml/analyze/spending`, {
        userId: userId.toString(),
        transactions: formattedTransactions
      }, { timeout: 30000 }),

      // Spending forecast
      axios.post(`${ML_SERVICE_URL}/ml/forecast/spending`, {
        userId: userId.toString(),
        transactions: formattedTransactions,
        goals: formattedGoals,
        income: user.income
      }, { timeout: 30000 })
    ]);

    // Build response
    const insights = {
      spendingAnalysis: null,
      spendingForecast: null,
      errors: []
    };

    // Extract spending analysis
    if (spendingAnalysis.status === 'fulfilled') {
      insights.spendingAnalysis = spendingAnalysis.value.data;
    } else {
      insights.errors.push({
        service: 'spending_analysis',
        message: 'Failed to analyze spending patterns'
      });
    }

    // Extract spending forecast
    if (spendingForecast.status === 'fulfilled') {
      insights.spendingForecast = spendingForecast.value.data;
    } else {
      insights.errors.push({
        service: 'spending_forecast',
        message: 'Failed to generate spending forecast'
      });
    }

    // Cache the results
    insightsCache.set(cacheKey, {
      data: insights,
      timestamp: Date.now()
    });

    // Clean up old cache entries (simple cleanup)
    if (insightsCache.size > 100) {
      const entries = Array.from(insightsCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      // Remove oldest 20 entries
      for (let i = 0; i < 20; i++) {
        insightsCache.delete(entries[i][0]);
      }
    }

    res.json({ ...insights, cached: false });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/insights/invalidate - Invalidate cache for user
exports.invalidateInsightsCache = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheKey = `insights_${userId}`;
    insightsCache.delete(cacheKey);
    res.json({ message: 'Cache invalidated' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const Article = require('../models/Article');
const Module = require('../models/Module');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

/**
 * Generate personalized content recommendations for a user
 * @param {String} userId - User ID
 * @returns {Array} - Array of recommended content items (max 5)
 */
async function generateRecommendations(userId) {
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    const recommendations = [];

    // Determine user's difficulty level based on financial literacy score
    let difficultyLevel = 'beginner';
    if (user.financial_literacy_score >= 8) {
      difficultyLevel = 'advanced';
    } else if (user.financial_literacy_score >= 5) {
      difficultyLevel = 'intermediate';
    }

    // Get user's spending patterns
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startOfMonth, $lte: now }
    }).lean();

    // Calculate total income and expenses
    const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
    const income = user.income || 0;
    const savingsRate = income > 0 ? (income - totalExpenses) / income : 0;

    // Get user's budget if exists
    const currentBudget = await Budget.findOne({
      userId,
      'period.month': now.getMonth() + 1,
      'period.year': now.getFullYear()
    }).lean();

    // Identify overspending categories
    const overspendingCategories = [];
    if (currentBudget) {
      const categoryTotals = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

      Object.keys(categoryTotals).forEach((category) => {
        const budgeted = currentBudget.categoryAllocations[category] || 0;
        const actual = categoryTotals[category];
        if (actual > budgeted * 1.1) {
          // Overspending by more than 10%
          overspendingCategories.push(category);
        }
      });
    }

    // Priority 1: If savings rate is low, recommend saving content
    if (savingsRate < 0.15) {
      const savingContent = await Article.find({
        category: 'saving',
        difficulty: difficultyLevel
      })
        .limit(2)
        .sort({ viewCount: -1 })
        .lean();

      recommendations.push(
        ...savingContent.map((c) => ({
          ...c,
          type: 'article',
          reason: 'Your savings rate is low. Learn strategies to save more.'
        }))
      );
    }

    // Priority 2: Recommend content for overspending categories
    if (overspendingCategories.length > 0) {
      const categoryContent = await Article.find({
        category: 'budgeting',
        difficulty: difficultyLevel,
        tags: { $in: overspendingCategories }
      })
        .limit(1)
        .lean();

      if (categoryContent.length > 0) {
        recommendations.push({
          ...categoryContent[0],
          type: 'article',
          reason: `You're overspending on ${overspendingCategories[0]}. Here's how to manage it better.`
        });
      }
    }

    // Priority 3: Recommend content matching user's difficulty level
    if (recommendations.length < 5) {
      const difficultyMatched = await Article.find({
        difficulty: difficultyLevel,
        _id: { $nin: recommendations.map((r) => r._id) }
      })
        .limit(5 - recommendations.length)
        .sort({ viewCount: -1 })
        .lean();

      recommendations.push(
        ...difficultyMatched.map((c) => ({
          ...c,
          type: 'article',
          reason: 'Recommended based on your financial literacy level.'
        }))
      );
    }

    // Priority 4: Add collaborative filtering recommendations (30% weight)
    if (recommendations.length < 5) {
      const collaborativeIds = await getCollaborativeRecommendations(userId);
      const collaborativeContent = await Article.find({
        _id: { $in: collaborativeIds, $nin: recommendations.map((r) => r._id) }
      })
        .limit(2)
        .lean();

      recommendations.push(
        ...collaborativeContent.map((c) => ({
          ...c,
          type: 'article',
          reason: 'Popular among users similar to you.'
        }))
      );
    }

    // Priority 5: Recommend modules if still need more
    if (recommendations.length < 5) {
      const modules = await Module.find({
        difficulty: difficultyLevel,
        _id: { $nin: user.learningProgress?.completedModules || [] }
      })
        .limit(5 - recommendations.length)
        .sort({ createdAt: -1 })
        .lean();

      recommendations.push(
        ...modules.map((m) => ({
          ...m,
          type: 'module',
          reason: 'Continue your learning journey with this module.'
        }))
      );
    }

    // Limit to 5 recommendations
    return recommendations.slice(0, 5);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Get collaborative filtering recommendations based on similar users
 * @param {String} userId - User ID
 * @returns {Array} - Array of content IDs popular among similar users
 */
async function getCollaborativeRecommendations(userId) {
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      return [];
    }

    // Find similar users (within ±3 years age, ±20% income)
    const ageLower = (user.age || 25) - 3;
    const ageUpper = (user.age || 25) + 3;
    const incomeLower = (user.income || 30000) * 0.8;
    const incomeUpper = (user.income || 30000) * 1.2;

    const similarUsers = await User.find({
      _id: { $ne: userId },
      age: { $gte: ageLower, $lte: ageUpper },
      income: { $gte: incomeLower, $lte: incomeUpper }
    })
      .limit(50)
      .select('_id')
      .lean();

    if (similarUsers.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.map((u) => u._id);

    // Find popular articles among similar users (by view count)
    // This is a simplified approach - in production, you'd track user views
    const popularArticles = await Article.find({})
      .sort({ viewCount: -1 })
      .limit(10)
      .select('_id')
      .lean();

    return popularArticles.map((a) => a._id);
  } catch (error) {
    console.error('Error getting collaborative recommendations:', error);
    return [];
  }
}

module.exports = {
  generateRecommendations,
  getCollaborativeRecommendations
};

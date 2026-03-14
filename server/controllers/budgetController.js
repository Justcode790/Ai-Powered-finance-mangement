const Budget = require('../models/Budget');
const BudgetTemplate = require('../models/BudgetTemplate');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { getBudgetExceededTip } = require('../services/tipService');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/budgets
exports.createBudget = async (req, res) => {
  try {
    const { period, categoryAllocations, templateId, aiAssisted } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!period || !period.month || !period.year) {
      return res.status(400).json({ message: 'Period (month and year) is required' });
    }

    // Get user data
    const user = await User.findById(userId).select('income financial_literacy_score saving_habit_score').lean();
    const userIncome = user?.income || 0;

    let allocations = categoryAllocations;
    let aiRecommendation = null;

    // If AI-assisted mode, call ML service for recommendations
    if (aiAssisted && !templateId && !categoryAllocations) {
      try {
        // Get user's transaction history
        const transactions = await Transaction.find({ userId })
          .sort({ date: -1 })
          .limit(1000)
          .lean();

        // Get user's goals
        const Goal = require('../models/Goal');
        const goals = await Goal.find({ userId, status: 'active' }).lean();

        // Format transactions for ML service
        const formattedTransactions = transactions.map(t => ({
          transactionId: t._id.toString(),
          category: t.category,
          amount: t.amount,
          date: t.date.toISOString()
        }));

        // Format goals for ML service
        const formattedGoals = goals.map(g => ({
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          deadline: g.deadline.toISOString()
        }));

        // Call ML service for budget recommendation
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/ml/recommend/budget`, {
          userId: userId.toString(),
          income: userIncome,
          transactions: formattedTransactions,
          goals: formattedGoals,
          financial_literacy_score: user.financial_literacy_score || 5.0,
          saving_habit_score: user.saving_habit_score || 5.0
        }, {
          timeout: 30000
        });

        if (mlResponse.data && mlResponse.data.allocations) {
          allocations = mlResponse.data.allocations;
          aiRecommendation = {
            allocations: mlResponse.data.allocations,
            rationale: mlResponse.data.rationale
          };

          // Ensure savings allocation is at least 20% of income
          const minSavings = userIncome * 0.20;
          if (allocations.savings < minSavings) {
            allocations.savings = minSavings;
          }
        }
      } catch (mlError) {
        console.error('ML service error:', mlError.message);
        // Fall back to template or manual entry if ML service fails
        return res.status(503).json({
          message: 'AI budget recommendation service is currently unavailable. Please use a template or create manually.',
          error: 'ml_service_unavailable'
        });
      }
    }

    // If templateId provided, apply template
    if (templateId && !aiAssisted) {
      const template = await BudgetTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Calculate allocations from percentages
      allocations = {};
      Object.keys(template.categoryPercentages).forEach((category) => {
        allocations[category] = Math.round(
          (template.categoryPercentages[category] / 100) * userIncome
        );
      });

      // Increment template usage count
      template.usageCount += 1;
      await template.save();
    }

    // Validate all 8 categories are present
    const requiredCategories = [
      'rent',
      'food',
      'transport',
      'entertainment',
      'shopping',
      'education',
      'misc',
      'savings'
    ];

    for (const category of requiredCategories) {
      if (allocations[category] === undefined) {
        return res.status(400).json({
          message: `Missing allocation for category: ${category}`
        });
      }
    }

    // Calculate total budget
    const totalBudget = Object.values(allocations).reduce((sum, val) => sum + val, 0);

    // Validate total doesn't exceed income
    if (totalBudget > userIncome) {
      return res.status(400).json({
        message: `Total budget (${totalBudget}) exceeds income (${userIncome})`
      });
    }

    // Check if budget already exists for this period
    const existingBudget = await Budget.findOne({
      userId,
      'period.month': period.month,
      'period.year': period.year
    });

    if (existingBudget) {
      return res.status(400).json({
        message: 'Budget already exists for this period. Use PUT to update.'
      });
    }

    // Create budget
    const budget = new Budget({
      userId,
      period,
      categoryAllocations: allocations,
      totalBudget,
      templateId: templateId || undefined,
      aiAssisted: aiAssisted || false
    });

    await budget.save();

    const response = {
      budget,
      aiRecommendation: aiRecommendation || undefined
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/budgets
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.userId;
    const { period } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const query = { userId };

    // Filter by period if provided
    if (period) {
      const [month, year] = period.split('-');
      if (month && year) {
        query['period.month'] = parseInt(month);
        query['period.year'] = parseInt(year);
      }
    }

    const budgets = await Budget.find(query)
      .sort({ 'period.year': -1, 'period.month': -1 })
      .lean();

    res.json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/budgets/:id
exports.getBudgetById = async (req, res) => {
  try {
    const userId = req.userId;
    const budgetId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const budget = await Budget.findOne({ _id: budgetId, userId }).lean();

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/budgets/:id
exports.updateBudget = async (req, res) => {
  try {
    const userId = req.userId;
    const budgetId = req.params.id;
    const { categoryAllocations } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!categoryAllocations) {
      return res.status(400).json({ message: 'Category allocations are required' });
    }

    const budget = await Budget.findOne({ _id: budgetId, userId });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Get user's income
    const user = await User.findById(userId).select('income').lean();
    const userIncome = user?.income || 0;

    // Calculate new total
    const newTotal = Object.values(categoryAllocations).reduce((sum, val) => sum + val, 0);

    // Validate total doesn't exceed income
    if (newTotal > userIncome) {
      return res.status(400).json({
        message: `Total budget (${newTotal}) exceeds income (${userIncome})`
      });
    }

    // Update allocations
    budget.categoryAllocations = categoryAllocations;
    budget.totalBudget = newTotal;

    await budget.save();

    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/budgets/:id/variance
exports.getBudgetVariance = async (req, res) => {
  try {
    const userId = req.userId;
    const budgetId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const budget = await Budget.findOne({ _id: budgetId, userId }).lean();

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Get transactions for the budget period
    const startDate = new Date(budget.period.year, budget.period.month - 1, 1);
    const endDate = new Date(budget.period.year, budget.period.month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Calculate actual spending by category
    const actualSpending = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    // Calculate variance for each category
    const variances = [];
    const categories = ['rent', 'food', 'transport', 'entertainment', 'shopping', 'education', 'misc'];
    const notificationsToCreate = [];

    for (const category of categories) {
      const budgeted = budget.categoryAllocations[category] || 0;
      const actual = actualSpending[category] || 0;
      const variance = actual - budgeted;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

      // Determine status
      let status = 'on_track';
      let color = 'yellow';
      if (variance < -0.05 * budgeted) {
        status = 'under';
        color = 'green';
      } else if (variance > 0.10 * budgeted) {
        status = 'critical';
        color = 'red';
      } else if (variance > 0.05 * budgeted) {
        status = 'over';
        color = 'orange';
      }

      // Calculate progress percentage
      const progressPercent = budgeted > 0 ? Math.min(100, (actual / budgeted) * 100) : 0;

      variances.push({
        category,
        budgeted,
        actual,
        variance,
        variancePercent: Math.round(variancePercent),
        status,
        color,
        progressPercent: Math.round(progressPercent)
      });

      // Queue notification if budget exceeded
      if (variance > 0) {
        notificationsToCreate.push({
          category,
          variance,
          budgeted,
          actual
        });
      }
    }

    // Batch check and create notifications (async, don't block response)
    if (notificationsToCreate.length > 0) {
      // Run notification creation in background without blocking response
      setImmediate(async () => {
        try {
          const existingNotifications = await Notification.find({
            userId,
            type: 'budget_exceeded',
            category: { $in: notificationsToCreate.map(n => n.category) },
            createdAt: { $gte: startDate }
          }).lean();

          const existingCategories = new Set(existingNotifications.map(n => n.category));
          
          const newNotifications = notificationsToCreate
            .filter(n => !existingCategories.has(n.category))
            .map(n => ({
              userId,
              type: 'budget_exceeded',
              title: `Budget Exceeded: ${n.category.charAt(0).toUpperCase() + n.category.slice(1)}`,
              message: `You've exceeded your ${n.category} budget by ₹${Math.round(n.variance)}. Budgeted: ₹${n.budgeted}, Spent: ₹${n.actual}.`,
              category: n.category,
              amount: n.variance
            }));

          if (newNotifications.length > 0) {
            await Notification.insertMany(newNotifications);
          }
        } catch (err) {
          console.error('Error creating notifications:', err);
        }
      });
    }

    res.json({ variances });
  } catch (error) {
    console.error('Error calculating budget variance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

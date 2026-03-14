const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const { getGoalAchievedTip } = require('../services/tipService');

// POST /api/goals
exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ message: 'Name, target amount, and deadline are required' });
    }

    // Validate target amount
    if (targetAmount < 0) {
      return res.status(400).json({ message: 'Target amount must be positive' });
    }

    // Validate deadline is in future
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ message: 'Deadline must be in the future' });
    }

    const goal = new Goal({
      userId,
      name,
      targetAmount,
      deadline: deadlineDate,
      currentAmount: 0,
      status: 'active'
    });

    await goal.save();

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/goals
exports.getGoals = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const goals = await Goal.find({ userId }).sort({ createdAt: -1 }).lean();

    // Calculate progress and required monthly savings for each goal
    const goalsWithProgress = goals.map((goal) => {
      const progress = goal.targetAmount > 0 
        ? (goal.currentAmount / goal.targetAmount) * 100 
        : 0;
      
      const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
      
      const now = new Date();
      const deadlineDate = new Date(goal.deadline);
      const monthsRemaining = Math.max(
        1,
        Math.ceil((deadlineDate - now) / (30 * 24 * 60 * 60 * 1000))
      );
      
      const requiredMonthlySavings = remainingAmount / monthsRemaining;

      return {
        ...goal,
        progress: Math.round(progress),
        remainingAmount,
        monthsRemaining,
        requiredMonthlySavings: Math.round(requiredMonthlySavings)
      };
    });

    res.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/goals/:id
exports.updateGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const goalId = req.params.id;
    const { name, targetAmount, deadline, currentAmount } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const goal = await Goal.findOne({ _id: goalId, userId });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Update fields if provided
    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) {
      if (targetAmount < 0) {
        return res.status(400).json({ message: 'Target amount must be positive' });
      }
      goal.targetAmount = targetAmount;
    }
    if (deadline !== undefined) {
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date() && goal.status === 'active') {
        return res.status(400).json({ message: 'Deadline must be in the future' });
      }
      goal.deadline = deadlineDate;
    }
    if (currentAmount !== undefined) {
      if (currentAmount < 0) {
        return res.status(400).json({ message: 'Current amount must be positive' });
      }
      goal.currentAmount = currentAmount;

      // Check if goal is achieved
      if (currentAmount >= goal.targetAmount && goal.status === 'active') {
        goal.status = 'completed';
        goal.completedAt = new Date();

        // Create notification
        await Notification.create({
          userId,
          type: 'goal_achieved',
          title: 'Goal Achieved! 🎉',
          message: `Congratulations! You've achieved your goal: ${goal.name}. You saved ₹${goal.targetAmount}!`,
          amount: goal.targetAmount
        });

        // Get contextual tip for goal achievement
        const tip = await getGoalAchievedTip(userId);
        if (tip) {
          // Tip will be returned in response
          goal.achievementTip = tip;
        }
      }
    }

    await goal.save();

    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/goals/:id
exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.userId;
    const goalId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const goal = await Goal.findOneAndDelete({ _id: goalId, userId });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

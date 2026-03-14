const Tip = require('../models/Tip');
const TipHistory = require('../models/TipHistory');
const User = require('../models/User');

/**
 * Get a contextual tip for a user based on context and category
 * Implements tip rotation to avoid showing the same tip repeatedly
 * @param {String} userId - User ID
 * @param {String} context - Context: 'transaction', 'budget_exceeded', 'goal_achieved', 'general'
 * @param {String} category - Optional category to filter tips
 * @returns {Object|null} - Tip object or null
 */
async function getContextualTip(userId, context, category = null) {
  try {
    // Get tips shown to user in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyShownTips = await TipHistory.find({
      userId,
      shownAt: { $gte: thirtyDaysAgo }
    })
      .select('tipId')
      .lean();

    const shownTipIds = recentlyShownTips.map((h) => h.tipId);

    // Build query for tips
    const query = { context };
    if (category) {
      query.category = category;
    }

    // Exclude recently shown tips
    if (shownTipIds.length > 0) {
      query._id = { $nin: shownTipIds };
    }

    // Get user's financial health score to prioritize tips
    const user = await User.findById(userId).select('financial_literacy_score').lean();
    const financialHealthScore = user?.financial_literacy_score || 5;

    // Find tips matching criteria, sorted by priority
    const tips = await Tip.find(query).sort({ priority: -1 }).limit(10).lean();

    if (tips.length === 0) {
      // If no tips available (all shown recently), reset and get any tip
      const fallbackTips = await Tip.find({ context })
        .sort({ priority: -1 })
        .limit(1)
        .lean();
      
      if (fallbackTips.length > 0) {
        await recordTipShown(userId, fallbackTips[0]._id, context);
        return fallbackTips[0];
      }
      
      return null;
    }

    // Select a tip (prioritize higher priority tips)
    const selectedTip = tips[0];

    // Record that this tip was shown
    await recordTipShown(userId, selectedTip._id, context);

    return selectedTip;
  } catch (error) {
    console.error('Error getting contextual tip:', error);
    return null;
  }
}

/**
 * Record that a tip was shown to a user
 * @param {String} userId - User ID
 * @param {String} tipId - Tip ID
 * @param {String} context - Context in which tip was shown
 */
async function recordTipShown(userId, tipId, context) {
  try {
    await TipHistory.create({
      userId,
      tipId,
      context,
      shownAt: new Date()
    });
  } catch (error) {
    console.error('Error recording tip shown:', error);
  }
}

/**
 * Mark a tip as helpful
 * @param {String} userId - User ID
 * @param {String} tipId - Tip ID
 * @returns {Boolean} - Success status
 */
async function markTipHelpful(userId, tipId) {
  try {
    const result = await TipHistory.findOneAndUpdate(
      { userId, tipId },
      {
        markedHelpful: true,
        markedHelpfulAt: new Date()
      },
      { new: true, upsert: true }
    );

    return !!result;
  } catch (error) {
    console.error('Error marking tip helpful:', error);
    return false;
  }
}

/**
 * Check if user has been shown a tip in current session
 * Session is defined as last 1 hour
 * @param {String} userId - User ID
 * @param {String} context - Context
 * @returns {Boolean} - True if tip shown in session
 */
async function hasTipInSession(userId, context) {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentTip = await TipHistory.findOne({
      userId,
      context,
      shownAt: { $gte: oneHourAgo }
    });

    return !!recentTip;
  } catch (error) {
    console.error('Error checking tip session:', error);
    return false;
  }
}

/**
 * Get tip for budget exceeded context
 * @param {String} userId - User ID
 * @param {String} category - Category that exceeded budget
 * @returns {Object|null} - Tip object or null
 */
async function getBudgetExceededTip(userId, category) {
  try {
    // Check if tip already shown in session
    const hasRecentTip = await hasTipInSession(userId, 'budget_exceeded');
    if (hasRecentTip) {
      return null;
    }

    return await getContextualTip(userId, 'budget_exceeded', category);
  } catch (error) {
    console.error('Error getting budget exceeded tip:', error);
    return null;
  }
}

/**
 * Get tip for goal achieved context
 * @param {String} userId - User ID
 * @returns {Object|null} - Tip object or null
 */
async function getGoalAchievedTip(userId) {
  try {
    // Check if tip already shown in session
    const hasRecentTip = await hasTipInSession(userId, 'goal_achieved');
    if (hasRecentTip) {
      return null;
    }

    // Get tips for goal achievement (saving or investing category)
    const tip = await getContextualTip(userId, 'goal_achieved');
    return tip;
  } catch (error) {
    console.error('Error getting goal achieved tip:', error);
    return null;
  }
}

module.exports = {
  getContextualTip,
  recordTipShown,
  markTipHelpful,
  hasTipInSession,
  getBudgetExceededTip,
  getGoalAchievedTip
};

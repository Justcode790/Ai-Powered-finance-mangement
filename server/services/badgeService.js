const User = require('../models/User');

const BADGE_DEFINITIONS = {
  EMERGENCY_MASTER: {
    name: 'Emergency Master',
    icon: '🏆',
    condition: (user) => user.piggyBank.streak.count >= 3
  },
  FINANCIAL_FORTRESS: {
    name: 'Financial Fortress',
    icon: '🏰',
    condition: (user) => user.piggyBank.balance >= 10000
  },
  GOAL_CRUSHER: {
    name: 'Goal Crusher',
    icon: '💪',
    condition: (user) => user.piggyBank.balance >= user.piggyBank.goal
  }
};

const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const newlyAwardedBadges = [];
  const existingBadgeNames = user.piggyBank.badges.map(b => b.name);

  for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
    if (badge.condition(user) && !existingBadgeNames.includes(badge.name)) {
      const newBadge = {
        name: badge.name,
        icon: badge.icon,
        earnedAt: new Date()
      };
      user.piggyBank.badges.push(newBadge);
      newlyAwardedBadges.push(newBadge);
    }
  }

  if (newlyAwardedBadges.length > 0) {
    await user.save();
  }

  return newlyAwardedBadges;
};

const getBadgeList = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  return user.piggyBank.badges;
};

module.exports = {
  checkAndAwardBadges,
  getBadgeList,
  BADGE_DEFINITIONS
};

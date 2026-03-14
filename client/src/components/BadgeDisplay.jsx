import { Award, Lock, Shield } from 'lucide-react';

const ALL_BADGES = [
  { name: 'Emergency Master', icon: '🏆', description: '3-month contribution streak' },
  { name: 'Financial Fortress', icon: '🏰', description: '₹10,000+ saved' },
  { name: 'Goal Crusher', icon: '💪', description: 'Reached savings goal' }
];

const BadgeDisplay = ({ badges = [], untouchedStatus }) => {
  const earnedBadgeNames = badges.map(b => b.name);

  return (
    <div className="bg-white rounded-xl p-4 border border-pink-200 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Award className="text-purple-600" size={16} />
        <p className="text-xs text-gray-600 font-medium">Achievements</p>
      </div>

      {/* Untouched Status */}
      {untouchedStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-600" size={16} />
            <p className="text-xs text-blue-700 font-bold">
              🛡️ Untouched Fund - Never withdrawn!
            </p>
          </div>
        </div>
      )}

      {/* Badge Grid */}
      <div className="grid grid-cols-3 gap-2">
        {ALL_BADGES.map((badge) => {
          const isEarned = earnedBadgeNames.includes(badge.name);
          const earnedBadge = badges.find(b => b.name === badge.name);

          return (
            <div
              key={badge.name}
              className={`rounded-lg p-2 text-center ${
                isEarned 
                  ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border border-yellow-300' 
                  : 'bg-gray-100 border border-gray-200 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">
                {isEarned ? badge.icon : <Lock className="mx-auto text-gray-400" size={20} />}
              </div>
              <p className="text-[10px] text-gray-700 font-medium leading-tight">
                {badge.name}
              </p>
              {isEarned && earnedBadge && (
                <p className="text-[9px] text-gray-500 mt-1">
                  {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {badges.length === 0 && !untouchedStatus && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Keep saving to earn badges!
        </p>
      )}
    </div>
  );
};

export default BadgeDisplay;

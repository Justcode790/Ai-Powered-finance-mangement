import { useEffect, useState } from 'react';
import { getPiggyBankBalance, getPiggyBankHistory, contributeToPiggyBank, withdrawFromPiggyBank } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PiggyBank, TrendingUp, AlertCircle, Award } from 'lucide-react';
import ContributionModal from './ContributionModal';
import WithdrawalModal from './WithdrawalModal';
import BadgeDisplay from './BadgeDisplay';
import MotivationalMessage from './MotivationalMessage';

const PiggyBankCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [piggyBankData, setPiggyBankData] = useState({
    balance: 0,
    goal: 15000,
    streak: 0,
    badges: [],
    untouchedStatus: true,
    currentMonthContribution: 0
  });
  const [history, setHistory] = useState([]);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState(null);

  useEffect(() => {
    if (user) {
      loadPiggyBankData();
    }
  }, [user]);

  const loadPiggyBankData = async () => {
    try {
      setLoading(true);
      const [balanceData, historyData] = await Promise.all([
        getPiggyBankBalance(),
        getPiggyBankHistory(4)
      ]);
      
      setPiggyBankData(balanceData);
      setHistory(historyData.history || []);
    } catch (err) {
      console.error('Error loading piggy bank data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async (amount) => {
    try {
      const result = await contributeToPiggyBank({ amount, source: 'manual' });
      
      if (result.success) {
        setMotivationalMsg(result.motivationalMessage);
        setTimeout(() => setMotivationalMsg(null), 5000);
        
        await loadPiggyBankData();
        setShowContributionModal(false);
      }
    } catch (err) {
      console.error('Contribution error:', err);
      throw err;
    }
  };

  const handleWithdraw = async (amount, reason, proof) => {
    try {
      const result = await withdrawFromPiggyBank({ amount, reason, proof });
      
      if (result.success) {
        await loadPiggyBankData();
        setShowWithdrawalModal(false);
        return result.warning;
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      throw err;
    }
  };

  if (loading || !user) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { balance, goal, streak, badges, untouchedStatus, currentMonthContribution } = piggyBankData;
  const progressPercentage = goal > 0 ? Math.min(100, (balance / goal) * 100) : 0;
  const isGoalReached = balance >= goal;

  return (
    <>
      {motivationalMsg && <MotivationalMessage message={motivationalMsg} type="success" />}
      
      <div className="card bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="text-pink-600" size={24} />
            <p className="text-sm font-bold text-gray-900">🐷 Piggy Bank Emergency Fund</p>
          </div>
          {streak >= 3 && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1">
              <p className="text-xs font-bold text-yellow-700">
                🔥 {streak} Month Streak!
              </p>
            </div>
          )}
        </div>

        {/* Balance Display */}
        <div className="bg-white rounded-xl p-4 mb-4 border border-pink-200">
          <p className="text-xs text-gray-600 mb-1">Emergency Fund Balance</p>
          <p className="text-3xl font-bold text-pink-700 mb-3">
            ₹{balance.toLocaleString()}
          </p>

          {/* Goal Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-600">Goal: ₹{goal.toLocaleString()}</p>
              <p className="text-xs font-bold text-gray-900">{progressPercentage.toFixed(0)}%</p>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {isGoalReached && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-2">
              <p className="text-xs text-green-700 font-bold">
                🎉 Goal Reached! Consider setting a new target.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setShowContributionModal(true)}
            className="flex items-center justify-center gap-2 bg-pink-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-pink-700 transition-colors"
          >
            <TrendingUp size={16} />
            Add Money
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            disabled={balance === 0}
            className="flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertCircle size={16} />
            Emergency
          </button>
        </div>

        {/* Contribution History */}
        <div className="bg-white rounded-xl p-4 border border-pink-200 mb-4">
          <p className="text-xs text-gray-600 font-medium mb-3">Monthly Contributions</p>
          <div className="space-y-2">
            {history.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <p className="text-xs text-gray-700">{item.month}</p>
                <p className="text-sm font-bold text-pink-600">
                  +₹{item.contributions.toLocaleString()}
                </p>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-xs text-gray-500">No contributions yet. Start saving today!</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <BadgeDisplay badges={badges} untouchedStatus={untouchedStatus} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-pink-200">
            <p className="text-xs text-gray-600 mb-1">This Month</p>
            <p className="text-sm font-bold text-gray-900">
              ₹{currentMonthContribution.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-pink-200">
            <p className="text-xs text-gray-600 mb-1">Streak</p>
            <p className="text-sm font-bold text-gray-900">
              {streak} {streak === 1 ? 'month' : 'months'}
            </p>
          </div>
        </div>
      </div>

      <ContributionModal
        isOpen={showContributionModal}
        onClose={() => setShowContributionModal(false)}
        onSubmit={handleContribute}
        maxAmount={user?.bank_balance || 0}
      />

      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSubmit={handleWithdraw}
        maxAmount={balance}
      />
    </>
  );
};

export default PiggyBankCard;

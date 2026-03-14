import React, { useState, useEffect } from 'react';
import { PiggyBank, X, TrendingUp, AlertCircle, History } from 'lucide-react';
import { getPiggyBankBalance, getPiggyBankAutoSuggest, getPiggyBankHistory } from '../services/api';
import ContributionModal from './ContributionModal';
import WithdrawalModal from './WithdrawalModal';
import BadgeDisplay from './BadgeDisplay';

const FloatingPiggyBank = () => {
  const [showModal, setShowModal] = useState(false);
  const [piggyData, setPiggyData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    loadPiggyData();
  }, []);

  const loadPiggyData = async () => {
    try {
      setLoading(true);
      const [balanceData, eligibilityData, historyData] = await Promise.all([
        getPiggyBankBalance(),
        getPiggyBankAutoSuggest(),
        getPiggyBankHistory(4)
      ]);
      setPiggyData(balanceData);
      setEligibility(eligibilityData);
      setHistory(historyData.history || []);
    } catch (err) {
      console.error('Error loading piggy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = () => {
    setShowModal(true);
    loadPiggyData();
  };

  const handleContributionSuccess = () => {
    setShowContributionModal(false);
    loadPiggyData();
  };

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    loadPiggyData();
  };

  if (!piggyData) return null;

  const getIconStatus = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const isMonthEnd = currentDay >= daysInMonth - 2;

    if (isMonthEnd && eligibility?.shouldSuggest) {
      return 'eligible';
    }
    if (piggyData.balance > 0) {
      return 'active';
    }
    return 'inactive';
  };

  const status = getIconStatus();
  const progress = Math.min(100, (piggyData.balance / piggyData.goal) * 100);

  return (
    <>
      {/* Floating Icon */}
      <div
        onClick={handleModalOpen}
        className={`floating-piggy-icon ${status}`}
        title="Piggy Bank Emergency Fund"
      >
        <PiggyBank size={28} className="piggy-icon-svg" />
        <span className="piggy-balance">₹{(piggyData.balance / 1000).toFixed(1)}K</span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PiggyBank size={32} />
                <div>
                  <h2 className="text-lg font-bold">🐷 Piggy Bank</h2>
                  <p className="text-xs opacity-90">Emergency Fund</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="hover:bg-white/20 rounded-full p-1 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Balance & Progress */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-900">₹{piggyData.balance.toLocaleString()}</p>
                  </div>
                  {piggyData.streak > 0 && (
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      🔥 {piggyData.streak} mo
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Goal Progress</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Goal: ₹{piggyData.goal.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Eligibility Status */}
              {eligibility?.shouldSuggest ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="text-green-600 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-green-700 mb-1">
                        ✅ Eligible Now!
                      </p>
                      <p className="text-xs text-gray-700 mb-3">
                        {eligibility.message}
                      </p>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setShowContributionModal(true);
                        }}
                        className="w-full bg-green-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-green-700"
                      >
                        🐷 Add ₹{eligibility.suggestedAmount.toLocaleString()} Now
                      </button>
                    </div>
                  </div>
                </div>
              ) : eligibility?.reason ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-bold text-yellow-700 mb-1">
                        Not Eligible Yet
                      </p>
                      <p className="text-xs text-gray-700">
                        {eligibility.reason === 'Savings goal not met' && (
                          <>Need ₹{eligibility.details?.needed?.toLocaleString()} more in savings 🛡️</>
                        )}
                        {eligibility.reason === 'Categories overspent' && (
                          <>Stay within budget to unlock Piggy Bank 📊</>
                        )}
                        {eligibility.reason === 'Leftover amount too small' && (
                          <>Keep managing your budget well! 💪</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowContributionModal(true);
                  }}
                  className="bg-pink-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-pink-700 flex items-center justify-center gap-2"
                >
                  <PiggyBank size={18} />
                  Add Money
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowWithdrawalModal(true);
                  }}
                  className="bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  🚨 Emergency
                </button>
              </div>

              {/* Badges */}
              {piggyData.badges && piggyData.badges.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>🏆</span> Achievements
                  </p>
                  <BadgeDisplay badges={piggyData.badges} untouchedStatus={piggyData.untouchedStatus} />
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <History size={16} />
                    Recent History
                  </p>
                  <div className="space-y-2">
                    {history.slice(0, 3).map((monthData, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">
                            {monthData.month}
                          </span>
                          <span className="text-xs font-bold text-green-600">
                            +₹{monthData.contributions.toLocaleString()}
                            {idx === 0 && ' 🥇'}
                            {idx === 1 && ' 🥈'}
                            {idx === 2 && ' 🥉'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      <ContributionModal
        isOpen={showContributionModal}
        onClose={() => setShowContributionModal(false)}
        onSuccess={handleContributionSuccess}
        maxAmount={eligibility?.suggestedAmount || 0}
      />

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={handleWithdrawalSuccess}
        maxAmount={piggyData?.balance || 0}
      />

      <style jsx>{`
        .floating-piggy-icon {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 40;
          animation: float 3s ease-in-out infinite;
        }

        .floating-piggy-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(236, 72, 153, 0.5);
        }

        .floating-piggy-icon.eligible {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          animation: pulse-green 2s ease-in-out infinite;
        }

        .floating-piggy-icon.inactive {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          opacity: 0.7;
        }

        .piggy-icon-svg {
          color: white;
          margin-bottom: 2px;
        }

        .piggy-balance {
          color: white;
          font-size: 10px;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-green {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }

        @media (max-width: 640px) {
          .floating-piggy-icon {
            width: 60px;
            height: 60px;
            bottom: 16px;
            right: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default FloatingPiggyBank;

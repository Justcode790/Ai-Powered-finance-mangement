import React, { useEffect, useState } from 'react';
import { getTransactions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wallet, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';

const CashPosition = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cashData, setCashData] = useState({
    availableCash: 0,
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    bankBalance: 0,
    dailyBurnRate: 0,
    projectedSavings: 0,
    safeToSpend: 0,
    daysLeft: 0,
    dailyLimit: 0,
    riskLevel: 'LOW'
  });

  useEffect(() => {
    if (user) {
      loadCashPosition();
    }
  }, [user]);

  const loadCashPosition = async () => {
    try {
      setLoading(true);
      const transactions = await getTransactions();
      
      const now = new Date();
      const currentDay = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - currentDay;
      
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthTxns = transactions.filter(t => new Date(t.date) >= thisMonthStart);
      
      let thisMonthIncome = 0;
      let thisMonthExpense = 0;
      
      thisMonthTxns.forEach(t => {
        if (t.type === 'income') {
          thisMonthIncome += t.amount;
        } else {
          thisMonthExpense += t.amount;
        }
      });

      const bankBalance = user.bank_balance || 0;
      const availableCash = bankBalance + thisMonthIncome - thisMonthExpense;
      
      // Calculate daily burn rate
      const dailyBurnRate = currentDay > 0 ? thisMonthExpense / currentDay : 0;
      
      // Project remaining expenses
      const projectedRemainingExpenses = dailyBurnRate * daysLeft;
      const projectedSavings = Math.max(0, availableCash - projectedRemainingExpenses);
      
      // Safe to spend (keep 30% buffer)
      const safeToSpend = availableCash * 0.7;
      
      // Daily limit for remaining days
      const dailyLimit = daysLeft > 0 ? availableCash / daysLeft : 0;
      
      // Risk level
      let riskLevel = 'LOW';
      if (availableCash <= 0) {
        riskLevel = 'CRITICAL';
      } else if (availableCash < thisMonthExpense * 0.5) {
        riskLevel = 'HIGH';
      } else if (dailyBurnRate > dailyLimit) {
        riskLevel = 'MEDIUM';
      }

      setCashData({
        availableCash,
        thisMonthIncome,
        thisMonthExpense,
        bankBalance,
        dailyBurnRate,
        projectedSavings,
        safeToSpend,
        daysLeft,
        dailyLimit,
        riskLevel
      });
    } catch (err) {
      console.error('Error loading cash position:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { availableCash, thisMonthIncome, thisMonthExpense, bankBalance, dailyBurnRate, 
          projectedSavings, safeToSpend, daysLeft, dailyLimit, riskLevel } = cashData;

  return (
    <div className="space-y-4">
      {/* Available Cash - Hero Section */}
      <div className={`card ${
        riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-300' :
        riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-300' :
        riskLevel === 'MEDIUM' ? 'bg-yellow-50 border-yellow-300' :
        'bg-green-50 border-green-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">💵 Available Cash Right Now</p>
          {riskLevel !== 'LOW' && (
            <AlertCircle className={
              riskLevel === 'CRITICAL' ? 'text-red-600' :
              riskLevel === 'HIGH' ? 'text-orange-600' : 'text-yellow-600'
            } size={18} />
          )}
        </div>

        <div className="mb-3">
          <p className={`text-3xl font-bold ${
            availableCash > 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            ₹{availableCash.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Bank Balance (₹{bankBalance.toLocaleString()}) + Income (₹{thisMonthIncome.toLocaleString()}) - Expenses (₹{thisMonthExpense.toLocaleString()})
          </p>
        </div>

        {/* Risk Warning */}
        {riskLevel === 'CRITICAL' && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-3">
            <p className="text-xs text-red-700 font-bold">
              🚨 CRITICAL: You're out of cash! Add income urgently or stop spending.
            </p>
          </div>
        )}
        {riskLevel === 'HIGH' && (
          <div className="bg-orange-100 border border-orange-300 rounded-xl p-3">
            <p className="text-xs text-orange-700 font-bold">
              ⚠️ HIGH RISK: Low cash buffer. Reduce spending immediately.
            </p>
          </div>
        )}
        {riskLevel === 'MEDIUM' && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-3">
            <p className="text-xs text-yellow-700 font-bold">
              ⚠️ WARNING: You're spending faster than your daily limit. Slow down!
            </p>
          </div>
        )}
        {riskLevel === 'LOW' && availableCash > 0 && (
          <div className="bg-green-100 border border-green-300 rounded-xl p-3">
            <p className="text-xs text-green-700 font-bold">
              ✅ HEALTHY: You have enough cash buffer. Keep it up!
            </p>
          </div>
        )}
      </div>

      {/* Spending Metrics */}
      <div className="card">
        <p className="text-sm font-bold text-gray-900 mb-4">📈 Spending Analysis</p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-1 font-medium">Daily Burn Rate</p>
            <p className="text-lg font-bold text-gray-900">
              ₹{Math.round(dailyBurnRate).toLocaleString()}/day
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Average spending per day
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-1 font-medium">Safe Daily Limit</p>
            <p className={`text-lg font-bold ${
              dailyBurnRate > dailyLimit ? 'text-red-600' : 'text-green-600'
            }`}>
              ₹{Math.round(dailyLimit).toLocaleString()}/day
            </p>
            <p className="text-xs text-gray-600 mt-1">
              For next {daysLeft} days
            </p>
          </div>
        </div>

        {/* Projected Savings */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-700 font-medium">Projected Month-End Savings</p>
            <p className="text-xl font-bold text-blue-700">
              ₹{Math.round(projectedSavings).toLocaleString()}
            </p>
          </div>
          <div className="relative h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${availableCash > 0 ? Math.min(100, (projectedSavings / availableCash) * 100) : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-700 mt-2">
            Based on your current ₹{Math.round(dailyBurnRate).toLocaleString()}/day spending rate
          </p>
        </div>

        {/* Safe to Spend */}
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">Safe to Spend (70% buffer)</p>
            <p className="text-sm font-bold text-gray-900">
              ₹{Math.round(safeToSpend).toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Keep 30% as emergency buffer
          </p>
        </div>
      </div>

      {/* Action Items */}
      {thisMonthIncome === 0 && bankBalance > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Wallet className="text-yellow-600 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-yellow-700 mb-1">
                No Income This Month Yet
              </p>
              <p className="text-xs text-gray-700">
                You're spending from your ₹{bankBalance.toLocaleString()} savings buffer. Add income transactions when you receive salary or other income to track accurately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashPosition;

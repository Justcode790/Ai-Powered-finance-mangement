import React, { useEffect, useState } from 'react';
import { getTransactions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Wallet, ShoppingBag, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const MoneyOverview = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    thisMonth: { income: 0, expense: 0, net: 0 },
    lastMonth: { income: 0, expense: 0, net: 0 },
    lastIncome: null,
    lastExpense: null
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (txns) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    let thisMonthIncome = 0, thisMonthExpense = 0;
    let lastMonthIncome = 0, lastMonthExpense = 0;
    let lastIncome = null, lastExpense = null;

    txns.forEach(t => {
      const txnDate = new Date(t.date);
      const amount = t.amount;
      // Treat transactions without type field as expenses (backward compatibility)
      const isIncome = t.type === 'income';

      // This month
      if (txnDate >= thisMonthStart) {
        if (isIncome) {
          thisMonthIncome += amount;
          if (!lastIncome || txnDate > new Date(lastIncome.date)) {
            lastIncome = t;
          }
        } else {
          thisMonthExpense += amount;
          if (!lastExpense || txnDate > new Date(lastExpense.date)) {
            lastExpense = t;
          }
        }
      }

      // Last month
      if (txnDate >= lastMonthStart && txnDate <= lastMonthEnd) {
        if (isIncome) {
          lastMonthIncome += amount;
        } else {
          lastMonthExpense += amount;
        }
      }

      // Track last income/expense overall if not found in this month
      if (isIncome && (!lastIncome || txnDate > new Date(lastIncome.date))) {
        lastIncome = t;
      }
      if (!isIncome && (!lastExpense || txnDate > new Date(lastExpense.date))) {
        lastExpense = t;
      }
    });

    // If no income transactions found, use user's profile income as reference
    if (thisMonthIncome === 0 && user?.income) {
      thisMonthIncome = user.income;
    }

    setStats({
      thisMonth: {
        income: thisMonthIncome,
        expense: thisMonthExpense,
        net: thisMonthIncome - thisMonthExpense
      },
      lastMonth: {
        income: lastMonthIncome,
        expense: lastMonthExpense,
        net: lastMonthIncome - lastMonthExpense
      },
      lastIncome,
      lastExpense
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { thisMonth, lastMonth, lastIncome, lastExpense } = stats;
  const incomeChange = lastMonth.income > 0 
    ? ((thisMonth.income - lastMonth.income) / lastMonth.income) * 100 
    : 0;
  const expenseChange = lastMonth.expense > 0 
    ? ((thisMonth.expense - lastMonth.expense) / lastMonth.expense) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Main Money Health Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-900">💰 Money Health - This Month</p>
          <Calendar className="text-gray-400" size={18} />
        </div>

        {/* Helpful tip if no income transactions */}
        {!lastIncome && thisMonth.income > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-700">
              💡 <span className="font-medium">Tip:</span> Add your income transactions (salary, freelance, etc.) to track your actual cash flow. Currently showing your profile income of ₹{user?.income?.toLocaleString()}.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Income */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpCircle className="text-green-600" size={14} />
              <p className="text-xs text-green-700 font-medium">Income</p>
            </div>
            <p className="text-lg font-bold text-green-700">
              ₹{thisMonth.income.toLocaleString()}
            </p>
            {!lastIncome && user?.income && (
              <p className="text-xs mt-1 text-gray-600">
                From profile
              </p>
            )}
            {incomeChange !== 0 && lastIncome && (
              <p className={`text-xs mt-1 ${incomeChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% vs last month
              </p>
            )}
          </div>

          {/* Expense */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownCircle className="text-red-600" size={14} />
              <p className="text-xs text-red-700 font-medium">Expense</p>
            </div>
            <p className="text-lg font-bold text-red-700">
              ₹{thisMonth.expense.toLocaleString()}
            </p>
            {expenseChange !== 0 && (
              <p className={`text-xs mt-1 ${expenseChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% vs last month
              </p>
            )}
          </div>

          {/* Net Savings */}
          <div className={`${thisMonth.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-3`}>
            <div className="flex items-center gap-1 mb-1">
              <Wallet className={thisMonth.net >= 0 ? 'text-blue-600' : 'text-orange-600'} size={14} />
              <p className={`text-xs font-medium ${thisMonth.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                Net
              </p>
            </div>
            <p className={`text-lg font-bold ${thisMonth.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {thisMonth.net >= 0 ? '+' : ''}₹{thisMonth.net.toLocaleString()}
            </p>
            {thisMonth.income > 0 && (
              <p className="text-xs mt-1 text-gray-600">
                {((thisMonth.net / thisMonth.income) * 100).toFixed(1)}% saved
              </p>
            )}
          </div>
        </div>

        {/* Last Transactions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Last Income */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-2 font-medium">Last Income</p>
            {lastIncome ? (
              <>
                <p className="text-sm font-bold text-green-600">
                  +₹{lastIncome.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(lastIncome.date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                  {lastIncome.description && ` • ${lastIncome.description}`}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">No income recorded</p>
            )}
          </div>

          {/* Last Expense */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-2 font-medium">Last Expense</p>
            {lastExpense ? (
              <>
                <p className="text-sm font-bold text-red-600">
                  -₹{lastExpense.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1 capitalize">
                  {new Date(lastExpense.date).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short' 
                  })} • {lastExpense.category}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">No expenses recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Month Comparison */}
      <div className="card">
        <p className="text-sm font-bold text-gray-900 mb-4">📊 This Month vs Last Month</p>
        
        <div className="space-y-3">
          {/* Income Comparison */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-sm text-gray-700 font-medium">Income</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-600">₹{lastMonth.income.toLocaleString()}</p>
              <TrendingUp className={incomeChange >= 0 ? 'text-green-600' : 'text-red-600'} size={14} />
              <p className="text-sm font-bold text-green-700">₹{thisMonth.income.toLocaleString()}</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                incomeChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Expense Comparison */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <p className="text-sm text-gray-700 font-medium">Expenses</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-600">₹{lastMonth.expense.toLocaleString()}</p>
              <TrendingDown className={expenseChange <= 0 ? 'text-green-600' : 'text-red-600'} size={14} />
              <p className="text-sm font-bold text-red-700">₹{thisMonth.expense.toLocaleString()}</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                expenseChange <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Savings Comparison */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <p className="text-sm text-gray-900 font-bold">Net Savings</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-600">₹{lastMonth.net.toLocaleString()}</p>
              {thisMonth.net >= lastMonth.net ? (
                <TrendingUp className="text-green-600" size={14} />
              ) : (
                <TrendingDown className="text-red-600" size={14} />
              )}
              <p className={`text-sm font-bold ${thisMonth.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                ₹{thisMonth.net.toLocaleString()}
              </p>
              {lastMonth.net !== 0 && (
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                  thisMonth.net >= lastMonth.net ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {((thisMonth.net - lastMonth.net) / Math.abs(lastMonth.net) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        {thisMonth.income > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600 font-medium">Savings Rate</p>
              <p className="text-sm font-bold text-blue-700">
                {((thisMonth.net / thisMonth.income) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (thisMonth.net / thisMonth.income) >= 0.20 ? 'bg-green-500' :
                  (thisMonth.net / thisMonth.income) >= 0.10 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (thisMonth.net / thisMonth.income) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(thisMonth.net / thisMonth.income) >= 0.20 
                ? '🎉 Excellent! You\'re saving 20%+ of your income'
                : (thisMonth.net / thisMonth.income) >= 0.10
                ? '👍 Good start! Try to reach 20% savings rate'
                : '⚠️ Low savings rate. Review your expenses'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyOverview;

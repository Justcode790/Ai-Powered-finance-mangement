import React, { useEffect, useState } from 'react';
import { getTransactions, getBudgets } from '../services/api';
import { AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

const CategoryBreakdown = () => {
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([]);
  const [currentBudget, setCurrentBudget] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactions, budgetsData] = await Promise.all([
        getTransactions(),
        getBudgets()
      ]);

      // Get current month budget
      const now = new Date();
      const currentMonthBudget = (budgetsData.budgets || []).find(
        b => b.period.month === now.getMonth() + 1 && b.period.year === now.getFullYear()
      );
      setCurrentBudget(currentMonthBudget);

      // Calculate this month's spending by category
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthTransactions = transactions.filter(
        t => t.type === 'expense' && new Date(t.date) >= thisMonthStart
      );

      const categorySpending = {};
      thisMonthTransactions.forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      });

      // Build category data with budget comparison
      const categories = ['food', 'transport', 'entertainment', 'shopping', 'education', 'rent', 'misc'];
      const data = categories.map(cat => {
        const spent = categorySpending[cat] || 0;
        const budgeted = currentMonthBudget?.categoryAllocations?.[cat] || 0;
        const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
        
        let status = 'good';
        let statusText = 'On Track';
        if (percentage > 100) {
          status = 'critical';
          statusText = 'Over Budget!';
        } else if (percentage > 80) {
          status = 'warning';
          statusText = 'High Usage';
        }

        return {
          category: cat,
          spent,
          budgeted,
          percentage: Math.round(percentage),
          status,
          statusText
        };
      }).sort((a, b) => b.spent - a.spent);

      setCategoryData(data);
    } catch (err) {
      console.error('Error loading category data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalSpent = categoryData.reduce((sum, c) => sum + c.spent, 0);
  const totalBudgeted = categoryData.reduce((sum, c) => sum + c.budgeted, 0);
  const overBudgetCount = categoryData.filter(c => c.status === 'critical').length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-900">📊 Category Breakdown</p>
        {overBudgetCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 font-medium">
            {overBudgetCount} Over Budget
          </span>
        )}
      </div>

      {!currentBudget && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-yellow-700">
            💡 Create a budget for this month to see spending vs budget comparison
          </p>
        </div>
      )}

      <div className="space-y-3">
        {categoryData.map((cat) => (
          <div key={cat.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cat.status === 'critical' && <AlertCircle className="text-red-600" size={14} />}
                {cat.status === 'warning' && <TrendingUp className="text-orange-600" size={14} />}
                {cat.status === 'good' && <CheckCircle className="text-green-600" size={14} />}
                <p className="text-sm text-gray-900 capitalize font-medium">{cat.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  ₹{cat.spent.toLocaleString()}
                </p>
                {cat.budgeted > 0 && (
                  <p className={`text-xs font-medium ${
                    cat.status === 'critical' ? 'text-red-600' :
                    cat.status === 'warning' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {cat.percentage}% of ₹{cat.budgeted.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {cat.budgeted > 0 && (
              <>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      cat.status === 'critical' ? 'bg-red-500' :
                      cat.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-medium ${
                    cat.status === 'critical' ? 'text-red-600' :
                    cat.status === 'warning' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {cat.statusText}
                  </p>
                  {cat.status === 'critical' && (
                    <p className="text-xs text-red-600 font-medium">
                      ₹{(cat.spent - cat.budgeted).toLocaleString()} over
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {currentBudget && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 font-medium">Total This Month</p>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                ₹{totalSpent.toLocaleString()} / ₹{totalBudgeted.toLocaleString()}
              </p>
              <p className={`text-xs font-medium ${
                totalSpent > totalBudgeted ? 'text-red-600' : 'text-green-600'
              }`}>
                {totalBudgeted > 0 ? `${Math.round((totalSpent / totalBudgeted) * 100)}% used` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBreakdown;

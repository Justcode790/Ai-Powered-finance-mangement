import React, { useEffect, useState } from 'react';
import { getTransactions, getBudgets, getGoals, getPiggyBankAutoSuggest, contributeToPiggyBank } from '../services/api';
import { AlertTriangle, TrendingUp, Target, Lightbulb, CheckCircle, PiggyBank } from 'lucide-react';

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [piggyBankSuggestion, setPiggyBankSuggestion] = useState(null);
  const [processingPiggyBank, setProcessingPiggyBank] = useState(false);

  useEffect(() => {
    loadAlerts();
    checkPiggyBankSuggestion();
  }, []);

  const checkPiggyBankSuggestion = async () => {
    try {
      const now = new Date();
      const currentDay = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      // Only check during last 3 days of month
      if (currentDay >= daysInMonth - 2) {
        const suggestion = await getPiggyBankAutoSuggest();
        if (suggestion.shouldSuggest) {
          setPiggyBankSuggestion(suggestion);
        } else if (suggestion.reason) {
          // Show why user is not eligible
          setPiggyBankSuggestion({
            shouldSuggest: false,
            reason: suggestion.reason,
            details: suggestion.details
          });
        }
      }
    } catch (err) {
      console.error('Error checking piggy bank suggestion:', err);
    }
  };

  const handleAddToPiggyBank = async () => {
    try {
      setProcessingPiggyBank(true);
      await contributeToPiggyBank({ 
        amount: piggyBankSuggestion.suggestedAmount, 
        source: 'auto_suggest' 
      });
      setPiggyBankSuggestion(null);
      window.location.reload();
    } catch (err) {
      console.error('Error adding to piggy bank:', err);
      alert('Failed to add to piggy bank. Please try again.');
    } finally {
      setProcessingPiggyBank(false);
    }
  };

  const handleSkipPiggyBank = () => {
    setPiggyBankSuggestion(null);
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const [transactions, budgetsData, goalsData] = await Promise.all([
        getTransactions(),
        getBudgets(),
        getGoals()
      ]);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthTransactions = transactions.filter(t => new Date(t.date) >= thisMonthStart);
      
      const currentBudget = (budgetsData.budgets || []).find(
        b => b.period.month === now.getMonth() + 1 && b.period.year === now.getFullYear()
      );

      const activeGoals = (goalsData.goals || []).filter(g => g.status === 'active');

      const generatedAlerts = [];

      // Check budget overspending
      if (currentBudget) {
        const categorySpending = {};
        thisMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
          categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
        });

        Object.entries(categorySpending).forEach(([cat, spent]) => {
          const budgeted = currentBudget.categoryAllocations[cat] || 0;
          if (spent > budgeted && budgeted > 0) {
            const overspend = spent - budgeted;
            const percentage = ((spent / budgeted) * 100).toFixed(0);
            generatedAlerts.push({
              type: 'critical',
              icon: AlertTriangle,
              title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Overspent`,
              message: `You've spent ₹${spent.toLocaleString()} (${percentage}% of budget). That's ₹${overspend.toLocaleString()} over your ₹${budgeted.toLocaleString()} budget.`,
              suggestion: `Try to reduce ${cat} spending by ₹${Math.ceil(overspend / 7).toLocaleString()}/day for the rest of the month.`
            });
          } else if (spent > budgeted * 0.8 && budgeted > 0) {
            generatedAlerts.push({
              type: 'warning',
              icon: TrendingUp,
              title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} High Usage`,
              message: `You've used ${((spent / budgeted) * 100).toFixed(0)}% of your ${cat} budget (₹${spent.toLocaleString()}/₹${budgeted.toLocaleString()}).`,
              suggestion: `You have ₹${(budgeted - spent).toLocaleString()} left for ${cat} this month.`
            });
          }
        });
      }

      // Check goal progress
      activeGoals.forEach(goal => {
        const remaining = goal.targetAmount - goal.currentAmount;
        const deadline = new Date(goal.deadline);
        const daysRemaining = Math.ceil((deadline - now) / (24 * 60 * 60 * 1000));
        const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
        const requiredMonthly = remaining / monthsRemaining;

        if (daysRemaining < 30 && remaining > 0) {
          generatedAlerts.push({
            type: 'info',
            icon: Target,
            title: `Goal Deadline Approaching: ${goal.name}`,
            message: `Only ${daysRemaining} days left! You need ₹${remaining.toLocaleString()} more to reach your ₹${goal.targetAmount.toLocaleString()} goal.`,
            suggestion: `Save ₹${Math.ceil(remaining / daysRemaining).toLocaleString()}/day to reach your goal on time.`
          });
        }
      });

      // Spending trend alerts
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const lastMonthTransactions = transactions.filter(
        t => t.type === 'expense' && new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd
      );

      const thisMonthTotal = thisMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

      if (lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal * 1.2) {
        const increase = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(0);
        generatedAlerts.push({
          type: 'warning',
          icon: TrendingUp,
          title: 'Spending Increased',
          message: `Your spending is up ${increase}% compared to last month (₹${thisMonthTotal.toLocaleString()} vs ₹${lastMonthTotal.toLocaleString()}).`,
          suggestion: 'Review your recent transactions to identify unnecessary expenses.'
        });
      }

      // Sort: critical first, then warning, then info
      const sortOrder = { critical: 0, warning: 1, info: 2 };
      generatedAlerts.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);

      setAlerts(generatedAlerts.slice(0, 5)); // Show top 5 alerts
    } catch (err) {
      console.error('Error generating alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {/* Piggy Bank Auto-Suggest (Month-End Only) */}
      {piggyBankSuggestion && piggyBankSuggestion.shouldSuggest && (
        <div className="card bg-gradient-to-r from-pink-50 to-purple-50 border-pink-300">
          <div className="flex items-start gap-3">
            <PiggyBank className="text-pink-600 mt-0.5" size={24} />
            <div className="flex-1">
              <p className="text-sm font-bold text-pink-700 mb-1">
                🐷 Month-End Piggy Bank Time!
              </p>
              <p className="text-xs text-gray-700 mb-3">
                {piggyBankSuggestion.message}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToPiggyBank}
                  disabled={processingPiggyBank}
                  className="rounded-xl bg-pink-600 text-white text-xs font-semibold px-4 py-2 hover:bg-pink-700 disabled:opacity-50"
                >
                  {processingPiggyBank ? 'Adding...' : '🐷 Add to Piggy Bank'}
                </button>
                <button
                  onClick={handleSkipPiggyBank}
                  disabled={processingPiggyBank}
                  className="rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2 hover:bg-gray-200"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Piggy Bank Not Eligible Message */}
      {piggyBankSuggestion && !piggyBankSuggestion.shouldSuggest && (
        <div className="card bg-yellow-50 border-yellow-300">
          <div className="flex items-start gap-3">
            <PiggyBank className="text-yellow-600 mt-0.5" size={24} />
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-700 mb-1">
                🐷 Piggy Bank Not Available Yet
              </p>
              <p className="text-xs text-gray-700 mb-2">
                {piggyBankSuggestion.reason === 'Savings goal not met' && (
                  <>
                    Hit your savings goal first! You need ₹{piggyBankSuggestion.details?.needed?.toLocaleString()} more in savings before Piggy Bank opens. 🛡️
                  </>
                )}
                {piggyBankSuggestion.reason === 'Categories overspent' && (
                  <>
                    Some categories are overspent. Stay within budget to unlock Piggy Bank! 📊
                  </>
                )}
                {piggyBankSuggestion.reason === 'Leftover amount too small' && (
                  <>
                    Leftover amount is too small (less than ₹100). Keep managing your budget well! 💪
                  </>
                )}
                {piggyBankSuggestion.reason === 'No budget set for this month' && (
                  <>
                    Set up your monthly budget first to unlock Piggy Bank suggestions. 📝
                  </>
                )}
              </p>
              <button
                onClick={handleSkipPiggyBank}
                className="rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 hover:bg-gray-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Alerts */}
      {alerts.length === 0 && !piggyBankSuggestion && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="text-sm font-bold text-green-700">All Good! 🎉</p>
              <p className="text-xs text-green-600">
                You're managing your money well. Keep it up!
              </p>
            </div>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-amber-600" size={20} />
            <p className="text-sm font-bold text-gray-900">🚨 Smart Alerts & Suggestions</p>
          </div>

          <div className="space-y-3">
            {alerts.map((alert, idx) => {
              const Icon = alert.icon;
              const bgColor = alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                             alert.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                             'bg-blue-50 border-blue-200';
              const iconColor = alert.type === 'critical' ? 'text-red-600' :
                               alert.type === 'warning' ? 'text-orange-600' :
                               'text-blue-600';
              const textColor = alert.type === 'critical' ? 'text-red-700' :
                               alert.type === 'warning' ? 'text-orange-700' :
                               'text-blue-700';

              return (
                <div key={idx} className={`${bgColor} border rounded-xl p-3`}>
                  <div className="flex items-start gap-3">
                    <Icon className={iconColor} size={18} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${textColor} mb-1`}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-700 mb-2">
                        {alert.message}
                      </p>
                      <div className="bg-white/50 rounded-lg p-2">
                        <p className="text-xs text-gray-700">
                          💡 <span className="font-medium">Suggestion:</span> {alert.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default SmartAlerts;

import React, { useEffect, useState } from 'react';
import { getBudgets, createBudget, updateBudget, getBudgetTemplates, getMLBudgetRecommendation, getTransactions, getGoals } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wallet, Sparkles, Save, Edit2, Target } from 'lucide-react';
import BudgetVariance from '../components/BudgetVariance';
import BudgetTemplateSelector from '../components/BudgetTemplateSelector';
import AffordabilityChecker from '../components/AffordabilityChecker';

const BudgetManager = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [allocations, setAllocations] = useState({
    rent: 0,
    food: 0,
    transport: 0,
    entertainment: 0,
    shopping: 0,
    education: 0,
    misc: 0,
    savings: 0
  });
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [activeGoals, setActiveGoals] = useState([]);

  const categories = ['rent', 'food', 'transport', 'entertainment', 'shopping', 'education', 'misc', 'savings'];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      // Load budgets and goals in parallel for faster loading
      const [budgetsData, goalsData] = await Promise.all([
        getBudgets(),
        getGoals()
      ]);
      
      setBudgets(budgetsData.budgets || []);
      if (budgetsData.budgets && budgetsData.budgets.length > 0) {
        setCurrentBudget(budgetsData.budgets[0]);
      }
      
      setActiveGoals((goalsData.goals || []).filter(g => g.status === 'active'));
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadActiveGoals = async () => {
    try {
      const data = await getGoals();
      setActiveGoals((data.goals || []).filter(g => g.status === 'active'));
    } catch (err) {
      console.error('Error loading goals:', err);
    }
  };

  const loadBudgets = async () => {
    try {
      const data = await getBudgets();
      setBudgets(data.budgets || []);
      if (data.budgets && data.budgets.length > 0) {
        setCurrentBudget(data.budgets[0]);
      }
    } catch (err) {
      console.error('Error loading budgets:', err);
    }
  };

  const handleAIRecommendation = async () => {
    try {
      setLoading(true);
      const transactions = await getTransactions();
      const goals = await getGoals();

      const formattedTransactions = transactions.map(t => ({
        transactionId: t._id,
        category: t.category,
        amount: t.amount,
        date: new Date(t.date).toISOString()
      }));

      const formattedGoals = (goals.goals || []).filter(g => g.status === 'active').map(g => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: new Date(g.deadline).toISOString()
      }));

      const recommendation = await getMLBudgetRecommendation({
        userId: user._id || user.id,
        income: user.income || 0,
        transactions: formattedTransactions,
        goals: formattedGoals,
        financial_literacy_score: user.financial_literacy_score || 5,
        saving_habit_score: user.saving_habit_score || 5
      });

      if (recommendation.allocations) {
        setAllocations(recommendation.allocations);
        setAiRecommendation(recommendation);
      }
    } catch (err) {
      console.error('Error getting AI recommendation:', err);
      alert('AI recommendation service is currently unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    const income = user.income || 0;
    const newAllocations = {};
    
    Object.keys(template.categoryPercentages).forEach(category => {
      newAllocations[category] = Math.round((template.categoryPercentages[category] / 100) * income);
    });
    
    setAllocations(newAllocations);
    setSelectedTemplate(template);
  };

  const handleAllocationChange = (category, value) => {
    setAllocations({
      ...allocations,
      [category]: parseFloat(value) || 0
    });
  };

  const handleCreateBudget = async () => {
    try {
      setLoading(true);
      
      const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
      const income = user.income || 0;
      
      if (total > income) {
        alert(`Total budget (₹${total}) exceeds your income (₹${income})`);
        return;
      }

      const budgetData = {
        period,
        categoryAllocations: allocations,
        aiAssisted: useAI,
        templateId: selectedTemplate?._id
      };

      await createBudget(budgetData);
      await loadBudgets();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      console.error('Error creating budget:', err);
      alert(err.response?.data?.message || 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAllocations({
      rent: 0,
      food: 0,
      transport: 0,
      entertainment: 0,
      shopping: 0,
      education: 0,
      misc: 0,
      savings: 0
    });
    setUseAI(false);
    setUseTemplate(false);
    setSelectedTemplate(null);
    setAiRecommendation(null);
  };

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const income = user?.income || 0;
  const remaining = income - totalAllocated;

  if (!user || initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budget manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            Budget Manager
          </h2>
          <p className="text-xs md:text-sm text-gray-600">
            Create and manage your monthly budgets with AI assistance.
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700"
          >
            Create Budget
          </button>
        )}
      </div>

      {/* Current Budget Overview */}
      {currentBudget && !showCreateForm && (
        <>
          <BudgetVariance budgetId={currentBudget._id} />
          
          {/* Affordability Checker */}
          <AffordabilityChecker
            income={user.income || 0}
            bankBalance={user.bank_balance || 0}
            currentMonthExpenses={0}
            savingsGoal={currentBudget.categoryAllocations.savings || 0}
            budgetAllocations={currentBudget.categoryAllocations}
          />
        </>
      )}

      {/* Create Budget Form */}
      {showCreateForm && (
        <div className="card space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Create New Budget</p>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-2 block font-medium">Month</label>
              <select
                value={period.month}
                onChange={(e) => setPeriod({ ...period, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-2 block font-medium">Year</label>
              <select
                value={period.year}
                onChange={(e) => setPeriod({ ...period, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget Creation Options */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setUseAI(!useAI);
                setUseTemplate(false);
                if (!useAI) handleAIRecommendation();
              }}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-300 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="text-blue-600" size={20} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">AI-Assisted Budget</p>
                  <p className="text-xs text-gray-600">Get personalized recommendations</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useAI}
                readOnly
                className="h-5 w-5"
              />
            </button>

            <button
              onClick={() => {
                setUseTemplate(!useTemplate);
                setUseAI(false);
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-300 rounded-xl hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <Wallet className="text-green-600" size={20} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Use Template</p>
                  <p className="text-xs text-gray-600">Start from a preset budget</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useTemplate}
                readOnly
                className="h-5 w-5"
              />
            </button>
          </div>

          {/* Template Selector */}
          {useTemplate && (
            <BudgetTemplateSelector onSelect={handleTemplateSelect} />
          )}

          {/* AI Recommendation Display */}
          {aiRecommendation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-3">AI Recommendations</p>
              <div className="space-y-2 text-xs">
                {Object.entries(aiRecommendation.rationale || {}).map(([cat, text]) => (
                  <p key={cat} className="text-gray-700">{text}</p>
                ))}
              </div>
            </div>
          )}

          {/* Active Goals Display */}
          {activeGoals.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="text-green-600" size={16} />
                <p className="text-xs font-semibold text-green-700">Active Financial Goals</p>
              </div>
              <div className="space-y-2">
                {activeGoals.map((goal) => {
                  const remaining = goal.targetAmount - goal.currentAmount;
                  const deadline = new Date(goal.deadline);
                  const monthsRemaining = Math.max(0, Math.ceil((deadline - new Date()) / (30 * 24 * 60 * 60 * 1000)));
                  const requiredMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
                  
                  return (
                    <div key={goal._id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{goal.name}</span>
                      <span className="text-green-700 font-medium">
                        ₹{Math.round(requiredMonthly).toLocaleString()}/mo
                      </span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-green-200 flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-700">Total Required</span>
                  <span className="text-green-700">
                    ₹{Math.round(activeGoals.reduce((sum, g) => {
                      const remaining = g.targetAmount - g.currentAmount;
                      const deadline = new Date(g.deadline);
                      const monthsRemaining = Math.max(0, Math.ceil((deadline - new Date()) / (30 * 24 * 60 * 60 * 1000)));
                      return sum + (monthsRemaining > 0 ? remaining / monthsRemaining : remaining);
                    }, 0)).toLocaleString()}/mo
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Your budget savings allocation should cover these goal requirements.
              </p>
            </div>
          )}

          {/* Category Allocations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Category Allocations</p>
              <div className="text-right">
                <p className="text-xs text-gray-600">Income: ₹{income.toLocaleString()}</p>
                <p className={`text-xs font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Remaining: ₹{remaining.toLocaleString()}
                </p>
              </div>
            </div>

            {categories.map(category => (
              <div key={category} className="flex items-center gap-3">
                <label className="text-sm text-gray-700 capitalize w-32">{category}</label>
                <input
                  type="number"
                  value={allocations[category]}
                  onChange={(e) => handleAllocationChange(category, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
                <span className="text-xs text-gray-600 w-16 text-right">
                  {income > 0 ? `${((allocations[category] / income) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateBudget}
            disabled={loading || remaining < 0}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {loading ? 'Creating...' : 'Create Budget'}
          </button>
        </div>
      )}

      {/* Budget List */}
      {!showCreateForm && budgets.length > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-gray-900 mb-4">Your Budgets</p>
          <div className="space-y-3">
            {budgets.map(budget => (
              <div
                key={budget._id}
                onClick={() => setCurrentBudget(budget)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  currentBudget?._id === budget._id
                    ? 'bg-blue-50 border-blue-300 shadow-md'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(budget.period.year, budget.period.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-600">
                      Total: ₹{budget.totalBudget.toLocaleString()}
                    </p>
                  </div>
                  {budget.aiAssisted && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
                      AI
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;

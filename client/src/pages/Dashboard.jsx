import React, { useEffect, useState } from 'react';
import { getTransactions, getPrediction, getRecommendations, getInsights, getGoals } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import SpendingPieChart from '../components/SpendingPieChart';
import BudgetHealthIndicator from '../components/BudgetHealthIndicator';
import ProfileForm from '../components/ProfileForm';
import SpendingInsights from '../components/SpendingInsights';
import SpendingForecast from '../components/SpendingForecast';
import PeerComparison from '../components/PeerComparison';
import GoalCard from '../components/GoalCard';
import ContextualTip from '../components/ContextualTip';
import CashPosition from '../components/CashPosition';
import TransactionForm from '../components/TransactionForm';
import CategoryBreakdown from '../components/CategoryBreakdown';
import SmartAlerts from '../components/SmartAlerts';
import PiggyBankCard from '../components/PiggyBankCard';
import FloatingPiggyBank from '../components/FloatingPiggyBank';
import FinancialChatbot from '../components/FinancialChatbot';
import { Lightbulb, Target, TrendingUp, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState(null);
  const [contextualTip, setContextualTip] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransactionCreated = () => {
    loadTransactions();
  };

  const loadPrediction = async () => {
    try {
      setLoadingPrediction(true);
      const data = await getPrediction();
      setPrediction(data);
      
      // Show contextual tip after prediction
      if (data.contextualTip) {
        setContextualTip(data.contextualTip);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const data = await getRecommendations();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error loading goals:', err);
    }
  };

  const loadInsights = async () => {
    try {
      const data = await getInsights();
      setInsights(data);
    } catch (err) {
      console.error('Error loading insights:', err);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadRecommendations();
    loadGoals();
    loadInsights();
  }, []);

  const handlePredict = async () => {
    await loadPrediction();
  };

  const handleGoalUpdate = () => {
    loadGoals();
  };

  const spendingByCategory = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const pieData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value }));
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
          Smart Financial Dashboard
        </h2>
        <p className="text-xs md:text-sm text-gray-600">
          Track your spending, predict your savings, and learn better money habits.
        </p>
      </div>

      {/* Contextual Tip */}
      {contextualTip && (
        <ContextualTip
          tip={contextualTip}
          onDismiss={() => setContextualTip(null)}
        />
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'insights'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="inline mr-1" size={14} />
          Insights
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'goals'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="inline mr-1" size={14} />
          Goals
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="inline mr-1" size={14} />
          Learn
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Cash Position - Realistic Money Tracking */}
          <CashPosition />

          {/* Piggy Bank Emergency Fund */}
          {/* <PiggyBankCard /> */}

          {/* Smart Alerts */}
          <SmartAlerts />

          {/* Quick Transaction Entry + Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TransactionForm onCreated={handleTransactionCreated} compact={true} />
            <CategoryBreakdown />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileForm />
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">Savings prediction</p>
                <button
                  onClick={handlePredict}
                  disabled={loadingPrediction}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-500 text-white text-xs font-semibold px-4 py-2 hover:bg-blue-600 disabled:opacity-60"
                >
                  {loadingPrediction ? 'Predicting...' : 'Predict Savings'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="text-[10px] text-gray-600">Income</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{Number(prediction?.income || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="text-[10px] text-gray-600">Total Expenses</p>
                  <p className="text-sm font-semibold text-rose-600">
                    ₹{Number(prediction?.total_expenses ?? totalExpenses).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="text-[10px] text-gray-600">Predicted Savings</p>
                  <p className="text-sm font-semibold text-green-600">
                    ₹{Number(prediction?.predicted_savings || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              {prediction?.confidence_interval && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700 mb-1">Confidence Interval (90%)</p>
                  <p className="text-xs text-gray-700">
                    ₹{Math.round(prediction.confidence_interval.lower).toLocaleString()} - 
                    ₹{Math.round(prediction.confidence_interval.upper).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PredictionCard prediction={prediction} loading={loadingPrediction} />
            <BudgetHealthIndicator prediction={prediction} />
            <div className="card space-y-3">
              <p className="text-xs text-gray-600">Spending insight</p>
              {prediction?.top_spending_category ? (
                <>
                  <p className="text-sm text-gray-700">
                    Your highest spending category is:{' '}
                    <span className="font-semibold capitalize text-gray-900">
                      {prediction.top_spending_category}
                    </span>
                    .
                  </p>
                  <p className="text-xs text-gray-500">
                    Use this insight to decide where to cut back first. Even small reductions in your
                    top category can significantly increase savings.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Once you add some expenses and run a prediction, you&apos;ll see which category is
                  eating the biggest share of your budget.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpendingPieChart data={pieData} />
            <div className="card">
              <p className="text-xs text-gray-700 mb-3 font-medium">Recent transactions</p>
              <div className="space-y-2 max-h-64 overflow-y-auto text-xs md:text-sm">
                {transactions.slice(0, 8).map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-gray-900 capitalize font-medium">
                        {t.category === 'emergency_fund_deposit' || t.category === 'emergency_fund_withdrawal' ? '🐷 ' :
                         t.type === 'income' ? '💰 ' : '🛒 '}
                        {t.description || t.category}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(t.date).toLocaleDateString()} • {t.category}
                      </p>
                    </div>
                    <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
                {!transactions.length && (
                  <p className="text-gray-600">
                    No transactions yet. Add your first transaction above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <SpendingInsights />
          </div>
          <div className="space-y-6">
            <SpendingForecast />
            <PeerComparison />
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div>
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalCard key={goal._id} goal={goal} onUpdate={handleGoalUpdate} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Target className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-sm text-gray-600 mb-2">No financial goals yet</p>
              <p className="text-xs text-gray-500">
                Visit the Goal Tracker to create your first goal
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="text-amber-600" size={20} />
                  <p className="text-sm font-semibold text-gray-900">Personalized for You</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((item) => (
                    <div
                      key={item._id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 capitalize">
                          {item.difficulty || item.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {item.content || item.description}
                      </p>
                      {item.readingTimeMinutes && (
                        <p className="text-xs text-gray-500 mt-2">
                          {item.readingTimeMinutes} min read
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-sm text-gray-600 mb-2">No recommendations available</p>
              <p className="text-xs text-gray-500">
                Add more transactions to get personalized content suggestions
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating Piggy Bank Icon */}
      <FloatingPiggyBank />

      {/* Financial Chatbot */}
      <FinancialChatbot />
    </div>
  );
};

export default Dashboard;


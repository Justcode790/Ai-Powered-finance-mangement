import React, { useEffect, useState } from 'react';
import { getGoals, createGoal } from '../services/api';
import { Target, Plus, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import GoalCard from '../components/GoalCard';

const GoalTracker = () => {
  const [goals, setGoals] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error loading goals:', err);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.targetAmount || !formData.deadline) {
      alert('Please fill in all fields');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (targetAmount <= 0) {
      alert('Target amount must be greater than 0');
      return;
    }

    const deadline = new Date(formData.deadline);
    if (deadline <= new Date()) {
      alert('Deadline must be in the future');
      return;
    }

    try {
      setLoading(true);
      await createGoal({
        name: formData.name.trim(),
        targetAmount,
        deadline: deadline.toISOString()
      });
      
      setFormData({ name: '', targetAmount: '', deadline: '' });
      setShowCreateForm(false);
      await loadGoals();
    } catch (err) {
      console.error('Error creating goal:', err);
      alert('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            Financial Goals
          </h2>
          <p className="text-xs md:text-sm text-gray-600">
            Set and track your savings goals to achieve your financial dreams.
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            New Goal
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-blue-600" size={20} />
            <p className="text-xs text-gray-600">Active Goals</p>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{activeGoals.length}</p>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-green-600" size={20} />
            <p className="text-xs text-gray-600">Total Target</p>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            ₹{activeGoals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
          </p>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <p className="text-2xl font-semibold text-green-600">{completedGoals.length}</p>
        </div>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Create New Goal</p>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ name: '', targetAmount: '', deadline: '' });
              }}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="text-xs text-gray-600 mb-2 block font-medium">Goal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Emergency Fund, Vacation, New Laptop"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-2 block font-medium">Target Amount (₹)</label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="50000"
                min="1"
                step="100"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-2 block font-medium">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </form>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-200">Active Goals</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard key={goal._id} goal={goal} onUpdate={loadGoals} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-200">Completed Goals</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard key={goal._id} goal={goal} onUpdate={loadGoals} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && !showCreateForm && (
        <div className="card text-center py-12">
          <Target className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-sm text-gray-600 mb-4">No financial goals yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default GoalTracker;

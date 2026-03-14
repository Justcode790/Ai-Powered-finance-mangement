import React, { useState } from 'react';
import { updateGoal, deleteGoal } from '../services/api';
import { Target, Calendar, TrendingUp, Edit2, Trash2, CheckCircle, Save, X } from 'lucide-react';

const GoalCard = ({ goal, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: new Date(goal.deadline).toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  // Calculate progress
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = goal.targetAmount - goal.currentAmount;
  
  // Calculate months until deadline
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const monthsRemaining = Math.max(0, Math.ceil((deadline - now) / (30 * 24 * 60 * 60 * 1000)));
  
  // Calculate required monthly savings
  const requiredMonthlySavings = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      const targetAmount = parseFloat(editData.targetAmount);
      const currentAmount = parseFloat(editData.currentAmount);
      
      if (targetAmount <= 0) {
        alert('Target amount must be greater than 0');
        return;
      }
      
      if (currentAmount < 0) {
        alert('Current amount cannot be negative');
        return;
      }

      const newDeadline = new Date(editData.deadline);
      if (newDeadline <= new Date() && goal.status !== 'completed') {
        alert('Deadline must be in the future');
        return;
      }

      await updateGoal(goal._id, {
        name: editData.name.trim(),
        targetAmount,
        currentAmount,
        deadline: newDeadline.toISOString()
      });
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating goal:', err);
      alert('Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${goal.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteGoal(goal._id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Failed to delete goal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: new Date(goal.deadline).toISOString().split('T')[0]
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">Edit Goal</p>
          <button
            onClick={handleCancelEdit}
            className="text-gray-600 hover:text-gray-900"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block font-medium">Goal Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block font-medium">Target Amount (₹)</label>
            <input
              type="number"
              value={editData.targetAmount}
              onChange={(e) => setEditData({ ...editData, targetAmount: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block font-medium">Current Amount (₹)</label>
            <input
              type="number"
              value={editData.currentAmount}
              onChange={(e) => setEditData({ ...editData, currentAmount: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block font-medium">Deadline</label>
            <input
              type="date"
              value={editData.deadline}
              onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${goal.status === 'completed' ? 'bg-green-50 border-green-200' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            goal.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {goal.status === 'completed' ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <Target className="text-blue-600" size={20} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{goal.name}</h3>
            {goal.status === 'completed' && goal.completedAt && (
              <p className="text-xs text-green-600">
                Completed on {new Date(goal.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        {goal.status !== 'completed' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-gray-600 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-600">Progress</p>
          <p className="text-xs font-semibold text-green-600">{Math.min(100, Math.round(progress))}%</p>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      {/* Goal Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-600 mb-1">Target</p>
          <p className="text-sm font-semibold text-gray-900">
            ₹{goal.targetAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-600 mb-1">Current</p>
          <p className="text-sm font-semibold text-green-600">
            ₹{goal.currentAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {goal.status !== 'completed' && (
        <>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Remaining</span>
              <span className="text-gray-900 font-medium">₹{remaining.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Months Left</span>
              <span className="text-gray-900 font-medium">{monthsRemaining}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Required Monthly</span>
              <span className="text-green-600 font-semibold">
                ₹{Math.round(requiredMonthlySavings).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar size={12} />
              <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GoalCard;

import React, { useEffect, useState } from 'react';
import { getBudgetVariance } from '../services/api';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

const BudgetVariance = ({ budgetId }) => {
  const [variances, setVariances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (budgetId) {
      loadVariance();
    }
  }, [budgetId]);

  const loadVariance = async () => {
    try {
      setLoading(true);
      const data = await getBudgetVariance(budgetId);
      setVariances(data.variances || []);
    } catch (err) {
      console.error('Error loading variance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'under':
        return <TrendingDown className="text-green-600" size={16} />;
      case 'on_track':
        return <Minus className="text-yellow-600" size={16} />;
      case 'over':
        return <TrendingUp className="text-orange-600" size={16} />;
      case 'critical':
        return <AlertCircle className="text-red-600" size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'under':
        return 'text-green-600';
      case 'on_track':
        return 'text-yellow-600';
      case 'over':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'under':
        return 'bg-green-500';
      case 'on_track':
        return 'bg-yellow-500';
      case 'over':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-sm text-gray-600">Loading budget variance...</p>
      </div>
    );
  }

  if (variances.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-gray-600">No variance data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="text-sm font-semibold text-gray-900 mb-4">Budget vs Actual Spending</p>
      
      <div className="space-y-4">
        {variances.map((variance) => (
          <div key={variance.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(variance.status)}
                <p className="text-sm text-gray-900 capitalize font-medium">{variance.category}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 font-medium">
                  ₹{variance.actual.toLocaleString()} / ₹{variance.budgeted.toLocaleString()}
                </p>
                <p className={`text-xs font-bold ${getStatusColor(variance.status)}`}>
                  {variance.variance >= 0 ? '+' : ''}₹{variance.variance.toLocaleString()} ({variance.variancePercent}%)
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressBarColor(variance.status)} transition-all duration-500`}
                style={{ width: `${Math.min(100, variance.progressPercent)}%` }}
              />
              {variance.progressPercent > 100 && (
                <div
                  className="absolute top-0 left-0 h-full bg-rose-500/30 animate-pulse"
                  style={{ width: '100%' }}
                />
              )}
            </div>

            {/* Status Label */}
            <div className="flex items-center justify-between">
              <p className={`text-xs ${getStatusColor(variance.status)} capitalize font-medium`}>
                {variance.status.replace('_', ' ')}
              </p>
              <p className="text-xs text-gray-600 font-medium">
                {variance.progressPercent}% used
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1 font-medium">Under Budget</p>
            <p className="text-lg font-bold text-green-600">
              {variances.filter(v => v.status === 'under').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1 font-medium">On Track</p>
            <p className="text-lg font-bold text-yellow-600">
              {variances.filter(v => v.status === 'on_track').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1 font-medium">Over Budget</p>
            <p className="text-lg font-bold text-red-600">
              {variances.filter(v => v.status === 'over' || v.status === 'critical').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetVariance;

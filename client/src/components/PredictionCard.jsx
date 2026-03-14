import React from 'react';
import { Sparkles } from 'lucide-react';

const PredictionCard = ({ prediction, loading }) => {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400">Monthly savings prediction</p>
        </div>
        <div className="h-6 bg-slate-800 rounded w-24 mb-2" />
        <div className="h-4 bg-slate-800 rounded w-40" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400">Monthly savings prediction</p>
          <span className="pill">AI assistant</span>
        </div>
        <p className="text-sm text-slate-400">
          Add your income and expenses in the tracker to get a personalized savings prediction and
          budgeting tips.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Monthly savings prediction</p>
        <span className="pill flex items-center gap-1 bg-emerald-500/10 text-emerald-300">
          <Sparkles size={14} />
          Smart advice
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">Estimated savings</p>
        <p className="text-2xl font-semibold text-slate-50">
          ₹{prediction.predicted_savings?.toLocaleString() ?? '0'}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-1">Financial health score</p>
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-emerald-400">
            {Math.round(prediction.financial_health_score || 0)}/100
          </div>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500"
              style={{ width: `${Math.min(prediction.financial_health_score || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-400">
        <span className="font-semibold text-slate-200">Status:</span>{' '}
        {prediction.financial_health_status || 'N/A'}
      </div>
      <p className="text-sm text-emerald-200/90 leading-relaxed border-t border-slate-800 pt-3">
        {prediction.advice}
      </p>
    </div>
  );
};

export default PredictionCard;


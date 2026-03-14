import React from 'react';
import { Activity } from 'lucide-react';

const BudgetHealthIndicator = ({ prediction }) => {
  const status = prediction?.financial_health_status || 'N/A';
  const score = prediction?.financial_health_score || 0;

  let color = 'text-slate-300';
  let bg = 'bg-slate-800/60';
  if (status === 'Excellent' || status === 'Good') {
    color = 'text-emerald-300';
    bg = 'bg-emerald-500/10';
  } else if (status === 'Average') {
    color = 'text-amber-300';
    bg = 'bg-amber-500/10';
  } else if (status === 'Weak' || status === 'Poor') {
    color = 'text-rose-300';
    bg = 'bg-rose-500/10';
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Budget health</p>
        <Activity size={18} className="text-slate-500" />
      </div>
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg} ${color}`}>
        <span className="h-2 w-2 rounded-full bg-current" />
        <span className="text-xs font-medium">{status}</span>
      </div>
      <p className="text-sm text-slate-400">
        Your current financial health score is{' '}
        <span className="font-semibold text-slate-100">{Math.round(score)}/100</span>. Aim to keep
        this above 70 by controlling non-essential spending and saving consistently.
      </p>
    </div>
  );
};

export default BudgetHealthIndicator;


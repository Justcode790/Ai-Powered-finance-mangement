import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ThumbsUp } from 'lucide-react';
import axios from 'axios';

const ContextualTip = ({ tip, onDismiss, context }) => {
  const [marked, setMarked] = useState(false);

  if (!tip) return null;

  const handleMarkHelpful = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const token = JSON.parse(localStorage.getItem('smartfin_auth'))?.token;
      
      await axios.post(
        `${API_BASE_URL}/education/tips/${tip._id}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMarked(true);
      setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 1500);
    } catch (err) {
      console.error('Error marking tip as helpful:', err);
    }
  };

  const contextColors = {
    transaction: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    budget_exceeded: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
    goal_achieved: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    general: 'from-slate-500/10 to-slate-600/5 border-slate-500/20'
  };

  const contextIcons = {
    transaction: '💡',
    budget_exceeded: '⚠️',
    goal_achieved: '🎉',
    general: '💡'
  };

  const bgClass = contextColors[tip.context] || contextColors.general;
  const icon = contextIcons[tip.context] || contextIcons.general;

  return (
    <div
      className={`relative bg-gradient-to-br ${bgClass} border rounded-xl p-4 shadow-lg animate-slide-in`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Financial Tip
            </p>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed mb-4">{tip.content}</p>
          
          {tip.tags && tip.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {tip.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-lg bg-slate-900/50 text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleMarkHelpful}
            disabled={marked}
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
          >
            <ThumbsUp size={14} />
            {marked ? 'Marked as helpful!' : 'Mark as helpful'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing tip display with session-based rotation
export const useTipRotation = () => {
  const [shownTips, setShownTips] = useState(() => {
    const stored = sessionStorage.getItem('shown_tips');
    return stored ? JSON.parse(stored) : [];
  });

  const shouldShowTip = (tipId) => {
    return !shownTips.includes(tipId);
  };

  const markTipShown = (tipId) => {
    const updated = [...shownTips, tipId];
    setShownTips(updated);
    sessionStorage.setItem('shown_tips', JSON.stringify(updated));
  };

  return { shouldShowTip, markTipShown };
};

export default ContextualTip;

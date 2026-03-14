import React, { useEffect, useState } from 'react';
import { getInsights } from '../services/api';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Repeat, Lightbulb } from 'lucide-react';

const SpendingInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await getInsights();
      setInsights(data);
    } catch (err) {
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="text-red-600" size={16} />;
      case 'decreasing':
        return <TrendingDown className="text-green-600" size={16} />;
      default:
        return <RefreshCw className="text-gray-600" size={16} />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="text-blue-600" size={16} />;
      case 'anomaly':
        return <AlertCircle className="text-orange-600" size={16} />;
      case 'recurring':
        return <Repeat className="text-purple-600" size={16} />;
      default:
        return <Lightbulb className="text-green-600" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-sm text-gray-600">Loading spending insights...</p>
      </div>
    );
  }

  if (!insights || !insights.spendingAnalysis) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-gray-600">No insights available yet</p>
        <p className="text-xs text-gray-500 mt-2">Add more transactions to see spending patterns</p>
      </div>
    );
  }

  const { spendingAnalysis } = insights;
  const { trends = [], anomalies = [], patterns = [], insights: nlInsights = [] } = spendingAnalysis;

  return (
    <div className="space-y-6">
      {/* Natural Language Insights */}
      {nlInsights.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-green-600" size={20} />
            <p className="text-sm font-semibold text-gray-900">Key Insights</p>
          </div>
          <div className="space-y-3">
            {nlInsights.slice(0, 5).map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">{insight.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 capitalize font-medium">
                      {insight.category}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">
                      Impact: {insight.impact.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Trends */}
      {trends.length > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-gray-900 mb-4">Spending Trends (Last 3 Months)</p>
          <div className="space-y-3">
            {trends.map((trend) => (
              <div
                key={trend.category}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  {getTrendIcon(trend.trend)}
                  <span className="text-sm text-gray-900 capitalize font-medium">{trend.category}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${getTrendColor(trend.trend)}`}>
                    {trend.percentageChange >= 0 ? '+' : ''}{trend.percentageChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 capitalize font-medium">{trend.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalous Transactions */}
      {anomalies.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-orange-600" size={20} />
            <p className="text-sm font-semibold text-gray-900">Unusual Expenses</p>
          </div>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly) => (
              <div
                key={anomaly.transactionId}
                className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-sm text-gray-900 capitalize font-medium">{anomaly.category}</p>
                  <p className="text-xs text-gray-600 font-medium">
                    Severity: {anomaly.severity.toFixed(1)}σ
                  </p>
                </div>
                <p className="text-sm font-bold text-orange-600">
                  ₹{anomaly.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring Expenses */}
      {patterns.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="text-purple-600" size={20} />
            <p className="text-sm font-semibold text-gray-900">Recurring Expenses</p>
          </div>
          <div className="space-y-2">
            {patterns.map((pattern, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-sm text-gray-900 capitalize font-medium">{pattern.category}</p>
                  <p className="text-xs text-gray-600 font-medium">
                    {pattern.frequency} • {(pattern.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  ₹{pattern.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.cached && (
        <p className="text-xs text-gray-600 text-center font-medium">
          Insights cached for 24 hours. Refresh to update.
        </p>
      )}
    </div>
  );
};

export default SpendingInsights;

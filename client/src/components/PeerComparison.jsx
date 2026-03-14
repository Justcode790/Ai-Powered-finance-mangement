import { useEffect, useState } from 'react';
import { getInsights } from '../services/api';
import { Users, TrendingUp, AlertCircle, Info } from 'lucide-react';

const PeerComparison = () => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInsights();
      if (data.peerComparison) {
        setComparison(data.peerComparison);
      }
    } catch (err) {
      console.error('Error loading peer comparison:', err);
      setError(err.response?.data?.error || 'Failed to load peer comparison');
    } finally {
      setLoading(false);
    }
  };

  const getPercentileColor = (percentile) => {
    if (percentile >= 75) return 'text-green-600';
    if (percentile >= 50) return 'text-yellow-600';
    if (percentile >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPercentileBarColor = (percentile) => {
    if (percentile >= 75) return 'bg-emerald-500';
    if (percentile >= 50) return 'bg-yellow-500';
    if (percentile >= 25) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const getPercentileLabel = (percentile) => {
    if (percentile >= 75) return 'Excellent';
    if (percentile >= 50) return 'Good';
    if (percentile >= 25) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-sm text-gray-600">Loading peer comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-sm font-semibold text-orange-700">Peer Comparison Unavailable</p>
            <p className="text-xs text-gray-700 mt-1 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="card text-center py-8">
        <Users className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-sm text-gray-600">No peer comparison data available</p>
        <p className="text-xs text-gray-500 mt-2">
          Need more users in your age and income group
        </p>
      </div>
    );
  }

  const { savingsRatePercentile, categoryPercentiles, peerGroupSize } = comparison;

  return (
    <div className="space-y-6">
      {/* Context Message */}
      <div className="card bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-sm font-medium text-blue-400">About Peer Comparisons</p>
            <p className="text-xs text-slate-300 mt-1">
              Comparisons are guidelines, not targets. Your financial journey is unique. 
              These insights are based on {peerGroupSize} users in your age and income group.
            </p>
          </div>
        </div>
      </div>

      {/* Savings Rate Percentile */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-emerald-400" size={20} />
          <p className="text-sm font-semibold text-slate-200">Savings Rate</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Your Percentile</p>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getPercentileColor(savingsRatePercentile)}`}>
                {Math.round(savingsRatePercentile)}
              </p>
              <p className={`text-xs ${getPercentileColor(savingsRatePercentile)}`}>
                {getPercentileLabel(savingsRatePercentile)}
              </p>
            </div>
          </div>

          {/* Percentile Bar */}
          <div className="relative h-3 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full ${getPercentileBarColor(savingsRatePercentile)} transition-all duration-500`}
              style={{ width: `${savingsRatePercentile}%` }}
            />
          </div>

          <p className="text-xs text-slate-400">
            You save more than {Math.round(savingsRatePercentile)}% of peers in your group
          </p>
        </div>
      </div>

      {/* Category Spending Percentiles */}
      <div className="card">
        <p className="text-sm font-semibold text-slate-200 mb-4">Spending by Category</p>
        <div className="space-y-4">
          {Object.entries(categoryPercentiles).map(([category, percentile]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-200 capitalize">{category}</p>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${getPercentileColor(100 - percentile)}`}>
                    {Math.round(percentile)}th
                  </p>
                  <p className="text-xs text-slate-500">percentile</p>
                </div>
              </div>

              {/* Percentile Gauge */}
              <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getPercentileBarColor(100 - percentile)} transition-all duration-500`}
                  style={{ width: `${percentile}%` }}
                />
              </div>

              <p className="text-xs text-slate-400">
                {percentile < 50 
                  ? `You spend less than ${Math.round(percentile)}% of peers`
                  : `You spend more than ${Math.round(100 - percentile)}% of peers`
                }
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <p className="text-xs text-slate-500 text-center">
        All peer data is anonymized and aggregated for privacy
      </p>
    </div>
  );
};

export default PeerComparison;

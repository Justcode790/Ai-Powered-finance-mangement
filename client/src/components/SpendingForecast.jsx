import React, { useEffect, useState } from 'react';
import { getInsights } from '../services/api';
import { Calendar, AlertTriangle, TrendingUp, Target } from 'lucide-react';

const SpendingForecast = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const data = await getInsights();
      if (data.spendingForecast) {
        setForecast(data.spendingForecast);
      }
    } catch (err) {
      console.error('Error loading forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-sm text-gray-600">Loading spending forecast...</p>
      </div>
    );
  }

  if (!forecast || !forecast.forecasts) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-gray-600">No forecast available</p>
        <p className="text-xs text-gray-500 mt-2">Need at least 3 months of transaction history</p>
      </div>
    );
  }

  const { forecasts, totalExpected, requiredSavings, warning } = forecast;
  const categories = Object.keys(forecasts);

  return (
    <div className="space-y-6">
      {/* Forecast Summary */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-green-600" size={20} />
          <p className="text-sm font-semibold text-gray-900">Next Month Forecast</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-1 font-medium">Expected Spending</p>
            <p className="text-lg font-bold text-gray-900">
              ₹{totalExpected.toLocaleString()}
            </p>
          </div>
          {requiredSavings > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-600 mb-1 font-medium">Goal Savings</p>
              <p className="text-lg font-bold text-green-600">
                ₹{requiredSavings.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {warning && (
          <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-semibold text-orange-700">Budget Warning</p>
              <p className="text-xs text-gray-700 mt-1 font-medium">{warning}</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Forecasts */}
      <div className="card">
        <p className="text-sm font-semibold text-gray-900 mb-4">Category Forecasts</p>
        <div className="space-y-4">
          {categories.map((category) => {
            const { min, expected, max } = forecasts[category];
            const range = max - min;
            const minPercent = range > 0 ? 0 : 50;
            const expectedPercent = range > 0 ? ((expected - min) / range) * 100 : 50;
            const maxPercent = 100;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-900 capitalize font-medium">{category}</p>
                  <p className="text-sm font-bold text-green-600">
                    ₹{expected.toLocaleString()}
                  </p>
                </div>

                {/* Forecast Range Visualization */}
                <div className="relative h-8 bg-gray-200 rounded-xl overflow-hidden">
                  {/* Range bar */}
                  <div
                    className="absolute h-full bg-gray-300"
                    style={{
                      left: '0%',
                      right: '0%'
                    }}
                  />
                  
                  {/* Expected value marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-green-600 rounded-full"
                    style={{
                      left: `${expectedPercent}%`
                    }}
                  />

                  {/* Labels */}
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                    <span className="text-gray-700 font-medium">₹{min.toLocaleString()}</span>
                    <span className="text-gray-700 font-medium">₹{max.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span>Min: ₹{min.toLocaleString()}</span>
                  <span>Expected: ₹{expected.toLocaleString()}</span>
                  <span>Max: ₹{max.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals Impact */}
      {requiredSavings > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-blue-600" size={16} />
            <p className="text-sm font-semibold text-blue-700">Goals Impact</p>
          </div>
          <p className="text-xs text-gray-700 font-medium">
            Your active financial goals require ₹{requiredSavings.toLocaleString()} in monthly savings. 
            This has been factored into your forecast.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center font-medium">
        Forecasts are based on your spending patterns over the past 3 months
      </p>
    </div>
  );
};

export default SpendingForecast;

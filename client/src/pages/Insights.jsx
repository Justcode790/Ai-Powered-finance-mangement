import React, { useEffect, useState } from 'react';
import { getTransactions, getPrediction } from '../services/api';
import InsightsCharts from '../components/InsightsCharts';

const Insights = () => {
  const [transactions, setTransactions] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const load = async () => {
    try {
      const [tx, pred] = await Promise.all([getTransactions(), getPrediction()]);
      setTransactions(tx);
      setPrediction(pred);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const byCategory = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const savingsHistory = []; // placeholder for future historical predictions

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">Insights</h2>
        <p className="text-xs md:text-sm text-gray-600">
          Understand your spending patterns and how they impact your savings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-600 mb-2 font-medium">Total spent this period</p>
          <p className="text-2xl font-bold text-red-600">₹{totalSpent.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-600 mb-2 font-medium">Predicted monthly savings</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{(prediction?.predicted_savings || 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-600 mb-2 font-medium">Top spending category</p>
          <p className="text-lg font-bold text-gray-900 capitalize">
            {Object.keys(byCategory).length
              ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][0]
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightsCharts savingsHistory={savingsHistory} />
        <div className="card space-y-3 text-sm">
          <p className="text-xs text-gray-700 font-medium">Spending habits analysis</p>
          <p className="text-gray-700 font-medium">
            Based on your current expenses, the assistant estimates how much you can save and which
            categories take the biggest share of your budget. Focus on reducing non-essential
            categories like entertainment and shopping first.
          </p>
          {prediction?.suggested_budget && (
            <>
              <p className="text-xs text-gray-700 mt-2 font-medium">Suggested monthly budget (₹)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(prediction.suggested_budget).map(([cat, val]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <span className="capitalize text-gray-700 font-medium">{cat}</span>
                    <span className="text-gray-900 font-bold">₹{val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;


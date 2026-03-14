import React, { useState } from 'react';
import PredictionForm from '../components/PredictionForm';

export default function SmartFinanceAssistant() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-4xl font-bold">Smart Financial Literacy Assistant</h1>
        <p className="text-slate-400 mt-2">Predict your monthly savings using AI.</p>

        <div className="mt-8">
          <PredictionForm onPredicted={setResult} />
        </div>

        {result?.predicted_savings !== undefined && (
          <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs text-slate-400">Predicted Monthly Savings</p>
            <p className="text-3xl font-semibold text-emerald-300 mt-2">
              ₹{Number(result.predicted_savings).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


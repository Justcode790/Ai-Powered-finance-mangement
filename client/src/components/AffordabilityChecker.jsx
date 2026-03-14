import React, { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

const AffordabilityChecker = ({ income, bankBalance, currentMonthExpenses, savingsGoal, budgetAllocations }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('travel');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const categories = [
    { value: 'travel', label: '✈️ Travel', icon: '✈️' },
    { value: 'entertainment', label: '🎬 Entertainment', icon: '🎬' },
    { value: 'shopping', label: '🛍️ Shopping', icon: '🛍️' },
    { value: 'food', label: '🍽️ Eating Out', icon: '🍽️' }
  ];

  const checkAffordability = () => {
    setChecking(true);
    
    setTimeout(() => {
      const expenseAmount = parseFloat(amount);
      const availableCash = income + bankBalance - currentMonthExpenses;
      const categoryBudget = budgetAllocations[category] || 0;
      const categorySpent = 0; // Would come from actual data
      const categoryRemaining = categoryBudget - categorySpent;
      
      // Calculate impact on savings
      const projectedSavings = availableCash - expenseAmount;
      const savingsImpact = ((projectedSavings / savingsGoal) * 100).toFixed(0);
      
      let status, message, confidence, suggestions;
      
      if (expenseAmount <= categoryRemaining && projectedSavings >= savingsGoal) {
        status = 'affordable';
        confidence = 'HIGH';
        message = `₹${expenseAmount.toLocaleString()} ${category} fits perfectly! You'll still save ₹${projectedSavings.toLocaleString()} 🥳`;
        suggestions = [`${savingsImpact}% of savings goal maintained`, 'Go ahead and enjoy!'];
      } else if (expenseAmount <= availableCash * 0.8 && projectedSavings >= savingsGoal * 0.8) {
        status = 'tight';
        confidence = 'MEDIUM';
        message = `₹${expenseAmount.toLocaleString()} is possible but tight. You'll save ₹${projectedSavings.toLocaleString()}`;
        suggestions = [
          'Consider reducing to ₹' + Math.round(expenseAmount * 0.8).toLocaleString(),
          'Or cut other categories by ₹' + Math.round((savingsGoal - projectedSavings) / 2).toLocaleString()
        ];
      } else {
        status = 'not_affordable';
        confidence = 'LOW';
        const maxAffordable = Math.floor(availableCash - savingsGoal);
        message = `₹${expenseAmount.toLocaleString()} exceeds budget. Savings at risk!`;
        suggestions = [
          `Try ₹${maxAffordable.toLocaleString()} version instead?`,
          'Or plan for next month when budget resets'
        ];
      }
      
      setResult({
        status,
        message,
        confidence,
        suggestions,
        projectedSavings,
        savingsImpact
      });
      setChecking(false);
    }, 1000);
  };

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-purple-600" size={20} />
        <p className="text-sm font-bold text-gray-900">🔮 Can I Afford This?</p>
      </div>

      <div className="space-y-3">
        {/* Category Selection */}
        <div>
          <label className="text-xs text-gray-600 mb-2 block font-medium">I want to spend on:</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  category === cat.value
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs text-gray-600 mb-2 block font-medium">Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Check Button */}
        <button
          onClick={checkAffordability}
          disabled={!amount || checking}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          {checking ? 'Checking...' : '🔮 Check If Affordable'}
        </button>

        {/* Result Display */}
        {result && (
          <div className={`rounded-xl p-4 ${
            result.status === 'affordable' ? 'bg-green-50 border border-green-200' :
            result.status === 'tight' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.status === 'affordable' && <CheckCircle className="text-green-600 mt-0.5" size={20} />}
              {result.status === 'tight' && <AlertCircle className="text-yellow-600 mt-0.5" size={20} />}
              {result.status === 'not_affordable' && <AlertCircle className="text-red-600 mt-0.5" size={20} />}
              
              <div className="flex-1">
                <p className={`text-sm font-bold mb-2 ${
                  result.status === 'affordable' ? 'text-green-700' :
                  result.status === 'tight' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {result.status === 'affordable' && '✅ AFFORDABLE!'}
                  {result.status === 'tight' && '⚠️ TIGHT BUDGET'}
                  {result.status === 'not_affordable' && '❌ NOT AFFORDABLE'}
                </p>
                
                <p className="text-xs text-gray-700 mb-3">
                  {result.message}
                </p>
                
                <div className="space-y-1">
                  {result.suggestions.map((suggestion, idx) => (
                    <p key={idx} className="text-xs text-gray-600">
                      • {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffordabilityChecker;

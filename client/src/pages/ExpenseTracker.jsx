import React, { useEffect, useState } from 'react';
import TransactionForm from '../components/TransactionForm';
import { getTransactions } from '../services/api';

const ExpenseTracker = () => {
  const [transactions, setTransactions] = useState([]);

  const load = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">Transaction Manager</h2>
        <p className="text-xs md:text-sm text-gray-600">
          Log your income and expenses to track your money flow and get AI-powered insights.
        </p>
      </div>

      <TransactionForm onCreated={load} />

      <div className="card">
        <p className="text-xs text-gray-700 mb-3 font-medium">All transactions</p>
        <div className="overflow-x-auto text-xs md:text-sm">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-700 font-semibold">
                <th className="py-2 border-b border-gray-300 pr-4">Date</th>
                <th className="py-2 border-b border-gray-300 pr-4">Type</th>
                <th className="py-2 border-b border-gray-300 pr-4">Category</th>
                <th className="py-2 border-b border-gray-300 pr-4">Description</th>
                <th className="py-2 border-b border-gray-300 pr-4">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-b border-gray-200 last:border-0">
                  <td className="py-2 pr-4 text-gray-700 font-medium">
                    {new Date(t.date).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit'
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      t.type === 'income' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {t.type === 'income' ? '💰 Income' : '🛒 Expense'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 capitalize text-gray-900 font-medium">{t.category}</td>
                  <td className="py-2 pr-4 text-gray-700">{t.description || '-'}</td>
                  <td className={`py-2 pr-4 font-bold ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {!transactions.length && (
                <tr>
                  <td colSpan="5" className="py-3 text-gray-600">
                    No transactions yet. Start by adding income or expense above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;


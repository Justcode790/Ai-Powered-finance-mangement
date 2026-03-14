import React, { useState } from 'react';
import { createTransaction } from '../services/api';
import { Wallet, ShoppingBag } from 'lucide-react';

const categories = ['rent', 'food', 'transport', 'entertainment', 'shopping', 'education', 'misc'];

const TransactionForm = ({ onCreated, compact = false }) => {
  const [transactionType, setTransactionType] = useState('expense');
  const [form, setForm] = useState({
    category: 'food',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTransaction({
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date),
        type: transactionType
      });
      setForm((prev) => ({ ...prev, amount: '', description: '' }));
      onCreated?.();
    } catch (err) {
      console.error(err);
      setError('Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="card space-y-4">
        <p className="text-sm font-semibold text-gray-900">Quick Add Transaction</p>
        
        {/* Transaction Type Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTransactionType('income')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              transactionType === 'income'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Wallet size={18} />
            Income
          </button>
          <button
            type="button"
            onClick={() => setTransactionType('expense')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              transactionType === 'expense'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ShoppingBag size={18} />
            Expense
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-700 mb-1 font-medium">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="0"
              className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1 font-medium">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 ${
            transactionType === 'income' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {loading ? 'Saving...' : `Add ${transactionType === 'income' ? 'Income' : 'Expense'}`}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Add Transaction</p>
      </div>

      {/* Transaction Type Toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTransactionType('income')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
            transactionType === 'income'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Wallet size={18} />
          Income
        </button>
        <button
          type="button"
          onClick={() => setTransactionType('expense')}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
            transactionType === 'expense'
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingBag size={18} />
          Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            placeholder="0"
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Description (Optional)</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="e.g., Salary, Groceries"
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className={`w-full px-4 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 ${
          transactionType === 'income' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {loading ? 'Saving...' : `Add ${transactionType === 'income' ? 'Income' : 'Expense'}`}
      </button>
    </form>
  );
};

export default TransactionForm;


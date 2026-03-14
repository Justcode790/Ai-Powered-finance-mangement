import React, { useEffect, useState } from 'react';
import { getMe, updateMe } from '../services/api';

export default function ProfileForm() {
  const [form, setForm] = useState({
    age: '',
    income: '',
    bank_balance: '',
    financial_literacy_score: '',
    saving_habit_score: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const me = await getMe();
        setForm({
          age: me.age ?? '',
          income: me.income ?? '',
          bank_balance: me.bank_balance ?? '',
          financial_literacy_score: me.financial_literacy_score ?? '',
          saving_habit_score: me.saving_habit_score ?? ''
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSaved(false);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await updateMe({
        age: Number(form.age),
        income: Number(form.income),
        bank_balance: Number(form.bank_balance) || 0,
        financial_literacy_score: Number(form.financial_literacy_score),
        saving_habit_score: Number(form.saving_habit_score)
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-700 font-medium">Your profile (ML inputs)</p>
        {saved && <span className="pill bg-green-100 text-green-700 font-medium">Saved</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Age</label>
          <input
            type="number"
            name="age"
            min={18}
            value={form.age}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Monthly Income (₹)</label>
          <input
            type="number"
            name="income"
            min={1}
            value={form.income}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Current Bank Balance (₹)</label>
          <input
            type="number"
            name="bank_balance"
            min={0}
            value={form.bank_balance}
            onChange={handleChange}
            placeholder="0"
            disabled={loading}
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-700 mb-1 font-medium">Financial Literacy (1–10)</label>
          <input
            type="number"
            name="financial_literacy_score"
            min={1}
            max={10}
            value={form.financial_literacy_score}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-700 mb-1 font-medium">Saving Habit Score (1–10)</label>
          <input
            type="number"
            name="saving_habit_score"
            min={1}
            max={10}
            value={form.saving_habit_score}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <button
        type="submit"
        disabled={loading || saving}
        className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}


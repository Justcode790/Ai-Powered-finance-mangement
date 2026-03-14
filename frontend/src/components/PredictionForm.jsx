import React, { useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api/predict-savings';

const fields = [
  { key: 'age', label: 'Age', type: 'number', min: 19 },
  { key: 'income', label: 'Income', type: 'number', min: 1 },
  { key: 'rent', label: 'Rent', type: 'number', min: 0 },
  { key: 'food', label: 'Food', type: 'number', min: 0 },
  { key: 'transport', label: 'Transport', type: 'number', min: 0 },
  { key: 'entertainment', label: 'Entertainment', type: 'number', min: 0 },
  { key: 'shopping', label: 'Shopping', type: 'number', min: 0 },
  { key: 'education', label: 'Education', type: 'number', min: 0 },
  { key: 'misc', label: 'Misc', type: 'number', min: 0 },
  { key: 'financial_literacy_score', label: 'Financial Literacy Score', type: 'number', min: 1, max: 10 },
  { key: 'saving_habit_score', label: 'Saving Habit Score', type: 'number', min: 1, max: 10 }
];

const initial = {
  age: 22,
  income: 40000,
  rent: 8000,
  food: 5000,
  transport: 2000,
  entertainment: 3000,
  shopping: 2000,
  education: 1000,
  misc: 1500,
  financial_literacy_score: 7,
  saving_habit_score: 8
};

function validate(values) {
  const errors = {};
  if (!(Number(values.age) > 18)) errors.age = 'Age must be > 18';
  if (!(Number(values.income) > 0)) errors.income = 'Income must be > 0';
  const fl = Number(values.financial_literacy_score);
  const sh = Number(values.saving_habit_score);
  if (fl < 1 || fl > 10) errors.financial_literacy_score = 'Must be between 1 and 10';
  if (sh < 1 || sh > 10) errors.saving_habit_score = 'Must be between 1 and 10';
  return errors;
}

export default function PredictionForm({ onPredicted }) {
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const canSubmit = useMemo(() => Object.keys(validate(values)).length === 0, [values]);

  const onChange = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, Number(v)])
      );
      const res = await axios.post(API_URL, payload);
      onPredicted?.(res.data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Prediction failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-slate-300 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={values[f.key]}
              onChange={onChange(f.key)}
              min={f.min}
              max={f.max}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            {errors[f.key] && <p className="text-xs text-rose-400 mt-1">{errors[f.key]}</p>}
          </div>
        ))}
      </div>

      {apiError && <p className="text-xs text-rose-400 mt-4">{apiError}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-5 w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold px-5 py-2.5 hover:bg-emerald-400 disabled:opacity-50"
      >
        {submitting ? 'Predicting...' : 'Predict Savings'}
      </button>
    </form>
  );
}


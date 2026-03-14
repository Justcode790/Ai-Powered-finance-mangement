import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#22c55e', '#38bdf8', '#facc15', '#fb7185', '#a855f7', '#0ea5e9'];

const SpendingPieChart = ({ data }) => {
  const filtered = (data || []).filter((d) => d.value > 0);

  if (!filtered.length) {
    return (
      <div className="card h-full flex items-center justify-center text-sm text-slate-400">
        Add some expenses to see your spending breakdown.
      </div>
    );
  }

  return (
    <div className="card h-full">
      <p className="text-xs text-slate-400 mb-3">Spending breakdown</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {filtered.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: 12 }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendingPieChart;


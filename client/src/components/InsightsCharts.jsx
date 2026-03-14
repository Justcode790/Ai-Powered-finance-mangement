import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const InsightsCharts = ({ savingsHistory }) => {
  const data = savingsHistory?.length
    ? savingsHistory
    : [
        { month: 'Jan', savings: 1500 },
        { month: 'Feb', savings: 1800 },
        { month: 'Mar', savings: 1300 },
        { month: 'Apr', savings: 2000 }
      ];

  return (
    <div className="card h-full">
      <p className="text-xs text-slate-400 mb-3">Savings trend</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InsightsCharts;


// src/components/Dashboard/common/TrendsChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendsChart = ({ data }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-8">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Score Trends</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="securityScore" stroke="#3B82F6" strokeWidth={2} />
          <Line type="monotone" dataKey="architectureScore" stroke="#8B5CF6" strokeWidth={2} />
          <Line type="monotone" dataKey="costEfficiencyScore" stroke="#10B981" strokeWidth={2} />
          <Line type="monotone" dataKey="validationScore" stroke="#F97316" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default TrendsChart;
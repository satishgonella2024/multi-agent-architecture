// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/NetworkMetrics.jsx
import React from 'react';
import { Activity, Zap, Server } from 'lucide-react';

const NetworkMetrics = ({ metrics }) => {
  const { totalMessages, averageResponseTime, completionRate } = metrics;
  
  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      <div className="border rounded-lg p-3 bg-indigo-50 transform hover:scale-105 transition-all duration-300 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-xs text-gray-500">Messages</p>
          <Activity className="h-4 w-4 text-indigo-400" />
        </div>
        <p className="text-xl font-bold text-indigo-600">{totalMessages}</p>
      </div>
      <div className="border rounded-lg p-3 bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-xs text-gray-500">Avg. Time</p>
          <Zap className="h-4 w-4 text-blue-400" />
        </div>
        <p className="text-xl font-bold text-blue-600">
          {averageResponseTime.toFixed(1)}s
        </p>
      </div>
      <div className="border rounded-lg p-3 bg-green-50 transform hover:scale-105 transition-all duration-300 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-xs text-gray-500">Completion</p>
          <Server className="h-4 w-4 text-green-400" />
        </div>
        <p className="text-xl font-bold text-green-600">
          {completionRate.toFixed(0)}%
        </p>
      </div>
    </div>
  );
};

export default NetworkMetrics;
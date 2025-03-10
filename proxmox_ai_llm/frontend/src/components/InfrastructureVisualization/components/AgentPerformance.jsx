// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/AgentPerformance.jsx
import React from 'react';
import { Target } from 'lucide-react';

const AgentPerformance = ({ completionRate, hasError }) => {
  return (
    <div className="mt-4 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
        <Target className="h-4 w-4 mr-1 text-indigo-500" />
        Agent Performance
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-500">Response Efficiency</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, completionRate + 10)}%` }}
            ></div>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Network Health</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className={`h-2.5 rounded-full ${
                hasError 
                  ? 'bg-gradient-to-r from-red-400 to-red-500'
                  : 'bg-gradient-to-r from-green-400 to-green-500'
              }`}
              style={{ 
                width: hasError ? '60%' : '95%' 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;
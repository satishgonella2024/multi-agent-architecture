// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/StatusLegend.jsx
import React from 'react';

const StatusLegend = () => {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-1"></span>
        <span>Idle</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
        <span>Processing</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
        <span>Completed</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
        <span>Error</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-indigo-600 mr-1"></span>
        <span>Orchestrator</span>
      </div>
    </div>
  );
};

export default StatusLegend;
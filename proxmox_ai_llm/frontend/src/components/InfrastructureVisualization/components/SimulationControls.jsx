// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/SimulationControls.jsx
import React from 'react';

const SimulationControls = ({ 
  simulationRunning,
  onStartSimulation,
  onResetSimulation
}) => {
  return (
    <div className="flex items-center space-x-3">
      {!simulationRunning && (
        <button 
          onClick={onStartSimulation}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md flex items-center transition-colors"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-white mr-1"></span>
          Start Simulation
        </button>
      )}
      
      <button 
        onClick={onResetSimulation}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-md transition-colors"
      >
        Reset
      </button>
      
      {simulationRunning && (
        <div className="flex items-center bg-green-100 px-3 py-1 rounded-md">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
          <span className="text-xs text-green-700">Live Simulation</span>
        </div>
      )}
    </div>
  );
};

export default SimulationControls;
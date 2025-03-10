// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/AgentInfo.jsx
import React from 'react';
import { getAgentIcon } from '../utils/agentUtils';
import { AGENT_DESCRIPTIONS } from '../utils/agentUtils';

const AgentInfo = ({ agentId, agentState, onSimulateError, onMarkComplete }) => {
  if (!agentId) return null;
  
  return (
    <div className="mt-4 p-3 bg-white rounded-lg border shadow-md transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center">
        <span className="mr-2 p-2 rounded-full bg-indigo-50">{getAgentIcon(agentId)}</span>
        <h4 className="font-semibold text-gray-800">
          {agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent
        </h4>
      </div>
      <p className="mt-1 text-sm text-gray-600">{AGENT_DESCRIPTIONS[agentId]}</p>
      <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
        <div>
          Status: <span className={`font-medium ${
            agentState === 'completed' ? 'text-green-600' : 
            agentState === 'processing' ? 'text-blue-600' :
            agentState === 'error' ? 'text-red-600' :
            agentState === 'active' ? 'text-indigo-600' : 'text-gray-600'
          }`}>
            {agentState?.charAt(0).toUpperCase() + agentState?.slice(1)}
          </span>
        </div>
        
        {/* Add actions for selected agent */}
        <div className="flex mt-2 gap-2">
          {agentState !== 'error' && (
            <button
              onClick={onSimulateError}
              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded flex items-center"
            >
              Simulate Error
            </button>
          )}
          
          {agentState !== 'completed' && agentId !== 'orchestrator' && (
            <button
              onClick={onMarkComplete}
              className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentInfo;
// src/components/Dashboard/common/AgentErrorMessage.jsx
import React from 'react';

const AgentErrorMessage = ({ agentName, error, handleRetryAgentData }) => (
  <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
    <p className="mb-2">Error loading {agentName} data: {error}</p>
    <button 
      onClick={() => handleRetryAgentData(agentName)}
      className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
    >
      Retry
    </button>
  </div>
);

export default AgentErrorMessage;
// src/components/Dashboard/common/ScoreCard.jsx
import React from 'react';

const ScoreCard = ({ title, score, icon, agentName, apiErrors, handleRetryAgentData }) => (
  <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
    {apiErrors && apiErrors[agentName] ? (
      <div className="w-full p-3 bg-red-50 rounded-lg mb-2">
        <p className="text-sm text-red-600 mb-1">Error: {apiErrors[agentName]}</p>
        <button 
          onClick={() => handleRetryAgentData(agentName)}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
        >
          Retry
        </button>
      </div>
    ) : null}
    
    <div className="text-lg font-semibold text-gray-700 mb-2">{title}</div>
    <div className="relative w-24 h-24 mb-3">
      {/* Circle background */}
      <div className="absolute inset-0 rounded-full bg-gray-200"></div>
      {/* Colored progress circle */}
      <svg className="absolute inset-0" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke={score >= 90 ? '#10B981' : score >= 70 ? '#FBBF24' : '#EF4444'} 
          strokeWidth="10" 
          strokeDasharray={`${score * 2.83} 283`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-2xl font-bold">{score}</div>
      </div>
    </div>
    <div className="mt-2">{icon}</div>
  </div>
);

export default ScoreCard;
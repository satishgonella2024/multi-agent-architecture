// src/components/Dashboard/tabs/Architecture.jsx
import React from 'react';
import { Database } from 'lucide-react';
import AgentErrorMessage from '../common/AgentErrorMessage';
import ScoreDisplay from '../common/ScoreDisplay';

const Architecture = ({ workflowData, scores, apiErrors, handleRetryAgentData }) => {
  const { architectureScore } = scores;

  const getArchitectureScoreDescription = (score) => {
    if (score >= 90) return 'Excellent architecture design';
    if (score >= 70) return 'Good architecture with some improvements needed';
    return 'Architecture requires significant improvements';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Architecture Analysis</h3>
      {apiErrors.architect ? (
        <AgentErrorMessage 
          agentName="architecture"
          error={apiErrors.architect}
          handleRetryAgentData={handleRetryAgentData}
        />
      ) : workflowData.architecture ? (
        <div>
          <ScoreDisplay 
            score={architectureScore}
            title="Architecture Score"
            description={getArchitectureScoreDescription(architectureScore)}
          />
          
          <h4 className="text-lg font-medium mb-2">Architecture Recommendations</h4>
          {workflowData.architecture.details?.optimizations && 
           workflowData.architecture.details.optimizations.length > 0 ? (
            <div className="space-y-4">
              {workflowData.architecture.details.optimizations.map((opt, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {opt.effort?.toUpperCase() || 'MEDIUM'}
                        </span>
                        <span className="ml-2 font-medium">{opt.description}</span>
                      </div>
                      <p className="mt-2 text-gray-600">{opt.implementation || opt.benefit}</p>
                    </div>
                    <div>
                      <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-purple-50 p-4 rounded-lg flex items-center">
              <Database className="w-6 h-6 text-purple-500 mr-3" />
              <p className="text-purple-700">No architecture optimization needed. Your design is solid!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
};

export default Architecture;
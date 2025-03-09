// src/components/Dashboard/tabs/Security.jsx
import React from 'react';
import AgentErrorMessage from '../common/AgentErrorMessage';
import ScoreDisplay from '../common/ScoreDisplay';
import SecurityIssuesList from '../common/SecurityIssuesList';

const Security = ({ workflowData, scores, apiErrors, handleRetryAgentData }) => {
  const { securityScore } = scores;

  const getSecurityScoreDescription = (score) => {
    if (score >= 90) return 'Excellent security posture';
    if (score >= 70) return 'Good security with some issues to address';
    return 'Critical security issues need immediate attention';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Security Analysis</h3>
      {apiErrors.security ? (
        <AgentErrorMessage 
          agentName="security"
          error={apiErrors.security}
          handleRetryAgentData={handleRetryAgentData}
        />
      ) : workflowData.security ? (
        <div>
          <ScoreDisplay 
            score={securityScore}
            title="Security Score"
            description={getSecurityScoreDescription(securityScore)}
          />
          
          <h4 className="text-lg font-medium mb-2">Vulnerabilities</h4>
          <SecurityIssuesList 
            securityData={workflowData.security}
            showViewAll={false}
          />
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

export default Security;
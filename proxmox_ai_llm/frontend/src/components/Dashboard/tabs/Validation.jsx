// src/components/Dashboard/tabs/Validation.jsx
import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import AgentErrorMessage from '../common/AgentErrorMessage';
import ScoreDisplay from '../common/ScoreDisplay';

const Validation = ({ workflowData, scores, apiErrors, handleRetryAgentData }) => {
  const { validationScore } = scores;

  const getValidationScoreDescription = (score) => {
    if (score >= 90) return 'Excellent validation results';
    if (score >= 70) return 'Good validation with some issues to address';
    return 'Validation failed, significant issues to resolve';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Validation Results</h3>
      {apiErrors.validator ? (
        <AgentErrorMessage 
          agentName="validation"
          error={apiErrors.validator}
          handleRetryAgentData={handleRetryAgentData}
        />
      ) : workflowData.validation ? (
        <div>
          <ScoreDisplay 
            score={validationScore}
            title="Validation Score"
            description={getValidationScoreDescription(validationScore)}
          />
          
          <h4 className="text-lg font-medium mb-2">Validation Issues</h4>
          {workflowData.validation.details?.validation_results?.length > 0 ? (
            <div className="space-y-4">
              {workflowData.validation.details.validation_results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <div className={`mt-0.5 mr-3 rounded-full p-1 ${
                      result.status === 'failed' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'
                    }`}>
                      {result.status === 'failed' ? 
                        <AlertTriangle className="w-5 h-5" /> : 
                        <Check className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">{result.test_name || `Test ${idx + 1}`}</span>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className={`text-sm font-medium ${
                          result.status === 'failed' ? 'text-red-700' : 'text-green-700'
                        }`}>
                          {result.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{result.message || result.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg flex items-center">
              <Check className="w-6 h-6 text-green-500 mr-3" />
              <p className="text-green-700">All validation tests passed successfully!</p>
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

export default Validation;
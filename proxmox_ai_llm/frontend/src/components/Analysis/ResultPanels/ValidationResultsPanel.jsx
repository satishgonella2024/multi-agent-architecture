// proxmox_ai_llm/frontend/src/components/Analysis/ResultPanels/ValidationResultsPanel.jsx
import React from 'react';
import { Check, AlertTriangle, RefreshCw, CheckCircle, XCircle, FileText } from 'lucide-react';

const ValidationResultsPanel = ({ results, status }) => {
  // Add logging to debug
  console.log("Validation Results:", results);
  
  // Function to normalize results structure
  const normalizeResults = (rawResults) => {
    if (!rawResults) return null;
    
    // Check if we have the nested structure from the API
    if (rawResults.summary && typeof rawResults.summary === 'object' && rawResults.details) {
      // We have the nested API response format
      return {
        validationScore: rawResults.summary.validation_score || 0,
        validationStatus: rawResults.summary.validation_status || 'UNKNOWN',
        issues: (rawResults.details && rawResults.details.issues) || [],
        passedChecks: 0, // Calculate if available
        failedChecks: (rawResults.details && rawResults.details.issues && rawResults.details.issues.length) || 0,
        warnings: 0, // Calculate if available
        summary: `Validation completed with status: ${rawResults.summary.validation_status || 'UNKNOWN'}`,
        passedRules: [],
        standards: []
      };
    }
    
    // Already in expected format or different format
    return rawResults;
  };
  
  // Normalize the results
  const normalizedResults = normalizeResults(results);
  
  // Check if we have results or if the workflow is still processing
  if (status !== 'completed' && status !== 'failed') {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-gray-500">
        <RefreshCw className="h-8 w-8 animate-spin mb-4" />
        <p>Validation in progress. Please wait...</p>
      </div>
    );
  }
  
  // If there's an error or no results
  if (!normalizedResults || normalizedResults.error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Validation Results Unavailable</h3>
        <p className="text-gray-600">
          {typeof normalizedResults?.error === 'string' 
            ? normalizedResults.error 
            : "Validation results couldn't be loaded."
          }
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <CheckCircle className="h-5 w-5 text-orange-500 mr-2" />
          Validation Results
        </h3>
        {typeof normalizedResults.validationScore === 'number' && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            normalizedResults.validationScore >= 80 ? 'bg-green-100 text-green-800' :
            normalizedResults.validationScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Score: {normalizedResults.validationScore}/100
          </span>
        )}
      </div>
      
      {/* Validation Overview */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-md font-medium text-gray-700 mb-2">Validation Overview</h4>
        <p className="text-gray-600">
          {typeof normalizedResults.summary === 'string'
            ? normalizedResults.summary
            : "This validation checks the infrastructure code against industry standards, best practices, and potential issues."
          }
        </p>
      </div>
      
      {/* Validation Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-md p-4 border-l-4 border-green-500">
          <div className="text-xs uppercase text-gray-500 mb-1">Passed Checks</div>
          <div className="text-2xl font-bold text-gray-900">{normalizedResults.passedChecks || 0}</div>
        </div>
        
        <div className="bg-white shadow rounded-md p-4 border-l-4 border-red-500">
          <div className="text-xs uppercase text-gray-500 mb-1">Failed Checks</div>
          <div className="text-2xl font-bold text-gray-900">{normalizedResults.failedChecks || 0}</div>
        </div>
        
        <div className="bg-white shadow rounded-md p-4 border-l-4 border-orange-500">
          <div className="text-xs uppercase text-gray-500 mb-1">Warnings</div>
          <div className="text-2xl font-bold text-gray-900">{normalizedResults.warnings || 0}</div>
        </div>
        
        <div className="bg-white shadow rounded-md p-4 border-l-4 border-blue-500">
          <div className="text-xs uppercase text-gray-500 mb-1">Total Checks</div>
          <div className="text-2xl font-bold text-gray-900">
            {((normalizedResults.passedChecks || 0) + (normalizedResults.failedChecks || 0))}
          </div>
        </div>
      </div>
      
      {/* Validation Issues */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">
          {normalizedResults.issues && normalizedResults.issues.length > 0 
            ? `Validation Issues (${normalizedResults.issues.length})` 
            : 'Validation Issues'}
        </h4>
        
        {normalizedResults.issues && normalizedResults.issues.length > 0 ? (
          <div className="space-y-3">
            {normalizedResults.issues.map((issue, index) => (
              <div 
                key={index} 
                className="border border-orange-200 rounded-md overflow-hidden"
              >
                <div className="bg-orange-50 p-3 border-b border-orange-200 flex justify-between items-start">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">{issue.title || "Validation Issue"}</h5>
                      <p className="text-sm text-orange-700 mt-1">
                        {issue.description || issue.message || "Issue details not available"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {issue.severity || 'medium'}
                  </span>
                </div>
                {(issue.recommendation || issue.solution) && (
                  <div className="p-3 bg-white">
                    <h6 className="text-sm font-medium text-gray-700 mb-1">Recommendation:</h6>
                    <p className="text-sm text-gray-600">{issue.recommendation || issue.solution}</p>
                  </div>
                )}
                {issue.affected_resource && (
                  <div className="p-3 pt-0 bg-white">
                    <div className="text-xs text-gray-500 mt-2">
                      <span className="font-medium">Resource:</span> {issue.affected_resource}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex items-center justify-center bg-green-50 rounded-md">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700">No validation issues found!</p>
          </div>
        )}
      </div>
      
      {/* Rest of the component for passed checks and standards if needed */}
    </div>
  );
};

export default ValidationResultsPanel;
// proxmox_ai_llm/frontend/src/components/Analysis/ResultPanels/SecurityResultsPanel.jsx
import React from 'react';
import { Shield, AlertTriangle, Check, RefreshCw, ExternalLink } from 'lucide-react';

const SecurityResultsPanel = ({ results, status }) => {
  // Add logging to debug
  console.log("Security Results:", results);
  
  // Function to normalize results structure
  const normalizeResults = (rawResults) => {
    if (!rawResults) return null;
    
    // Check if we have the nested structure from the API
    if (rawResults.summary && typeof rawResults.summary === 'object' && rawResults.details) {
      // We have the nested API response format
      return {
        score: rawResults.summary.security_score || 0,
        securityStatus: rawResults.summary.security_status || 'UNKNOWN',
        issues: (rawResults.details && rawResults.details.vulnerabilities) || [],
        bestPractices: (rawResults.details && rawResults.details.recommendations) || [],
        references: [],
        summary: `Security analysis completed with status: ${rawResults.summary.security_status || 'UNKNOWN'}. Found ${rawResults.summary.vulnerabilities_count || 0} vulnerabilities.`
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
        <p>Security analysis in progress. Please wait...</p>
      </div>
    );
  }
  
  // If there's an error or no results
  if (!normalizedResults || normalizedResults.error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Security Analysis Unavailable</h3>
        <p className="text-gray-600">
          {typeof normalizedResults?.error === 'string' 
            ? normalizedResults.error 
            : "Security analysis results couldn't be loaded."
          }
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Shield className="h-5 w-5 text-blue-500 mr-2" />
          Security Analysis
        </h3>
        {typeof normalizedResults.score === 'number' && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            normalizedResults.score >= 80 ? 'bg-green-100 text-green-800' :
            normalizedResults.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Score: {normalizedResults.score}/100
          </span>
        )}
      </div>
      
      {/* Security Overview */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-md font-medium text-gray-700 mb-2">Security Overview</h4>
        <p className="text-gray-600">
          {typeof normalizedResults.summary === 'string'
            ? normalizedResults.summary
            : "This analysis evaluates the security of your infrastructure configuration against best practices and identifies potential vulnerabilities."
          }
        </p>
      </div>
      
      {/* Security Issues */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">
          {normalizedResults.issues && normalizedResults.issues.length > 0 
            ? `Security Issues (${normalizedResults.issues.length})` 
            : 'Security Issues'}
        </h4>
        
        {normalizedResults.issues && normalizedResults.issues.length > 0 ? (
          <div className="space-y-3">
            {normalizedResults.issues.map((issue, index) => (
              <div 
                key={index} 
                className="border border-red-200 rounded-md overflow-hidden"
              >
                <div className="bg-red-50 p-3 border-b border-red-200 flex justify-between items-start">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">{issue.title || "Security Vulnerability"}</h5>
                      <p className="text-sm text-red-700 mt-1">
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
                {issue.recommendation && (
                  <div className="p-3 bg-white">
                    <h6 className="text-sm font-medium text-gray-700 mb-1">Recommendation:</h6>
                    <p className="text-sm text-gray-600">{issue.recommendation}</p>
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
            <p className="text-green-700">No security issues found!</p>
          </div>
        )}
      </div>
      
      {/* Best Practices (using recommendations from the API) */}
      {normalizedResults.bestPractices && normalizedResults.bestPractices.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Security Recommendations</h4>
          <ul className="space-y-2">
            {normalizedResults.bestPractices.map((practice, index) => (
              <li key={index} className="flex items-start p-3 bg-green-50 rounded-md">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-700 font-medium">{practice.description}</p>
                  {practice.implementation && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Implementation: </span>
                      {practice.implementation}
                    </p>
                  )}
                  {practice.importance && (
                    <p className="text-xs text-gray-500 mt-1">
                      Importance: <span className={`px-1.5 py-0.5 rounded-full ${
                        practice.importance === 'high' ? 'bg-red-100 text-red-700' :
                        practice.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{practice.importance}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* References */}
      {normalizedResults.references && normalizedResults.references.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">References</h4>
          <ul className="space-y-2">
            {normalizedResults.references.map((reference, index) => (
              <li key={index} className="flex items-start">
                <ExternalLink className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0 mt-1" />
                <span className="text-gray-700">{reference}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SecurityResultsPanel;
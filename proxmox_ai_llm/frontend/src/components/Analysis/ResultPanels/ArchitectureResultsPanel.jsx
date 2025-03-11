// proxmox_ai_llm/frontend/src/components/Analysis/ResultPanels/ArchitectureResultsPanel.jsx
import React, { useState } from 'react';
import { Server, AlertTriangle, Check, RefreshCw, Edit, Copy, Code, FileText } from 'lucide-react';

const ArchitectureResultsPanel = ({ results, terraform, status }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Add logging to debug
  console.log("Architecture Results:", results);
  console.log("Terraform:", terraform);
  
  // Function to normalize results structure
  const normalizeResults = (rawResults, terraformCode) => {
    if (!rawResults) return null;
    
    // Check if we have the nested structure from the API
    if (rawResults.summary && typeof rawResults.summary === 'object' && rawResults.details) {
      // Extract terraform code if available
      const extractedTerraform = rawResults.details.analyzed_terraform || terraformCode || '';
      
      // We have the nested API response format
      return {
        architectureScore: rawResults.summary.architecture_score || 0,
        architectureStatus: rawResults.summary.architecture_status || 'UNKNOWN',
        suggestions: (rawResults.details && rawResults.details.suggestions) || [],
        resources: (rawResults.details && rawResults.details.resources) || {},
        overview: `Architecture analysis completed with status: ${rawResults.summary.architecture_status || 'UNKNOWN'}`,
        terraform: extractedTerraform
      };
    }
    
    // If terraform code is provided separately
    if (terraformCode && typeof terraformCode === 'string') {
      return {
        ...rawResults,
        terraform: terraformCode
      };
    }
    
    // Already in expected format or different format
    return rawResults;
  };
  
  // Normalize the results
  const normalizedResults = normalizeResults(results, terraform);
  
  // Check if we have results or if the workflow is still processing
  if (status !== 'completed' && status !== 'failed') {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-gray-500">
        <RefreshCw className="h-8 w-8 animate-spin mb-4" />
        <p>Architecture analysis in progress. Please wait...</p>
      </div>
    );
  }
  
  // Handle copying terraform code
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };
  
  // If there's an error or no results
  if ((!normalizedResults || normalizedResults.error) && !terraform) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Architecture Analysis Unavailable</h3>
        <p className="text-gray-600">
          {typeof normalizedResults?.error === 'string' 
            ? normalizedResults.error 
            : "Architecture analysis results couldn't be loaded."
          }
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Server className="h-5 w-5 text-yellow-500 mr-2" />
          Architecture Analysis
        </h3>
        {typeof normalizedResults?.architectureScore === 'number' && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            normalizedResults.architectureScore >= 80 ? 'bg-green-100 text-green-800' :
            normalizedResults.architectureScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Score: {normalizedResults.architectureScore}/100
          </span>
        )}
      </div>
      
      {/* Architecture Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'terraform' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('terraform')}
          >
            Terraform Code
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Architecture Overview */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-md font-medium text-gray-700 mb-2">Architecture Overview</h4>
              <p className="text-gray-600">
                {typeof normalizedResults?.overview === 'string'
                  ? normalizedResults.overview
                  : "This analysis evaluates your infrastructure architecture for design efficiency, scalability, and adherence to best practices."
                }
              </p>
            </div>
            
            {/* Resource Summary */}
            {normalizedResults?.resources && Object.keys(normalizedResults.resources).length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Resource Summary</h4>
                <div className="bg-white shadow overflow-hidden rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {Object.entries(normalizedResults.resources).map(([resourceType, count], index) => (
                      <li key={index} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Code className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-700">{resourceType}</span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Terraform Code Tab */}
        {activeTab === 'terraform' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium text-gray-700">Generated Terraform Code</h4>
              <button
                onClick={() => copyToClipboard(normalizedResults?.terraform || terraform || '')}
                className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Code
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-md text-white p-4 overflow-x-auto">
              <pre className="text-sm">
                <code>
                  {normalizedResults?.terraform || terraform || "No Terraform code available."}
                </code>
              </pre>
            </div>
          </div>
        )}
        
        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">
              {normalizedResults?.suggestions && normalizedResults.suggestions.length > 0 
                ? `Architecture Suggestions (${normalizedResults.suggestions.length})` 
                : 'Architecture Suggestions'}
            </h4>
            
            {normalizedResults?.suggestions && normalizedResults.suggestions.length > 0 ? (
              <div className="space-y-3">
                {normalizedResults.suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="border border-yellow-200 rounded-md overflow-hidden"
                  >
                    <div className="bg-yellow-50 p-3 border-b border-yellow-200">
                      <div className="flex items-start">
                        <Edit className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-gray-900">{suggestion.title || "Architecture Suggestion"}</h5>
                          <p className="text-sm text-yellow-700 mt-1">
                            {suggestion.description || suggestion.message || "Suggestion details not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {suggestion.implementation && (
                      <div className="p-3 bg-white">
                        <h6 className="text-sm font-medium text-gray-700 mb-1">Implementation:</h6>
                        <p className="text-sm text-gray-600">{suggestion.implementation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex items-center justify-center bg-green-50 rounded-md">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-700">No architecture suggestions available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureResultsPanel;
// proxmox_ai_llm/frontend/src/components/Analysis/ResultPanels/CostResultsPanel.jsx
import React from 'react';
import { DollarSign, TrendingDown, AlertTriangle, RefreshCw, BarChart } from 'lucide-react';

const CostResultsPanel = ({ results, status }) => {
  // Add logging to debug
  console.log("Cost Results:", results);
  
  // Function to normalize results structure
  const normalizeResults = (rawResults) => {
    if (!rawResults) return null;
    
    // Check if we have the nested structure from the API
    if (rawResults.summary && typeof rawResults.summary === 'object' && rawResults.details) {
      // We have the nested API response format
      return {
        costEfficiencyScore: rawResults.summary.cost_efficiency_score || 0,
        costStatus: rawResults.summary.cost_status || 'UNKNOWN',
        monthly_cost: rawResults.details.monthly_cost || 0,
        annual_cost: rawResults.details.annual_cost || (rawResults.details.monthly_cost * 12) || 0,
        cost_tier: rawResults.details.cost_tier || 'MEDIUM',
        cost_breakdown: rawResults.details.cost_breakdown || {},
        resources_cost: rawResults.details.resources_cost || [],
        optimization_suggestions: rawResults.details.optimization_suggestions || []
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
        <p>Cost analysis in progress. Please wait...</p>
      </div>
    );
  }
  
  // If there's an error or no results
  if (!normalizedResults || normalizedResults.error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cost Analysis Unavailable</h3>
        <p className="text-gray-600">
          {typeof normalizedResults?.error === 'string' 
            ? normalizedResults.error 
            : "Cost analysis results couldn't be loaded."
          }
        </p>
      </div>
    );
  }
  
  // Helper to format costs
  const formatCost = (cost) => {
    if (cost === undefined || cost === null) return 'N/A';
    return `$${parseFloat(cost).toFixed(2)}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <DollarSign className="h-5 w-5 text-green-500 mr-2" />
          Cost Analysis
        </h3>
        {typeof normalizedResults.costEfficiencyScore === 'number' && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            normalizedResults.costEfficiencyScore >= 80 ? 'bg-green-100 text-green-800' :
            normalizedResults.costEfficiencyScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Efficiency: {normalizedResults.costEfficiencyScore}/100
          </span>
        )}
      </div>
      
      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-md p-4 border-l-4 border-green-500">
          <div className="text-xs uppercase text-gray-500 mb-1">Monthly Cost</div>
          <div className="text-2xl font-bold text-gray-900">{formatCost(normalizedResults.monthly_cost)}</div>
          <div className="text-sm text-gray-600 mt-1">
            {formatCost(normalizedResults.annual_cost)} per year
          </div>
        </div>
        
        <div className="bg-white shadow rounded-md p-4 border-l-4 border-blue-500">
          <div className="text-xs uppercase text-gray-500 mb-1">Cost Tier</div>
          <div className="text-2xl font-bold text-gray-900">{normalizedResults.cost_tier || 'MEDIUM'}</div>
          <div className="text-sm text-gray-600 mt-1">
            Based on monthly spend
          </div>
        </div>
        
        <div className="bg-white shadow rounded-md p-4 border-l-4 border-purple-500">
          <div className="text-xs uppercase text-gray-500 mb-1">Potential Savings</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCost(normalizedResults.optimization_suggestions?.reduce((total, item) => 
              total + (parseFloat(item.potential_savings) || 0), 0))}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            With optimizations
          </div>
        </div>
      </div>
      
      {/* Cost Breakdown */}
      {normalizedResults.cost_breakdown && Object.keys(normalizedResults.cost_breakdown).length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Cost Breakdown</h4>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <div className="px-4 py-5 border-b border-gray-200 space-y-4">
              {Object.entries(normalizedResults.cost_breakdown).map(([category, amount], index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <span className="text-sm text-gray-700">
                      {formatCost(amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(
                          100, 
                          ((amount || 0) / (normalizedResults.monthly_cost || 1)) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Resource Costs */}
      {normalizedResults.resources_cost && normalizedResults.resources_cost.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Resource Costs</h4>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <ul className="divide-y divide-gray-200">
              {normalizedResults.resources_cost.map((resource, index) => (
                <li key={index} className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {resource.resource_type}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {resource.instance}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCost(resource.monthly_cost)}
                    </div>
                  </div>
                  {resource.assumptions && (
                    <div className="mt-2 text-xs text-gray-500 italic">
                      Assumptions: {resource.assumptions}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Optimization Suggestions */}
      {normalizedResults.optimization_suggestions && normalizedResults.optimization_suggestions.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Cost Optimization Suggestions</h4>
          <div className="space-y-3">
            {normalizedResults.optimization_suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="border border-green-200 rounded-md overflow-hidden"
              >
                <div className="bg-green-50 p-3 border-b border-green-200 flex justify-between items-start">
                  <div className="flex items-start">
                    <TrendingDown className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">Cost Optimization</h5>
                      <p className="text-sm text-green-700 mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Save {formatCost(suggestion.potential_savings)}/mo
                  </span>
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
        </div>
      )}
    </div>
  );
};

export default CostResultsPanel;
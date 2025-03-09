// src/components/Dashboard/tabs/Cost.jsx
import React from 'react';
import { DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AgentErrorMessage from '../common/AgentErrorMessage';

const Cost = ({ workflowData, costBreakdown, apiErrors, handleRetryAgentData }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Cost Analysis</h3>
      {apiErrors.cost_estimation ? (
        <AgentErrorMessage 
          agentName="cost estimation"
          error={apiErrors.cost_estimation}
          handleRetryAgentData={handleRetryAgentData}
        />
      ) : workflowData.cost ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Monthly Cost</h4>
              <p className="text-2xl font-bold mt-1">${workflowData.cost.details.monthly_cost?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Cost Tier</h4>
              <p className="text-2xl font-bold mt-1">{workflowData.cost.details.cost_tier || "Unknown"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Resources Analyzed</h4>
              <p className="text-2xl font-bold mt-1">{workflowData.cost.details.analyzed_resources?.length || 0}</p>
            </div>
          </div>
          
          {costBreakdown.length > 0 && (
            <>
              <h4 className="text-lg font-medium mb-4">Cost Breakdown</h4>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    width={500}
                    height={300}
                    data={costBreakdown}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          
          <h4 className="text-lg font-medium mb-2">Optimization Opportunities</h4>
          {workflowData.cost.details.optimization_opportunities?.length > 0 ? (
            <div className="space-y-4">
              {workflowData.cost.details.optimization_opportunities.map((opt, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ${opt.estimated_savings || "?"}/month
                        </span>
                        <span className="ml-2 font-medium">{opt.title}</span>
                      </div>
                      <p className="mt-2">{opt.description}</p>
                    </div>
                    <div>
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg flex items-center">
              <DollarSign className="w-6 h-6 text-green-500 mr-3" />
              <p className="text-green-700">No cost optimizations found. Your infrastructure is cost-efficient!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
};

export default Cost;
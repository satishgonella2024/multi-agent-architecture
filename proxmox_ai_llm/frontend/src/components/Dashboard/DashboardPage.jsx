// proxmox_ai_llm/frontend/src/components/Dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Server, Clock, CheckCircle, AlertTriangle, ChevronRight,Shield } from 'lucide-react';
import { getRecentWorkflows } from '../../services/workflowService';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [recentWorkflows, setRecentWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch workflows when component mounts
    const fetchWorkflows = async () => {
      try {
        const data = await getRecentWorkflows();
        
        // Split into active and completed workflows
        const active = data.filter(w => 
          w.status === 'running' || w.status === 'pending'
        );
        
        const recent = data.filter(w => 
          w.status === 'completed' || w.status === 'failed'
        ).slice(0, 5); // Only show 5 most recent completed workflows
        
        setActiveWorkflows(active);
        setRecentWorkflows(recent);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching workflows:', error);
        setLoading(false);
      }
    };
    
    fetchWorkflows();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchWorkflows, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <button
          onClick={() => navigate('/new-analysis')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle size={18} className="mr-2" />
          New Analysis
        </button>
      </div>
      
      {/* Active workflows section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Active Workflows</h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {activeWorkflows.length} Active
          </span>
        </div>
        
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : activeWorkflows.length > 0 ? (
          <div className="space-y-4">
            {activeWorkflows.map(workflow => (
              <div 
                key={workflow.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/workflow/${workflow.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Server className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{workflow.description || 'Infrastructure Analysis'}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        <span>Started {formatTimeAgo(workflow.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(workflow.status)}`}>
                    {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                  </span>
                </div>
                
                {/* Progress indicators */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {['command', 'generator', 'security', 'architect'].map(agent => {
                    const isComplete = workflow.completedAgents?.includes(agent);
                    const isActive = workflow.startedAgents?.includes(agent) && !isComplete;
                    
                    return (
                      <div key={agent} className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          isComplete ? 'bg-green-500' : 
                          isActive ? 'bg-blue-500 animate-pulse' : 
                          'bg-gray-300'
                        }`}></div>
                        <span className="text-xs text-gray-600 capitalize">{agent}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(
                          100, 
                          ((workflow.completedAgents?.length || 0) / 
                          (Object.keys(workflow.startedAgents || {}).length || 1)) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No active workflows</p>
            <button
              onClick={() => navigate('/new-analysis')}
              className="mt-2 text-indigo-600 hover:text-indigo-800"
            >
              Start a new analysis
            </button>
          </div>
        )}
      </div>
      
      {/* Recent workflows section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Recent Analyses</h2>
          <button
            onClick={() => navigate('/history')}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            View all
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
        
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : recentWorkflows.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scores
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentWorkflows.map(workflow => (
                  <tr 
                    key={workflow.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/workflow/${workflow.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {workflow.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {workflow.description || 'Infrastructure Analysis'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatTimeAgo(workflow.completedAt || workflow.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
                        {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {workflow.scores?.security && (
                          <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            Security: {workflow.scores.security}
                          </div>
                        )}
                        {workflow.scores?.cost && (
                          <div className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                            Cost: {workflow.scores.cost}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No completed analyses yet</p>
          </div>
        )}
      </div>
      
      {/* Quick stats section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Infrastructure Overview</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Resources</p>
              <p className="text-2xl font-semibold text-gray-900">
                {recentWorkflows.reduce(
                  (sum, workflow) => sum + (workflow.resourceCount || 0), 
                  0
                )}
              </p>
            </div>
            <Server className="h-10 w-10 text-indigo-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Security Score</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Average</p>
              <p className="text-2xl font-semibold text-gray-900">
                {recentWorkflows.length ? 
                  Math.round(
                    recentWorkflows.reduce(
                      (sum, workflow) => sum + (workflow.scores?.security || 0), 
                      0
                    ) / recentWorkflows.length
                  ) : 
                  'N/A'
                }
              </p>
            </div>
            <Shield className="h-10 w-10 text-indigo-200" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Cost Efficiency</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Average Monthly</p>
              <p className="text-2xl font-semibold text-gray-900">
                {recentWorkflows.length && 
                 recentWorkflows.some(w => w.monthlyCost) ? 
                  `$${Math.round(
                    recentWorkflows.reduce(
                      (sum, workflow) => sum + (workflow.monthlyCost || 0), 
                      0
                    ) / recentWorkflows.filter(w => w.monthlyCost).length
                  )}` : 
                  'N/A'
                }
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-indigo-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Missing components
const DollarSign = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={2}
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

export default DashboardPage;
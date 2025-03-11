// proxmox_ai_llm/frontend/src/components/Analysis/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, ArrowDownUp, Filter, RefreshCw, Server, Shield, Database, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { getRecentWorkflows } from '../../services/workflowService';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'failed'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
  
  // Fetch all workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        // Get more workflows for history page
        const data = await getRecentWorkflows(50);
        setWorkflows(data);
        setFilteredWorkflows(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching workflows:', error);
        setLoading(false);
      }
    };
    
    fetchWorkflows();
  }, []);
  
  // Apply filters and search
  useEffect(() => {
    let result = [...workflows];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(workflow => workflow.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(workflow => 
        (workflow.description && workflow.description.toLowerCase().includes(lowercasedSearch)) ||
        (workflow.id && workflow.id.toLowerCase().includes(lowercasedSearch)) ||
        (workflow.prompt && workflow.prompt.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    // Apply sort order
    result = result.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.createdAt);
      const dateB = new Date(b.completedAt || b.createdAt);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
    
    setFilteredWorkflows(result);
  }, [workflows, statusFilter, searchTerm, sortOrder]);
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Handle refresh button
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await getRecentWorkflows(50);
      setWorkflows(data);
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing workflows:', error);
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Workflow History</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          disabled={loading}
        >
          <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Filters section */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search by description or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status filter */}
            <div className="relative inline-block">
              <div className="flex items-center">
                <Filter size={16} className="text-gray-400 mr-1" />
                <select
                  className="block pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                </select>
              </div>
            </div>
            
            {/* Sort order */}
            <div className="relative inline-block">
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-1" />
                <select
                  className="block pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            
            {/* Results count */}
            <span className="text-sm text-gray-500">
              {filteredWorkflows.length} results
            </span>
          </div>
        </div>
        
        {/* Workflows table */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredWorkflows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resources
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWorkflows.map(workflow => (
                  <tr 
                    key={workflow.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/workflow/${workflow.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {workflow.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        ) : workflow.status === 'failed' ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                        ) : workflow.status === 'running' ? (
                          <RefreshCw className="h-5 w-5 text-blue-500 mr-2 animate-spin flex-shrink-0" />
                        ) : (
                          <Server className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                        )}
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {workflow.description || 'Infrastructure Analysis'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {workflow.id ? workflow.id.substring(0, 8) + '...' : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(workflow.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {workflow.completedAt ? formatDate(workflow.completedAt) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                        workflow.status === 'failed' ? 'bg-red-100 text-red-800' :
                        workflow.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.status ? workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-1">
                        {workflow.resourceCount ? (
                          <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {workflow.resourceCount}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <p>No workflows found matching your filters.</p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => navigate('/new-analysis')}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Start a new analysis
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
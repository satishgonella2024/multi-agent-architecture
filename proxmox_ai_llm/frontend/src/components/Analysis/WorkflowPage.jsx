// proxmox_ai_llm/frontend/src/components/Analysis/WorkflowPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../UI/Tabs';
import { RefreshCw, AlertCircle, Clock, Server, Shield, Database, FileCode, Check, AlertTriangle } from 'lucide-react';
import { getWorkflowDetails } from '../../services/workflowService';
import AgentWorkflow from '../InfrastructureVisualization/AgentWorkflow';
import ScoreGauge from '../UI/ScoreGauge';
import LoadingIndicator from '../UI/LoadingIndicator';
import ErrorDisplay from '../UI/ErrorDisplay';

// Import specific result panels
import SecurityResultsPanel from './ResultPanels/SecurityResultsPanel';
import ArchitectureResultsPanel from './ResultPanels/ArchitectureResultsPanel';
import CostResultsPanel from './ResultPanels/CostResultsPanel';
import ValidationResultsPanel from './ResultPanels/ValidationResultsPanel.jsx';

const WorkflowPage = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  
  const [workflowData, setWorkflowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Fetch workflow data
  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      const data = await getWorkflowDetails(workflowId);
      setWorkflowData(data);
      setError(null);
      
      // If workflow is complete or failed, don't continue polling
      if (data.status === 'PASSED' || data.status === 'failed') {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError('Failed to load workflow data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on initial load
  useEffect(() => {
    fetchWorkflowData();
    
    // Start polling if workflow is in progress
    if (!refreshInterval) {
      const interval = setInterval(fetchWorkflowData, 5000);
      setRefreshInterval(interval);
    }
    
    // Clean up interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [workflowId]);
  
  // Handle agent selection
  const handleAgentClick = (agentId) => {
    setSelectedAgent(agentId);
    // Switch to the agent's tab if it's one of the main agents
    if (['security', 'architect', 'validator', 'cost_estimation'].includes(agentId)) {
      const tabMap = {
        security: 'security',
        architect: 'architecture',
        validator: 'validation',
        cost_estimation: 'cost'
      };
      setActiveTab(tabMap[agentId]);
    }
  };
  
  // Format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get workflow status
  const getWorkflowStatus = () => {
    if (!workflowData) return 'unknown';
    
    if (workflowData.status === 'completed') {
      return 'completed';
    } else if (workflowData.status === 'failed') {
      return 'failed';
    } else if (workflowData.completed_agents && workflowData.completed_agents.length > 0) {
      return 'in_progress';
    } else {
      return 'pending';
    }
  };
  
  // Get score for category
  const getScore = (category) => {
    if (!workflowData || !workflowData.results) return 0;
    
    const categoryMap = {
      security: 'security',
      architecture: 'architect',
      cost: 'cost',
      validation: 'validation'
    };
    
    const result = workflowData.results[categoryMap[category]];
    if (!result) return 0;
    
    // Extract score based on the category
    if (category === 'security' && result.score) {
      return result.score;
    } else if (category === 'architecture' && result.architectureScore) {
      return result.architectureScore;
    } else if (category === 'cost' && result.costEfficiencyScore) {
      return result.costEfficiencyScore;
    } else if (category === 'validation' && result.validationScore) {
      return result.validationScore;
    }
    
    return 0;
  };
  
  if (loading && !workflowData) {
    return <LoadingIndicator message={`Loading workflow data for ${workflowId.substring(0, 8)}...`} />;
  }
  
  if (error && !workflowData) {
    return (
      <ErrorDisplay 
        message="Failed to load workflow data" 
        error={error}
        retry={fetchWorkflowData}
      />
    );
  }
  
  const workflowStatus = getWorkflowStatus();
  
  return (
    <div className="space-y-6">
      {/* Workflow header information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {workflowData?.prompt?.substring(0, 50) || 'Infrastructure Analysis'}
              {workflowData?.prompt?.length > 50 ? '...' : ''}
            </h1>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Clock size={16} className="mr-1" />
              Created: {formatTimestamp(workflowData?.timestamp)}
            </div>
          </div>
          
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm ${
              workflowStatus === 'completed' ? 'bg-green-100 text-green-800' :
              workflowStatus === 'failed' ? 'bg-red-100 text-red-800' :
              workflowStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {workflowStatus === 'completed' ? 'Completed' :
              workflowStatus === 'failed' ? 'Failed' :
              workflowStatus === 'in_progress' ? 'In Progress' :
              'Pending'}
            </span>
            
            <button
              onClick={fetchWorkflowData}
              className="ml-3 p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
              title="Refresh workflow data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {workflowData?.prompt && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Original Prompt</h3>
            <p className="text-gray-600">{workflowData.prompt}</p>
          </div>
        )}
        
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Workflow ID</div>
            <div className="font-medium text-gray-900">{workflowId.substring(0, 12)}...</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Agents</div>
            <div className="font-medium text-gray-900">
              {workflowData?.completed_agents?.length || 0} / 
              {workflowData?.started_agents?.length || 0}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <div className={`font-medium ${
              workflowStatus === 'completed' ? 'text-green-600' :
              workflowStatus === 'failed' ? 'text-red-600' :
              workflowStatus === 'in_progress' ? 'text-blue-600' :
              'text-yellow-600'
            }`}>
              {workflowStatus === 'completed' ? 'Completed' :
              workflowStatus === 'failed' ? 'Failed' :
              workflowStatus === 'in_progress' ? 'In Progress' :
              'Pending'}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Completed At</div>
            <div className="font-medium text-gray-900">
              {workflowData?.completed_timestamp ? 
                formatTimestamp(workflowData.completed_timestamp) : 
                'In progress'
              }
            </div>
          </div>
        </div>
      </div>
      
      {/* Agent workflow visualization */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Agent Communication Network</h2>
          <div className="text-sm text-gray-500">
            Workflow ID: {workflowId.substring(0, 8)}...
          </div>
        </div>
        
        <AgentWorkflow 
          workflowId={workflowId} 
          onAgentClick={handleAgentClick}
        />
      </div>
      
      {/* Results tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-xl shadow-md">
        <div className="p-4 border-b border-gray-200">
          <TabsList className="grid grid-cols-5 gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-6">
          {/* Overview Tab */}
          <TabsContent value="overview">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Analysis Summary</h3>
            
            {workflowStatus === 'completed' || workflowStatus === 'failed' ? (
              <>
                {/* Score gauges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
                  <ScoreGauge 
                    title="Security" 
                    score={getScore('security')} 
                    icon={<Shield className="h-5 w-5 text-blue-500" />} 
                    color="blue"
                  />
                  <ScoreGauge 
                    title="Architecture" 
                    score={getScore('architecture')} 
                    icon={<Server className="h-5 w-5 text-yellow-500" />} 
                    color="yellow"
                  />
                  <ScoreGauge 
                    title="Cost Efficiency" 
                    score={getScore('cost')} 
                    icon={<DollarSign className="h-5 w-5 text-green-500" />} 
                    color="green"
                  />
                  <ScoreGauge 
                    title="Validation" 
                    score={getScore('validation')} 
                    icon={<CheckSquare className="h-5 w-5 text-orange-500" />} 
                    color="orange"
                  />
                </div>
                
                {/* Key findings */}
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Key Findings</h4>
                  <div className="space-y-3">
                    {workflowData?.results?.security?.issues?.slice(0, 2).map((issue, index) => (
                      <div key={`security-${index}`} className="flex items-start p-3 bg-red-50 text-red-800 rounded-md">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Security Issue: </span>
                          {issue.description || issue.message || 'Security vulnerability detected'}
                        </div>
                      </div>
                    ))}
                    
                    {workflowData?.results?.architect?.suggestions?.slice(0, 2).map((suggestion, index) => (
                      <div key={`arch-${index}`} className="flex items-start p-3 bg-yellow-50 text-yellow-800 rounded-md">
                        <Lightbulb className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Architecture Suggestion: </span>
                          {suggestion.description || suggestion.message || 'Architecture improvement suggested'}
                        </div>
                      </div>
                    ))}
                    
                    {workflowData?.results?.cost?.optimization_suggestions?.slice(0, 2).map((suggestion, index) => (
                      <div key={`cost-${index}`} className="flex items-start p-3 bg-green-50 text-green-800 rounded-md">
                        <TrendingDown className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Cost Optimization: </span>
                          {suggestion.description || 'Cost optimization opportunity identified'}
                          {suggestion.potential_savings && (
                            <span className="ml-1 font-medium">
                              (Save ${suggestion.potential_savings}/month)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {workflowData?.results?.validation?.issues?.slice(0, 2).map((issue, index) => (
                      <div key={`validation-${index}`} className="flex items-start p-3 bg-orange-50 text-orange-800 rounded-md">
                        <AlertOctagon className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Validation Issue: </span>
                          {issue.description || issue.message || 'Validation issue detected'}
                        </div>
                      </div>
                    ))}
                    
                    {(!workflowData?.results?.security?.issues || workflowData.results.security.issues.length === 0) &&
                     (!workflowData?.results?.architect?.suggestions || workflowData.results.architect.suggestions.length === 0) &&
                     (!workflowData?.results?.cost?.optimization_suggestions || workflowData.results.cost.optimization_suggestions.length === 0) &&
                     (!workflowData?.results?.validation?.issues || workflowData.results.validation.issues.length === 0) && (
                      <div className="flex items-start p-3 bg-blue-50 text-blue-800 rounded-md">
                        <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium">No major issues detected.</span> Your infrastructure design looks good overall.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Generated Terraform Code Preview */}
                {workflowData?.results?.generator?.terraform && (
                  <div className="mt-8">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Generated Terraform Code</h4>
                    <div className="bg-gray-800 rounded-md text-white p-2 overflow-x-auto">
                      <pre className="text-sm">
                        <code>
                          {workflowData.results.generator.terraform.substring(0, 500)}
                          {workflowData.results.generator.terraform.length > 500 ? 
                            '...\n\n[Click on "Architecture" tab to see the full code]' : ''}
                        </code>
                      </pre>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                <p>Analysis in progress. Please wait...</p>
                <p className="text-sm mt-1">
                  Completed agents: {workflowData?.completed_agents?.length || 0} / 
                  {workflowData?.started_agents?.length || 0}
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <SecurityResultsPanel 
              results={workflowData?.results?.security}
              status={workflowStatus}
            />
          </TabsContent>
          
          {/* Architecture Tab */}
          <TabsContent value="architecture">
            <ArchitectureResultsPanel 
              results={workflowData?.results?.architect}
              terraform={workflowData?.results?.generator?.terraform}
              status={workflowStatus}
            />
          </TabsContent>
          
          {/* Cost Analysis Tab */}
          <TabsContent value="cost">
            <CostResultsPanel 
              results={workflowData?.results?.cost}
              status={workflowStatus}
            />
          </TabsContent>
          
          {/* Validation Tab */}
          <TabsContent value="validation">
            <ValidationResultsPanel 
              results={workflowData?.results?.validation}
              status={workflowStatus}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Missing components for icons
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

const CheckSquare = ({ className }) => (
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
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

const Lightbulb = ({ className }) => (
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
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
  </svg>
);

const TrendingDown = ({ className }) => (
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
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

const AlertOctagon = ({ className }) => (
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
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default WorkflowPage;
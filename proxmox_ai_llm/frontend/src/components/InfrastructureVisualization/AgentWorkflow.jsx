// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/AgentWorkflow.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { DEFAULT_AGENT_POSITIONS } from './utils/agentUtils';
import { useWorkflowData } from '../../hooks/useWorkflowData';
import AgentNetwork from './components/AgentNetwork';
import MessageLog from './components/MessageLog';
import NetworkMetrics from './components/NetworkMetrics';
import AgentInfo from './components/AgentInfo';
import StatusLegend from './components/StatusLegend';
import AgentPerformance from './components/AgentPerformance';
import LoadingIndicator from '../Dashboard/common/LoadingIndicator';
import ErrorState from '../Dashboard/common/ErrorState';

/**
 * Displays a visualization of agent communication in a workflow
 * Connects to real workflow data from the API
 */
const AgentWorkflow = ({ workflowId, onAgentClick }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeMessage, setActiveMessage] = useState(null);
  
  // Fetch real workflow data from API
  const {
    loading,
    error,
    status,
    messages,
    agentStates,
    metrics,
    refreshData
  } = useWorkflowData(workflowId);
  
  // Determine if workflow is active/running
  const isWorkflowActive = status?.state === 'RUNNING' || status?.state === 'PENDING';
  const hasError = Object.values(agentStates || {}).includes('error') || status?.state === 'FAILED';
  
  // Handle agent selection
  const handleAgentSelect = (agentId) => {
    setSelectedAgent(agentId);
    
    // Call onAgentClick callback if provided
    if (agentId && onAgentClick) {
      onAgentClick(agentId);
    }
  };
  
  // Animate messages when they arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Get most recent message for animation
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage && latestMessage.from && latestMessage.to) {
        setActiveMessage({
          from: latestMessage.from,
          to: latestMessage.to,
          progress: 0
        });
        
        // Animate progress
        let progress = 0;
        const animationInterval = setInterval(() => {
          progress += 0.05;
          if (progress <= 1) {
            setActiveMessage(prev => ({
              ...prev,
              progress
            }));
          } else {
            clearInterval(animationInterval);
            setActiveMessage(null);
          }
        }, 50);
        
        // Clean up interval
        return () => clearInterval(animationInterval);
      }
    }
  }, [messages]);
  
  // Calculate workflow ID to display
  const displayWorkflowId = workflowId || (status?.id ? status.id : 'No workflow');
  
  // Show loading state
  if (loading && !agentStates) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <LoadingIndicator message="Loading workflow data..." />
      </div>
    );
  }
  
  // Show error state
  if (error && !agentStates) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <ErrorState 
          message="Failed to load workflow data" 
          error={error}
          retry={refreshData}
        />
      </div>
    );
  }
  
  // Status description
  const getStatusDescription = () => {
    if (hasError) return 'Issues Detected';
    if (status?.state === 'COMPLETED') return 'All Tasks Complete';
    if (isWorkflowActive) return 'In Progress';
    return status?.state || 'Unknown';
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transition-all duration-300" style={{ height: 'auto', maxHeight: '800px', overflow: 'hidden' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Cpu className="h-6 w-6 text-indigo-600 mr-2" />
          Agent Communication Network
          {isWorkflowActive && (
            <span className="ml-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Live
            </span>
          )}
        </h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Workflow ID: {displayWorkflowId}</span>
          <div className="h-4 border-r border-gray-300 mx-1"></div>
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            hasError 
              ? 'bg-red-100 text-red-800' 
              : status?.state === 'COMPLETED'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
          }`}>
            {getStatusDescription()}
          </span>
          <button 
            onClick={refreshData}
            className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
            title="Refresh workflow data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column */}
        <div className="w-full md:w-7/12 flex flex-col">
          {/* Network visualization */}
          <div className="bg-gray-50 border rounded-lg p-4 h-full shadow-inner transition-all duration-300 mb-4">
            <AgentNetwork 
              agentPositions={DEFAULT_AGENT_POSITIONS}
              agentStates={agentStates || {}}
              selectedAgent={selectedAgent}
              onCanvasClick={handleAgentSelect}
              activeMessage={activeMessage}
            />
            
            {/* Agent info tooltip */}
            {selectedAgent && agentStates && (
              <AgentInfo 
                agentId={selectedAgent}
                agentState={agentStates[selectedAgent]}
                onSimulateError={null} // Remove simulation actions for real workflows
                onMarkComplete={null} // Remove simulation actions for real workflows
              />
            )}
          </div>
        </div>
        
        {/* Right panel */}
        <div className="w-full md:w-5/12">
          {/* Network metrics */}
          <NetworkMetrics metrics={metrics} />
          
          {/* Communication log */}
          <MessageLog 
            messages={messages || []}
            selectedAgent={selectedAgent}
            setSelectedAgent={setSelectedAgent}
          />
          
          {/* Agent Performance Visualization */}
          <AgentPerformance 
            completionRate={metrics?.completionRate || 0}
            hasError={hasError}
          />
        </div>
      </div>
      
      <div className="mt-6 flex justify-between items-center border-t pt-4">
        <StatusLegend />
        
        <div className="text-sm text-gray-500">
          {loading ? (
            <span className="flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </span>
          ) : (
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentWorkflow;
// Updated useWorkflow.js
import { useState, useEffect, useCallback } from 'react';
import { getWorkflowStatus, getWorkflowOutputs } from '../services/workflowService';
import { getSecurityAnalysis, getCostAnalysis, getValidationResults, getArchitectureAnalysis } from '../services/agentServices';
import { WorkflowSocket } from '../services/websocketService';

export function useWorkflow(workflowId) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowData, setWorkflowData] = useState({
    status: 'loading',
    completedAgents: [],
    pendingAgents: [],
    security: null,
    cost: null,
    architecture: null,
    validation: null
  });
  const [websocket, setWebsocket] = useState(null);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket message received:', data);
    
    // If an agent has completed, refresh that specific agent's data
    if (data.event_type === 'agent_completed') {
      const agentName = data.agent;
      
      // Update workflow data with the new agent status
      setWorkflowData(prevData => ({
        ...prevData,
        completedAgents: [...new Set([...prevData.completedAgents, agentName])],
        pendingAgents: prevData.pendingAgents.filter(a => a !== agentName)
      }));
      
      // Refresh the specific agent data
      refreshAgentData(agentName);
    }
  }, [workflowId]);

  // Function to refresh data for a specific agent
  const refreshAgentData = async (agentName) => {
    if (!workflowId) return;
    
    try {
      console.log(`Refreshing data for agent: ${agentName}`);
      let data;
      
      switch (agentName) {
        case 'security':
          data = await getSecurityAnalysis(workflowId);
          setWorkflowData(prev => ({ ...prev, security: data }));
          break;
        
        case 'cost_estimation':
          data = await getCostAnalysis(workflowId);
          setWorkflowData(prev => ({ ...prev, cost: data }));
          break;
        
        case 'architect':
          data = await getArchitectureAnalysis(workflowId);
          setWorkflowData(prev => ({ ...prev, architecture: data }));
          break;
        
        case 'validator':
          data = await getValidationResults(workflowId);
          setWorkflowData(prev => ({ ...prev, validation: data }));
          break;
        
        default:
          console.warn(`Unknown agent name: ${agentName}`);
      }
    } catch (err) {
      console.error(`Error refreshing data for agent ${agentName}:`, err);
    }
  };

  // Initialize workflow data loading and WebSocket
  useEffect(() => {
    if (!workflowId) {
      setIsLoading(false);
      return;
    }
    
    console.log("Setting up workflow with ID:", workflowId);
    
    // Create and connect WebSocket
    const workflowSocket = new WorkflowSocket(workflowId, handleWebSocketMessage);
    workflowSocket.connect();
    setWebsocket(workflowSocket);
    
    // Load initial workflow data
    loadWorkflowData();
    
    // Set up polling for workflow status updates
    const statusInterval = setInterval(() => {
      getWorkflowStatus(workflowId)
        .then(status => {
          setWorkflowData(prev => ({
            ...prev,
            status: status.status,
            completedAgents: status.completed_agents || [],
            pendingAgents: (status.started_agents || []).filter(
              agent => !(status.completed_agents || []).includes(agent)
            )
          }));
          
          // If workflow is complete, clear interval
          if (status.status === 'completed') {
            clearInterval(statusInterval);
          }
        })
        .catch(err => console.error("Error polling workflow status:", err));
    }, 2000); // Poll every 2 seconds
    
    // Cleanup on unmount
    return () => {
      if (workflowSocket) {
        workflowSocket.disconnect();
      }
      clearInterval(statusInterval);
    };
  }, [workflowId]);

  // Function to load all workflow data
  const loadWorkflowData = async () => {
    if (!workflowId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading workflow data for ID:", workflowId);
      
      // Get workflow status
      const status = await getWorkflowStatus(workflowId);
      console.log("Workflow status:", status);
      
      // Update workflow status
      setWorkflowData(prev => ({
        ...prev,
        status: status.status,
        completedAgents: status.completed_agents || [],
        pendingAgents: (status.started_agents || []).filter(
          agent => !(status.completed_agents || []).includes(agent)
        )
      }));
      
      // Load data for completed agents
      const completedAgents = status.completed_agents || [];
      
      const promises = [];
      
      if (completedAgents.includes('security')) {
        promises.push(refreshAgentData('security'));
      }
      
      if (completedAgents.includes('cost_estimation')) {
        promises.push(refreshAgentData('cost_estimation'));
      }
      
      if (completedAgents.includes('architect')) {
        promises.push(refreshAgentData('architect'));
      }
      
      if (completedAgents.includes('validator')) {
        promises.push(refreshAgentData('validator'));
      }
      
      // Wait for all data to load
      await Promise.all(promises);
      
    } catch (err) {
      console.error('Error loading workflow data:', err);
      setError('Failed to load workflow data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Return the workflow data and control functions
  return {
    isLoading,
    error,
    workflowData,
    refreshAgentData,
    refreshAllData: loadWorkflowData
  };
}
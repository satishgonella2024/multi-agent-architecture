// proxmox_ai_llm/frontend/src/hooks/useWorkflowData.js
import { useState, useEffect, useCallback } from 'react';
import { getWorkflowStatus, getWorkflowOutputs } from '../services/workflowService';

/**
 * Hook to fetch and manage real workflow data from the backend API
 */
export const useWorkflowData = (workflowId, refreshInterval = 3000) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowData, setWorkflowData] = useState({
    status: {},
    outputs: [],
    messages: [],
    agentStates: {},
    metrics: {
      totalMessages: 0,
      averageResponseTime: 0,
      completionRate: 0
    }
  });
  
  // Function to transform API data into the format expected by the UI components
  const transformWorkflowData = useCallback((status, outputs) => {
    // Extract agent states from status
    const agentStates = {};
    if (status?.agents) {
      Object.entries(status.agents).forEach(([agentId, agentData]) => {
        // Map API state values to UI state values
        let uiState = 'idle';
        if (agentData.state === 'RUNNING') uiState = 'processing';
        else if (agentData.state === 'COMPLETED') uiState = 'completed';
        else if (agentData.state === 'FAILED') uiState = 'error';
        else if (agentData.state === 'ACTIVE') uiState = 'active';
        
        agentStates[agentId] = uiState;
      });
    }
    
    // Extract messages from outputs
    const messages = [];
    if (outputs && Array.isArray(outputs)) {
      outputs.forEach(output => {
        if (output.from && output.to && output.content) {
          messages.push({
            id: output.id || output.timestamp || Date.now(),
            from: output.from,
            to: output.to,
            content: output.content,
            rawTimestamp: output.timestamp ? new Date(output.timestamp) : new Date(),
            timestamp: output.timestamp 
              ? new Date(output.timestamp).toLocaleTimeString() 
              : new Date().toLocaleTimeString()
          });
        }
      });
    }
    
    // Calculate metrics
    const totalMessages = messages.length;
    
    // Calculate completion rate based on agent states
    const completedAgents = Object.values(agentStates).filter(state => state === 'completed').length;
    const totalAgents = Object.keys(agentStates).length - 1; // Exclude orchestrator
    const completionRate = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0;
    
    // Calculate average response time if timestamps are available
    let averageResponseTime = 0;
    if (messages.length > 1) {
      let totalTime = 0;
      let validIntervals = 0;
      
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i-1].rawTimestamp || 0).getTime();
        const currTime = new Date(messages[i].rawTimestamp || 0).getTime();
        
        if (prevTime > 0 && currTime > 0) {
          totalTime += (currTime - prevTime);
          validIntervals++;
        }
      }
      
      averageResponseTime = validIntervals > 0 ? (totalTime / validIntervals) / 1000 : 0; // Convert to seconds
    }
    
    return {
      status,
      outputs,
      messages,
      agentStates,
      metrics: {
        totalMessages,
        averageResponseTime,
        completionRate
      }
    };
  }, []);
  
  // Function to fetch workflow data from the API
  const fetchWorkflowData = useCallback(async (signal) => {
    if (!workflowId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch both status and outputs in parallel
      const [statusResponse, outputsResponse] = await Promise.all([
        getWorkflowStatus(workflowId, { signal }),
        getWorkflowOutputs(workflowId, null, { signal })
      ]);
      
      // Transform the data for the UI
      const transformedData = transformWorkflowData(statusResponse, outputsResponse);
      setWorkflowData(transformedData);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching workflow data:', err);
        setError(err);
      }
      setLoading(false);
    }
  }, [workflowId, transformWorkflowData]);
  
  // Set up polling effect to periodically fetch workflow data
  useEffect(() => {
    // Create an abort controller for this effect
    const abortController = new AbortController();
    
    // Initial fetch
    fetchWorkflowData(abortController.signal);
    
    // Set up polling interval for active workflows
    let intervalId = null;
    if (workflowId && 
        (workflowData?.status?.state === 'RUNNING' || 
         workflowData?.status?.state === 'PENDING' || 
         loading)) {
      intervalId = setInterval(() => {
        fetchWorkflowData(abortController.signal);
      }, refreshInterval);
    }
    
    // Cleanup interval on unmount or when workflow is complete
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      abortController.abort();
    };
  }, [workflowId, workflowData?.status?.state, loading, fetchWorkflowData, refreshInterval]);
  
  // Function to manually refresh the data
  const refreshData = useCallback(() => {
    const abortController = new AbortController();
    fetchWorkflowData(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchWorkflowData]);
  
  return {
    loading,
    error,
    ...workflowData,
    refreshData
  };
};
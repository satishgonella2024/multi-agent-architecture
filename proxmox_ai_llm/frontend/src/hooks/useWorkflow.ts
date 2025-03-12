import { useState, useEffect, useCallback } from 'react';
import { AgentName, WorkflowData } from '../types/workflow';
import { useWebSocket } from './useWebSocket';
import { api } from '../services/api';

interface UseWorkflowResult {
  workflowData: WorkflowData | null;
  isLoading: boolean;
  error: string | null;
  refreshAgentData: (agentName: AgentName) => Promise<void>;
  refreshAllData: () => Promise<void>;
}

export function useWorkflow(workflowId: string | null): UseWorkflowResult {
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Only establish WebSocket connection if we have a workflowId
  const { lastMessage, error: wsError } = useWebSocket(
    workflowId ? `/ws/workflow/${workflowId}` : null
  );

  // Update our error state if the WebSocket has an error
  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);

  const fetchWorkflowData = useCallback(async () => {
    if (!workflowId) {
      setWorkflowData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<WorkflowData>(`/api/workflows/${workflowId}`);
      setWorkflowData(response.data);
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch workflow data';
      console.error('Error fetching workflow data:', errorMessage);
      
      // If we have a connection error and haven't exceeded max retries, try again
      if (
        errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('ECONNRESET') || 
        errorMessage.includes('Network Error')
      ) {
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          // Retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`Retrying fetch in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          
          setTimeout(() => {
            fetchWorkflowData();
          }, retryDelay);
        } else {
          setError(`${errorMessage} - Backend may be unavailable after ${MAX_RETRIES} attempts.`);
          // Keep any existing data we might have
        }
      } else {
        // For other errors, just set the error state and clear data
        setError(errorMessage);
        setWorkflowData(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [workflowId, retryCount]);

  const refreshAgentData = useCallback(async (agentName: AgentName) => {
    if (!workflowId) return;

    try {
      setError(null);
      const response = await api.get<WorkflowData>(`/api/workflows/${workflowId}/agents/${agentName}`);
      if (workflowData) {
        setWorkflowData({
          ...workflowData,
          results: {
            ...workflowData.results,
            [agentName]: response.data.results[agentName]
          }
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh agent data';
      
      // Don't overwrite existing data on connection errors
      if (
        errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('ECONNRESET') || 
        errorMessage.includes('Network Error')
      ) {
        setError(`${errorMessage} - Backend may be unavailable.`);
      } else {
        setError(errorMessage);
      }
      
      throw err;
    }
  }, [workflowId, workflowData]);

  const refreshAllData = useCallback(async () => {
    await fetchWorkflowData();
  }, [fetchWorkflowData]);

  useEffect(() => {
    if (workflowId) {
      // Reset retry count when workflowId changes
      setRetryCount(0);
      fetchWorkflowData();
    } else {
      setWorkflowData(null);
      setIsLoading(false);
      setError(null);
    }
  }, [workflowId, fetchWorkflowData]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage) as WorkflowData;
        setWorkflowData(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    }
  }, [lastMessage]);

  return {
    workflowData,
    isLoading,
    error,
    refreshAgentData,
    refreshAllData
  };
} 
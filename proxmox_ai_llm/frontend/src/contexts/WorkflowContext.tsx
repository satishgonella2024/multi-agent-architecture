import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WorkflowData } from '../types/workflow';
import { 
  getWorkflowHistory, 
  clearWorkflowHistory as apiClearWorkflowHistory,
  WorkflowHistoryItem as ApiWorkflowHistoryItem 
} from '../services/workflowHistoryService';

interface WorkflowHistoryItem {
  id: string;
  created_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'started';
  name?: string;
}

interface WorkflowContextType {
  currentWorkflow: WorkflowData | null;
  workflowHistory: WorkflowHistoryItem[];
  setCurrentWorkflow: (workflow: WorkflowData | null) => void;
  addWorkflowToHistory: (workflowId: string, prompt: string) => void;
  updateWorkflowStatus: (workflowId: string, status: WorkflowHistoryItem['status']) => void;
  clearWorkflowHistory: () => void;
  refreshWorkflowHistory: () => Promise<void>;
  isHistoryLoading: boolean;
}

const defaultContextValue: WorkflowContextType = {
  currentWorkflow: null,
  workflowHistory: [],
  setCurrentWorkflow: () => {},
  addWorkflowToHistory: () => {},
  updateWorkflowStatus: () => {},
  clearWorkflowHistory: () => {},
  refreshWorkflowHistory: async () => {},
  isHistoryLoading: false,
};

const WorkflowContext = createContext<WorkflowContextType>(defaultContextValue);

export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflowContext must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowData | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Fetch workflow history from API
  const refreshWorkflowHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const history = await getWorkflowHistory();
      if (history && Array.isArray(history)) {
        // Transform API response to match our WorkflowHistoryItem format
        const formattedHistory = history.map((item: ApiWorkflowHistoryItem) => ({
          id: item.workflow_id || item.id || '',
          created_at: item.created_at || new Date().toISOString(),
          status: (item.status || 'completed') as WorkflowHistoryItem['status'],
          name: item.prompt?.slice(0, 50) + (item.prompt?.length > 50 ? '...' : '') || `Workflow ${(item.workflow_id || '').slice(0, 8)}`
        }));
        setWorkflowHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Failed to fetch workflow history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // Fetch workflow history on initial load
  useEffect(() => {
    refreshWorkflowHistory();
  }, [refreshWorkflowHistory]);

  const addWorkflowToHistory = useCallback((workflowId: string, prompt: string) => {
    const newHistoryItem: WorkflowHistoryItem = {
      id: workflowId,
      created_at: new Date().toISOString(),
      status: 'started',
      name: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '')
    };
    
    // Add to local state immediately for better UX
    setWorkflowHistory(prev => {
      // Check if this workflow is already in history to avoid duplicates
      const exists = prev.some(item => item.id === workflowId);
      if (exists) {
        return prev.map(item => 
          item.id === workflowId ? { ...item, status: 'started' } : item
        );
      }
      return [newHistoryItem, ...prev];
    });
    
    // Then refresh from API to ensure we have the latest data
    setTimeout(() => refreshWorkflowHistory(), 1000);
  }, [refreshWorkflowHistory]);

  const updateWorkflowStatus = useCallback((workflowId: string, status: WorkflowHistoryItem['status']) => {
    setWorkflowHistory(prev =>
      prev.map(item =>
        item.id === workflowId ? { ...item, status } : item
      )
    );
  }, []);

  const clearWorkflowHistory = useCallback(async () => {
    // In a real application, this would make an API call to clear history
    try {
      setIsHistoryLoading(true);
      const result = await apiClearWorkflowHistory();
      if (result.success) {
        setWorkflowHistory([]);
        localStorage.removeItem('currentWorkflowId');
      }
    } catch (error) {
      console.error('Failed to clear workflow history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const value = {
    currentWorkflow,
    workflowHistory,
    setCurrentWorkflow,
    addWorkflowToHistory,
    updateWorkflowStatus,
    clearWorkflowHistory,
    refreshWorkflowHistory,
    isHistoryLoading,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}; 
import { apiGet } from './api';

// Define the history response type
export interface WorkflowHistoryItem {
  workflow_id: string;
  id?: string;
  created_at: string;
  status: string;
  prompt?: string;
}

/**
 * Get the workflow history
 * @returns Promise with workflow history
 */
export async function getWorkflowHistory(): Promise<WorkflowHistoryItem[]> {
  try {
    // For now, return mock data since the API endpoint might not exist yet
    // In a real application, this would call the API
    // return apiGet<WorkflowHistoryItem[]>('/api/agents/event/history');
    
    // Mock data for testing
    const mockHistory: WorkflowHistoryItem[] = [
      {
        workflow_id: '8c629f88-54ab-445a-aebc-a377e7a56452',
        created_at: new Date().toISOString(),
        status: 'completed',
        prompt: 'Test infrastructure'
      }
    ];
    
    // Get any existing workflows from localStorage
    const currentWorkflowId = localStorage.getItem('currentWorkflowId');
    if (currentWorkflowId && !mockHistory.some(item => item.workflow_id === currentWorkflowId)) {
      mockHistory.unshift({
        workflow_id: currentWorkflowId,
        created_at: new Date().toISOString(),
        status: 'completed',
        prompt: 'Current workflow'
      });
    }
    
    return mockHistory;
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    // Return empty array if API fails
    return [];
  }
}

/**
 * Clear the workflow history
 * @returns Promise with success status
 */
export async function clearWorkflowHistory(): Promise<{ success: boolean }> {
  try {
    // In a real application, this would call the API
    // return apiPost<{ success: boolean }>('/api/agents/event/clear-history');
    
    // For now, just return success
    return { success: true };
  } catch (error) {
    console.error('Error clearing workflow history:', error);
    return { success: false };
  }
} 
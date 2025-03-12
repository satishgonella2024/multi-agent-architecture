import { apiGet, apiPost } from './api';
import { 
  WorkflowResponse, 
  WorkflowStatusResponse, 
  WorkflowOutputResponse,
  AgentName
} from '../types/workflow';

// Define interfaces for options and feedback
interface WorkflowOptions {
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
  max_tokens?: number;
  temperature?: number;
}

interface FeedbackData {
  workflow_id: string;
  rating: number;
  comments?: string;
}

/**
 * Start a new workflow with the given prompt
 * @param prompt The user's infrastructure request
 * @param options Optional workflow configuration
 * @returns Promise with workflow response
 */
export async function startWorkflow(
  prompt: string, 
  options: WorkflowOptions = {}
): Promise<WorkflowResponse> {
  // Format the request payload as expected by the API
  const data: any = {
    prompt,
    options: {
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      // Include other options if needed
      priority: options.priority,
      timeout: options.timeout
    }
  };
  
  // Remove undefined values
  Object.keys(data.options).forEach(key => {
    if (data.options[key] === undefined) {
      delete data.options[key];
    }
  });
  
  // If options object is empty, remove it
  if (Object.keys(data.options).length === 0) {
    delete data.options;
  }
  
  return apiPost<WorkflowResponse>('/api/agents/event/orchestrate', data);
}

/**
 * Get the current status of a workflow
 * @param workflowId The workflow ID to check
 * @returns Promise with workflow status
 */
export async function getWorkflowStatus(
  workflowId: string
): Promise<WorkflowStatusResponse> {
  return apiGet<WorkflowStatusResponse>(`/api/agents/event/status/${workflowId}`);
}

/**
 * Get the outputs from a workflow, optionally filtered by agent
 * @param workflowId The workflow ID to get outputs for
 * @param agent Optional agent name to filter outputs
 * @returns Promise with workflow outputs
 */
export async function getWorkflowOutputs(
  workflowId: string, 
  agent?: AgentName
): Promise<WorkflowOutputResponse> {
  const url = agent 
    ? `/api/agents/event/outputs/${workflowId}?agent=${agent}`
    : `/api/agents/event/outputs/${workflowId}`;
    
  return apiGet<WorkflowOutputResponse>(url);
}

/**
 * Submit feedback for a workflow
 * @param workflowId The workflow ID to submit feedback for
 * @param rating Numeric rating (1-5)
 * @param comments Optional feedback comments
 * @returns Promise with feedback submission response
 */
export async function submitFeedback(
  workflowId: string, 
  rating: number, 
  comments: string = ''
): Promise<{ success: boolean }> {
  const data: FeedbackData = {
    workflow_id: workflowId,
    rating,
    comments
  };
  
  return apiPost<{ success: boolean }>('/api/agents/event/feedback', data);
} 
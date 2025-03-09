// proxmox_ai_llm/frontend/src/services/workflowService.js
import { apiGet, apiPost } from './api';

export async function startWorkflow(prompt, options = {}) {
  const data = {
    prompt,
    ...options
  };
  
  return apiPost('/api/agents/event/orchestrate', data);
}

export async function getWorkflowStatus(workflowId) {
  return apiGet(`/api/agents/event/status/${workflowId}`);
}

export async function getWorkflowOutputs(workflowId, agent = null) {
  const url = agent 
    ? `/api/agents/event/outputs/${workflowId}?agent=${agent}`
    : `/api/agents/event/outputs/${workflowId}`;
    
  return apiGet(url);
}

export async function submitFeedback(workflowId, rating, comments = '') {
  return apiPost('/api/agents/event/feedback', {
    workflow_id: workflowId,
    rating,
    comments
  });
}
// proxmox_ai_llm/frontend/src/services/workflowService.js
import { apiGet, apiPost } from './api';

export async function startWorkflow(prompt, options = {}) {
  const data = {
    prompt,
    ...options
  };
  return apiPost('/api/agents/event/orchestrate', data);
}

export async function getWorkflowStatus(workflowId, options = {}) {
  return apiGet(`/api/agents/event/status/${workflowId}`, options);
}

export async function getWorkflowOutputs(workflowId, agent = null, options = {}) {
  const url = agent
    ? `/api/agents/event/outputs/${workflowId}?agent=${agent}`
    : `/api/agents/event/outputs/${workflowId}`;
  return apiGet(url, options);
}

export async function submitFeedback(workflowId, rating, comments = '', options = {}) {
  return apiPost('/api/agents/event/feedback', {
    workflow_id: workflowId,
    rating,
    comments
  }, options);
}

export async function getRecentWorkflows(limit = 10, options = {}) {
  try {
    const response = await apiGet(`/api/agents/event/workflows?limit=${limit}`, options);
    return response || [];
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error fetching recent workflows:', error);
    }
    return [];
  }
}

export async function getWorkflowDetails(workflowId, options = {}) {
  try {
    // Get basic workflow status
    const status = await getWorkflowStatus(workflowId, options);
    
    // Get all agent outputs
    const outputs = await getWorkflowOutputs(workflowId, null, options);
    
    // Get specific agent results if workflow is complete
    let agentResults = {};
    
    if (status && (status.status === 'completed' || status.status === 'partial_failure')) {
      // Fetch results from each agent in parallel
      const agents = ['security', 'architect', 'cost', 'validation'];
      const results = await Promise.all(
        agents.map(agent => 
          apiGet(`/api/agents/${agent}/${workflowId}`, options).catch(err => null)
        )
      );
      
      // Combine results
      agents.forEach((agent, index) => {
        if (results[index]) {
          agentResults[agent] = results[index];
        }
      });
    }
    
    // Combine all data
    return {
      ...status,
      outputs,
      results: agentResults
    };
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(`Error fetching workflow details for ${workflowId}:`, error);
    }
    throw error;
  }
}
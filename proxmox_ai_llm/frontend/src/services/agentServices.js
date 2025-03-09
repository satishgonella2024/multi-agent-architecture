// proxmox_ai_llm/frontend/src/services/agentServices.js
import { apiGet, apiPost } from './api';

// Security service
export async function getSecurityAnalysis(workflowId) {
  return apiGet(`/api/agents/security/${workflowId}`);
}

// Cost service
export async function getCostAnalysis(workflowId) {
  return apiGet(`/api/agents/cost/${workflowId}`);
}

// Validation service
export async function getValidationResults(workflowId) {
  return apiGet(`/api/agents/validation/${workflowId}`);
}

// Architecture service
export async function getArchitectureAnalysis(workflowId) {
  return apiGet(`/api/agents/architect/${workflowId}`);
}
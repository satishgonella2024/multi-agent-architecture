// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/utils/agentUtils.js
import React from 'react';
import { FileText, Server, Shield, Database, Zap, BarChart2, Cpu, Activity } from 'lucide-react';

// Default agent positions for visualization
export const DEFAULT_AGENT_POSITIONS = {
  orchestrator: { x: 50, y: 50 },
  command: { x: 30, y: 25 },
  generator: { x: 15, y: 50 },
  security: { x: 30, y: 75 },
  architect: { x: 70, y: 75 },
  validator: { x: 70, y: 25 },
  costEstimation: { x: 85, y: 50 }
};

// Default agent states
export const DEFAULT_AGENT_STATES = {
  command: 'idle',
  generator: 'idle',
  security: 'idle',
  architect: 'idle',
  validator: 'idle',
  costEstimation: 'idle',
  orchestrator: 'active'
};

// Agent descriptions for tooltips
export const AGENT_DESCRIPTIONS = {
  orchestrator: "Coordinates all agent activities and manages workflow execution",
  command: "Analyzes and interprets user requests into actionable tasks",
  generator: "Creates infrastructure templates and deployment configurations",
  security: "Evaluates security vulnerabilities and compliance issues",
  architect: "Designs optimal architecture patterns and resource allocation",
  validator: "Verifies compliance with standards and best practices",
  costEstimation: "Calculates deployment costs and resource optimization"
};

// Get icon for an agent
export const getAgentIcon = (agentId) => {
  switch(agentId) {
    case 'command':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'generator':
      return <Server className="h-5 w-5 text-green-500" />;
    case 'security':
      return <Shield className="h-5 w-5 text-red-500" />;
    case 'architect':
      return <Database className="h-5 w-5 text-purple-500" />;
    case 'validator':
      return <Zap className="h-5 w-5 text-yellow-500" />;
    case 'costEstimation':
      return <BarChart2 className="h-5 w-5 text-indigo-500" />;
    case 'orchestrator':
      return <Cpu className="h-5 w-5 text-indigo-600" />;
    case 'user':
      return <Activity className="h-5 w-5 text-gray-800" />;
    default:
      return <Activity className="h-5 w-5 text-gray-500" />;
  }
};

// Simulate an error for an agent
export const simulateError = (agentId, agentStates, updateAgentState, updateMessageFlow, setNetworkMetrics) => {
  if (agentId && agentStates[agentId] !== 'error') {
    // Save previous state to restore later if needed
    const previousState = agentStates[agentId];
    
    // Update to error state
    updateAgentState(agentId, 'error');
    
    // Add error message
    updateMessageFlow(agentId, 'orchestrator', 'Error encountered during processing');
    updateMessageFlow('orchestrator', agentId, 'Requesting error details');
    updateMessageFlow(agentId, 'orchestrator', 'Resource allocation failed: insufficient permissions');
    
    // Update metrics to reflect error
    setNetworkMetrics(prev => ({
      ...prev,
      completionRate: Math.max(0, prev.completionRate - 15) // Reduce completion rate
    }));
  }
};
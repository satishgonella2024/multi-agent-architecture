import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../hooks/useWorkflow';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { AgentName, WorkflowData } from '../../types/workflow';

type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

interface AgentConfig {
  label: string;
  description: string;
  dependencies: AgentName[];
  level: number;
}

const AGENT_CONFIG: Record<AgentName, AgentConfig> = {
  command: {
    label: 'Command',
    description: 'Processes user commands and initializes workflows',
    dependencies: [],
    level: 0,
  },
  generator: {
    label: 'Generator',
    description: 'Generates infrastructure code',
    dependencies: ['command'],
    level: 1,
  },
  security: {
    label: 'Security',
    description: 'Analyzes infrastructure security',
    dependencies: ['command', 'generator'],
    level: 2,
  },
  architecture: {
    label: 'Architecture',
    description: 'Evaluates infrastructure architecture',
    dependencies: ['command', 'generator'],
    level: 2,
  },
  cost: {
    label: 'Cost',
    description: 'Analyzes cost efficiency',
    dependencies: ['command', 'generator'],
    level: 2,
  },
  validation: {
    label: 'Validation',
    description: 'Validates infrastructure configuration',
    dependencies: ['command', 'security', 'architecture', 'cost'],
    level: 3,
  },
  orchestrator: {
    label: 'Orchestrator',
    description: 'Coordinates agent activities',
    dependencies: [],
    level: 0,
  },
};

// Mock data for when the backend is not available
const MOCK_WORKFLOW_DATA: WorkflowData = {
  workflow_id: 'mock-workflow-id',
  status: 'in_progress',
  started_agents: ['command', 'generator', 'orchestrator'],
  completed_agents: ['command'],
  results: {
    command: { status: 'completed', details: {} },
    generator: { status: 'running', details: {} },
    orchestrator: { status: 'running', details: {} },
    security: { status: 'pending', details: {} },
    architecture: { status: 'pending', details: {} },
    cost: { status: 'pending', details: {} },
    validation: { status: 'pending', details: {} },
  }
};

interface AgentNodeProps {
  agent: AgentName;
  status: AgentStatus;
  abbreviation: string;
}

const AgentNode: React.FC<AgentNodeProps> = ({ agent, status, abbreviation }) => {
  const config = AGENT_CONFIG[agent];

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'failed':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getAbbreviationColor = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-200 text-blue-700';
      case 'completed':
        return 'bg-green-200 text-green-700';
      case 'failed':
        return 'bg-red-200 text-red-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center ${getAbbreviationColor()} mb-2`}
      >
        <span className="text-sm font-bold uppercase">{abbreviation}</span>
      </div>
      <div className="text-xs text-center">{config.label}</div>
      <div className="mt-1">{getStatusIcon()}</div>
    </div>
  );
};

interface AgentWorkflowProps {
  workflowData?: WorkflowData | null;
}

const AgentWorkflow: React.FC<AgentWorkflowProps> = ({ workflowData: propWorkflowData }) => {
  const [useMockData, setUseMockData] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Use the provided workflowData if available, otherwise use mock data if useMockData is true
  const effectiveWorkflowData = propWorkflowData || (useMockData ? MOCK_WORKFLOW_DATA : null);

  // Simulate workflow progress for demo purposes
  useEffect(() => {
    if (!isSimulating || !useMockData) return;
    
    const simulationSteps = [
      // Step 1: Generator completes
      () => {
        setMockWorkflowData(prev => ({
          ...prev,
          completed_agents: [...prev.completed_agents, 'generator'],
          started_agents: [...prev.started_agents, 'security', 'architecture', 'cost'],
          results: {
            ...prev.results,
            generator: { status: 'completed', details: {} },
            security: { status: 'running', details: {} },
            architecture: { status: 'running', details: {} },
            cost: { status: 'running', details: {} },
          }
        }));
      },
      // Step 2: Security completes
      () => {
        setMockWorkflowData(prev => ({
          ...prev,
          completed_agents: [...prev.completed_agents, 'security'],
          results: {
            ...prev.results,
            security: { status: 'completed', details: {} },
          }
        }));
      },
      // Step 3: Architecture completes
      () => {
        setMockWorkflowData(prev => ({
          ...prev,
          completed_agents: [...prev.completed_agents, 'architecture'],
          results: {
            ...prev.results,
            architecture: { status: 'completed', details: {} },
          }
        }));
      },
      // Step 4: Cost completes
      () => {
        setMockWorkflowData(prev => ({
          ...prev,
          completed_agents: [...prev.completed_agents, 'cost'],
          started_agents: [...prev.started_agents, 'validation'],
          results: {
            ...prev.results,
            cost: { status: 'completed', details: {} },
            validation: { status: 'running', details: {} },
          }
        }));
      },
      // Step 5: Validation completes
      () => {
        setMockWorkflowData(prev => ({
          ...prev,
          status: 'completed',
          completed_agents: [...prev.completed_agents, 'validation', 'orchestrator'],
          results: {
            ...prev.results,
            validation: { status: 'completed', details: {} },
            orchestrator: { status: 'completed', details: {} },
          }
        }));
        setIsSimulating(false); // End simulation
      },
    ];
    
    if (simulationStep < simulationSteps.length) {
      const timer = setTimeout(() => {
        simulationSteps[simulationStep]();
        setSimulationStep(prev => prev + 1);
      }, 2000); // 2 seconds between steps
      
      return () => clearTimeout(timer);
    }
  }, [isSimulating, simulationStep, useMockData]);

  const [mockWorkflowData, setMockWorkflowData] = useState(MOCK_WORKFLOW_DATA);
  
  // If we're using mock data, use our local state
  const displayData = useMockData ? mockWorkflowData : effectiveWorkflowData;

  const handleStartSimulation = () => {
    setMockWorkflowData(MOCK_WORKFLOW_DATA); // Reset to initial state
    setSimulationStep(0);
    setIsSimulating(true);
  };

  if (!displayData) {
    return (
      <div className="text-center p-8">
        <div className="mb-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p className="text-gray-700">No workflow data available</p>
        </div>
        <button
          onClick={() => setUseMockData(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Use Demo Data
        </button>
      </div>
    );
  }

  const getAgentStatus = (agent: AgentName): AgentStatus => {
    if (displayData.completed_agents.includes(agent)) {
      return displayData.results[agent]?.status === 'failed' ? 'failed' : 'completed';
    }
    if (displayData.started_agents.includes(agent)) {
      return 'running';
    }
    return 'pending';
  };

  const getAgentAbbreviation = (agent: AgentName): string => {
    switch (agent) {
      case 'command':
        return 'COM';
      case 'generator':
        return 'GEN';
      case 'security':
        return 'SEC';
      case 'architecture':
        return 'ARC';
      case 'cost':
        return 'COS';
      case 'validation':
        return 'VAL';
      case 'orchestrator':
        return 'ORC';
      default:
        return agent.substring(0, 3).toUpperCase();
    }
  };

  // Group agents by level for layout
  const agentsByLevel = Object.entries(AGENT_CONFIG).reduce<Record<number, AgentName[]>>(
    (acc, [agent, config]) => {
      const level = config.level;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(agent as AgentName);
      return acc;
    },
    {}
  );

  const maxLevel = Math.max(...Object.keys(agentsByLevel).map(Number));
  
  // Calculate completion percentage
  const totalAgents = Object.keys(AGENT_CONFIG).length;
  const completedAgents = displayData.completed_agents.length;
  const completionPercentage = Math.round((completedAgents / totalAgents) * 100);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Agent Communication Network</h2>
          <div className="text-sm text-gray-600">
            Workflow ID: {displayData.workflow_id ? displayData.workflow_id.substring(0, 8) : 'No workflow'}
          </div>
        </div>
        
        {useMockData && (
          <button
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className={`flex items-center px-3 py-1 rounded text-sm ${
              isSimulating 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Simulating...' : 'Simulate Progress'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Messages</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Avg. Time</div>
          <div className="text-2xl font-bold">0.0s</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Completion</div>
          <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-8">
          {Array.from({ length: maxLevel + 1 }, (_, level) => (
            <div key={level} className="flex justify-around">
              {agentsByLevel[level]?.map((agent) => (
                <AgentNode 
                  key={agent} 
                  agent={agent} 
                  status={getAgentStatus(agent)} 
                  abbreviation={getAgentAbbreviation(agent)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Agent Communications</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <svg className="w-12 h-12 text-gray-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p className="text-sm">No messages yet</p>
          <p className="text-xs text-gray-400 mt-1">Communications will appear here during simulation</p>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-300 mr-1"></div>
            <span className="text-xs text-gray-600">Idle</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xs text-gray-600">Processing</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs text-gray-600">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs text-gray-600">Error</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            <span className="text-xs text-gray-600">Orchestrator</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default AgentWorkflow; 
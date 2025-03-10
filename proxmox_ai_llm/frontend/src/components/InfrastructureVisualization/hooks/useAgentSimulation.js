// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/hooks/useAgentSimulation.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_AGENT_STATES } from '../utils/agentUtils';

export const useAgentSimulation = (isLive = true, autoStart = true) => {
  const [messages, setMessages] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [simulationRunning, setSimulationRunning] = useState(autoStart);
  const [networkMetrics, setNetworkMetrics] = useState({
    totalMessages: 0,
    averageResponseTime: 0,
    completionRate: 0
  });
  const [agentStates, setAgentStates] = useState({...DEFAULT_AGENT_STATES});
  
  const animationRef = useRef(null);
  
  // Add a message to the flow
  const updateMessageFlow = useCallback((from, to, content) => {
    const now = new Date();
    const newMessage = {
      id: Date.now(),
      from,
      to,
      content,
      rawTimestamp: now,
      timestamp: now.toLocaleTimeString()
    };
    
    // Limit number of messages to prevent performance issues and scrolling problems
    setMessages(prev => {
      const maxMessages = 50; // Keep a reasonable number of messages
      const updatedMessages = [...prev, newMessage];
      return updatedMessages.length > maxMessages 
        ? updatedMessages.slice(updatedMessages.length - maxMessages) 
        : updatedMessages;
    });
  }, []);
  
  // Update agent state
  const updateAgentState = useCallback((agentId, status) => {
    setAgentStates(prev => {
      return { ...prev, [agentId]: status };
    });
  }, []);
  
  // Animate message flow between agents
  const animateMessageFlow = useCallback((from, to, drawAgentNetwork, agentPositions) => {
    let progress = 0;
    const animate = () => {
      progress += 0.02;
      
      if (progress <= 1) {
        drawAgentNetwork(agentPositions, agentStates, { from, to, progress });
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        drawAgentNetwork(agentPositions, agentStates);
      }
    };
    
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
  }, [agentStates]);
  
  // Simulate a full workflow
  const simulateWorkflow = useCallback(async () => {
    // Reset states to default
    setAgentStates({...DEFAULT_AGENT_STATES});
    
    // Command agent
    updateMessageFlow('orchestrator', 'command', 'Analyzing user request');
    await new Promise(r => setTimeout(r, 1000));
    updateAgentState('command', 'processing');
    await new Promise(r => setTimeout(r, 2000));
    updateAgentState('command', 'completed');
    updateMessageFlow('command', 'orchestrator', 'Request analysis complete');
    
    // Generator agent
    updateMessageFlow('orchestrator', 'generator', 'Generate infrastructure templates');
    await new Promise(r => setTimeout(r, 1000));
    updateAgentState('generator', 'processing');
    await new Promise(r => setTimeout(r, 3000));
    updateAgentState('generator', 'completed');
    updateMessageFlow('generator', 'orchestrator', 'Templates generated');
    
    // Security and Architect agents in parallel
    updateMessageFlow('orchestrator', 'security', 'Analyze security vulnerabilities');
    updateMessageFlow('orchestrator', 'architect', 'Evaluate architecture patterns');
    await new Promise(r => setTimeout(r, 1000));
    updateAgentState('security', 'processing');
    updateAgentState('architect', 'processing');
    
    // Security agent completes first
    await new Promise(r => setTimeout(r, 2500));
    updateAgentState('security', 'completed');
    updateMessageFlow('security', 'orchestrator', 'Security analysis complete');
    
    // Architect agent completes
    await new Promise(r => setTimeout(r, 1500));
    updateAgentState('architect', 'completed');
    updateMessageFlow('architect', 'orchestrator', 'Architecture evaluation complete');
    
    // Validator agent
    updateMessageFlow('orchestrator', 'validator', 'Verify compliance standards');
    await new Promise(r => setTimeout(r, 1000));
    updateAgentState('validator', 'processing');
    await new Promise(r => setTimeout(r, 2000));
    updateAgentState('validator', 'completed');
    updateMessageFlow('validator', 'orchestrator', 'Validation complete');
    
    // Cost estimation agent
    updateMessageFlow('orchestrator', 'costEstimation', 'Calculate deployment costs');
    await new Promise(r => setTimeout(r, 1000));
    updateAgentState('costEstimation', 'processing');
    await new Promise(r => setTimeout(r, 2500));
    updateAgentState('costEstimation', 'completed');
    updateMessageFlow('costEstimation', 'orchestrator', 'Cost analysis complete');
    
    // All complete
    updateMessageFlow('orchestrator', 'user', 'Analysis complete!');
    
    // Mark simulation as complete
    setSimulationRunning(false);
  }, [updateAgentState, updateMessageFlow]);
  
  // Start simulation manually
  const startSimulation = useCallback(() => {
    setSimulationRunning(true);
    
    // Clear existing messages when starting a new simulation
    setMessages([]);
  }, []);
  
  // Reset everything
  const resetSimulation = useCallback(() => {
    // Reset agent states
    setAgentStates({...DEFAULT_AGENT_STATES});
    
    // Clear messages
    setMessages([]);
    
    // Reset metrics
    setNetworkMetrics({
      totalMessages: 0,
      averageResponseTime: 0,
      completionRate: 0
    });
  }, []);
  
  // Update network metrics when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Calculate network metrics
      const totalMessages = messages.length;
      
      // Calculate completion rate
      const completedAgents = Object.values(agentStates).filter(state => state === 'completed').length;
      const totalAgents = Object.keys(agentStates).length - 1; // Exclude orchestrator
      const completionRate = (completedAgents / totalAgents) * 100;
      
      // Calculate average time between messages (simulated response time)
      let totalTime = 0;
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i-1].rawTimestamp || 0);
        const currTime = new Date(messages[i].rawTimestamp || 0);
        totalTime += (currTime - prevTime);
      }
      const avgTime = messages.length > 1 ? totalTime / (messages.length - 1) : 0;
      
      setNetworkMetrics({
        totalMessages,
        averageResponseTime: avgTime / 1000, // Convert to seconds
        completionRate: completionRate
      });
    }
  }, [messages, agentStates]);
  
  // Run simulation effect
  useEffect(() => {
    if (!isLive || !simulationRunning) return;
    
    // Track if component is mounted
    let isMounted = true;
    
    // Simulate workflow once
    simulateWorkflow();
    
    return () => {
      // Set mounted flag to false when component unmounts
      isMounted = false;
      
      // Cleanup animation on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLive, simulateWorkflow, simulationRunning]);
  
  return {
    messages,
    selectedAgent,
    setSelectedAgent,
    simulationRunning,
    networkMetrics,
    agentStates,
    startSimulation,
    resetSimulation,
    updateAgentState,
    updateMessageFlow,
    animateMessageFlow,
    setNetworkMetrics
  };
};
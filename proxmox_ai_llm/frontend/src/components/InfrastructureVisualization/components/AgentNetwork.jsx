// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/AgentNetwork.jsx
import React, { useRef, useEffect, useCallback } from 'react';

const AgentNetwork = ({
  agentPositions,
  agentStates,
  selectedAgent,
  onCanvasClick,
  activeMessage = null
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Update canvas with advanced drawing techniques
  const drawAgentNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Add subtle background gradient
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 10,
      width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, 'rgba(243, 244, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(243, 244, 246, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle grid pattern for depth
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(229, 231, 235, 0.5)';
    ctx.lineWidth = 0.5;
    
    // Horizontal lines
    for (let i = 0; i < height; i += 20) {
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
    }
    
    // Vertical lines
    for (let i = 0; i < width; i += 20) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
    }
    ctx.stroke();
    
    // Draw connections with bezier curves for more natural flow
    Object.entries(agentPositions).forEach(([agentId, position]) => {
      if (agentId !== 'orchestrator') {
        const startX = agentPositions.orchestrator.x * width / 100;
        const startY = agentPositions.orchestrator.y * height / 100;
        const endX = position.x * width / 100;
        const endY = position.y * height / 100;
        
        // Calculate control points for bezier curve
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // Add some curvature
        const curveOffsetX = (endY - startY) * 0.2;
        const curveOffsetY = (startX - endX) * 0.2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(
          midX + curveOffsetX, 
          midY + curveOffsetY, 
          endX, endY
        );
        
        // Style based on connection state
        let connectionGradient;
        if (agentStates[agentId] === 'processing') {
          connectionGradient = ctx.createLinearGradient(startX, startY, endX, endY);
          connectionGradient.addColorStop(0, '#818CF8'); // light indigo
          connectionGradient.addColorStop(1, '#3B82F6'); // blue
          ctx.strokeStyle = connectionGradient;
          ctx.lineWidth = 3;
          
          // Add pulsing effect
          const pulseScale = 1 + 0.2 * Math.sin(Date.now() / 300);
          ctx.lineWidth = 3 * pulseScale;
        } else if (agentStates[agentId] === 'completed') {
          connectionGradient = ctx.createLinearGradient(startX, startY, endX, endY);
          connectionGradient.addColorStop(0, '#34D399'); // light green
          connectionGradient.addColorStop(1, '#10B981'); // green
          ctx.strokeStyle = connectionGradient;
          ctx.lineWidth = 2;
        } else if (agentStates[agentId] === 'error') {
          connectionGradient = ctx.createLinearGradient(startX, startY, endX, endY);
          connectionGradient.addColorStop(0, '#F87171'); // light red
          connectionGradient.addColorStop(1, '#EF4444'); // red
          ctx.strokeStyle = connectionGradient;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(229, 231, 235, 0.8)'; // light gray
          ctx.lineWidth = 1;
        }
        
        ctx.stroke();
      }
    });
    
    // Draw active message animation if present with trailing particles
    if (activeMessage) {
      const { from, to, progress } = activeMessage;
      if (agentPositions[from] && agentPositions[to]) {
        const fromX = agentPositions[from].x * width / 100;
        const fromY = agentPositions[from].y * height / 100;
        const toX = agentPositions[to].x * width / 100;
        const toY = agentPositions[to].y * height / 100;
        
        // Calculate bezier points
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const curveOffsetX = (toY - fromY) * 0.2;
        const curveOffsetY = (fromX - toX) * 0.2;
        
        // Calculate current position on curve
        const t = progress;
        const currentX = (1-t)*(1-t)*fromX + 2*(1-t)*t*(midX + curveOffsetX) + t*t*toX;
        const currentY = (1-t)*(1-t)*fromY + 2*(1-t)*t*(midY + curveOffsetY) + t*t*toY;
        
        // Draw data packet
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2, false);
        const packetGradient = ctx.createRadialGradient(
          currentX, currentY, 0,
          currentX, currentY, 6
        );
        packetGradient.addColorStop(0, '#A5B4FC'); // very light indigo
        packetGradient.addColorStop(1, '#6366F1'); // indigo
        ctx.fillStyle = packetGradient;
        ctx.fill();
        
        // Add glow effect
        ctx.beginPath();
        ctx.arc(currentX, currentY, 8, 0, Math.PI * 2, false);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.fill();
        
        // Draw trailing particles
        for (let i = 0; i < 5; i++) {
          const trailProgress = Math.max(0, progress - (i + 1) * 0.05);
          if (trailProgress > 0) {
            const trailX = (1-trailProgress)*(1-trailProgress)*fromX + 2*(1-trailProgress)*trailProgress*(midX + curveOffsetX) + trailProgress*trailProgress*toX;
            const trailY = (1-trailProgress)*(1-trailProgress)*fromY + 2*(1-trailProgress)*trailProgress*(midY + curveOffsetY) + trailProgress*trailProgress*toY;
            
            ctx.beginPath();
            const trailSize = 4 - i * 0.7;
            ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2, false);
            ctx.fillStyle = `rgba(99, 102, 241, ${0.7 - i * 0.15})`;
            ctx.fill();
          }
        }
      }
    }
    
    // Draw agent nodes with enhanced graphics
    Object.entries(agentPositions).forEach(([agentId, position]) => {
      const x = position.x * width / 100;
      const y = position.y * height / 100;
      const radius = agentId === 'orchestrator' ? 25 : 20;
      
      // Check if this agent is selected
      const isSelected = selectedAgent === agentId;
      
      // Add glow effect for selected agent
      if (isSelected) {
        ctx.beginPath();
        const glowGradient = ctx.createRadialGradient(
          x, y, radius,
          x, y, radius + 15
        );
        glowGradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
        glowGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = glowGradient;
        ctx.arc(x, y, radius + 15, 0, Math.PI * 2, false);
        ctx.fill();
      }
      
      // For processing agents, add animated ring
      if (agentStates[agentId] === 'processing') {
        const animationPhase = (Date.now() % 2000) / 2000;
        const ringRadius = radius + 5 + 3 * Math.sin(animationPhase * Math.PI * 2);
        
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2, false);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'; // blue with transparency
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Main node with gradient fill
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, false);
      
      // Create gradient for node
      const nodeGradient = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, radius * 0.1,
        x, y, radius
      );
      
      // Fill based on status with gradients
      switch(agentStates[agentId]) {
        case 'idle':
          nodeGradient.addColorStop(0, '#D1D5DB'); // light gray
          nodeGradient.addColorStop(1, '#9CA3AF'); // gray
          break;
        case 'processing':
          nodeGradient.addColorStop(0, '#93C5FD'); // light blue
          nodeGradient.addColorStop(1, '#3B82F6'); // blue
          break;
        case 'completed':
          nodeGradient.addColorStop(0, '#6EE7B7'); // light green
          nodeGradient.addColorStop(1, '#10B981'); // green
          break;
        case 'error':
          nodeGradient.addColorStop(0, '#FCA5A5'); // light red
          nodeGradient.addColorStop(1, '#EF4444'); // red
          break;
        case 'active': // for orchestrator
          nodeGradient.addColorStop(0, '#A5B4FC'); // light indigo
          nodeGradient.addColorStop(1, '#6366F1'); // indigo
          break;
        default:
          nodeGradient.addColorStop(0, '#D1D5DB'); // light gray
          nodeGradient.addColorStop(1, '#9CA3AF'); // gray
      }
      
      ctx.fillStyle = nodeGradient;
      ctx.fill();
      
      // Add highlight/reflection
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.6, 0, Math.PI * 2, false);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      
      // Add a white border with shadow
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Shadow effect
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2, false);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add label with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(agentId.substring(0, 3).toUpperCase(), x + 1, y + 1);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Arial';
      ctx.fillText(agentId.substring(0, 3).toUpperCase(), x, y);
      
      // Add label below with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.font = '12px Arial';
      ctx.fillText(agentId.charAt(0).toUpperCase() + agentId.slice(1, 5), x + 1, y + radius + 16);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText(agentId.charAt(0).toUpperCase() + agentId.slice(1, 5), x, y + radius + 15);
    });
  }, [agentPositions, agentStates, selectedAgent, activeMessage]);
  
  // Draw the network whenever relevant props change
  useEffect(() => {
    drawAgentNetwork();
    
    // Set up animation loop if needed
    const animate = () => {
      drawAgentNetwork();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawAgentNetwork]);
  
  // Handle canvas click for agent selection
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    const y = (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
    
    // Check if click is on an agent node
    let clickedAgent = null;
    Object.entries(agentPositions).forEach(([agentId, position]) => {
      const nodeX = position.x * canvas.width / 100;
      const nodeY = position.y * canvas.height / 100;
      const radius = agentId === 'orchestrator' ? 25 : 20;
      
      // Calculate distance from click to node center
      const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
      
      // If click is within node radius, select this agent
      if (distance <= radius) {
        clickedAgent = agentId;
      }
    });
    
    // Call onCanvasClick callback with clicked agent
    if (onCanvasClick) {
      onCanvasClick(clickedAgent);
    }
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      width={500} 
      height={400} 
      className="w-full h-full cursor-pointer rounded-md"
      onClick={handleCanvasClick}
    ></canvas>
  );
};

export default AgentNetwork;
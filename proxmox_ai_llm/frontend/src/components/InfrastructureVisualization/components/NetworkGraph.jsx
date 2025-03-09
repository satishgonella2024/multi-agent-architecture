// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/NetworkGraph.jsx
import React, { useRef, useEffect } from 'react';

import { getBackgroundColor } from '../utils/colorUtils';
import { getResourceIcon, getStatusIndicator } from '../utils/iconUtils';
import { calculateNetworkNodePositions } from '../utils/layoutUtils';

const NetworkGraph = ({
  resources,
  resourceGroups,
  connections,
  selectedResource,
  setSelectedResource,
  hoveredResource,
  setHoveredResource,
  animatedElements,
  colorMode,
  zoom,
  handleZoom
}) => {
  const svgRef = useRef(null);
  
  // Calculate node positions
  const nodePositions = calculateNetworkNodePositions(resources, resourceGroups);
  
  return (
    <div className="relative w-full">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col bg-white rounded-lg shadow-md">
        <button 
          className="p-2 hover:bg-gray-100 rounded-t-lg border-b"
          onClick={() => handleZoom('in')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button 
          className="p-2 hover:bg-gray-100 rounded-b-lg"
          onClick={() => handleZoom('out')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
      </div>
      
      <svg 
        ref={svgRef} 
        width="100%" 
        height="650" 
        viewBox="0 0 1000 700" 
        className="border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100"
        style={{ transform: `scale(${zoom})` }}
      >
        <defs>
          {/* Gradient definitions */}
          <linearGradient id="secureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="insecureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.7" />
          </linearGradient>
          
          {/* Arrow markers */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6B7280" />
          </marker>
          <marker
            id="arrowRed"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
          </marker>
          
          {/* Glow filter for selected nodes */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#3B82F6" floodOpacity="0.7" result="glowColor" />
            <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Pulse animation for data flow */}
          <filter id="pulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
            <feBlend in="SourceGraphic" in2="glow" mode="normal" />
          </filter>
        </defs>
        
        {/* Group backgrounds */}
        {Object.entries(resourceGroups).map(([type, groupResources], groupIndex) => {
          if (groupResources.length === 0) return null;
          
          // Find center of this group
          const sampleResource = groupResources[0];
          const position = nodePositions[sampleResource.id];
          if (!position) return null;
          
          return (
            <g key={`group-${type}`}>
              <circle 
                cx={position.groupX} 
                cy={position.groupY} 
                r={80 + groupResources.length * 5}
                fill={`rgba(209, 213, 219, ${selectedResource && groupResources.some(r => r.id === selectedResource.id) ? 0.4 : 0.1})`}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text 
                x={position.groupX} 
                y={position.groupY - 90 - groupResources.length * 3} 
                textAnchor="middle" 
                fill="#4B5563" 
                fontSize="14"
                fontWeight="bold"
              >
                {type}
              </text>
            </g>
          );
        })}
        
        {/* Connections */}
        {connections.map((connection, index) => {
          const source = nodePositions[connection.source];
          const target = nodePositions[connection.target];
          if (!source || !target) return null;
          
          // Quadratic bezier curve for more organic connections
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          
          // Add some curve to the line
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate control point for the curve (perpendicular to line)
          const offset = 0.3 * dist + Math.random() * 30;
          const controlX = midX + offset * (dy / dist);
          const controlY = midY - offset * (dx / dist);
          
          const path = `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
          
          // Style based on connection security
          const strokeStyle = connection.secure 
            ? { stroke: '#6B7280', strokeDasharray: '' } 
            : { stroke: '#EF4444', strokeDasharray: '5,3' };
            
          const markerEnd = connection.secure ? 'url(#arrow)' : 'url(#arrowRed)';
          const isHighlighted = selectedResource && 
            (selectedResource.id === connection.source || selectedResource.id === connection.target);
          
          return (
            <g key={`connection-${index}`} className={isHighlighted ? 'opacity-100' : 'opacity-40'}>
              <path 
                d={path} 
                fill="none"
                strokeWidth={connection.strength * 3}
                markerEnd={markerEnd}
                {...strokeStyle}
                opacity={isHighlighted ? 1 : 0.6}
                className={connection.animated ? 'connection-animated' : ''}
              />
              
              {/* Data flow animation */}
              {connection.animated && (
                <circle r="4" fill="#3B82F6" opacity="0.8" filter="url(#pulse)">
                  <animateMotion
                    path={path}
                    begin="0s"
                    dur={`${3 + Math.random() * 2}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
        
        {/* Resource nodes */}
        {resources.map((resource) => {
          const position = nodePositions[resource.id];
          if (!position) return null;
          
          // Determine if this node is animated
          const isAnimated = animatedElements.some(el => el.id === resource.id);
          const isSelected = selectedResource?.id === resource.id;
          const isHighlighted = selectedResource 
            ? selectedResource.id === resource.id || 
              connections.some(c => 
                (c.source === selectedResource.id && c.target === resource.id) ||
                (c.target === selectedResource.id && c.source === resource.id)
              )
            : true;
          
          // Get color based on score
          const bgColor = getBackgroundColor(resource, colorMode);
          
          // Badge showing number of issues
          const showIssueBadge = resource.issues && resource.issues.length > 0;
          
          return (
            <g 
              key={resource.id} 
              transform={`translate(${position.x}, ${position.y})`}
              onClick={() => setSelectedResource(resource)}
              onMouseEnter={() => setHoveredResource(resource)}
              onMouseLeave={() => setHoveredResource(null)}
              className="cursor-pointer"
              opacity={isHighlighted ? 1 : 0.4}
              filter={isSelected ? 'url(#glow)' : ''}
              style={{ transition: 'opacity 0.3s ease' }}
            >
              {/* Background glow for active resources */}
              {isAnimated && (
                <circle r="32" fill={bgColor} opacity="0.2">
                  <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              
              {/* Node circle with shine effect */}
              <circle r="25" fill={bgColor} />
              <ellipse rx="15" ry="10" cx="-5" cy="-5" fill="white" opacity="0.2" />
              
              {/* Active indicator pulse */}
              {resource.cpuUsage > 80 && (
                <circle r="30" stroke="#EF4444" strokeWidth="2" fill="none" opacity="0.8">
                  <animate attributeName="r" values="25;33;25" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
              
              {/* Resource icon */}
              <foreignObject x="-12" y="-12" width="24" height="24">
                <div className="flex items-center justify-center text-white">
                  {getResourceIcon(resource.type)}
                </div>
              </foreignObject>
              
              {/* Resource name */}
              <text 
                y="40" 
                textAnchor="middle" 
                fill="#000" 
                fontSize="12"
                fontWeight={isSelected ? "bold" : "normal"}
              >
                {resource.name.length > 15 ? resource.name.substring(0, 12) + '...' : resource.name}
              </text>
              
              {/* Issue count badge */}
              {showIssueBadge && (
                <g transform="translate(18, -18)">
                  <circle r="10" fill="#EF4444" />
                  <text 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="10" 
                    fontWeight="bold"
                    dominantBaseline="middle"
                  >
                    {resource.issues.length}
                  </text>
                </g>
              )}
              
              {/* Status indicator */}
              <g transform="translate(-18, -18)">
                <circle r="8" fill="white" />
                <foreignObject x="-6" y="-6" width="12" height="12">
                  <div>
                    {getStatusIndicator(resource, animatedElements)}
                  </div>
                </foreignObject>
              </g>
              
              {/* Hover tooltip */}
              {hoveredResource?.id === resource.id && !selectedResource && (
                <foreignObject x="-100" y="-100" width="200" height="60">
                  <div className="bg-gray-800 text-white p-2 rounded text-xs opacity-90">
                    <div className="font-bold">{resource.name}</div>
                    <div className="flex justify-between mt-1">
                      <span>CPU: {resource.cpuUsage}%</span>
                      <span>MEM: {resource.memoryUsage}%</span>
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default NetworkGraph;
// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/ThreeDView.jsx
import React from 'react';

import { getBackgroundColor } from '../utils/colorUtils';
import { getResourceIcon, getStatusIndicator } from '../utils/iconUtils';
import { calculate3DPositions, isometricTransform, sortResourcesByLayer } from '../utils/layoutUtils';

const ThreeDView = ({
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
  const svgWidth = 1000;
  const svgHeight = 700;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  
  // Calculate 3D positions
  const { nodePositions, typeLayerMap } = calculate3DPositions(resources, resourceGroups);
  
  // Sort resources by layer for proper drawing order (back to front)
  const sortedResources = sortResourcesByLayer(resources, typeLayerMap);
  
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
        width="100%" 
        height="650" 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        className="border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100"
        style={{ transform: `scale(${zoom})` }}
      >
        <defs>
          {/* Gradients and filters for 3D effects */}
          <linearGradient id="topFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f3f4f6" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="rightFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1d5db" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="leftFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.9" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>
        
        {/* Grid lines for 3D effect */}
        <g className="isometric-grid">
          {Array.from({ length: 20 }).map((_, i) => (
            <React.Fragment key={`grid-${i}`}>
              <path 
                d={`M${centerX - 500 + i*50},${centerY + 250} L${centerX + 500 + i*50},${centerY - 250}`} 
                stroke="#e5e7eb" 
                strokeWidth="1" 
              />
              <path 
                d={`M${centerX - 500},${centerY - 250 + i*50} L${centerX + 500},${centerY + 250 + i*50}`} 
                stroke="#e5e7eb" 
                strokeWidth="1" 
              />
            </React.Fragment>
          ))}
        </g>
        
        {/* Layer platforms - one per resource type */}
        {Object.entries(resourceGroups).map(([type, groupResources], groupIndex) => {
          if (groupResources.length === 0) return null;
          
          const layer = typeLayerMap[type];
          const layerHeight = 20;
          const layerSize = Math.ceil(Math.sqrt(groupResources.length)) + 1;
          
          // Calculate platform corners in isometric space
          const topLeft = isometricTransform(-layerSize/2, -layerSize/2, layer * 0.5, centerX, centerY);
          const topRight = isometricTransform(layerSize/2, -layerSize/2, layer * 0.5, centerX, centerY);
          const bottomLeft = isometricTransform(-layerSize/2, layerSize/2, layer * 0.5, centerX, centerY);
          const bottomRight = isometricTransform(layerSize/2, layerSize/2, layer * 0.5, centerX, centerY);
          
          // Top platform
          const topFace = `
            M${topLeft.x},${topLeft.y}
            L${topRight.x},${topRight.y}
            L${bottomRight.x},${bottomRight.y}
            L${bottomLeft.x},${bottomLeft.y}
            Z
          `;
          
          // Side faces (only if elevated)
          const leftFace = layer > 0 ? `
            M${bottomLeft.x},${bottomLeft.y}
            L${bottomLeft.x},${bottomLeft.y + layerHeight}
            L${topLeft.x},${topLeft.y + layerHeight}
            L${topLeft.x},${topLeft.y}
            Z
          ` : null;
          
          const rightFace = layer > 0 ? `
            M${bottomRight.x},${bottomRight.y}
            L${bottomRight.x},${bottomRight.y + layerHeight}
            L${topRight.x},${topRight.y + layerHeight}
            L${topRight.x},${topRight.y}
            Z
          ` : null;
          
          return (
            <g key={`platform-${type}`} filter="url(#shadow)">
              {/* Platform faces */}
              <path d={topFace} fill="url(#topFace)" stroke="#d1d5db" strokeWidth="1" />
              {leftFace && <path d={leftFace} fill="url(#leftFace)" stroke="#d1d5db" strokeWidth="1" />}
              {rightFace && <path d={rightFace} fill="url(#rightFace)" stroke="#d1d5db" strokeWidth="1" />}
              
              {/* Platform label */}
              <text 
                x={topLeft.x + 30} 
                y={topLeft.y + 20} 
                fill="#4B5563" 
                fontSize="14"
                fontWeight="bold"
              >
                {type}
              </text>
            </g>
          );
        })}
        
        {/* Connection paths between resources */}
        {connections.map((connection, index) => {
          const source = nodePositions[connection.source];
          const target = nodePositions[connection.target];
          if (!source || !target) return null;
          
          // Draw curved path for inter-layer connections
          const sourceLayer = nodePositions[connection.source]?.layer;
          const targetLayer = nodePositions[connection.target]?.layer;
          
          // Different path style for same-layer vs different-layer connections
          let path = '';
          if (sourceLayer === targetLayer) {
            // Same layer - direct line with small curve
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            
            // Add slight curve
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const offset = 0.2 * dist;
            const controlX = midX;
            const controlY = midY - offset;
            
            path = `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
          } else {
            // Different layers - arc with control point
            const isAscending = targetLayer > sourceLayer;
            
            // Control point extends upward for ascending, downward for descending
            const controlX = (source.x + target.x) / 2;
            const controlY = (source.y + target.y) / 2 + (isAscending ? -50 : 50);
            
            path = `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
          }
          
          // Style based on connection security
          const strokeStyle = connection.secure 
            ? { stroke: '#6B7280', strokeDasharray: '' } 
            : { stroke: '#EF4444', strokeDasharray: '5,3' };
            
          const isHighlighted = selectedResource && 
            (selectedResource.id === connection.source || selectedResource.id === connection.target);
            
          return (
            <g key={`connection-${index}`} className={isHighlighted ? 'opacity-100' : 'opacity-40'}>
              <path 
                d={path} 
                fill="none"
                strokeWidth={connection.strength * 2.5}
                {...strokeStyle}
                opacity={isHighlighted ? 1 : 0.6}
                className={connection.animated ? 'connection-animated' : ''}
              />
              
              {/* Data flow animation */}
              {connection.animated && (
                <circle r="3" fill="#3B82F6" opacity="0.8">
                  <animateMotion
                    path={path}
                    begin="0s"
                    dur={`${2 + Math.random() * 2}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
        
        {/* Resource nodes - drawn as 3D cubes/cylinders based on type */}
        {sortedResources.map((resource) => {
          const position = nodePositions[resource.id];
          if (!position) return null;
          
          // Get color based on score and resource type
          const bgColor = getBackgroundColor(resource, colorMode);
          
          // Determine if this node is highlighted
          const isSelected = selectedResource?.id === resource.id;
          const isHighlighted = selectedResource 
            ? selectedResource.id === resource.id || 
              connections.some(c => 
                (c.source === selectedResource.id && c.target === resource.id) ||
                (c.target === selectedResource.id && c.source === resource.id)
              )
            : true;
          
          // Define 3D shape based on resource type
          const shape = renderResourceShape(resource, bgColor);
          
          // Shadow and highlight for 3D effect
          const shadowEffect = isSelected ? 'filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));' : '';
          
          return (
            <g 
              key={resource.id} 
              transform={`translate(${position.x}, ${position.y})`}
              onClick={() => setSelectedResource(resource)}
              onMouseEnter={() => setHoveredResource(resource)}
              onMouseLeave={() => setHoveredResource(null)}
              className="cursor-pointer"
              opacity={isHighlighted ? 1 : 0.4}
              style={{ transition: 'opacity 0.3s ease', ...shadowEffect }}
            >
              {/* 3D shape */}
              {shape}
              
              {/* Resource name */}
              <text 
                y={20 + 15} 
                textAnchor="middle" 
                fill="#000" 
                fontSize="11"
                fontWeight={isSelected ? "bold" : "normal"}
              >
                {resource.name.length > 15 ? resource.name.substring(0, 12) + '...' : resource.name}
              </text>
              
              {/* Issue count badge */}
              {resource.issues && resource.issues.length > 0 && (
                <g transform="translate(20, -20)">
                  <circle r="8" fill="#EF4444" />
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
              <g transform="translate(-20, -20)">
                <circle r="8" fill="white" stroke="#d1d5db" strokeWidth="1" />
                <foreignObject x="-6" y="-6" width="12" height="12">
                  <div>
                    {getStatusIndicator(resource, animatedElements)}
                  </div>
                </foreignObject>
              </g>
              
              {/* Hover tooltip */}
              {hoveredResource?.id === resource.id && !selectedResource && (
                <foreignObject x="-100" y="-120" width="200" height="80">
                  <div className="bg-gray-800 text-white p-2 rounded text-xs opacity-90">
                    <div className="font-bold">{resource.name}</div>
                    <div className="flex justify-between mt-1">
                      <span>CPU: {resource.cpuUsage}%</span>
                      <span>MEM: {resource.memoryUsage}%</span>
                    </div>
                    <div className="mt-1">
                      <span>Score: {
                        colorMode === 'security' 
                          ? resource.securityScore 
                          : colorMode === 'cost' 
                          ? resource.costScore 
                          : resource.architectureScore
                      }</span>
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

// Helper function to render different 3D shapes based on resource type
const renderResourceShape = (resource, bgColor) => {
  const size = 20;
  
  if (resource.type.includes('instance') || resource.type.includes('compute')) {
    // Server - rectangle
    return (
      <g>
        {/* Top face */}
        <rect x={-size} y={-size/2} width={size*2} height={size} fill={bgColor} stroke="#000" strokeWidth="1" />
        
        {/* Right face */}
        <path 
          d={`M${size},${-size/2} L${size+size/3},${-size/2+size/3} L${size+size/3},${size/2+size/3} L${size},${size/2} Z`} 
          fill={`${bgColor}88`} 
          stroke="#000" 
          strokeWidth="1" 
        />
        
        {/* Top face */}
        <path 
          d={`M${-size},${-size/2} L${-size+size/3},${-size/2+size/3} L${size+size/3},${-size/2+size/3} L${size},${-size/2} Z`} 
          fill={`${bgColor}aa`}
          stroke="#000" 
          strokeWidth="1" 
        />
        
        {/* Server lines */}
        <line x1={-size+5} y1={-size/2+7} x2={size-5} y2={-size/2+7} stroke="white" strokeWidth="1" />
        <line x1={-size+5} y1={-size/2+14} x2={size-5} y2={-size/2+14} stroke="white" strokeWidth="1" />
      </g>
    );
  } else if (resource.type.includes('database') || resource.type.includes('db')) {
    // Database - cylinder
    return (
      <g>
        {/* Bottom ellipse */}
        <ellipse cx="0" cy={size/2} rx={size} ry={size/2} fill={`${bgColor}88`} stroke="#000" strokeWidth="1" />
        
        {/* Center rectangle */}
        <rect x={-size} y={-size/2} width={size*2} height={size} fill={bgColor} stroke="#000" strokeWidth="1" />
        
        {/* Top ellipse */}
        <ellipse cx="0" cy={-size/2} rx={size} ry={size/2} fill={`${bgColor}aa`} stroke="#000" strokeWidth="1" />
        
        {/* Database lines */}
        <line x1={-size/2} y1={-size/4} x2={size/2} y2={-size/4} stroke="white" strokeWidth="1" />
        <line x1={-size/2} y1="0" x2={size/2} y2="0" stroke="white" strokeWidth="1" />
        <line x1={-size/2} y1={size/4} x2={size/2} y2={size/4} stroke="white" strokeWidth="1" />
      </g>
    );
  } else if (resource.type.includes('storage') || resource.type.includes('bucket')) {
    // Storage - cube
    return (
      <g>
        {/* Front face */}
        <rect x={-size} y={-size} width={size*2} height={size*2} fill={bgColor} stroke="#000" strokeWidth="1" />
        
        {/* Right face */}
        <path 
          d={`M${size},${-size} L${size+size/3},${-size-size/3} L${size+size/3},${size-size/3} L${size},${size} Z`} 
          fill={`${bgColor}88`} 
          stroke="#000" 
          strokeWidth="1" 
        />
        
        {/* Top face */}
        <path 
          d={`M${-size},${-size} L${-size+size/3},${-size-size/3} L${size+size/3},${-size-size/3} L${size},${-size} Z`} 
          fill={`${bgColor}aa`}
          stroke="#000" 
          strokeWidth="1" 
        />
        
        {/* Storage icon */}
        <rect x={-size/2} y={-size/2} width={size} height={size/4} fill="white" fillOpacity="0.5" />
        <rect x={-size/2} y={-size/4+2} width={size} height={size/4} fill="white" fillOpacity="0.5" />
        <rect x={-size/2} y="2" width={size} height={size/4} fill="white" fillOpacity="0.5" />
      </g>
    );
  } else if (resource.type.includes('vpc') || resource.type.includes('network')) {
    // Network - hexagon
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      hexPoints.push([size * Math.cos(angle), size * Math.sin(angle)]);
    }
    
    const hexPath = hexPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
    
    return (
      <g>
        {/* Base hexagon */}
        <path d={hexPath} fill={bgColor} stroke="#000" strokeWidth="1" />
        
        {/* Network lines */}
        <line x1={-size/2} y1={-size/2} x2={size/2} y2={size/2} stroke="white" strokeWidth="1" />
        <line x1={-size/2} y1={size/2} x2={size/2} y2={-size/2} stroke="white" strokeWidth="1" />
      </g>
    );
  } else {
    // Default - simple cube
    return (
      <g>
        {/* Front face */}
        <rect x={-size/2} y={-size/2} width={size} height={size} fill={bgColor} stroke="#000" strokeWidth="1" />
        
        {/* Right face */}
        <path 
          d={`M${size/2},${-size/2} L${size/2+size/4},${-size/2-size/4} L${size/2+size/4},${size/2-size/4} L${size/2},${size/2} Z`} 
          fill={`${bgColor}88`} 
          stroke="#000" 
          strokeWidth="1" 
        />
        
        {/* Top face */}
        <path 
          d={`M${-size/2},${-size/2} L${-size/2+size/4},${-size/2-size/4} L${size/2+size/4},${-size/2-size/4} L${size/2},${-size/2} Z`} 
          fill={`${bgColor}aa`}
          stroke="#000" 
          strokeWidth="1" 
        />
      </g>
    );
  }
};

export default ThreeDView;
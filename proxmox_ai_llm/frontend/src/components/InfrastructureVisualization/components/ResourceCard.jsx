// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/ResourceCard.jsx
import React from 'react';
import { Cpu, Server, Activity } from 'lucide-react';

import { getGradientColors } from '../utils/colorUtils';
import { getResourceIcon } from '../utils/iconUtils';

const ResourceCard = ({ resource, colorMode, isSelected, isAnimated, onSelect }) => {
  const scoreValue = colorMode === 'security' 
    ? resource.securityScore
    : colorMode === 'cost' 
    ? resource.costScore 
    : resource.architectureScore;
    
  const scoreColor = getGradientColors(scoreValue);
  
  return (
    <div 
      className={`relative cursor-pointer rounded-lg overflow-hidden shadow-md transition-all duration-300 transform ${
        isSelected 
          ? 'ring-2 ring-indigo-500 scale-105' 
          : 'hover:scale-102'
      }`}
      onClick={onSelect}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${scoreColor} opacity-90`}></div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/30"></div>
      
      {/* Grid lines background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`grid-h-${i}`} className="absolute h-px w-full bg-white" style={{ top: `${20 + i * 20}%` }}></div>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`grid-v-${i}`} className="absolute w-px h-full bg-white" style={{ left: `${20 + i * 20}%` }}></div>
        ))}
      </div>
      
      <div className="relative p-4">
        <div className="flex items-center mb-2 text-white">
          <div className="p-2 rounded-full mr-2 bg-white/20 backdrop-blur-sm">
            {getResourceIcon(resource.type)}
          </div>
          <div>
            <h4 className="text-sm font-bold truncate max-w-[160px]">{resource.name}</h4>
            <p className="text-xs opacity-80">{resource.type}</p>
          </div>
          
          {/* Status indicator */}
          <div className="ml-auto">
            {resource.status === 'healthy' ? (
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            ) : (
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            )}
          </div>
        </div>
        
        {/* Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-1 text-white text-xs">
          <div className="flex items-center">
            <Cpu className="w-3 h-3 mr-1" />
            <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                style={{ width: `${resource.cpuUsage}%` }}
              />
            </div>
            <span className="ml-1">{resource.cpuUsage}%</span>
          </div>
          <div className="flex items-center">
            <Server className="w-3 h-3 mr-1" />
            <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                style={{ width: `${resource.memoryUsage}%` }}
              />
            </div>
            <span className="ml-1">{resource.memoryUsage}%</span>
          </div>
        </div>
        
        {/* Score display */}
        <div className="mt-3 text-white text-xs">
          <div className="flex justify-between items-center">
            <span>{colorMode === 'security' ? 'Security' : colorMode === 'cost' ? 'Cost' : 'Architecture'}</span>
            <span className="font-bold">{scoreValue}/100</span>
          </div>
          <div className="relative w-full h-2 bg-white/20 mt-1 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
              style={{ width: `${scoreValue}%` }}
            />
          </div>
        </div>
        
        {/* Issues badge */}
        {resource.issues.length > 0 && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {resource.issues.length}
          </div>
        )}
        
        {/* Animated pulse for active resources */}
        {isAnimated && (
          <div className="absolute -bottom-2 -right-2 w-8 h-8">
            <div className="absolute w-8 h-8 rounded-full bg-white/30 animate-ping"></div>
            <div className="absolute w-6 h-6 ml-1 mt-1 rounded-full bg-white/70"></div>
            <Activity className="absolute w-4 h-4 ml-2 mt-2 text-green-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;
// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/utils/iconUtils.js
import React from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  Layers, 
  Cpu, 
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react';

/**
 * Get icon based on resource type
 */
export const getResourceIcon = (type) => {
  if (type.includes('vpc') || type.includes('network')) {
    return <Cloud className="w-6 h-6" />;
  } else if (type.includes('instance') || type.includes('compute')) {
    return <Server className="w-6 h-6" />;
  } else if (type.includes('database') || type.includes('db')) {
    return <Database className="w-6 h-6" />;
  } else if (type.includes('storage') || type.includes('disk') || type.includes('bucket')) {
    return <HardDrive className="w-6 h-6" />;
  } else if (type.includes('lambda') || type.includes('function')) {
    return <Cpu className="w-6 h-6" />;
  } else if (type.includes('gateway') || type.includes('api')) {
    return <Globe className="w-6 h-6" />;
  } else {
    return <Layers className="w-6 h-6" />;
  }
};

/**
 * Get smaller icon for tables and lists
 */
export const getSmallResourceIcon = (type) => {
  const baseClass = "w-4 h-4";
  
  if (type.includes('vpc') || type.includes('network')) {
    return <Cloud className={baseClass} />;
  } else if (type.includes('instance') || type.includes('compute')) {
    return <Server className={baseClass} />;
  } else if (type.includes('database') || type.includes('db')) {
    return <Database className={baseClass} />;
  } else if (type.includes('storage') || type.includes('disk') || type.includes('bucket')) {
    return <HardDrive className={baseClass} />;
  } else if (type.includes('lambda') || type.includes('function')) {
    return <Cpu className={baseClass} />;
  } else if (type.includes('gateway') || type.includes('api')) {
    return <Globe className={baseClass} />;
  } else {
    return <Layers className={baseClass} />;
  }
};

/**
 * Get status indicator icon
 */
export const getStatusIndicator = (resource, animatedElements) => {
  const isActive = animatedElements.some(el => el.id === resource.id);
  const animate = isActive ? 'animate-pulse' : '';
  
  if (resource.status === 'healthy') {
    return <CheckCircle className={`w-4 h-4 text-green-500 ${animate}`} />;
  } else {
    return <XCircle className={`w-4 h-4 text-red-500 ${animate}`} />;
  }
};
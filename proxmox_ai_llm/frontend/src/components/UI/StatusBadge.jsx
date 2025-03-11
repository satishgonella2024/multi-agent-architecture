// proxmox_ai_llm/frontend/src/components/UI/StatusBadge.jsx
import React from 'react';
import { CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

const StatusBadge = ({ status, className = '' }) => {
  // Normalize status strings
  const normalizedStatus = status?.toLowerCase?.() || 'unknown';
  
  // Determine style based on status
  const getStatusStyle = () => {
    switch (normalizedStatus) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
        };
      case 'failed':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
        };
      case 'in_progress':
      case 'running':
      case 'processing':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />
        };
    }
  };
  
  const { bg, text, icon } = getStatusStyle();
  
  // Format status text
  const getStatusText = () => {
    if (normalizedStatus === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${className}`}>
      {icon}
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;
// proxmox_ai_llm/frontend/src/components/UI/Badge.jsx
import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  // Define styles based on variant
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-100 text-indigo-800';
      case 'secondary':
        return 'bg-gray-100 text-gray-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'danger':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVariantStyle()} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
// proxmox_ai_llm/frontend/src/components/UI/LoadingIndicator.jsx
import React from 'react';
import { Loader } from 'lucide-react';

const LoadingIndicator = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
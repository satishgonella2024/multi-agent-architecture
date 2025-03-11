// proxmox_ai_llm/frontend/src/components/UI/ErrorDisplay.jsx
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorDisplay = ({ message = 'An error occurred', error, retry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      {error && <p className="text-sm text-gray-600 mb-4">{error}</p>}
      {retry && (
        <button
          onClick={retry}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;

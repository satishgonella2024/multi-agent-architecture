// src/components/Dashboard/common/LoadingIndicator.jsx
import React from 'react';

const LoadingIndicator = () => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600 text-lg">Loading infrastructure analysis...</p>
    <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
  </div>
);

export default LoadingIndicator;
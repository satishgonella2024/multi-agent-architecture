// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/Legend.jsx
import React from 'react';

const Legend = ({ viewMode }) => {
  return (
    <div className="mt-4 flex flex-wrap gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
      <div className="text-xs font-medium text-gray-500 mr-2">Legend:</div>
      <div className="flex items-center text-xs">
        <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
        <span className="text-gray-600">Good (90-100)</span>
      </div>
      <div className="flex items-center text-xs">
        <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
        <span className="text-gray-600">Warning (70-89)</span>
      </div>
      <div className="flex items-center text-xs">
        <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
        <span className="text-gray-600">Critical (0-69)</span>
      </div>
      
      {(viewMode === 'graph' || viewMode === '3d') && (
        <>
          <div className="h-4 border-l border-gray-300 mx-2"></div>
          
          <div className="flex items-center text-xs">
            <div className="w-8 h-1 bg-gray-400 mr-1"></div>
            <span className="text-gray-600">Secure connection</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-8 h-1 border-t-2 border-dashed border-red-400 mr-1"></div>
            <span className="text-gray-600">Insecure connection</span>
          </div>
          
          <div className="h-4 border-l border-gray-300 mx-2"></div>
          
          <div className="flex items-center text-xs">
            <span className="inline-block w-4 h-4 bg-blue-500 rounded-full mr-1 animate-pulse"></span>
            <span className="text-gray-600">Active data flow</span>
          </div>
        </>
      )}
      
      <div className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-md flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-gray-600">Click on resources to see details</span>
      </div>
    </div>
  );
};

export default Legend;
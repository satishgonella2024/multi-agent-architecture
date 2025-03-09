// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/ViewControls.jsx
import React from 'react';

const ViewControls = ({ viewMode, setViewMode, colorMode, setColorMode }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex space-x-1">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
            viewMode === 'grid' 
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Card Grid
          </span>
        </button>
        <button
          onClick={() => setViewMode('graph')}
          className={`px-3 py-2 text-sm font-medium border-t border-b ${
            viewMode === 'graph' 
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Network Graph
          </span>
        </button>
        <button
          onClick={() => setViewMode('3d')}
          className={`px-3 py-2 text-sm font-medium rounded-r-md border ${
            viewMode === '3d' 
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            3D View
          </span>
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500 whitespace-nowrap">Color by:</span>
        <select 
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value)}
          className="block w-32 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="security">Security</option>
          <option value="cost">Cost</option>
          <option value="architecture">Architecture</option>
        </select>
      </div>
    </div>
  );
};

export default ViewControls;
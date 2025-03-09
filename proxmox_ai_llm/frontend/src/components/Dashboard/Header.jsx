// src/components/Dashboard/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';

const Header = ({ workflowData, refreshAllData }) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center text-gray-500 hover:text-gray-700">
            <Home className="w-5 h-5 mr-1" />
            <span>Home</span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Infrastructure Analysis</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={refreshAllData}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh</span>
          </button>
          <span className="text-sm text-gray-500">
            Status: <span className={`font-medium ${
              workflowData.status === 'completed' ? 'text-green-600' : 
              workflowData.status === 'failed' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {workflowData.status.charAt(0).toUpperCase() + workflowData.status.slice(1)}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
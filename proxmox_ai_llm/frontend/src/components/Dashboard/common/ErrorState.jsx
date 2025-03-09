// src/components/Dashboard/common/ErrorState.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const ErrorState = ({ error, refreshAllData }) => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
      <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
      <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
      <p className="text-gray-600 mb-6">{error}</p>
      <div className="flex justify-center">
        <Link to="/" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded mr-3">
          Back to Home
        </Link>
        <button 
          onClick={refreshAllData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export default ErrorState;
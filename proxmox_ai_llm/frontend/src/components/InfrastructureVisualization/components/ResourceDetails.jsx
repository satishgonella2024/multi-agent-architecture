// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/ResourceDetails.jsx
import React from 'react';
import { AlertTriangle, Link2, Lock, Unlock, Eye, Settings } from 'lucide-react';

import { getScoreBadgeColor, getMetricColor, getStatusColor, getIssueSeverityColor } from '../utils/colorUtils';
import { getResourceIcon } from '../utils/iconUtils';

const ResourceDetails = ({ resource, setSelectedResource, connections, resources }) => {
  if (!resource) return null;
  
  return (
    <div className="md:ml-4 mt-4 md:mt-0 md:w-80 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
      {/* Resource header with gradient background */}
      <div className={`p-4 ${
        resource.securityScore >= 90 
          ? 'bg-gradient-to-r from-green-500 to-green-600' 
          : resource.securityScore >= 70 
          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
          : 'bg-gradient-to-r from-red-500 to-red-600'
      } text-white`}>
        <div className="flex items-center">
          <div className="p-2 bg-white/20 rounded-lg">
            {getResourceIcon(resource.type)}
          </div>
          <div className="ml-3">
            <h4 className="font-bold text-lg">{resource.name}</h4>
            <span className="text-sm opacity-90">{resource.type}</span>
          </div>
          <button 
            onClick={() => setSelectedResource(null)}
            className="ml-auto p-1 rounded-full hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Status badge */}
        <div className="mt-3 flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(resource.status)}`}>
            {resource.status === 'healthy' ? 'Healthy' : 'Degraded'}
          </span>
          <span className="text-xs ml-2 opacity-80">
            Last updated: {new Date(resource.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      {/* Resource details */}
      <div className="p-4">
        {/* Performance metrics */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h5>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>CPU Usage</span>
                <span className="font-medium">{resource.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getMetricColor(resource.cpuUsage)}`}
                  style={{ width: `${resource.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Memory Usage</span>
                <span className="font-medium">{resource.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getMetricColor(resource.memoryUsage)}`}
                  style={{ width: `${resource.memoryUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Score cards */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Analysis Scores</h5>
          <div className="grid grid-cols-1 gap-2">
            <ScoreBadge score={resource.securityScore} label="Security" />
            <ScoreBadge score={resource.costScore} label="Cost" />
            <ScoreBadge score={resource.architectureScore} label="Architecture" />
          </div>
        </div>
        
        {/* Security issues */}
        {resource.issues && resource.issues.length > 0 && (
          <div className="mt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
              Security Issues ({resource.issues.length})
            </h5>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {resource.issues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs p-3 rounded-md border-l-4 ${getIssueSeverityColor(issue.severity)}`}
                >
                  <div className="font-bold">{issue.severity.toUpperCase()}</div>
                  <div className="mt-1">{issue.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Network connections */}
        <NetworkConnections 
          resource={resource}
          connections={connections}
          resources={resources}
          setSelectedResource={setSelectedResource}
        />
        
        {/* Action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button 
            className="py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </button>
          <button 
            className="py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </button>
        </div>
      </div>
    </div>
  );
};

// Score badge component
const ScoreBadge = ({ score, label }) => (
  <div className={`px-3 py-2 rounded-md text-xs font-medium ${getScoreBadgeColor(score)} border flex items-center justify-between`}>
    <span>{label}</span>
    <span className="font-bold">{score}</span>
  </div>
);

// Network connections component
const NetworkConnections = ({ resource, connections, resources, setSelectedResource }) => {
  const relevantConnections = connections.filter(
    conn => conn.source === resource.id || conn.target === resource.id
  );
  
  return (
    <div className="mt-4">
      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
        <Link2 className="w-4 h-4 mr-1 text-indigo-500" />
        Connected Resources 
      </h5>
      
      <div className="max-h-40 overflow-y-auto">
        {relevantConnections.map((connection, idx) => {
          // Find the other resource in this connection
          const otherResourceId = connection.source === resource.id 
            ? connection.target 
            : connection.source;
          const otherResource = resources.find(r => r.id === otherResourceId);
          
          if (!otherResource) return null;
          
          return (
            <div 
              key={idx} 
              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => setSelectedResource(otherResource)}
            >
              <div className="p-1 rounded-md mr-2 bg-gray-200 text-gray-700">
                {getResourceIcon(otherResource.type)}
              </div>
              <div>
                <div className="text-xs font-medium">{otherResource.name}</div>
                <div className="text-xs text-gray-500">{otherResource.type}</div>
              </div>
              <div className="ml-auto">
                {connection.secure ? 
                  <Lock className="w-4 h-4 text-green-500" /> : 
                  <Unlock className="w-4 h-4 text-red-500" />
                }
              </div>
            </div>
          );
        })}
        
        {relevantConnections.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-3">
            No connections to other resources
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceDetails;
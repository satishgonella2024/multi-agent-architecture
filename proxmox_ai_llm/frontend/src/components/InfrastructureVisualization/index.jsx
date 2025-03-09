// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/index.jsx
import React, { useState } from 'react';
import { Shield, Eye, Activity } from 'lucide-react';

// Components
import ResourceDetails from './components/ResourceDetails';
import ResourceCard from './components/ResourceCard';
import NetworkGraph from './components/NetworkGraph';
import ThreeDView from './components/ThreeDView';
import AnalyticsSummary from './components/AnalyticsSummary';
import Legend from './components/Legend';
import ViewControls from './components/ViewControls';

// Hooks
import useInfrastructureData from './hooks/useInfrastructureData';

const InfrastructureVisualization = ({ workflowData, securityIssues }) => {
  // View state
  const [viewMode, setViewMode] = useState('3d'); // 'grid', 'graph', or '3d'
  const [colorMode, setColorMode] = useState('security');
  const [showRealTimeData, setShowRealTimeData] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Process data using custom hook
  const {
    resources,
    resourceGroups,
    connections,
    selectedResource,
    setSelectedResource,
    hoveredResource,
    setHoveredResource,
    animatedElements,
    isLoading
  } = useInfrastructureData(workflowData, securityIssues);

  // Handle zoom for network and 3D views
  const handleZoom = (direction) => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(newZoom, 0.5), 2.5); // Limit zoom between 0.5 and 2.5
    });
  };

  // Render appropriate visualization based on view mode
  const renderVisualization = () => {
    if (isLoading) {
      return (
        <div className="w-full h-96 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-indigo-500"></div>
            <p className="mt-4 text-gray-500">Loading infrastructure data...</p>
          </div>
        </div>
      );
    }

    if (resources.length === 0) {
      return (
        <div className="w-full h-96 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500 text-center p-6">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <svg className="w-8 h-8 text-yellow-500 absolute bottom-0 right-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-medium">No infrastructure resources found</p>
            <p className="text-sm text-gray-400 mt-2">Waiting for analysis to complete...</p>
            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors">
              Run Analysis
            </button>
          </div>
        </div>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <div className="w-full h-96 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-6 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {resources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  colorMode={colorMode}
                  isSelected={selectedResource?.id === resource.id}
                  isAnimated={animatedElements.some(el => el.id === resource.id)}
                  onSelect={() => setSelectedResource(resource)}
                />
              ))}
            </div>
          </div>
        );
      case 'graph':
        return (
          <NetworkGraph
            resources={resources}
            resourceGroups={resourceGroups}
            connections={connections}
            selectedResource={selectedResource}
            setSelectedResource={setSelectedResource}
            hoveredResource={hoveredResource}
            setHoveredResource={setHoveredResource}
            animatedElements={animatedElements}
            colorMode={colorMode}
            zoom={zoom}
            handleZoom={handleZoom}
          />
        );
      case '3d':
      default:
        return (
          <ThreeDView
            resources={resources}
            resourceGroups={resourceGroups}
            connections={connections}
            selectedResource={selectedResource}
            setSelectedResource={setSelectedResource}
            hoveredResource={hoveredResource}
            setHoveredResource={setHoveredResource}
            animatedElements={animatedElements}
            colorMode={colorMode}
            zoom={zoom}
            handleZoom={handleZoom}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 -mx-4 -mt-4 px-4 py-3 rounded-t-lg mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Infrastructure Visualization
          </h3>
          <div className="flex space-x-3">
            <button 
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${showRealTimeData ? 'bg-white text-indigo-600' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}
              onClick={() => setShowRealTimeData(!showRealTimeData)}
            >
              <span className="flex items-center">
                <Activity className="w-3 h-3 mr-1" />
                Real-time Data
              </span>
            </button>
            <button 
              className="px-3 py-1 rounded-md bg-indigo-700 text-white text-xs font-medium hover:bg-indigo-800 transition-colors"
              onClick={() => setSelectedResource(null)}
            >
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                Reset View
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <ViewControls 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        colorMode={colorMode} 
        setColorMode={setColorMode} 
      />
      
      <div className="flex flex-col md:flex-row">
        {/* Main visualization area */}
        <div className="flex-grow">
          {renderVisualization()}
        </div>
        
        {/* Resource details sidebar */}
        {selectedResource && (
          <ResourceDetails 
            resource={selectedResource}
            setSelectedResource={setSelectedResource}
            connections={connections}
            resources={resources}
          />
        )}
      </div>
      
      {/* Analytics summary */}
      {resources.length > 0 && (
        <AnalyticsSummary resources={resources} />
      )}
      
      {/* Legend */}
      <Legend viewMode={viewMode} />
      
      {/* CSS for animated connections */}
      <style jsx>{`
        .connection-animated {
          stroke-dasharray: 10;
          animation: dash 1.5s linear infinite;
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: 20;
          }
        }
      `}</style>
    </div>
  );
};

export default InfrastructureVisualization;
// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Shield, DollarSign, Database, Server, Cloud, 
  HardDrive, Layers, Network, Link2, Lock, Unlock, Activity,
  Cpu, Globe, CheckCircle, XCircle, Eye, Zap, Settings
} from 'lucide-react';

const InfrastructureVisualization = ({ workflowData, securityIssues }) => {
  const [colorMode, setColorMode] = useState('security');
  const [selectedResource, setSelectedResource] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // 'grid', 'graph', or '3d'
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [animatedElements, setAnimatedElements] = useState([]);
  const [hoveredResource, setHoveredResource] = useState(null);
  const [showRealTimeData, setShowRealTimeData] = useState(false);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);
  
  // Extract resources from workflowData
  const resources = React.useMemo(() => {
    if (!workflowData?.cost?.details?.analyzed_resources) {
      return [];
    }
    
    return workflowData.cost.details.analyzed_resources.map(resource => {
      // Find security issues for this resource
      const resourceIssues = securityIssues.filter(issue => 
        issue.affected_resource === resource.name || 
        issue.affected_resource.includes(resource.name)
      );
      
      // Calculate security score based on issues
      const securityScore = resourceIssues.length === 0 
        ? 95 
        : 100 - (resourceIssues.reduce((sum, issue) => {
            if (issue.severity === 'critical') return sum + 40;
            if (issue.severity === 'high') return sum + 30;
            if (issue.severity === 'medium') return sum + 20;
            return sum + 10;
          }, 0));
      
      // Add realistic metrics
      return {
        id: resource.name,
        name: resource.name,
        type: resource.resource_type,
        issues: resourceIssues,
        securityScore: Math.max(0, Math.min(100, securityScore)),
        costScore: Math.random() * 30 + 70, // Placeholder 
        architectureScore: Math.random() * 30 + 70, // Placeholder
        status: Math.random() > 0.9 ? 'degraded' : 'healthy',
        cpuUsage: Math.floor(Math.random() * 100),
        memoryUsage: Math.floor(Math.random() * 100),
        networkTraffic: Math.floor(Math.random() * 1000),
        lastUpdated: new Date().toISOString()
      };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
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
      
      <div className="flex flex-col md:flex-row">
        {/* Main visualization area */}
        <div className="flex-grow">
          {isLoading ? (
            <div className="w-full h-96 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-indigo-500"></div>
                <p className="mt-4 text-gray-500">Loading infrastructure data...</p>
              </div>
            </div>
          ) : resources.length === 0 ? (
            <div className="w-full h-96 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
              <div className="text-gray-500 text-center p-6">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <Layers className="w-24 h-24 text-gray-300" />
                  <AlertTriangle className="w-8 h-8 text-yellow-500 absolute bottom-0 right-0" />
                </div>
                <p className="text-lg font-medium">No infrastructure resources found</p>
                <p className="text-sm text-gray-400 mt-2">Waiting for analysis to complete...</p>
                <button className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors">
                  Run Analysis
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            // Modern card grid layout
            generateGridView()
          ) : viewMode === 'graph' ? (
            // Network graph view
            generateNetworkGraph()
          ) : (
            // 3D isometric view
            generate3DView()
          )}
        </div>
        
        {/* Resource information sidebar when a resource is selected */}
        {selectedResource && (
          <div className="md:ml-4 mt-4 md:mt-0 md:w-80 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
            {/* Resource header with gradient background */}
            <div className={`p-4 ${
              selectedResource.securityScore >= 90 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : selectedResource.securityScore >= 70 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            } text-white`}>
              <div className="flex items-center">
                <div className="p-2 bg-white/20 rounded-lg">
                  {getIcon(selectedResource.type)}
                </div>
                <div className="ml-3">
                  <h4 className="font-bold text-lg">{selectedResource.name}</h4>
                  <span className="text-sm opacity-90">{selectedResource.type}</span>
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedResource.status === 'healthy' 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {selectedResource.status === 'healthy' ? 'Healthy' : 'Degraded'}
                </span>
                <span className="text-xs ml-2 opacity-80">
                  Last updated: {new Date(selectedResource.lastUpdated).toLocaleTimeString()}
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
                      <span className="font-medium">{selectedResource.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedResource.cpuUsage > 80 ? 'bg-red-500' : 
                          selectedResource.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${selectedResource.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Memory Usage</span>
                      <span className="font-medium">{selectedResource.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedResource.memoryUsage > 80 ? 'bg-red-500' : 
                          selectedResource.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${selectedResource.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Score cards */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Analysis Scores</h5>
                <div className="grid grid-cols-1 gap-2">
                  {getScoreBadge(selectedResource.securityScore, "Security")}
                  {getScoreBadge(selectedResource.costScore, "Cost")}
                  {getScoreBadge(selectedResource.architectureScore, "Architecture")}
                </div>
              </div>
              
              {/* Security issues */}
              {selectedResource.issues && selectedResource.issues.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                    Security Issues ({selectedResource.issues.length})
                  </h5>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {selectedResource.issues.map((issue, idx) => (
                      <div 
                        key={idx} 
                        className={`text-xs p-3 rounded-md border-l-4 ${
                          issue.severity === 'critical' 
                            ? 'bg-red-50 border-red-500 text-red-800'
                            : issue.severity === 'high' 
                            ? 'bg-red-50 border-red-400 text-red-700'
                            : issue.severity === 'medium'
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'bg-yellow-50 border-yellow-500 text-yellow-700'
                        }`}
                      >
                        <div className="font-bold">{issue.severity.toUpperCase()}</div>
                        <div className="mt-1">{issue.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Network connections */}
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Link2 className="w-4 h-4 mr-1 text-indigo-500" />
                  Connected Resources 
                </h5>
                
                <div className="max-h-40 overflow-y-auto">
                  {connections
                    .filter(conn => conn.source === selectedResource.id || conn.target === selectedResource.id)
                    .map((connection, idx) => {
                      // Find the other resource in this connection
                      const otherResourceId = connection.source === selectedResource.id 
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
                          <div className={`p-1 rounded-md mr-2 ${getColor(otherResource)} text-white`}>
                            {getIcon(otherResource.type)}
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
                  
                  {connections.filter(conn => 
                    conn.source === selectedResource.id || conn.target === selectedResource.id
                  ).length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-3">
                      No connections to other resources
                    </div>
                  )}
                </div>
              </div>
              
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
        )}
      </div>
      
      {/* Enhanced analytics and summary bar */}
      {resources.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall security score */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-500">Security Score</h4>
                <Shield className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-end">
                <span className="text-2xl font-bold text-gray-800">
                  {Math.round(resources.reduce((sum, r) => sum + r.securityScore, 0) / resources.length)}
                </span>
                <span className="text-sm text-gray-500 ml-1">/100</span>
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                  +3%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="bg-indigo-600 h-1 rounded-full"
                  style={{ width: `${Math.round(resources.reduce((sum, r) => sum + r.securityScore, 0) / resources.length)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Security issues summary */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-500">Security Issues</h4>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex items-end">
                <span className="text-2xl font-bold text-gray-800">
                  {resources.reduce((sum, r) => sum + r.issues.length, 0)}
                </span>
                <span className="text-sm text-gray-500 ml-1">total</span>
              </div>
              <div className="flex items-center mt-2 text-xs">
                <span className="px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 mr-1">{
                  resources.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0)
                } critical</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-orange-100 text-orange-800 mr-1">{
                  resources.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0)
                } high</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-yellow-100 text-yellow-800">{
                  resources.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'medium' || i.severity === 'low').length, 0)
                } other</span>
              </div>
            </div>
            
            {/* Resource status */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-500">Resource Status</h4>
                <Activity className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-end">
                <span className="text-2xl font-bold text-gray-800">
                  {resources.filter(r => r.status === 'healthy').length}
                </span>
                <span className="text-sm text-gray-500 ml-1">healthy</span>
                <span className="ml-2 text-2xl font-bold text-gray-800">
                  {resources.filter(r => r.status !== 'healthy').length}
                </span>
                <span className="text-sm text-gray-500 ml-1">degraded</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: `${(resources.filter(r => r.status === 'healthy').length / resources.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Performance metrics */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-500">System Performance</h4>
                <Cpu className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Average CPU</span>
                    <span className="font-medium">{Math.round(resources.reduce((sum, r) => sum + r.cpuUsage, 0) / resources.length)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${Math.round(resources.reduce((sum, r) => sum + r.cpuUsage, 0) / resources.length)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Average Memory</span>
                    <span className="font-medium">{Math.round(resources.reduce((sum, r) => sum + r.memoryUsage, 0) / resources.length)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-purple-500 h-1 rounded-full"
                      style={{ width: `${Math.round(resources.reduce((sum, r) => sum + r.memoryUsage, 0) / resources.length)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
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
    });
  }, [workflowData, securityIssues]);
  
  // Generate connections between resources
  useEffect(() => {
    if (resources.length > 1) {
      const newConnections = [];
      
      // Group resources by type
      const resourcesByType = {};
      resources.forEach(resource => {
        const type = resource.type || 'unknown';
        if (!resourcesByType[type]) {
          resourcesByType[type] = [];
        }
        resourcesByType[type].push(resource);
      });
      
      // Generate connections between different resource types
      Object.entries(resourcesByType).forEach(([sourceType, sourceResources]) => {
        Object.entries(resourcesByType).forEach(([targetType, targetResources]) => {
          if (sourceType !== targetType) {
            // Create logical connections between certain resource types
            if (
              (sourceType.includes('instance') && targetType.includes('database')) ||
              (sourceType.includes('instance') && targetType.includes('bucket')) ||
              (sourceType.includes('vpc') && targetType.includes('instance'))
            ) {
              sourceResources.forEach(source => {
                // Connect to 1-2 random resources of the target type
                const numConnections = Math.floor(Math.random() * 2) + 1;
                const shuffledTargets = [...targetResources].sort(() => 0.5 - Math.random());
                
                for (let i = 0; i < Math.min(numConnections, shuffledTargets.length); i++) {
                  const target = shuffledTargets[i];
                  
                  // Add the connection with properties
                  newConnections.push({
                    source: source.id,
                    target: target.id,
                    type: `${sourceType}_to_${targetType}`,
                    secure: Math.random() > 0.2, // 80% secure connections
                    strength: Math.random() * 0.5 + 0.5, // Connection strength 0.5-1.0
                    trafficLevel: Math.floor(Math.random() * 100),
                    animated: Math.random() > 0.7, // Some connections are animated
                  });
                }
              });
            }
          }
        });
      });
      
      setConnections(newConnections);
      
      // Start some real-time animations for random elements
      const animatedItems = resources
        .filter(() => Math.random() > 0.7) // Randomly select ~30% of resources
        .map(resource => ({
          id: resource.id,
          pulseRate: Math.random() * 1000 + 500, // Random pulse between 500-1500ms
        }));
      
      setAnimatedElements(animatedItems);
    }
  }, [resources]);
  
  // Group resources by type
  const resourceGroups = React.useMemo(() => {
    const groups = {};
    resources.forEach(resource => {
      const type = resource.type || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(resource);
    });
    return groups;
  }, [resources]);

  // For 3D isometric view - mapping resource types to layers
  const typeLayerMap = React.useMemo(() => {
    const layerMap = {};
    Object.keys(resourceGroups).forEach((type, index) => {
      layerMap[type] = index;
    });
    return layerMap;
  }, [resourceGroups]);
  
  // Function to convert 3D coordinates to isometric 2D
  const isometricTransform = (x, y, z) => {
    // Isometric projection
    const centerX = 500; // SVG center X
    const centerY = 350; // SVG center Y
    const isoX = (x - y) * Math.cos(Math.PI/6);
    const isoY = (x + y) * Math.sin(Math.PI/6) - z;
    return {
      x: centerX + isoX * 60,
      y: centerY + isoY * 60
    };
  };
  
  // For force-directed layout
  useEffect(() => {
    if (viewMode === 'graph' && resources.length > 0 && svgRef.current) {
      // This would be where we'd implement D3's force layout in a real app
      // For this demo, we'll simulate the result
    }
  }, [viewMode, resources, svgRef?.current]);
  
  // Get color based on score and mode
  const getColor = (resource) => {
    let score;
    
    if (colorMode === 'security') {
      score = resource.securityScore;
    } else if (colorMode === 'cost') {
      score = resource.costScore;
    } else {
      score = resource.architectureScore;
    }
    
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Get background color for SVG elements
  const getBgColor = (resource) => {
    let score;
    
    if (colorMode === 'security') {
      score = resource.securityScore;
    } else if (colorMode === 'cost') {
      score = resource.costScore;
    } else {
      score = resource.architectureScore;
    }
    
    if (score >= 90) return '#10B981'; // green-500
    if (score >= 70) return '#F59E0B'; // yellow-500
    return '#EF4444'; // red-500
  };
  
  // Render icon based on resource type
  const getIcon = (type) => {
    if (type.includes('vpc') || type.includes('network')) {
      return <Cloud className="w-6 h-6" />;
    } else if (type.includes('instance') || type.includes('compute')) {
      return <Server className="w-6 h-6" />;
    } else if (type.includes('database') || type.includes('db')) {
      return <Database className="w-6 h-6" />;
    } else if (type.includes('storage') || type.includes('disk') || type.includes('bucket')) {
      return <HardDrive className="w-6 h-6" />;
    } else if (type.includes('lambda') || type.includes('function')) {
      return <Cpu className="w-6 h-6" />;
    } else if (type.includes('gateway') || type.includes('api')) {
      return <Globe className="w-6 h-6" />;
    } else {
      return <Layers className="w-6 h-6" />;
    }
  };
  
  // Generate status indicator
  const getStatusIndicator = (resource) => {
    const isActive = animatedElements.some(el => el.id === resource.id);
    const animate = isActive ? 'animate-pulse' : '';
    
    if (resource.status === 'healthy') {
      return <CheckCircle className={`w-4 h-4 text-green-500 ${animate}`} />;
    } else {
      return <XCircle className={`w-4 h-4 text-red-500 ${animate}`} />;
    }
  };
  
  // Get score badge
  const getScoreBadge = (score, label) => {
    const color = score >= 90 
      ? 'bg-green-100 text-green-800 border-green-200'
      : score >= 70 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-red-100 text-red-800 border-red-200';
    
    return (
      <div className={`px-3 py-2 rounded-md text-xs font-medium ${color} border flex items-center justify-between`}>
        <span>{label}</span>
        <span className="font-bold">{score}</span>
      </div>
    );
  };

  // Handle zoom
  const handleZoom = (direction) => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.min(Math.max(newZoom, 0.5), 2.5); // Limit zoom between 0.5 and 2.5
    });
  };

  // Enhanced grid view with tiles
  const generateGridView = () => {
    if (resources.length === 0) return null;
    
    return (
      <div className="w-full h-96 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map(resource => {
            const isAnimated = animatedElements.some(el => el.id === resource.id);
            const scoreValue = colorMode === 'security' 
              ? resource.securityScore
              : colorMode === 'cost' 
              ? resource.costScore 
              : resource.architectureScore;
              
            const scoreColor = scoreValue >= 90 
              ? 'from-green-400 to-green-500'
              : scoreValue >= 70 
              ? 'from-yellow-400 to-yellow-500'
              : 'from-red-400 to-red-500';
              
            return (
              <div 
                key={resource.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden shadow-md transition-all duration-300 transform ${
                  selectedResource?.id === resource.id 
                    ? 'ring-2 ring-indigo-500 scale-105' 
                    : 'hover:scale-102'
                }`}
                onClick={() => setSelectedResource(resource)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${scoreColor} opacity-90`}></div>
                
                <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/30"></div>
                
                {/* Grid lines background */}
                <div className="absolute inset-0 overflow-hidden opacity-20">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`grid-h-${i}`} className="absolute h-px w-full bg-white" style={{ top: `${20 + i * 20}%` }}></div>
                  ))}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`grid-v-${i}`} className="absolute w-px h-full bg-white" style={{ left: `${20 + i * 20}%` }}></div>
                  ))}
                </div>
                
                <div className="relative p-4">
                  <div className="flex items-center mb-2 text-white">
                    <div className="p-2 rounded-full mr-2 bg-white/20 backdrop-blur-sm">
                      {getIcon(resource.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold truncate max-w-[160px]">{resource.name}</h4>
                      <p className="text-xs opacity-80">{resource.type}</p>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="ml-auto">
                      {getStatusIndicator(resource)}
                    </div>
                  </div>
                  
                  {/* Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-1 text-white text-xs">
                    <div className="flex items-center">
                      <Cpu className="w-3 h-3 mr-1" />
                      <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                          style={{ width: `${resource.cpuUsage}%` }}
                        />
                      </div>
                      <span className="ml-1">{resource.cpuUsage}%</span>
                    </div>
                    <div className="flex items-center">
                      <Server className="w-3 h-3 mr-1" />
                      <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                          style={{ width: `${resource.memoryUsage}%` }}
                        />
                      </div>
                      <span className="ml-1">{resource.memoryUsage}%</span>
                    </div>
                  </div>
                  
                  {/* Score display */}
                  <div className="mt-3 text-white text-xs">
                    <div className="flex justify-between items-center">
                      <span>{colorMode === 'security' ? 'Security' : colorMode === 'cost' ? 'Cost' : 'Architecture'}</span>
                      <span className="font-bold">{scoreValue}/100</span>
                    </div>
                    <div className="relative w-full h-2 bg-white/20 mt-1 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                        style={{ width: `${scoreValue}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Issues badge */}
                  {resource.issues.length > 0 && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {resource.issues.length}
                    </div>
                  )}
                  
                  {/* Animated pulse for active resources */}
                  {isAnimated && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8">
                      <div className="absolute w-8 h-8 rounded-full bg-white/30 animate-ping"></div>
                      <div className="absolute w-6 h-6 ml-1 mt-1 rounded-full bg-white/70"></div>
                      <Activity className="absolute w-4 h-4 ml-2 mt-2 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // SVG network graph
  const generateNetworkGraph = () => {
    if (resources.length === 0) return null;
    
    const svgWidth = 1000;
    const svgHeight = 700;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    
    // More organic layout - position nodes in groups
    const nodePositions = {};
    
    // Position nodes by type in clusters
    Object.entries(resourceGroups).forEach(([type, groupResources], groupIndex, groupsArray) => {
      const angle = (groupIndex / groupsArray.length) * 2 * Math.PI;
      const groupCenterX = centerX + (0.6 * centerX) * Math.cos(angle);
      const groupCenterY = centerY + (0.6 * centerY) * Math.sin(angle);
      
      // Arrange resources in a cluster around the group center
      groupResources.forEach((resource, index) => {
        const resourceAngle = (index / groupResources.length) * 2 * Math.PI;
        const radius = 50 + (Math.random() * 30); // Add some randomness
        
        nodePositions[resource.id] = {
          x: groupCenterX + radius * Math.cos(resourceAngle),
          y: groupCenterY + radius * Math.sin(resourceAngle),
          groupX: groupCenterX,
          groupY: groupCenterY
        };
      });
    });
    
    return (
      <div className="relative w-full">
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 z-10 flex flex-col bg-white rounded-lg shadow-md">
          <button 
            className="p-2 hover:bg-gray-100 rounded-t-lg border-b"
            onClick={() => handleZoom('in')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded-b-lg"
            onClick={() => handleZoom('out')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>
        
        <svg 
          ref={svgRef} 
          width="100%" 
          height="650" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            {/* Gradient definitions for visual appeal */}
            <linearGradient id="secureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="insecureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.7" />
            </linearGradient>
            
            {/* Arrow markers for connections */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6B7280" />
            </marker>
            <marker
              id="arrowRed"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
            </marker>
            
            {/* Glow filter for selected nodes */}
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#3B82F6" floodOpacity="0.7" result="glowColor" />
              <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
              <feMerge>
                <feMergeNode in="softGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Pulse animation for data flow */}
            <filter id="pulse" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
              <feBlend in="SourceGraphic" in2="glow" mode="normal" />
            </filter>
          </defs>
          
          {/* Group backgrounds */}
          {Object.entries(resourceGroups).map(([type, groupResources], groupIndex) => {
            if (groupResources.length === 0) return null;
            
            // Find center of this group
            const sampleResource = groupResources[0];
            const position = nodePositions[sampleResource.id];
            if (!position) return null;
            
            return (
              <g key={`group-${type}`}>
                <circle 
                  cx={position.groupX} 
                  cy={position.groupY} 
                  r={80 + groupResources.length * 5}
                  fill={`rgba(209, 213, 219, ${selectedResource && groupResources.some(r => r.id === selectedResource.id) ? 0.4 : 0.1})`}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                <text 
                  x={position.groupX} 
                  y={position.groupY - 90 - groupResources.length * 3} 
                  textAnchor="middle" 
                  fill="#4B5563" 
                  fontSize="14"
                  fontWeight="bold"
                >
                  {type}
                </text>
              </g>
            );
          })}
          
          {/* Connections */}
          {connections.map((connection, index) => {
            const source = nodePositions[connection.source];
            const target = nodePositions[connection.target];
            if (!source || !target) return null;
            
            // Quadratic bezier curve for more organic connections
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            
            // Add some curve to the line
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate control point for the curve (perpendicular to line)
            const offset = 0.3 * dist + Math.random() * 30;
            const controlX = midX + offset * (dy / dist);
            const controlY = midY - offset * (dx / dist);
            
            const path = `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
            
            // Style based on connection security
            const strokeStyle = connection.secure 
              ? { stroke: '#6B7280', strokeDasharray: '' } 
              : { stroke: '#EF4444', strokeDasharray: '5,3' };
              
            const markerEnd = connection.secure ? 'url(#arrow)' : 'url(#arrowRed)';
            const isHighlighted = selectedResource && 
              (selectedResource.id === connection.source || selectedResource.id === connection.target);
            
            return (
              <g key={`connection-${index}`} className={isHighlighted ? 'opacity-100' : 'opacity-40'}>
                <path 
                  d={path} 
                  fill="none"
                  strokeWidth={connection.strength * 3}
                  markerEnd={markerEnd}
                  {...strokeStyle}
                  opacity={isHighlighted ? 1 : 0.6}
                  className={connection.animated ? 'connection-animated' : ''}
                />
                
                {/* Data flow animation */}
                {connection.animated && (
                  <circle r="4" fill="#3B82F6" opacity="0.8" filter="url(#pulse)">
                    <animateMotion
                      path={path}
                      begin="0s"
                      dur={`${3 + Math.random() * 2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
          
          {/* Resource nodes */}
          {resources.map((resource) => {
            const position = nodePositions[resource.id];
            if (!position) return null;
            
            // Determine if this node is animated
            const isAnimated = animatedElements.some(el => el.id === resource.id);
            const isSelected = selectedResource?.id === resource.id;
            const isHighlighted = selectedResource 
              ? selectedResource.id === resource.id || 
                connections.some(c => 
                  (c.source === selectedResource.id && c.target === resource.id) ||
                  (c.target === selectedResource.id && c.source === resource.id)
                )
              : true;
            
            // Get color based on score
            const bgColor = getBgColor(resource);
            
            // Badge showing number of issues
            const showIssueBadge = resource.issues && resource.issues.length > 0;
            
            return (
              <g 
                key={resource.id} 
                transform={`translate(${position.x}, ${position.y})`}
                onClick={() => setSelectedResource(resource)}
                onMouseEnter={() => setHoveredResource(resource)}
                onMouseLeave={() => setHoveredResource(null)}
                className="cursor-pointer"
                opacity={isHighlighted ? 1 : 0.4}
                filter={isSelected ? 'url(#glow)' : ''}
                style={{ transition: 'opacity 0.3s ease' }}
              >
                {/* Background glow for active resources */}
                {isAnimated && (
                  <circle r="32" fill={bgColor} opacity="0.2">
                    <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                
                {/* Node circle with shine effect */}
                <circle r="25" fill={bgColor} />
                <ellipse rx="15" ry="10" cx="-5" cy="-5" fill="white" opacity="0.2" />
                
                {/* Active indicator pulse */}
                {resource.cpuUsage > 80 && (
                  <circle r="30" stroke="#EF4444" strokeWidth="2" fill="none" opacity="0.8">
                    <animate attributeName="r" values="25;33;25" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                
                {/* Resource icon */}
                <foreignObject x="-12" y="-12" width="24" height="24">
                  <div className="flex items-center justify-center text-white">
                    {getIcon(resource.type)}
                  </div>
                </foreignObject>
                
                {/* Resource name */}
                <text 
                  y="40" 
                  textAnchor="middle" 
                  fill="#000" 
                  fontSize="12"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {resource.name.length > 15 ? resource.name.substring(0, 12) + '...' : resource.name}
                </text>
                
                {/* Issue count badge */}
                {showIssueBadge && (
                  <g transform="translate(18, -18)">
                    <circle r="10" fill="#EF4444" />
                    <text 
                      textAnchor="middle" 
                      fill="white" 
                      fontSize="10" 
                      fontWeight="bold"
                      dominantBaseline="middle"
                    >
                      {resource.issues.length}
                    </text>
                  </g>
                )}
                
                {/* Status indicator */}
                <g transform="translate(-18, -18)">
                  <circle r="8" fill="white" />
                  <foreignObject x="-6" y="-6" width="12" height="12">
                    <div>
                      {getStatusIndicator(resource)}
                    </div>
                  </foreignObject>
                </g>
                
                {/* Hover tooltip */}
                {hoveredResource?.id === resource.id && !selectedResource && (
                  <foreignObject x="-100" y="-100" width="200" height="60">
                    <div className="bg-gray-800 text-white p-2 rounded text-xs opacity-90">
                      <div className="font-bold">{resource.name}</div>
                      <div className="flex justify-between mt-1">
                        <span>CPU: {resource.cpuUsage}%</span>
                        <span>MEM: {resource.memoryUsage}%</span>
                      </div>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };
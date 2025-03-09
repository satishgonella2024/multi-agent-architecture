// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/hooks/useInfrastructureData.js
import { useState, useEffect, useMemo } from 'react';

const useInfrastructureData = (workflowData, securityIssues) => {
  // State
  const [connections, setConnections] = useState([]);
  const [animatedElements, setAnimatedElements] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [hoveredResource, setHoveredResource] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Extract resources from workflowData
  const resources = useMemo(() => {
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
    });
  }, [workflowData, securityIssues]);
  
  // Group resources by type
  const resourceGroups = useMemo(() => {
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
  
  // Generate connections between resources
  useEffect(() => {
    if (resources.length > 1) {
      setIsLoading(true);
      
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
      const newConnections = [];
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
      setIsLoading(false);
    }
  }, [resources]);
  
  // Reset selection when resources change
  useEffect(() => {
    setSelectedResource(null);
  }, [workflowData]);
  
  return {
    resources,
    resourceGroups,
    connections,
    selectedResource,
    setSelectedResource,
    hoveredResource,
    setHoveredResource,
    animatedElements,
    isLoading
  };
};

export default useInfrastructureData;
// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/utils/layoutUtils.js

/**
 * Calculate positions for network graph nodes
 */
export const calculateNetworkNodePositions = (resources, resourceGroups) => {
    const nodePositions = {};
    const svgWidth = 1000;
    const svgHeight = 700;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    
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
    
    return nodePositions;
  };
  
  /**
   * Calculate positions for 3D isometric view
   */
  export const calculate3DPositions = (resources, resourceGroups) => {
    const nodePositions = {};
    const svgWidth = 1000;
    const svgHeight = 700;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
  
    // Create mapping from resource types to layers
    const typeLayerMap = {};
    let currentLayer = 0;
    
    Object.keys(resourceGroups).forEach(type => {
      typeLayerMap[type] = currentLayer;
      currentLayer++;
    });
    
    // Position resources in isometric grid
    Object.entries(resourceGroups).forEach(([type, groupResources]) => {
      const layer = typeLayerMap[type];
      const totalInLayer = groupResources.length;
      const layerGridSize = Math.ceil(Math.sqrt(totalInLayer));
      
      groupResources.forEach((resource, index) => {
        const row = Math.floor(index / layerGridSize);
        const col = index % layerGridSize;
        
        // Offset grid to center it
        const offsetX = (layerGridSize - 1) / 2;
        const offsetY = (layerGridSize - 1) / 2;
        
        // Calculate 3D coordinates with jitter for more organic layout
        const jitterX = (Math.random() - 0.5) * 0.3;
        const jitterY = (Math.random() - 0.5) * 0.3;
        
        const x = (col - offsetX) + jitterX;
        const y = (row - offsetY) + jitterY;
        const z = layer * 0.5; // Separate layers vertically
        
        // Convert to isometric
        const position = isometricTransform(x, y, z, centerX, centerY);
        
        nodePositions[resource.id] = {
          ...position,
          z: z,
          layer: layer
        };
      });
    });
    
    // Add layer information to the result
    return { nodePositions, typeLayerMap };
  };
  
  /**
   * Transform 3D coordinates to isometric 2D coordinates
   */
  export const isometricTransform = (x, y, z, centerX, centerY) => {
    // Isometric projection
    const isoX = (x - y) * Math.cos(Math.PI/6);
    const isoY = (x + y) * Math.sin(Math.PI/6) - z;
    return {
      x: centerX + isoX * 60,
      y: centerY + isoY * 60
    };
  };
  
  /**
   * Sort resources by layer for proper 3D rendering (back to front)
   */
  export const sortResourcesByLayer = (resources, typeLayerMap) => {
    return [...resources].sort((a, b) => {
      const layerA = typeLayerMap[a.type] || 0;
      const layerB = typeLayerMap[b.type] || 0;
      return layerB - layerA; // Draw from back to front
    });
  };
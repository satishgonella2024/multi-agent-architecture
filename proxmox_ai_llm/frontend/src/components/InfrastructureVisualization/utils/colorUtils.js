// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/utils/colorUtils.js

/**
 * Get CSS class for resource color based on score and mode
 */
export const getColorClass = (resource, colorMode) => {
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
  
  /**
   * Get background color for SVG elements
   */
  export const getBackgroundColor = (resource, colorMode) => {
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
  
  /**
   * Get gradient color classes for a resource based on score
   */
  export const getGradientColors = (scoreValue) => {
    return scoreValue >= 90 
      ? 'from-green-400 to-green-500'
      : scoreValue >= 70 
      ? 'from-yellow-400 to-yellow-500'
      : 'from-red-400 to-red-500';
  };
  
  /**
   * Get color class for score badge
   */
  export const getScoreBadgeColor = (score) => {
    return score >= 90 
      ? 'bg-green-100 text-green-800 border-green-200'
      : score >= 70 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };
  
  /**
   * Get color class for metric values (CPU, Memory)
   */
  export const getMetricColor = (value) => {
    return value > 80 
      ? 'bg-red-500' 
      : value > 60 
      ? 'bg-yellow-500' 
      : 'bg-green-500';
  };
  
  /**
   * Get color class for status badge
   */
  export const getStatusColor = (status) => {
    return status === 'healthy' 
      ? 'bg-green-200 text-green-800' 
      : 'bg-red-200 text-red-800';
  };
  
  /**
   * Get color class for issue severity
   */
  export const getIssueSeverityColor = (severity) => {
    switch(severity) {
      case 'critical':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'high':
        return 'bg-red-50 border-red-400 text-red-700';
      case 'medium':
        return 'bg-orange-50 border-orange-500 text-orange-700';
      default:
        return 'bg-yellow-50 border-yellow-500 text-yellow-700';
    }
  };
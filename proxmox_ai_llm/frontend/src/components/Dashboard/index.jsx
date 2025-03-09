// src/components/Dashboard/index.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkflow } from '../../hooks/useWorkflow';
import { Shield, Database, DollarSign, Check } from 'lucide-react';

// Import common components
import LoadingIndicator from './common/LoadingIndicator';
import ErrorState from './common/ErrorState';
import Header from './Header';
import SummaryBar from './SummaryBar';
import TabNavigation from './TabNavigation';

// Import tab components
import Overview from './tabs/Overview';
import Security from './tabs/Security';
import Architecture from './tabs/Architecture';
import Cost from './tabs/Cost';
import Validation from './tabs/Validation';

const Dashboard = () => {
  // Get workflowId from URL parameters
  const { id: urlWorkflowId } = useParams();
  const workflowId = urlWorkflowId || localStorage.getItem('currentWorkflowId');
  
  console.log("Dashboard using workflowId:", workflowId);
  
  const { isLoading, error, workflowData, refreshAgentData, refreshAllData } = useWorkflow(workflowId);
  const [activeTab, setActiveTab] = useState('overview');
  const [apiErrors, setApiErrors] = useState({});
  
  // Function to retry fetching specific agent data
  const handleRetryAgentData = async (agentName) => {
    try {
      setApiErrors(prev => ({ ...prev, [agentName]: null }));
      await refreshAgentData(agentName);
    } catch (err) {
      setApiErrors(prev => ({ ...prev, [agentName]: err.message }));
    }
  };

  // Main loading indicator
  if (isLoading) {
    return <LoadingIndicator />;
  }
  
  // Main error case
  if (error) {
    return <ErrorState error={error} refreshAllData={refreshAllData} />;
  }
  
  // Extract scores and summary data from agent outputs
  const securityScore = workflowData.security?.details?.security_score || 0;
  const architectureScore = workflowData.architecture?.details?.architecture_score || 0;
  const validationScore = workflowData.validation?.details?.validation_score || 0;
  
  // Calculate cost efficiency score (this is a derived metric)
  const costTier = workflowData.cost?.details?.cost_tier || 'UNKNOWN';
  const costEfficiencyScore = costTier === 'LOW' ? 90 : costTier === 'MEDIUM' ? 70 : 50;
  
  // Count issues
  const securityIssues = workflowData.security?.details?.vulnerabilities || [];
  const criticalIssues = securityIssues.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const warningIssues = securityIssues.filter(i => i.severity === 'medium').length;
  
  // Estimate resources from cost data
  const resourceCount = workflowData.cost?.details?.analyzed_resources?.length || 0;
  
  // Dummy history data for chart (in a real app, you'd store historical data)
  const historyData = [
    { date: "Last Week", securityScore: securityScore - 5, architectureScore: architectureScore - 7, costEfficiencyScore: costEfficiencyScore - 3, validationScore: validationScore - 2 },
    { date: "Current", securityScore, architectureScore, costEfficiencyScore, validationScore }
  ];
  
  // Extract resources for the resources table
  const resources = [];
  
  if (workflowData.cost?.details?.analyzed_resources) {
    workflowData.cost.details.analyzed_resources.forEach(resource => {
      // Count issues for this resource
      const securityIssuesCount = securityIssues.filter(i => 
        i.affected_resource === resource.name || 
        i.affected_resource.includes(resource.name)
      ).length;
      
      resources.push({
        name: resource.name,
        type: resource.resource_type,
        securityIssues: securityIssuesCount,
        costOptimizations: 0,  // Would need to parse from optimization suggestions
        architectureIssues: 0  // Would need to parse from architecture findings
      });
    });
  }
  
  // Extract cost breakdown
  const costBreakdown = [];
  
  if (workflowData.cost?.details?.cost_breakdown) {
    for (const [category, value] of Object.entries(workflowData.cost.details.cost_breakdown)) {
      costBreakdown.push({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: parseFloat(value)
      });
    }
  }

  // Combine scores for passing to components
  const scores = {
    securityScore,
    architectureScore,
    validationScore,
    costEfficiencyScore
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with navigation */}
      <Header workflowData={workflowData} refreshAllData={refreshAllData} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {/* Infrastructure Name and Summary */}
        <SummaryBar 
          status={workflowData.status}
          resourceCount={resourceCount}
          criticalIssues={criticalIssues}
          warningIssues={warningIssues}
          validationScore={validationScore}
          monthlyCost={workflowData.cost?.details?.monthly_cost}
        />

        {/* Tabs */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab content */}
        {activeTab === 'overview' && (
          <Overview 
            workflowData={workflowData}
            scores={scores}
            resources={resources}
            historyData={historyData}
            securityIssues={securityIssues}
            apiErrors={apiErrors}
            handleRetryAgentData={handleRetryAgentData}
            setActiveTab={setActiveTab}
          />
        )}
        
        {activeTab === 'security' && (
          <Security 
            workflowData={workflowData}
            scores={scores}
            apiErrors={apiErrors}
            handleRetryAgentData={handleRetryAgentData}
          />
        )}
        
        {activeTab === 'architecture' && (
          <Architecture 
            workflowData={workflowData}
            scores={scores}
            apiErrors={apiErrors}
            handleRetryAgentData={handleRetryAgentData}
          />
        )}
        
        {activeTab === 'cost' && (
          <Cost 
            workflowData={workflowData}
            costBreakdown={costBreakdown}
            apiErrors={apiErrors}
            handleRetryAgentData={handleRetryAgentData}
          />
        )}
        
        {activeTab === 'validation' && (
          <Validation 
            workflowData={workflowData}
            scores={scores}
            apiErrors={apiErrors}
            handleRetryAgentData={handleRetryAgentData}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
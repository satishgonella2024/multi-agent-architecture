// src/components/Dashboard/tabs/Overview.jsx
import React from 'react';
import { Shield, Database, DollarSign, Check } from 'lucide-react';
import ScoreCard from '../common/ScoreCard';
import TrendsChart from '../common/TrendsChart';
import ResourceTable from '../common/ResourceTable';
import SecurityIssuesList from '../common/SecurityIssuesList';
import InfrastructureVisualization from '../../InfrastructureVisualization';

const Overview = ({ workflowData, scores, resources, historyData, securityIssues, apiErrors, handleRetryAgentData, setActiveTab }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ScoreCard 
          title="Security" 
          score={scores.securityScore} 
          icon={<Shield className="w-6 h-6 text-blue-500" />} 
          agentName="security"
          apiErrors={apiErrors}
          handleRetryAgentData={handleRetryAgentData}
        />
        <ScoreCard 
          title="Architecture" 
          score={scores.architectureScore} 
          icon={<Database className="w-6 h-6 text-purple-500" />} 
          agentName="architect"
          apiErrors={apiErrors}
          handleRetryAgentData={handleRetryAgentData}
        />
        <ScoreCard 
          title="Cost Efficiency" 
          score={scores.costEfficiencyScore} 
          icon={<DollarSign className="w-6 h-6 text-green-500" />} 
          agentName="cost_estimation"
          apiErrors={apiErrors}
          handleRetryAgentData={handleRetryAgentData}
        />
        <ScoreCard 
          title="Validation" 
          score={scores.validationScore} 
          icon={<Check className="w-6 h-6 text-orange-500" />} 
          agentName="validator"
          apiErrors={apiErrors}
          handleRetryAgentData={handleRetryAgentData}
        />
      </div>

      {/* Trends Chart */}
      <TrendsChart data={historyData} />

      {/* Visualization */}
      <InfrastructureVisualization 
        workflowData={workflowData}
        securityIssues={securityIssues}
      />

      {/* Resource Issues Grid */}
      <ResourceTable resources={resources} />

      {/* Security Issues Summary */}
      <SecurityIssuesList 
        securityData={workflowData.security}
        setActiveTab={setActiveTab}
        maxItems={3}
        showViewAll
      />
    </>
  );
};

export default Overview;
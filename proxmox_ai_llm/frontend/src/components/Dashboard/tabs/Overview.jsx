// src/components/Dashboard/tabs/Overview.jsx
import React from 'react';
import { Shield, Database, DollarSign, Check } from 'lucide-react';
import ScoreCard from '../common/ScoreCard';
import TrendsChart from '../common/TrendsChart';
import ResourceTable from '../common/ResourceTable';
import SecurityIssuesList from '../common/SecurityIssuesList';
import InfrastructureVisualization from '../../InfrastructureVisualization';
import ScoreGauge from '../../UI/ScoreGauge';

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
      
      {/* Tab Navigation */}
      <div className="flex justify-between border-b mb-6 mt-8">
        <div className="px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600">Overview</div>
        <div className="px-6 py-3 text-gray-500">Security</div>
        <div className="px-6 py-3 text-gray-500">Architecture</div>
        <div className="px-6 py-3 text-gray-500">Cost Analysis</div>
        <div className="px-6 py-3 text-gray-500">Validation</div>
      </div>
      
      {/* Analysis Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-6">Analysis Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <ScoreGauge 
            title="Security" 
            score={Number(scores.securityScore) || 0}
            icon={<Shield size={16} className="text-blue-500" />}
            color="blue"
          />
          <ScoreGauge 
            title="Architecture" 
            score={Number(scores.architectureScore) || 0}
            icon={<Database size={16} className="text-yellow-500" />}
            color="yellow"
          />
          <ScoreGauge 
            title="Cost Efficiency" 
            score={Number(scores.costEfficiencyScore) || 0}
            icon={<DollarSign size={16} className="text-green-500" />}
            color="green"
          />
          <ScoreGauge 
            title="Validation" 
            score={Number(scores.validationScore) || 0}
            icon={<Check size={16} className="text-orange-500" />}
            color="orange"
          />
        </div>
      </div>
      
      {/* Key Findings */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Key Findings</h2>
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center text-green-600">
            <Check className="mr-2" size={18} />
            <span>No major issues detected. Your infrastructure design looks good overall.</span>
          </div>
        </div>
      </div>
      
      {/* Resource Issues Grid */}
      <ResourceTable resources={resources} />
      
      {/* Security Issues Summary */}
      <SecurityIssuesList
        securityData={workflowData?.security}
        setActiveTab={setActiveTab}
        maxItems={3}
        showViewAll
      />
    </>
  );
};

export default Overview;
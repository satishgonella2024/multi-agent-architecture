// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/AnalyticsSummary.jsx
import React from 'react';
import { Shield, AlertTriangle, Activity, Cpu } from 'lucide-react';

const AnalyticsSummary = ({ resources }) => {
  // Calculate aggregated metrics
  const avgSecurityScore = Math.round(resources.reduce((sum, r) => sum + r.securityScore, 0) / resources.length);
  const totalIssues = resources.reduce((sum, r) => sum + r.issues.length, 0);
  const criticalIssues = resources.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0);
  const highIssues = resources.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0);
  const otherIssues = resources.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'medium' || i.severity === 'low').length, 0);
  const healthyCount = resources.filter(r => r.status === 'healthy').length;
  const avgCpuUsage = Math.round(resources.reduce((sum, r) => sum + r.cpuUsage, 0) / resources.length);
  const avgMemoryUsage = Math.round(resources.reduce((sum, r) => sum + r.memoryUsage, 0) / resources.length);
  
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall security score */}
        <SummaryCard 
          title="Security Score"
          icon={<Shield className="w-5 h-5 text-indigo-500" />}
          value={avgSecurityScore}
          label="/100"
          badge={<span className="ml-auto text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">+3%</span>}
          progressWidth={avgSecurityScore}
          progressColor="bg-indigo-600"
        />
        
        {/* Security issues summary */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-500">Security Issues</h4>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">
              {totalIssues}
            </span>
            <span className="text-sm text-gray-500 ml-1">total</span>
          </div>
          <div className="flex items-center mt-2 text-xs">
            <span className="px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 mr-1">{criticalIssues} critical</span>
            <span className="px-1.5 py-0.5 rounded-sm bg-orange-100 text-orange-800 mr-1">{highIssues} high</span>
            <span className="px-1.5 py-0.5 rounded-sm bg-yellow-100 text-yellow-800">{otherIssues} other</span>
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
              {healthyCount}
            </span>
            <span className="text-sm text-gray-500 ml-1">healthy</span>
            <span className="ml-2 text-2xl font-bold text-gray-800">
              {resources.length - healthyCount}
            </span>
            <span className="text-sm text-gray-500 ml-1">degraded</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              className="bg-green-500 h-1 rounded-full"
              style={{ width: `${(healthyCount / resources.length) * 100}%` }}
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
                <span className="font-medium">{avgCpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${avgCpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Average Memory</span>
                <span className="font-medium">{avgMemoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-purple-500 h-1 rounded-full"
                  style={{ width: `${avgMemoryUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable summary card component
const SummaryCard = ({ title, icon, value, label, badge, progressWidth, progressColor }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-medium text-gray-500">{title}</h4>
      {icon}
    </div>
    <div className="flex items-end">
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      <span className="text-sm text-gray-500 ml-1">{label}</span>
      {badge}
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
      <div 
        className={`${progressColor} h-1 rounded-full`}
        style={{ width: `${progressWidth}%` }}
      ></div>
    </div>
  </div>
);

export default AnalyticsSummary;
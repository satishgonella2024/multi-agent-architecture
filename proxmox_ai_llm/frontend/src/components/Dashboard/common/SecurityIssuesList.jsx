// src/components/Dashboard/common/SecurityIssuesList.jsx
import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';

const SecurityIssuesList = ({ securityData, setActiveTab, maxItems = null, showViewAll = true }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-8">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Security Issues</h3>
    {securityData ? (
      securityData.details?.vulnerabilities && 
      securityData.details.vulnerabilities.length > 0 ? (
        <div className="space-y-4">
          {(maxItems ? securityData.details.vulnerabilities.slice(0, maxItems) : securityData.details.vulnerabilities).map((issue, idx) => (
            <div key={idx} className="border rounded-lg p-3">
              <div className="flex items-start">
                <div className={`mt-0.5 mr-3 rounded-full p-1 ${
                  issue.severity === 'critical' || issue.severity === 'high' ? 'bg-red-100 text-red-500' : 
                  issue.severity === 'medium' ? 'bg-orange-100 text-orange-500' : 
                  'bg-yellow-100 text-yellow-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      issue.severity === 'critical' || issue.severity === 'high' ? 'text-red-700' : 
                      issue.severity === 'medium' ? 'text-orange-700' : 
                      'text-yellow-700'
                    }`}>
                      {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                    </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{issue.affected_resource}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{issue.description}</p>
                </div>
              </div>
            </div>
          ))}
          {showViewAll && maxItems && securityData.details.vulnerabilities.length > maxItems && (
            <div className="text-center">
              <button 
                onClick={() => setActiveTab('security')}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                View all {securityData.details.vulnerabilities.length} security issues
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-lg flex items-center">
          <Check className="w-6 h-6 text-green-500 mr-3" />
          <p className="text-green-700">No security issues found. Your infrastructure is secure!</p>
        </div>
      )
    ) : (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded mb-4"></div>
        <div className="h-20 bg-gray-200 rounded mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )}
  </div>
);

export default SecurityIssuesList;
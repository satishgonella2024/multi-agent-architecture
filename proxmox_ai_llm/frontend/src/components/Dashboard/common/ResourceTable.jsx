// src/components/Dashboard/common/ResourceTable.jsx
import React from 'react';
import { Server } from 'lucide-react';

const ResourceTable = ({ resources }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-8">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium text-gray-900">Resources</h3>
      {resources.length === 0 ? (
        <div className="text-sm text-gray-500">No resources available</div>
      ) : null}
    </div>
    
    {resources.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Security Issues
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost Optimizations
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Architecture Issues
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.map((resource, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {resource.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.securityIssues > 0 ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {resource.securityIssues} {resource.securityIssues === 1 ? 'Issue' : 'Issues'}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      None
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.costOptimizations > 0 ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {resource.costOptimizations} {resource.costOptimizations === 1 ? 'Opportunity' : 'Opportunities'}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Optimized
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.architectureIssues > 0 ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      {resource.architectureIssues} {resource.architectureIssues === 1 ? 'Issue' : 'Issues'}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      None
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    Fix All
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="bg-gray-50 p-8 rounded-lg flex flex-col items-center justify-center">
        <Server className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">No resources found in the analysis.</p>
        <p className="text-gray-400 text-sm text-center mt-2">
          This could be because the analysis is still in progress or there was an error.
        </p>
      </div>
    )}
  </div>
);

export default ResourceTable;
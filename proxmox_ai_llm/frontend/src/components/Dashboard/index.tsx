import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkflow } from '../../hooks/useWorkflow';
import { ScoreSummary } from '../../types/workflow';
import { Loader2, XCircle, PlusCircle, AlertCircle } from 'lucide-react';
import AgentWorkflow from '../InfrastructureVisualization/AgentWorkflow';

type TabType = 'overview' | 'security' | 'architecture' | 'cost' | 'validation';

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [backendError, setBackendError] = useState<string | null>(null);
  
  const { workflowData, isLoading, error } = useWorkflow(id || null);

  useEffect(() => {
    if (error && (error.includes('ECONNREFUSED') || error.includes('ECONNRESET'))) {
      setBackendError('Backend connection failed. Using fallback visualization.');
    } else {
      setBackendError(null);
    }
  }, [error]);

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
    }
  }, [id, navigate]);

  if (!id) {
    return null;
  }

  if (isLoading && !backendError) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !backendError && !workflowData) {
    return (
      <div className="text-center p-8 text-red-500">
        <XCircle className="w-8 h-8 mx-auto mb-2" />
        <p>{error || 'Failed to load workflow data'}</p>
      </div>
    );
  }

  const calculateScores = (): ScoreSummary => {
    if (!workflowData) {
      return {
        security: 0,
        architecture: 0,
        cost: 0,
        validation: 0,
      };
    }
    
    return {
      security: workflowData.results.security?.details?.security_score || 0,
      architecture: workflowData.results.architecture?.details?.architecture_score || 0,
      cost: workflowData.results.cost?.details?.monthly_cost ? 100 : 0,
      validation: workflowData.results.validation?.details?.validation_results?.every(r => r.passed) ? 100 : 0,
    };
  };

  const scores = calculateScores();

  return (
    <div className="container mx-auto px-4 py-8">
      {backendError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-yellow-700">{backendError}</p>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Infrastructure Analysis Dashboard</h1>
          <Link 
            to="/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Workflow
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Security Score</h3>
            <p className="text-3xl font-bold text-blue-600">{scores.security}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Architecture Score</h3>
            <p className="text-3xl font-bold text-green-600">{scores.architecture}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Cost Score</h3>
            <p className="text-3xl font-bold text-purple-600">{scores.cost}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Validation Score</h3>
            <p className="text-3xl font-bold text-orange-600">{scores.validation}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            {['overview', 'security', 'architecture', 'cost', 'validation'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab as TabType)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Agent Workflow</h2>
              <AgentWorkflow workflowData={workflowData} />
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Security Analysis</h2>
              {workflowData?.results.security ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">Security Score: {scores.security}%</h3>
                    <p className="text-gray-700">
                      {scores.security > 80
                        ? 'Your infrastructure has good security practices.'
                        : scores.security > 50
                        ? 'Your infrastructure has some security concerns that should be addressed.'
                        : 'Your infrastructure has significant security issues that need immediate attention.'}
                    </p>
                  </div>

                  {workflowData.results.security.vulnerabilities?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Vulnerabilities</h3>
                      <ul className="space-y-2">
                        {workflowData.results.security.vulnerabilities.map((vuln, idx) => (
                          <li key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                            <span className="font-medium text-red-700">
                              {vuln.severity.toUpperCase()}:
                            </span>{' '}
                            {vuln.description}
                            <p className="text-sm text-gray-600 mt-1">
                              Affected: {vuln.affected_resource}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {workflowData.results.security.recommendations?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Recommendations</h3>
                      <ul className="space-y-2">
                        {workflowData.results.security.recommendations.map((rec, idx) => (
                          <li key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-gray-800">{rec.description}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Implementation: {rec.implementation}
                            </p>
                            <p className="text-sm font-medium text-blue-700 mt-1">
                              Importance: {rec.importance}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No security analysis available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Architecture Analysis</h2>
              {workflowData.results.architecture ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">
                      Architecture Score: {scores.architecture}%
                    </h3>
                    <p className="text-gray-700">
                      {scores.architecture > 80
                        ? 'Your infrastructure has a well-designed architecture.'
                        : scores.architecture > 50
                        ? 'Your infrastructure architecture has some areas for improvement.'
                        : 'Your infrastructure architecture needs significant redesign.'}
                    </p>
                  </div>

                  {workflowData.results.architecture.findings?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Findings</h3>
                      <ul className="space-y-2">
                        {workflowData.results.architecture.findings.map((finding, idx) => (
                          <li
                            key={idx}
                            className="bg-yellow-50 p-3 rounded border border-yellow-200"
                          >
                            <span className="font-medium text-yellow-700">
                              {finding.category.toUpperCase()}:
                            </span>{' '}
                            {finding.description}
                            <p className="text-sm text-gray-600 mt-1">
                              Affected: {finding.affected_resource}
                            </p>
                            <p className="text-sm font-medium text-yellow-700 mt-1">
                              Impact: {finding.impact}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {workflowData.results.architecture.optimizations?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Optimizations</h3>
                      <ul className="space-y-2">
                        {workflowData.results.architecture.optimizations.map((opt, idx) => (
                          <li key={idx} className="bg-green-50 p-3 rounded border border-green-200">
                            <p className="text-gray-800">{opt.description}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Implementation: {opt.implementation}
                            </p>
                            <div className="flex justify-between mt-1">
                              <p className="text-sm font-medium text-green-700">
                                Benefit: {opt.benefit}
                              </p>
                              <p className="text-sm font-medium text-blue-700">
                                Effort: {opt.effort}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No architecture analysis available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'cost' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Cost Analysis</h2>
              {workflowData.results.cost ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">
                      Estimated Monthly Cost: ${workflowData.results.cost.monthly_cost?.toFixed(2)}
                    </h3>
                    <p className="text-gray-700">
                      Annual Cost: ${workflowData.results.cost.annual_cost?.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Cost Tier: {workflowData.results.cost.cost_tier}
                    </p>
                  </div>

                  {workflowData.results.cost.resources_cost?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Resource Costs</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Resource
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Instance
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Monthly Cost
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Assumptions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {workflowData.results.cost.resources_cost.map((resource, idx) => (
                              <tr key={idx}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {resource.resource_type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {resource.instance}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ${resource.monthly_cost?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {resource.assumptions}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {workflowData.results.cost.optimization_suggestions?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Cost Optimization Suggestions</h3>
                      <ul className="space-y-2">
                        {workflowData.results.cost.optimization_suggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            className="bg-purple-50 p-3 rounded border border-purple-200"
                          >
                            <p className="text-gray-800">{suggestion.description}</p>
                            <div className="flex justify-between mt-1">
                              <p className="text-sm font-medium text-purple-700">
                                Potential Savings: ${suggestion.potential_savings?.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Implementation: {suggestion.implementation}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No cost analysis available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'validation' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
              {workflowData.results.validation ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">
                      Validation Score: {scores.validation}%
                    </h3>
                    <p className="text-gray-700">
                      {scores.validation === 100
                        ? 'All validation checks passed successfully.'
                        : scores.validation > 50
                        ? 'Some validation checks failed but most passed.'
                        : 'Multiple validation checks failed.'}
                    </p>
                  </div>

                  {workflowData.results.validation.validation_results?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Validation Checks</h3>
                      <ul className="space-y-2">
                        {workflowData.results.validation.validation_results.map((result, idx) => (
                          <li
                            key={idx}
                            className={`p-3 rounded border ${
                              result.passed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center">
                              <span
                                className={`inline-block w-4 h-4 rounded-full mr-2 ${
                                  result.passed ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              ></span>
                              <span
                                className={`font-medium ${
                                  result.passed ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {result.passed ? 'PASSED' : 'FAILED'}:
                              </span>{' '}
                              {result.check_name}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 ml-6">
                              {result.description}
                            </p>
                            {!result.passed && result.fix_suggestion && (
                              <p className="text-sm text-red-600 mt-1 ml-6">
                                Suggestion: {result.fix_suggestion}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No validation results available yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import WorkflowHistory from './components/WorkflowHistory';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { Loader2 } from 'lucide-react';
import { startWorkflow } from './services/workflowService';

// Home component with the form
const Home: React.FC = () => {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [temperature, setTemperature] = useState(0.7);
  
  // Clear current workflow ID when the component mounts
  useEffect(() => {
    // Only clear if we're on the home page explicitly (not redirected from a workflow)
    if (window.location.pathname === '/' || window.location.pathname === '/new') {
      localStorage.removeItem('currentWorkflowId');
      setWorkflowId(null);
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a deployment request');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Submitting prompt:", prompt);
      const result = await startWorkflow(prompt, {
        max_tokens: maxTokens,
        temperature: temperature
      });
      console.log("Workflow started:", result);
      
      if (result && result.workflow_id) {
        // Store the workflow ID in state
        setWorkflowId(result.workflow_id);
        
        // Also store in localStorage as a backup
        localStorage.setItem('currentWorkflowId', result.workflow_id);
        
        console.log("Setting workflow ID:", result.workflow_id);
        
        // Force a navigation to the workflow page
        window.location.href = `/workflow/${result.workflow_id}`;
      } else {
        setError('Failed to get workflow ID from response');
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError('Failed to start workflow. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Try to recover workflow ID from localStorage if not in state
  useEffect(() => {
    if (!workflowId) {
      const savedWorkflowId = localStorage.getItem('currentWorkflowId');
      if (savedWorkflowId) {
        setWorkflowId(savedWorkflowId);
        console.log("Recovered workflow ID from localStorage:", savedWorkflowId);
        // Redirect to the workflow page
        window.location.href = `/workflow/${savedWorkflowId}`;
      }
    }
  }, [workflowId]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Infrastructure Analysis System
        </h2>
        
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                Enter your deployment request
              </label>
              <div className="mt-1">
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="E.g., Deploy a simple web application with EC2 and S3"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Describe what you want to deploy, and our agents will analyze it.
              </p>
            </div>
            
            <div className="flex items-center">
              <button
                type="button"
                className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>
            </div>
            
            {showAdvancedOptions && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
                    Max Tokens: {maxTokens}
                  </label>
                  <input
                    id="maxTokens"
                    type="range"
                    min="500"
                    max="4000"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls the maximum length of the generated response.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                    Temperature: {temperature.toFixed(1)}
                  </label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls randomness: lower values are more focused, higher values are more creative.
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSubmitting || !prompt.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Infrastructure'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <WorkflowProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<Home />} />
            <Route path="/workflow/:id" element={<Dashboard />} />
            <Route path="/history" element={<WorkflowHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </WorkflowProvider>
    </BrowserRouter>
  );
};

export default App; 
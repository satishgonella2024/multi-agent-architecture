// Update your App.jsx to properly handle navigation
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { startWorkflow } from './services/workflowService';

const App = () => {
  const [workflowId, setWorkflowId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a deployment request');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Submitting prompt:", prompt);
      const result = await startWorkflow(prompt);
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
  React.useEffect(() => {
    if (!workflowId) {
      const savedWorkflowId = localStorage.getItem('currentWorkflowId');
      if (savedWorkflowId) {
        setWorkflowId(savedWorkflowId);
        console.log("Recovered workflow ID from localStorage:", savedWorkflowId);
      }
    }
  }, []);
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Multi-Agent Infrastructure Analysis</h1>
          </div>
        </header>
        
        <Routes>
          <Route path="/" element={
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
                    
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {isSubmitting ? 'Analyzing...' : 'Analyze Infrastructure'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          } />
          
          <Route path="/workflow/:id" element={<Dashboard />} />
          
          {workflowId && (
            <Route path="*" element={<Navigate to={`/workflow/${workflowId}`} replace />} />
          )}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
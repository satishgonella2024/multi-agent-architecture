// proxmox_ai_llm/frontend/src/components/Analysis/NewAnalysisPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Cpu, RefreshCw } from 'lucide-react';
import { startWorkflow } from '../../services/workflowService';

const NewAnalysisPage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Example infrastructure scenarios to help users get started
  const examples = [
    {
      title: 'Web Application',
      description: 'Deploy a simple web application with EC2 and S3',
      prompt: 'Deploy a simple web application with EC2 and S3. The application should be highly available across multiple availability zones and should include proper security controls.'
    },
    {
      title: 'Database Cluster',
      description: 'Set up an RDS database cluster with read replicas',
      prompt: 'Create an AWS RDS database cluster with MySQL, including read replicas for high availability. It should be in a private subnet with appropriate security groups and backup configuration.'
    },
    {
      title: 'Microservices Platform',
      description: 'Deploy microservices with containers and load balancing',
      prompt: 'Build a microservices platform using ECS or EKS with container orchestration, load balancing, and proper networking. Include monitoring and auto-scaling capabilities.'
    }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter your infrastructure requirements');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Start a new workflow with the user's prompt
      const response = await startWorkflow(prompt);
      
      if (response && response.workflow_id) {
        // Navigate to the workflow page to see the results
        navigate(`/workflow/${response.workflow_id}`);
      } else {
        setError('Failed to start workflow. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError(err.message || 'Failed to start analysis. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  const handleExampleClick = (examplePrompt) => {
    setPrompt(examplePrompt);
    // Focus the textarea
    document.getElementById('prompt-textarea').focus();
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">New Infrastructure Analysis</h1>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Enter your deployment request
          </h2>
          <p className="text-gray-600 mb-4">
            Describe what you want to deploy, and our agents will analyze it.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <textarea
                id="prompt-textarea"
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="E.g., Deploy a simple web application with EC2 and S3"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Analyze Infrastructure
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-gray-50 p-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-800 mb-3">
            Example scenarios to get started
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {examples.map((example, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-md p-3 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                onClick={() => handleExampleClick(example.prompt)}
              >
                <h4 className="font-medium text-gray-800">{example.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{example.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-indigo-50 p-4 border-t border-indigo-100 flex items-center">
          <Cpu className="h-5 w-5 text-indigo-500 mr-2" />
          <p className="text-sm text-indigo-700">
            Our multi-agent system will analyze your request, generate infrastructure code, and evaluate it for security, architecture, cost, and compliance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewAnalysisPage;
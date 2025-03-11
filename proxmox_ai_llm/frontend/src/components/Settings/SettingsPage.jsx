// proxmox_ai_llm/frontend/src/components/Settings/SettingsPage.jsx
import React, { useState } from 'react';
import { Save, RefreshCw, Server, Database, Shield, Cpu } from 'lucide-react';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Sample settings - replace with actual settings from your app
  const [settings, setSettings] = useState({
    agentSettings: {
      orchestratorEndpoint: 'http://localhost:8000/api/agents/event',
      refreshInterval: 5000,
      maxRetries: 3
    },
    ollamaSettings: {
      endpoint: 'http://localhost:11434/api/generate',
      model: 'llama2',
      temperature: 0.7,
      maxTokens: 2048
    },
    databaseSettings: {
      weaviateUrl: 'http://localhost:8080',
      vectorDimension: 768,
      indexName: 'MultiAgent'
    },
    displaySettings: {
      theme: 'light',
      animateTransitions: true,
      showDetailedLogs: false
    }
  });
  
  const handleChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setSaved(false);
  };
  
  const handleSave = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update saved state
    setSaved(true);
    setLoading(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
      
      {saved && (
        <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <Check size={18} className="mr-2" />
          Settings saved successfully
        </div>
      )}
      
      <div className="space-y-6">
        {/* Agent Settings */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Cpu className="h-5 w-5 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Agent Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orchestrator Endpoint
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={settings.agentSettings.orchestratorEndpoint}
                onChange={(e) => handleChange('agentSettings', 'orchestratorEndpoint', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Interval (ms)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.agentSettings.refreshInterval}
                  onChange={(e) => handleChange('agentSettings', 'refreshInterval', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.agentSettings.maxRetries}
                  onChange={(e) => handleChange('agentSettings', 'maxRetries', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Ollama Settings */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Server className="h-5 w-5 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Ollama Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ollama Endpoint
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={settings.ollamaSettings.endpoint}
                onChange={(e) => handleChange('ollamaSettings', 'endpoint', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={settings.ollamaSettings.model}
                onChange={(e) => handleChange('ollamaSettings', 'model', e.target.value)}
              >
                <option value="llama2">Llama 2</option>
                <option value="mistral">Mistral</option>
                <option value="falcon">Falcon</option>
                <option value="gemma">Gemma</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.ollamaSettings.temperature}
                  onChange={(e) => handleChange('ollamaSettings', 'temperature', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.ollamaSettings.maxTokens}
                  onChange={(e) => handleChange('ollamaSettings', 'maxTokens', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Database Settings */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Database className="h-5 w-5 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Database Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weaviate URL
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={settings.databaseSettings.weaviateUrl}
                onChange={(e) => handleChange('databaseSettings', 'weaviateUrl', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vector Dimension
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.databaseSettings.vectorDimension}
                  onChange={(e) => handleChange('databaseSettings', 'vectorDimension', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Index Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.databaseSettings.indexName}
                  onChange={(e) => handleChange('databaseSettings', 'indexName', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Display Settings */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <Monitor className="h-5 w-5 text-indigo-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-800">Display Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={settings.displaySettings.theme}
                onChange={(e) => handleChange('displaySettings', 'theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="animateTransitions"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={settings.displaySettings.animateTransitions}
                onChange={(e) => handleChange('displaySettings', 'animateTransitions', e.target.checked)}
              />
              <label htmlFor="animateTransitions" className="ml-2 block text-sm text-gray-700">
                Animate transitions
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showDetailedLogs"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={settings.displaySettings.showDetailedLogs}
                onChange={(e) => handleChange('displaySettings', 'showDetailedLogs', e.target.checked)}
              />
              <label htmlFor="showDetailedLogs" className="ml-2 block text-sm text-gray-700">
                Show detailed logs
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Missing components for icons
const Check = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={2}
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const Monitor = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={2}
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

export default SettingsPage;
// src/components/Dashboard/TabNavigation.jsx
import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab }) => (
  <div className="border-b border-gray-200 mb-6">
    <nav className="flex space-x-8">
      <TabButton 
        id="overview" 
        label="Overview" 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <TabButton 
        id="security" 
        label="Security Analysis" 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <TabButton 
        id="architecture" 
        label="Architecture" 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <TabButton 
        id="cost" 
        label="Cost Analysis" 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <TabButton 
        id="validation" 
        label="Validation Results" 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
    </nav>
  </div>
);

const TabButton = ({ id, label, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(id)}
    className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
      activeTab === id 
        ? 'border-indigo-500 text-indigo-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

export default TabNavigation;
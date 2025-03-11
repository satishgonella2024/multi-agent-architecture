// proxmox_ai_llm/frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import DashboardPage from './components/Dashboard/DashboardPage';
import AgentWorkflow from './components/InfrastructureVisualization/AgentWorkflow';
import NewAnalysisPage from './components/Analysis/NewAnalysisPage';
import HistoryPage from './components/Analysis/HistoryPage';
import SettingsPage from './components/Settings/SettingsPage';
import WorkflowPage from './components/Analysis/WorkflowPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Dashboard is the default route */}
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Create new analysis */}
          <Route path="new-analysis" element={<NewAnalysisPage />} />
          
          {/* Workflow history */}
          <Route path="history" element={<HistoryPage />} />
          
          {/* View specific workflow */}
          <Route path="workflow/:workflowId" element={<WorkflowPage />} />
          
          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Redirect any unknown routes to the dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
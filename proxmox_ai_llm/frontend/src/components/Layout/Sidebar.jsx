// proxmox_ai_llm/frontend/src/components/Layout/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  History, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  BarChart2,
  Server,
  Shield,
  Database
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Define navigation items
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Home size={20} />, 
      path: '/dashboard' 
    },
    { 
      id: 'new-analysis', 
      label: 'New Analysis', 
      icon: <PlusCircle size={20} />, 
      path: '/new-analysis' 
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: <History size={20} />, 
      path: '/history' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings size={20} />, 
      path: '/settings' 
    },
  ];
  
  // Additional category for recent workflows
  const recentWorkflows = [
    { 
      id: 'workflow-1', 
      label: 'Web App Deployment', 
      icon: <Server size={16} />, 
      path: '/workflow/abcd-1234',
      timestamp: '10 min ago'
    },
    { 
      id: 'workflow-2', 
      label: 'Database Cluster', 
      icon: <Database size={16} />, 
      path: '/workflow/efgh-5678',
      timestamp: '3 hours ago'
    },
    { 
      id: 'workflow-3', 
      label: 'Security Analysis', 
      icon: <Shield size={16} />, 
      path: '/workflow/ijkl-9012',
      timestamp: 'Yesterday'
    },
  ];
  
  const isActivePath = (path) => {
    if (path === '/dashboard' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div 
      className={`sidebar bg-gray-50 border-r border-gray-200 h-screen transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo and collapse toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center">
              <BarChart2 className="h-6 w-6 text-indigo-600" />
              <span className="ml-2 font-semibold text-gray-800">Infrastructure AI</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1 rounded-full hover:bg-gray-200 ${collapsed ? 'mx-auto' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        {/* Main navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center p-2 rounded-md transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
          
          {/* Recent workflows section */}
          {!collapsed && (
            <div className="mt-6">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Workflows
              </h3>
              <ul className="mt-2 space-y-1">
                {recentWorkflows.map((workflow) => (
                  <li key={workflow.id}>
                    <button
                      onClick={() => navigate(workflow.path)}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-200 text-sm"
                    >
                      <div className="flex items-center max-w-[85%]">
                        <span className="flex-shrink-0 text-gray-500">{workflow.icon}</span>
                        <span className="ml-2 truncate text-gray-700">{workflow.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">{workflow.timestamp}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => navigate('/history')}
                    className="w-full flex items-center p-2 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    View all workflows
                    <ChevronRight size={14} className="ml-1" />
                  </button>
                </li>
              </ul>
            </div>
          )}
        </nav>
        
        {/* User/version info */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          {!collapsed && (
            <div className="flex justify-between">
              <span>v1.0.0</span>
              <span>AI Multi-Agent</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
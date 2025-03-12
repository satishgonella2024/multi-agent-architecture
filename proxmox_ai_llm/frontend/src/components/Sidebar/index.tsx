import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { Home, Settings, History, Activity, PlusCircle, Trash2, RefreshCw, Loader2 } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { workflowHistory, clearWorkflowHistory, refreshWorkflowHistory, isHistoryLoading } = useWorkflowContext();
  const location = useLocation();

  const isActivePath = (path: string) => {
    if (path === '/new') {
      return location.pathname === '/new' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  const navLinkClasses = (path: string) => `
    flex items-center space-x-2 p-2 rounded-md transition-colors
    ${isActivePath(path) 
      ? 'bg-indigo-50 text-indigo-700' 
      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'}
  `;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 flex-grow">
        <div className="flex items-center space-x-2 mb-8">
          <Activity className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">InfraGuardian</h2>
        </div>

        <nav className="space-y-1">
          <Link to="/" className={navLinkClasses('/new')}>
            <PlusCircle className="w-5 h-5" />
            <span>New Workflow</span>
          </Link>

          <Link to="/history" className={navLinkClasses('/history')}>
            <History className="w-5 h-5" />
            <span>Workflow History</span>
          </Link>

          <Link to="/settings" className={navLinkClasses('/settings')}>
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-500">Recent Workflows</h3>
          <div className="flex space-x-2">
            {workflowHistory.length > 0 && (
              <button
                onClick={clearWorkflowHistory}
                className="text-xs text-gray-500 hover:text-red-500 flex items-center"
                title="Clear history"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </button>
            )}
            <button
              onClick={() => refreshWorkflowHistory()}
              className="text-xs text-gray-500 hover:text-indigo-500 flex items-center"
              title="Refresh history"
              disabled={isHistoryLoading}
            >
              {isHistoryLoading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1" />
              )}
              Refresh
            </button>
          </div>
        </div>
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {isHistoryLoading && workflowHistory.length === 0 ? (
            <li className="text-sm text-gray-500 flex items-center">
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Loading history...
            </li>
          ) : workflowHistory.length === 0 ? (
            <li className="text-sm text-gray-500 italic">
              No recent workflows
            </li>
          ) : (
            <>
              {workflowHistory.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/workflow/${item.id}`}
                    className={`block text-sm truncate ${
                      location.pathname === `/workflow/${item.id}`
                        ? 'text-indigo-600 font-medium'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    {item.name || `Workflow ${item.id.slice(0, 8)}`}
                    <span className="block text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
              {workflowHistory.length > 5 && (
                <li className="pt-2">
                  <Link
                    to="/history"
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    View all workflows →
                  </Link>
                </li>
              )}
            </>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar; 
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronRight, User, Bell, HelpCircle } from 'lucide-react';

const Header = ({ title, onRefresh, workflowId, status }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Generate breadcrumbs based on current location
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Default breadcrumbs start with Home
    const breadcrumbs = [{ label: 'Home', path: '/' }];
    
    // Build breadcrumb path segments
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Handle special segments
      if (segment === 'workflow' && index < pathSegments.length - 1) {
        // Skip the 'workflow' segment itself but use it to label the ID
        return;
      } else if (index === pathSegments.length - 1 && pathSegments[index - 1] === 'workflow') {
        // This is a workflow ID
        breadcrumbs.push({
          label: `Workflow ${segment.substring(0, 8)}...`,
          path: currentPath
        });
      } else {
        // Format other segments nicely
        const label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        breadcrumbs.push({ label, path: currentPath });
      }
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {/* Breadcrumbs */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.path} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight size={16} className="text-gray-400 mx-1" />
                  )}
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={`text-sm ${
                      index === breadcrumbs.length - 1
                        ? 'font-medium text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {crumb.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          
          {/* Workflow status badge */}
          {workflowId && status && (
            <span className={`ml-4 px-2 py-1 text-xs rounded-full ${
              status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Refresh"
            >
              <Refresh size={20} />
            </button>
          )}
          
          {/* Notifications */}
          <button className="p-1 rounded-full hover:bg-gray-100 text-gray-500 relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          {/* Help */}
          <button className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <HelpCircle size={20} />
          </button>
          
          {/* User menu */}
          <button className="p-1 rounded-full bg-indigo-100 text-indigo-700">
            <User size={20} />
          </button>
        </div>
      </div>
      
      {/* Page title */}
      {title && (
        <h1 className="text-2xl font-semibold text-gray-800 mt-4">{title}</h1>
      )}
    </header>
  );
};

export default Header;
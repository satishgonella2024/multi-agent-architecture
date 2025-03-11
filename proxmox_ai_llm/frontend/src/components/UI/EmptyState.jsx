// proxmox_ai_llm/frontend/src/components/UI/EmptyState.jsx
import React from 'react';
import { FolderPlus } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  title = 'No data found',
  description = 'There is no data to display at the moment.',
  icon = <FolderPlus className="h-12 w-12 text-gray-400" />,
  actionText = 'Create New',
  onAction = null,
  showAction = true
}) => {
  return (
    <div className="text-center p-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="mx-auto">
          {icon}
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        
        {showAction && onAction && (
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={onAction}
            >
              {actionText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
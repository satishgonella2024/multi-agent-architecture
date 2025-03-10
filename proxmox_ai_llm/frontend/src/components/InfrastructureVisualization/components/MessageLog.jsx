// proxmox_ai_llm/frontend/src/components/InfrastructureVisualization/components/MessageLog.jsx
import React, { useRef, useEffect } from 'react';
import { Shield, Clock, Activity } from 'lucide-react';
import { getAgentIcon } from '../utils/agentUtils';

const MessageLog = ({ messages, selectedAgent, setSelectedAgent }) => {
  const messagesEndRef = useRef(null);
  
  // Filter messages by agent
  const filteredMessages = selectedAgent 
    ? messages.filter(m => m.from === selectedAgent || m.to === selectedAgent)
    : messages;
  
  // Scroll to bottom of messages container
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      const container = messagesEndRef.current.parentNode;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);
  
  return (
    <div className="border rounded-lg shadow-md">
      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-700 flex items-center">
          <Shield className="h-4 w-4 text-indigo-500 mr-1" />
          {selectedAgent ? `${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Communications` : 'Agent Communications'}
        </h3>
        {selectedAgent && (
          <button 
            onClick={() => setSelectedAgent(null)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          >
            <Activity className="h-3 w-3 mr-1" />
            Show All
          </button>
        )}
      </div>
      <div className="px-4 py-2 h-80 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
        {filteredMessages.map((message) => (
          <div 
            key={message.id} 
            className="mb-3 flex items-start p-2 hover:bg-gray-50 rounded-md transition-colors"
          >
            <span className="flex-shrink-0 mt-1 p-1.5 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
              {getAgentIcon(message.from)}
            </span>
            <div className="ml-2 flex-1">
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {message.from.charAt(0).toUpperCase() + message.from.slice(1)}
                </span>
                <span className="text-gray-500 mx-1">→</span>
                <span className="font-medium text-gray-900">
                  {message.to.charAt(0).toUpperCase() + message.to.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{message.content}</p>
              <span className="text-xs text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {message.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {filteredMessages.length === 0 && (
          <div className="text-center text-gray-500 py-16 flex flex-col items-center">
            <Activity className="h-10 w-10 text-gray-300 mb-2" />
            <p>No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Communications will appear here during simulation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageLog;
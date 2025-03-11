// proxmox_ai_llm/frontend/src/components/UI/ScoreGauge.jsx
import React from 'react';

const ScoreGauge = ({ title, score, icon, color = 'blue' }) => {
  // Calculate color based on score and color theme
  const getColor = () => {
    if (color === 'blue') {
      return score >= 80 ? '#3B82F6' : score >= 60 ? '#60A5FA' : score >= 40 ? '#93C5FD' : '#BFDBFE';
    } else if (color === 'green') {
      return score >= 80 ? '#10B981' : score >= 60 ? '#34D399' : score >= 40 ? '#6EE7B7' : '#A7F3D0';
    } else if (color === 'yellow') {
      return score >= 80 ? '#F59E0B' : score >= 60 ? '#FBBF24' : score >= 40 ? '#FCD34D' : '#FDE68A';
    } else if (color === 'red') {
      return score >= 80 ? '#EF4444' : score >= 60 ? '#F87171' : score >= 40 ? '#FCA5A5' : '#FECACA';
    } else if (color === 'orange') {
      return score >= 80 ? '#F97316' : score >= 60 ? '#FB923C' : score >= 40 ? '#FDBA74' : '#FED7AA';
    }
    return '#9CA3AF'; // Default gray
  };
  
  // Calculate stroke dasharray for the circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Background circle */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* Foreground circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}</span>
        </div>
      </div>
      
      {/* Title */}
      <div className="mt-2 flex items-center">
        {icon && <span className="mr-1">{icon}</span>}
        <span className="font-medium text-gray-800">{title}</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
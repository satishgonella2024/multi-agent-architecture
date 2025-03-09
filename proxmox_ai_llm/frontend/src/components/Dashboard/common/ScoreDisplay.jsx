// src/components/Dashboard/common/ScoreDisplay.jsx
import React from 'react';

const ScoreDisplay = ({ score, title, description }) => (
  <div className="flex items-center mb-6">
    <div className="relative w-16 h-16 mr-4">
      <div className="absolute inset-0 rounded-full bg-gray-200"></div>
      <svg className="absolute inset-0" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke={score >= 90 ? '#10B981' : score >= 70 ? '#FBBF24' : '#EF4444'} 
          strokeWidth="10" 
          strokeDasharray={`${score * 2.83} 283`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-xl font-bold">{score}</div>
      </div>
    </div>
    <div>
      <p className="text-gray-600 font-semibold text-lg">
        {title}: <span className="font-bold">{score}/100</span>
      </p>
      <p className="text-gray-500 text-sm">
        {description}
      </p>
    </div>
  </div>
);

export default ScoreDisplay;
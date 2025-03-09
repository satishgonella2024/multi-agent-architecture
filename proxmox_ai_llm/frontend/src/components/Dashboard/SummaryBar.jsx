// src/components/Dashboard/SummaryBar.jsx
import React from 'react';
import { Server, AlertTriangle, Check, DollarSign } from 'lucide-react';

const SummaryBar = ({ 
  status, 
  resourceCount, 
  criticalIssues, 
  warningIssues, 
  validationScore, 
  monthlyCost 
}) => (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-gray-800 mb-1">
      {status === 'completed' ? 'Analysis Complete' : 'Analysis in Progress'}
    </h2>
    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
      <div className="flex items-center">
        <Server className="w-4 h-4 mr-1"/> {resourceCount} Resources
      </div>
      <div className="flex items-center">
        <AlertTriangle className="w-4 h-4 mr-1 text-red-500"/> {criticalIssues} Critical Issues
      </div>
      <div className="flex items-center">
        <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500"/> {warningIssues} Warnings
      </div>
      <div className="flex items-center">
        <Check className="w-4 h-4 mr-1 text-green-500"/> {validationScore}/100 Validation Score
      </div>
      <div className="flex items-center">
        <DollarSign className="w-4 h-4 mr-1"/> ${monthlyCost?.toFixed(2) || "0.00"}/month
      </div>
    </div>
  </div>
);

export default SummaryBar;
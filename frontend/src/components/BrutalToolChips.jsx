import React from 'react';
import { X, BarChart } from 'lucide-react';

const getToolIcon = (tool) => {
  if (tool === 'report_dashboard') return <BarChart size={12} strokeWidth={3} />;
  return null;
};

export const BrutalToolChips = ({ enabledTools, setEnabledTools }) => {
  if (!enabledTools || enabledTools.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-2 pt-1 pb-2">
      {enabledTools.map(tool => (
        <div key={tool} className="flex items-center gap-1.5 px-2 py-1 bg-surface border-[2px] border-black text-black font-black uppercase text-[10px] tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          {getToolIcon(tool)}
          <span>{tool.replace('_', ' ')}</span>
          <button 
            onClick={() => setEnabledTools(prev => prev.filter(t => t !== tool))}
            className="ml-1 hover:text-red-600 transition-colors"
          >
            <X size={12} strokeWidth={4} />
          </button>
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import { Plus } from 'lucide-react';
import { 
  BrutalDropdown, 
  BrutalDropdownTrigger, 
  BrutalDropdownContent, 
  BrutalDropdownItem
} from './BrutalDropdown';

export const BrutalToolMenu = ({ enabledTools, setEnabledTools, availableTools = [] }) => {
  const unselectedTools = availableTools.filter(t => !enabledTools.includes(t.id));

  return (
    <div className="relative flex items-center border-r-[2px] border-black/10 pr-4 py-1">
      <BrutalDropdown side="top" align="start">
        <BrutalDropdownTrigger>
          <div 
            title="Add Tools"
            className="p-1 border-[2px] border-black/30 text-black/60 hover:border-black hover:text-black hover:bg-black/5 transition-all flex items-center justify-center cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
          </div>
        </BrutalDropdownTrigger>
        
        <BrutalDropdownContent className="w-48 p-1">
          <div className="px-2 py-1 border-b-[2px] border-black/10 text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">
            Available Tools
          </div>
          {unselectedTools.length > 0 ? (
            unselectedTools.map(tool => (
              <BrutalDropdownItem
                key={tool.id}
                icon={tool.icon}
                onClick={() => setEnabledTools(prev => [...prev, tool.id])}
              >
                {tool.label}
              </BrutalDropdownItem>
            ))
          ) : (
            <div className="px-2 py-3 text-xs font-bold text-black/40 italic">
              No more tools available.
            </div>
          )}
        </BrutalDropdownContent>
      </BrutalDropdown>
    </div>
  );
};

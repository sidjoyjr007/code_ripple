import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { BrutalButton } from './BrutalButton';

export function PageHeader({ title, description, icon: Icon, actions, onBack, bgColor = "bg-secondary" }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 mr-2">
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-3 mb-2 mr-2">
          {onBack && (
            <BrutalButton 
              variant="outline" 
              onClick={onBack} 
              className="p-1.5 shadow-brutal-sm border-[3px] h-auto rounded-md"
            >
              <ArrowLeft size={20} strokeWidth={3} />
            </BrutalButton>
          )}
          <div className={`inline-flex items-center gap-3 border-[3px] border-border shadow-brutal-sm px-3 py-1.5 ${bgColor} rounded-md`}>
            {Icon ? (
              <Icon size={24} strokeWidth={2.5} className="md:w-6 md:h-6 text-secondary-foreground" />
            ) : (
              <img src="/favicon.svg" alt="Orkestra Logo" className="w-6 h-6 md:w-8 md:h-8" />
            )}
            <h1 className="text-xl md:text-2xl font-black text-secondary-foreground tracking-tighter uppercase">
              {title}
            </h1>
          </div>
        </div>
        
        {description && (
          <p className="border-l-4 border-accent pl-3 text-sm md:text-base font-bold text-foreground/70 tracking-widest uppercase">
            {description}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-4">
          {actions}
        </div>
      )}
    </div>
  );
}

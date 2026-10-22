import React from 'react';
import { BrutalCard } from './BrutalCard';

export function BrutalEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = "" 
}) {
  return (
    <BrutalCard className={`p-12 text-center flex flex-col items-center justify-center bg-surface border-dashed ${className}`}>
      {Icon && (
        <div className="bg-warning p-4 border-[3px] border-border shadow-brutal-sm mb-6 transform -rotate-3 rounded-md">
          <Icon size={48} strokeWidth={3} className="text-foreground" />
        </div>
      )}
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{title}</h3>
      {description && (
        <p className="text-foreground/70 font-medium mb-6">{description}</p>
      )}
      {action}
    </BrutalCard>
  );
}

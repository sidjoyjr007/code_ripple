import React from 'react';
import { cn } from "../lib/utils";
import { BrutalRadio } from './BrutalUI';

export function BrutalChoiceGroup({ value, onChange, options, className, orientation = "vertical" }) {
  const isVertical = orientation === "vertical";
  
  return (
    <div className={cn("flex gap-3", isVertical ? "flex-col" : "flex-col sm:flex-row", className)}>
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const activeClass = opt.activeClassName || 'bg-primary text-primary-foreground border-border shadow-brutal-sm translate-x-[1px] translate-y-[1px] rounded-md';
        
        return (
          <div 
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 p-3 border-[3px] cursor-pointer transition-all flex items-start gap-3",
              isSelected ? activeClass : 'bg-surface hover:bg-muted border-border text-foreground'
            )}
          >
            <div className="mt-0.5 shrink-0 pointer-events-none">
              <BrutalRadio 
                checked={isSelected} 
                onChange={() => {}} 
              />
            </div>
            <div>
              <div className="font-black uppercase text-xs tracking-wider flex items-center gap-2">
                {opt.icon && opt.icon}
                {opt.label}
              </div>
              {opt.description && (
                <p className={cn(
                  "text-[10px] font-bold mt-0.5 leading-tight",
                  isSelected ? "opacity-90" : "opacity-80"
                )}>
                  {opt.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

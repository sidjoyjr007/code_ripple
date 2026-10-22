import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";

export const BrutalAccordion = React.forwardRef(({ items, className, ...props }, ref) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div 
      ref={ref}
      className={cn("w-full flex flex-col border-[3px] border-border shadow-brutal bg-surface rounded-md", className)}
      {...props}
    >
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="border-b-[3px] border-border last:border-b-0">
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-4 font-black uppercase tracking-wide hover:bg-secondary transition-colors text-left focus-visible:outline-none focus-visible:bg-secondary"
            >
              <span>{item.title}</span>
              {isOpen ? <Minus strokeWidth={4} /> : <Plus strokeWidth={4} />}
            </button>
            {isOpen && (
              <div className="p-4 border-t-[3px] border-border bg-background font-bold opacity-80 leading-relaxed animate-in slide-in-from-top-2">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
BrutalAccordion.displayName = "BrutalAccordion";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";

export const BrutalTabs = React.forwardRef(({ tabs, defaultValue, className, contentClassName, ...props }, ref) => {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0].value);

  const activeContent = tabs.find(t => t.value === activeTab)?.content;

  return (
    <div ref={ref} className={cn("w-full flex flex-col", className)} {...props}>
      <div className="flex-none flex w-full mb-0 border-b-[3px] border-border overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-6 py-4 font-black uppercase tracking-widest text-sm transition-all border-[3px] border-border border-b-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-primary/20",
                isActive 
                  ? "bg-primary text-foreground translate-y-[3px] -mb-[3px] z-10" 
                  : "bg-surface text-foreground hover:bg-primary/20 opacity-70 hover:opacity-100"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className={cn("p-6 border-[3px] border-border border-t-0 bg-surface shadow-brutal relative z-0 flex-1 flex flex-col min-h-0 rounded-md", contentClassName)}>
        {activeContent}
      </div>
    </div>
  );
});
BrutalTabs.displayName = "BrutalTabs";

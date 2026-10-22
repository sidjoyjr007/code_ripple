import React from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const BrutalInput = React.forwardRef(({ className = '', icon, ...props }, ref) => {
  if (icon) {
    return (
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 flex items-center pointer-events-none">
          {icon}
        </div>
        <Input 
          ref={ref}
          className={cn(
            "rounded-md border-[3px] border-border shadow-brutal-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-surface text-card-foreground font-medium px-4 h-12 pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <Input 
      ref={ref}
      className={cn(
        "rounded-md border-[3px] border-border shadow-brutal-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-surface text-card-foreground font-medium px-4 h-12",
        className
      )}
      {...props}
    />
  );
});
BrutalInput.displayName = "BrutalInput";

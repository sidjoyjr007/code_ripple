import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const BrutalTextarea = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <Textarea 
      ref={ref}
      className={cn(
        "rounded-md border-[3px] border-border shadow-brutal-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-surface text-card-foreground font-medium px-4 py-4 resize-none",
        className
      )}
      {...props}
    />
  );
});
BrutalTextarea.displayName = "BrutalTextarea";

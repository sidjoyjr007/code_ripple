import React from 'react';
import { cn } from "@/lib/utils";

/**
 * BrutalCard
 * A reusable component enforcing the neo-brutalist card styling.
 * Supports different semantic color variants.
 */
export const BrutalCard = React.forwardRef(({ 
  children, 
  className = '', 
  variant = 'surface', 
  isInteractive = false,
  noPadding = false,
  ...props
}, ref) => {
  const baseClasses = 'border-[3px] border-border rounded-md shadow-brutal';
  const paddingClass = noPadding ? '' : 'p-6';
  
  const variants = {
    surface: 'bg-card text-card-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    base: 'bg-background text-foreground'
  };

  const interactiveClasses = isInteractive 
    ? 'cursor-pointer active-brutal hover:bg-opacity-90' 
    : '';

  return (
    <div 
      ref={ref}
      className={cn(baseClasses, paddingClass, variants[variant], interactiveClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
});
BrutalCard.displayName = "BrutalCard";

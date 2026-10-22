import React from 'react';
import { cn } from "@/lib/utils";
import { BrutalSpinner } from "./BrutalSpinner";

const buttonVariants = {
  primary:     'border-border bg-primary text-primary-foreground hover:bg-primary/90',
  secondary:   'border-border bg-secondary text-secondary-foreground hover:bg-secondary/90',
  accent:      'border-border bg-accent text-accent-foreground hover:bg-accent/90',
  warning:     'border-border bg-warning text-foreground hover:bg-warning/90',
  destructive: 'border-border bg-destructive text-white hover:bg-black hover:text-white',
  surface:     'border-border bg-card text-card-foreground hover:bg-muted',
  outline:     'border-border bg-transparent text-foreground hover:bg-card',
  ghost:       'border-transparent bg-transparent text-foreground hover:border-border hover:bg-muted shadow-none',
};

const buttonSizes = {
  sm:      'h-8 px-2.5 text-xs gap-1.5 border-[2px] shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-md',
  md:      'h-10 px-4 text-xs tracking-wider gap-2 border-[3px] shadow-brutal active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-md',
  lg:      'h-13 px-6 text-sm tracking-widest gap-2.5 border-[3px] shadow-brutal active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded-md',
  icon:    'w-8 h-8 p-0 border-[2px] shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 rounded-md',
  'icon-md': 'w-10 h-10 p-0 border-[3px] shadow-brutal active:translate-x-[3px] active:translate-y-[3px] active:shadow-none shrink-0 rounded-md',
};

export const BrutalButton = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  loading = false,
  ...props
}, ref) => {
  const isBusy = isLoading || loading;
  const isOff = disabled || isBusy;

  return (
    <button
      ref={ref}
      disabled={isOff}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-black uppercase transition-all duration-75 select-none cursor-pointer',
        buttonVariants[variant] || buttonVariants.primary,
        buttonSizes[size] || buttonSizes.md,
        isOff ? 'opacity-50 active:translate-x-0 active:translate-y-0 cursor-not-allowed pointer-events-none' : '',
        className
      )}
      {...props}
    >
      {isBusy ? (
        <BrutalSpinner size="sm" variant={variant === 'destructive' ? 'destructive' : 'surface'} text="" />
      ) : children}
    </button>
  );
});

BrutalButton.displayName = 'BrutalButton';

export default BrutalButton;

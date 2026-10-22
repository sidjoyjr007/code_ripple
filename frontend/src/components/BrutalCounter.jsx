import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";

export const BrutalCounter = React.forwardRef(({ value, onChange, min = 1, max = 100, label, className, ...props }, ref) => {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div ref={ref} className={cn("flex border-[3px] border-border shadow-brutal-sm bg-surface rounded-md", className)} {...props}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-12 h-12 flex items-center justify-center border-r-[3px] border-border hover:bg-accent transition-colors active-brutal-sm disabled:opacity-50 disabled:hover:bg-surface focus-visible:outline-none focus-visible:bg-accent"
      >
        <Minus strokeWidth={3} />
      </button>
      
      <div className="flex-1 flex flex-col items-center justify-center font-black text-xl">
        {value}
        {label && <span className="text-[10px] uppercase font-bold tracking-widest -mt-1 opacity-60">{label}</span>}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-12 h-12 flex items-center justify-center border-l-[3px] border-border hover:bg-secondary transition-colors active-brutal-sm disabled:opacity-50 disabled:hover:bg-surface focus-visible:outline-none focus-visible:bg-secondary"
      >
        <Plus strokeWidth={3} />
      </button>
    </div>
  );
});
BrutalCounter.displayName = "BrutalCounter";

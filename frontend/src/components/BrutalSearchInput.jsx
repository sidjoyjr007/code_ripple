import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export const BrutalSearchInput = React.forwardRef(({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  size = 'md',
  className,
  containerClassName,
  disabled = false,
  autoFocus = false,
  ...props
}, ref) => {
  const sizeStyles = {
    sm: {
      input: "pl-8 pr-7 py-1 text-xs h-8",
      icon: "w-3.5 h-3.5 left-2.5",
      clear: "right-2",
      clearIcon: 12,
    },
    md: {
      input: "pl-9 pr-8 py-1.5 text-xs h-9",
      icon: "w-4 h-4 left-3",
      clear: "right-2.5",
      clearIcon: 14,
    },
    lg: {
      input: "pl-11 pr-10 py-2 text-sm h-11",
      icon: "w-5 h-5 left-3.5",
      clear: "right-3",
      clearIcon: 16,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      // Synthetic event if onChange expects an event
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={cn("relative flex items-center w-full", containerClassName)}>
      {/* Search Icon */}
      <Search 
        className={cn("absolute top-1/2 -translate-y-1/2 text-foreground/70 pointer-events-none", currentSize.icon)} 
        strokeWidth={3} 
      />

      {/* Brutalist Input Box */}
      <input
        ref={ref}
        type="text"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "w-full font-bold border-[2px] border-black bg-surface focus:outline-none focus:bg-warning/20 shadow-[2px_2px_0px_0px_#000] rounded-md transition-colors",
          disabled && "opacity-50 cursor-not-allowed bg-muted",
          currentSize.input,
          className
        )}
        {...props}
      />

      {/* Clear Button */}
      {Boolean(value) && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 p-0.5 hover:bg-black/10 active:bg-black active:text-white transition-colors cursor-pointer",
            currentSize.clear
          )}
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={currentSize.clearIcon} strokeWidth={3} />
        </button>
      )}
    </div>
  );
});

BrutalSearchInput.displayName = "BrutalSearchInput";

export default BrutalSearchInput;

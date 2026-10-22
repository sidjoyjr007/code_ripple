import React, { useState, useMemo, useRef, useEffect, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import { cn } from "../lib/utils";

export const BrutalMultiSelect = React.forwardRef(({ 
  options, 
  selectedIds, 
  onChange, 
  placeholder = "Select options...", 
  label,
  className,
  size = "md",
  disabled = false,
  ...props
}, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpwards: false });
  
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  
  useImperativeHandle(ref, () => containerRef.current);

  const updateCoordinates = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 240;
    const openUpwards = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    setCoords({
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      left: Math.max(8, rect.left),
      width: Math.max(rect.width, 200),
      openUpwards,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoordinates();
      const onScrollOrResize = () => updateCoordinates();
      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('resize', onScrollOrResize);
      return () => {
        window.removeEventListener('scroll', onScrollOrResize, true);
        window.removeEventListener('resize', onScrollOrResize);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [options, searchQuery]);

  const activeOptions = options.filter(opt => selectedIds.includes(opt.id));

  const toggleOption = (id, e) => {
    if (e) e.stopPropagation();
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e) e.stopPropagation();
    onChange(options.map(opt => opt.id));
  };

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs min-h-[32px] border-[2px]",
    md: "px-3 py-2 text-sm min-h-[42px] border-[3px]",
    lg: "px-4 py-3 text-base min-h-[50px] border-[3px]",
  };

  return (
    <div className={cn("relative inline-flex flex-col gap-1 w-full", className)} ref={containerRef} {...props}>
      {label && (
        <label className="font-black uppercase tracking-wider text-xs text-foreground select-none">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2 bg-card text-foreground font-black uppercase tracking-wider text-left transition-all select-none border-border cursor-pointer shadow-brutal-sm rounded-md",
          sizeStyles[size] || sizeStyles.md,
          isOpen ? 'bg-muted translate-x-[1px] translate-y-[1px]' : 'hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        )}
      >
        <span className="truncate flex items-center gap-2">
          {activeOptions.length > 0 ? (
            <span>{activeOptions.length} SELECTED</span>
          ) : (
            <span className="text-muted-foreground font-normal normal-case">{placeholder}</span>
          )}
        </span>
        
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          strokeWidth={3}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
        
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.openUpwards ? undefined : `${coords.top}px`,
            bottom: coords.openUpwards ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999,
          }}
          className="bg-card text-foreground border-[3px] border-border shadow-brutal p-1 max-h-60 overflow-y-auto flex flex-col gap-1 animate-in fade-in-0 zoom-in-95 duration-100 rounded-md"
        >
          <div className="px-1 pb-1 sticky top-0 bg-card z-10 pt-1 border-b-[2px] border-border mb-1 flex flex-col gap-1">
            <input 
              type="text"
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-surface border-[2px] border-border outline-none shadow-brutal-sm font-bold text-xs p-1.5 placeholder:text-muted-foreground placeholder:font-normal placeholder:normal-case uppercase rounded-md"
            />
            <div className="flex items-center gap-1 mt-1">
              <button 
                type="button" 
                onClick={handleSelectAll} 
                className="flex-1 bg-surface border-[2px] border-border text-[9px] font-black uppercase py-1 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Select All
              </button>
              <button 
                type="button" 
                onClick={handleClear} 
                className="flex-1 bg-surface border-[2px] border-border text-[9px] font-black uppercase py-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          {filteredOptions.length === 0 && (
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground text-center uppercase">
              No results found
            </div>
          )}
          {filteredOptions.map(opt => {
            const isSelected = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={(e) => toggleOption(opt.id, e)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 border-[2px] font-black uppercase text-xs tracking-wider text-left transition-all cursor-pointer border-transparent text-foreground hover:bg-muted hover:border-border hover:shadow-brutal-sm rounded-md"
              >
                <div className="flex flex-col truncate">
                  <span className="truncate flex items-center gap-1">
                    {opt.prefix && opt.prefix}
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="text-[10px] font-normal normal-case opacity-75 truncate">
                      {opt.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Check size={14} strokeWidth={3} className="text-foreground shrink-0" />
                  </div>
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
});

BrutalMultiSelect.displayName = "BrutalMultiSelect";

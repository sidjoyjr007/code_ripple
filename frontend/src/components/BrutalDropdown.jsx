import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

const BrutalDropdownContext = createContext(null);

export function useBrutalDropdown() {
  const context = useContext(BrutalDropdownContext);
  if (!context) {
    throw new Error('BrutalDropdown components must be used within a BrutalDropdown');
  }
  return context;
}

/**
 * Generic, Reusable Neo-Brutalist Dropdown / Popover Component.
 * Supports both composable children (Trigger, Content, Item, Separator)
 * and data-driven props (sections, header, footer).
 */
export function BrutalDropdown({
  children,
  trigger,
  header,
  sections,
  side = 'top',
  align = 'start',
  className,
  contentClassName,
  isOpen: controlledIsOpen,
  onOpenChange,
}) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const setIsOpen = (next) => {
    if (!isControlled) {
      setUncontrolledIsOpen(next);
    }
    onOpenChange?.(next);
  };

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Position styles based on side and align
  const getPositionClasses = () => {
    const classes = [];
    if (side === 'top') {
      classes.push('bottom-full mb-2');
    } else if (side === 'bottom') {
      classes.push('top-full mt-2');
    } else if (side === 'left') {
      classes.push('right-full mr-2 top-0');
    } else if (side === 'right') {
      classes.push('left-full ml-2 top-0');
    }

    if (side === 'top' || side === 'bottom') {
      if (align === 'start') classes.push('left-0');
      else if (align === 'end') classes.push('right-0');
      else if (align === 'center') classes.push('left-1/2 -translate-x-1/2');
    }

    return classes.join(' ');
  };

  const contextValue = {
    isOpen,
    setIsOpen,
    toggle: () => setIsOpen(!isOpen),
    side,
    align,
  };

  return (
    <BrutalDropdownContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
        {/* Trigger (prop or first child) */}
        {trigger ? (
          <div onClick={() => setIsOpen(!isOpen)} className="w-full cursor-pointer">
            {trigger}
          </div>
        ) : null}

        {/* Data-driven content rendering */}
        {sections && isOpen && (
          <div
            ref={contentRef}
            role="menu"
            className={cn(
              "absolute z-50 w-full min-w-[220px]",
              getPositionClasses(),
              "bg-card text-foreground",
              "border-[3px] border-border",
              "shadow-brutal rounded-md",
              "p-1.5 flex flex-col gap-1",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              contentClassName
            )}
          >
            {header && (
              <>
                <div className="p-2 bg-muted/50 border-[2px] border-border">
                  {header}
                </div>
                <div className="border-b-[2px] border-border my-0.5" />
              </>
            )}

            {sections.map((section, sIdx) => {
              if (section.hidden) return null;
              return (
                <React.Fragment key={sIdx}>
                  {sIdx > 0 && <div className="border-b-[2px] border-border my-0.5" />}
                  {section.title && (
                    <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {section.title}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item, iIdx) => {
                      if (item.hidden) return null;
                      return (
                        <BrutalDropdownItem
                          key={iIdx}
                          icon={item.icon}
                          badge={item.badge}
                          variant={item.variant}
                          disabled={item.disabled}
                          onClick={() => {
                            setIsOpen(false);
                            item.onClick?.();
                          }}
                        >
                          {item.label}
                        </BrutalDropdownItem>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Composable children */}
        {children}
      </div>
    </BrutalDropdownContext.Provider>
  );
}

/**
 * Composable Trigger subcomponent
 */
export function BrutalDropdownTrigger({ children, className, asChild }) {
  const { toggle, isOpen } = useBrutalDropdown();

  return (
    <div
      onClick={toggle}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      className={cn("w-full cursor-pointer select-none", className)}
    >
      {children}
    </div>
  );
}

/**
 * Composable Content subcomponent
 */
export function BrutalDropdownContent({ children, className }) {
  const { isOpen, side, align } = useBrutalDropdown();

  if (!isOpen) return null;

  const positionClasses = side === 'top' 
    ? 'bottom-full mb-2 left-0' 
    : side === 'bottom' 
    ? 'top-full mt-2 left-0' 
    : side === 'left' 
    ? 'right-full mr-2 top-0' 
    : 'left-full ml-2 top-0';

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 w-full min-w-[220px]",
        positionClasses,
        "bg-card text-foreground",
        "border-[3px] border-border",
        "shadow-brutal rounded-md",
        "p-1.5 flex flex-col gap-1",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Reusable Dropdown Item with brutalist variants (default, primary, warning, destructive)
 */
export function BrutalDropdownItem({
  children,
  icon,
  badge,
  variant = 'default',
  onClick,
  disabled = false,
  className,
}) {
  const variantStyles = {
    default: 'hover:bg-muted hover:border-border hover:shadow-brutal-sm text-foreground rounded-md',
    primary: 'hover:bg-primary hover:text-primary-foreground hover:border-border hover:shadow-brutal-sm rounded-md',
    warning: 'bg-warning/20 border-warning hover:bg-warning hover:text-black hover:border-border hover:shadow-brutal-sm rounded-md',
    destructive: 'hover:bg-destructive hover:text-white hover:border-border hover:shadow-brutal-sm rounded-md',
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-2.5 px-3 py-2 border-[2px] border-transparent font-black uppercase text-xs tracking-wider text-left transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant] || variantStyles.default,
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </div>

      {badge && (
        <span className="shrink-0 font-mono text-[10px] font-black bg-black text-white px-1.5 py-0.5 border border-black">
          {badge}
        </span>
      )}
    </button>
  );
}

/**
 * Reusable Dropdown Separator
 */
export function BrutalDropdownSeparator({ className }) {
  return <div className={cn("border-b-[2px] border-border my-0.5", className)} />;
}

/**
 * Reusable Dropdown Header
 */
export function BrutalDropdownHeader({ children, className }) {
  return (
    <div className={cn("p-2 bg-muted/60 border-[2px] border-border text-foreground", className)}>
      {children}
    </div>
  );
}

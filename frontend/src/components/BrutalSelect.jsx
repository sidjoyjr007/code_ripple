import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Reusable Neo-Brutalist Select Component.
 * Supports string arrays or object arrays: { value, label, description, badge, disabled }.
 * Uses React Portal to prevent dropdown clipping inside tables or scrollable containers.
 *
 * @param {Object} props
 * @param {string|number} props.value - Currently selected value
 * @param {Function} props.onChange - Callback fired on change: (value) => void
 * @param {Array<string|{value: string, label: string, badge?: string, disabled?: boolean}>} props.options - Selectable options
 * @param {string} [props.placeholder="Select option..."] - Placeholder text
 * @param {string} [props.label] - Optional field label
 * @param {string} [props.error] - Optional error message
 * @param {"sm"|"md"|"lg"} [props.size="md"] - Size variant
 * @param {boolean} [props.disabled=false] - Whether select is disabled
 * @param {string} [props.className] - Container CSS class
 * @param {string} [props.triggerClassName] - Trigger button CSS class
 * @param {string} [props.id] - Element ID
 */
export function BrutalSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select option...",
  label,
  error,
  size = "md",
  disabled = false,
  className = "",
  triggerClassName = "",
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpwards: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize and deduplicate options array
  const seenValues = new Set();
  const normalizedOptions = [];

  (options || []).forEach((opt) => {
    if (!opt && opt !== 0) return;
    let norm;
    if (typeof opt === 'string' || typeof opt === 'number') {
      norm = { value: String(opt), label: String(opt) };
    } else {
      norm = {
        value: String(opt.value),
        label: opt.label !== undefined ? String(opt.label) : String(opt.value),
        badge: opt.badge,
        description: opt.description,
        disabled: Boolean(opt.disabled),
      };
    }
    const key = norm.value.trim().toUpperCase();
    if (!seenValues.has(key)) {
      seenValues.add(key);
      normalizedOptions.push(norm);
    }
  });

  const selectedOption = normalizedOptions.find(
    (o) => o.value.toUpperCase() === String(value || '').toUpperCase()
  );

  const updateCoordinates = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = Math.min(240, (normalizedOptions.length || 1) * 40 + 20);
    const openUpwards = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    const width = Math.max(rect.width, 140);
    const left = Math.min(rect.left, window.innerWidth - width - 10);

    setCoords({
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      left: Math.max(8, left),
      width,
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
  }, [isOpen, normalizedOptions.length]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const enabledOptions = normalizedOptions.filter((o) => !o.disabled);
        const currentIndex = enabledOptions.findIndex((o) => o.value === String(value));
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < enabledOptions.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledOptions.length - 1;
        }
        if (enabledOptions[nextIndex]) {
          onChange?.(enabledOptions[nextIndex].value);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, normalizedOptions, value, onChange]);

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs min-h-[36px] h-9 border-[2px]",
    md: "px-3 py-2 text-sm min-h-[48px] h-12 border-[3px]",
    lg: "px-4 py-3 text-base min-h-[56px] h-14 border-[3px]",
  };

  const handleSelect = (optValue, optDisabled, e) => {
    e.stopPropagation();
    if (optDisabled) return;
    onChange?.(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="font-black uppercase tracking-wider text-xs text-foreground select-none">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          w-full flex items-center justify-between gap-2 bg-surface text-foreground font-black uppercase tracking-wider text-left transition-all select-none border-border cursor-pointer shadow-brutal-sm
          ${sizeStyles[size] || sizeStyles.md}
          ${isOpen ? 'bg-muted translate-x-[1px] translate-y-[1px]' : 'hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          ${error ? 'border-destructive' : ''}
          ${triggerClassName}
        `}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              <span>{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-[10px] px-1.5 py-0.2 bg-primary text-primary-foreground border-[1.5px] border-border font-black">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground font-normal normal-case">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          strokeWidth={3}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Floating Menu Listbox rendered into Portal to escape table/container clipping */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="listbox"
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
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground text-center uppercase">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(value || '').toUpperCase() === opt.value.toUpperCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={(e) => handleSelect(opt.value, opt.disabled, e)}
                  className={`
                    w-full flex items-center justify-between gap-2 px-2.5 py-1.5 border-[2px] font-black uppercase text-xs tracking-wider text-left transition-all cursor-pointer
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground border-border shadow-brutal-sm rounded-md' 
                      : 'border-transparent text-foreground hover:bg-muted hover:border-border hover:shadow-brutal-sm rounded-md'
                    }
                    ${opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
                  `}
                >
                  <div className="flex flex-col truncate">
                    <span className="truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="text-[10px] font-normal normal-case opacity-75 truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="text-[9px] px-1 py-0.2 bg-surface text-foreground border border-border">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check size={14} strokeWidth={3} className="text-primary-foreground shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}

      {error && (
        <span className="text-xs font-bold text-destructive tracking-wide">
          {error}
        </span>
      )}
    </div>
  );
}

export default BrutalSelect;

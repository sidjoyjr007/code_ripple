import React, { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';

// ---------------------------
// FEEDBACK & STATUS
// ---------------------------

export function BrutalBadge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-foreground text-background',
    primary: 'bg-primary text-foreground',
    secondary: 'bg-secondary text-foreground',
    accent: 'bg-accent text-foreground',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase tracking-wider border-[3px] border-border shadow-brutal-sm ${variants[variant]} ${className} rounded-md`}>
      {children}
    </span>
  );
}

export function BrutalAlert({ title, children, icon: Icon = AlertCircle, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface border-l-[8px] border-l-foreground',
    destructive: 'bg-destructive/10 border-l-[8px] border-l-destructive text-destructive-foreground',
    success: 'bg-secondary/20 border-l-[8px] border-l-secondary',
  };
  return (
    <div className={`p-4 border-[3px] border-border shadow-brutal flex gap-4 ${variants[variant]} ${className} rounded-md`}>
      <Icon className="w-6 h-6 shrink-0 mt-1" strokeWidth={3} />
      <div>
        {title && <h5 className="font-black uppercase tracking-wide text-lg mb-1">{title}</h5>}
        <div className="font-bold opacity-80">{children}</div>
      </div>
    </div>
  );
}

export function BrutalProgress({ value = 0, max = 100, className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full h-8 border-[3px] border-border bg-surface shadow-brutal-sm relative overflow-hidden ${className} rounded-md`}>
      <div 
        className="h-full bg-warning border-r-[3px] border-border transition-all duration-500 ease-out flex items-center justify-end px-2"
        style={{ width: `${percentage}%` }}
      >
        {percentage > 10 && <span className="text-xs font-black">{Math.round(percentage)}%</span>}
      </div>
    </div>
  );
}

export function BrutalSkeleton({ className = '' }) {
  return (
    <div className={`border-[3px] border-border bg-foreground/10 animate-pulse ${className}`} />
  );
}

// ---------------------------
// DATA DISPLAY
// ---------------------------

export function BrutalAvatar({ src, fallback, className = '' }) {
  return (
    <div className={`w-12 h-12 border-[3px] border-border bg-accent shadow-brutal-sm flex items-center justify-center overflow-hidden shrink-0 ${className} rounded-md`}>
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover grayscale contrast-125" />
      ) : (
        <span className="font-black text-xl uppercase tracking-tighter">{fallback}</span>
      )}
    </div>
  );
}

export function BrutalTooltip({ content, children }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background border-[3px] border-border shadow-brutal text-sm font-bold whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 rounded-md">
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
}

// ---------------------------
// FORMS & INPUTS
// ---------------------------

export function BrutalCheckbox({ checked, onChange, label, id, defaultChecked = false }) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  const isChecked = checked !== undefined ? checked : internalChecked;
  
  const handleClick = (e) => {
    e.stopPropagation(); // prevent row click from triggering double toggle
    if (onChange) onChange(!isChecked);
    else setInternalChecked(!isChecked);
  };
  
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        onClick={handleClick}
        className={`w-6 h-6 border-[3px] border-border shadow-brutal-sm flex items-center justify-center transition-colors active-brutal-sm shrink-0 ${isChecked ? 'bg-primary' : 'bg-surface'} rounded-md`}
      >
        {isChecked && <Check strokeWidth={4} className="w-4 h-4 text-foreground" />}
      </button>
      {label && <label htmlFor={id} className="font-bold uppercase tracking-wide text-sm cursor-pointer" onClick={handleClick}>{label}</label>}
    </div>
  );
}

export function BrutalRadio({ checked, onChange, label, id }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        onClick={onChange}
        className={`w-6 h-6 rounded-full border-[3px] border-border shadow-brutal-sm flex items-center justify-center transition-colors active-brutal-sm ${checked ? 'bg-secondary' : 'bg-surface'}`}
      >
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
      </button>
      {label && <label htmlFor={id} className="font-bold uppercase tracking-wide text-sm cursor-pointer" onClick={onChange}>{label}</label>}
    </div>
  );
}

export function BrutalSwitch({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-14 h-8 border-[3px] border-border shadow-brutal-sm relative transition-colors ${checked ? 'bg-secondary' : 'bg-surface'} rounded-md`}
      >
        <div 
          className={`absolute top-0 bottom-0 w-6 bg-foreground transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`}
        />
      </button>
      {label && <span className="font-bold uppercase tracking-wide text-sm" onClick={() => onChange(!checked)}>{label}</span>}
    </div>
  );
}

export function BrutalSlider({ value, onChange, min = 0, max = 100 }) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="w-full relative h-12 flex items-center group">
      <div className="absolute left-0 right-0 h-4 border-[3px] border-border bg-surface shadow-brutal-sm overflow-hidden rounded-md">
        <div className="h-full bg-warning border-r-[3px] border-border" style={{ width: `${percentage}%` }} />
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute w-full h-full opacity-0 cursor-ew-resize z-20"
      />
      {/* Thumb visual */}
      <div 
        className="absolute w-6 h-8 bg-foreground border-[3px] border-background shadow-brutal-sm pointer-events-none z-10 transition-transform group-active:scale-90 rounded-md"
        style={{ left: `calc(${percentage}% - 12px)` }}
      />
    </div>
  );
}

export { BrutalSelect } from './BrutalSelect';


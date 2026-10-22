import React from 'react';
import { cn } from "@/lib/utils";

export function BrutalSpinner({ 
  size = "md", 
  variant = "primary", 
  type = "default", 
  className, 
  text = "" 
}) {
  // Dimension configurations
  const sizeMap = {
    sm: {
      container: "w-6 h-6",
      stroke: 4,
      center: "w-1.5 h-1.5",
      starSize: 22,
      bars: "h-4 w-1.5 gap-1",
    },
    md: {
      container: "w-10 h-10",
      stroke: 4.5,
      center: "w-2.5 h-2.5",
      starSize: 36,
      bars: "h-7 w-2 gap-1.5",
    },
    lg: {
      container: "w-16 h-16",
      stroke: 5,
      center: "w-4 h-4",
      starSize: 56,
      bars: "h-11 w-3 gap-2",
    },
    xl: {
      container: "w-20 h-20",
      stroke: 6,
      center: "w-5 h-5",
      starSize: 72,
      bars: "h-14 w-4 gap-2.5",
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Variant color mapping
  const colorMap = {
    primary: {
      border: "border-black",
      bg: "bg-primary",
      stroke: "#d8b4e2",
      text: "text-foreground",
    },
    secondary: {
      border: "border-black",
      bg: "bg-secondary",
      stroke: "#a7e6c4",
      text: "text-foreground",
    },
    warning: {
      border: "border-black",
      bg: "bg-warning",
      stroke: "#fef08a",
      text: "text-foreground",
    },
    accent: {
      border: "border-black",
      bg: "bg-accent",
      stroke: "#ffd1dc",
      text: "text-foreground",
    },
    destructive: {
      border: "border-black",
      bg: "bg-destructive",
      stroke: "#ff5555",
      text: "text-destructive",
    },
    surface: {
      border: "border-black",
      bg: "bg-surface",
      stroke: "#111111",
      text: "text-foreground",
    }
  };

  const currentColor = colorMap[variant] || colorMap.primary;

  // Render Loader based on type
  const renderGraphic = () => {
    if (type === "star") {
      return (
        <div className={cn("relative flex items-center justify-center animate-spin", currentSize.container)} style={{ animationDuration: '2.5s' }}>
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 4-point Neo-Brutalist Sparkle / Starburst */}
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill={currentColor.stroke}
              stroke="#111111"
              strokeWidth="2.5"
              strokeLinejoin="miter"
            />
          </svg>
        </div>
      );
    }

    if (type === "bars") {
      return (
        <div className={cn("flex items-center justify-center", currentSize.bars)}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-full border-[2px] border-black shadow-[2px_2px_0px_0px_#000] animate-bounce",
                currentColor.bg
              )}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      );
    }

    // Default: Neo-Brutalist High-Contrast Chunky Dial
    return (
      <div className={cn("relative flex items-center justify-center", currentSize.container)}>
        {/* Spinning Segmented Outer Wheel */}
        <svg
          className="w-full h-full animate-spin"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animationDuration: '0.9s' }}
        >
          {/* Base Track */}
          <circle
            cx="25"
            cy="25"
            r="19"
            stroke="#111111"
            strokeWidth={currentSize.stroke}
            strokeDasharray="4 6"
            className="opacity-25"
          />
          {/* Colored Primary Arc with Brutal Square Caps */}
          <circle
            cx="25"
            cy="25"
            r="19"
            stroke={currentColor.stroke}
            strokeWidth={currentSize.stroke}
            strokeLinecap="square"
            strokeDasharray="40 80"
          />
          {/* Bold Black Leading Edge */}
          <circle
            cx="25"
            cy="25"
            r="19"
            stroke="#111111"
            strokeWidth={currentSize.stroke}
            strokeLinecap="square"
            strokeDasharray="20 100"
          />
        </svg>

        {/* Center Geometric Brutalist Anchor */}
        <div 
          className={cn(
            "absolute border-[2px] border-black rotate-45 transition-transform",
            currentSize.center,
            currentColor.bg
          )}
        />
      </div>
    );
  };

  return (
    <div className={cn("inline-flex flex-col items-center justify-center gap-3", className)}>
      {renderGraphic()}
      
      {text && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border-[2px] border-black shadow-brutal-sm font-black uppercase tracking-widest text-[11px] leading-none rounded-md">
          <span>{text}</span>
          <span className="w-1.5 h-1.5 bg-black inline-block animate-ping rounded-md" />
        </span>
      )}
    </div>
  );
}

export default BrutalSpinner;

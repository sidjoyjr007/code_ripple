import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

export const BrutalDatePicker = React.forwardRef(({ 
  className = '', 
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8)); // Sept 2026 as default
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const selectDate = (day) => {
    const formatted = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!startDate || (startDate && endDate)) {
      onStartDateChange?.(formatted);
      onEndDateChange?.('');
    } else {
      if (formatted >= startDate) {
        onEndDateChange?.(formatted);
        setIsOpen(false);
      } else {
        onStartDateChange?.(formatted);
      }
    }
  };

  const isSelected = (day) => {
    const formatted = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return formatted === startDate || formatted === endDate;
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    const formatted = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return formatted > startDate && formatted < endDate;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef} {...props}>
      <div 
        className="flex items-center bg-surface border-[3px] border-border shadow-brutal-sm rounded-md h-11 overflow-hidden hover:bg-muted/30 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="pl-3 pr-2 border-r-[3px] border-border flex items-center justify-center bg-muted h-full pointer-events-none">
          <CalendarIcon size={18} strokeWidth={3} className="text-foreground" />
        </div>
        <div className="flex items-center px-3 font-bold text-xs uppercase tracking-wider w-full justify-between gap-2 select-none">
          <span>{startDate || "START DATE"}</span>
          <span className="font-black opacity-50">-</span>
          <span>{endDate || "END DATE"}</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-popover text-popover-foreground border-[3px] border-border shadow-brutal z-[999] w-72 animate-in fade-in zoom-in-95 duration-200 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-secondary border-[2px] border-transparent hover:border-border transition-all">
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            <span className="font-black uppercase tracking-widest text-sm">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-secondary border-[2px] border-transparent hover:border-border transition-all">
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2 text-center font-bold text-xs opacity-50">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-sm font-bold">
            {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const inRange = isInRange(day);
              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  className={cn(
                    "h-8 flex items-center justify-center border-[2px] border-transparent hover:border-border transition-all",
                    selected ? "bg-primary text-primary-foreground border-border shadow-brutal-sm scale-110 z-10 font-black rounded-md" : "",
                    inRange ? "bg-primary/20 rounded-md" : ""
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

BrutalDatePicker.displayName = "BrutalDatePicker";

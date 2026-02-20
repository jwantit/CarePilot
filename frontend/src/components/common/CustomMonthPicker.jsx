import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * CustomMonthPicker
 * - Custom UI for selecting Year and Month
 * - Consistent with project's dark theme
 */
const CustomMonthPicker = ({ value, onChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Extract year from value (format: YYYY-MM)
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (value) {
      const [y] = value.split("-");
      setDisplayYear(parseInt(y));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (mIdx) => {
    const monthStr = String(mIdx + 1).padStart(2, "0");
    onChange(`${displayYear}-${monthStr}`);
    setIsOpen(false);
  };

  const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between h-9 px-4 border border-cp-border rounded-sm bg-cp-input text-cp-text text-sm cursor-pointer hover:border-cp-border transition-all shadow-md min-w-[140px]"
      >
        <span className="font-semibold tracking-wide">
          {value ? `${value.split("-")[0]}년 ${value.split("-")[1]}월` : "연월 선택"}
        </span>
        <Calendar size={16} className="text-teal-500/70 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-[100] bg-cp-card border border-cp-border rounded-sm shadow-2xl p-4 w-64 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-cp-border pb-3">
            <button 
              type="button"
              onClick={() => setDisplayYear(displayYear - 1)}
              className="p-1.5 hover:bg-cp-bg rounded-sm text-cp-muted transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-bold text-cp-text tracking-tight">{displayYear}년</span>
            <button 
              type="button"
              onClick={() => setDisplayYear(displayYear + 1)}
              className="p-1.5 hover:bg-cp-bg rounded-sm text-cp-muted transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, idx) => {
              const isSelected = value === `${displayYear}-${String(idx + 1).padStart(2, "0")}`;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthSelect(idx)}
                  className={`py-2.5 text-sm rounded-sm font-medium transition-all ${
                    isSelected 
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-900/20" 
                      : "text-cp-muted hover:bg-cp-bg/50 hover:text-cp-text"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomMonthPicker;

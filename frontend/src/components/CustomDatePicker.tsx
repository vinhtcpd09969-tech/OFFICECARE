import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
}

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Chọn ngày',
  className = '',
  buttonClassName = '',
  align = 'right'
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value + 'T00:00:00');
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [navDate, setNavDate] = useState(currentDate);

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setNavDate(d);
      }
    }
  }, [value]);

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayIndex = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  const handlePrevMonth = () => {
    setNavDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    const selectedDate = new Date(year, month, dayNum);
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const formattedValue = useMemo(() => {
    if (!value) return placeholder;
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value, placeholder]);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [firstDayIndex, daysInMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen]);

  const minDateTime = useMemo(() => {
    if (!minDate) return null;
    return new Date(minDate + 'T00:00:00').getTime();
  }, [minDate]);

  const maxDateTime = useMemo(() => {
    if (!maxDate) return null;
    return new Date(maxDate + 'T23:59:59').getTime();
  }, [maxDate]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30 rounded-xl text-xs font-black transition-all hover:bg-emerald-100 dark:hover:bg-emerald-950/40 w-full shadow-xs cursor-pointer ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{formattedValue}</span>
        </div>
        <ChevronRight size={14} className={`transform transition-transform text-emerald-600/70 dark:text-emerald-400/70 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 w-72 z-[100] text-slate-800 dark:text-zinc-200 animate-in fade-in slide-in-from-top-1 duration-200`}>
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="size-7 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-900 flex items-center justify-center font-bold text-zinc-500 transition-colors cursor-pointer"
            >
              ‹
            </button>
            <span className="font-black text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="size-7 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-900 flex items-center justify-center font-bold text-zinc-500 transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-2">
            <span>CN</span>
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarCells.map((cell, idx) => {
              if (cell === null) {
                return <div key={`empty-${idx}`} />;
              }

              const cellDate = new Date(year, month, cell);
              const cellTime = cellDate.getTime();
              const isPast = minDateTime ? cellTime < minDateTime : false;
              const isFuture = maxDateTime ? cellTime > maxDateTime : false;
              const isDisabled = isPast || isFuture;

              const isSelected = 
                currentDate.getDate() === cell &&
                currentDate.getMonth() === month &&
                currentDate.getFullYear() === year;

              return (
                <button
                  key={`day-${cell}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDaySelect(cell)}
                  className={`aspect-square w-full rounded-lg font-bold flex items-center justify-center transition-all ${
                    isDisabled
                      ? 'text-zinc-350 dark:text-zinc-700 cursor-not-allowed opacity-40'
                      : isSelected
                        ? 'bg-[#0D9488] dark:bg-emerald-500 text-white shadow-sm font-black'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 cursor-pointer'
                  }`}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

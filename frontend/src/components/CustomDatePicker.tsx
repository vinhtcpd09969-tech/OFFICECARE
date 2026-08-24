import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  variant?: 'emerald' | 'subtle' | 'neutral' | 'teal';
  label?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Chọn ngày',
  className = '',
  buttonClassName = '',
  align = 'left',
  variant = 'neutral'
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
    const day = new Date(year, month, 1).getDay();
    // Monday as first day of week: 0 -> 6 (CN), 1 -> 0 (T2)...
    return day === 0 ? 6 : day - 1;
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

  const handleSelectToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleSelectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
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

  const todayStr = useMemo(() => new Date().toLocaleDateString('fr-CA'), []);

  return (
    <div ref={wrapperRef} className={`relative font-jakarta text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all w-full shadow-2xs cursor-pointer border ${
          isOpen
            ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white dark:bg-zinc-800'
            : variant === 'teal' || variant === 'emerald'
            ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/30 hover:bg-teal-100/60 font-black'
            : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 text-slate-800 dark:text-zinc-100'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0">
          <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 shrink-0">
            <CalendarIcon size={16} />
          </div>
          <span
            className={`truncate text-xs ${
              value
                ? 'text-slate-900 dark:text-zinc-100 font-black font-mono tracking-wider'
                : 'text-slate-400 dark:text-zinc-500 font-semibold'
            }`}
          >
            {formattedValue}
          </span>
        </div>
        <ChevronRight
          size={14}
          className={`text-slate-400 dark:text-zinc-400 transform transition-transform shrink-0 ${
            isOpen ? 'rotate-90 text-teal-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-3xl p-4 sm:p-5 w-[310px] z-[9999] text-slate-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl`}
        >
          {/* Header Tháng & Năm */}
          <div className="flex justify-between items-center mb-3.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="size-8 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 flex items-center justify-center text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer active:scale-95"
              title="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-zinc-100 uppercase tracking-wider block">
                {monthNames[month]} {year}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="size-8 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 flex items-center justify-center text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer active:scale-95"
              title="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Preset Buttons (Hôm nay / Ngày mai) */}
          <div className="flex items-center gap-1.5 mb-3">
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100/80 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleSelectTomorrow}
              className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 border border-slate-200/70 dark:border-zinc-700 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Ngày mai
            </button>
          </div>

          {/* Thứ trong tuần */}
          <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-rose-500">CN</span>
          </div>

          {/* Lưới ngày trong tháng */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarCells.map((cell, idx) => {
              if (cell === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const cellDate = new Date(year, month, cell);
              const cellTime = cellDate.getTime();
              const isPast = minDateTime ? cellTime < minDateTime : false;
              const isFuture = maxDateTime ? cellTime > maxDateTime : false;
              const isDisabled = isPast || isFuture;

              const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell).padStart(2, '0')}`;
              const isCurrentDay = cellDateStr === todayStr;
              const isSelected = value === cellDateStr;

              return (
                <button
                  key={`day-${cell}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDaySelect(cell)}
                  className={`aspect-square w-full rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                    isDisabled
                      ? 'text-slate-300 dark:text-zinc-700 cursor-not-allowed opacity-35 line-through'
                      : isSelected
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 font-black ring-2 ring-teal-500/30 scale-105 z-10'
                      : isCurrentDay
                      ? 'border-2 border-teal-500 text-teal-600 dark:text-teal-400 font-black hover:bg-teal-50/80 dark:hover:bg-teal-950/40'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 cursor-pointer active:scale-95'
                  }`}
                >
                  {cell}
                </button>
              );
            })}
          </div>

          {/* Footer Xóa */}
          {value && (
            <div className="flex items-center justify-end border-t border-slate-100 dark:border-zinc-800/80 pt-2.5 mt-3 text-[11px] font-black">
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[10.5px]"
              >
                <X size={12} /> Bỏ chọn ngày
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default CustomDatePicker;

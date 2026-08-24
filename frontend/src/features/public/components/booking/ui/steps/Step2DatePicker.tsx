import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatLocalDate, getVietnameseDay } from '../../constants';

interface Step2DatePickerProps {
  selectedDate: string;
  setDateField: (date: string) => void;
  hasExistingClinicalExam?: boolean;
  setShowBlockWarning?: (show: boolean) => void;
  setActiveStep: (step: number) => void;
}

export function Step2DatePicker({
  selectedDate,
  setDateField,
  setActiveStep
}: Step2DatePickerProps) {
  const dateContainerRef = useRef<HTMLDivElement>(null);

  const datesList = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  }, []);

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      dateContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      key="date-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left"
    >
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
            <CalendarIcon className="text-[#2EC4B6]" size={20} />
            Chọn ngày lượng giá
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Xem danh sách các ngày còn chỗ trống dưới đây.
          </p>
        </div>
        
        {/* Scrolling controls for desktop */}
        <div className="hidden sm:flex gap-1">
          <button
            type="button"
            onClick={() => scrollDates('left')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollDates('right')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Date Cards Horizontal Container */}
      <div
        ref={dateContainerRef}
        className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-2 px-2 hide-scrollbar snap-x"
      >
        {datesList.map((dateItem) => {
          const dateStr = formatLocalDate(dateItem);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => setDateField(dateStr)}
              className={`flex-shrink-0 w-24 h-24 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 relative snap-start outline-none
                ${isSelected
                  ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-lg shadow-[#2EC4B6]/25 scale-[1.04] z-10'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-slate-50/50 hover:scale-[1.02]'
                }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                {dateStr === formatLocalDate(new Date()) ? 'Hôm nay' : getVietnameseDay(dateItem)}
              </span>
              <span className="text-2xl font-jakarta font-black mt-1">
                {dateItem.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(3)}
          disabled={!selectedDate}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Chọn Buổi Hẹn
        </button>
      </div>
    </motion.div>
  );
}

import { ChevronLeft, ChevronRight, Search, Stethoscope, Zap } from 'lucide-react';
import { format, startOfWeek, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AppointmentsFilterBarProps {
  timeRange: 'today' | '7days' | 'month' | 'custom';
  setTimeRange: (range: 'today' | '7days' | 'month' | 'custom') => void;
  startDateOfWeek: Date;
  endDateOfWeek: Date;
  handleNavigateDay: (direction: 'next' | 'prev' | 'today') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'timeline' | 'capacity';
  selectedDate: Date;
  activeType: 'kham' | 'dieu_tri';
  onToggleType: () => void;
  canToggleType?: boolean;
  setViewMode?: (mode: 'timeline' | 'capacity') => void;
}

export function AppointmentsFilterBar({
  timeRange,
  setTimeRange,
  startDateOfWeek,
  endDateOfWeek,
  handleNavigateDay,
  searchTerm,
  setSearchTerm,
  viewMode,
  selectedDate,
  activeType,
  onToggleType,
  canToggleType = false,
  setViewMode
}: AppointmentsFilterBarProps) {
  
  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-zinc-800/80 p-4 lg:p-5 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Section: Icon, Title, and Search bar combined in a clean row/group */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
          
          {/* Title block / Tab Selector for Lịch Khám vs Lịch Điều Trị */}
          <div className="flex items-center gap-3 shrink-0">
            {canToggleType ? (
              <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200/40 dark:border-zinc-800 select-none shrink-0">
                <button
                  type="button"
                  onClick={() => { if (activeType !== 'kham') onToggleType(); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 ${
                    activeType === 'kham'
                      ? 'bg-white dark:bg-zinc-700 text-[#0d9488] dark:text-teal-400 shadow-sm border border-slate-200/20'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <Stethoscope size={13} className="shrink-0 text-[#0d9488]" />
                  <span>Lịch Khám</span>
                </button>
                <button
                  type="button"
                  onClick={() => { if (activeType !== 'dieu_tri') onToggleType(); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 ${
                    activeType === 'dieu_tri'
                      ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/20'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <Zap size={13} className="shrink-0 text-amber-500" />
                  <span>Lịch Điều Trị</span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-zinc-850/60 text-slate-800 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-wider select-none shrink-0">
                {activeType === 'kham' ? (
                  <>
                    <Stethoscope size={14} className="text-[#0d9488] shrink-0" />
                    <span>Lịch Khám Chuyên Khoa</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-amber-500 shrink-0" />
                    <span>Lịch Điều Trị Vật Lý</span>
                  </>
                )}
              </div>
            )}
            
            {/* Helper label for view type */}
            <div className="hidden xl:flex flex-col text-left">
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold tracking-wide uppercase">
                {viewMode === 'timeline' 
                  ? "Trình tự ngày" 
                  : "Công suất tuần/tháng"}
              </p>
            </div>
          </div>
 
          {/* Vertical divider on screens >= sm */}
          <div className="hidden sm:block w-[1px] h-8 bg-slate-150 dark:bg-zinc-800 shrink-0" />
 
          {/* Search Patient Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-555 pointer-events-none" size={13} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên bệnh nhân, mã số..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-800 text-slate-850 dark:text-zinc-200 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 dark:focus:border-teal-500/50 transition-all placeholder-slate-400 dark:placeholder-zinc-555"
            />
          </div>
 
        </div>
 
        {/* Right Section: Toggle buttons & Date navigation */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 justify-start lg:justify-end">
          
          {/* Selector for Ngày / Tuần / Tháng - Always visible */}
          <div className="flex bg-slate-50 dark:bg-zinc-850 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800 select-none shrink-0">
            <button
              type="button"
              onClick={() => {
                setTimeRange('today');
                setViewMode?.('timeline');
              }}
              className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                timeRange === 'today'
                  ? 'bg-white dark:bg-zinc-700 text-[#0d9488] dark:text-teal-400 shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeRange('7days');
                setViewMode?.('capacity');
              }}
              className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                timeRange === '7days'
                  ? 'bg-white dark:bg-zinc-700 text-[#0d9488] dark:text-teal-450 shadow-sm border border-slate-200/20'
                  : 'text-slate-550 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeRange('month');
                setViewMode?.('capacity');
              }}
              className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                timeRange === 'month'
                  ? 'bg-white dark:bg-zinc-700 text-[#0d9488] dark:text-teal-450 shadow-sm border border-slate-200/20'
                  : 'text-slate-550 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Tháng
            </button>
          </div>

          {/* Date Navigator Card */}
          {(() => {
            const isCurrentWeek = format(startDateOfWeek, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const isCurrentMonth = timeRange === 'month' && format(startDateOfWeek, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
            const isCurrentDay = isSameDay(selectedDate, new Date());
            
            const showActiveIndicator = 
              viewMode === 'timeline' 
                ? isCurrentDay
                : (timeRange === 'month' && isCurrentMonth) || (timeRange === '7days' && isCurrentWeek);
            
            return (
              <div className={`flex items-center justify-between bg-slate-50 dark:bg-zinc-850/60 border rounded-xl p-1 shrink-0 transition-all ${
                showActiveIndicator
                  ? 'border-teal-500/40 dark:border-teal-500/30 ring-2 ring-teal-500/5 dark:ring-teal-500/2 shadow-[0_0_15px_rgba(20,184,166,0.08)] bg-teal-50/5 dark:bg-teal-955/2' 
                  : 'border-slate-200/80 dark:border-zinc-800'
              }`}>
                <button 
                  type="button"
                  onClick={() => handleNavigateDay('prev')} 
                  className="p-2 hover:bg-white dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-300 rounded-lg transition-all focus:outline-none hover:shadow-sm"
                >
                  <ChevronLeft size={15} className="stroke-[2.5]" />
                </button>
                
                <div className="px-3 text-xs font-black text-slate-800 dark:text-zinc-150 text-center min-w-[190px] sm:min-w-[210px] select-none capitalize flex items-center justify-center gap-2">
                  {showActiveIndicator && (
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                  )}
                  {(viewMode === 'timeline' || timeRange === 'today') ? (
                    <span className="lowercase first-letter:uppercase">Ngày: {format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })}</span>
                  ) : timeRange === 'month' ? (
                    <span>Tháng: {format(startDateOfWeek, 'MM/yyyy')}</span>
                  ) : (
                    <span>Tuần: {format(startDateOfWeek, 'dd/MM')} - {format(endDateOfWeek, 'dd/MM/yyyy')}</span>
                  )}
                  {showActiveIndicator && (
                    <span className="text-[9px] font-black uppercase text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-500/20">
                      {(viewMode === 'timeline' || timeRange === 'today') ? 'Hôm nay' : timeRange === 'month' ? 'Tháng này' : 'Tuần này'}
                    </span>
                  )}
                </div>
                
                <button 
                  type="button"
                  onClick={() => handleNavigateDay('next')} 
                  className="p-2 hover:bg-white dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-300 rounded-lg transition-all focus:outline-none hover:shadow-sm"
                >
                  <ChevronRight size={15} className="stroke-[2.5]" />
                </button>
              </div>
            );
          })()}

        </div>

      </div>
    </div>
  );
}

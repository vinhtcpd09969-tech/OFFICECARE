import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../../../api/axios';
import { toast } from 'react-hot-toast';
import { Calendar } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

// Helper: Calculate local YYYY-MM-DD
const getLocalFormattedDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Premium Custom React Calendar Dropdown
function CustomDatePicker({ 
  value, 
  onChange, 
  minDate 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  minDate?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [navDate, setNavDate] = useState<Date>(currentDate);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
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

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

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
    if (!value) return 'Chọn ngày';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value]);

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

  const minDateTime = useMemo(() => {
    if (!minDate) return null;
    const parts = minDate.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
    }
    return null;
  }, [minDate]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-zinc-200/80 p-2 font-bold rounded-xl bg-white text-left text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500/10 flex items-center justify-between gap-2 cursor-pointer shadow-sm hover:border-zinc-350 transition-colors text-xs w-[120px]"
      >
        <span>{formattedValue}</span>
        <Calendar size={12} className="text-zinc-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 bg-white border border-zinc-100 shadow-xl rounded-2xl p-4 w-[260px] z-50 animate-scale-up text-zinc-800">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="size-7 rounded-lg hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 transition-colors cursor-pointer"
              >
                ‹
              </button>
              <span className="font-extrabold text-[11px] text-zinc-800 uppercase tracking-wide">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="size-7 rounded-lg hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 transition-colors cursor-pointer"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-zinc-400 uppercase tracking-wider mb-2">
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

                const thisCellTime = new Date(year, month, cell).getTime();
                const isCellDisabled = minDateTime !== null && thisCellTime < minDateTime;

                const isSelected = 
                  currentDate.getDate() === cell &&
                  currentDate.getMonth() === month &&
                  currentDate.getFullYear() === year;

                return (
                  <button
                    key={`day-${cell}`}
                    type="button"
                    disabled={isCellDisabled}
                    onClick={() => handleDaySelect(cell)}
                    className={`size-7 rounded-lg font-bold flex items-center justify-center transition-all ${
                      isCellDisabled
                        ? 'text-zinc-300 bg-transparent cursor-not-allowed'
                        : isSelected
                          ? 'bg-teal-600 text-white shadow-sm font-black cursor-pointer'
                          : 'hover:bg-zinc-150 text-zinc-700 cursor-pointer'
                    }`}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function RevenueChart({ isClient }: { isClient: boolean }) {
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month');
  const [chartData, setChartData] = useState<{ label: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Years option
  const years = useMemo(() => Array.from({ length: 11 }, (_, i) => 2020 + i), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // Filter States
  const [dayStart, setDayStart] = useState('');
  const [dayEnd, setDayEnd] = useState('');

  const [monthStartVal, setMonthStartVal] = useState(1);
  const [monthStartYear, setMonthStartYear] = useState(2026);
  const [monthEndVal, setMonthEndVal] = useState(12);
  const [monthEndYear, setMonthEndYear] = useState(2026);

  const [yearStartVal, setYearStartVal] = useState(2023);
  const [yearEndVal, setYearEndVal] = useState(2026);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDayStart(getLocalFormattedDate(thirtyDaysAgo));
    setDayEnd(getLocalFormattedDate(today));

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    setMonthStartYear(currentYear);
    setMonthEndYear(currentYear);
    
    setMonthStartVal(1);
    setMonthEndVal(currentMonth);

    setYearStartVal(currentYear - 3);
    setYearEndVal(currentYear);
  }, []);

  // Ensure End Date is at least equal to Start Date when Start Date changes
  useEffect(() => {
    if (dayStart && dayEnd) {
      if (new Date(dayEnd) < new Date(dayStart)) {
        setDayEnd(dayStart);
      }
    }
  }, [dayStart]);

  // Ensure End Month/Year are valid when Start Month/Year changes
  useEffect(() => {
    if (monthEndYear < monthStartYear) {
      setMonthEndYear(monthStartYear);
    }
    if (monthEndYear === monthStartYear && monthEndVal < monthStartVal) {
      setMonthEndVal(monthStartVal);
    }
  }, [monthStartVal, monthStartYear]);

  // Ensure End Year is valid when Start Year changes
  useEffect(() => {
    if (yearEndVal < yearStartVal) {
      setYearEndVal(yearStartVal);
    }
  }, [yearStartVal]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      let startDateStr = '';
      let endDateStr = '';

      if (filterType === 'day') {
        startDateStr = dayStart;
        endDateStr = dayEnd;
      } else if (filterType === 'month') {
        startDateStr = `${monthStartYear}-${String(monthStartVal).padStart(2, '0')}-01`;
        endDateStr = `${monthEndYear}-${String(monthEndVal).padStart(2, '0')}-31`;
      } else if (filterType === 'year') {
        startDateStr = `${yearStartVal}-01-01`;
        endDateStr = `${yearEndVal}-12-31`;
      }

      const res = await api.get('/admin/analytics/revenue', {
        params: {
          type: filterType,
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
      
      // Formatting dynamic labels
      const formatted = (res.data || []).map((item: any) => {
        let label = item.label;
        if (filterType === 'month' && item.label.includes('-')) {
          const parts = item.label.split('-');
          label = `T${Number(parts[1])}/${parts[0].substring(2)}`;
        } else if (filterType === 'day' && item.label.includes('-')) {
          const parts = item.label.split('-');
          label = `${parts[2]}/${parts[1]}`;
        }
        return {
          ...item,
          label
        };
      });

      setChartData(formatted);
    } catch (error) {
      console.error('Error loading revenue chart data:', error);
      toast.error('Lỗi khi tải dữ liệu doanh thu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dayStart && dayEnd) {
      fetchRevenueData();
    }
  }, [filterType, dayStart, dayEnd, monthStartVal, monthStartYear, monthEndVal, monthEndYear, yearStartVal, yearEndVal]);

  // Available end months based on start month/year selection
  const filteredEndMonths = useMemo(() => {
    if (monthEndYear === monthStartYear) {
      return months.filter(m => m >= monthStartVal);
    }
    return months;
  }, [monthStartVal, monthStartYear, monthEndYear, months]);

  // Available end years based on start selections
  const filteredEndYears = useMemo(() => {
    return years.filter(y => y >= monthStartYear);
  }, [monthStartYear, years]);

  const filteredEndYearsOnly = useMemo(() => {
    return years.filter(y => y >= yearStartVal);
  }, [yearStartVal, years]);

  return (
    <div 
      className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui opacity-0 animate-slide-up flex flex-col justify-between"
      style={{ animationDelay: '300ms' }}
    >
      <div>
        {/* Title & Filter Selection Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-50 pb-5">
          <div>
            <h3 className="text-lg font-extrabold text-secondary flex items-center gap-2">
              <Calendar className="text-teal-600 shrink-0" size={20} />
              Biểu Đồ Doanh Thu
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Doanh số phòng khám thống kê trực quan</p>
          </div>

          <div className="flex bg-zinc-50 border border-zinc-200/50 p-1 rounded-xl self-start sm:self-auto shadow-inner">
            {(['day', 'month', 'year'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-white text-secondary shadow-sm font-black'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {type === 'day' ? 'Ngày' : type === 'month' ? 'Tháng' : 'Năm'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter Inputs Panel */}
        <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary font-bold">
            {/* DAILY FILTER INPUTS WITH CUSTOM POPUP */}
            {filterType === 'day' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Từ ngày</span>
                  <CustomDatePicker
                    value={dayStart}
                    onChange={(val) => setDayStart(val)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Đến ngày</span>
                  <CustomDatePicker
                    value={dayEnd}
                    onChange={(val) => setDayEnd(val)}
                    minDate={dayStart}
                  />
                </div>
              </>
            )}

            {/* MONTHLY FILTER INPUTS */}
            {filterType === 'month' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Từ tháng</span>
                  <select
                    value={monthStartVal}
                    onChange={(e) => setMonthStartVal(Number(e.target.value))}
                    className="bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-zinc-300"
                  >
                    {months.map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                  <select
                    value={monthStartYear}
                    onChange={(e) => setMonthStartYear(Number(e.target.value))}
                    className="bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-zinc-300"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Đến tháng</span>
                  <select
                    value={monthEndVal}
                    onChange={(e) => setMonthEndVal(Number(e.target.value))}
                    className="bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-zinc-300"
                  >
                    {filteredEndMonths.map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                  <select
                    value={monthEndYear}
                    onChange={(e) => setMonthEndYear(Number(e.target.value))}
                    className="bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-zinc-300"
                  >
                    {filteredEndYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* YEARLY FILTER INPUTS */}
            {filterType === 'year' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Từ năm</span>
                  <select
                    value={yearStartVal}
                    onChange={(e) => setYearStartVal(Number(e.target.value))}
                    className="bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-zinc-300"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Đến năm</span>
                  <select
                    value={yearEndVal}
                    onChange={(e) => setYearEndVal(Number(e.target.value))}
                    className="bg-white border border-zinc-200 rounded-xl p-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-zinc-300"
                  >
                    {filteredEndYearsOnly.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area (Teal Line Gradient - Pro Max Design) */}
      <div className="h-[280px] w-full flex items-center justify-center mt-2">
        {loading ? (
          <div className="text-zinc-400 text-xs font-bold animate-pulse">Đang đồng bộ hóa doanh số...</div>
        ) : chartData.length === 0 ? (
          <div className="text-zinc-400 text-xs italic font-bold">Không có giao dịch thanh toán trong thời gian này.</div>
        ) : (
          isClient && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 'bold' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 'bold' }} 
                  dx={-5}
                />
                <Tooltip
                  cursor={{ stroke: '#0D9488', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)', 
                    padding: '12px 16px', 
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)'
                  }}
                  formatter={(val) => [currencyFormatter.format(Number(val)), 'Doanh thu']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0D9488" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )
        )}
      </div>
    </div>
  );
}

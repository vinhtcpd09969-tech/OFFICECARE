import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  FileDown,
  RefreshCw,
  Calendar
} from 'lucide-react';
import api from '../../../../api/axios';
import { toast } from 'react-hot-toast';

// Import subcomponents
import { StatCard } from '../../components/StatCard';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';
import { RevenueChart } from './RevenueChart';
import { TopPackagesChart } from './TopPackagesChart';
import { TopVipCustomers } from './TopVipCustomers';
import { StaffPerformanceGrid } from './StaffPerformanceGrid';

const getLocalFormattedDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

type FilterMode = 'day' | 'month' | 'year';

interface DashboardData {
  stats: {
    total_customers: string | number;
    pending_appointments: string | number;
    total_revenue: string | number;
    active_staff: string | number;
    customers_this_month: number;
    customers_prev_month: number;
    cancellation_rate: number;
    completed_appointments: number;
  } | null;
  performanceData: { name: string; avatar?: string; role?: string; sessions: number }[];
  isLoaded: boolean;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    performanceData: [],
    isLoaded: false
  });

  const [isClient, setIsClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bộ lọc thời gian DUY NHẤT cho cả trang — 3 chế độ Ngày/Tháng/Năm, mỗi chế độ chọn mốc bắt đầu
  // Bộ lọc thời gian DUY NHẤT cho cả trang — Mặc định khi mới tải trang là 7 ngày gần nhất (chế độ Ngày)
  const [filterMode, setFilterMode] = useState<FilterMode>('day');

  const [dayStart, setDayStart] = useState('');
  const [dayEnd, setDayEnd] = useState('');

  const [monthStartVal, setMonthStartVal] = useState(1);
  const [monthStartYear, setMonthStartYear] = useState(2026);
  const [monthEndVal, setMonthEndVal] = useState(1);
  const [monthEndYear, setMonthEndYear] = useState(2026);

  const [yearStartVal, setYearStartVal] = useState(2026);
  const [yearEndVal, setYearEndVal] = useState(2026);

  const years = useMemo(() => Array.from({ length: 11 }, (_, i) => 2020 + i), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // Khởi tạo mốc mặc định = 7 ngày gần nhất (từ 6 ngày trước đến hôm nay) khi vừa vào trang.
  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(today.getDate() - 6);

    const y = today.getFullYear();
    const m = today.getMonth() + 1;

    setDayStart(getLocalFormattedDate(sixDaysAgo));
    setDayEnd(getLocalFormattedDate(today));

    setMonthStartVal(m);
    setMonthStartYear(y);
    setMonthEndVal(m);
    setMonthEndYear(y);

    setYearStartVal(y);
    setYearEndVal(y);
  }, []);

  // Ràng buộc kết thúc >= bắt đầu cho từng chế độ — tự đẩy đầu kết thúc lên khi đầu bắt đầu vượt qua.
  useEffect(() => {
    if (dayStart && dayEnd && new Date(dayEnd) < new Date(dayStart)) {
      setDayEnd(dayStart);
    }
  }, [dayStart]);

  useEffect(() => {
    if (monthEndYear < monthStartYear) {
      setMonthEndYear(monthStartYear);
    }
    if (monthEndYear === monthStartYear && monthEndVal < monthStartVal) {
      setMonthEndVal(monthStartVal);
    }
  }, [monthStartVal, monthStartYear]);

  useEffect(() => {
    if (yearEndVal < yearStartVal) {
      setYearEndVal(yearStartVal);
    }
  }, [yearStartVal]);

  const filteredEndMonths = useMemo(() => {
    if (monthEndYear === monthStartYear) {
      return months.filter((m) => m >= monthStartVal);
    }
    return months;
  }, [monthStartVal, monthStartYear, monthEndYear, months]);

  const filteredEndYearsForMonth = useMemo(() => years.filter((y) => y >= monthStartYear), [monthStartYear, years]);
  const filteredEndYearsOnly = useMemo(() => years.filter((y) => y >= yearStartVal), [yearStartVal, years]);

  // Suy ra {startDate, endDate, bucket, label} duy nhất từ chế độ đang chọn — nguồn chung cho cả
  // 3 thẻ KPI lẫn biểu đồ doanh thu bên dưới.
  const rangeInfo = useMemo(() => {
    if (filterMode === 'day') {
      const fmt = (s: string) => s.split('-').reverse().join('/');
      return {
        startDate: dayStart,
        endDate: dayEnd,
        bucket: 'day' as const,
        label: dayStart && dayEnd ? (dayStart === dayEnd ? fmt(dayStart) : `${fmt(dayStart)} - ${fmt(dayEnd)}`) : ''
      };
    }
    if (filterMode === 'month') {
      const startDate = `${monthStartYear}-${pad2(monthStartVal)}-01`;
      const endDate = `${monthEndYear}-${pad2(monthEndVal)}-${pad2(daysInMonth(monthEndYear, monthEndVal))}`;
      const label =
        monthStartVal === monthEndVal && monthStartYear === monthEndYear
          ? `Tháng ${monthStartVal}/${monthStartYear}`
          : `T${monthStartVal}/${String(monthStartYear).slice(2)} - T${monthEndVal}/${String(monthEndYear).slice(2)}`;
      return { startDate, endDate, bucket: 'month' as const, label };
    }
    const startDate = `${yearStartVal}-01-01`;
    const endDate = `${yearEndVal}-12-31`;
    const label = yearStartVal === yearEndVal ? `Năm ${yearStartVal}` : `${yearStartVal} - ${yearEndVal}`;
    return { startDate, endDate, bucket: 'year' as const, label };
  }, [filterMode, dayStart, dayEnd, monthStartVal, monthStartYear, monthEndVal, monthEndYear, yearStartVal, yearEndVal]);

  useEffect(() => {
    if (!rangeInfo.startDate || !rangeInfo.endDate) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeInfo.startDate, rangeInfo.endDate]);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, performanceRes] = await Promise.all([
        api.get('/admin/analytics/summary', { params: { startDate: rangeInfo.startDate, endDate: rangeInfo.endDate } }),
        api.get('/admin/analytics/performance')
      ]);

      setData({
        stats: statsRes.data || null,
        performanceData: Array.isArray(performanceRes.data) ? performanceRes.data : [],
        isLoaded: true
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể đồng bộ dữ liệu báo cáo');
    } finally {
      setIsRefreshing(false);
    }
  };

  const { stats, performanceData, isLoaded } = data;

  // MoM Customers calculation
  const customerMoM = useMemo(() => {
    if (!stats) return '0%';
    const current = Number(stats.customers_this_month || 0);
    const prev = Number(stats.customers_prev_month || 0);
    if (prev === 0) {
      return current > 0 ? `+100%` : '0%';
    }
    const diff = ((current - prev) / prev) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(0)}%`;
  }, [stats]);

  const customerMoMColor = useMemo(() => {
    if (!stats) return '';
    const current = Number(stats.customers_this_month || 0);
    const prev = Number(stats.customers_prev_month || 0);
    return current >= prev ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
  }, [stats]);

  // Cancellation rate styles
  const cancelRateColor = useMemo(() => {
    if (!stats) return '';
    const rate = Number(stats.cancellation_rate || 0);
    if (rate < 5) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
    if (rate <= 12) return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
    return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
  }, [stats]);

  const cancelRateLabel = useMemo(() => {
    if (!stats) return 'Ổn định';
    const rate = Number(stats.cancellation_rate || 0);
    if (rate < 5) return 'Rất tốt';
    if (rate <= 12) return 'Bình thường';
    return 'Cảnh báo cao';
  }, [stats]);

  // Sparklines
  const revenueTrend = useMemo(() => [
    { val: 1200000 },
    { val: 1800000 },
    { val: 1400000 },
    { val: 2100000 },
    { val: 2800000 },
    { val: Number(stats?.total_revenue || 3102500) }
  ], [stats]);

  const customerTrend = useMemo(() => [
    { val: 2 },
    { val: 3 },
    { val: 1 },
    { val: 4 },
    { val: Number(stats?.customers_this_month || 5) }
  ], [stats]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-teal-600 font-extrabold text-sm animate-pulse">
          <RefreshCw className="animate-spin size-5" />
          Đang tải báo cáo thống kê...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Sleek Modern Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 md:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Thống Kê Vận Hành Phòng Khám
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-0.5">
            Báo cáo tổng quan doanh thu, bệnh nhân &amp; hiệu suất nhân sự PhysioFlow
          </p>
        </div>

        {/* Filter Mode + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {[
              { id: 'day' as const, label: 'Ngày' },
              { id: 'month' as const, label: 'Tháng' },
              { id: 'year' as const, label: 'Năm' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setFilterMode(mode.id)}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  filterMode === mode.id
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => toast.success('Đang khởi tạo báo cáo PDF...')}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
          >
            <FileDown size={16} />
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Date Range Inputs Bar — nội dung đổi theo filterMode, luôn bắt buộc chọn cả 2 đầu mốc */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-5 py-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
          <Calendar size={13} />
          Khoảng thời gian
        </span>

        {filterMode === 'day' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Từ ngày</span>
              <CustomDatePicker value={dayStart} onChange={setDayStart} maxDate={dayEnd || undefined} align="left" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đến ngày</span>
              <CustomDatePicker value={dayEnd} onChange={setDayEnd} minDate={dayStart || undefined} align="left" />
            </div>
          </>
        )}

        {filterMode === 'month' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Từ tháng</span>
              <select
                value={monthStartVal}
                onChange={(e) => setMonthStartVal(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-slate-300 dark:hover:border-slate-600"
              >
                {months.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select
                value={monthStartYear}
                onChange={(e) => setMonthStartYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-slate-300 dark:hover:border-slate-600"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đến tháng</span>
              <select
                value={monthEndVal}
                onChange={(e) => setMonthEndVal(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-slate-300 dark:hover:border-slate-600"
              >
                {filteredEndMonths.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select
                value={monthEndYear}
                onChange={(e) => setMonthEndYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-slate-300 dark:hover:border-slate-600"
              >
                {filteredEndYearsForMonth.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}

        {filterMode === 'year' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Từ năm</span>
              <select
                value={yearStartVal}
                onChange={(e) => setYearStartVal(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-slate-300 dark:hover:border-slate-600"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đến năm</span>
              <select
                value={yearEndVal}
                onChange={(e) => setYearEndVal(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-bold text-xs cursor-pointer focus:outline-none hover:border-slate-300 dark:hover:border-slate-600"
              >
                {filteredEndYearsOnly.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* 3 Core KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doanh thu tổng */}
        <StatCard
          title="Doanh Thu Thuần"
          value={isClient ? currencyFormatter.format(Number(stats?.total_revenue || 0)) : '0 đ'}
          change={rangeInfo.label}
          changeColor="bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
          icon={<DollarSign className="text-teal-600 dark:text-teal-400" size={20} />}
          color="bg-teal-50 dark:bg-teal-950/30"
          delay="100ms"
          sparklineData={revenueTrend}
        />

        {/* Tổng khách hàng đã đăng ký tài khoản (không phân biệt đã có hồ sơ điều trị hay chưa) —
            đây là số lũy kế toàn thời gian, không đổi theo bộ lọc thời gian ở trên, chỉ phần trăm
            tăng trưởng (so với tháng trước) là có ý nghĩa theo thời gian thực. */}
        <StatCard
          title="Tổng Khách Hàng Đăng Ký"
          value={`${stats?.total_customers || 0} khách`}
          change={customerMoM}
          changeColor={customerMoMColor}
          icon={<Users className="text-indigo-600 dark:text-indigo-400" size={20} />}
          color="bg-indigo-50 dark:bg-indigo-950/30"
          delay="150ms"
          sparklineData={customerTrend}
        />

        {/* Tỉ lệ hủy lịch */}
        <StatCard
          title="Tỷ Lệ Hủy / Đổi Lịch"
          value={`${stats?.cancellation_rate || 0}%`}
          change={cancelRateLabel}
          changeColor={cancelRateColor}
          icon={<Activity className="text-rose-500" size={20} />}
          color="bg-rose-50 dark:bg-rose-950/30"
          delay="200ms"
        />
      </div>

      {/* Biểu Đồ Doanh Thu — full-width riêng 1 hàng, Top Gói xếp hàng riêng bên dưới để không còn
          phải ép 2 khối nội dung có bản chất khác nhau (chart liên tục vs. danh sách xếp hạng) vào
          chung 1 hàng rồi tranh nhau chiều cao. */}
      <RevenueChart
        startDate={rangeInfo.startDate}
        endDate={rangeInfo.endDate}
        bucket={rangeInfo.bucket}
        periodLabel={rangeInfo.label}
        isClient={isClient}
      />

      <TopPackagesChart />

      {/* Leaderboards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <TopVipCustomers />
        <StaffPerformanceGrid performanceData={performanceData} />
      </div>
    </div>
  );
}

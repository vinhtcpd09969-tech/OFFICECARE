import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  Target
} from 'lucide-react';
import api from '../../../../api/axios';

// Import subcomponents
import { StatCard } from './StatCard';
import { RevenueChart } from './RevenueChart';
import { TopPackagesChart } from './TopPackagesChart';
import { TopVipCustomers } from './TopVipCustomers';
import { CustomerReviewsSlider } from './CustomerReviewsSlider';
import { StaffPerformanceGrid } from './StaffPerformanceGrid';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

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

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, performanceRes] = await Promise.all([
        api.get('/admin/analytics/summary'),
        api.get('/admin/analytics/performance')
      ]);

      setData({
        stats: statsRes.data || null,
        performanceData: Array.isArray(performanceRes.data) ? performanceRes.data : [],
        isLoaded: true
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    return current >= prev ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-650';
  }, [stats]);

  // Cancellation rate styles
  const cancelRateColor = useMemo(() => {
    if (!stats) return '';
    const rate = Number(stats.cancellation_rate || 0);
    if (rate < 5) return 'bg-emerald-50 text-emerald-600';
    if (rate <= 12) return 'bg-amber-50 text-amber-600';
    return 'bg-rose-50 text-rose-650';
  }, [stats]);

  const cancelRateLabel = useMemo(() => {
    if (!stats) return 'Ổn định';
    const rate = Number(stats.cancellation_rate || 0);
    if (rate < 5) return 'Rất tốt';
    if (rate <= 12) return 'Bình thường';
    return 'Cảnh báo cao';
  }, [stats]);

  // Sparkline Trends matching reference video styling
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

  // Monthly goals targets vs current monthly revenues percentage
  const goalProgressPercent = useMemo(() => {
    const monthlyTarget = 10000000; // 10 million target
    const current = Number(stats?.total_revenue || 0);
    return Math.min(Math.round((current / monthlyTarget) * 100), 100) || 40;
  }, [stats]);

  if (!isLoaded) return <div className="p-8 text-zinc-500 font-semibold animate-pulse">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="space-y-8 pb-12">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in border-b border-zinc-50 pb-5">
        <div>
          <h1 className="text-2xl font-black text-secondary tracking-tight">Tổng quan Hệ thống</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mt-1">
            Chào mừng quay trở lại. Báo cáo tình hình hoạt động của phòng khám.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white text-secondary border border-zinc-200 px-4 py-2.5 rounded-[14px] font-bold text-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-md cursor-pointer active:scale-95">
            Xuất báo cáo PDF
          </button>
        </div>
      </div>

      {/* Stats Grid with sparklines and goals progress circle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Doanh thu tổng */}
        <StatCard
          title="Tổng doanh thu"
          value={isClient ? currencyFormatter.format(Number(stats?.total_revenue || 0)) : '0 đ'}
          change="+12% tháng này"
          changeColor="bg-teal-50 text-teal-600"
          icon={<DollarSign className="text-teal-600" size={18} />}
          color="bg-teal-50"
          delay="100ms"
          sparklineData={revenueTrend}
        />

        {/* Khách hàng mới */}
        <StatCard
          title="Tổng Khách Hàng"
          value={`${stats?.total_customers || 0} hồ sơ`}
          change={customerMoM}
          changeColor={customerMoMColor}
          icon={<Users className="text-indigo-600" size={18} />}
          color="bg-indigo-50"
          delay="150ms"
          sparklineData={customerTrend}
        />

        {/* Mục tiêu tháng */}
        <StatCard
          title="Mục tiêu tháng"
          value="10.000.000 đ"
          change="Doanh số chỉ tiêu"
          changeColor="bg-amber-50 text-amber-600"
          icon={<Target className="text-amber-500" size={18} />}
          color="bg-amber-50"
          delay="200ms"
          progressCircle={{ percent: goalProgressPercent }}
        />

        {/* Tỉ lệ hủy lịch */}
        <StatCard
          title="Tỉ lệ hủy lịch"
          value={`${stats?.cancellation_rate || 0}%`}
          change={cancelRateLabel}
          changeColor={cancelRateColor}
          icon={<Activity className="text-rose-500" size={18} />}
          color="bg-rose-50"
          delay="250ms"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <RevenueChart isClient={isClient} />
        <TopPackagesChart />
      </div>

      {/* Detailed Leaderboards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <TopVipCustomers />
        <CustomerReviewsSlider />
        <StaffPerformanceGrid performanceData={performanceData} />
      </div>
    </div>
  );
}

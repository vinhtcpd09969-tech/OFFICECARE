import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';

interface Summary {
  total_customers: number;
  pending_appointments: number;
  total_revenue: number;
  active_staff: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface PerformanceData {
  name: string;
  sessions: number;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, revRes, perfRes] = await Promise.all([
          axios.get('/api/admin/analytics/summary'),
          axios.get('/api/admin/analytics/revenue'),
          axios.get('/api/admin/analytics/performance')
        ]);
        setSummary(sumRes.data);
        setRevenueData(revRes.data);
        setPerformanceData(perfRes.data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const COLORS = ['#0d9488', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'];

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu dashboard...</div>;

  return (
    <div className="space-y-8 pb-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Tổng doanh thu', value: formatCurrency(Number(summary?.total_revenue || 0)), icon: '💰', color: 'text-teal-600', bg: 'bg-teal-50' },
          { title: 'Tổng khách hàng', value: summary?.total_customers || 0, icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Lịch hẹn chờ duyệt', value: summary?.pending_appointments || 0, icon: '⏳', color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Nhân sự hoạt động', value: summary?.active_staff || 0, icon: '👔', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center text-xl`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">{stat.title}</h3>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">Doanh thu 6 tháng gần nhất</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.isArray(revenueData) ? revenueData : []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Doanh thu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0d9488"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-8">Hiệu suất KTV (Tháng này)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Array.isArray(performanceData) ? performanceData : []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sessions" radius={[0, 10, 10, 0]} barSize={32}>
                  {(Array.isArray(performanceData) ? performanceData : []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-400 text-center italic">Dựa trên số buổi trị liệu hoàn thành</p>
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Thông báo hệ thống</h3>
            <p className="text-slate-400 text-sm mb-6">Bạn có 3 bản cập nhật quan trọng về lịch bảo trì thiết bị tuần tới.</p>
            <button className="bg-teal-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-teal-400 transition-colors">Xem ngay</button>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>
        </div>
        <div className="bg-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Marketing Campaign</h3>
            <p className="text-teal-100 text-sm mb-6">Chiến dịch Vouchers Hè đang đạt 85% mục tiêu lượt sử dụng.</p>
            <button className="bg-white text-teal-600 px-6 py-2 rounded-xl font-bold hover:bg-slate-100 transition-colors">Quản lý Voucher</button>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}

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
import { TrendingUp } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

const formatYAxis = (val: number) => {
  if (val === 0) return '0';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} Tỷ`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} Tr`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
  return `${val}`;
};

export type RevenueBucket = 'day' | 'month' | 'year';

// bucket đến thẳng từ chế độ Ngày/Tháng/Năm đang chọn ở trang cha — backend TO_CHAR theo đúng
// granularity đó (xem getRevenueStats), ở đây chỉ định dạng lại nhãn cho gọn mắt.
const formatLabel = (label: string, bucket: RevenueBucket) => {
  if (bucket === 'year') return label; // đã là "YYYY"
  if (bucket === 'month' && label.includes('-')) {
    const [y, m] = label.split('-');
    return `T${Number(m)}/${y.substring(2)}`;
  }
  if (label.includes('-')) {
    const parts = label.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  }
  return label;
};

interface RevenueChartProps {
  startDate: string;
  endDate: string;
  bucket: RevenueBucket;
  periodLabel: string;
  isClient: boolean;
}

export function RevenueChart({ startDate, endDate, bucket, periodLabel, isClient }: RevenueChartProps) {
  const [chartData, setChartData] = useState<{ label: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, bucket]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/revenue', { params: { startDate, endDate, bucket } });
      const formatted = (res.data || []).map((item: any) => ({
        ...item,
        label: formatLabel(item.label, bucket)
      }));
      setChartData(formatted);
    } catch (error) {
      console.error('Error loading revenue chart data:', error);
      toast.error('Lỗi khi tải dữ liệu doanh thu.');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, d) => sum + Number(d.revenue || 0), 0),
    [chartData]
  );

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:border-teal-500/30">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="text-teal-600 dark:text-teal-400 shrink-0" size={20} />
            Biểu Đồ Doanh Thu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Xu hướng doanh số · {periodLabel}
          </p>
        </div>

        {!loading && (
          <span className="text-xs font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-150 dark:border-teal-900/40 px-3 py-1.5 rounded-xl shrink-0">
            Tổng: {isClient ? currencyFormatter.format(totalRevenue) : '0 đ'}
          </span>
        )}
      </div>

      {/* Chart Canvas Area — full-width riêng 1 hàng nên để cao hơn bản 2 cột cũ, đọc xu hướng rõ hơn */}
      <div className="h-[340px] w-full flex items-center justify-center">
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
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
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
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}
                  width={60}
                  tickFormatter={formatYAxis}
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

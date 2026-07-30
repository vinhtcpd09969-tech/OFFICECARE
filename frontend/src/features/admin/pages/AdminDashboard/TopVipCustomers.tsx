import { useEffect, useState, useMemo } from 'react';
import api from '../../../../api/axios';
import { Crown, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

interface VipCustomer {
  id: string;
  name: string;
  phone: string;
  total_paid: number;
  appointment_count?: number;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

export function TopVipCustomers() {
  const [data, setData] = useState<VipCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVipCustomers();
  }, []);

  const fetchVipCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/top-vip-customers');
      setData(res.data || []);
    } catch (error) {
      console.error('Error fetching VIP customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxPaid = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((c) => Number(c.total_paid || 0)), 1) : 1;
  }, [data]);

  const totalVipRevenue = useMemo(() => {
    return data.reduce((sum, c) => sum + Number(c.total_paid || 0), 0);
  }, [data]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 md:p-7 rounded-[32px] border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/30 dark:shadow-none transition-all duration-300 hover:border-amber-500/30 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
              <Crown className="animate-pulse" size={20} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Top 5 Khách Hàng VIP
                <Sparkles size={14} className="text-amber-500" />
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Khách hàng có tổng chi tiêu cao nhất phòng khám
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 shrink-0">
            VIP League
          </span>
        </div>

        {loading ? (
          <div className="text-slate-400 text-xs font-bold animate-pulse text-center py-16">
            Đang tải xếp hạng khách hàng VIP...
          </div>
        ) : data.length === 0 ? (
          <div className="text-slate-400 text-xs italic text-center py-16 font-bold">
            Chưa có dữ liệu thanh toán khách hàng.
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 5).map((cust, idx) => {
              const rank = idx + 1;
              const paid = Number(cust.total_paid || 0);
              const percent = Math.max(Math.round((paid / maxPaid) * 100), 12);

              const rankBadge =
                rank === 1
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30'
                  : rank === 2
                  ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md shadow-slate-400/20'
                  : rank === 3
                  ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-md shadow-amber-800/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60';

              const barGradient =
                rank === 1
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500'
                  : rank === 2
                  ? 'bg-gradient-to-r from-teal-400 to-teal-600'
                  : 'bg-gradient-to-r from-indigo-400 to-indigo-600';

              const rankIcon = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <div
                  key={cust.id + idx}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-amber-50/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/60 group"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${rankBadge}`}>
                        {rankIcon}
                      </span>

                      {/* Customer Initials Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center border border-teal-500/30 shrink-0">
                        {cust.name ? cust.name.charAt(0).toUpperCase() : 'K'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-900 dark:text-white text-xs md:text-sm truncate">
                            {cust.name}
                          </h4>
                          {rank === 1 && <ShieldCheck size={13} className="text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                          <UserCheck size={10} className="text-teal-500" />
                          {cust.phone || 'Thành viên VIP'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 dark:text-white text-xs md:text-sm block">
                        {currencyFormatter.format(paid).replace('₫', 'đ')}
                      </span>
                      <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-200 dark:border-emerald-800/60">
                        Đã thanh toán
                      </span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${barGradient}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Total Summary Pill */}
      {!loading && data.length > 0 && (
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Tổng doanh thu Top 5:</span>
          <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
            {currencyFormatter.format(totalVipRevenue).replace('₫', 'đ')}
          </span>
        </div>
      )}
    </div>
  );
}

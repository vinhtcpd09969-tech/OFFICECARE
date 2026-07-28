import { useEffect, useState } from 'react';
import api from '../../../../api/axios';
import { Package, TrendingUp, Sparkles } from 'lucide-react';

interface PackageStat {
  name: string;
  count: number;
}

export function TopPackagesChart() {
  const [data, setData] = useState<PackageStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPackages();
  }, []);

  const fetchTopPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/top-packages');
      setData(res.data || []);
    } catch (error) {
      console.error('Error fetching top packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = data.length > 0 ? Math.max(...data.map(d => Number(d.count || 0)), 1) : 1;

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:border-teal-500/30 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Package size={20} className="text-teal-600 dark:text-teal-400 shrink-0" />
              Top 5 Gói Dịch Vụ Ưa Chuộng
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Xếp hạng liệu trình &amp; dịch vụ được chỉ định nhiều nhất · 12 tháng gần nhất
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0 shadow-sm">
            <TrendingUp size={18} />
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-xs font-bold animate-pulse text-center py-16">
            Đang tải xếp hạng gói dịch vụ...
          </div>
        ) : data.length === 0 ? (
          <div className="text-slate-400 text-xs italic text-center py-16 font-bold">
            Chưa ghi nhận dữ liệu sử dụng gói.
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.slice(0, 5).map((pkg, idx) => {
              const rank = idx + 1;
              const count = Number(pkg.count || 0);
              const percent = Math.max(Math.round((count / maxCount) * 100), 12);

              const rankBg = 
                rank === 1 
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                  : rank === 2 
                    ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30' 
                    : rank === 3 
                      ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60';

              const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <div
                  key={pkg.name + idx}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-teal-50/40 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 transition-all duration-300 hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`size-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${rankBg}`}>
                        {rankIcon}
                      </span>
                      <span
                        title={pkg.name}
                        className="font-extrabold text-slate-900 dark:text-white text-xs md:text-sm leading-snug truncate"
                      >
                        {pkg.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 px-3 py-1 rounded-xl text-teal-700 dark:text-teal-300 shadow-sm">
                      <Sparkles size={12} className="text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="font-black text-xs md:text-sm">{count}</span>
                      <span className="text-[10px] font-bold text-teal-600/90 dark:text-teal-400/90">lượt</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200/70 dark:bg-slate-700/70 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        rank === 1 
                          ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 shadow-sm' 
                          : rank === 2 
                            ? 'bg-gradient-to-r from-teal-400 to-teal-600 shadow-sm' 
                            : 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

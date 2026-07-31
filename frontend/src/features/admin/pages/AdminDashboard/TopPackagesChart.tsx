import { useEffect, useState, useMemo } from 'react';
import api from '../../../../api/axios';
import { Package, TrendingUp, Sparkles, PieChart, BarChart3, Award } from 'lucide-react';

interface PackageStat {
  name: string;
  count: number;
}

const PALETTE = [
  { stroke: '#0D9488', fill: 'rgba(13, 148, 136, 0.15)', text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-teal-200 dark:border-teal-800' },
  { stroke: '#6366F1', fill: 'rgba(99, 102, 241, 0.15)', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-800' },
  { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.15)', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-200 dark:border-emerald-800' },
  { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-800' },
  { stroke: '#8B5CF6', fill: 'rgba(139, 92, 246, 0.15)', text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/50', border: 'border-violet-200 dark:border-violet-800' },
];

export function TopPackagesChart() {
  const [data, setData] = useState<PackageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'donut' | 'bar'>('donut');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const totalSessions = useMemo(() => {
    return data.reduce((acc, curr) => acc + Number(curr.count || 0), 0);
  }, [data]);

  const maxCount = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map(d => Number(d.count || 0)), 1) : 1;
  }, [data]);

  // Generate SVG Donut Segments
  const donutSegments = useMemo(() => {
    if (totalSessions === 0) return [];
    let cumulativePercent = 0;

    return data.slice(0, 5).map((pkg, idx) => {
      const count = Number(pkg.count || 0);
      const percent = count / totalSessions;
      const startAngle = cumulativePercent * 360;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 360;

      return {
        pkg,
        count,
        percent: Math.round(percent * 100),
        startAngle,
        endAngle,
        color: PALETTE[idx % PALETTE.length]
      };
    });
  }, [data, totalSessions]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:border-teal-500/30">
      
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Package size={20} />
            </div>
            Top Gói Dịch Vụ Phổ Biến Nhất
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Phân tích tỷ trọng lượt thực hiện gói dịch vụ &amp; liệu trình chuyên sâu
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'donut'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChart size={14} />
              <span>Biểu Đồ Tròn</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'bar'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span>Thanh Tỷ Trọng</span>
            </button>
          </div>

          <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0 shadow-sm hidden sm:block">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-xs font-bold animate-pulse text-center py-20">
          Đang tải biểu đồ phân tích gói dịch vụ...
        </div>
      ) : data.length === 0 ? (
        <div className="text-slate-400 text-xs italic text-center py-20 font-bold">
          Chưa ghi nhận dữ liệu sử dụng gói dịch vụ.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Visual Interactive Chart (Donut SVG or Bar Visual) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50/70 dark:bg-slate-800/40 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>

            {activeTab === 'donut' ? (
              <div className="relative w-56 h-56 flex items-center justify-center">
                {/* SVG Donut Chart */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {donutSegments.map((seg, idx) => {
                    const strokeDasharray = `${seg.percent} ${100 - seg.percent}`;
                    const strokeDashoffset = -donutSegments
                      .slice(0, idx)
                      .reduce((sum, s) => sum + s.percent, 0);

                    const isHovered = hoveredIndex === idx;

                    return (
                      <circle
                        key={seg.pkg.name + idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={seg.color.stroke}
                        strokeWidth={isHovered ? 18 : 14}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength={100}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  })}
                </svg>

                {/* Inner Donut Stats Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TỔNG LƯỢT</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {hoveredIndex !== null ? donutSegments[hoveredIndex]?.count : totalSessions}
                  </span>
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                    {hoveredIndex !== null ? donutSegments[hoveredIndex]?.pkg.name.slice(0, 18) + '...' : 'lượt chỉ định'}
                  </span>
                </div>
              </div>
            ) : (
              /* Bar Visual Mode */
              <div className="w-full space-y-4 py-4">
                <div className="text-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SO SÁNH QUY MÔ DỊCH VỤ</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">Xếp hạng mức độ ưa chuộng</p>
                </div>
                {data.slice(0, 5).map((pkg, idx) => {
                  const count = Number(pkg.count || 0);
                  const percent = Math.max(Math.round((count / maxCount) * 100), 10);
                  const color = PALETTE[idx % PALETTE.length];

                  return (
                    <div key={pkg.name + idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{pkg.name}</span>
                        <span className={color.text}>{count} lượt ({Math.round((count / totalSessions) * 100)}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${percent}%`, backgroundColor: color.stroke }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 w-full text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" />
                Dữ liệu thời gian thực được đồng bộ tự động từ CSDL
              </span>
            </div>
          </div>

          {/* Right Column: High-End Package Breakdown Cards */}
          <div className="lg:col-span-7 space-y-3">
            {data.slice(0, 5).map((pkg, idx) => {
              const rank = idx + 1;
              const count = Number(pkg.count || 0);
              const percent = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
              const color = PALETTE[idx % PALETTE.length];
              const isHovered = hoveredIndex === idx;

              const rankBadge =
                rank === 1
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : rank === 2
                  ? 'bg-slate-400 text-white shadow-md shadow-slate-400/20'
                  : rank === 3
                  ? 'bg-amber-700 text-white shadow-md shadow-amber-700/20'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

              const rankSymbol = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <div
                  key={pkg.name + idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isHovered
                      ? `${color.bg} ${color.border} shadow-lg scale-[1.01]`
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${rankBadge}`}>
                        {rankSymbol}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-xs md:text-sm truncate">
                            {pkg.name}
                          </h4>
                          {rank === 1 && (
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0 hidden sm:inline-block">
                              Best Seller
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400">
                          <span>Chiếm <strong className={color.text}>{percent}%</strong> tổng chỉ định</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Award size={11} className="text-teal-500" />
                            Ưa chuộng cao
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`px-3 py-1.5 rounded-xl border font-black text-xs md:text-sm flex items-center gap-1.5 ${color.bg} ${color.border} ${color.text}`}>
                        <span>{count}</span>
                        <span className="text-[10px] font-extrabold opacity-80">lượt</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Progress Line */}
                  <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden mt-3 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${percent}%`, backgroundColor: color.stroke }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

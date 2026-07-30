import { useMemo } from 'react';
import { Award, Star, CheckCircle2, Activity, Zap } from 'lucide-react';

interface StaffPerformanceProps {
  name: string;
  avatar?: string;
  role?: string;
  sessions: number;
}

interface StaffPerformanceGridProps {
  performanceData: StaffPerformanceProps[];
}

const numberFormatter = new Intl.NumberFormat('vi-VN');

export function StaffPerformanceGrid({ performanceData }: StaffPerformanceGridProps) {
  const maxSessions = useMemo(() => {
    return performanceData.length > 0
      ? Math.max(...performanceData.map((s) => Number(s.sessions || 0)), 1)
      : 1;
  }, [performanceData]);

  const totalSessions = useMemo(() => {
    return performanceData.reduce((sum, s) => sum + Number(s.sessions || 0), 0);
  }, [performanceData]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 md:p-7 rounded-[32px] border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/30 dark:shadow-none transition-all duration-300 hover:border-teal-500/30 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm">
              <Award className="animate-bounce" size={20} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Top Nhân Sự Hoàn Thành Ca
                <Zap size={14} className="text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Bác sĩ &amp; KTV có lượt phục hồi chức năng xuất sắc nhất
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800/60 shrink-0">
            Hiệu Suất Cao
          </span>
        </div>

        {/* Content Rows */}
        {performanceData.length === 0 ? (
          <div className="text-slate-400 text-xs italic text-center py-16 font-bold">
            Chưa ghi nhận ca hoàn thành trong kỳ báo cáo.
          </div>
        ) : (
          <div className="space-y-3">
            {performanceData.slice(0, 5).map((staff, idx) => {
              const rank = idx + 1;
              const sessions = Number(staff.sessions || 0);
              const percent = Math.max(Math.round((sessions / maxSessions) * 100), 12);

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
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500';

              const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <div
                  key={staff.name + idx}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-teal-50/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700/60 group"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${rankBadge}`}>
                        {rankIcon}
                      </span>

                      {/* Avatar with Verified Badge */}
                      <div className="relative shrink-0">
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center border border-teal-500/30">
                            {staff.name ? staff.name.charAt(0).toUpperCase() : 'N'}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                          <CheckCircle2 size={8} />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-900 dark:text-white text-xs md:text-sm truncate">
                            {staff.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-0.5">
                          <span>{staff.role || 'Kỹ thuật viên'}</span>
                          <span>•</span>
                          <span className="flex items-center text-amber-500 font-black">
                            <Star size={9} className="fill-amber-500 mr-0.5" />
                            5.0
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 font-black text-xs md:text-sm flex items-center gap-1">
                        <Activity size={12} className="text-teal-600 dark:text-teal-400" />
                        <span>{numberFormatter.format(sessions)}</span>
                        <span className="text-[10px] font-bold opacity-80">ca</span>
                      </div>
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
      {performanceData.length > 0 && (
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Tổng ca hoàn thành trong kỳ:</span>
          <span className="font-black text-teal-600 dark:text-teal-400 text-sm">
            {numberFormatter.format(totalSessions)} ca
          </span>
        </div>
      )}
    </div>
  );
}

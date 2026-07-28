import { Award, Star } from 'lucide-react';

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
  const maxSessions = performanceData.reduce((max, s) => Math.max(max, Number(s.sessions || 0)), 1);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:border-teal-500/30">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Award className="text-amber-500 shrink-0" size={20} />
            Top 5 Nhân Sự Hoàn Thành Ca
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Bác sĩ &amp; KTV có lượt phục hồi thành công cao nhất · Tháng này
          </p>
        </div>
      </div>
      
      <div className="space-y-3.5">
        {performanceData.length === 0 ? (
          <p className="text-slate-400 text-xs italic text-center py-12 font-bold">Chưa ghi nhận ca hoàn thành.</p>
        ) : (
          performanceData.slice(0, 5).map((staff, idx) => {
            const rank = idx + 1;
            const sessions = Number(staff.sessions || 0);
            // Ensure small session numbers remain visible with min 12% width
            const rawProgress = (sessions / maxSessions) * 100;
            const progress = Math.max(Math.round(rawProgress), 12);
            
            const rankBg = 
              rank === 1 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : rank === 2 
                  ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' 
                  : rank === 3 
                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500';
            
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

            return (
              <div 
                key={staff.name + idx} 
                className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all duration-300 flex items-center gap-3.5 group"
              >
                {/* Rank Badge */}
                <div className={`size-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${rankBg}`}>
                  {rankIcon}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  {staff.avatar ? (
                    <img 
                      src={staff.avatar} 
                      alt={staff.name} 
                      className="size-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" 
                    />
                  ) : (
                    <div className="size-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-xs">
                      {staff.name?.charAt(0) || '👤'}
                    </div>
                  )}
                  {rank === 1 && (
                    <span className="absolute -top-1 -right-1 size-4 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md border border-white dark:border-slate-900">
                      <Star size={8} className="fill-white stroke-none" />
                    </span>
                  )}
                </div>

                {/* Info & Progress bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{staff.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {staff.role || 'Kỹ thuật viên'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 dark:text-white text-xs">{numberFormatter.format(sessions)}</span>
                      <span className="text-[10px] text-slate-400 font-semibold ml-1">ca</span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        rank === 1 
                          ? 'bg-amber-500' 
                          : rank === 2 
                            ? 'bg-teal-500' 
                            : rank === 3 
                              ? 'bg-orange-400' 
                              : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

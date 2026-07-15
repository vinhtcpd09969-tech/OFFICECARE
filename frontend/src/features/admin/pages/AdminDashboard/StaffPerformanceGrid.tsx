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

export function StaffPerformanceGrid({ performanceData }: StaffPerformanceGridProps) {
  // Find maximum sessions to scale the progress bars
  const maxSessions = performanceData.reduce((max, s) => Math.max(max, s.sessions), 1);

  return (
    <div 
      className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui opacity-0 animate-slide-up"
      style={{ animationDelay: '400ms' }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-secondary flex items-center gap-2">
            <Award className="text-amber-500 shrink-0" size={20} />
            Top 5 Nhân Sự Hoàn Thành Ca
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
            Chuyên gia và KTV có số ca phục hồi thành công nhiều nhất tháng này
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        {performanceData.length === 0 ? (
          <p className="text-zinc-400 text-xs italic text-center py-12 font-bold">Chưa ghi nhận ca hoàn thành.</p>
        ) : (
          performanceData.map((staff, idx) => {
            const rank = idx + 1;
            const progress = (staff.sessions / maxSessions) * 100;
            
            // Medals & background styling based on rank
            const rankBg = 
              rank === 1 
                ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                : rank === 2 
                  ? 'bg-slate-50 text-slate-500 border border-slate-200' 
                  : rank === 3 
                    ? 'bg-orange-50/50 text-orange-600 border border-orange-200/50' 
                    : 'bg-zinc-50 text-zinc-400';
            
            const rankIcon = 
              rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

            return (
              <div 
                key={staff.name} 
                className="p-4 rounded-2xl bg-zinc-50/30 hover:bg-zinc-50/60 border border-zinc-100/50 hover:border-zinc-200/80 transition-all duration-300 flex items-center gap-4 group"
              >
                {/* Rank Badge */}
                <div className={`size-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm ${rankBg}`}>
                  {rankIcon}
                </div>

                {/* Avatar */}
                <div className="relative shrink-0">
                  {staff.avatar ? (
                    <img 
                      src={staff.avatar} 
                      alt={staff.name} 
                      className="size-11 rounded-xl object-cover border border-zinc-200" 
                    />
                  ) : (
                    <div className="size-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-650 font-black text-xs">
                      {staff.name?.charAt(0) || '👤'}
                    </div>
                  )}
                  {rank === 1 && (
                    <span className="absolute -top-1.5 -right-1.5 size-5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md animate-bounce scale-90 border border-white">
                      <Star size={10} className="fill-white stroke-none" />
                    </span>
                  )}
                </div>

                {/* Info & Progress bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-extrabold text-secondary text-xs truncate">{staff.name}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                        {staff.role || 'Kỹ thuật viên'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-secondary text-sm">{staff.sessions}</span>
                      <span className="text-[9px] text-zinc-400 font-bold ml-1">ca xong</span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        rank === 1 
                          ? 'bg-amber-500' 
                          : rank === 2 
                            ? 'bg-slate-400' 
                            : rank === 3 
                              ? 'bg-orange-400' 
                              : 'bg-teal-500'
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

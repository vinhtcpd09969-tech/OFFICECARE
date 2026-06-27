import { AlertTriangle, CheckCircle2, PieChart } from 'lucide-react';

interface Conflict {
  id: string;
  name: string;
  dowLabel: string;
  dateStr: string;
  time1: string;
  time2: string;
}

interface WeeklyStat {
  name: string;
  role: string;
  morning: number;
  afternoon: number;
  off: number;
}

interface SchedulesSidebarProps {
  conflicts: Conflict[];
  weeklyStatsByStaff: Record<string, WeeklyStat[]>;
  onOpenModal: (userId: string, dateStr?: string) => void;
}

export function SchedulesSidebar({
  conflicts,
  weeklyStatsByStaff,
  onOpenModal
}: SchedulesSidebarProps) {
  return (
    <div className="w-full xl:w-[320px] shrink-0 space-y-6">
      {/* Conflict Sidebar */}
      <div className="bg-rose-50/40 rounded-[24px] p-6 border border-rose-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="text-rose-600" size={20} />
          <h3 className="font-heading font-bold text-lg text-rose-900">Xung đột lịch trình</h3>
        </div>
        
        {conflicts.length > 0 ? (
          <div className="space-y-4">
            {conflicts.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-rose-100 relative group transition-all hover:shadow-md">
                <p className="text-sm font-medium text-gray-800 mb-1 leading-relaxed">
                  <span className="font-bold">{c.name}</span> đang được phân công trùng giờ vào <span className="font-bold">{c.dowLabel}</span>.
                </p>
                <p className="text-xs text-rose-600 font-bold mb-3 bg-rose-50 w-fit px-2 py-0.5 rounded-md">({c.time1} - {c.time2})</p>
                <button 
                  onClick={() => onOpenModal(c.id, c.dateStr)} 
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 underline transition-colors"
                >
                  Xem chi tiết & Chỉnh sửa
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100 text-center select-none">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-bold text-emerald-800">Không có xung đột nào.</p>
            <p className="text-xs text-emerald-600/70 mt-1 font-medium">Lịch trình đang được tối ưu.</p>
          </div>
        )}
      </div>

      {/* Weekly Stats Panel */}
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-left">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="text-teal-600" size={20} />
          <h3 className="font-heading font-bold text-lg text-gray-800">Thống kê ca tuần</h3>
        </div>
        <p className="text-xs text-gray-400 font-medium mb-4">
          Số ca làm việc thực tế trong tuần đang xem.
        </p>
        
        <div className="space-y-4">
          {['Bác sĩ', 'Lễ tân', 'Kỹ thuật viên'].map(role => {
            const roleStats = weeklyStatsByStaff[role];
            if (!roleStats || roleStats.length === 0) return null;
            return (
              <div key={role} className="space-y-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">{role}</h4>
                <div className="space-y-2">
                  {roleStats.map(st => (
                    <div key={st.name} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700 truncate max-w-[130px]">{st.name}</span>
                      <div className="flex gap-1.5 shrink-0 select-none">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold" title="Ca sáng">
                          S: {st.morning}
                        </span>
                        <span className="bg-cyan-50 text-cyan-700 border border-cyan-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold" title="Ca chiều">
                          C: {st.afternoon}
                        </span>
                        <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold" title="Nghỉ">
                          N: {st.off}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default SchedulesSidebar;

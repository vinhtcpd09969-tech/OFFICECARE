import { User, Calendar as CalendarIcon, PieChart } from 'lucide-react';

interface Stats {
  activeToday: number;
  emptyShifts: number;
  coverage: number;
}

interface SchedulesKpisProps {
  stats: Stats;
}

export function SchedulesKpis({ stats }: SchedulesKpisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
          <User size={28} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nhân sự trong ngày</p>
          <h3 className="text-3xl font-heading font-bold text-gray-800">{stats.activeToday}</h3>
        </div>
      </div>
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <CalendarIcon size={28} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ca trống cần lắp</p>
          <h3 className="text-3xl font-heading font-bold text-gray-800">{stats.emptyShifts}</h3>
        </div>
      </div>
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <PieChart size={28} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tỷ lệ phủ kín</p>
          <h3 className="text-3xl font-heading font-bold text-gray-800">{stats.coverage}%</h3>
        </div>
      </div>
    </div>
  );
}
export default SchedulesKpis;

interface SchedulesHeaderProps {
  selectedWeek: 'current' | 'next' | 'after_next';
  onSelectWeek: (week: 'current' | 'next' | 'after_next') => void;
  roleFilter: string;
  onRoleFilterChange: (val: string) => void;
}

export function SchedulesHeader({
  selectedWeek,
  onSelectWeek,
  roleFilter,
  onRoleFilterChange
}: SchedulesHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 select-none">
      <div className="flex flex-col text-left">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
          Bảng phân ca làm việc
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Quản lý lịch trực, phòng khám và trạng thái nghỉ phép của nhân sự
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Highlighted Calendar Selector */}
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-150 p-1 items-center">
          <button 
            type="button"
            onClick={() => onSelectWeek('current')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              selectedWeek === 'current' 
                ? 'bg-[#0d9488] text-white shadow-sm scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${selectedWeek === 'current' ? 'bg-white animate-pulse' : 'bg-teal-500'}`} />
              Tuần này
            </span>
          </button>
          
          <button 
            type="button"
            onClick={() => onSelectWeek('next')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              selectedWeek === 'next' 
                ? 'bg-[#0d9488] text-white shadow-sm scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tuần sau
          </button>

          <button 
            type="button"
            onClick={() => onSelectWeek('after_next')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              selectedWeek === 'after_next' 
                ? 'bg-[#0d9488] text-white shadow-sm scale-[1.02]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tuần sau nữa
          </button>
        </div>

        <select 
          value={roleFilter} 
          onChange={e => onRoleFilterChange(e.target.value)} 
          className="bg-white border border-gray-200 text-xs font-black uppercase tracking-wider rounded-xl px-4 py-2 text-gray-700 outline-none focus:border-teal-500 shadow-sm"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="Bác sĩ">Bác sĩ</option>
          <option value="Lễ tân">Lễ tân</option>
          <option value="Kỹ thuật viên">Kỹ thuật viên</option>
        </select>
      </div>
    </div>
  );
}
export default SchedulesHeader;

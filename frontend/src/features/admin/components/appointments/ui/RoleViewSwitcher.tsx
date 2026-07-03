import { Briefcase, Calendar as CalendarIcon, Stethoscope, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { RoleView, ReceptionistTab, Staff } from '../types';

interface RoleViewSwitcherProps {
  roleView: RoleView;
  setRoleView: (role: RoleView) => void;
  setReceptionistTab?: (tab: ReceptionistTab) => void;
  selectedDocSimId: string;
  setSelectedDocSimId: (id: string) => void;
  staffList: Staff[];
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
}

export function RoleViewSwitcher({
  roleView,
  setRoleView,
  setReceptionistTab,
  selectedDocSimId,
  setSelectedDocSimId,
  staffList,
  isDemoMode,
  setIsDemoMode
}: RoleViewSwitcherProps) {
  return (
    <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-100 dark:border-zinc-850 p-4 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm mb-4 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 select-none w-full lg:w-auto">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#0D9488]/10 text-[#0D9488] rounded-xl border border-[#0D9488]/15">
            <Sparkles size={14} className="animate-pulse" />
          </span>
          <span className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            CHẾ ĐỘ XEM VAI TRÒ (ADMIN TEST)
          </span>
        </div>
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
        
        {/* Toggle Chế độ mô phỏng */}
        <button
          onClick={() => {
            setIsDemoMode(!isDemoMode);
            toast.success(!isDemoMode ? 'Đã kích hoạt Chế độ Mô phỏng Dữ liệu!' : 'Đã tắt Chế độ Mô phỏng, đang dùng dữ liệu thực từ cơ sở dữ liệu.');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${
            isDemoMode
              ? 'bg-[#0D9488]/10 border-[#0D9488]/20 text-[#0D9488] shadow-[0_0_12px_rgba(13,148,136,0.1)]'
              : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200/50 dark:border-zinc-800 text-slate-400 dark:text-zinc-500'
          }`}
        >
          <span className={`size-1.5 rounded-full ${isDemoMode ? 'bg-[#0D9488] animate-ping' : 'bg-slate-400'}`} />
          <span>Mô phỏng dữ liệu mẫu: {isDemoMode ? 'BẬT' : 'TẮT'}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 w-full lg:w-auto">
        {/* Button group */}
        <div className="flex bg-slate-50 dark:bg-zinc-950/40 p-1 rounded-2xl border border-slate-200/40 dark:border-zinc-800/50 select-none">
          <button
            onClick={() => {
              setRoleView('manager');
              toast.success('Đã chuyển sang chế độ Quản lý / Admin');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              roleView === 'manager'
                ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/10'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Briefcase size={13} /> Quản lý
          </button>
          <button
            onClick={() => {
              setRoleView('receptionist');
              setReceptionistTab?.('pending_contact');
              toast.success('Đã chuyển sang chế độ Lễ tân');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              roleView === 'receptionist'
                ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/10'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarIcon size={13} /> Lễ tân
          </button>
          <button
            onClick={() => {
              setRoleView('doctor');
              toast.success('Đã chuyển sang chế độ Bác sĩ');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              roleView === 'doctor'
                ? 'bg-[#0D9488] text-white shadow-md shadow-[#0D9488]/10'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Stethoscope size={13} /> Bác sĩ
          </button>
        </div>

        {/* Doctor selector dropdown when in doctor view */}
        {roleView === 'doctor' && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-200">
            <span className="text-[10px] font-bold text-slate-550 dark:text-zinc-400 uppercase tracking-wider select-none">Bác sĩ:</span>
            <select
              value={selectedDocSimId}
              onChange={(e) => {
                setSelectedDocSimId(e.target.value);
                const docObj = staffList.find(s => String(s.id) === String(e.target.value));
                if (docObj) {
                  toast.success(`Đang mô phỏng lịch của BS. ${docObj.ho_ten}`);
                }
              }}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            >
              {staffList
                .filter(s => s.vai_tro === 'Bác sĩ')
                .map(doc => (
                  <option key={doc.id} value={String(doc.id)}>
                    BS. {doc.ho_ten}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}


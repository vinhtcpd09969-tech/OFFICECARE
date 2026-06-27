import { ReceptionistTab } from '../types';

interface ReceptionistTabsProps {
  isReceptionist: boolean;
  receptionistTab: ReceptionistTab;
  setReceptionistTab: (tab: ReceptionistTab) => void;
  unconfirmedCount: number;
  todayCount: number;
}

export function ReceptionistTabs({
  isReceptionist,
  receptionistTab,
  setReceptionistTab,
  unconfirmedCount,
  todayCount
}: ReceptionistTabsProps) {
  if (!isReceptionist) return null;

  return (
    <div className="flex bg-slate-100 dark:bg-zinc-800/40 p-1 rounded-2xl border border-slate-200/50 dark:border-zinc-800/85 max-w-lg mb-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
      <button
        onClick={() => setReceptionistTab('pending_contact')}
        className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-extrabold rounded-xl transition-all ${
          receptionistTab === 'pending_contact'
            ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-455 shadow-sm border border-slate-200/30 dark:border-zinc-600/30'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
        }`}
      >
        📞 Ca khám mới chờ liên hệ
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border transition-all duration-300 ${
          unconfirmedCount > 0 
            ? 'bg-amber-500 text-white border-amber-600 animate-bounce' 
            : 'bg-amber-100 dark:bg-amber-955/40 text-amber-700 dark:text-amber-450 border-amber-200/20 dark:border-amber-900/10'
        }`}>
          {unconfirmedCount}
        </span>
      </button>
      <button
        onClick={() => setReceptionistTab('today_schedule')}
        className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-extrabold rounded-xl transition-all ${
          receptionistTab === 'today_schedule'
            ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-455 shadow-sm border border-slate-200/30 dark:border-zinc-600/30'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
        }`}
      >
        🗓️ Lịch trình hôm nay
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-955/40 text-emerald-700 dark:text-emerald-455 border border-emerald-250/20 dark:border-emerald-900/10">
          {todayCount}
        </span>
      </button>
    </div>
  );
}

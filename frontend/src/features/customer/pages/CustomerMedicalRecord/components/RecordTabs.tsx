import { HeartPulse, Sparkles, FileText } from 'lucide-react';
import type { RecordTab } from '../types';

interface RecordTabsProps {
  activeTab: RecordTab;
  goiCount: number;
  leCount: number;
  khamCount: number;
  onChange: (tab: RecordTab) => void;
}

export function RecordTabs({ activeTab, goiCount, leCount, khamCount, onChange }: RecordTabsProps) {
  const tabClass = (tab: RecordTab) =>
    `px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2.5 cursor-pointer select-none ${
      activeTab === tab
        ? 'bg-white text-[#0D9488] shadow-md shadow-teal-500/10 border border-teal-500/20 scale-[1.02]'
        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
    }`;

  return (
    <div className="flex bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-slate-200/60 shadow-xs overflow-x-auto">
      <button type="button" onClick={() => onChange('goi')} className={tabClass('goi')}>
        <HeartPulse size={15} className={activeTab === 'goi' ? 'text-[#0D9488]' : 'text-slate-400'} />
        <span>Gói liệu trình</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${activeTab === 'goi' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-slate-200/70 text-slate-600'}`}>
          {goiCount}
        </span>
      </button>

      <button type="button" onClick={() => onChange('le')} className={tabClass('le')}>
        <Sparkles size={15} className={activeTab === 'le' ? 'text-[#0D9488]' : 'text-slate-400'} />
        <span>Dịch vụ lẻ</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${activeTab === 'le' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-slate-200/70 text-slate-600'}`}>
          {leCount}
        </span>
      </button>

      <button type="button" onClick={() => onChange('kham')} className={tabClass('kham')}>
        <FileText size={15} className={activeTab === 'kham' ? 'text-[#0D9488]' : 'text-slate-400'} />
        <span>Khám lâm sàng</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${activeTab === 'kham' ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-slate-200/70 text-slate-600'}`}>
          {khamCount}
        </span>
      </button>
    </div>
  );
}

export default RecordTabs;

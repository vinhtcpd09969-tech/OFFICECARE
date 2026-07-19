import { HeartPulse, Sparkles, FileText } from 'lucide-react';
import type { RecordTab } from '../types';

interface RecordTabsProps {
  activeTab: RecordTab;
  goiCount: number;
  leCount: number;
  khamCount: number;
  onChange: (tab: RecordTab) => void;
}

// Segmented control đồng bộ pattern đã dùng ở FinanceTabs.tsx (Admin) — thay 3 nút pill to/nhỏ
// không đồng bộ của bản cũ.
export function RecordTabs({ activeTab, goiCount, leCount, khamCount, onChange }: RecordTabsProps) {
  const tabClass = (tab: RecordTab) =>
    `px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${activeTab === tab
      ? 'bg-white text-primary shadow-xs border border-zinc-200/20 scale-[1.02]'
      : 'text-zinc-500 hover:text-zinc-700'
    }`;

  return (
    <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-fit shadow-inner overflow-x-auto">
      <button type="button" onClick={() => onChange('goi')} className={tabClass('goi')}>
        <HeartPulse size={14} /> Gói liệu trình ({goiCount})
      </button>
      <button type="button" onClick={() => onChange('le')} className={tabClass('le')}>
        <Sparkles size={14} /> Dịch vụ lẻ ({leCount})
      </button>
      <button type="button" onClick={() => onChange('kham')} className={tabClass('kham')}>
        <FileText size={14} /> Khám lâm sàng ({khamCount})
      </button>
    </div>
  );
}

export default RecordTabs;

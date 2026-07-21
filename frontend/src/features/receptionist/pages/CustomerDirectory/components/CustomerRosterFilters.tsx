import { Search, Bell } from 'lucide-react';
import type { TrangThaiGoiFilter } from '../types';

interface CustomerRosterFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  trangThaiGoi: TrangThaiGoiFilter;
  onTrangThaiGoiChange: (value: TrangThaiGoiFilter) => void;
  canLienHe: boolean;
  onToggleCanLienHe: () => void;
  staleDays: number;
  onStaleDaysChange: (value: number) => void;
}

const STATUS_OPTIONS: { value: TrangThaiGoiFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái gói' },
  { value: 'dang_dieu_tri', label: 'Đang điều trị' },
  { value: 'cho_kich_hoat', label: 'Chờ kích hoạt' },
  { value: 'hoan_thanh', label: 'Đã hoàn thành' },
  { value: 'khong_co_goi', label: 'Không có gói' },
];

export function CustomerRosterFilters({
  searchInput,
  onSearchChange,
  trangThaiGoi,
  onTrangThaiGoiChange,
  canLienHe,
  onToggleCanLienHe,
  staleDays,
  onStaleDaysChange,
}: CustomerRosterFiltersProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-4 lg:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, mã khách hàng…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 text-slate-850 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all placeholder-slate-400"
          />
        </div>

        <select
          value={trangThaiGoi}
          onChange={(e) => onTrangThaiGoiChange(e.target.value as TrangThaiGoiFilter)}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer shrink-0"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleCanLienHe}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border ${
              canLienHe
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell size={13} />
            Cần liên hệ lại
          </button>

          <select
            value={staleDays}
            onChange={(e) => onStaleDaysChange(Number(e.target.value))}
            disabled={!canLienHe}
            title="Số ngày kể từ buổi hoàn thành gần nhất"
            className="px-2.5 py-2.5 bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value={3}>≥ 3 ngày</option>
            <option value={5}>≥ 5 ngày</option>
            <option value={7}>≥ 7 ngày</option>
          </select>
        </div>
      </div>
    </div>
  );
}

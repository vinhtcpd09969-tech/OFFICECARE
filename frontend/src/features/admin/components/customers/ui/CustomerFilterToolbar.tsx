import { useState, useRef, useEffect } from 'react';
import { Search, Lock, X, ChevronDown, Filter } from 'lucide-react';
import { REPUTATION_TIER_OPTIONS } from '../constants';
import type { ReputationTier } from '../types';

interface CustomerFilterToolbarProps {
  repTier: ReputationTier | 'all';
  onRepTierChange: (tier: ReputationTier | 'all') => void;
  search: string;
  onSearchChange: (value: string) => void;
  showLockedOnly: boolean;
  onToggleLockedOnly: () => void;
}

const REP_SWATCH: Record<string, string> = {
  all: '#94A3B8',
  low: '#F43F5E',
  mid: '#F59E0B',
  high: '#10B981'
};

export function CustomerFilterToolbar({
  repTier, onRepTierChange, search, onSearchChange, showLockedOnly, onToggleLockedOnly
}: CustomerFilterToolbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeLabel = REPUTATION_TIER_OPTIONS.find(o => o.value === repTier)?.label || 'Tất cả';

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-jakarta">
      
      {/* Search Input */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, số điện thoại, email hoặc mã khách hàng…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-semibold outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Reputation Tier Dropdown */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2.5 px-4 py-3 bg-white/90 dark:bg-slate-900/90 border rounded-2xl text-xs font-extrabold transition-all shadow-sm cursor-pointer ${
            open
              ? 'border-teal-500 ring-2 ring-teal-500/15'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          <Filter size={14} className="text-teal-600 dark:text-teal-400" />
          <span>Điểm uy tín:</span>
          <span className="text-slate-500 dark:text-slate-400 font-bold">{activeLabel}</span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-[calc(100%+8px)] right-0 z-30 rounded-2xl p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl min-w-[210px] animate-scale-up">
            {REPUTATION_TIER_OPTIONS.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onRepTierChange(opt.value as ReputationTier | 'all'); setOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                  repTier === opt.value
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: REP_SWATCH[opt.value] }} />
                <span>{opt.value === 'all' ? 'Tất cả mức độ' : opt.value === 'low' ? 'Cần chú ý (0–40)' : opt.value === 'mid' ? 'Trung bình (41–70)' : 'Đáng tin cậy (71–100)'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Accounts Toggle Button */}
      <button
        type="button"
        onClick={onToggleLockedOnly}
        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all shrink-0 cursor-pointer shadow-sm ${
          showLockedOnly
            ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/10'
            : 'bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <Lock size={14} className={showLockedOnly ? 'text-rose-600' : 'text-slate-400'} />
        <span>Tài khoản bị khóa</span>
        {showLockedOnly && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggleLockedOnly();
            }}
            title="Bỏ lọc tài khoản bị khóa"
            className="ml-1 size-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center transition-all cursor-pointer hover:bg-rose-300"
          >
            <X size={10} className="stroke-[3]" />
          </span>
        )}
      </button>
    </div>
  );
}

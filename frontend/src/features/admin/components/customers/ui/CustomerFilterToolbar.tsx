import { useState, useRef, useEffect } from 'react';
import { Search, Lock } from 'lucide-react';
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
  all: 'var(--rc-taupe)',
  low: 'var(--rc-rust)',
  mid: 'var(--rc-amber)',
  high: 'var(--rc-sage)'
};

// Thay hàng "UY TÍN:" 4 nút luôn hiện bằng 1 dropdown gọn — không phải trục chính của trang (đó là
// hành trình điều trị trên "Đường cong Phục hồi" phía trên), nên không cần chiếm chỗ ngang hàng.
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
    <div className="recovery-arc-scope flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--rc-taupe)' }} />
        <input
          type="text"
          placeholder="Tìm theo tên, số điện thoại, email hoặc mã khách hàng…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2.5 rounded-[9px] text-[13px] outline-none transition-all"
          style={{ background: 'var(--rc-card)', border: '1px solid var(--rc-line)', color: 'var(--rc-ink)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--rc-clay)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--rc-line)'; }}
        />
      </div>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[9px] text-[12.5px] font-semibold transition-all"
          style={{ background: 'var(--rc-card)', border: `1px solid ${open ? 'var(--rc-clay)' : 'var(--rc-line)'}`, color: 'var(--rc-ink)' }}
        >
          <span className="relative shrink-0 overflow-hidden" style={{ width: 30, height: 16 }}>
            <span
              className="absolute top-0 left-0 rounded-full"
              style={{ width: 30, height: 30, background: `conic-gradient(from 180deg, ${REP_SWATCH[repTier]} 0deg 180deg, var(--rc-track) 0deg)` }}
            />
            <span className="absolute rounded-full" style={{ top: 4, left: 4, width: 22, height: 22, background: 'var(--rc-card)' }} />
          </span>
          Điểm uy tín <span style={{ color: 'var(--rc-taupe)', fontWeight: 500 }}>— {activeLabel}</span>
        </button>

        {open && (
          <div
            className="absolute top-[calc(100%+8px)] right-0 z-20 rounded-[14px] p-2 shadow-lg"
            style={{ background: 'var(--rc-card)', border: '1px solid var(--rc-line)', minWidth: 190 }}
          >
            {REPUTATION_TIER_OPTIONS.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onRepTierChange(opt.value as ReputationTier | 'all'); setOpen(false); }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[12.5px] font-semibold transition-colors"
                style={{
                  background: repTier === opt.value ? 'var(--rc-clay-soft)' : 'transparent',
                  color: repTier === opt.value ? 'var(--rc-clay)' : 'var(--rc-ink)'
                }}
              >
                <span className="size-2 rounded-full shrink-0" style={{ background: REP_SWATCH[opt.value] }} />
                {opt.value === 'all' ? 'Tất cả mức độ' : opt.value === 'low' ? 'Cần chú ý (0–40)' : opt.value === 'mid' ? 'Trung bình (41–70)' : 'Đáng tin cậy (71–100)'}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleLockedOnly}
        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[9px] text-[12.5px] font-bold transition-all shrink-0"
        style={
          showLockedOnly
            ? { background: 'var(--rc-rust-soft)', border: '1px solid var(--rc-rust)', color: 'var(--rc-rust)' }
            : { background: 'var(--rc-card)', border: '1px solid var(--rc-line)', color: 'var(--rc-taupe)' }
        }
      >
        <Lock size={13} />
        Tài khoản bị khóa
      </button>
    </div>
  );
}

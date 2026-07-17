import { FileSearch } from 'lucide-react';
import { TIER_META } from '../../constants';
import type { PrimaryStatus } from '../../types';

const TIER_STYLE: Record<string, { bg: string; color: string }> = {
  none: { bg: 'var(--rc-taupe-soft)', color: 'var(--rc-taupe)' },
  le: { bg: 'var(--rc-taupe-soft)', color: 'var(--rc-taupe)' },
  pending: { bg: 'var(--rc-amber-soft)', color: 'var(--rc-amber)' },
  progress: { bg: 'var(--rc-sage-soft)', color: 'var(--rc-sage)' },
  done: { bg: 'var(--rc-moss)', color: 'var(--rc-fog)' },
  cancel: { bg: 'var(--rc-rust-soft)', color: 'var(--rc-rust)' }
};

// Cột "Trạng thái" — pill duy nhất theo tier đã resolve ở backend (resolvePrimaryStatus).
export function StatusTierPill({ status }: { status: PrimaryStatus }) {
  const style = TIER_STYLE[status.tier];
  return (
    <span
      className="recovery-arc-scope inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ background: 'currentColor' }} />
      {TIER_META[status.tier].label}
    </span>
  );
}

// Cột "Liệu trình" — hiện tên gói + ghi chú thời gian (mọi tier có gói: chờ kích hoạt/đang điều
// trị/hủy/hoàn thành); riêng donut tiến độ chỉ có ý nghĩa khi đang điều trị (mới có số buổi đã
// dùng/tổng buổi thật). Tier "le" (chỉ khám/dịch vụ lẻ) không có gói nào để hiện — chỉ 1 dòng ghi chú.
export function PrimaryPlanCell({ status }: { status: PrimaryStatus }) {
  if (!status.ten_goi) {
    return (
      <span className="recovery-arc-scope text-[11.5px] italic" style={{ color: 'var(--rc-taupe)' }}>
        {status.note || 'Chưa có liệu trình'}
      </span>
    );
  }
  if (status.tier !== 'progress') {
    return (
      <div className="recovery-arc-scope min-w-0">
        <div className="text-[12.5px] font-semibold truncate max-w-[220px]" style={{ color: 'var(--rc-ink)' }} title={status.ten_goi}>
          {status.ten_goi}
        </div>
        {status.note && <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--rc-taupe)' }}>{status.note}</div>}
      </div>
    );
  }
  const total = status.tong_so_buoi || 0;
  const done = status.so_buoi_da_dung || 0;
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const r = 12, circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div className="recovery-arc-scope flex items-center gap-2.5">
      <span className="relative shrink-0" style={{ width: 30, height: 30 }}>
        <svg width={30} height={30} viewBox="0 0 30 30" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={15} cy={15} r={r} fill="none" stroke="var(--rc-track)" strokeWidth={3} />
          <circle cx={15} cy={15} r={r} fill="none" stroke="var(--rc-sage)" strokeWidth={3} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset .6s ease' }} />
        </svg>
        <span className="rc-mono absolute inset-0 flex items-center justify-center text-[8.5px] font-semibold" style={{ color: 'var(--rc-ink)' }}>
          {total ? `${done}/${total}` : '–'}
        </span>
      </span>
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold truncate max-w-[220px]" style={{ color: 'var(--rc-ink)' }} title={status.ten_goi}>
          {status.ten_goi}
        </div>
        <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--rc-taupe)' }}>
          {status.note || (total ? `${Math.round(pct * 100)}% tiến độ` : '')}
        </div>
      </div>
    </div>
  );
}

export function RecordViewButton({ hasRecord, onClick }: { hasRecord: boolean; onClick: () => void }) {
  if (!hasRecord) {
    return <span className="text-[10px] font-semibold" style={{ color: 'var(--rc-taupe)' }}>—</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Xem hồ sơ điều trị"
      className="recovery-arc-scope size-8 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-95"
      style={{ background: 'var(--rc-sage-soft)', color: 'var(--rc-sage)' }}
    >
      <FileSearch size={15} />
    </button>
  );
}

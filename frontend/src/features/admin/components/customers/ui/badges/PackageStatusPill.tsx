import { ClipboardPlus } from 'lucide-react';
import { PLAN_STATUS_META } from '../../constants';
import type { TreatmentPlanStatus } from '../../types';

const TIER_STYLE: Record<string, { bg: string; color: string }> = {
  none: { bg: 'var(--rc-taupe-soft)', color: 'var(--rc-taupe)' },
  le: { bg: 'var(--rc-taupe-soft)', color: 'var(--rc-taupe)' },
  pending: { bg: 'var(--rc-amber-soft)', color: 'var(--rc-amber)' },
  progress: { bg: 'var(--rc-sage-soft)', color: 'var(--rc-sage)' },
  qua_han: { bg: 'var(--rc-clay-soft)', color: 'var(--rc-clay)' },
  done: { bg: 'var(--rc-moss)', color: 'var(--rc-fog)' },
  cancel: { bg: 'var(--rc-rust-soft)', color: 'var(--rc-rust)' }
};

// Trạng thái 1 liệu trình (phac_do_dieu_tri) dùng chung đúng bảng màu trên qua ánh xạ sang tier
// tương ứng — không rời rạc thêm 1 bộ hex mới.
const PLAN_STATUS_TO_TIER_STYLE: Record<TreatmentPlanStatus, string> = {
  dang_dieu_tri: 'progress',
  qua_han: 'qua_han',
  hoan_thanh: 'done',
  huy: 'cancel'
};

// Cột "Trạng thái" ở khối "Gói liệu trình" (tab "Hồ sơ điều trị") — 1 dòng = 1 gói.
export function PlanStatusPill({ status }: { status: TreatmentPlanStatus }) {
  const style = TIER_STYLE[PLAN_STATUS_TO_TIER_STYLE[status]];
  return (
    <span
      className="recovery-arc-scope inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ background: 'currentColor' }} />
      {PLAN_STATUS_META[status].label}
    </span>
  );
}

export function RecordViewButton({ hasRecord, onClick }: { hasRecord: boolean; onClick: () => void }) {
  if (!hasRecord) {
    return (
      <span
        title="Khách hàng chưa có hồ sơ điều trị"
        className="recovery-arc-scope inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-dashed whitespace-nowrap"
        style={{ borderColor: 'var(--rc-line)', color: 'var(--rc-taupe)' }}
      >
        <ClipboardPlus size={13} className="opacity-50" />
        Chưa có
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Xem hồ sơ điều trị"
      className="recovery-arc-scope inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
      style={{ background: 'var(--rc-sage-soft)', color: 'var(--rc-sage)', borderColor: 'var(--rc-sage)' }}
    >
      <ClipboardPlus size={13} />
      Hồ sơ
    </button>
  );
}

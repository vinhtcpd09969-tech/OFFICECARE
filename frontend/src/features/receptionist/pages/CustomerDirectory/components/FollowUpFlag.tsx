import type { ContactReason } from '../types';

export function FollowUpFlag({ lyDoLienHe, staleDays }: { lyDoLienHe: ContactReason | null; staleDays: number }) {
  if (!lyDoLienHe) {
    return <span className="text-slate-300 text-xs">–</span>;
  }
  if (lyDoLienHe.type === 'sap_het_han') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-150 text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
        ⏱ Sắp hết hạn kích hoạt
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
      🔔 Cần liên hệ ({staleDays}d+)
    </span>
  );
}

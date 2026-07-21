export function FollowUpFlag({ canLienHe, staleDays }: { canLienHe: boolean; staleDays: number }) {
  if (!canLienHe) {
    return <span className="text-slate-300 text-xs">–</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
      🔔 Cần liên hệ ({staleDays}d+)
    </span>
  );
}

import type { CurrentPackageInfo } from '../types';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  cho_kich_hoat: { label: 'Chờ kích hoạt', cls: 'bg-amber-50 text-amber-700 border-amber-150' },
  dang_dieu_tri: { label: 'Đang điều trị', cls: 'bg-teal-50 text-teal-700 border-teal-150' },
  hoan_thanh: { label: 'Hoàn thành', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export function PackageStatusBadge({ goi }: { goi: CurrentPackageInfo | null }) {
  if (!goi) {
    return <span className="text-[11px] text-slate-400 font-semibold italic">Chưa có liệu trình</span>;
  }
  const meta = STATUS_META[goi.trang_thai] || { label: goi.trang_thai, cls: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${meta.cls}`}>
        {meta.label}
      </span>
      <span className="text-[11px] font-bold text-slate-700 truncate max-w-[180px]">{goi.ten_goi}</span>
      {goi.trang_thai === 'dang_dieu_tri' && typeof goi.so_buoi_da_dung === 'number' && (
        <span className="text-[10px] text-slate-450 font-semibold">
          Buổi {goi.so_buoi_da_dung} / {goi.tong_so_buoi}
        </span>
      )}
    </div>
  );
}

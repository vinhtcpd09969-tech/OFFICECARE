import { memo } from 'react';
import { Inbox } from 'lucide-react';
import { Pagination } from '../../../../../components/Pagination';
import type { CompletedSingleVisitItem } from '../types';

interface CompletedSingleVisitTableProps {
  data: CompletedSingleVisitItem[];
  loading: boolean;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onViewProfile: (khachHangId: string, visitId: string) => void;
}

function formatDateTime(v: string) {
  return new Date(v).toLocaleString('vi-VN');
}

const LOAI_LABEL: Record<string, string> = { KHAM: 'Khám', DICH_VU_LE: 'Dịch vụ lẻ' };

const CompletedSingleVisitRow = memo(function CompletedSingleVisitRow({
  visit, onViewProfile
}: {
  visit: CompletedSingleVisitItem;
  onViewProfile: (khachHangId: string, visitId: string) => void;
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => onViewProfile(visit.khach_hang_id, visit.id)}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-teal-50 border border-teal-100/60 text-teal-700 font-black flex items-center justify-center text-[11px] uppercase shrink-0">
            {visit.ho_ten?.charAt(0) || 'K'}
          </div>
          <span className="text-slate-850 font-bold">{visit.ho_ten}</span>
        </div>
      </td>
      <td className="p-4">
        <span
          className="inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase"
          style={
            visit.loai === 'KHAM'
              ? { background: 'var(--rc-sage-soft)', color: 'var(--rc-sage)' }
              : { background: 'var(--rc-clay-soft)', color: 'var(--rc-clay)' }
          }
        >
          {LOAI_LABEL[visit.loai] || visit.loai}
        </span>
      </td>
      <td className="p-4 text-slate-700 font-semibold">{visit.ten_dich_vu || '-'}</td>
      <td className="p-4 text-slate-600 font-semibold whitespace-nowrap">{formatDateTime(visit.ngay_gio_bat_dau)}</td>
      <td className="p-4 text-slate-600 font-semibold">{visit.ten_nhan_su || '-'}</td>
    </tr>
  );
});

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className="p-4">
              <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Khối "Ca khám lẻ hoàn thành" (tab Hồ sơ điều trị) — không có filter toolbar đi kèm, chỉ phân trang.
export function CompletedSingleVisitTable({ data, loading, meta, onPageChange, onViewProfile }: CompletedSingleVisitTableProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[30%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4 font-black">Khách hàng</th>
              <th className="p-4 font-black">Loại</th>
              <th className="p-4 font-black">Dịch vụ</th>
              <th className="p-4 font-black">Ngày giờ</th>
              <th className="p-4 font-black">Người thực hiện</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <TableSkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox size={28} className="stroke-[1.5]" />
                    <span className="font-semibold text-xs">Chưa có ca khám hoặc dịch vụ lẻ nào hoàn thành.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(v => (
                <CompletedSingleVisitRow key={v.id} visit={v} onViewProfile={onViewProfile} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length > 0 && (
        <div className="border-t border-slate-100">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} label="ca khám" />
        </div>
      )}
    </div>
  );
}

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
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} • ${date}`;
}

const LOAI_LABEL: Record<string, string> = { KHAM: 'Khám lâm sàng', DICH_VU_LE: 'Dịch vụ lẻ' };

const CompletedSingleVisitRow = memo(function CompletedSingleVisitRow({
  visit, onViewProfile
}: {
  visit: CompletedSingleVisitItem;
  onViewProfile: (khachHangId: string, visitId: string) => void;
}) {
  const isKham = visit.loai === 'KHAM';

  return (
    <tr 
      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer font-jakarta" 
      onClick={() => onViewProfile(visit.khach_hang_id, visit.id)}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs uppercase shrink-0 shadow-sm">
            {visit.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
              {visit.ho_ten}
            </span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
          isKham 
            ? 'bg-teal-50 text-[#0D9488] border-teal-200/60 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800' 
            : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        }`}>
          {LOAI_LABEL[visit.loai] || visit.loai}
        </span>
      </td>
      <td className="p-4">
        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-snug block">
          {visit.ten_dich_vu || '-'}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap">
        <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
          {formatDateTime(visit.ngay_gio_bat_dau)}
        </span>
      </td>
      <td className="p-4">
        <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
          {visit.ten_nhan_su || '-'}
        </span>
      </td>
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
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
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
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden font-jakarta">
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
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Loại</th>
              <th className="p-4">Dịch vụ</th>
              <th className="p-4">Ngày giờ</th>
              <th className="p-4">Người thực hiện</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableSkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox size={28} className="stroke-[1.5]" />
                    <span className="font-extrabold text-xs">Chưa có ca khám hoặc dịch vụ lẻ nào hoàn thành.</span>
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
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} label="ca khám" />
        </div>
      )}
    </div>
  );
}

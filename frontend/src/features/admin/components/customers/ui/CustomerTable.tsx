import { memo, useMemo } from 'react';
import { Edit3, Inbox, Lock, Unlock } from 'lucide-react';
import { ReputationBadge } from './badges/ReputationBadge';
import { RecordViewButton } from './badges/PackageStatusPill';
import { Pagination } from '../../../../../components/Pagination';
import type { CustomerOverviewItem } from '../types';

interface CustomerTableProps {
  data: CustomerOverviewItem[];
  loading: boolean;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onViewProfile: (customer: CustomerOverviewItem) => void;
  onEdit: (customer: CustomerOverviewItem) => void;
  onToggleLock: (customer: CustomerOverviewItem) => void;
}

function formatCurrency(v: number) {
  return v.toLocaleString('vi-VN') + 'đ';
}

const CustomerTableRow = memo(function CustomerTableRow({
  customer, onViewProfile, onEdit, onToggleLock
}: {
  customer: CustomerOverviewItem;
  onViewProfile: (c: CustomerOverviewItem) => void;
  onEdit: (c: CustomerOverviewItem) => void;
  onToggleLock: (c: CustomerOverviewItem) => void;
}) {
  const isLocked = customer.trang_thai === 'vo_hieu';
  return (
    <tr className={`transition-colors group font-jakarta ${
      isLocked 
        ? 'bg-rose-50/20 dark:bg-rose-955/10 hover:bg-rose-50/40 opacity-75' 
        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
    }`}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs uppercase shrink-0 shadow-sm ${
            isLocked ? 'grayscale opacity-60' : ''
          }`}>
            {customer.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-extrabold text-xs md:text-sm truncate ${
                isLocked 
                  ? 'line-through text-slate-400 dark:text-zinc-500' 
                  : 'text-slate-900 dark:text-white'
              }`}>
                {customer.ho_ten}
              </span>
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 shadow-xs shrink-0">
                  <Lock size={10} /> Đã khóa
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold mt-0.5 tracking-wider">
              {customer.ma_khach_hang}
            </span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{customer.so_dien_thoai || '-'}</span>
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">{customer.email || '-'}</span>
        </div>
      </td>
      <td className="p-4 text-center">
        <ReputationBadge score={customer.diem_uy_tin} />
      </td>
      <td className="p-4 text-right font-black text-slate-900 dark:text-white text-xs md:text-sm whitespace-nowrap">
        {formatCurrency(customer.tong_chi_tieu)}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <RecordViewButton hasRecord={customer.has_record} onClick={() => onViewProfile(customer)} />
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shadow-sm cursor-pointer"
          >
            <Edit3 size={12} className="text-teal-600 dark:text-teal-400" />
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onToggleLock(customer)}
            className={`px-3 py-1.5 border rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shadow-sm cursor-pointer flex items-center gap-1 ${
              isLocked
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-955/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/80'
                : 'border-rose-200 bg-rose-50/70 dark:bg-rose-955/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80'
            }`}
          >
            {isLocked ? (
              <>
                <Unlock size={12} />
                <span>Mở khóa</span>
              </>
            ) : (
              <>
                <Lock size={12} />
                <span>Khóa</span>
              </>
            )}
          </button>
        </div>
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

export function CustomerTable({ data, loading, meta, onPageChange, onViewProfile, onEdit, onToggleLock }: CustomerTableProps) {
  // Sort locked customers to the very end of the list; active customers stay at the top (restored customers move to top)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aLocked = a.trang_thai === 'vo_hieu';
      const bLocked = b.trang_thai === 'vo_hieu';
      if (aLocked && !bLocked) return 1;  // locked pushed to bottom
      if (!aLocked && bLocked) return -1; // active stays at top
      return 0;
    });
  }, [data]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden font-jakarta">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[19%]" />
            <col className="w-[11%]" />
            <col className="w-[15%]" />
            <col className="w-[31%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Liên hệ</th>
              <th className="p-4 text-center">Uy tín</th>
              <th className="p-4 text-right">Tổng chi tiêu</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableSkeletonRows />
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox size={32} className="stroke-[1.5]" />
                    <span className="font-extrabold text-xs">Không tìm thấy khách hàng nào thỏa điều kiện lọc.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map(c => (
                <CustomerTableRow key={c.id} customer={c} onViewProfile={onViewProfile} onEdit={onEdit} onToggleLock={onToggleLock} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && sortedData.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

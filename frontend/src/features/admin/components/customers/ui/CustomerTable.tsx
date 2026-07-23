import { memo } from 'react';
import { Edit3, Inbox } from 'lucide-react';
import { ReputationBadge } from './badges/ReputationBadge';
import { RecordViewButton, PrimaryPlanCell, StatusTierPill } from './badges/PackageStatusPill';
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
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-teal-50 border border-teal-100/60 text-teal-700 font-black flex items-center justify-center text-[11px] uppercase shrink-0">
            {customer.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-850 font-bold">{customer.ho_ten}</span>
              {isLocked && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
                  🔒 Đã khóa
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 font-extrabold font-mono mt-0.5">{customer.ma_khach_hang}</span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-700">{customer.so_dien_thoai || '-'}</span>
          <span className="text-[10px] text-slate-400 font-medium">{customer.email || '-'}</span>
        </div>
      </td>
      <td className="p-4 text-center">
        <ReputationBadge score={customer.diem_uy_tin} />
      </td>
      <td className="p-4 text-center">
        <StatusTierPill status={customer.primary_status} />
      </td>
      <td className="p-4">
        <PrimaryPlanCell status={customer.primary_status} />
      </td>
      <td className="p-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">{formatCurrency(customer.tong_chi_tieu)}</td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <RecordViewButton hasRecord={customer.has_record} onClick={() => onViewProfile(customer)} />
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-800 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shadow-sm"
          >
            <Edit3 size={10} />
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onToggleLock(customer)}
            className={`px-2.5 py-1.5 border rounded-xl font-bold text-[10px] transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shadow-sm ${
              isLocked
                ? 'border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
                : 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50'
            }`}
          >
            {isLocked ? 'Mở khóa' : 'Khóa'}
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
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="p-4">
              <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CustomerTable({ data, loading, meta, onPageChange, onViewProfile, onEdit, onToggleLock }: CustomerTableProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
            <col className="w-[13%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[21%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4 font-black">Khách hàng</th>
              <th className="p-4 font-black">Liên hệ</th>
              <th className="p-4 font-black text-center">Uy tín</th>
              <th className="p-4 font-black text-center">Trạng thái</th>
              <th className="p-4 font-black">Liệu trình</th>
              <th className="p-4 font-black text-right">Tổng chi tiêu</th>
              <th className="p-4 font-black text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <TableSkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox size={28} className="stroke-[1.5]" />
                    <span className="font-semibold text-xs">Không tìm thấy khách hàng nào thỏa điều kiện lọc.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(c => (
                <CustomerTableRow key={c.id} customer={c} onViewProfile={onViewProfile} onEdit={onEdit} onToggleLock={onToggleLock} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length > 0 && (
        <div className="border-t border-slate-100">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

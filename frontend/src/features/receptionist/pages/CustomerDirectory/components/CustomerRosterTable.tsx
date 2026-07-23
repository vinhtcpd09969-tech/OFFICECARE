import { memo } from 'react';
import { Inbox, ClipboardPlus } from 'lucide-react';
import { Pagination } from '../../../../../components/Pagination';
import { ReputationScore } from './ReputationScore';
import { PackageStatusBadge } from './PackageStatusBadge';
import { FollowUpFlag } from './FollowUpFlag';
import { formatDaysAgo } from '../../../../../utils/date';
import type { CustomerRosterItem, RosterMeta } from '../types';

interface CustomerRosterTableProps {
  data: CustomerRosterItem[];
  loading: boolean;
  meta: RosterMeta;
  staleDays: number;
  onPageChange: (page: number) => void;
  onViewProfile: (customer: CustomerRosterItem) => void;
}

const CustomerRosterRow = memo(function CustomerRosterRow({
  customer, staleDays, onViewProfile
}: {
  customer: CustomerRosterItem;
  staleDays: number;
  onViewProfile: (c: CustomerRosterItem) => void;
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-teal-50 border border-teal-100/60 text-teal-700 font-black flex items-center justify-center text-[11px] uppercase shrink-0">
            {customer.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-slate-850 font-bold truncate">{customer.ho_ten}</span>
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
      <td className="p-4">
        <ReputationScore score={customer.diem_uy_tin} />
      </td>
      <td className="p-4">
        <PackageStatusBadge goi={customer.goi_hien_tai} />
      </td>
      <td className="p-4 text-[11px] font-semibold text-slate-600">
        {formatDaysAgo(customer.last_used_at)}
      </td>
      <td className="p-4">
        <FollowUpFlag canLienHe={customer.can_lien_he} staleDays={staleDays} />
      </td>
      <td className="p-4">
        <button
          type="button"
          onClick={() => onViewProfile(customer)}
          className="px-2.5 py-1.5 border border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 text-teal-700 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap shadow-sm"
        >
          <ClipboardPlus size={13} />
          Xem hồ sơ
        </button>
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

export function CustomerRosterTable({ data, loading, meta, staleDays, onPageChange, onViewProfile }: CustomerRosterTableProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4 font-black">Khách hàng</th>
              <th className="p-4 font-black">Liên hệ</th>
              <th className="p-4 font-black">Uy tín</th>
              <th className="p-4 font-black">Trạng thái gói</th>
              <th className="p-4 font-black">Lần cuối dùng dịch vụ</th>
              <th className="p-4 font-black">Cần liên hệ</th>
              <th className="p-4 font-black">Thao tác</th>
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
              data.map((c) => (
                <CustomerRosterRow key={c.id} customer={c} staleDays={staleDays} onViewProfile={onViewProfile} />
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

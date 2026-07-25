import { memo } from 'react';
import { Inbox } from 'lucide-react';
import { PlanStatusPill } from './badges/PackageStatusPill';
import { Pagination } from '../../../../../components/Pagination';
import type { TreatmentPlanItem } from '../types';

interface TreatmentPlanTableProps {
  data: TreatmentPlanItem[];
  loading: boolean;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onViewProfile: (khachHangId: string, planId: string) => void;
}

function formatDate(v: string | null) {
  if (!v) return '–';
  return new Date(v).toLocaleDateString('vi-VN');
}

// Nhãn ngày "kết thúc" phụ theo đúng trạng thái — mỗi trạng thái có 1 mốc ngày ý nghĩa khác nhau,
// không có cột "ngày kết thúc chung" nào đúng cho cả 4 trạng thái.
function endDateInfo(plan: TreatmentPlanItem): { label: string; value: string | null } {
  if (plan.status === 'huy') return { label: 'Ngày hủy', value: plan.ngay_huy };
  if (plan.status === 'hoan_thanh') return { label: 'Ngày hoàn thành', value: plan.ngay_hoan_thanh };
  if (plan.status === 'qua_han') return { label: 'Quá hạn từ', value: plan.han_su_dung };
  return { label: 'Hạn dùng', value: plan.han_su_dung };
}

const TreatmentPlanTableRow = memo(function TreatmentPlanTableRow({
  plan, onViewProfile
}: {
  plan: TreatmentPlanItem;
  onViewProfile: (khachHangId: string, planId: string) => void;
}) {
  const end = endDateInfo(plan);
  return (
    <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => onViewProfile(plan.khach_hang_id, plan.id)}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-teal-50 border border-teal-100/60 text-teal-700 font-black flex items-center justify-center text-[11px] uppercase shrink-0">
            {plan.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col">
            <span className="text-slate-850 font-bold">{plan.ho_ten}</span>
            <span className="text-[9px] text-slate-400 font-extrabold font-mono mt-0.5">{plan.ma_khach_hang}</span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-700">{plan.ten_goi}</span>
          <span className="text-[10px] text-slate-400 font-medium">{plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi</span>
        </div>
      </td>
      <td className="p-4 text-center">
        <PlanStatusPill status={plan.status} />
      </td>
      <td className="p-4 text-slate-600 font-semibold whitespace-nowrap">{formatDate(plan.ngay_kich_hoat)}</td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 font-medium">{end.label}</span>
          <span className="text-slate-600 font-semibold whitespace-nowrap">{formatDate(end.value)}</span>
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
              <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TreatmentPlanTable({ data, loading, meta, onPageChange, onViewProfile }: TreatmentPlanTableProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[26%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4 font-black">Khách hàng</th>
              <th className="p-4 font-black">Liệu trình</th>
              <th className="p-4 font-black text-center">Trạng thái</th>
              <th className="p-4 font-black">Ngày kích hoạt</th>
              <th className="p-4 font-black">Mốc thời gian</th>
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
                    <span className="font-semibold text-xs">Không tìm thấy liệu trình nào thỏa điều kiện lọc.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(p => (
                <TreatmentPlanTableRow key={p.id} plan={p} onViewProfile={onViewProfile} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length > 0 && (
        <div className="border-t border-slate-100">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} label="liệu trình" />
        </div>
      )}
    </div>
  );
}

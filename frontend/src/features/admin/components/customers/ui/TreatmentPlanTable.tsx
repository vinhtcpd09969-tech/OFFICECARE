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
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Nhãn ngày "kết thúc" phụ theo đúng trạng thái
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
    <tr 
      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer font-jakarta" 
      onClick={() => onViewProfile(plan.khach_hang_id, plan.id)}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs uppercase shrink-0 shadow-sm">
            {plan.ho_ten?.charAt(0) || 'K'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
              {plan.ho_ten}
            </span>
            <span className="text-[10px] text-slate-400 font-extrabold mt-0.5 tracking-wider">
              {plan.ma_khach_hang}
            </span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-snug">{plan.ten_goi}</span>
          <span className="text-[11px] text-teal-700 dark:text-teal-400 font-black bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-800 w-fit">
            {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi
          </span>
        </div>
      </td>
      <td className="p-4 text-center">
        <PlanStatusPill status={plan.status} />
      </td>
      <td className="p-4 whitespace-nowrap">
        <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
          {formatDate(plan.ngay_kich_hoat)}
        </span>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{end.label}</span>
          <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDate(end.value)}
          </span>
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

export function TreatmentPlanTable({ data, loading, meta, onPageChange, onViewProfile }: TreatmentPlanTableProps) {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden font-jakarta">
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
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Liệu trình</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4">Ngày kích hoạt</th>
              <th className="p-4">Mốc thời gian</th>
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
                    <span className="font-extrabold text-xs">Không tìm thấy liệu trình nào thỏa điều kiện lọc.</span>
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
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPageChange={onPageChange} label="liệu trình" />
        </div>
      )}
    </div>
  );
}

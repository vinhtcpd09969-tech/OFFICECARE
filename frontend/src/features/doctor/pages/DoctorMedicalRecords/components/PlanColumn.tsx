import React from 'react';
import { ChevronRight, Layers } from 'lucide-react';
import { TreatmentPlan } from '../../../api/doctor.api';

interface PlanColumnProps {
  plans: TreatmentPlan[];
  onOpenPlan: (id: string) => void;
}

export const PLAN_STATUS_META: Record<string, { label: string; badge: string }> = {
  dang_dieu_tri: { label: 'Đang điều trị', badge: 'bg-primary/10 text-primary border-primary/25' },
  hoan_thanh: { label: 'Hoàn thành', badge: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border-emerald-150/40 dark:border-emerald-900/30' },
  cho_kich_hoat: { label: 'Chờ kích hoạt', badge: 'bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-400 border-amber-150/40 dark:border-amber-900/30' },
  huy: { label: 'Đã hủy', badge: 'bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-150/40 dark:border-rose-900/30' },
  tam_dung: { label: 'Tạm dừng', badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200/50' },
};
export const getPlanStatusMeta = (trangThai: string) => PLAN_STATUS_META[trangThai] || PLAN_STATUS_META.dang_dieu_tri;

const formatDate = (d?: string) => {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return 'N/A'; }
};

/** Cột trái "Phác đồ điều trị" — mirror đúng bảng trái của Admin (PatientEmrDetail.tsx): mỗi phác đồ
 * 1 thẻ thu gọn (trạng thái + tiến độ luôn hiện), bấm "Chi tiết" mới mở popup xem từng buổi. */
export const PlanColumn: React.FC<PlanColumnProps> = ({ plans, onOpenPlan }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
        <Layers size={12} /> Phác đồ điều trị ({plans.length})
      </h3>
      {plans.length === 0 ? (
        <div className="bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold px-4">
          Bệnh nhân chưa có phác đồ điều trị nào.
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const meta = getPlanStatusMeta(plan.trang_thai);
            const pct = plan.tong_so_buoi > 0 ? Math.min(100, Math.round((plan.so_buoi_da_dung / plan.tong_so_buoi) * 100)) : 0;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onOpenPlan(plan.id)}
                className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase border ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <h4 className="text-xs font-black text-secondary dark:text-zinc-100 mt-1.5 truncate">
                      {plan.ten_goi || plan.ten_dich_vu}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 truncate">
                      {plan.bac_si_chi_dinh ? `Bác sĩ chỉ định: ${plan.bac_si_chi_dinh} • ` : ''}Kích hoạt: {formatDate(plan.thoi_gian_tao)}
                    </p>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-primary text-white dark:text-zinc-950 rounded-lg text-[10px] font-black">
                    Chi tiết <ChevronRight size={12} />
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                    <span>Tiến độ: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

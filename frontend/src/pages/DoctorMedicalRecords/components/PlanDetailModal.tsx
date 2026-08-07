import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Stethoscope, ChevronDown, Lock, UserCheck } from 'lucide-react';
import { TreatmentPlan } from '../../../features/doctor/api/doctor.api';
import { StaffAvatar, getSessionStatusMeta } from './StaffAvatar';
import { getPlanStatusMeta } from './PlanColumn';
import { useAuthStore } from '../../../stores/authStore';
import { TreatmentSessionDetailBody } from '../../../components/TreatmentSessionDetailBody';

interface PlanDetailModalProps {
  plan: TreatmentPlan;
  onClose?: () => void;
  onJumpToVisit: (visitId: string) => void;
  isInline?: boolean;
}

const formatDate = (d?: string) => {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return 'N/A'; }
};

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({ plan, onClose, onJumpToVisit, isInline }) => {
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const currentUserId = useAuthStore((s) => Number(s.user?.id) || null);
  const meta = getPlanStatusMeta(plan.trang_thai);
  const pct = plan.tong_so_buoi > 0 ? Math.min(100, Math.round((plan.so_buoi_da_dung / plan.tong_so_buoi) * 100)) : 0;

  const renderContent = () => (
    <>
      {plan.goc_kham_id && (
        <button
          type="button"
          onClick={() => onJumpToVisit(plan.goc_kham_id!)}
          className="w-full flex items-center gap-3.5 rounded-2xl p-4 border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
        >
          <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Stethoscope size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Xuất phát từ ca khám</p>
            <p className="text-sm font-bold text-secondary dark:text-slate-100">Bấm để xem chi tiết ca khám đã chỉ định</p>
          </div>
        </button>
      )}

      <div>
        <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-black uppercase border ${meta.badge}`}>{meta.label}</span>
        <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold mt-2">
          {plan.bac_si_chi_dinh ? `Bác sĩ chỉ định: ${plan.bac_si_chi_dinh} • ` : ''}Kích hoạt: {formatDate(plan.thoi_gian_tao)}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-550 dark:text-slate-400">
          <span>Tiến độ: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Nhật ký buổi điều trị</span>
        {plan.sessions.map((session) => {
          const isOpen = openSessionId === session.id;
          const isCompleted = session.trang_thai === 'hoan_thanh';
          const statusMeta = getSessionStatusMeta(session.trang_thai);
          const isOwn = !!currentUserId && session.thuc_hien_id === currentUserId;
          const beforeScore = typeof session.danh_gia_truoc_buoi === 'number' ? session.danh_gia_truoc_buoi : null;
          const afterScore = typeof session.danh_gia_sau_buoi === 'number' ? session.danh_gia_sau_buoi : null;
          return (
            <div key={session.id} className={`border rounded-2xl overflow-hidden transition-all bg-white dark:bg-slate-900 ${isOpen ? 'border-slate-200 dark:border-slate-700 shadow-sm' : 'border-slate-100 dark:border-slate-800'}`}>
              <button
                type="button"
                disabled={!isCompleted}
                onClick={() => isCompleted && setOpenSessionId(isOpen ? null : session.id)}
                className={`w-full text-left p-4 flex items-center gap-3.5 ${isCompleted ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              >
                <StaffAvatar name={session.ten_ky_thuat_vien} avatarUrl={session.anh_ky_thuat_vien} size={42} statusMeta={statusMeta} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-secondary dark:text-slate-200 truncate">
                    Buổi {session.so_thu_tu_buoi} • <span className="text-primary">{session.ten_ky_thuat_vien || 'Chưa phân công'}</span>
                  </p>
                  {isCompleted && (
                    isOwn ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-primary mt-1">
                        <UserCheck size={12} /> Ghi chú của bạn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-slate-400 mt-1">
                        <Lock size={12} /> Chỉ xem — ghi bởi {session.ten_ky_thuat_vien || 'nhân sự khác'}
                      </span>
                    )
                  )}
                </div>
                <span className={`shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-slate-100 text-slate-400 border-slate-200/50 dark:bg-slate-800'}`}>
                  {statusMeta.label}
                </span>
                {isCompleted && <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
              </button>

              {isOpen && isCompleted && (
                <div className="px-4 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <TreatmentSessionDetailBody
                    ghiChu={session.danh_gia_hieu_qua}
                    ghiChuLabel="Nhật ký & Ghi chú của KTV"
                    chongChiDinh={session.canh_bao_dac_biet}
                    vasTruoc={beforeScore}
                    vasSau={afterScore}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  if (isInline) {
    return (
      <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-150 dark:border-slate-800 p-6 space-y-6 max-h-[650px] overflow-y-auto">
        <div className="border-b border-slate-150 dark:border-slate-800 pb-4">
          <h3 className="text-base font-black text-secondary dark:text-slate-100 leading-snug">{plan.ten_goi || plan.ten_dich_vu}</h3>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl w-full max-w-4xl lg:max-w-5xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 flex items-start justify-between gap-4 rounded-t-3xl z-10">
          <h3 className="text-lg font-black text-secondary dark:text-slate-100 leading-snug">{plan.ten_goi || plan.ten_dich_vu}</h3>
          {onClose && (
            <button onClick={onClose} className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {renderContent()}
        </div>
      </motion.div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Stethoscope, ChevronDown, ShieldAlert, FlameKindling, CheckCircle, Lock, UserCheck } from 'lucide-react';
import { TreatmentPlan } from '../../../api/doctor.api';
import { StaffAvatar, getSessionStatusMeta } from './StaffAvatar';
import { getPlanStatusMeta } from './PlanColumn';
import { useAuthStore } from '../../../../../stores/authStore';

interface PlanDetailModalProps {
  plan: TreatmentPlan;
  onClose: () => void;
  onJumpToVisit: (visitId: string) => void;
}

const formatDate = (d?: string) => {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return 'N/A'; }
};

/** Popup chi tiết 1 phác đồ — banner liên kết ngược về ca khám gốc (nếu có), tiến độ sống, nhật ký
 * từng buổi. Nhãn ghi chú buổi đổi theo đúng người đang đăng nhập ("Ghi chú của bạn" khi tự xem lại
 * ghi chú của chính mình, "Chỉ xem" khi xem ghi chú của nhân sự khác) thay vì nhãn tĩnh cố định. */
export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({ plan, onClose, onJumpToVisit }) => {
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const currentUserId = useAuthStore((s) => Number(s.user?.id) || null);
  const meta = getPlanStatusMeta(plan.trang_thai);
  const pct = plan.tong_so_buoi > 0 ? Math.min(100, Math.round((plan.so_buoi_da_dung / plan.tong_so_buoi) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 p-6 flex items-start justify-between gap-4 rounded-t-3xl z-10">
          <h3 className="text-lg font-black text-secondary dark:text-zinc-100 leading-snug">{plan.ten_goi || plan.ten_dich_vu}</h3>
          <button onClick={onClose} className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Xuất phát từ ca khám</p>
                <p className="text-sm font-bold text-secondary dark:text-zinc-100">Bấm để xem chi tiết ca khám đã chỉ định</p>
              </div>
            </button>
          )}

          <div>
            <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-black uppercase border ${meta.badge}`}>{meta.label}</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-2">
              {plan.bac_si_chi_dinh ? `Bác sĩ chỉ định: ${plan.bac_si_chi_dinh} • ` : ''}Kích hoạt: {formatDate(plan.thoi_gian_tao)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
              <span>Tiến độ: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Nhật ký buổi điều trị</span>
            {plan.sessions.map((session) => {
              const isOpen = openSessionId === session.id;
              const isCompleted = session.trang_thai === 'hoan_thanh';
              const statusMeta = getSessionStatusMeta(session.trang_thai);
              const isOwn = !!currentUserId && session.thuc_hien_id === currentUserId;
              return (
                <div key={session.id} className={`border rounded-2xl overflow-hidden transition-all bg-white dark:bg-zinc-900 ${isOpen ? 'border-zinc-200 dark:border-zinc-700 shadow-sm' : 'border-zinc-100 dark:border-zinc-800'}`}>
                  <button
                    type="button"
                    disabled={!isCompleted}
                    onClick={() => isCompleted && setOpenSessionId(isOpen ? null : session.id)}
                    className={`w-full text-left p-4 flex items-center gap-3.5 ${isCompleted ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  >
                    <StaffAvatar name={session.ten_ky_thuat_vien} avatarUrl={session.anh_ky_thuat_vien} size={42} statusMeta={statusMeta} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-secondary dark:text-zinc-200 truncate">
                        Buổi {session.so_thu_tu_buoi} • <span className="text-primary">{session.ten_ky_thuat_vien || 'Chưa phân công'}</span>
                      </p>
                      {isCompleted && (
                        isOwn ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-primary mt-1">
                            <UserCheck size={12} /> Ghi chú của bạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-zinc-400 mt-1">
                            <Lock size={12} /> Chỉ xem — ghi bởi {session.ten_ky_thuat_vien || 'nhân sự khác'}
                          </span>
                        )
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-zinc-100 text-zinc-400 border-zinc-200/50 dark:bg-zinc-800'}`}>
                      {statusMeta.label}
                    </span>
                    {isCompleted && <ChevronDown size={16} className={`text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                  </button>

                  {isOpen && isCompleted && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-50 dark:border-zinc-800 space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-50 dark:bg-zinc-855 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">VAS trước buổi</span>
                          <p className="text-sm font-black text-rose-500 mt-1.5 flex items-center gap-1.5"><FlameKindling size={14} /> {session.danh_gia_truoc_buoi ?? '—'}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-855 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">VAS sau buổi</span>
                          <p className="text-sm font-black text-emerald-600 mt-1.5 flex items-center gap-1.5"><CheckCircle size={14} /> {session.danh_gia_sau_buoi ?? '—'}</p>
                        </div>
                      </div>
                      {session.canh_bao_dac_biet && (
                        <div className="bg-rose-50/60 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl flex items-start gap-2.5">
                          <ShieldAlert size={15} className="text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{session.canh_bao_dac_biet}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase">Ghi chú buổi</span>
                        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-350 mt-1.5">{session.danh_gia_hieu_qua || 'Chưa ghi nhận.'}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

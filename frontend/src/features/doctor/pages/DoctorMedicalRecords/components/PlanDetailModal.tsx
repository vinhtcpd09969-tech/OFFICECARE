import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Stethoscope, ChevronDown, ShieldAlert, Lock, UserCheck, FileText, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { TreatmentPlan } from '../../../api/doctor.api';
import { StaffAvatar, getSessionStatusMeta } from './StaffAvatar';
import { getPlanStatusMeta } from './PlanColumn';
import { useAuthStore } from '../../../../../stores/authStore';

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

const getVasDescription = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '';
  if (score === 0) return 'Không đau';
  if (score >= 1 && score <= 3) return 'Đau nhẹ: Ê ẩm, mỏi nhẹ (Vẫn làm việc, sinh hoạt bình thường)';
  if (score >= 4 && score <= 6) return 'Đau vừa: Đau rõ rệt, nhức mỏi (Có ảnh hưởng một phần đến sinh hoạt/công việc)';
  if (score >= 7 && score <= 9) return 'Đau nặng: Đau buốt dữ dội (Hạn chế vận động, ảnh hưởng sinh hoạt)';
  if (score === 10) return 'Cực độ: Đau không thể chịu nổi (Hạn chế vận động hoàn toàn, cần can thiệp khẩn cấp)';
  return '';
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Cột trái: Ghi chú & Cảnh báo */}
                    <div className="flex flex-col gap-3">
                      {session.danh_gia_hieu_qua && (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-750 rounded-2xl space-y-1 flex-1 flex flex-col justify-start">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={13} className="text-amber-500" /> Nhật ký &amp; Ghi chú của KTV
                          </span>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic leading-relaxed mt-1 flex-1">
                            "{session.danh_gia_hieu_qua}"
                          </p>
                        </div>
                      )}

                      {session.canh_bao_dac_biet && (
                        <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex gap-2.5 text-rose-800 dark:text-rose-400 shrink-0">
                          <ShieldAlert size={15} className="text-rose-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] uppercase font-black tracking-wider text-rose-500 block">Chống chỉ định / Cảnh báo</span>
                            <p className="text-xs font-bold">{session.canh_bao_dac_biet}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cột phải: Thước đo chỉ số đau (VAS) */}
                    <div className="flex">
                      {(session.danh_gia_truoc_buoi !== null || session.danh_gia_sau_buoi !== null) && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-750 rounded-2xl space-y-4 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-wider mb-3">Chỉ số mức độ đau (VAS)</p>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Trước trị liệu</span>
                                <span className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 block tabular-nums">{session.danh_gia_truoc_buoi ?? '—'}</span>
                              </div>
                              <div className="p-3 bg-[#0D9488]/10 rounded-xl text-center border border-[#0D9488]/20">
                                <span className="text-[9px] text-[#0D9488] uppercase font-black tracking-wider block">Sau trị liệu</span>
                                <span className="text-2xl font-black text-[#0D9488] mt-1 block tabular-nums">{session.danh_gia_sau_buoi ?? '—'}</span>
                              </div>
                            </div>

                            {/* Thanh slider gradient VAS */}
                            {session.danh_gia_truoc_buoi !== null && session.danh_gia_sau_buoi !== null && (
                              <div className="space-y-1.5 pt-4">
                                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                  <span>0 (Không đau)</span>
                                  <span>10 (Rất dữ dội)</span>
                                </div>
                                <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-30" />
                                  {session.danh_gia_truoc_buoi !== session.danh_gia_sau_buoi && (
                                    <div
                                      className={`absolute top-0 bottom-0 opacity-40 transition-all ${
                                        session.danh_gia_sau_buoi < session.danh_gia_truoc_buoi ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`}
                                      style={{
                                        left: `${Math.min(session.danh_gia_truoc_buoi, session.danh_gia_sau_buoi) * 10}%`,
                                        width: `${Math.abs(session.danh_gia_sau_buoi - session.danh_gia_truoc_buoi) * 10}%`
                                      }}
                                    />
                                  )}
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-400 border border-white rounded-full -ml-1.25 transition-all shadow-xs"
                                    style={{ left: `${session.danh_gia_truoc_buoi * 10}%` }}
                                    title={`Trước: ${session.danh_gia_truoc_buoi}`}
                                  />
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#0D9488] border border-white rounded-full -ml-1.75 transition-all shadow-sm"
                                    style={{ left: `${session.danh_gia_sau_buoi * 10}%` }}
                                    title={`Sau: ${session.danh_gia_sau_buoi}`}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Bảng chi tiết mô tả thang điểm đau */}
                            <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800 mt-4">
                              {session.danh_gia_truoc_buoi !== null && (
                                <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="size-2 rounded-full bg-slate-400 mt-1 shrink-0" />
                                  <p className="leading-tight">
                                    <span className="font-extrabold text-slate-700 dark:text-slate-200">Mức {session.danh_gia_truoc_buoi} (Trước):</span> {getVasDescription(session.danh_gia_truoc_buoi)}
                                  </p>
                                </div>
                              )}
                              {session.danh_gia_sau_buoi !== null && (
                                <div className="flex items-start gap-2 text-[11px] text-[#0D9488]">
                                  <span className="size-2 rounded-full bg-[#0D9488] mt-1 shrink-0" />
                                  <p className="leading-tight">
                                    <span className="font-extrabold text-[#0D9488]">Mức {session.danh_gia_sau_buoi} (Sau):</span> {getVasDescription(session.danh_gia_sau_buoi)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {session.danh_gia_truoc_buoi !== null && session.danh_gia_sau_buoi !== null && session.danh_gia_truoc_buoi !== session.danh_gia_sau_buoi && (
                            <div className="flex justify-center pt-2">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                  session.danh_gia_sau_buoi < session.danh_gia_truoc_buoi
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400'
                                    : 'text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400'
                                }`}
                              >
                                {session.danh_gia_sau_buoi < session.danh_gia_truoc_buoi ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                {session.danh_gia_sau_buoi < session.danh_gia_truoc_buoi ? 'Giảm' : 'Tăng'} {Math.abs(session.danh_gia_sau_buoi - session.danh_gia_truoc_buoi)} điểm đau so với trước trị liệu
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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

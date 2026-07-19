import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, ShieldAlert, MessageSquareText, ImageIcon, BadgeCheck, Package } from 'lucide-react';
import { PatientVisit, TreatmentPlan } from '../../../api/doctor.api';
import { resolveImageUrl } from '../../../../../utils/imageUrl';
import { getStaffRoleTitle } from '../../../../../utils/staff';

interface VisitDetailModalProps {
  visit: PatientVisit;
  linkedPlan?: TreatmentPlan | null;
  onClose: () => void;
  onJumpToPlan: (planId: string) => void;
}

const formatDateTime = (d?: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return 'N/A'; }
};

/** Popup chi tiết 1 lượt khám lâm sàng hoặc dịch vụ lẻ. Nếu là ca khám đã dẫn tới 1 phác đồ được
 * kích hoạt, hiện banner liên kết ngược để nhảy sang popup phác đồ đó. */
export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({ visit, linkedPlan, onClose, onJumpToPlan }) => {
  const isKham = visit.loai === 'KHAM';

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
          <h3 className="text-lg font-black text-secondary dark:text-zinc-100 leading-snug">
            {isKham ? 'Khám lâm sàng & Lượng giá' : (visit.ten_dich_vu || 'Trị liệu dịch vụ lẻ')}
          </h3>
          <button onClick={onClose} className="size-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 flex-wrap text-xs font-bold text-zinc-400">
            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${isKham ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
              {isKham ? 'Khám lâm sàng' : 'Dịch vụ lẻ'}
            </span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(visit.thoi_gian)}</span>
            {visit.ma_lich_dat && <span className="font-mono bg-primary/10 text-primary px-2.5 py-1 rounded">{visit.ma_lich_dat}</span>}
          </div>

          {isKham ? (
            <>
              <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl">
                <p className="text-[11px] uppercase font-black text-zinc-400 tracking-wider">Chẩn đoán lâm sàng</p>
                <p className="text-sm font-bold text-secondary dark:text-zinc-100 mt-1.5">{visit.chan_doan || 'Chưa ghi nhận'}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl">
                <p className="text-[11px] uppercase font-black text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <MessageSquareText size={14} /> Lý do khám
                </p>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mt-1.5">{visit.ly_do_kham || 'Không có ghi chú.'}</p>
              </div>
              {visit.chong_chi_dinh && (
                <div className="bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl text-rose-700 dark:text-rose-400 flex gap-2.5">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-rose-500 text-[11px]">Chống chỉ định</p>
                    <p className="font-semibold mt-1 text-sm">{visit.chong_chi_dinh}</p>
                  </div>
                </div>
              )}
              {visit.anh_dinh_kem_url && (
                <div>
                  <p className="text-[11px] uppercase font-black text-zinc-400 tracking-wider flex items-center gap-1.5 mb-2">
                    <ImageIcon size={14} /> Ảnh đính kèm
                  </p>
                  <a
                    href={resolveImageUrl(visit.anh_dinh_kem_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center"
                  >
                    <img src={resolveImageUrl(visit.anh_dinh_kem_url)} alt="Ảnh đính kèm" className="max-h-80 w-full object-contain" />
                  </a>
                </div>
              )}
              {visit.khuyen_nghi_goi && (
                <span className="inline-flex items-center gap-2 text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-150/40 dark:border-emerald-900/30 px-3 py-1.5 rounded-lg uppercase tracking-tight">
                  <BadgeCheck size={13} /> Gói khuyến nghị: {visit.khuyen_nghi_goi}
                </span>
              )}
              {visit.ghi_chu && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-850/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60 italic">
                  Dặn dò: "{visit.ghi_chu}"
                </div>
              )}
            </>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl">
              <p className="text-[11px] uppercase font-black text-zinc-400 tracking-wider">Ghi chú buổi</p>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mt-1.5">{visit.ghi_chu || 'Chưa ghi nhận.'}</p>
            </div>
          )}

          {linkedPlan && (
            <button
              type="button"
              onClick={() => onJumpToPlan(linkedPlan.id)}
              className="w-full flex items-center gap-3.5 rounded-2xl p-4 border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
            >
              <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Ca khám này đã chỉ định phác đồ</p>
                <p className="text-sm font-bold text-secondary dark:text-zinc-100">{linkedPlan.ten_goi} ({linkedPlan.tong_so_buoi} buổi)</p>
              </div>
            </button>
          )}

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex items-center gap-3.5">
            {visit.anh_nhan_su ? (
              <img src={resolveImageUrl(visit.anh_nhan_su)} alt={visit.ten_nhan_su || ''} className="size-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
            ) : (
              <div className="size-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-base shrink-0">
                {visit.ten_nhan_su?.trim()?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] uppercase font-black text-zinc-400 tracking-wider">Người thực hiện</p>
              <h4 className="text-sm font-black text-secondary dark:text-zinc-100 truncate">{visit.ten_nhan_su || 'Đang cập nhật'}</h4>
              <p className="text-xs font-semibold text-zinc-400 truncate">{getStaffRoleTitle(visit.ten_nhan_su, undefined)}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

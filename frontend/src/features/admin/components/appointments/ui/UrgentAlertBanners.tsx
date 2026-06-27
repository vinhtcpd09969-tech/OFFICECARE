import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment } from '../types';

interface UrgentAlertBannersProps {
  isReceptionist: boolean;
  roleView: 'manager' | 'receptionist' | 'doctor';
  expiringAppointments: Appointment[];
  urgent4hAppointments: Appointment[];
  unconfirmedAppointments: Appointment[];
  handleOpenDetailModal: (apt: Appointment) => void;
}

export function UrgentAlertBanners({
  isReceptionist,
  roleView,
  expiringAppointments,
  urgent4hAppointments,
  unconfirmedAppointments,
  handleOpenDetailModal
}: UrgentAlertBannersProps) {
  return (
    <>
      {/* URGENT EXPIRING APPOINTMENTS BANNER */}
      <AnimatePresence>
        {expiringAppointments.length > 0 && isReceptionist && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleOpenDetailModal(expiringAppointments[0])}
            className="bg-gradient-to-r from-rose-500/10 to-red-600/5 dark:from-rose-500/15 dark:to-red-650/5 hover:from-rose-500/15 hover:to-red-600/10 border border-rose-500/20 dark:border-rose-900/30 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 group shadow-sm active:scale-[0.99] overflow-hidden mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/10 font-black shrink-0 animate-pulse">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-150 font-jakarta flex items-center gap-2">
                  🚨 Có <span className="text-rose-650 dark:text-rose-455 font-black text-base">{expiringAppointments.length}</span> lịch đặt sắp quá hạn xác nhận (dưới 10 phút)!
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                  Cần phân bổ gấp: Bệnh nhân <span className="font-extrabold text-[#0f172a] dark:text-zinc-100">{expiringAppointments[0].ten_khach_hang}</span> sắp hết thời gian giữ chỗ.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-455 bg-rose-500/10 dark:bg-rose-500/20 group-hover:bg-rose-500/20 dark:group-hover:bg-rose-500/30 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider shrink-0"
            >
              Phân bổ ngay →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* URGENT 4H APPOINTMENTS BANNER */}
      <AnimatePresence>
        {urgent4hAppointments.length > 0 && expiringAppointments.length === 0 && !isReceptionist && roleView !== 'doctor' && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleOpenDetailModal(urgent4hAppointments[0])}
            className="bg-gradient-to-r from-amber-500/10 to-orange-600/5 dark:from-amber-500/15 dark:to-orange-655/5 hover:from-amber-500/15 hover:to-orange-600/10 border border-amber-500/20 dark:border-amber-900/30 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 group shadow-sm active:scale-[0.99] overflow-hidden mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/10 font-black shrink-0 animate-pulse">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-150 font-jakarta flex items-center gap-2">
                  ⚠️ Có <span className="text-amber-650 dark:text-amber-450 font-black text-base">{urgent4hAppointments.length}</span> lịch khám sát giờ trong vòng 4 tiếng!
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                  Lịch tiếp theo: Bệnh nhân <span className="font-extrabold text-[#0f172a] dark:text-zinc-100">{urgent4hAppointments[0].ten_khach_hang}</span> bắt đầu lúc {format(new Date(urgent4hAppointments[0].ngay_gio_bat_dau), 'HH:mm')}.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-455 bg-amber-500/10 dark:bg-amber-500/20 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/30 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider shrink-0"
            >
              Phân bổ gấp →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNCONFIRMED APPOINTMENTS ALERT WIDGET */}
      <AnimatePresence>
        {unconfirmedAppointments.length > 0 && isReceptionist && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleOpenDetailModal(unconfirmedAppointments[0])}
            className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/15 dark:to-amber-600/5 hover:from-amber-500/15 hover:to-amber-600/10 border border-amber-500/20 dark:border-amber-900/30 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 group shadow-sm active:scale-[0.99] overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/10 font-black shrink-0 animate-pulse">
                <PhoneCall size={18} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-150 font-jakarta flex items-center gap-2">
                  Còn <span className="text-amber-655 dark:text-amber-450 font-black text-base">{unconfirmedAppointments.length}</span> lịch hẹn mới chưa được xác nhận
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                  Lịch tiếp theo: <span className="font-extrabold text-[#0f172a] dark:text-zinc-100 capitalize">{unconfirmedAppointments[0].ten_khach_hang}</span> lúc <span className="font-extrabold text-amber-700 dark:text-amber-455 bg-amber-50 dark:bg-amber-955/30 border border-amber-100 dark:border-amber-900/20 px-1.5 py-0.5 rounded">{format(new Date(unconfirmedAppointments[0].ngay_gio_bat_dau), 'HH:mm - dd/MM/yyyy')}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-455 bg-amber-500/10 dark:bg-amber-500/20 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/30 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider shrink-0"
            >
              <PhoneCall size={12} /> Gọi xác nhận ngay
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

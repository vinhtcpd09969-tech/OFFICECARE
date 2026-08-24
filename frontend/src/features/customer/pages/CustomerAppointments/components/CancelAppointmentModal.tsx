import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface CancelAppointmentModalProps {
  cancellingId: string | null;
  cancellingAppt: any | null;
  lyDoHuy: string;
  setLyDoHuy: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CancelAppointmentModal({
  cancellingId,
  cancellingAppt,
  lyDoHuy,
  setLyDoHuy,
  onClose,
  onSubmit
}: CancelAppointmentModalProps) {
  if (!cancellingId) return null;

  const getRemainingTimeText = (startDateStr?: string) => {
    if (!startDateStr) return '';
    const startMs = new Date(startDateStr).getTime();
    const nowMs = Date.now();
    const diffMs = startMs - nowMs;
    if (diffMs <= 0) return '0 phút';

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`;
    }
    return `${minutes} phút`;
  };

  const remainingTime = getRemainingTimeText(cancellingAppt?.ngay_gio_bat_dau);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white text-slate-800 rounded-[28px] border border-slate-100 max-w-md w-full p-6 shadow-2xl relative z-10 font-jakarta space-y-4"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/60 shadow-xs">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              Xác nhận Hủy Lịch Hẹn
            </h3>

            {remainingTime && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-amber-200/80">
                <span>⏱️ Lịch hẹn còn</span>
                <span className="text-rose-600 font-black">{remainingTime}</span>
                <span>nữa mới bắt đầu</span>
              </div>
            )}
          </div>

          {/* Hiển thị dòng gợi ý đổi lịch CHỈ khi lịch ĐÃ THANH TOÁN */}
          {cancellingAppt?.trang_thai_thanh_toan === 'da_thanh_toan' && (
            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl text-xs text-slate-600 leading-relaxed font-medium space-y-1">
              <p>
                Nếu có nhu cầu thay đổi lịch hẹn, vui lòng liên hệ Hotline{' '}
                <a href="tel:19006868" className="font-extrabold text-slate-900 hover:text-[#0D9488]">1900 6868</a>{' '}
                hoặc{' '}
                <a
                  href="https://www.facebook.com/profile.php?id=61591064963268"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-extrabold text-[#0D9488] underline hover:text-[#0b7d72]"
                >
                  Chat với phòng khám
                </a>{' '}
                để được hỗ trợ đổi giờ tốt nhất.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1.5 text-left">
              <label htmlFor="lyDoHuyInput" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Lý do hủy lịch *
              </label>
              <textarea
                id="lyDoHuyInput"
                rows={2}
                required
                value={lyDoHuy}
                onChange={(e) => setLyDoHuy(e.target.value)}
                placeholder="Nhập lý do hủy lịch hẹn..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#0D9488] p-3 rounded-xl text-xs font-semibold resize-none outline-none text-slate-800 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer transition-all"
              >
                Vẫn muốn hủy lịch
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

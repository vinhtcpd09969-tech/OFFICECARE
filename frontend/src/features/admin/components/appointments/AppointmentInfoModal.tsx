import { X } from 'lucide-react';

interface AppointmentInfoModalProps {
  appointment: any | null;
  onClose: () => void;
}

// Modal xem nhanh 1 lịch hẹn đã hoàn thành/hủy/chưa tới ca — dùng chung cho Bác sĩ và KTV (trước đây
// chỉ tồn tại ở trang Bác sĩ, KTV bấm vào lịch tương tự không hiển thị gì do thiếu hẳn component này).
export default function AppointmentInfoModal({ appointment, onClose }: AppointmentInfoModalProps) {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] font-bold text-slate-550 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
              {appointment.ma_lich_dat}
            </span>
            <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase mt-2">Thông tin ca khám</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-secondary dark:text-zinc-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Tên bệnh nhân</p>
              <p className="font-bold text-sm mt-1">{appointment.ten_khach_hang}</p>
            </div>
            <div>
              <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Số điện thoại</p>
              <p className="font-bold text-sm mt-1">{appointment.so_dien_thoai}</p>
            </div>
          </div>

          <div>
            <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Giờ hẹn khám</p>
            <p className="font-bold mt-1 text-primary">
              {new Date(appointment.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.ngay_gio_ket_thuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div>
            <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Lý do khám bệnh</p>
            <p className="mt-1 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 font-medium">
              {appointment.ly_do_kham || 'Không có ghi chú lý do.'}
            </p>
          </div>

          {appointment.anh_dinh_kem_url && (
            <div>
              <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Ảnh khách gửi kèm</p>
              <a href={appointment.anh_dinh_kem_url} target="_blank" rel="noopener noreferrer" className="block mt-2 w-40 h-40 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <img src={appointment.anh_dinh_kem_url} alt="Ảnh triệu chứng khách gửi" className="w-full h-full object-cover" />
              </a>
            </div>
          )}

          {appointment.chan_doan && (
            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider text-[9px]">Chẩn đoán lâm sàng</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-zinc-200">
                  {appointment.chan_doan}
                </p>
              </div>

              {appointment.chong_chi_dinh && (
                <div>
                  <p className="text-rose-500 font-bold uppercase tracking-wider text-[9px]">Chống chỉ định điều trị</p>
                  <p className="mt-1 font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-900/20">
                    {appointment.chong_chi_dinh}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

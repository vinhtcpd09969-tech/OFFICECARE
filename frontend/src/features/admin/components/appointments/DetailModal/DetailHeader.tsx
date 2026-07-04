import { X } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface DetailHeaderProps {
  maLichDat: string;
  tenKhachHang: string;
  soDienThoai: string;
  ngayGioBatDau: string;
  aptStartHourStr: string;
  aptEndHourStr: string;
  onClose: () => void;
}

export function DetailHeader({
  maLichDat,
  tenKhachHang,
  soDienThoai,
  ngayGioBatDau,
  aptStartHourStr,
  aptEndHourStr,
  onClose
}: DetailHeaderProps) {
  return (
    <>
      {/* Header Modal */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 transition-colors duration-300">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-zinc-150">
            Hồ sơ Lịch hẹn <span className="text-emerald-600 dark:text-emerald-450">#{maLichDat}</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold mt-1">Thông tin chi tiết và điều phối phòng khám</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Thông tin nhanh khách hàng */}
      <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Khách hàng</label>
          <span className="text-sm font-black text-slate-800 dark:text-zinc-150 block mt-0.5">{tenKhachHang}</span>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Số điện thoại</label>
          <span className="text-sm font-bold text-slate-800 dark:text-zinc-150 block mt-0.5">{soDienThoai}</span>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Khung giờ hẹn</label>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-450 block mt-0.5 font-mono bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-lg w-fit">
            {aptStartHourStr} - {aptEndHourStr}
          </span>
          {(() => {
            const dateObj = new Date(ngayGioBatDau);
            if (isValid(dateObj)) {
              return (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-mono mt-0.5">
                  {format(dateObj, 'dd/MM/yyyy')}
                </span>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </>
  );
}

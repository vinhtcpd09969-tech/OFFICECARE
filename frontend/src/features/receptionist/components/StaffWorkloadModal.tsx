import { useState, useEffect } from 'react';
import { X, Users, Clock, CheckCircle2, RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getStaffWorkload, StaffWorkloadItem } from '../api/receptionist.api';
import { format } from 'date-fns';

interface StaffWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string; // YYYY-MM-DD
}

export function StaffWorkloadModal({ isOpen, onClose, dateStr }: StaffWorkloadModalProps) {
  const [workload, setWorkload] = useState<StaffWorkloadItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const res = await getStaffWorkload(dateStr);
      setWorkload(res.data || []);
    } catch (err: any) {
      console.error('Lỗi tải trạng thái nhân sự:', err);
      toast.error('Không tải được danh sách trạng thái nhân sự.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWorkload();
    }
  }, [isOpen, dateStr]);

  if (!isOpen) return null;

  const ktvList = workload.filter((w) => w.vai_tro_id === 3);
  const specialistList = workload.filter((w) => w.vai_tro_id === 4);

  const formattedDateLabel = dateStr
    ? format(new Date(dateStr), 'dd/MM/yyyy')
    : format(new Date(), 'dd/MM/yyyy');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-md animate-in fade-in duration-200 font-jakarta">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-teal-500/15 text-[#0d9488] dark:text-teal-400 flex items-center justify-center font-black text-xl shadow-inner border border-teal-500/30">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                Trạng Thái Nhân Sự Ca Trực
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Tải làm việc của từng nhân sự ngày <strong className="text-slate-800 dark:text-zinc-200 font-bold">{formattedDateLabel}</strong> trước khi rút ca
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchWorkload}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới trạng thái"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 hide-scrollbar">
          {/* SECT 1: KỸ THUẬT VIÊN (KTV) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-teal-600" />
                <span>Kỹ Thuật Viên (KTV)</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-400">
                {ktvList.length} nhân sự trực ca ngày {formattedDateLabel}
              </span>
            </div>

            {ktvList.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold italic p-3">Chưa có KTV nào lên ca trực ngày {formattedDateLabel}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ktvList.map((stf) => {
                  const maxCap = stf.so_khach_song_song || 2;
                  const currentCap = stf.so_ca_dang_lam || 0;
                  const waitingCap = stf.so_ca_cho || 0;
                  const isFree = currentCap === 0 && waitingCap === 0;
                  const isBusy = currentCap > 0 || waitingCap > 0;

                  let finishTimeStr = '---';
                  if (stf.thoi_gian_xong_du_kien_muon_nhat) {
                    try {
                      finishTimeStr = format(new Date(stf.thoi_gian_xong_du_kien_muon_nhat), 'HH:mm');
                    } catch (e) {}
                  }

                  return (
                    <div
                      key={stf.nhan_su_id}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        isFree
                          ? 'bg-emerald-50/60 dark:bg-emerald-955/30 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-amber-50/50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
                            {stf.ho_ten}
                          </p>
                          <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-medium">
                            {stf.ten_phong || 'Chưa gán phòng'} · Ca: {stf.gio_bat_dau} - {stf.gio_ket_thuc}
                          </p>
                        </div>

                        {/* Status Badge */}
                        {isFree ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={12} /> Đang rảnh bàn
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                            <Clock size={12} /> Bận ({currentCap + waitingCap} ca)
                          </span>
                        )}
                      </div>

                      {/* Chi tiết ca bận / Hàng chờ */}
                      {isBusy && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-[11px] font-semibold space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-zinc-400">Trạng thái bàn:</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              {currentCap > 0 ? (
                                <>
                                  <span>🔴 Đang làm việc ({currentCap}/{maxCap} bàn)</span>
                                  {finishTimeStr !== '---' && (
                                    <span className="text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-955/70 px-1.5 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-800 text-[10.5px] font-extrabold">
                                      (Dự kiến xong ~{finishTimeStr})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-400 font-bold">🟡 Khách đã check-in chờ gọi</span>
                              )}
                            </span>
                          </div>
                          {waitingCap > 0 && (
                            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                              <span>Hàng chờ:</span>
                              <span className="font-black bg-amber-100 dark:bg-amber-955 px-2 py-0.5 rounded-md border border-amber-300/60 text-[10.5px]">
                                {waitingCap} người đang chờ
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECT 2: CHUYÊN VIÊN VLTL */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-600" />
                <span>Chuyên Viên VLTL (Lượng giá & Trị liệu)</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-400">
                {specialistList.length} chuyên viên trực ca ngày {formattedDateLabel}
              </span>
            </div>

            {specialistList.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold italic p-3">Chưa có Chuyên viên nào lên ca trực ngày {formattedDateLabel}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specialistList.map((stf) => {
                  const currentCap = stf.so_ca_dang_lam || 0;
                  const waitingCap = stf.so_ca_cho || 0;
                  const isFree = currentCap === 0 && waitingCap === 0;
                  const isBusy = currentCap > 0 || waitingCap > 0;

                  let finishTimeStr = '---';
                  if (stf.thoi_gian_xong_du_kien_muon_nhat) {
                    try {
                      finishTimeStr = format(new Date(stf.thoi_gian_xong_du_kien_muon_nhat), 'HH:mm');
                    } catch (e) {}
                  }

                  return (
                    <div
                      key={stf.nhan_su_id}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        isFree
                          ? 'bg-emerald-50/60 dark:bg-emerald-955/20 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-amber-50/50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            {stf.ho_ten.trim().split(/\s+/).pop()?.[0] || 'C'}
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-slate-900 dark:text-zinc-100">{stf.ho_ten}</h5>
                            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-400">
                              {stf.ten_phong || 'Bàn lượng giá'} · {stf.gio_bat_dau} - {stf.gio_ket_thuc}
                            </p>
                          </div>
                        </div>

                        {isFree ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={12} /> Rảnh bàn
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                            <Clock size={12} /> Bận ({currentCap + waitingCap} ca)
                          </span>
                        )}
                      </div>

                      {isBusy && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-[11px] font-semibold space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-zinc-400">Trạng thái bàn:</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              {currentCap > 0 ? (
                                <>
                                  <span>🔴 Đang gặp khách</span>
                                  {finishTimeStr !== '---' && (
                                    <span className="text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-955/70 px-1.5 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-800 text-[10.5px] font-extrabold">
                                      (Dự kiến xong ~{finishTimeStr})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-400 font-bold">🟡 Đang có khách chờ gọi vào</span>
                              )}
                            </span>
                          </div>
                          {waitingCap > 0 && (
                            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                              <span>Hàng chờ:</span>
                              <span className="font-black bg-amber-100 dark:bg-amber-955 px-2 py-0.5 rounded-md border border-amber-300/60 text-[10.5px]">
                                {waitingCap} người đang chờ
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="text-slate-500 dark:text-zinc-400 font-medium">
            💡 <strong className="text-slate-700 dark:text-zinc-200">Mô hình PULL:</strong> Khi rút ca về hàng chờ chung, bất kỳ nhân sự nào rảnh sẽ chủ động bấm <span className="text-teal-600 font-bold">[ Gọi vào ]</span> từ bàn làm việc của họ.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer ml-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

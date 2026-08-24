import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles, CheckCircle2, X, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../api/axios';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { resolveImageUrl } from '../../../utils/imageUrl';

type Buoi = 'sang' | 'chieu';
const BUOI_INFO: Record<Buoi, { label: string; khung: string; ketThuc: string }> = {
  sang: { label: 'Buổi sáng', khung: '7:30 - 12:00', ketThuc: '12:00' },
  chieu: { label: 'Buổi chiều', khung: '12:00 - 20:00', ketThuc: '20:00' }
};

interface PackagePlanInfo {
  phac_do_id?: number | string;
  id?: number | string;
  ten_goi: string;
  goi_dich_vu_id: number | string;
  thoi_luong_phut: number;
  tong_so_buoi: number;
  so_buoi_da_dung: number;
  khach_hang_id: number | string;
}

interface BookNextSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packagePlan: PackagePlanInfo | null;
}

export const BookNextSessionModal: React.FC<BookNextSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  packagePlan,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 2), 'yyyy-MM-dd')
  );
  const [selectedBuoi, setSelectedBuoi] = useState<Buoi | ''>('sang');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [lyDo, setLyDo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [buoiAvailability, setBuoiAvailability] = useState<any>({
    sang: { conLaiChung: 0, choPhep: false },
    chieu: { conLaiChung: 0, choPhep: false },
    nhanSu: []
  });

  const nextSessionNumber = (packagePlan?.so_buoi_da_dung || 0) + 1;
  const duration = packagePlan?.thoi_luong_phut || 45;

  // Load available staff and session capacity
  useEffect(() => {
    if (!isOpen || !packagePlan) return;
    const fetchCapacity = async () => {
      try {
        const [availRes, staffRes] = await Promise.all([
          axiosInstance.get('/client/appointments/buoi-availability', {
            params: { date: selectedDate, dichVuId: packagePlan.goi_dich_vu_id }
          }),
          axiosInstance.get('/public/specialists')
        ]);
        setBuoiAvailability(availRes.data || {});
        setStaffList(staffRes.data || []);
      } catch (err) {
        console.error('Error fetching capacity for next session:', err);
      }
    };
    fetchCapacity();
  }, [isOpen, packagePlan, selectedDate]);

  if (!isOpen || !packagePlan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuoi) {
      toast.error('Vui lòng chọn Buổi đặt lịch (Sáng hoặc Chiều).');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/client/appointments', {
        ngay_gio_bat_dau: selectedDate,
        buoi: selectedBuoi,
        loai_cuoc_hen: 'DIEU_TRI',
        goi_dich_vu_id: packagePlan.goi_dich_vu_id,
        phac_do_dieu_tri_id: packagePlan.phac_do_id || packagePlan.id,
        nhan_su_id: selectedStaffId ? Number(selectedStaffId) : null,
        ghi_chu: lyDo || `Đặt buổi ${nextSessionNumber}/${packagePlan.tong_so_buoi} cho gói ${packagePlan.ten_goi}`,
        // Đặt lịch gói đã trả trước 100% -> trạng thái thanh toán tự động da_thanh_toan
        trang_thai_thanh_toan: 'da_thanh_toan'
      });

      toast.success(`🎉 Đã đặt thành công Buổi ${nextSessionNumber}/${packagePlan.tong_so_buoi}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error booking next package session:', err);
      const errMsg = err.response?.data?.message || 'Không thể tạo lịch hẹn buổi tiếp theo. Vui lòng thử lại.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden font-sans text-slate-800 dark:text-zinc-100">

        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest block">
                Gói liệu trình đang thực hiện
              </span>
              <h3 className="text-base font-black tracking-tight font-jakarta">
                Đặt lịch Buổi {nextSessionNumber}/{packagePlan.tong_so_buoi}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Card Thông tin gói & Phân loại thanh toán */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block font-jakarta">
                  {packagePlan.ten_goi}
                </span>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-0.5">
                  Tiến độ phác đồ: <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{packagePlan.so_buoi_da_dung}/{packagePlan.tong_so_buoi} buổi hoàn thành</span>
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs shrink-0">
                🔒 Buổi {nextSessionNumber} (Tuần tự)
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600 dark:text-zinc-300">⏱️ Thời lượng: <strong>{duration} phút</strong></span>
              {(packagePlan as any).hinh_thuc_thanh_toan_goi === 'tung_buoi' ? (
                <span className="text-amber-700 dark:text-amber-300 font-extrabold flex items-center gap-1">
                  🟡 Trả từng buổi (Cần thanh toán tại quầy/online trước khi trị liệu)
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                  🟢 Trả thẳng 100% (Buổi {nextSessionNumber} đã thanh toán - Miễn phí)
                </span>
              )}
            </div>
          </div>

          {/* Chọn ngày hẹn */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block font-jakarta">
              1. Chọn ngày thực hiện *
            </label>
            <div className="flex items-center gap-3">
              <CustomDatePicker
                value={selectedDate}
                minDate={format(new Date(), 'yyyy-MM-dd')}
                onChange={(date: string) => {
                  setSelectedDate(date);
                  setSelectedBuoi('');
                  setSelectedStaffId('');
                }}
                className="w-36"
                align="right"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 italic">
              💡 Khuyên dùng: Nên cách buổi gần nhất từ 2 – 3 ngày để cơ thể kịp phục hồi tốt nhất.
            </p>
          </div>

          {/* Chọn buổi */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block font-jakarta">
              2. Chọn khung buổi nhận khách *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['sang', 'chieu'] as Buoi[]).map((key) => {
                const info = buoiAvailability[key] || { choPhep: true };
                const isSelected = selectedBuoi === key;
                const Icon = key === 'sang' ? Sun : Moon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedBuoi(key)}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-emerald-400'
                      }`}
                  >
                    <div className={`size-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black">{BUOI_INFO[key].label}</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {BUOI_INFO[key].khung}
                      </p>
                      <span className={`text-[9px] font-black block mt-1 ${isSelected ? 'text-white' : info.choPhep !== false ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                        {info.choPhep !== false ? '🟢 Còn chỗ' : '🔴 Đông/Hết chỗ'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn nhân sự (KTV) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block font-jakarta">
              3. Phân bổ Kỹ thuật viên (Tùy chọn)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option Bất kỳ */}
              <button
                type="button"
                onClick={() => setSelectedStaffId('')}
                className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${!selectedStaffId
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700'
                  }`}
              >
                <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${!selectedStaffId ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                  ✨
                </div>
                <div>
                  <p className="text-xs font-black">Bất kỳ (Khuyên dùng)</p>
                  <p className="text-[10px] text-slate-400">Rải tải tốt nhất, phục vụ ngay khi đến</p>
                </div>
              </button>

              {/* Staff List */}
              {staffList.slice(0, 3).map((st: any) => {
                const isSelected = String(selectedStaffId) === String(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStaffId(String(st.id))}
                    className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700'
                      }`}
                  >
                    {st.anh_dai_dien ? (
                      <img src={resolveImageUrl(st.anh_dai_dien)} alt={st.ho_ten} className="size-8 rounded-full object-cover" />
                    ) : (
                      <div className="size-8 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                        KTV
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">{st.ho_ten}</p>
                      <p className="text-[10px] text-slate-400 truncate">{st.chuyen_mon || 'Kỹ thuật viên PHCN'}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Real-time Staff Status Card */}
            <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 text-xs flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
                ⚡
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                  {!selectedStaffId ? (
                    <span>🟢 <strong>Hàng đợi chung</strong>: Tiếp nhận mượt mà theo thứ tự có mặt tại quầy</span>
                  ) : (
                    <span>🟢 KTV <strong>{staffList.find(s => String(s.id) === String(selectedStaffId))?.ho_ten || 'được chọn'}</strong>: Đã được giữ suất ưu tiên cho ca {selectedDate} ({selectedBuoi === 'sang' ? 'Buổi Sáng' : 'Buổi Chiều'})</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ghi chú cho buổi hẹn</label>
            <input
              type="text"
              placeholder="VD: Cảm thấy đỡ đau vai gáy hơn, muốn tập trung vào vùng thắt lưng..."
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Xác nhận đặt Buổi {nextSessionNumber}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

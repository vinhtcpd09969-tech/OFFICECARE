import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../../../stores/authStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../../../../../utils/imageUrl';
import { convertToVietnamUtcIso } from '../../../../../utils/date';
import { api } from '../../../../../shared/api';
import { CustomDatePicker } from '../../../../../components/CustomDatePicker';

interface BookNextSessionModalProps {
  pkg: {
    phac_do_id: string;
    ten_dich_vu: string;
    goi_dich_vu_id: string;
  };
  sessionNum: number;
  onClose: () => void;
}

export function BookNextSessionModal({ pkg, sessionNum, onClose }: BookNextSessionModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowString());
  const [sdt, setSdt] = useState<string>(user?.so_dien_thoai || '');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [lyDo, setLyDo] = useState<string>(`Đặt lịch buổi trị liệu số ${sessionNum} theo gói ${pkg.ten_dich_vu}.`);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<Record<string, number[]>>({});
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Thời lượng gói dịch vụ (lấy động từ API)
  const [duration, setDuration] = useState<number>(75);

  // Lịch sử cuộc hẹn trong ngày của khách hàng để check trùng lịch KH cục bộ
  const [customerDayApts, setCustomerDayApts] = useState<any[]>([]);

  // Trạng thái cho hộp thoại xác nhận 2 lớp
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);

  // 1. Tải thời lượng của gói dịch vụ
  useEffect(() => {
    const fetchPackageDuration = async () => {
      try {
        const res = await api.get('/packages');
        const list = res.data || [];
        const matched = list.find((p: any) => p.id === pkg.goi_dich_vu_id);
        if (matched && matched.thoi_luong_phut) {
          setDuration(Number(matched.thoi_luong_phut));
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin gói:', err);
      }
    };
    fetchPackageDuration();
  }, [pkg.goi_dich_vu_id]);

  // 2. Tải danh sách lịch hẹn của khách hàng trong ngày được chọn để check trùng lịch
  useEffect(() => {
    if (!selectedDate || !user?.id) return;
    const fetchCustomerAppointments = async () => {
      try {
        const res = await api.get('/client/appointments');
        const list = res.data || [];
        const filtered = list.filter((apt: any) => {
          try {
            const aptDateStr = new Date(apt.ngay_gio_bat_dau).toLocaleDateString('en-CA');
            return aptDateStr === selectedDate && apt.trang_thai !== 'da_huy';
          } catch (e) {
            return false;
          }
        });
        setCustomerDayApts(filtered);
      } catch (err) {
        console.error('Lỗi khi tải lịch hẹn của khách hàng:', err);
      }
    };
    fetchCustomerAppointments();
  }, [selectedDate, user?.id]);

  // 3. Tải danh sách ca trống và chuyên gia từ API khi thay đổi ngày hoặc thời lượng
  useEffect(() => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    const userId = user?.id || '';
    const phone = sdt || user?.so_dien_thoai || '';
    const url = `/client/appointments/booked-slots?date=${selectedDate}&userId=${userId}&phone=${phone}&duration=${duration}&dichVuId=${pkg.goi_dich_vu_id}`;

    api.get(url)
      .then((res: any) => {
        setSpecialists(res.data.specialists || []);
        setSlotAvailability(res.data.slotAvailability || {});
        // Reset lựa chọn giờ và nhân viên nếu đổi ngày
        setSelectedTime('');
        setSelectedStaffId('');
      })
      .catch((err: any) => {
        console.error('Lỗi khi tải lịch trống:', err);
        toast.error('Không thể tải lịch trống cho ngày này.');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedDate, duration, user?.id, pkg.goi_dich_vu_id]);

  // 4. Danh sách các khung giờ sinh động dựa trên kết quả trả về từ slotAvailability
  const timeSlots = useMemo(() => {
    return Object.keys(slotAvailability).sort();
  }, [slotAvailability]);

  // 5. Tính toán chi tiết trạng thái của từng slot (Đã qua, Trùng lịch KH, Hết nhân sự, khả dụng)
  const slotDetails = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const isToday = selectedDate === todayStr;
    const isPastDate = selectedDate < todayStr;
    const currentVal = now.getHours() * 60 + now.getMinutes();

    return timeSlots.map((time) => {
      // a. Kiểm tra ngày giờ quá khứ
      if (isPastDate) {
        return { time, available: false, reason: 'ĐÃ QUA' };
      }

      const [sh, sm] = time.split(':').map(Number);
      const slotVal = sh * 60 + sm;
      if (isToday && slotVal < currentVal) {
        return { time, available: false, reason: 'ĐÃ QUA' };
      }

      // b. Kiểm tra trùng lịch hẹn của bệnh nhân
      const slotStart = new Date(`${selectedDate}T${time}:00`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      const hasCustOverlap = customerDayApts.some((apt) => {
        const s2 = new Date(apt.ngay_gio_bat_dau).getTime();
        const e2 = new Date(apt.ngay_gio_ket_thuc).getTime();
        return slotStart.getTime() < e2 && slotEnd.getTime() > s2;
      });

      if (hasCustOverlap) {
        return { time, available: false, reason: 'TRÙNG LỊCH KH' };
      }

      // c. Kiểm tra số nhân sự khả dụng trong ca này
      const availableStaffs = slotAvailability[time] || [];
      const finalCount = availableStaffs.length;

      if (finalCount === 0) {
        return { time, available: false, reason: 'HẾT NHÂN SỰ' };
      }

      return {
        time,
        available: true,
        count: finalCount,
        reason: `CÒN ${finalCount} NV`
      };
    });
  }, [timeSlots, selectedDate, customerDayApts, slotAvailability, duration]);

  // 6. Lọc danh sách nhân viên khả dụng cho ca giờ được chọn
  const availableSpecialistsForSelectedTime = useMemo(() => {
    if (!selectedTime) return [];
    const freeStaffIds = slotAvailability[selectedTime] || [];
    return specialists.map((staff) => {
      const isFree = freeStaffIds.includes(staff.id);
      return {
        ...staff,
        available: isFree,
        reason: isFree ? 'Sẵn sàng' : 'Không trực / Bận ca này'
      };
    });
  }, [selectedTime, slotAvailability, specialists]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày điều trị.');
      return;
    }
    if (!selectedTime) {
      toast.error('Vui lòng chọn khung giờ.');
      return;
    }
    setShowConfirmStep(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading('Đang khởi tạo lịch hẹn trị liệu...');
    const ngay_gio_bat_dau = convertToVietnamUtcIso(selectedDate, selectedTime);

    try {
      const payload = {
        ngay_gio_bat_dau,
        khach_hang_id: user?.id,
        ho_ten_khach: user?.ho_ten || 'Khách hàng',
        so_dien_thoai: sdt,
        gioi_tinh_khach: user?.gioi_tinh || 'nam',
        goi_dich_vu_id: pkg.goi_dich_vu_id,
        phac_do_dieu_tri_id: pkg.phac_do_id,
        so_thu_tu_buoi: sessionNum,
        nhan_su_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
        nguoi_dung_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
        trieu_chung: lyDo,
        ly_do_kham: `Trị liệu theo gói: ${pkg.ten_dich_vu}`
      };

      const response = await api.post('/client/appointments/public', payload);

      if (response.status === 200 || response.status === 201) {
        toast.success('Khởi tạo lịch hẹn thành công!', { id: toastId });
        onClose();
        // Đưa khách về thẳng trang quản lý lịch hẹn của chính họ để xác thực OTP ngay trên thẻ lịch
        // hẹn (không còn chuyển qua trang /booking/success — đó là luồng đặt lịch công khai, không
        // dành cho khách đã đăng nhập). Kèm ngày hẹn để trang tự chuyển view hiển thị đúng buổi mới.
        navigate(`/appointments?date=${selectedDate}`);
      } else {
        toast.error('Không thể đặt lịch hẹn. Vui lòng thử lại.', { id: toastId });
        setShowConfirmStep(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi kết nối máy chủ trị liệu!', { id: toastId });
      setShowConfirmStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormattedDate = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {!showConfirmStep ? (
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-55/60 dark:bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 transition-colors uppercase tracking-wider"
              >
                ← Quay lại bảng
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-850" />
              <div>
                <h3 className="font-heading text-base font-black text-secondary dark:text-zinc-200 flex items-center gap-1.5">
                  🛡️ Đăng ký ca điều trị
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Lập lịch nhanh dịch vụ, tự động xác nhận</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-650 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleOpenConfirm} className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">

            {/* 1. HÀNH CHÍNH KHÁCH HÀNG */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1">
                Hành chính khách hàng
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Card */}
                <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shrink-0">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Khách hàng</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-zinc-250 block mt-0.5">{user?.ho_ten}</span>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold block mt-0.5">SĐT liên hệ: {user?.so_dien_thoai}</span>
                    </div>
                  </div>
                </div>

                {/* SĐT Liên hệ */}
                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Số điện thoại liên hệ cho ca hẹn này</label>
                  <input
                    type="tel"
                    value={sdt}
                    onChange={(e) => setSdt(e.target.value)}
                    placeholder="Nhập số điện thoại liên hệ..."
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-secondary dark:text-zinc-300"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. DỊCH VỤ ĐĂNG KÝ */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1">
                Dịch vụ đăng ký
              </h4>

              <div className="space-y-4">
                {/* Gói Đặt theo Phác đồ */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl relative select-none">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-555 uppercase tracking-widest block">
                    Gói đặt theo phác đồ
                  </span>
                  <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 block mt-0.5 pr-8">
                    {pkg.ten_dich_vu}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-extrabold mt-1.5 px-2 py-0.5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100/50 rounded-md">
                    ⏳ Buổi {sessionNum} ({duration} phút)
                  </span>
                </div>

                {/* Triệu chứng / Ghi chú */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Mô tả triệu chứng / Lý do khám / Ghi chú</label>
                  <textarea
                    rows={2}
                    value={lyDo}
                    onChange={(e) => setLyDo(e.target.value)}
                    placeholder="Mô tả các triệu chứng đau mỏi hiện tại của bạn..."
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary text-secondary dark:text-zinc-300"
                  />
                </div>
              </div>
            </div>

            {/* 3. CHỌN KHUNG GIỜ ĐẶT LỊCH */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-1">
                <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={14} className="text-zinc-400" />
                  Chọn khung giờ đặt lịch
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Ngày khám:</span>
                  <CustomDatePicker
                    value={selectedDate}
                    minDate={getTomorrowString()}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedTime('');
                      setSelectedStaffId('');
                    }}
                    className="w-36"
                  />
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-sm text-zinc-450 animate-pulse font-bold">
                  Đang quét và tính toán các khung giờ trống...
                </div>
              ) : slotDetails.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 italic">
                  Không tìm thấy khung giờ hoạt động khả dụng cho ngày được chọn.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slotDetails.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    const isAvailable = slot.available;

                    let badgeStyle = 'text-zinc-400';
                    if (slot.reason === 'ĐÃ QUA') badgeStyle = 'text-zinc-400 dark:text-zinc-650';
                    else if (slot.reason === 'TRÙNG LỊCH KH') badgeStyle = 'text-rose-500 font-extrabold';
                    else if (slot.reason === 'HẾT NHÂN SỰ') badgeStyle = 'text-amber-500 font-extrabold';
                    else if (isAvailable) badgeStyle = isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400 font-black';

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => {
                          setSelectedTime(slot.time);
                          setSelectedStaffId(''); // Reset chuyên gia khi chọn giờ mới
                        }}
                        className={`py-2 px-1 rounded-2xl border flex flex-col items-center justify-center transition-all ${isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-95'
                            : isAvailable
                              ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-emerald-350 dark:hover:border-emerald-700 hover:shadow-xs'
                              : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-150 dark:border-zinc-850 opacity-60 cursor-not-allowed'
                          }`}
                      >
                        <span className="text-sm font-black font-mono">{slot.time}</span>
                        <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${badgeStyle}`}>
                          {slot.reason}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. PHÂN BỔ NHÂN VIÊN TRỰC */}
            {selectedTime && (
              <div className="space-y-3.5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-1">
                  <h4 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={14} className="text-zinc-400" />
                    Phân bổ Kỹ thuật viên phụ trách
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-semibold italic">(Không bắt buộc)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Option: Hệ thống tự xếp */}
                  <div
                    onClick={() => setSelectedStaffId('')}
                    className={`p-3 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${selectedStaffId === ''
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-2 ring-emerald-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-700'
                      }`}
                  >
                    <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center font-black text-xs shrink-0 border border-zinc-200 dark:border-zinc-755">
                      AUTO
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block">Chọn bất kỳ chuyên gia</span>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-0.5 block">Hệ thống tự động điều phối</span>
                    </div>
                  </div>

                  {/* Available Specialists list */}
                  {availableSpecialistsForSelectedTime.map((staff) => {
                    const isSelected = selectedStaffId === String(staff.id);
                    const isAvailable = staff.available;

                    return (
                      <div
                        key={staff.id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedStaffId(String(staff.id));
                          } else {
                            toast.error(`${staff.ho_ten} không rảnh trong khung giờ này.`);
                          }
                        }}
                        className={`p-3 border rounded-2xl flex items-center gap-3 transition-all ${!isAvailable
                            ? 'border-zinc-150 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-900/30 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-2 ring-emerald-500/10 cursor-pointer'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-700 cursor-pointer'
                          }`}
                      >
                        {staff.anh_dai_dien ? (
                          <img
                            src={resolveImageUrl(staff.anh_dai_dien)}
                            alt={staff.ho_ten}
                            className="size-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-850 shrink-0"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/20">
                            {staff.ho_ten.split(' ').pop()?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block truncate">
                            KTV. {staff.ho_ten}
                          </span>
                          <span className={`text-[9.5px] font-semibold mt-0.5 block ${isAvailable ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'
                            }`}>
                            {staff.ca_truc} {isAvailable && `· ${staff.so_ca} ca`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>

          {/* Modal Footer */}
          <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-55/60 dark:bg-zinc-900/60 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-extrabold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors uppercase tracking-wider"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedTime || isSubmitting}
              onClick={handleOpenConfirm}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#25A89C] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-xs font-black transition-colors uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            >
              <span>Đặt lịch hẹn</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Hộp thoại xác nhận 2 lớp đẹp mắt */
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Calendar size={28} className="stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h4 className="font-heading text-lg font-black text-secondary dark:text-zinc-200">Xác nhận lịch hẹn của bạn</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Bạn có chắc chắn muốn đặt lịch cho buổi tiếp theo của phác đồ này không?
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-850 text-left space-y-2.5">
            <div>
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-black tracking-wider block">Gói dịch vụ</span>
              <span className="text-xs font-bold text-zinc-850 dark:text-zinc-300">{pkg.ten_dich_vu}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-black tracking-wider block">Buổi điều trị</span>
                <span className="text-xs font-bold text-primary">Buổi số {sessionNum}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase font-black tracking-wider block">Thời gian đặt</span>
                <span className="text-xs font-bold text-zinc-850 dark:text-zinc-300">{selectedTime} · {getFormattedDate()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowConfirmStep(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-extrabold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-855 transition-colors uppercase tracking-wider"
            >
              Quay lại sửa
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmSubmit}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#25A89C] text-white text-xs font-black transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Đang đặt...' : 'Xác nhận đặt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookNextSessionModal;

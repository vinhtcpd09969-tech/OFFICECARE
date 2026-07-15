import React, { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, User, Stethoscope, Search, Loader2, CalendarRange, ArrowLeft, X, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../api/axios';
import { convertToVietnamUtcIso } from '../../../../utils/date';
import { isPlanCancelled, isSessionPaymentSatisfied } from '../../../../utils/billing';
import { resolveImageUrl } from '../../../../utils/imageUrl';

/** Buổi kế tiếp của phác đồ đã đủ điều kiện thanh toán để đặt lịch chưa (xem docs/BUSINESS_RULES.md mục 3). */
function isPlanBookable(plan: any): boolean {
  if (!plan || plan.trang_thai === 'khuyen_nghi') return true;
  // Gói đã hủy + hoàn tiền thì chấm dứt hẳn — không phải "thiếu tiền" để thu thêm.
  if (isPlanCancelled(plan)) return false;
  return isSessionPaymentSatisfied(plan, Number(plan.so_buoi_da_dung || 0) + 1);
}

/**
 * Dropdown chọn dịch vụ — thay cho <select> gốc của trình duyệt (không style được, hiện thô).
 * Mỗi dòng là 1 thẻ: tên dịch vụ + chip thời lượng + giá, có trạng thái chọn rõ ràng.
 */
function ServiceSelect({
  services,
  value,
  onChange,
  disabled,
}: {
  services: any[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = services.find((s: any) => String(s.id) === String(value));

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 border rounded-xl text-sm text-left flex items-center justify-between gap-3 transition-all outline-none ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : open
              ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/15 cursor-pointer'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 cursor-pointer'
        }`}
      >
        {selected ? (
          <span className="min-w-0 flex items-center gap-2">
            <span className="font-bold text-slate-800 truncate">{selected.ten_goi}</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-150 px-1.5 py-0.5 rounded shrink-0">
              {selected.thoi_luong_phut}p
            </span>
            <span className="text-[10px] font-black text-emerald-700 shrink-0">
              {Number(selected.don_gia).toLocaleString('vi-VN')}đ
            </span>
          </span>
        ) : (
          <span className="font-semibold text-slate-400">Vui lòng chọn dịch vụ...</span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/5 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {services.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 text-center py-6">Không có dịch vụ phù hợp.</p>
          )}
          {services.map((svc: any) => {
            const isActive = String(svc.id) === String(value);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => {
                  onChange(String(svc.id));
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  isActive ? 'bg-emerald-50 ring-1 ring-emerald-500/25' : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-xs font-black truncate ${isActive ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {svc.ten_goi}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      ⏳ {svc.thoi_luong_phut} phút
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {Number(svc.don_gia).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
                {isActive && <Check size={15} className="text-emerald-600 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface WalkInBookingModalProps {
  roomsList: any[];
  staffList: any[];
  appointments: any[];
  schedulesList: any[];
  servicesList?: any[];
  onClose: () => void;
  onSubmitApi: (payload: any) => Promise<void>;
  bookingLoading: boolean;
  initialTime?: string;
  activeType?: 'kham' | 'dieu_tri';
  isReceptionist?: boolean;
  selectedDateStr: string;
  initialCustomerId?: string;
  initialServiceId?: string;
  onDateChange?: (date: Date) => void;
}


export default function WalkInBookingModal({
  roomsList,
  staffList,
  appointments,
  schedulesList,
  servicesList = [],
  onClose,
  onSubmitApi,
  bookingLoading,
  initialTime = '',
  activeType = 'kham',
  isReceptionist = false,
  selectedDateStr,
  initialCustomerId,
  initialServiceId,
  onDateChange
}: WalkInBookingModalProps) {
  const navigate = useNavigate();
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showPlansList, setShowPlansList] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form states
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [gioiTinh, setGioiTinh] = useState('nam');
  const [email, setEmail] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [selectedDate, setSelectedDate] = useState(selectedDateStr);
  useEffect(() => {
    setSelectedDate(selectedDateStr);
  }, [selectedDateStr]);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'da_checkin' | 'da_xac_nhan'>('da_checkin');

  // Treatment plan / package states
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [packageManuallyCleared, setPackageManuallyCleared] = useState(false);


  // 1. Filter services based on activeType (Kham vs Lieu Trinh Le)
  const filteredServices = React.useMemo(() => {
    return servicesList.filter((svc: any) => {
      if (activeType === 'kham') {
        return svc.loai_goi === 'KHAM' || svc.loai_dich_vu === 'KHAM';
      } else {
        // Chỉ hiện dịch vụ lẻ (1 buổi) khi ở tab điều trị
        return (svc.loai_goi !== 'KHAM' && svc.loai_dich_vu !== 'KHAM') && (svc.tong_so_buoi === 1 || !svc.tong_so_buoi);
      }
    });
  }, [servicesList, activeType]);

  // Cố ý KHÔNG auto-chọn dịch vụ đầu danh sách: lễ tân phải chủ động chọn, tránh lỡ tay
  // đặt nhầm dịch vụ chỉ vì nó tình cờ đứng đầu bảng chữ cái.

  // Auto-expand phác đồ list if selectedPlan changes to true
  useEffect(() => {
    if (selectedPlan) {
      setShowPlansList(true);
    }
  }, [selectedPlan]);

  // Pre-fill initial customer and service from query parameters if provided
  useEffect(() => {
    if (initialCustomerId) {
      const fetchAndSelectCustomer = async () => {
        try {
          const res = await axiosInstance.get('/admin/customers');
          const list = res.data || [];
          const found = list.find((c: any) => String(c.khach_hang_id || c.id) === String(initialCustomerId));
          if (found) {
            const normalized = {
              ...found,
              id: found.khach_hang_id || found.id,
              ho_ten: found.ho_ten,
              so_dien_thoai: found.so_dien_thoai,
              gioi_tinh: found.gioi_tinh,
              email: found.email
            };
            setSelectedCustomer(normalized);
            setHoTen(normalized.ho_ten);
            setSdt(normalized.so_dien_thoai || '');
            setGioiTinh(normalized.gioi_tinh || 'nam');
            setEmail(normalized.email || '');
          }
        } catch (err) {
          console.error('Error pre-filling customer:', err);
        }
      };
      fetchAndSelectCustomer();
    }
  }, [initialCustomerId]);

  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    }
  }, [initialServiceId]);

  useEffect(() => {
    setSelectedTime(initialTime);
  }, [initialTime]);

  const timeDifferenceMinutes = React.useMemo(() => {
    if (!selectedTime) return 9999;
    const now = new Date();
    const isToday = selectedDate === format(now, 'yyyy-MM-dd');
    if (!isToday) return 9999;

    const [sh, sm] = selectedTime.split(':').map(Number);
    const slotVal = sh * 60 + sm;
    const currentVal = now.getHours() * 60 + now.getMinutes();
    return slotVal - currentVal;
  }, [selectedTime, selectedDate]);

  const isTooClose = timeDifferenceMinutes >= 0 && timeDifferenceMinutes <= 60;

  // 2. Autocomplete Search Customers
  useEffect(() => {
    if (isNewCustomer || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/receptionist/customers/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isNewCustomer]);

  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  useEffect(() => {
    if (isNewCustomer || !selectedCustomer || !selectedDate) {
      setHasReachedLimit(false);
      return;
    }
    const checkCustomerBookingLimit = async () => {
      try {
        const res = await axiosInstance.get(`/receptionist/customers/${selectedCustomer.id}/check-limit?date=${selectedDate}`);
        setHasReachedLimit(!!res.data.limitReached);
      } catch (err) {
        console.error('Error checking customer booking limit:', err);
        setHasReachedLimit(false);
      }
    };
    checkCustomerBookingLimit();
  }, [selectedCustomer, selectedDate, isNewCustomer]);

  // 3. Fetch Treatment Plans for Selected Customer
  useEffect(() => {
    if (isNewCustomer || !selectedCustomer) {
      setTreatmentPlans([]);
      setSelectedPlan(null);
      return;
    }
    const fetchPlans = async () => {
      try {
        const res = await axiosInstance.get(`/receptionist/customers/${selectedCustomer.id}/treatment-plans`);
        const list = res.data || [];
        setTreatmentPlans(list);
        setPackageManuallyCleared(false);
        if (initialServiceId) {
          const matched = list.find((p: any) => String(p.goi_dich_vu_id) === String(initialServiceId));
          // Không auto-chọn gói đang bị chặn thanh toán (vd trả góp chưa đóng Đợt 2) — lễ tân
          // sẽ thấy nút "Thanh toán Đợt 2" trong danh sách thay vì một form đặt lịch đặt không được.
          if (matched && isPlanBookable(matched)) {
            setSelectedPlan(matched);
            setSelectedServiceId(matched.goi_dich_vu_id);
          }
        }
      } catch (err) {
        console.error('Error fetching treatment plans:', err);
      }
    };
    fetchPlans();
  }, [selectedCustomer, isNewCustomer]);



  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setHoTen(customer.ho_ten);
    setSdt(customer.so_dien_thoai || '');
    setGioiTinh(customer.gioi_tinh || 'nam');
    setEmail(customer.email || '');
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setHoTen('');
    setSdt('');
    setGioiTinh('nam');
    setEmail('');
    setTreatmentPlans([]);
    setSelectedPlan(null);
    setSelectedServiceId('');
  };

  const handleSelectPlan = (plan: any) => {
    // Gói chưa đủ điều kiện thanh toán thì không cho chọn — backend sẽ chặn ở createAppointment,
    // nên chặn ngay từ đây thay vì để lễ tân điền hết form rồi mới báo lỗi.
    if (!isPlanBookable(plan)) return;
    setSelectedPlan(plan);
    setSelectedServiceId(plan.goi_dich_vu_id);
    setSelectedDoctorId('');
    setSelectedRoomId('');
  };

  const handleClearPlan = () => {
    setSelectedPlan(null);
    setPackageManuallyCleared(true);
    setSelectedServiceId('');
  };

  const goToInstallmentPayment = (plan: any) => {
    const dest = isReceptionist ? '/receptionist/billing' : '/admin/finance';
    navigate(`${dest}?hoa_don_id=${plan.hoa_don_id}`);
  };

  // Determine active service details
  const selectedService = servicesList.find((s: any) => String(s.id) === String(selectedServiceId));
  const isExam = selectedService ? (selectedService.loai_goi === 'KHAM' || selectedService.loai_dich_vu === 'KHAM') : true;

  // 1.5. Tạo baseTimeSlots động dựa trên thời lượng dịch vụ
  const baseTimeSlots = React.useMemo(() => {
    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const slots: string[] = [];
    let current = new Date();
    current.setHours(7, 30, 0, 0); // Bắt đầu lúc 07:30
    
    const end = new Date();
    end.setHours(19, 30, 0, 0); // Giờ hẹn muộn nhất có thể bắt đầu là 19:30
    
    const formatTime = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };
    
    while (current.getTime() <= end.getTime()) {
      slots.push(formatTime(current));
      current = new Date(current.getTime() + duration * 60000);
    }
    return slots;
  }, [selectedService]);

  // 4. Tự động gán phòng khi chọn nhân sự dựa theo ca trực đã được cấu hình
  useEffect(() => {
    if (!selectedDoctorId || !selectedTime) {
      return;
    }
    const docSchedules = schedulesList.filter(s => 
      String(s.nguoi_dung_id) === String(selectedDoctorId) && 
      s.ngay === selectedDate
    );
    const activeSchedule = docSchedules.find(s => {
      if (s.trang_thai !== 'hoat_dong') return false;
      const dutyStart = s.gio_bat_dau.substring(0, 5);
      const dutyEnd = s.gio_ket_thuc.substring(0, 5);
      return dutyStart <= selectedTime && dutyEnd > selectedTime;
    });

    if (activeSchedule && activeSchedule.phong_id) {
      setSelectedRoomId(String(activeSchedule.phong_id));
    } else {
      setSelectedRoomId('');
    }
  }, [selectedDoctorId, selectedTime, schedulesList, selectedDate]);

  // 5. Tính toán Slot Giờ thông minh động (Kiểm tra trùng lịch Khách hàng & Nhân sự và hiển thị lý do)
  const slotDetails = React.useMemo(() => {
    if (!selectedServiceId) return [];

    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    
    // Lọc nhân sự theo vai trò (Bác sĩ cho ca khám, KTV cho ca điều trị)
    const staffToFilter = isExam 
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    // Xem thời gian hiện tại nếu ngày chọn là hôm nay hoặc quá khứ
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const isToday = selectedDate === todayStr;
    const isPastDate = selectedDate < todayStr;
    const currentVal = now.getHours() * 60 + now.getMinutes();

    // Lấy danh sách lịch hẹn trùng của khách hàng được chọn trong ngày đặt lịch này
    const occupiedCustomerApts = (!isNewCustomer && selectedCustomer)
      ? appointments.filter(apt => 
          String(apt.khach_hang_id) === String(selectedCustomer.id) &&
          apt.trang_thai !== 'da_huy' &&
          apt.trang_thai !== 'khong_den' &&
          format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd') === selectedDate
        )
      : [];

    return baseTimeSlots.map(time => {
      // 1. Kiểm tra ngày/giờ quá khứ
      if (isPastDate) {
        return { time, available: false, count: 0, reason: 'Đã qua' };
      }

      const [sh, sm] = time.split(':').map(Number);
      const slotVal = sh * 60 + sm;
      if (isToday && slotVal < currentVal) {
        return { time, available: false, count: 0, reason: 'Đã qua' };
      }

      // Tính giờ bắt đầu và kết thúc của ca hẹn
      const aptStartLocal = new Date(`${selectedDate}T${time}:00`);
      const aptEndLocal = new Date(aptStartLocal.getTime() + duration * 60000);

      const isOverlapping = (start1: Date, end1: Date, start2Str: string, end2Str: string) => {
        const s2 = new Date(start2Str).getTime();
        const e2 = new Date(end2Str).getTime();
        return start1.getTime() < e2 && end1.getTime() > s2;
      };

      // 2. Kiểm tra trùng lịch hẹn của bệnh nhân
      const hasCustOverlap = occupiedCustomerApts.some(apt => 
        isOverlapping(aptStartLocal, aptEndLocal, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
      );

      if (hasCustOverlap) {
        return { time, available: false, count: 0, reason: 'Trùng lịch KH' };
      }

      // 3. Kiểm tra ca trực và trùng lịch của nhân viên
      const overlappingApts = appointments.filter(apt => 
        apt.trang_thai !== 'da_huy' &&
        apt.trang_thai !== 'khong_den' &&
        isOverlapping(aptStartLocal, aptEndLocal, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
      );

      const occupiedStaffIds = overlappingApts.map(apt => apt.bac_si_id).filter(Boolean);

      const availableStaff = staffToFilter.filter(doc => {
        const docSchedules = schedulesList.filter(s => 
          String(s.nguoi_dung_id) === String(doc.id) && 
          s.ngay === selectedDate
        );

        if (docSchedules.length === 0) return false;

        const activeSchedule = docSchedules.find(s => s.trang_thai === 'hoat_dong');
        if (!activeSchedule) return false;

        const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
        const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

        // Xem slot giờ này có nằm trọn vẹn trong ca làm việc không
        const endHour = Math.floor((slotVal + duration) / 60);
        const endMin = (slotVal + duration) % 60;
        const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

        const isCovered = dutyStart <= time && dutyEnd >= endTimeStr;
        if (!isCovered) return false;

        const hasOverlap = occupiedStaffIds.includes(doc.id);
        return !hasOverlap;
      });

      const unassignedAptsCount = overlappingApts.filter(apt => !apt.bac_si_id).length;
      const finalCount = Math.max(0, availableStaff.length - unassignedAptsCount);

      if (finalCount === 0) {
        return { time, available: false, count: 0, reason: 'Hết nhân sự' };
      }

      return {
        time,
        available: true,
        count: finalCount,
        reason: `Còn ${finalCount} NV`
      };
    });
  }, [selectedServiceId, selectedDoctorId, appointments, schedulesList, staffList, selectedDate, isExam, selectedService, isNewCustomer, selectedCustomer, isReceptionist, baseTimeSlots]);

  // Real-time resource availability (specifically for the selected time slot, used for room allocation and doctor cards)
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedTime || !selectedServiceId) {
      setAvailableDoctors([]);
      return;
    }

    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const aptStartLocal = new Date(`${selectedDate}T${selectedTime}:00`);
    const aptEndLocal = new Date(aptStartLocal.getTime() + duration * 60000);

    const isOverlapping = (start1: Date, end1: Date, start2Str: string, end2Str: string) => {
      const s2 = new Date(start2Str).getTime();
      const e2 = new Date(end2Str).getTime();
      return start1.getTime() < e2 && end1.getTime() > s2;
    };

    const overlappingApts = appointments.filter(apt => 
      apt.trang_thai !== 'da_huy' &&
      apt.trang_thai !== 'khong_den' &&
      isOverlapping(aptStartLocal, aptEndLocal, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
    );

    const occupiedDoctorIds = overlappingApts.map(apt => apt.bac_si_id).filter(Boolean);

    const staffToFilter = isExam 
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    const filteredDocs = staffToFilter.map(doc => {
      const docAptsCount = (appointments || []).filter(apt => {
        const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
        let aptDateStr = '';
        try {
          aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
        } catch (e) {}
        return String(assignedId) === String(doc.id) &&
          aptDateStr === selectedDate &&
          apt.trang_thai !== 'da_huy' &&
          apt.trang_thai !== 'khong_den' &&
          apt.trang_thai !== 'giu_cho';
      }).length;

      const docSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(doc.id) && 
        s.ngay === selectedDate
      );

      if (docSchedules.length === 0) {
        return { ...doc, occupiedCount: docAptsCount, available: false, reason: 'Không trực hôm nay' };
      }

      const activeSchedule = docSchedules.find(s => s.trang_thai === 'hoat_dong');
      if (!activeSchedule) {
        return { ...doc, occupiedCount: docAptsCount, available: false, reason: 'Nghỉ phép cả ngày' };
      }

      const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
      const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

      const isCovered = dutyStart <= selectedTime && dutyEnd > selectedTime;
      if (!isCovered) {
        return { ...doc, occupiedCount: docAptsCount, available: false, reason: `Trực ca ${dutyStart}-${dutyEnd}` };
      }

      const hasOverlap = occupiedDoctorIds.includes(doc.id);
      if (hasOverlap) {
        return { ...doc, occupiedCount: docAptsCount, available: false, reason: 'Trùng lịch khám khác' };
      }

      return { ...doc, occupiedCount: docAptsCount, available: true, reason: `Trực ca ${dutyStart}-${dutyEnd}` };
    });

    setAvailableDoctors(filteredDocs);

    if (selectedDoctorId) {
      const selectedDocObj = filteredDocs.find(d => String(d.id) === String(selectedDoctorId));
      if (!selectedDocObj || !selectedDocObj.available) {
        setSelectedDoctorId('');
        setSelectedRoomId('');
      }
    }
  }, [selectedTime, selectedServiceId, appointments, schedulesList, staffList, selectedDate, isExam, selectedService, selectedDoctorId]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      toast.error('Vui lòng chọn khung giờ!');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Vui lòng chọn dịch vụ!');
      return;
    }
    if (!isReceptionist && !selectedDoctorId) {
      toast.error('Vui lòng chọn nhân sự phụ trách!');
      return;
    }
    if (!isNewCustomer && !selectedCustomer) {
      toast.error('Vui lòng tìm và chọn khách hàng!');
      return;
    }
    if (selectedPlan && !isPlanBookable(selectedPlan)) {
      const nextSession = Number(selectedPlan.so_buoi_da_dung || 0) + 1;
      toast.error(
        selectedPlan.hinh_thuc_thanh_toan_goi === 'tra_gop'
          ? `Gói trả góp chưa đóng Đợt 2. Vui lòng thu Đợt 2 trước khi đặt buổi số ${nextSession}!`
          : `Gói chưa thanh toán đủ. Vui lòng thu tiền trước khi đặt buổi số ${nextSession}!`
      );
      return;
    }

    // Kiểm tra nếu ngày chọn thuộc về quá khứ
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    if (selectedDate < todayStr) {
      toast.error('Không thể đặt lịch hẹn cho ngày trong quá khứ!');
      return;
    }

    // Kiểm tra nếu giờ chọn thuộc về quá khứ của ngày hôm nay
    if (selectedDate === todayStr) {
      const currentVal = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = selectedTime.split(':').map(Number);
      const slotVal = sh * 60 + sm;
      if (slotVal < currentVal) {
        toast.error('Khung giờ được chọn đã trôi qua. Vui lòng chọn khung giờ khác!');
        return;
      }
    }

    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const startUtcIso = convertToVietnamUtcIso(selectedDate, selectedTime);

    const [h, m] = selectedTime.split(':').map(Number);
    const endMin = (m + duration) % 60;
    const endHour = h + Math.floor((m + duration) / 60);
    const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    const endUtcIso = convertToVietnamUtcIso(selectedDate, endTimeStr);

    const isPlanRec = selectedPlan && selectedPlan.trang_thai === 'khuyen_nghi';
    const activePlan = selectedPlan && !isPlanRec ? selectedPlan : null;

    const payload = {
      khach_hang_id: isNewCustomer ? null : selectedCustomer.id,
      ho_ten_khach: hoTen,
      so_dien_thoai: sdt,
      gioi_tinh_khach: gioiTinh,
      email: email || null,
      ly_do_kham: lyDo || (activePlan ? `Điều trị buổi ${activePlan.so_buoi_da_dung + 1}` : (isPlanRec ? `Trị liệu theo chỉ định: ${selectedPlan.ten_goi_dich_vu}` : 'Khám lượng giá')),
      goi_dich_vu_id: selectedServiceId,
      ngay_gio_bat_dau: startUtcIso,
      ngay_gio_ket_thuc: endUtcIso,
      bac_si_id: isReceptionist ? null : (selectedDoctorId ? Number(selectedDoctorId) : null),
      phong_id: isReceptionist ? null : (selectedRoomId ? Number(selectedRoomId) : null),
      loai_lich: activePlan ? 'dieu_tri' : (isExam ? 'kham_moi' : 'dich_vu_don'),
      phac_do_dieu_tri_id: activePlan ? activePlan.id : null,
      so_thu_tu_buoi: activePlan ? activePlan.so_buoi_da_dung + 1 : null,
      trang_thai: (!isReceptionist && selectedDoctorId) ? bookingStatus : 'cho_xac_nhan',
      ghi_chu_dat_lich: lyDo || (activePlan ? `Đặt lịch trị liệu theo gói ${activePlan.ten_goi_dich_vu}` : (isPlanRec ? 'Đặt lịch trị liệu theo chỉ định y khoa' : 'Lập lịch nhanh tại quầy lễ tân'))
    };

    await onSubmitApi(payload);
  };

  const selectedSlot = slotDetails.find(s => s.time === selectedTime);

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-wider"
            title="Quay lại bảng"
          >
            <ArrowLeft size={16} className="stroke-[3]" />
            <span>Quay lại bảng</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Stethoscope className="text-emerald-600" size={20} />
              Đăng ký ca {activeType === 'kham' ? 'khám' : 'điều trị'} tại quầy
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Lập lịch nhanh dịch vụ, tự động xác nhận
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmitForm} className="space-y-6 text-left">
        
        {/* Tab chọn Khách hàng Cũ / Khách mới */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hành chính bệnh nhân
            </h4>
            {!initialCustomerId && (
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomer(false);
                    handleClearCustomer();
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${!isNewCustomer ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Khách đã có hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomer(true);
                    handleClearCustomer();
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${isNewCustomer ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  + Khách mới (Tạo hồ sơ)
                </button>
              </div>
            )}
          </div>

          {/* Khách hàng đã có hồ sơ - Tìm kiếm Autocomplete */}
          {!isNewCustomer && (
            <div className="space-y-3">
              {!selectedCustomer ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng bằng Tên hoặc Số điện thoại (tối thiểu 2 ký tự)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                  />
                  {searchLoading && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <Loader2 className="animate-spin text-slate-400" size={16} />
                    </div>
                  )}

                  {/* Kết quả tìm kiếm */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                      {searchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 hover:bg-slate-55 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800">{cust.ho_ten}</p>
                            <p className="text-[10px] text-slate-455 font-mono mt-0.5">{cust.so_dien_thoai || 'Không có SĐT'}</p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Chọn</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Đã chọn khách hàng profile card */
                <div className="flex flex-col gap-3">
                  <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-600 text-white rounded-2xl">
                        <User size={18} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Bệnh nhân liên kết</span>
                        <span className="text-sm font-black text-slate-800 block mt-0.5">{hoTen}</span>
                        <span className="text-[10px] text-slate-450 font-semibold block mt-0.5">SĐT liên hệ: {sdt}</span>
                      </div>
                    </div>
                    {!initialCustomerId && (
                      <button
                        type="button"
                        onClick={handleClearCustomer}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-lg transition-all"
                      >
                        Chọn khách hàng khác
                      </button>
                    )}
                  </div>
                  {hasReachedLimit && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
                      <span>⚠️</span>
                      <span>Khách đã đặt tối đa 3 dịch vụ 1 ngày. Vui lòng đặt dịch vụ vào 1 ngày khác.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form tạo mới khách hàng (Nếu là bệnh nhân mới) */}
          {isNewCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Họ tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={hoTen}
                  onChange={e => setHoTen(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10,11}"
                  placeholder="0987654321"
                  value={sdt}
                  onChange={e => setSdt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Giới tính</label>
                <select
                  value={gioiTinh}
                  onChange={e => setGioiTinh(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email khách hàng (nếu có)</label>
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                />
              </div>
            </div>
          )}
        </div>

        {/* SĐT có thể sửa đổi nếu cần liên hệ số khác */}
        {!isNewCustomer && selectedCustomer && (
          <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Số điện thoại liên hệ cho ca hẹn này</label>
            <input
              type="tel"
              required
              pattern="[0-9]{10,11}"
              value={sdt}
              onChange={e => setSdt(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-bold mt-1"
            />
          </div>
        )}

        {/* GÓI LIỆU TRÌNH ĐANG HOẠT ĐỘNG / CHỈ ĐỊNH (Chỉ hiện ở tab điều trị và khi có phác đồ/khuyến nghị) */}
        {activeType === 'dieu_tri' && selectedCustomer && treatmentPlans.length > 0 && (
          <div className="space-y-3">
            {/* Sleek collapse-toggle banner */}
            <div className="bg-emerald-50/65 border border-emerald-250/50 rounded-xl p-3 flex items-center justify-between text-left transition-all">
              <div className="flex items-center gap-2.5">
                <CalendarRange size={16} className="text-emerald-600 shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-black text-emerald-950">
                    {treatmentPlans.some(p => p.trang_thai === 'khuyen_nghi') 
                      ? 'Khách có chỉ định dịch vụ từ Bác sĩ' 
                      : `Khách có gói liệu trình đang hoạt động (${treatmentPlans.length})`}
                  </h4>
                  <p className="text-[10px] text-emerald-800/80 font-bold">
                    👉 {treatmentPlans[0].ten_goi_dich_vu}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlansList(!showPlansList)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0 ${
                  showPlansList 
                    ? 'bg-zinc-200 hover:bg-zinc-300 text-secondary' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {showPlansList ? 'Thu gọn' : 'Xem & Chọn'}
              </button>
            </div>

            {/* List of plans, rendered conditionally */}
            {showPlansList && (
              <div className="space-y-3 bg-emerald-50/10 border border-emerald-100/50 p-4 rounded-xl mt-2 animate-in fade-in duration-200">
                <p className="text-[10px] text-slate-455 font-semibold italic text-left">Chọn gói hoặc chỉ định để tự động điền dịch vụ:</p>
                
                <div className="grid grid-cols-1 gap-2">
                  {treatmentPlans.map((plan) => {
                    const isSelected = selectedPlan?.id === plan.id;
                    const isRec = plan.trang_thai === 'khuyen_nghi';
                    const nextSession = plan.so_buoi_da_dung + 1;
                    const isBlocked = !isPlanBookable(plan);
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan)}
                        className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition-all text-left ${
                          isBlocked
                            ? 'border-rose-200 bg-rose-50/25 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10 cursor-pointer'
                              : isRec
                                ? 'border-amber-200 bg-amber-50/10 hover:border-amber-400 cursor-pointer'
                                : 'border-slate-150 bg-white hover:border-emerald-350 cursor-pointer'
                        }`}
                      >
                        <div className={isBlocked ? 'opacity-70' : ''}>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-slate-800">{plan.ten_goi_dich_vu}</p>
                            {isRec && (
                              <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">Chỉ định</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {isRec
                              ? 'Dịch vụ lẻ/Gói được bác sĩ khuyên dùng'
                              : `Đã dùng: ${plan.so_buoi_da_dung}/${plan.tong_so_buoi} buổi | Ca tiếp theo: Buổi ${nextSession}`
                            }
                          </p>
                          {isBlocked && (
                            <p className="text-[10px] text-rose-600 font-bold mt-1">
                              ⚠️ {plan.hinh_thuc_thanh_toan_goi === 'tra_gop'
                                ? `Chưa đóng Đợt 2 — không thể đặt buổi ${nextSession}.`
                                : `Chưa thanh toán đủ — không thể đặt buổi ${nextSession}.`}
                            </p>
                          )}
                        </div>

                        {isBlocked ? (
                          plan.hoa_don_id ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToInstallmentPayment(plan);
                              }}
                              className="text-[10px] font-black px-3 py-2 rounded-lg shrink-0 bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              💵 {plan.hinh_thuc_thanh_toan_goi === 'tra_gop' ? 'Thanh toán Đợt 2' : 'Thanh toán gói'}
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-rose-500 text-white">
                              Chưa đủ điều kiện
                            </span>
                          )
                        ) : (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : isRec
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isSelected ? 'Đang chọn' : isRec ? 'Chọn đặt lịch' : `Đặt buổi ${nextSession}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedPlan && !initialServiceId && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleClearPlan}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline block text-left"
                    >
                      Hủy chọn gói (Đặt ca điều trị lẻ khác)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dịch vụ khám/trị liệu lẻ (Chỉ cho phép chọn nếu không chọn phác đồ) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
            Dịch vụ đăng ký
          </h4>
          
          {selectedPlan ? (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative select-none">
              <button
                type="button"
                onClick={handleClearPlan}
                title="Hủy khóa dịch vụ này, chọn dịch vụ khác"
                className="absolute top-3 right-3 size-6 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pr-8">
                {selectedPlan.trang_thai === 'khuyen_nghi' ? 'Dịch vụ lẻ chỉ định' : 'Gói đặt theo phác đồ'}
              </span>
              <span className="text-sm font-black text-slate-800 block mt-0.5 pr-8">{selectedPlan.ten_goi_dich_vu}</span>
              {selectedPlan.trang_thai !== 'khuyen_nghi' ? (
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">⏳ Buổi {selectedPlan.so_buoi_da_dung + 1} ({selectedPlan.thoi_luong_phut} phút)</span>
              ) : (
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">⏳ {selectedPlan.thoi_luong_phut} phút (Chỉ định)</span>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Chọn dịch vụ lẻ *</label>
              <ServiceSelect
                services={filteredServices}
                value={selectedServiceId}
                onChange={(id) => {
                  setSelectedServiceId(id);
                  setSelectedDoctorId('');
                  setSelectedRoomId('');
                }}
                disabled={!!initialServiceId && !packageManuallyCleared}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Mô tả triệu chứng / Lý do khám / Ghi chú</label>
            <textarea
              rows={2}
              placeholder="Đau mỏi vai gáy cấp tính sau khi ngủ dậy..."
              value={lyDo}
              onChange={e => setLyDo(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Chọn khung giờ */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              Chọn khung giờ đặt lịch
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngày khám:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedDate(val);
                  setSelectedTime('');
                  setSelectedDoctorId('');
                  setSelectedRoomId('');
                  if (val && onDateChange) {
                    onDateChange(new Date(val));
                  }
                }}
                className="px-3 py-1 bg-emerald-50 text-emerald-750 border border-emerald-150 rounded-lg text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {slotDetails.map(slot => {
              const isSelected = selectedTime === slot.time;
              const isAvailable = slot.available;
              
              let badgeStyle = 'text-slate-400';
              if (slot.reason === 'Đã qua') badgeStyle = 'text-slate-400';
              else if (slot.reason === 'Trùng lịch KH') badgeStyle = 'text-rose-500 font-extrabold';
              else if (slot.reason === 'Hết nhân sự') badgeStyle = 'text-amber-500 font-extrabold';
              else if (isAvailable) badgeStyle = isSelected ? 'text-white' : 'text-emerald-600 font-bold';

              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-95'
                      : isAvailable
                        ? 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:shadow-sm'
                        : 'bg-slate-50 border-slate-200/60 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm font-black font-mono">{slot.time}</span>
                  <span className={`text-[9px] uppercase tracking-wide mt-0.5 ${badgeStyle}`}>
                    {slot.reason}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedTime && selectedSlot && (
          <div className="space-y-3">
            <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-850">
                {selectedSlot.reason === 'Trùng lịch KH' 
                  ? 'Bệnh nhân đã có lịch hẹn trùng lặp trong khung giờ này.'
                  : `Khung giờ khả dụng: Có ${selectedSlot.count} nhân sự sẵn sàng phục vụ.`}
              </span>
            </div>

            {isTooClose && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                <span className="text-lg">⚠️</span>
                <div className="text-xs font-bold text-amber-800 leading-relaxed text-left">
                  <p className="font-extrabold text-[13px] text-amber-900 mb-0.5">Cảnh báo: Ca hẹn quá gần giờ hiện tại!</p>
                  <p>Lịch này đang được đặt cách thời gian hiện tại {timeDifferenceMinutes} phút. Vui lòng tự chủ động điều phối trực tiếp nhân sự và chuẩn bị phòng làm việc hợp lý.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUẢN LÝ THÌ MỚI HIỆN PHẦN CHỌN NHÂN SỰ VÀ TỰ ĐỘNG KHÓA PHÒNG TRỰC */}
        {selectedTime && !isReceptionist && (
          <>
            {/* Chọn Bác Sĩ / KTV (Không bắt buộc) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  {isExam ? 'Phân bổ Bác sĩ phụ trách' : 'Phân bổ Kỹ thuật viên phụ trách'}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold italic">(Không bắt buộc)</span>
              </div>
              
              {selectedDoctorId && (
                <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                  <span className="text-xs font-bold text-slate-500">Trạng thái ca hẹn:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-black cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="bookingStatus"
                        checked={bookingStatus === 'da_checkin'}
                        onChange={() => setBookingStatus('da_checkin')}
                        className="accent-emerald-600"
                      />
                      Khách đã đến (Check-in)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-black cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="bookingStatus"
                        checked={bookingStatus === 'da_xac_nhan'}
                        onChange={() => setBookingStatus('da_xac_nhan')}
                        className="accent-emerald-600"
                      />
                      Đặt lịch trước (Xác nhận)
                    </label>
                  </div>
                </div>
              )}

              {availableDoctors.length === 0 ? (
                <div className="text-sm text-slate-400 italic">Không tìm thấy thông tin nhân sự khả dụng.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableDoctors.map(doc => {
                    const isSelected = String(selectedDoctorId) === String(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => doc.available && setSelectedDoctorId(String(doc.id))}
                        className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all ${
                          doc.available 
                            ? isSelected
                              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10 cursor-pointer'
                              : 'border-slate-150 bg-white hover:border-emerald-300 hover:shadow-sm cursor-pointer'
                            : 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {doc.anh_dai_dien ? (
                          <img
                            src={resolveImageUrl(doc.anh_dai_dien)}
                            alt={doc.ho_ten}
                            className={`w-9 h-9 rounded-full object-cover shrink-0 border-2 ${
                              isSelected && doc.available ? 'border-emerald-500' : 'border-slate-200'
                            } ${doc.available ? '' : 'grayscale'}`}
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            doc.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-555'
                          }`}>
                            {isExam ? 'BS' : 'KTV'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                            <span>{doc.ho_ten}</span>
                            <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-extrabold">{doc.occupiedCount} ca</span>
                          </p>
                          <p className="text-[10px] font-semibold text-slate-450 mt-0.5">{doc.reason}</p>
                        </div>
                        {doc.available && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isSelected ? 'Đã chọn' : 'Sẵn sàng'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TỰ ĐỘNG KHÓA VÀ HIỂN THỊ PHÒNG TRỰC CỦA CHUYÊN GIA (Không cho chọn thủ công) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  Phòng chuyên khoa / trị liệu gán ca trực
                </h4>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center select-none animate-in fade-in duration-200">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phòng trực ca làm việc</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">
                    {selectedRoomId ? (roomsList.find(r => String(r.id) === String(selectedRoomId))?.ten_phong || 'Phòng làm việc') : 'Chưa xếp phòng trực'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                    {selectedDoctorId ? '✓ Tự động gán theo cấu hình ca trực' : '⚠️ Sẽ tự động phân phòng khi gán nhân sự'}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-400 bg-slate-100/80 px-3 py-1 rounded-xl">Đã khóa</span>
              </div>
            </div>
          </>
        )}
      </form>

      {/* Footer Buttons */}
      <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-650 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
        >
          Quay lại bảng
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold rounded-xl hover:bg-rose-100/60 transition-all active:scale-95"
        >
          Hủy tạo lịch
        </button>
        <button
          type="button"
          disabled={bookingLoading || !selectedTime || !selectedServiceId || (!isNewCustomer && !selectedCustomer) || (!isReceptionist && !selectedDoctorId) || hasReachedLimit || (!!selectedPlan && !isPlanBookable(selectedPlan))}
          onClick={() => {
            const form = document.querySelector('form');
            if (form) form.requestSubmit();
          }}
          className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {bookingLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang ghi nhận...
            </>
          ) : (
            'Xác nhận đăng ký'
          )}
        </button>
      </div>
    </div>
  );
}

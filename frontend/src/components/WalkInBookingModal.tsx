import React, { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, User, Stethoscope, Search, Loader2, CalendarRange, ArrowLeft, X, ChevronDown, Check, Sun, Moon, Users, CheckCircle2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import axiosInstance from '../api/axios';
import { isPlanCancelled, isSessionPaymentSatisfied } from '../utils/billing';
import { resolveImageUrl } from '../utils/imageUrl';
import { statusConfig } from './appointmentStatusConfig';
import { CustomDatePicker } from './CustomDatePicker';
import { getSmartSearchScore } from '../utils/smartSearch';

type Buoi = 'sang' | 'chieu';
const BUOI_INFO: Record<Buoi, { label: string; khung: string; ketThuc: string }> = {
  sang: { label: 'Buổi sáng', khung: '7:30 - 12:00', ketThuc: '12:00' },
  chieu: { label: 'Buổi chiều', khung: '12:00 - 19:30', ketThuc: '19:30' }
};

/** Mirror `isBuoiDaQua` phía backend/domain/capacity.ts — buổi đặt cho hôm nay đã qua giờ nhận
 * khách kết thúc thì không cho đặt nữa; ngày quá khứ luôn coi là đã qua. */
function isBuoiDaQua(dateStr: string, buoi: Buoi): boolean {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = BUOI_INFO[buoi].ketThuc.split(':').map(Number);
  return nowMinutes >= h * 60 + m;
}

// Khớp đúng quy tắc validate phía backend (appointment.repository.ts::createAppointment) — dùng
// zod thay cho required/pattern gốc của trình duyệt vì tooltip mặc định ("Please match the
// requested format.") không dịch được và không đồng bộ giao diện với phần còn lại của app.
const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
const nameRegex = /^[\p{L}\s']{2,}$/u;

const newCustomerSchema = z.object({
  hoTen: z.string().trim()
    .min(2, 'Họ tên khách hàng phải có ít nhất 2 ký tự.')
    .regex(nameRegex, 'Họ tên khách hàng chỉ được chứa chữ cái và khoảng trắng.'),
  sdt: z.string().trim()
    .regex(phoneRegex, 'Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).'),
  email: z.string().trim()
    .min(1, 'Email khách hàng là bắt buộc.')
    .email('Địa chỉ email không đúng định dạng.'),
});

type NewCustomerErrors = Partial<Record<keyof z.infer<typeof newCustomerSchema>, string>>;

/** Buổi kế tiếp của phác đồ đã đủ điều kiện thanh toán để đặt lịch chưa (xem docs/BUSINESS_RULES.md mục 3). */
function isPlanBookable(plan: any): boolean {
  if (!plan || plan.trang_thai === 'khuyen_nghi') return true;
  // Gói đã hủy + hoàn tiền thì chấm dứt hẳn — không phải "thiếu tiền" để thu thêm.
  if (isPlanCancelled(plan)) return false;
  // Đã có buổi đang hoạt động (chưa xác nhận/đã xác nhận/đã check-in/đang khám) — backend
  // (appointment.repository.ts::createAppointment) chặn cứng đặt thêm cho tới khi buổi này
  // xong/hủy, nên chặn ngay từ đây thay vì để lễ tân điền hết form rồi mới báo lỗi.
  if (plan.lich_dang_hoat_dong) return false;
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
            ? 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
            : open
              ? 'bg-white dark:bg-zinc-900 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/15 cursor-pointer text-slate-800 dark:text-zinc-100'
              : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 cursor-pointer text-slate-800 dark:text-zinc-100'
        }`}
      >
        {selected ? (
          <span className="min-w-0 flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-zinc-100 truncate">{selected.ten_goi}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded shrink-0">
              {selected.thoi_luong_phut}p
            </span>
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 shrink-0">
              {Number(selected.don_gia).toLocaleString('vi-VN')}đ
            </span>
          </span>
        ) : (
          <span className="font-semibold text-slate-400 dark:text-zinc-400">Vui lòng chọn dịch vụ...</span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 dark:text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {services.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 text-center py-6">Không có dịch vụ phù hợp.</p>
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
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-emerald-500/25 dark:ring-emerald-500/50' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/80'
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-xs font-black truncate ${isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-zinc-100'}`}>
                    {svc.ten_goi}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      ⏳ {svc.thoi_luong_phut} phút
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
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
  const [newCustomerErrors, setNewCustomerErrors] = useState<NewCustomerErrors>({});
  const [sdt, setSdt] = useState('');
  const [gioiTinh, setGioiTinh] = useState('nam');
  const [email, setEmail] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [selectedDate, setSelectedDate] = useState(selectedDateStr);
  useEffect(() => {
    setSelectedDate(selectedDateStr);
  }, [selectedDateStr]);

  const [selectedBuoi, setSelectedBuoi] = useState<Buoi | ''>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'da_checkin' | 'da_xac_nhan'>('da_checkin');

  // Sức chứa 2 buổi (sáng/chiều) cho ngày+dịch vụ đang chọn — cùng nguồn A1 dùng cho trang đặt lịch
  // khách hàng (getBuoiAvailability), để Lễ tân/Admin và khách luôn thấy cùng một sự thật.
  const [buoiAvailability, setBuoiAvailability] = useState<{
    sang: { conLaiChung: number; choPhep: boolean };
    chieu: { conLaiChung: number; choPhep: boolean };
    nhanSu: Array<{ id: number; ho_ten: string; anh_dai_dien: string | null; caTruc: string; conLaiSang: number; conLaiChieu: number }>;
  }>({ sang: { conLaiChung: 0, choPhep: false }, chieu: { conLaiChung: 0, choPhep: false }, nhanSu: [] });

  // Treatment plan / package states
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [packageManuallyCleared, setPackageManuallyCleared] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);


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
    } else {
      setSelectedCustomer(null);
      setHoTen('');
      setSdt('');
      setEmail('');
      setGioiTinh('nam');
      setSelectedPlan(null);
    }
  }, [initialCustomerId]);

  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    } else {
      setSelectedServiceId('');
    }
  }, [initialServiceId]);

  // initialTime (giờ cụ thể, di sản từ mô hình slot cũ) chỉ còn dùng để suy ra buổi mặc định khi
  // mở modal từ 1 ô lịch cụ thể — trước 12h là buổi sáng, còn lại là buổi chiều.
  useEffect(() => {
    if (!initialTime) return;
    const [h] = initialTime.split(':').map(Number);
    setSelectedBuoi(h < 12 ? 'sang' : 'chieu');
  }, [initialTime]);

  // Buổi đang chọn (kể cả buổi MẶC ĐỊNH vừa suy ra từ initialTime ở trên) mà đã qua giờ nhận khách
  // thì phải tự bỏ chọn — nếu không, phần "Phân bổ nhân sự" bên dưới vẫn hiện sẵn sàng cho một buổi
  // không còn đặt được nữa (bug thật đã gặp: initialTime mặc định '09:00' tự chọn buổi sáng dù lúc
  // mở modal đã qua cả 2 buổi trong ngày).
  useEffect(() => {
    if (selectedBuoi && isBuoiDaQua(selectedDate, selectedBuoi)) {
      setSelectedBuoi('');
    }
  }, [selectedBuoi, selectedDate]);

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
        const rawList = res.data || [];
        const sorted = rawList
          .map((c: any) => {
            const nameScore = getSmartSearchScore(c.ho_ten || '', searchQuery);
            const phoneScore = (c.so_dien_thoai || '').includes(searchQuery.trim()) ? 80 : 0;
            const score = Math.max(nameScore, phoneScore);
            return { c, score };
          })
          .filter((item: any) => item.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .map((item: any) => item.c);

        setSearchResults(sorted);
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
          if (matched && matched.trang_thai === 'dang_dieu_tri' && isPlanBookable(matched)) {
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
    setNewCustomerErrors({});
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
    // Đợt 2 của trả góp thu hết đúng phần còn lại của hóa đơn — deep-link ?hoa_don_id= (mở thẳng
    // modal chi tiết hóa đơn, "Thu tiền ngay" = đúng dư nợ hiện tại) là chính xác cho trường hợp
    // này. NHƯNG với từng buổi, số cần thu là số tiền CỦA ĐÚNG BUỔI TIẾP THEO, không phải cả dư nợ
    // còn lại của hóa đơn (dư nợ gồm cả các buổi tương lai chưa tới) — phải đi qua đúng luồng
    // checkout theo customer_id + goi_dich_vu_id (cùng nguồn getTungBuoiSessionDue mà backend
    // dùng để ghi sổ), nếu không sẽ bắt thu nhầm nguyên giá trị gói còn lại.
    const dest = isReceptionist ? '/receptionist/billing' : '/admin/finance';
    if (plan.hinh_thuc_thanh_toan_goi === 'tung_buoi' && selectedCustomer) {
      const checkoutDest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
      navigate(`${checkoutDest}?customer_id=${selectedCustomer.id}&goi_dich_vu_id=${plan.goi_dich_vu_id}`);
      return;
    }
    navigate(`${dest}?hoa_don_id=${plan.hoa_don_id}`);
  };

  // Chỉ định liệu trình (trang_thai='khuyen_nghi') chưa hề được thanh toán/kích hoạt — CHƯA có gì
  // để "đặt lịch buổi 1" cả (phác đồ còn chưa tồn tại). Phải đưa lễ tân qua đúng luồng thanh toán
  // để chọn hình thức (trả thẳng/trả góp/từng buổi) và kích hoạt phác đồ trước, không cho phép tạo
  // thẳng 1 cuộc hẹn rời rạc gắn với gói chưa tồn tại.
  const goToPackageActivation = (plan: any) => {
    const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
    navigate(`${dest}?lich_dat_id=${plan.cuoc_hen_id}`);
  };

  // Determine active service details
  const selectedService = servicesList.find((s: any) => String(s.id) === String(selectedServiceId));
  const isExam = selectedService ? (selectedService.loai_goi === 'KHAM' || selectedService.loai_dich_vu === 'KHAM') : true;

  // A1 — sức chứa 2 buổi cho ngày+dịch vụ đang chọn (thay hoàn toàn lưới giờ 30 phút cũ)
  useEffect(() => {
    if (!selectedDate || !selectedServiceId) {
      setBuoiAvailability({ sang: { conLaiChung: 0, choPhep: false }, chieu: { conLaiChung: 0, choPhep: false }, nhanSu: [] });
      return;
    }
    let cancelled = false;
    axiosInstance.get('/client/appointments/buoi-availability', { params: { date: selectedDate, dichVuId: selectedServiceId } })
      .then(res => { if (!cancelled) setBuoiAvailability(res.data); })
      .catch(() => { if (!cancelled) setBuoiAvailability({ sang: { conLaiChung: 0, choPhep: false }, chieu: { conLaiChung: 0, choPhep: false }, nhanSu: [] }); });
    return () => { cancelled = true; };
  }, [selectedDate, selectedServiceId]);

  // Tự động gán phòng khi chọn nhân sự — theo đúng ca trực của người đó trong ngày (không cần giờ
  // cụ thể nữa, vì buổi đã ánh xạ 1-1 với đúng 1 ca trực thực tế trong dữ liệu mẫu/hiện có).
  useEffect(() => {
    if (!selectedDoctorId) {
      setSelectedRoomId('');
      return;
    }
    const activeSchedule = schedulesList.find(s =>
      String(s.nguoi_dung_id) === String(selectedDoctorId) &&
      s.ngay === selectedDate &&
      s.trang_thai === 'hoat_dong'
    );
    setSelectedRoomId(activeSchedule?.phong_id ? String(activeSchedule.phong_id) : '');
  }, [selectedDoctorId, selectedDate, schedulesList]);

  // Nhân sự còn đủ chỗ riêng cho buổi đang chọn — cùng nguồn ngân sách phút với buoiAvailability,
  // ghép thêm số ca trong ngày (đọc từ `appointments` đã tải sẵn) để hiển thị cho Quản lý tham khảo.
  const availableDoctors = React.useMemo(() => {
    if (!selectedBuoi || !selectedServiceId) return [];
    const duration = selectedService ? (selectedService.thoi_luong_phut || 30) : 30;
    const staffToFilter = isExam
      ? staffList.filter(s => s.vai_tro === 'Bác sĩ')
      : staffList.filter(s => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'KTV');

    return staffToFilter.map(doc => {
      const docAptsCount = (appointments || []).filter(apt => {
        const assignedId = apt.bac_si_id || apt.chuyen_gia_id;
        let aptDateStr = '';
        try {
          aptDateStr = format(new Date(apt.ngay_gio_bat_dau || ''), 'yyyy-MM-dd');
        } catch (e) {}
        return String(assignedId) === String(doc.id) &&
          aptDateStr === selectedDate &&
          apt.trang_thai !== 'da_huy' &&
          apt.trang_thai !== 'khong_den';
      }).length;

      const nhanSuInfo = buoiAvailability.nhanSu.find(n => String(n.id) === String(doc.id));
      if (!nhanSuInfo) {
        return { ...doc, occupiedCount: docAptsCount, available: false, reason: 'Không trực hôm nay' };
      }

      const conLai = selectedBuoi === 'sang' ? nhanSuInfo.conLaiSang : nhanSuInfo.conLaiChieu;
      if (conLai < duration) {
        return { ...doc, occupiedCount: docAptsCount, available: false, reason: `Trực ${nhanSuInfo.caTruc} — không đủ chỗ`, endsEarly: false };
      }

      const gioKetThucTruc = nhanSuInfo.caTruc.split('-')[1];

      // Nhân sự đã TAN CA THẬT (giờ hiện tại đã qua giờ kết thúc ca trực) khi đặt cho HÔM NAY —
      // họ không còn ở phòng khám nữa nên phải khóa hẳn, không chỉ cảnh báo. `conLai` chỉ trừ theo
      // ngân sách phút của buổi, không biết đồng hồ thực tế đã trôi qua khỏi ca trực chưa.
      if (selectedDate === format(new Date(), 'yyyy-MM-dd') && gioKetThucTruc) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const [endH, endM] = gioKetThucTruc.split(':').map(Number);
        if (nowMinutes >= endH * 60 + endM) {
          return { ...doc, occupiedCount: docAptsCount, available: false, reason: `Đã tan ca (${nhanSuInfo.caTruc}) — không còn tại phòng khám`, endsEarly: false };
        }
      }

      // Cảnh báo khi nhân sự tan ca SỚM HƠN mốc kết thúc buổi (vd trực tới 16h nhưng buổi chiều
      // kéo dài tới 19h30) — ngân sách phút đã chặn đúng theo phần giao thực (không cho đặt dịch
      // vụ dài hơn phần còn lại), nhưng lễ tân vẫn có thể hiểu lầm khách "đến muộn trong buổi" là
      // bình thường rồi hẹn khách tới sát giờ đóng cửa trong khi nhân sự này đã về từ lâu. Cảnh báo
      // thuần hiển thị — KHÔNG chặn chọn, vì ngân sách phút đã tự bảo vệ phần thời lượng rồi.
      const gioKetThucBuoi = BUOI_INFO[selectedBuoi].ketThuc;
      const endsEarly = !!gioKetThucTruc && gioKetThucTruc < gioKetThucBuoi;

      return { ...doc, occupiedCount: docAptsCount, available: true, reason: `Trực ${nhanSuInfo.caTruc}`, endsEarly, gioKetThucTruc };
    });
  }, [selectedBuoi, selectedServiceId, buoiAvailability, staffList, appointments, selectedDate, isExam, selectedService]);

  useEffect(() => {
    if (!selectedDoctorId) return;
    const selectedDocObj = availableDoctors.find(d => String(d.id) === String(selectedDoctorId));
    if (!selectedDocObj || !selectedDocObj.available) {
      setSelectedDoctorId('');
      setSelectedRoomId('');
    }
  }, [availableDoctors, selectedDoctorId]);

  const handleProceedToPayment = async () => {
    setShowPaymentModal(false);
    let customerId = selectedCustomer?.id;
    if (isNewCustomer) {
      try {
        const res = await axiosInstance.post('/admin/customers', {
          ho_ten: hoTen,
          so_dien_thoai: sdt,
          gioi_tinh: gioiTinh,
          email: email || null
        });
        customerId = res.data?.id || res.data?.customer?.id;
      } catch (err: any) {
        toast.error('Không thể tạo thông tin khách hàng mới');
        return;
      }
    }

    const isPlanRec = selectedPlan && selectedPlan.trang_thai === 'khuyen_nghi';
    const activePlan = selectedPlan && !isPlanRec ? selectedPlan : null;

    const draftPayload = {
      khach_hang_id: customerId,
      ho_ten_khach: hoTen,
      so_dien_thoai: sdt,
      gioi_tinh_khach: gioiTinh,
      email: email || null,
      ly_do_kham: lyDo || (activePlan ? `Điều trị buổi ${activePlan.so_buoi_da_dung + 1}` : (isPlanRec ? `Trị liệu theo chỉ định: ${selectedPlan.ten_goi_dich_vu}` : 'Khám lượng giá')),
      goi_dich_vu_id: selectedServiceId,
      ngay: selectedDate,
      buoi: selectedBuoi,
      bac_si_id: selectedDoctorId ? Number(selectedDoctorId) : null,
      phong_id: selectedRoomId ? Number(selectedRoomId) : null,
      loai_lich: activePlan ? 'dieu_tri' : (isExam ? 'kham_moi' : 'dich_vu_don'),
      phac_do_dieu_tri_id: activePlan ? activePlan.id : null,
      so_thu_tu_buoi: activePlan ? activePlan.so_buoi_da_dung + 1 : null,
      trang_thai: 'da_checkin',
      ghi_chu_dat_lich: lyDo || (activePlan ? `Đặt lịch trị liệu theo gói ${activePlan.ten_goi_dich_vu}` : (isPlanRec ? 'Đặt lịch trị liệu theo chỉ định y khoa' : 'Lập lịch nhanh tại quầy lễ tân'))
    };

    sessionStorage.setItem('draft_walkin_checkin', JSON.stringify(draftPayload));
    onClose();

    const billingRoute = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
    toast.success('💳 Chuyển sang màn hình thu tiền. Vui lòng thanh toán để tạo & Check-in ca hẹn!');
    navigate(`${billingRoute}?draft_walkin=true`);
  };

  const executeSubmit = async (shouldPayNow: boolean, overrideStatus?: 'da_checkin' | 'da_xac_nhan') => {
    const isPlanRec = selectedPlan && selectedPlan.trang_thai === 'khuyen_nghi';
    const activePlan = selectedPlan && !isPlanRec ? selectedPlan : null;
    const finalStatus = overrideStatus || (shouldPayNow ? 'da_xac_nhan' : bookingStatus);

    const payload = {
      khach_hang_id: isNewCustomer ? null : selectedCustomer.id,
      ho_ten_khach: hoTen,
      so_dien_thoai: sdt,
      gioi_tinh_khach: gioiTinh,
      email: email || null,
      ly_do_kham: lyDo || (activePlan ? `Điều trị buổi ${activePlan.so_buoi_da_dung + 1}` : (isPlanRec ? `Trị liệu theo chỉ định: ${selectedPlan.ten_goi_dich_vu}` : 'Khám lượng giá')),
      goi_dich_vu_id: selectedServiceId,
      ngay: selectedDate,
      buoi: selectedBuoi,
      bac_si_id: selectedDoctorId ? Number(selectedDoctorId) : null,
      phong_id: selectedRoomId ? Number(selectedRoomId) : null,
      loai_lich: activePlan ? 'dieu_tri' : (isExam ? 'kham_moi' : 'dich_vu_don'),
      phac_do_dieu_tri_id: activePlan ? activePlan.id : null,
      so_thu_tu_buoi: activePlan ? activePlan.so_buoi_da_dung + 1 : null,
      trang_thai: finalStatus,
      shouldPayNow,
      ghi_chu_dat_lich: lyDo || (activePlan ? `Đặt lịch trị liệu theo gói ${activePlan.ten_goi_dich_vu}` : (isPlanRec ? 'Đặt lịch trị liệu theo chỉ định y khoa' : 'Lập lịch nhanh tại quầy lễ tân'))
    };

    await onSubmitApi(payload);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuoi) {
      toast.error('Vui lòng chọn buổi!');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Vui lòng chọn dịch vụ!');
      return;
    }
    if (!isNewCustomer && !selectedCustomer) {
      toast.error('Vui lòng tìm và chọn khách hàng!');
      return;
    }
    if (isNewCustomer) {
      const parsed = newCustomerSchema.safeParse({ hoTen, sdt, email });
      if (!parsed.success) {
        const errs: NewCustomerErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof NewCustomerErrors;
          if (!errs[field]) errs[field] = issue.message;
        }
        setNewCustomerErrors(errs);
        toast.error(parsed.error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin khách hàng mới.');
        return;
      }
      setNewCustomerErrors({});
    } else if (sdt && !phoneRegex.test(sdt.trim())) {
      toast.error('Số điện thoại liên hệ không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
      return;
    }
    if (selectedPlan && !isPlanBookable(selectedPlan)) {
      const nextSession = Number(selectedPlan.so_buoi_da_dung || 0) + 1;
      toast.error(
        selectedPlan.lich_dang_hoat_dong
          ? `Buổi ${selectedPlan.lich_dang_hoat_dong.so_thu_tu_buoi} của gói này đang có lịch hoạt động. Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt buổi tiếp theo!`
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

    // Buổi đã qua giờ nhận khách (chốt thô, mirror backend isBuoiDaQua)
    if (isBuoiDaQua(selectedDate, selectedBuoi)) {
      toast.error('Buổi được chọn đã qua giờ nhận khách. Vui lòng chọn buổi khác!');
      return;
    }

    const servicePrice = Number(selectedService?.don_gia ?? selectedService?.gia_dich_vu ?? selectedService?.gia_tien ?? 0);
    const requiresPrepayment = bookingStatus === 'da_checkin' && isExam && servicePrice > 0;

    if (requiresPrepayment) {
      // Bật popup thông báo thu tiền trước khi Check-in ca Lượng giá
      setShowPaymentModal(true);
      return;
    }

    await executeSubmit(false);
  };

  const buoiOptions = (['sang', 'chieu'] as Buoi[]).map(key => {
    const info = buoiAvailability[key];
    const daQua = isBuoiDaQua(selectedDate, key);
    return { key, info, daQua, disabled: daQua || !info.choPhep };
  });

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header Pro Max */}
      <div className="pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 font-jakarta">
              Đăng ký ca {activeType === 'kham' ? 'khám lượng giá' : 'điều trị'} tại quầy
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">
              Lập lịch nhanh dịch vụ, tự động xác nhận
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-9 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
          title="Đóng form"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmitForm} noValidate className="space-y-6 text-left">
        
        {/* Tab chọn Khách hàng Cũ / Khách mới */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2">
            <h4 className="text-xs font-black text-slate-400 dark:text-zinc-400 uppercase tracking-wider font-jakarta">
              Hành chính bệnh nhân
            </h4>
            {!initialCustomerId && (
              <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomer(false);
                    handleClearCustomer();
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all font-black ${!isNewCustomer ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                >
                  Khách đã có hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomer(true);
                    handleClearCustomer();
                  }}
                  className={`px-3.5 py-1.5 rounded-lg transition-all font-black ${isNewCustomer ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
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
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng bằng Tên hoặc Số điện thoại (tối thiểu 2 ký tự)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold text-slate-800 dark:text-zinc-100"
                  />
                  {searchLoading && (
                    <div className="absolute inset-y-0 right-3.5 flex items-center">
                      <Loader2 className="animate-spin text-teal-600 dark:text-teal-400" size={18} />
                    </div>
                  )}

                  {/* Kết quả tìm kiếm Pro Max */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-zinc-800 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      {searchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 rounded-xl cursor-pointer flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0">
                              {(cust.ho_ten || 'K').trim().split(/\s+/).pop()?.[0] || 'K'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-900 dark:text-zinc-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                  {cust.ho_ten}
                                </p>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                  {cust.ma_khach_hang || `KH-${cust.id}`}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                                SĐT: {cust.so_dien_thoai || 'Không có SĐT'} {cust.email ? `· ${cust.email}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-3 py-1 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-all shadow-2xs">
                            🚀 Chọn
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Đã chọn khách hàng profile card Pro Max */
                <div className="flex flex-col gap-3">
                  <div className="bg-gradient-to-r from-teal-50/80 to-cyan-50/80 dark:from-teal-950/40 dark:to-cyan-950/40 border border-teal-200/80 dark:border-teal-800/60 p-4 rounded-2xl flex justify-between items-center animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest block">
                            Bệnh nhân đã chọn
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                            {selectedCustomer.ma_khach_hang || `KH-${selectedCustomer.id}`}
                          </span>
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-zinc-100 block mt-0.5 font-jakarta">
                          {hoTen}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-semibold block mt-0.5 font-mono">
                          SĐT: <strong>{sdt}</strong> {email ? `· Email: ${email}` : ''}
                        </span>
                      </div>
                    </div>
                    {!initialCustomerId && (
                      <button
                        type="button"
                        onClick={handleClearCustomer}
                        className="px-3.5 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-105"
                      >
                        ✕ Chọn khách hàng khác
                      </button>
                    )}
                  </div>
                  {hasReachedLimit && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
                      <span>⚠️</span>
                      <span>Khách đang có tối đa 3 lịch chưa hoàn thành/chưa hủy. Cần hoàn thành hoặc hủy bớt lịch hiện có trước khi đặt thêm.</span>
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
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Họ tên khách hàng *</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={hoTen}
                  onChange={e => {
                    setHoTen(e.target.value);
                    if (newCustomerErrors.hoTen) setNewCustomerErrors(prev => ({ ...prev, hoTen: undefined }));
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border rounded-xl text-sm outline-none focus:ring-2 transition-all font-semibold text-slate-800 dark:text-zinc-100 ${newCustomerErrors.hoTen ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 dark:border-zinc-700 focus:ring-emerald-500/20'}`}
                />
                {newCustomerErrors.hoTen && <p className="text-rose-500 text-[11px] font-semibold mt-1">{newCustomerErrors.hoTen}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Số điện thoại *</label>
                <input
                  type="tel"
                  placeholder="0987654321"
                  value={sdt}
                  onChange={e => {
                    setSdt(e.target.value);
                    if (newCustomerErrors.sdt) setNewCustomerErrors(prev => ({ ...prev, sdt: undefined }));
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border rounded-xl text-sm outline-none focus:ring-2 transition-all font-mono font-semibold text-slate-800 dark:text-zinc-100 ${newCustomerErrors.sdt ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 dark:border-zinc-700 focus:ring-emerald-500/20'}`}
                />
                {newCustomerErrors.sdt && <p className="text-rose-500 text-[11px] font-semibold mt-1 font-sans">{newCustomerErrors.sdt}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Giới tính</label>
                <select
                  value={gioiTinh}
                  onChange={e => setGioiTinh(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold text-slate-800 dark:text-zinc-100"
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Email khách hàng *</label>
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (newCustomerErrors.email) setNewCustomerErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border rounded-xl text-sm outline-none focus:ring-2 transition-all font-semibold text-slate-800 dark:text-zinc-100 ${newCustomerErrors.email ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 dark:border-zinc-700 focus:ring-emerald-500/20'}`}
                />
                {newCustomerErrors.email && <p className="text-rose-500 text-[11px] font-semibold mt-1">{newCustomerErrors.email}</p>}
              </div>
              <div className="space-y-1 col-span-1 md:col-span-2">
                <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 rounded-xl font-bold flex items-start gap-2">
                  <span className="mt-0.5">ℹ️</span>
                  <span>Mật khẩu mặc định là <strong>123456</strong>. Vui lòng xin đúng email thật của khách — đây là email dùng để đăng nhập và xác thực OTP sau này. Các trường khác như địa chỉ khách hàng có thể tự cập nhật sau.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SĐT có thể sửa đổi nếu cần liên hệ số khác */}
        {!isNewCustomer && selectedCustomer && (
          <div className="space-y-1 bg-slate-50/50 dark:bg-zinc-800/80 p-3 rounded-xl border border-slate-100 dark:border-zinc-700">
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">Số điện thoại liên hệ cho ca hẹn này</label>
            <input
              type="tel"
              value={sdt}
              onChange={e => setSdt(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-bold text-slate-800 dark:text-zinc-100 mt-1"
            />
          </div>
        )}

        {/* GÓI LIỆU TRÌNH ĐANG HOẠT ĐỘNG / CHỈ ĐỊNH (Chỉ hiện ở tab điều trị và khi có phác đồ/khuyến nghị) */}
        {activeType === 'dieu_tri' && selectedCustomer && treatmentPlans.length > 0 && (
          <div className="space-y-3">
            {/* Sleek collapse-toggle banner */}
            <div className="bg-emerald-50/65 dark:bg-emerald-950/60 border border-emerald-250/50 dark:border-emerald-800/60 rounded-xl p-3 flex items-center justify-between text-left transition-all">
              <div className="flex items-center gap-2.5">
                <CalendarRange size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-black text-emerald-950 dark:text-emerald-200">
                    {treatmentPlans.some(p => p.trang_thai === 'khuyen_nghi') 
                      ? 'Khách có chỉ định dịch vụ từ Chuyên viên' 
                      : `Khách có gói liệu trình đang hoạt động (${treatmentPlans.length})`}
                  </h4>
                  <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300 font-bold">
                    👉 {treatmentPlans[0].ten_goi_dich_vu}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlansList(!showPlansList)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0 cursor-pointer ${
                  showPlansList 
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {showPlansList ? 'Thu gọn' : 'Xem & Chọn'}
              </button>
            </div>

            {/* List of plans, rendered conditionally */}
            {showPlansList && (
              <div className="space-y-3 bg-emerald-50/10 dark:bg-zinc-900 border border-emerald-100/50 dark:border-zinc-800 p-4 rounded-xl mt-2 animate-in fade-in duration-200">
                <p className="text-[10px] text-slate-400 dark:text-zinc-400 font-semibold italic text-left">Chọn gói hoặc chỉ định để tự động điền dịch vụ:</p>
                
                <div className="grid grid-cols-1 gap-2">
                  {treatmentPlans.map((plan) => {
                    const isSelected = selectedPlan?.id === plan.id;
                    const isRec = plan.trang_thai === 'khuyen_nghi';
                    const nextSession = plan.so_buoi_da_dung + 1;
                    const hasActiveAppt = !!plan.lich_dang_hoat_dong;
                    const isBlocked = !isPlanBookable(plan);
                    return (
                      <div
                        key={plan.id}
                        onClick={() => (isRec ? goToPackageActivation(plan) : handleSelectPlan(plan))}
                        className={`p-3 border rounded-xl flex items-center justify-between gap-3 transition-all text-left ${
                          isBlocked
                            ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/25 dark:bg-rose-950/20 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/10 cursor-pointer'
                              : isRec
                                ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/10 dark:bg-amber-950/20 hover:border-amber-400 cursor-pointer'
                                : 'border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-350 dark:hover:border-emerald-600 cursor-pointer'
                        }`}
                      >
                        <div className={isBlocked ? 'opacity-70' : ''}>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-slate-800 dark:text-zinc-100">{plan.ten_goi_dich_vu}</p>
                            {isRec && (
                              <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">Chỉ định</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {isRec
                              ? 'Chuyên viên chỉ định — chưa thanh toán/kích hoạt'
                              : hasActiveAppt
                                ? `Đã dùng: ${plan.so_buoi_da_dung}/${plan.tong_so_buoi} buổi | Buổi ${plan.lich_dang_hoat_dong.so_thu_tu_buoi} đã có lịch`
                                : `Đã dùng: ${plan.so_buoi_da_dung}/${plan.tong_so_buoi} buổi | Ca tiếp theo: Buổi ${nextSession}`
                            }
                          </p>
                          {isBlocked && (
                            <p className="text-[10px] text-rose-600 font-bold mt-1">
                              {hasActiveAppt
                                ? `📅 Buổi ${plan.lich_dang_hoat_dong.so_thu_tu_buoi}: ${format(new Date(plan.lich_dang_hoat_dong.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} (${statusConfig[plan.lich_dang_hoat_dong.trang_thai]?.label || plan.lich_dang_hoat_dong.trang_thai}) — hoàn thành/hủy buổi này trước khi đặt tiếp.`
                                : `⚠️ Chưa thanh toán đủ — không thể đặt buổi ${nextSession}.`}
                            </p>
                          )}
                        </div>

                        {isBlocked ? (
                          hasActiveAppt ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-blue-500 text-white">
                              Đã đặt lịch
                            </span>
                          ) : plan.hoa_don_id ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToInstallmentPayment(plan);
                              }}
                              className="text-[10px] font-black px-3 py-2 rounded-lg shrink-0 bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              💵 Thanh toán
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
                            {isSelected ? 'Đang chọn' : isRec ? '💵 Thanh toán & Kích hoạt' : `Đặt buổi ${nextSession}`}
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

        {/* Chọn buổi */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              Chọn buổi đặt lịch
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngày khám:</span>
              <CustomDatePicker
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setSelectedBuoi('');
                  setSelectedDoctorId('');
                  setSelectedRoomId('');
                  if (date && onDateChange) {
                    onDateChange(new Date(date));
                  }
                }}
                className="w-36"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {buoiOptions.map(({ key, info, daQua, disabled }) => {
              const isSelected = selectedBuoi === key;
              const Icon = key === 'sang' ? Sun : Moon;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedBuoi(key)}
                  className={`text-left p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                    disabled
                      ? 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/60 dark:border-zinc-800/60 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    disabled ? 'bg-slate-200 dark:bg-zinc-700 text-slate-400' : isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black">{BUOI_INFO[key].label}</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{BUOI_INFO[key].khung}</p>
                    <p className={`text-[10px] font-black mt-1 ${disabled ? 'text-slate-400' : isSelected ? 'text-white' : 'text-emerald-600'}`}>
                      {daQua ? 'Đã qua giờ nhận khách' : !info.choPhep ? 'Hết chỗ' : 'Còn chỗ'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CHỌN NHÂN SỰ VÀ TRẠNG THÁI CA HẸN (DÙNG CHUNG CHO CẢ ADMIN VÀ LỄ TÂN) */}
        {selectedBuoi && (
          <>
            {/* Trạng thái ca hẹn */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block font-jakarta">
                Trạng thái đăng ký ca hẹn
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookingStatus('da_checkin')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                    bookingStatus === 'da_checkin'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-emerald-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                    bookingStatus === 'da_checkin' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black">Khách tại quầy (Check-in ngay)</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${bookingStatus === 'da_checkin' ? 'text-white/80' : 'text-slate-400'}`}>
                      {isExam ? 'Bắt buộc thu tiền Lượng giá để vào hàng đợi' : 'Vào thẳng hàng đợi (Thu tiền linh hoạt)'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingStatus('da_xac_nhan')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                    bookingStatus === 'da_xac_nhan'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-emerald-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                    bookingStatus === 'da_xac_nhan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <CalendarRange size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black">Đặt trước (Đã xác nhận)</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${bookingStatus === 'da_xac_nhan' ? 'text-white/80' : 'text-slate-400'}`}>
                      Lưu lịch hẹn trước, check-in sau khi khách tới
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Chọn Bác Sĩ / KTV (Chỉ hiển thị cho Quản lý / Admin — Lễ tân không phân bổ nhân sự, luôn vào bể chung) */}
            {!isReceptionist && (
              <>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-slate-400 dark:text-zinc-400" />
                      {isExam ? 'Phân bổ Chuyên viên phụ trách' : 'Phân bổ Kỹ thuật viên phụ trách'}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold italic">(Có thể chọn Bất kỳ)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Thẻ Nút: Bất kỳ / Không phân bổ */}
                    <div
                      onClick={() => {
                        setSelectedDoctorId('');
                        setSelectedRoomId('');
                      }}
                      className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                        !selectedDoctorId
                          ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 ring-2 ring-emerald-500/10'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        !selectedDoctorId ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                      }`}>
                        <Users size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate">
                          Bất kỳ (Hàng đợi chung)
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          Chưa gán đích danh — Nhân sự rảnh bấm gọi
                        </p>
                      </div>
                      {!selectedDoctorId && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          Đã chọn
                        </span>
                      )}
                    </div>

                    {/* Danh sách nhân sự khả dụng */}
                    {availableDoctors.map(doc => {
                      const isSelected = String(selectedDoctorId) === String(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => doc.available && setSelectedDoctorId(String(doc.id))}
                          className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all ${
                            doc.available
                              ? isSelected
                                ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 ring-2 ring-emerald-500/10 cursor-pointer'
                                : doc.endsEarly
                                  ? 'border-amber-300 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400 hover:shadow-sm cursor-pointer'
                                  : 'border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm cursor-pointer'
                              : 'border-slate-100 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-800/60 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {doc.anh_dai_dien ? (
                            <img
                              src={resolveImageUrl(doc.anh_dai_dien)}
                              alt={doc.ho_ten}
                              className={`w-9 h-9 rounded-full object-cover shrink-0 border-2 ${
                                isSelected && doc.available ? 'border-emerald-500' : 'border-slate-200 dark:border-zinc-700'
                              } ${doc.available ? '' : 'grayscale'}`}
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              doc.available ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                            }`}>
                              {isExam ? 'BS' : 'KTV'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate flex items-center gap-1.5">
                              <span>{doc.ho_ten}</span>
                              <span className="text-[9px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded font-extrabold">{doc.occupiedCount} ca</span>
                            </p>
                            <p className={`text-[10px] font-semibold mt-0.5 ${doc.endsEarly ? 'text-amber-600 dark:text-amber-450 font-black' : 'text-slate-400 dark:text-zinc-400'}`}>
                              {doc.endsEarly ? `⚠️ ${doc.reason} — chỉ nhận khách đến trước ${doc.gioKetThucTruc}` : doc.reason}
                            </p>
                          </div>
                          {doc.available && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {isSelected ? 'Đã chọn' : 'Sẵn sàng'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TỰ ĐỘNG KHÓA VÀ HIỂN THỊ PHÒNG TRỰC CỦA CHUYÊN GIA (Không cho chọn thủ công) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400 dark:text-zinc-400" />
                      Phòng chuyên khoa / trị liệu gán ca trực
                    </h4>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl flex justify-between items-center select-none animate-in fade-in duration-200">
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
          </>
        )}
      </form>

      {/* Footer Buttons Static */}
      <div className="pt-5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white dark:bg-zinc-900">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-zinc-700 shadow-2xs hover:scale-105"
        >
          <ArrowLeft size={16} className="text-teal-600 dark:text-teal-400 stroke-[3]" />
          <span>QUAY LẠI BẢNG</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-950/80 transition-all cursor-pointer"
          >
            ✕ HỦY TẠO
          </button>
          <button
            type="button"
            disabled={bookingLoading || !selectedBuoi || !selectedServiceId || (!isNewCustomer && !selectedCustomer) || hasReachedLimit || (!!selectedPlan && !isPlanBookable(selectedPlan))}
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-jakarta"
          >
            {bookingLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang ghi nhận...
              </>
            ) : (
              '🚀 XÁC NHẬN ĐĂNG KÝ (ENTER)'
            )}
          </button>
        </div>
      </div>

      {/* POPUP THÔNG BÁO YÊU CẦU THANH TOÁN TRƯỚC KHI CHECK-IN CA LƯỢNG GIÁ */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-jakarta relative">
            {/* Nút X đóng modal */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
              title="Đóng / Hủy bỏ"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CreditCard size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">
                Xác Nhận Thu Tiền Lượng Giá
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Theo quy định phòng khám, <strong className="text-slate-700 dark:text-zinc-200">ca Lượng giá bắt buộc phải hoàn tất thu tiền</strong> trước khi đưa bệnh nhân vào Hàng đợi Check-in.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 p-4 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-700 dark:text-zinc-300">
                Dịch vụ: <span className="text-emerald-700 dark:text-emerald-400 font-black">{selectedService?.ten_goi || selectedService?.ten_dich_vu || 'Lượng giá PHCN'}</span>
              </p>
              <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm mt-1">
                Số tiền cần thu: {Number(selectedService?.don_gia ?? selectedService?.gia_dich_vu ?? 0).toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                <span>CHUYỂN SANG THU TIỀN NGAY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setBookingStatus('da_xac_nhan');
                  executeSubmit(false, 'da_xac_nhan');
                }}
                className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Lưu ca ở trạng thái Đặt Trước (Chưa Check-in)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

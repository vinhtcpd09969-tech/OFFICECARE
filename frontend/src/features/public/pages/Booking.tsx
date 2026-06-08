import { useReducer, useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  User,
  Info,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  Award,
  Star,
  Lock,
  ArrowRight,
  Upload,
  X,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const timeSlots = [
  '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

interface BookingState {
  selectedDate: string;
  selectedTime: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  formData: {
    ho_ten_khach: string;
    so_dien_thoai: string;
    gioi_tinh_khach: string;
    trieu_chung: string;
    ly_do_kham: string;
    anh_dinh_kem_url: string;
  };
}

type BookingAction =
  | { type: 'SET_DATE', date: string }
  | { type: 'SET_TIME', time: string }
  | { type: 'SET_FORM_FIELD', field: string, value: string }
  | { type: 'SET_SUBMITTING', isSubmitting: boolean }
  | { type: 'SET_SUCCESS', isSuccess: boolean };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.date, selectedTime: '' };
    case 'SET_TIME':
      return { ...state, selectedTime: action.time };
    case 'SET_FORM_FIELD':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SET_SUCCESS':
      return { ...state, isSuccess: action.isSuccess };
    default:
      return state;
  }
}

const fullDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Generate available date list for the next 14 days
const generateAvailableDates = (): Date[] => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + i);
    dates.push(nextDate);
  }
  return dates;
};

// Mock consistent spots available based on date string
const getMockAvailableSlots = (dateStr: string): number => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 5) + 3; // 3 to 7 spots remaining
};

export default function Booking() {
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated, setShowAuthModal } = useAuthStore();
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [bookingType, setBookingType] = useState<'kham' | 'dich_vu'>('kham');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    setServicesLoading(true);
    fetch('http://localhost:5001/api/client/services')
      .then(res => res.json())
      .then(data => {
        setServices(data || []);
      })
      .catch(err => {
        console.error('Lỗi tải danh sách dịch vụ:', err);
      })
      .finally(() => {
        setServicesLoading(false);
      });
  }, []);

  const dateContainerRef = useRef<HTMLDivElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận tệp tin hình ảnh (.jpg, .jpeg, .png, .webp)!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      dispatch({ type: 'SET_FORM_FIELD', field: 'anh_dinh_kem_url', value: base64String });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    dispatch({ type: 'SET_FORM_FIELD', field: 'anh_dinh_kem_url', value: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [state, dispatch] = useReducer(bookingReducer, {
    selectedDate: formatLocalDate(new Date()),
    selectedTime: '',
    isSubmitting: false,
    isSuccess: false,
    formData: {
      ho_ten_khach: user?.ho_ten || '',
      so_dien_thoai: (user as any)?.so_dien_thoai || '',
      gioi_tinh_khach: 'nam',
      trieu_chung: '',
      ly_do_kham: 'Khám lượng giá ban đầu',
      anh_dinh_kem_url: ''
    }
  });

  const { selectedDate, selectedTime, isSubmitting, isSuccess, formData } = state;

  const isToday = selectedDate === formatLocalDate(new Date());
  const MIN_BOOKING_BUFFER_MINUTES = 60; // 1 hour buffer to prevent last-minute bookings

  const isSlotInPast = (timeStr: string): boolean => {
    if (!isToday) return false;
    const now = new Date();
    const [slotHour, slotMinute] = timeStr.split(':').map(Number);
    
    // Create slot date matching today's date but with slot hours/minutes
    const slotTime = new Date(now);
    slotTime.setHours(slotHour, slotMinute, 0, 0);
    
    // Difference in minutes
    const diffMins = (slotTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMins < MIN_BOOKING_BUFFER_MINUTES;
  };

  const isSlotUrgent = (timeStr: string): boolean => {
    if (!isToday || !timeStr) return false;
    const now = new Date();
    const [slotHour, slotMinute] = timeStr.split(':').map(Number);
    
    const slotTime = new Date(now);
    slotTime.setHours(slotHour, slotMinute, 0, 0);
    
    const diffMins = (slotTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMins > 0 && diffMins <= 120; // urgent if starting within 2 hours
  };

  // Intercept Route: If unauthenticated, redirect back and show global modal immediately
  useEffect(() => {
    setIsClient(true);
    if (!isAuthenticated()) {
      // Go back to the page they came from, or home page if no history
      navigate(-1);
      setTimeout(() => {
        setShowAuthModal(true);
      }, 100);
    }
  }, [isAuthenticated, navigate, setShowAuthModal]);

  // Restore saved booking form data on user state change
  useEffect(() => {
    const saved = localStorage.getItem('temp_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedDate) dispatch({ type: 'SET_DATE', date: parsed.selectedDate });
        if (parsed.selectedTime) dispatch({ type: 'SET_TIME', time: parsed.selectedTime });
        if (parsed.formData) {
          Object.keys(parsed.formData).forEach(key => {
            if (key === 'ho_ten_khach' && user?.ho_ten) return;
            dispatch({ type: 'SET_FORM_FIELD', field: key, value: parsed.formData[key] });
          });
        }
        toast.success('Đã khôi phục dữ liệu lịch hẹn của bạn!');
      } catch (e) {
        console.error('Lỗi khôi phục lịch đặt tạm thời:', e);
      }
      localStorage.removeItem('temp_booking');
    }
  }, [user]);

  // Fetch booked slots for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    fetch(`http://localhost:5001/api/client/appointments/booked-slots?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => setBookedSlots(data.bookedSlots || []))
      .catch(() => setBookedSlots([]));
  }, [selectedDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    dispatch({ type: 'SET_FORM_FIELD', field: e.target.name, value: e.target.value });
  };

  const handleGenderChange = (value: string) => {
    dispatch({ type: 'SET_FORM_FIELD', field: 'gioi_tinh_khach', value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày khám!');
      return;
    }
    if (!selectedTime) {
      toast.error('Vui lòng chọn khung giờ khám!');
      return;
    }
    if (!formData.ho_ten_khach.trim() || !formData.so_dien_thoai.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
      return;
    }
    if (!formData.trieu_chung.trim()) {
      toast.error('Vui lòng mô tả triệu chứng của bạn!');
      return;
    }

    const toastId = toast.loading(bookingType === 'dich_vu' ? 'Đang gửi đăng ký lịch dịch vụ lẻ...' : 'Đang gửi đăng ký lịch hẹn y khoa...');
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

    const [year, month, day] = selectedDate.split('-');
    const [hours, minutes] = selectedTime.split(':');
    const ngay_gio_bat_dau = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    ).toISOString();

    try {
      const selectedService = services.find(s => s.id === selectedServiceId);
      const response = await fetch('http://localhost:5001/api/client/appointments/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ngay_gio_bat_dau,
          nguoi_dung_id: user?.id,
          dich_vu_id: bookingType === 'dich_vu' ? selectedServiceId : null,
          ly_do_kham: bookingType === 'dich_vu' ? `Trị liệu lẻ: ${selectedService?.ten_dich_vu || 'Không rõ'}` : formData.ly_do_kham,
        }),
      });

      if (response.ok) {
        toast.success(bookingType === 'dich_vu' ? 'Đăng ký lịch dịch vụ lẻ thành công!' : 'Đăng ký lịch khám lượng giá thành công!', { id: toastId });
        dispatch({ type: 'SET_SUCCESS', isSuccess: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể tạo lịch hẹn. Hãy thử lại.', { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ trị liệu!', { id: toastId });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  };

  const formatFullDate = (dateString: string) => {
    if (!isClient || !dateString) return '';
    try {
      return fullDateFormatter.format(new Date(dateString));
    } catch (e) {
      return dateString;
    }
  };

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      dateContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper to format days of week
  const getVietnameseDay = (date: Date): string => {
    const day = date.getDay();
    if (day === 0) return 'CN';
    return `T${day + 1}`;
  };

  const datesList = generateAvailableDates();

  // Time groupings
  const morningSlots = timeSlots.filter(t => t < '12:00');
  const afternoonSlots = timeSlots.filter(t => t >= '12:00' && t < '18:00');
  const eveningSlots = timeSlots.filter(t => t >= '18:00');

  // Prevent flashing component structure if unauthenticated
  if (!isAuthenticated()) {
    return null;
  }

  // Render Success State redone as elegant Stripe/Apple-like page
  if (isSuccess) {
    const selectedService = services.find(s => s.id === selectedServiceId);
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-xl w-full bg-white rounded-[24px] shadow-2xl p-8 border border-slate-100/80 text-center space-y-6"
        >
          {/* Success Check Icon */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-100 rounded-2xl rotate-6 animate-pulse" />
            <div className="relative w-16 h-16 bg-[#10B981] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400">
              <CheckCircle2 size={36} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-jakarta font-black text-[#0F172A] tracking-tight">
              Đặt lịch thành công!
            </h2>
            <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              {bookingType === 'dich_vu' 
                ? 'Yêu cầu đăng ký lịch dịch vụ lẻ của bạn đã được tiếp nhận. Đội ngũ điều phối sẽ liên hệ xác nhận trong thời gian sớm nhất.' 
                : 'Yêu cầu khám lượng giá của bạn đã được tiếp nhận. Đội ngũ y tế sẽ liên hệ xác nhận trong thời gian sớm nhất.'}
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-50 rounded-[20px] border border-slate-100 p-6 text-left space-y-4">
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs font-jakarta">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Dịch vụ</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm">
                  {bookingType === 'dich_vu' ? (selectedService?.ten_dich_vu || 'Trị liệu dịch vụ lẻ') : 'Khám Lượng Giá Ban Đầu'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Thời lượng</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm">
                  {bookingType === 'dich_vu' ? `${selectedService?.thoi_luong_phut || 45} phút` : '30 phút'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Chi phí</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm">
                  {bookingType === 'dich_vu' ? (selectedService ? `${Number(selectedService.don_gia).toLocaleString('vi-VN')}đ` : '...') : 'Miễn phí'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Thời gian hẹn</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm capitalize">
                  {selectedTime} — {formatFullDate(selectedDate)}
                </p>
              </div>
              <div className="col-span-2 border-t border-slate-200/60 pt-3">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Bệnh nhân liên hệ</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm">
                  {formData.ho_ten_khach} ({formData.so_dien_thoai})
                </p>
              </div>
            </div>
          </div>

          {/* Urgent Warning Banner on Success Page */}
          {isSlotUrgent(selectedTime) && (
            <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-[20px] text-left text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-extrabold uppercase tracking-wider text-amber-850 text-[10px]">Cảnh báo: Lịch hẹn cận giờ</p>
                <p className="mt-1 font-medium text-amber-700">
                  Lịch hẹn của bạn bắt đầu sau chưa đầy 2 tiếng. Vui lòng chuẩn bị di chuyển và có mặt trước 10 phút. Nếu cần hỗ trợ gấp hoặc thay đổi lịch hẹn, vui lòng liên hệ Hotline: <span className="font-extrabold text-slate-900">0398 655 332</span>.
                </p>
              </div>
            </div>
          )}

          {/* Prep instructions */}
          <div className="bg-[#E6F4F1] text-[#0F172A] p-5 rounded-[20px] text-left text-xs border border-[#2EC4B6]/15 space-y-2.5">
            <p className="font-extrabold flex items-center gap-1.5 text-slate-800 text-sm">
              <Info size={16} className="text-[#2EC4B6]" /> {bookingType === 'dich_vu' ? 'Hướng dẫn chuẩn bị trước khi trị liệu:' : 'Hướng dẫn chuẩn bị trước khi khám:'}
            </p>
            <ul className="space-y-1.5 font-medium text-slate-600 list-none pl-0">
              <li className="flex items-start gap-2">
                <span className="text-[#2EC4B6] font-bold">✓</span>
                Mặc trang phục thoải mái, co giãn tốt để dễ dàng thực hiện trị liệu/vận động cơ khớp.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2EC4B6] font-bold">✓</span>
                Mang theo phim chụp X-Quang, phim cộng hưởng từ (MRI) hoặc kết quả chẩn đoán cũ (nếu có).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2EC4B6] font-bold">✓</span>
                Vui lòng đến trước lịch hẹn 10 phút để chuyên viên tiếp đón hướng dẫn làm hồ sơ điều trị.
              </li>
            </ul>
          </div>

          {/* Redirection Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => navigate('/appointments')}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-98"
            >
              Xem lịch đặt của tôi
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-jakarta font-extrabold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-200"
            >
              Quay lại trang chủ
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-center animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-[#2EC4B6] transition-all text-xs font-jakarta font-extrabold uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <span className="text-[10px] bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/20 px-3.5 py-1.5 rounded-full font-jakarta font-black uppercase tracking-widest shadow-inner">
            Cổng đặt lịch trực tuyến
          </span>
        </div>

        {/* REDESIGNED HERO SECTION (Stripe/Apple Clean aesthetic) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero left content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-jakarta font-black text-[#0F172A] tracking-tight leading-[1.05]"
            >
              Khởi đầu hành trình <br />
              <span className="text-[#2EC4B6]">phục hồi</span> của bạn
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-slate-500 font-medium text-base sm:text-lg leading-relaxed max-w-xl"
            >
              Đặt lịch khám lượng giá với chuyên gia vật lý trị liệu để xác định nguyên nhân đau nhức và xây dựng lộ trình điều trị phù hợp.
            </motion.p>

            {/* Micro badges & benefits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4 max-w-md pt-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                  <Star size={16} className="fill-emerald-500 text-emerald-500" />
                </div>
                <span className="text-xs font-extrabold text-[#0F172A]">Đánh giá 4.9/5</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/20">
                  <Stethoscope size={16} />
                </div>
                <span className="text-xs font-extrabold text-[#0F172A]">Đội ngũ giàu kinh nghiệm</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/20">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-xs font-extrabold text-[#0F172A]">Quy trình chuẩn y khoa</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/20">
                  <Clock size={16} />
                </div>
                <span className="text-xs font-extrabold text-[#0F172A]">Khám chuyên sâu 30 phút</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-4"
            >
              <button
                onClick={() => {
                  const cardElement = document.getElementById('booking-experience-card');
                  if (cardElement) cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-jakarta font-extrabold px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#2EC4B6]/25 hover:-translate-y-0.5 active:translate-y-0 duration-250 flex items-center gap-2 group"
              >
                Bắt đầu đặt lịch
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>

          {/* Hero right visual (Custom illustration overlay) */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            {/* Soft gradient blur backdrops */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-[#2EC4B6]/20 to-[#E6F4F1]/30 blur-3xl -z-10 animate-pulse" />
            <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-[#0F172A]/5 to-[#2EC4B6]/10 blur-2xl -z-10" />

            <div className="relative max-w-md w-full h-[380px] rounded-[32px] overflow-hidden border border-slate-100 shadow-2xl bg-white/60 p-4">
              <img
                src="/images/physio_hero.png"
                alt="Physio Clinic Hero Visual"
                className="w-full h-full object-cover rounded-[24px]"
              />

              {/* Floating trust card 1 */}
              <div className="absolute top-8 -left-6 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl p-3 flex items-center gap-3 animate-float stagger-delay-1 max-w-[190px]">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Tiêu chuẩn</p>
                  <p className="text-xs font-extrabold text-[#0F172A]">FDA Approved</p>
                </div>
              </div>

              {/* Floating trust card 2 */}
              <div className="absolute bottom-10 -right-6 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl p-3.5 flex items-center gap-3 animate-float stagger-delay-3 max-w-[190px]">
                <div className="w-8 h-8 rounded-full bg-[#2EC4B6] text-white flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Đội ngũ</p>
                  <p className="text-xs font-extrabold text-[#0F172A]">100% KTV Cấp Chứng Chỉ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOOKING INTERFACE CONTAINER (Asymmetric Layout) */}
        <div id="booking-experience-card" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-8">
          
          {/* WIZARD EXPERIENCE CARD (Left 8-cols) */}
          <div className="lg:col-span-8 bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8">
            
            {/* Step progress bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-jakarta">
                <span className="text-[#2EC4B6] font-extrabold uppercase tracking-wider">
                  Bước {activeStep} / 5
                </span>
                <span className="text-slate-400 font-bold">
                  {activeStep === 1 && 'Chọn Hình Thức'}
                  {activeStep === 2 && 'Chọn Ngày Hẹn'}
                  {activeStep === 3 && 'Chọn Giờ Hẹn'}
                  {activeStep === 4 && 'Thông Tin Liên Hệ'}
                  {activeStep === 5 && 'Xác Nhận Đăng Ký'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                {[1, 2, 3, 4, 5].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`h-full flex-1 transition-all duration-300 border-r border-white last:border-0 ${
                      activeStep >= stepNum ? 'bg-[#2EC4B6]' : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Wizard Form Panels */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: BOOKING TYPE SELECTION */}
                {activeStep === 1 && (
                  <motion.div
                    key="type-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 text-left"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
                        <CalendarIcon className="text-[#2EC4B6]" size={20} />
                        Chọn hình thức đặt lịch hẹn
                      </h3>
                      <p className="text-xs font-medium text-slate-450">
                        PhysioFlow cung cấp dịch vụ khám lâm sàng và các gói chăm sóc trị liệu nhanh phù hợp với từng nhu cầu.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Option A: Lịch Khám */}
                      <div
                        onClick={() => {
                          setBookingType('kham');
                          setSelectedServiceId('');
                        }}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                          bookingType === 'kham'
                            ? 'bg-emerald-50/20 border-[#2EC4B6] ring-2 ring-[#2EC4B6]/10'
                            : 'bg-white border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center">
                              <Stethoscope size={20} />
                            </div>
                            <span className="text-sm font-black text-slate-800">Lịch Khám Lâm Sàng</span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                            Dành cho khách hàng có nhu cầu trị liệu bệnh lý (đau mỏi vai gáy, lưng, khớp...) cần được Bác sĩ kiểm tra trực tiếp và lên phác đồ trước.
                          </p>
                        </div>
                        <div className="flex gap-1.5 mt-4">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-105 text-emerald-700 uppercase tracking-wider">Có Bác sĩ</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">30 phút</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-105 text-emerald-700 uppercase tracking-wider">Miễn phí</span>
                        </div>
                      </div>

                      {/* Option B: Dịch vụ lẻ */}
                      <div
                        onClick={() => setBookingType('dich_vu')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                          bookingType === 'dich_vu'
                            ? 'bg-emerald-50/20 border-[#2EC4B6] ring-2 ring-[#2EC4B6]/10'
                            : 'bg-white border-slate-200 hover:border-slate-355'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center">
                              <Award size={20} />
                            </div>
                            <span className="text-sm font-black text-slate-800">Dịch Vụ Lẻ / Trị Liệu Nhanh</span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                            Dành cho khách hàng chỉ muốn sử dụng các dịch vụ chăm sóc sức khỏe làm nhanh, thư giãn cơ, siêu âm trị liệu... không cần Bác sĩ khám trước.
                          </p>
                        </div>
                        <div className="flex gap-1.5 mt-4">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wider">Không cần khám</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">45-60 phút</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-105 text-emerald-700 uppercase tracking-wider">Bảng giá lẻ</span>
                        </div>
                      </div>
                    </div>

                    {/* Service grid if bookingType === 'dich_vu' */}
                    {bookingType === 'dich_vu' && (
                      <div className="space-y-3 pt-4 border-t border-slate-150 animate-fade-in">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Chọn Dịch vụ lẻ mong muốn *
                        </h4>
                        {servicesLoading ? (
                          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                            Đang tải danh sách dịch vụ lẻ...
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                            {services.map((srv) => {
                              const isSelected = selectedServiceId === srv.id;
                              return (
                                <div
                                  key={srv.id}
                                  onClick={() => setSelectedServiceId(srv.id)}
                                  className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between select-none cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50/40 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                                      : 'bg-white border-slate-150 hover:border-slate-350'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-black text-slate-800 leading-tight block truncate pr-2">{srv.ten_dich_vu}</span>
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500">
                                      {srv.thoi_luong_phut} phút
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2.5">
                                    <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">{srv.mo_ta_ngan || 'Trị liệu phục hồi chức năng'}</span>
                                    <span className="text-xs font-black text-emerald-600 font-jakarta">
                                      {Number(srv.don_gia).toLocaleString('vi-VN')}đ
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        disabled={bookingType === 'dich_vu' && !selectedServiceId}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Chọn Ngày Hẹn
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: DATE SELECTION */}
                {activeStep === 2 && (
                  <motion.div
                    key="date-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
                          <CalendarIcon className="text-[#2EC4B6]" size={20} />
                          Chọn ngày lượng giá
                        </h3>
                        <p className="text-xs font-medium text-slate-400">
                          Xem danh sách các ngày còn chỗ trống dưới đây.
                        </p>
                      </div>
                      
                      {/* Scrolling controls for desktop */}
                      <div className="hidden sm:flex gap-1">
                        <button
                          type="button"
                          onClick={() => scrollDates('left')}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollDates('right')}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Date Cards Horizontal Container */}
                    <div
                      ref={dateContainerRef}
                      className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-2 px-2 hide-scrollbar snap-x"
                    >
                      {datesList.map((dateItem) => {
                        const dateStr = formatLocalDate(dateItem);
                        const spots = getMockAvailableSlots(dateStr);
                        const isSelected = selectedDate === dateStr;
                        const isClosed = spots === 0;

                        return (
                          <button
                            type="button"
                            key={dateStr}
                            disabled={isClosed}
                            onClick={() => dispatch({ type: 'SET_DATE', date: dateStr })}
                            className={`flex-shrink-0 w-24 h-24 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 relative snap-start outline-none
                              ${isClosed
                                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-lg shadow-[#2EC4B6]/25 scale-[1.04] z-10'
                                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-slate-50/50 hover:scale-[1.02]'
                              }`}
                          >
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                              {dateStr === formatLocalDate(new Date()) ? 'Hôm nay' : getVietnameseDay(dateItem)}
                            </span>
                            <span className="text-2xl font-jakarta font-black mt-1">
                              {dateItem.getDate()}
                            </span>
                            
                            {isClosed && (
                              <span className="text-[9px] font-extrabold mt-1.5 px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-400">
                                Nghỉ
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
                      >
                        Quay lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        disabled={!selectedDate}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Chọn Khung Giờ
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: TIME SELECTION */}
                {activeStep === 3 && (
                  <motion.div
                    key="time-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
                        <Clock className="text-[#2EC4B6]" size={20} />
                        Chọn giờ khám lâm sàng
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        Khung giờ trống cho ngày {formatFullDate(selectedDate)}
                      </p>
                    </div>

                    <div className="space-y-6 pt-2">
                      {/* Morning slots */}
                      {morningSlots.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Buổi sáng (08:00 - 11:30)
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                             {morningSlots.map((time) => {
                              const isBooked = bookedSlots.includes(time);
                              const isPast = isSlotInPast(time);
                              const isDisabled = isBooked || isPast;
                              const isSelected = selectedTime === time;

                              return (
                                <button
                                  type="button"
                                  key={time}
                                  disabled={isDisabled}
                                  onClick={() => dispatch({ type: 'SET_TIME', time })}
                                  className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                                    ${isDisabled
                                      ? 'bg-slate-50/50 border-slate-100 text-slate-300/80 cursor-not-allowed opacity-50'
                                      : isSelected
                                        ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                                    }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Afternoon slots */}
                      {afternoonSlots.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Buổi chiều (13:30 - 17:30)
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                             {afternoonSlots.map((time) => {
                              const isBooked = bookedSlots.includes(time);
                              const isPast = isSlotInPast(time);
                              const isDisabled = isBooked || isPast;
                              const isSelected = selectedTime === time;

                              return (
                                <button
                                  type="button"
                                  key={time}
                                  disabled={isDisabled}
                                  onClick={() => dispatch({ type: 'SET_TIME', time })}
                                  className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                                    ${isDisabled
                                      ? 'bg-slate-50/50 border-slate-100 text-slate-300/80 cursor-not-allowed opacity-50'
                                      : isSelected
                                        ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                                    }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Evening slots */}
                      {eveningSlots.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" /> Buổi tối (18:00 - 19:00)
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                             {eveningSlots.map((time) => {
                              const isBooked = bookedSlots.includes(time);
                              const isPast = isSlotInPast(time);
                              const isDisabled = isBooked || isPast;
                              const isSelected = selectedTime === time;

                              return (
                                <button
                                  type="button"
                                  key={time}
                                  disabled={isDisabled}
                                  onClick={() => dispatch({ type: 'SET_TIME', time })}
                                  className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                                    ${isDisabled
                                      ? 'bg-slate-50/50 border-slate-100 text-slate-300/80 cursor-not-allowed opacity-50'
                                      : isSelected
                                        ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                                    }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedTime && isSlotUrgent(selectedTime) && (
                      <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold animate-fade-in mt-4">
                        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold uppercase tracking-wider text-amber-800 text-[10px]">Cảnh báo: Lịch hẹn cận giờ (Dưới 2 tiếng)</p>
                          <p className="mt-0.5 font-medium text-amber-700">
                            Khung giờ bạn chọn bắt đầu rất gần thời điểm hiện tại. Vui lòng di chuyển sớm để có mặt trước 10 phút. Hotline hỗ trợ gấp: <span className="font-extrabold text-slate-900">0398 655 332</span>.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
                      >
                        Quay lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(4)}
                        disabled={!selectedTime}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Điền Thông Tin
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: PATIENT INFORMATION */}
                {activeStep === 4 && (
                  <motion.div
                    key="info-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
                        <User className="text-[#2EC4B6]" size={20} />
                        Thông tin bệnh nhân liên hệ
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        Vui lòng nhập thông tin liên hệ và mô tả sơ bộ tình trạng đau nhức.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                      
                      {/* Name input (Floating label) */}
                      <div className="relative">
                        <input
                          id="ho_ten_khach"
                          type="text"
                          name="ho_ten_khach"
                          required
                          readOnly={!!user?.ho_ten}
                          placeholder=" "
                          className={`peer block w-full rounded-xl border bg-white px-4 pt-6 pb-2 text-sm font-bold text-slate-800 focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm
                            ${user?.ho_ten
                              ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-slate-200 focus:border-[#2EC4B6]'
                            }`}
                          value={formData.ho_ten_khach}
                          onChange={handleChange}
                        />
                        <label
                          htmlFor="ho_ten_khach"
                          className="absolute left-4 top-2 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#2EC4B6]"
                        >
                          Họ và tên *
                        </label>
                      </div>

                      {/* Phone input (Floating label) */}
                      <div className="relative">
                        <input
                          id="so_dien_thoai"
                          type="tel"
                          name="so_dien_thoai"
                          required
                          placeholder=" "
                          className="peer block w-full rounded-xl border border-slate-200 bg-white px-4 pt-6 pb-2 text-sm font-bold text-slate-800 focus:border-[#2EC4B6] focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm"
                          value={formData.so_dien_thoai}
                          onChange={handleChange}
                        />
                        <label
                          htmlFor="so_dien_thoai"
                          className="absolute left-4 top-2 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#2EC4B6]"
                        >
                          Số điện thoại *
                        </label>
                      </div>

                      {/* Gender Custom Segments */}
                      <div className="sm:col-span-2 space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Giới tính
                        </span>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleGenderChange('nam')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border duration-200 active:scale-98
                              ${formData.gioi_tinh_khach === 'nam'
                                ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/10 font-extrabold'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                              }`}
                          >
                            Nam
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenderChange('nu')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border duration-200 active:scale-98
                              ${formData.gioi_tinh_khach === 'nu'
                                ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/10 font-extrabold'
                                : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                              }`}
                          >
                            Nữ
                          </button>
                        </div>
                      </div>

                      {/* Symptom Textarea (Floating label) */}
                      <div className="sm:col-span-2 relative">
                        <textarea
                          id="trieu_chung"
                          name="trieu_chung"
                          required
                          rows={4}
                          placeholder=" "
                          className="peer block w-full rounded-xl border border-slate-200 bg-white px-4 pt-6 pb-2 text-sm font-medium text-slate-700 focus:border-[#2EC4B6] focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm resize-none"
                          value={formData.trieu_chung}
                          onChange={handleChange}
                        />
                        <label
                          htmlFor="trieu_chung"
                          className="absolute left-4 top-2 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#2EC4B6]"
                        >
                          Mô tả triệu chứng, vùng đau nhức (VD: đau mỏi cổ vai gáy...) *
                        </label>
                      </div>

                      {/* Symptom image upload (Optional) */}
                      <div className="sm:col-span-2 space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Ảnh đính kèm triệu chứng (nếu có - tối đa 5MB)
                        </span>
                        
                        {!formData.anh_dinh_kem_url ? (
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 bg-slate-50/50 hover:bg-slate-50
                              ${dragActive 
                                ? 'border-[#2EC4B6] bg-[#2EC4B6]/5 scale-[1.01]' 
                                : 'border-slate-200 hover:border-[#2EC4B6]'
                              }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileInputChange}
                            />
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/60 transition-colors">
                              <Upload size={18} />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-700">Kéo thả ảnh hoặc click để tải lên</p>
                              <p className="text-[10px] text-slate-400 font-semibold">Chấp nhận JPG, PNG, WEBP tối đa 5MB</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 p-4 border border-slate-200 bg-slate-50/30 rounded-2xl relative group">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative bg-white">
                              <img src={formData.anh_dinh_kem_url} alt="Uploaded symptom" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <p className="text-xs font-bold text-slate-700 truncate font-jakarta">Ảnh triệu chứng đã tải lên</p>
                              <p className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 font-jakarta">
                                <CheckCircle2 size={12} /> Sẵn sàng đính kèm
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={removeImage}
                              className="w-8 h-8 rounded-lg bg-slate-105 hover:bg-red-50 hover:text-red-500 text-slate-550 flex items-center justify-center transition-all border border-slate-200/60"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
                      >
                        Quay lại
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.ho_ten_khach && formData.so_dien_thoai && formData.trieu_chung) {
                            setActiveStep(5);
                          } else {
                            toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
                          }
                        }}
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: CONFIRMATION */}
                {activeStep === 5 && (
                  <motion.div
                    key="confirm-step"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
                        <ShieldCheck className="text-[#2EC4B6]" size={20} />
                        Xác nhận thông tin đặt lịch
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        Vui lòng kiểm tra lại thông tin cuộc hẹn trước khi xác nhận giữ chỗ.
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider">Họ và tên</p>
                          <p className="text-[#0F172A] font-extrabold mt-1 text-sm">{formData.ho_ten_khach}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider">Số điện thoại</p>
                          <p className="text-[#0F172A] font-extrabold mt-1 text-sm">{formData.so_dien_thoai}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider">Giới tính</p>
                          <p className="text-[#0F172A] font-extrabold mt-1 text-sm capitalize">{formData.gioi_tinh_khach === 'nam' ? 'Nam' : 'Nữ'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase tracking-wider">Dịch vụ</p>
                          <p className="text-[#0F172A] font-extrabold mt-1 text-sm">
                            {bookingType === 'dich_vu' ? (services.find(s => s.id === selectedServiceId)?.ten_dich_vu || 'Trị liệu dịch vụ lẻ') : 'Khám Lượng Giá Chuyên Sâu'}
                          </p>
                        </div>
                        <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
                          <p className="text-slate-400 font-bold uppercase tracking-wider">Thời gian khám</p>
                          <p className="text-[#0F172A] font-extrabold mt-1 text-sm capitalize">
                            {selectedTime} — {formatFullDate(selectedDate)}
                          </p>
                        </div>
                        <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
                          <p className="text-slate-400 font-bold uppercase tracking-wider">Mô tả triệu chứng</p>
                          <p className="text-slate-700 font-medium mt-1 text-sm leading-relaxed whitespace-pre-wrap">{formData.trieu_chung}</p>
                        </div>
                        {formData.anh_dinh_kem_url && (
                          <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
                            <p className="text-slate-400 font-bold uppercase tracking-wider">Ảnh đính kèm triệu chứng</p>
                            <div className="mt-2 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 bg-white">
                              <img src={formData.anh_dinh_kem_url} alt="Symptom preview" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Urgent Warning Banner */}
                    {isSlotUrgent(selectedTime) && (
                      <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold mb-1">
                        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <p className="font-extrabold uppercase tracking-wider text-amber-850 text-[10px]">Cảnh báo đặt lịch sát giờ</p>
                          <p className="mt-1 font-medium text-amber-700">
                            Bạn đang đặt lịch khám bắt đầu trong vòng chưa đầy 2 giờ. Vui lòng di chuyển sớm để có mặt trước 10 phút. Hotline hỗ trợ gấp: <span className="font-extrabold text-amber-955">0398 655 332</span>.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 bg-teal-50/50 border border-[#2EC4B6]/15 p-4 rounded-xl text-[11px] leading-relaxed text-slate-650">
                      <Lock size={16} className="text-[#2EC4B6] shrink-0 mt-0.5" />
                      <p>
                        Bằng cách bấm xác nhận giữ chỗ, bạn đồng ý cung cấp thông tin y khoa này phục vụ riêng cho việc thăm khám chẩn đoán tại PhysioFlow. Dữ liệu được bảo mật tuyệt mật.
                      </p>
                    </div>

                    {/* LARGE SUBMIT BUTTON (CTA SECTION) */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-jakarta font-extrabold text-xs uppercase tracking-widest rounded-[18px] h-16 shadow-lg shadow-[#2EC4B6]/25 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
                            Đang xử lý giữ chỗ...
                          </span>
                        ) : (
                          <>
                            Xác nhận giữ chỗ <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveStep(4)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3 px-5 rounded-xl text-xs uppercase tracking-widest transition-all"
                      >
                        Sửa thông tin
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* STICKY APPOINTMENT SUMMARY (Right 4-cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white/80 backdrop-blur-md border border-slate-150 shadow-lg rounded-[24px] overflow-hidden p-6 space-y-6">
              <div className="space-y-4 text-left">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  bookingType === 'dich_vu' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {bookingType === 'dich_vu' ? 'Trị liệu trực tiếp' : 'Đặt lịch miễn phí'}
                </span>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-jakarta font-black text-[#0F172A]">
                    {bookingType === 'dich_vu' ? (services.find(s => s.id === selectedServiceId)?.ten_dich_vu || 'Chọn dịch vụ') : 'Khám Lượng Giá'}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {bookingType === 'dich_vu' ? 'Trị liệu dịch vụ lẻ nhanh' : 'Đánh giá & Chẩn đoán cột sống'}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Summary Details */}
              <div className="space-y-4 text-xs font-jakarta">
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider">
                    {bookingType === 'dich_vu' ? 'Ngày hẹn' : 'Ngày khám'}
                  </span>
                  <span className="text-[#0F172A] font-extrabold capitalize">
                    {selectedDate ? formatFullDate(selectedDate).split(',').slice(0, 2).join(',') : 'Chưa chọn'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider">
                    {bookingType === 'dich_vu' ? 'Giờ hẹn' : 'Giờ khám'}
                  </span>
                  <span className="text-[#0F172A] font-extrabold">
                    {selectedTime ? `${selectedTime}` : 'Chưa chọn'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider">Thời lượng</span>
                  <span className="text-[#0F172A] font-extrabold">
                    {bookingType === 'dich_vu' ? `${services.find(s => s.id === selectedServiceId)?.thoi_luong_phut || 45} phút` : '30 phút'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider">Chi phí</span>
                  <span className={`${
                    bookingType === 'dich_vu' ? 'text-teal-600 bg-teal-50 border-teal-100' : 'text-emerald-500 bg-emerald-50 border-emerald-100'
                  } font-extrabold px-2.5 py-0.5 rounded-full border`}>
                    {bookingType === 'dich_vu' ? (services.find(s => s.id === selectedServiceId) ? `${Number(services.find(s => s.id === selectedServiceId).don_gia).toLocaleString('vi-VN')}đ` : '...') : 'Miễn phí'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Benefit checks */}
              <div className="space-y-3 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {bookingType === 'dich_vu' ? 'Nội dung thực hiện' : 'Quyền lợi của bạn'}
                </p>
                <ul className="space-y-2 text-xs font-bold text-slate-650">
                  {bookingType === 'dich_vu' ? (
                    <>
                      <li className="flex items-center gap-2 text-[#2EC4B6]">
                        <span className="text-[#2EC4B6] font-bold">✓</span> Trực tiếp trị liệu cùng KTV tay nghề cao
                      </li>
                      <li className="flex items-center gap-2 text-[#2EC4B6]">
                        <span className="text-[#2EC4B6] font-bold">✓</span> Sử dụng máy móc chuyên dụng hiện đại
                      </li>
                      <li className="flex items-center gap-2 text-[#2EC4B6]">
                        <span className="text-[#2EC4B6] font-bold">✓</span> Tối ưu hóa thời gian, không chờ đợi khám
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-emerald-600">
                        <span className="text-emerald-500">✓</span> Lượng giá tầm vận động (ROM)
                      </li>
                      <li className="flex items-center gap-2 text-emerald-600">
                        <span className="text-emerald-500">✓</span> Xác định tận gốc nguyên nhân đau
                      </li>
                      <li className="flex items-center gap-2 text-emerald-600">
                        <span className="text-emerald-500">✓</span> Nhận phác đồ y khoa cá nhân hóa
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST SECTION (5-step process, Certifications, Quality Commitments) */}
        <div className="border-t border-slate-150 pt-16 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[#2EC4B6] text-[10px] font-black uppercase tracking-widest bg-[#2EC4B6]/10 px-3.5 py-1.5 rounded-full border border-[#2EC4B6]/15 shadow-inner">
              Cam kết chất lượng
            </span>
            <h2 className="text-3xl font-jakarta font-black text-[#0F172A] tracking-tight">
              Đạt chuẩn y tế cao cấp nhất
            </h2>
            <p className="text-sm font-semibold text-slate-400">
              Quy trình chẩn đoán nghiêm ngặt giúp tìm đúng nguyên nhân để trị liệu hiệu quả.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: 5-step process */}
            <div className="bg-white border border-slate-100 shadow-lg rounded-[24px] p-6 space-y-5 hover:scale-[1.01] transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/20">
                <Stethoscope size={20} />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-jakarta font-black text-[#0F172A]">Quy trình khám 5 bước</h4>
                <p className="text-xs font-medium text-slate-450 leading-relaxed">
                  Từ tiếp nhận triệu chứng, kiểm tra khớp, đọc phim chụp y khoa đến thiết lập phác đồ cá nhân hóa dưới sự hội chẩn chuyên sâu của bác sĩ.
                </p>
              </div>
            </div>

            {/* Box 2: Certifications */}
            <div className="bg-white border border-slate-100 shadow-lg rounded-[24px] p-6 space-y-5 hover:scale-[1.01] transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/20">
                <Award size={20} />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-jakarta font-black text-[#0F172A]">Chứng chỉ y khoa chuyên môn</h4>
                <p className="text-xs font-medium text-slate-450 leading-relaxed">
                  100% bác sĩ, kỹ thuật viên có bằng cấp chuyên ngành phục hồi chức năng và sở hữu chứng chỉ hành nghề y tế hợp pháp của Bộ Y Tế.
                </p>
              </div>
            </div>

            {/* Box 3: Quality commitment */}
            <div className="bg-white border border-slate-100 shadow-lg rounded-[24px] p-6 space-y-5 hover:scale-[1.01] transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-650 flex items-center justify-center border border-emerald-100">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-jakarta font-black text-[#0F172A]">Cam kết chất lượng điều trị</h4>
                <p className="text-xs font-medium text-slate-455 leading-relaxed">
                  PhysioFlow cam kết tập trung phục hồi từ gốc rễ bệnh lý cột sống, cơ xương khớp. Không chèo kéo các dịch vụ ngoài phác đồ chỉ định.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

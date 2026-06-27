import { useState, useEffect } from 'react';
import {
  Info,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Stethoscope,
  Star,
  ArrowRight,
  AlertTriangle,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { convertToVietnamUtcIso } from '../../../utils/date';
import { useBookingState } from '../components/booking/hooks/useBookingState';
import {
  formatFullDate,
  isSlotUrgent
} from '../components/booking/constants';
import { BookingHeader } from '../components/booking/ui/BookingHeader';
import { BookingWizard } from '../components/booking/ui/BookingWizard';
import { BookingStepCard } from '../components/booking/ui/BookingStepCard';
import { TrustSection } from '../components/booking/ui/TrustSection';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Booking() {
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated, setShowAuthModal } = useAuthStore();
  const [activeStep, setActiveStep] = useState(1);
  const [bookingType, setBookingType] = useState<'kham' | 'dich_vu'>('kham');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [createdApptId, setCreatedApptId] = useState<string | null>(null);

  const {
    state,
    bookedSlots,
    hasExistingClinicalExam,
    setDateField,
    setTimeField,
    setFormField,
    setSubmitting,
    setSuccess
  } = useBookingState(user, bookingType, selectedServiceId, services);

  const { selectedDate, selectedTime, isSubmitting, isSuccess, formData } = state;

  const getDefaultRouteByRole = (roleId: number) => {
    switch (roleId) {
      case 5:
      case 6: return '/admin';
      case 2: return '/receptionist';
      case 3: return '/technician/workspace';
      case 4: return '/doctor';
      default: return '/dashboard';
    }
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
    } else if (user) {
      const roleId = Number(user.vai_tro_id);
      if (roleId !== 1 && roleId !== 0) {
        toast.error('Tài khoản nhân sự không thể sử dụng chức năng đặt lịch của Khách hàng. Vui lòng đăng ký tài khoản khách hàng riêng.');
        navigate(getDefaultRouteByRole(roleId), { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, setShowAuthModal]);

  // Fetch list of services for services step
  useEffect(() => {
    setServicesLoading(true);
    fetch(`${BASE_URL}/client/services`)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormField(e.target.name, e.target.value);
  };

  const handleGenderChange = (value: string) => {
    setFormField('gioi_tinh_khach', value);
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
      setFormField('anh_dinh_kem_url', base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormField('anh_dinh_kem_url', '');
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
    const nameTrimmed = formData.ho_ten_khach.trim();
    const phoneTrimmed = formData.so_dien_thoai.trim();
    const symptomTrimmed = formData.trieu_chung.trim();

    if (!nameTrimmed) {
      toast.error('Vui lòng nhập Họ và tên!');
      return;
    }
    const nameRegex = /^[\p{L}\s']{2,}$/u;
    if (!nameRegex.test(nameTrimmed)) {
      toast.error('Họ và tên phải có ít nhất 2 ký tự và chỉ chứa chữ cái!');
      return;
    }

    if (!phoneTrimmed) {
      toast.error('Vui lòng nhập Số điện thoại!');
      return;
    }
    const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
    if (!phoneRegex.test(phoneTrimmed)) {
      toast.error('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09!');
      return;
    }

    if (!symptomTrimmed) {
      toast.error('Vui lòng nhập Mô tả triệu chứng!');
      return;
    }
    if (symptomTrimmed.length < 10) {
      toast.error('Mô tả triệu chứng phải có ít nhất 10 ký tự để bác sĩ nắm rõ tình trạng!');
      return;
    }

    const toastId = toast.loading(bookingType === 'dich_vu' ? 'Đang gửi đăng ký lịch dịch vụ lẻ...' : 'Đang gửi đăng ký lịch hẹn y khoa...');
    setSubmitting(true);

    const ngay_gio_bat_dau = convertToVietnamUtcIso(selectedDate, selectedTime);

    try {
      const selectedService = services.find(s => s.id === selectedServiceId);
      const response = await fetch(`${BASE_URL}/client/appointments/public`, {
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
        const appt = await response.json();
        setCreatedApptId(appt.id);
        toast.success(bookingType === 'dich_vu' ? 'Đăng ký lịch dịch vụ lẻ thành công!' : 'Đăng ký lịch khám lượng giá thành công!', { id: toastId });
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể tạo lịch hẹn. Hãy thử lại.', { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ trị liệu!', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
            📧 Vui lòng check mail xác nhận đặt chỗ
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-jakarta font-black text-[#0F172A] tracking-tight">
              Đặt lịch thành công!
            </h2>
            <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              Vui lòng kiểm tra email của bạn (bao gồm cả mục thư rác/spam) và nhấn xác nhận giữ chỗ. Nếu chưa xác nhận, thông tin sẽ được chuyển đến lễ tân để liên hệ hỗ trợ trực tiếp.
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-left text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold animate-pulse">
            <span className="text-lg shrink-0">📧</span>
            <div>
              <p className="font-extrabold uppercase tracking-wider text-rose-800 text-[10px]">Lưu ý quan trọng</p>
              <p className="mt-1 font-bold text-rose-700">
                Hệ thống đã gửi một email xác thực đến địa chỉ của bạn. Vui lòng mở hòm thư (kiểm tra cả mục Spam/Thư rác) và click <span className="font-extrabold underline text-rose-800">"Xác Nhận Giữ Chỗ Ngay"</span> để giữ chỗ khám thành công!
              </p>
            </div>
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
                  {selectedTime} — {isClient ? formatFullDate(selectedDate) : ''}
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
          {isSlotUrgent(selectedTime, selectedDate) && (
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
              onClick={() => navigate(createdApptId ? `/booking/success/${createdApptId}` : '/appointments')}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-98"
            >
              Xem lịch của tôi
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
        <BookingHeader onBack={() => navigate(-1)} />

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
            <BookingWizard activeStep={activeStep} />

            {/* Wizard Form Panels */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                <BookingStepCard
                  activeStep={activeStep}
                  setActiveStep={setActiveStep}
                  bookingType={bookingType}
                  setBookingType={setBookingType}
                  selectedServiceId={selectedServiceId}
                  setSelectedServiceId={setSelectedServiceId}
                  services={services}
                  servicesLoading={servicesLoading}
                  state={state}
                  bookedSlots={bookedSlots}
                  hasExistingClinicalExam={hasExistingClinicalExam}
                  onViewAppointments={() => navigate('/appointments')}
                  onChange={handleChange}
                  handleGenderChange={handleGenderChange}
                  handleFile={handleFile}
                  removeImage={removeImage}
                  setDateField={setDateField}
                  setTimeField={setTimeField}
                  isSubmitting={isSubmitting}
                  user={user}
                />
              </AnimatePresence>
            </form>
          </div>

          {/* STICKY APPOINTMENT SUMMARY (Right 4-cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white/80 backdrop-blur-md border border-slate-150 shadow-lg rounded-[24px] overflow-hidden p-6 space-y-6">
              <div className="space-y-4 text-left">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  bookingType === 'dich_vu' ? 'bg-teal-55 text-teal-700 border-teal-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
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
                    {selectedDate && isClient ? formatFullDate(selectedDate).split(',').slice(0, 2).join(',') : 'Chưa chọn'}
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
        <TrustSection />

      </div>
    </div>
  );
}

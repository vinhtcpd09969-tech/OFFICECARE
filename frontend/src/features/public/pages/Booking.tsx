import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Clock,
  Stethoscope,
  Star,
  User,
  Loader2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useAuthActions } from '../../../stores/authStore';
import { agreeTerms } from '../../customer/api/customer.api';
import { TERMS_OF_SERVICE } from '../../legal/termsContent';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { convertToVietnamUtcIso } from '../../../utils/date';
import { useBookingState } from '../components/booking/hooks/useBookingState';
import {
  formatFullDate
} from '../components/booking/constants';
import { BookingHeader } from '../components/booking/ui/BookingHeader';
import { BookingWizard } from '../components/booking/ui/BookingWizard';
import { BookingStepCard } from '../components/booking/ui/BookingStepCard';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { updateUser } = useAuthActions();
  const [activeStep, setActiveStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [agreeingLoading, setAgreeingLoading] = useState(false);

  const handleAgreeTerms = async () => {
    if (!acceptedTerms) return;
    setAgreeingLoading(true);
    try {
      await agreeTerms();
      updateUser({ ngay_dong_y_dieu_khoan: new Date().toISOString() });
      toast.success('Xác nhận đồng ý điều khoản thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi ghi nhận đồng ý điều khoản. Vui lòng thử lại.');
    } finally {
      setAgreeingLoading(false);
    }
  };

  // Initialize from location state if passed
  const initialType = location.state?.isKtv ? 'dich_vu' : (location.state?.bookingType || 'kham');
  const initialServiceId = location.state?.selectedServiceId || location.state?.serviceId || '';

  const [bookingType, setBookingType] = useState<'kham' | 'dich_vu'>(initialType);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId);

  // Auto-scroll to booking interface if redirected from any specialist
  useEffect(() => {
    if (location.state?.selectedDoctorId) {
      setTimeout(() => {
        const el = document.getElementById('booking-experience-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [location.state]);
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [createdApptId, setCreatedApptId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    location.state?.selectedDoctorId ? String(location.state.selectedDoctorId) : ''
  );

  const selectedService = services.find(s => s.id === selectedServiceId);

  const {
    state,
    bookedSlots,
    specialists,
    slotAvailability,
    hasExistingClinicalExam,
    setDateField,
    setTimeField,
    setFormField,
    setSubmitting,
    setSuccess,
    tempHoldId,
    refreshSlots
  } = useBookingState(user, bookingType, selectedServiceId, services);

  const { selectedDate, selectedTime, isSubmitting, isSuccess, formData } = state;

  // Release hold on unmount if booking was not completed
  useEffect(() => {
    return () => {
      const holdId = sessionStorage.getItem('booking_temp_hold_id');
      if (holdId) {
        fetch(`${BASE_URL}/client/appointments/hold/${holdId}`, {
          method: 'DELETE',
          keepalive: true
        }).catch(err => console.error('Failed to release hold:', err));
      }
    };
  }, []);

  // Re-fetch booked slots when entering Step 3 (Date/Time/Specialist Selection)
  useEffect(() => {
    if (activeStep === 3) {
      refreshSlots();
    }
  }, [activeStep, refreshSlots]);

  if (createdApptId || typeof setCreatedApptId === 'function' || typeof setSuccess === 'function' || isSuccess) { /* noop */ }

  // Reset selected time and staff when service or booking type changes
  useEffect(() => {
    setTimeField('');
    setSelectedStaffId('');
  }, [selectedServiceId, bookingType, setTimeField]);

  const getDefaultRouteByRole = (roleId: number) => {
    switch (roleId) {
      case 5:
      case 6: return '/admin';
      case 2: return '/receptionist';
      case 3: return '/technician/appointments';
      case 4: return '/doctor';
      default: return '/dashboard';
    }
  };

  // Intercept Route: If unauthenticated, let the component render a custom confirm dialog
  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated() && user) {
      const roleId = Number(user.vai_tro_id);
      if (roleId !== 1 && roleId !== 0) {
        toast.error('Tài khoản nhân sự không thể sử dụng chức năng đặt lịch của Khách hàng. Vui lòng đăng ký tài khoản khách hàng riêng.');
        navigate(getDefaultRouteByRole(roleId), { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

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
      const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
      const selectedService = services.find(s => s.id === selectedServiceId);
      const targetDichVuId = bookingType === 'dich_vu' ? selectedServiceId : (examService?.id || null);

      const response = await fetch(`${BASE_URL}/client/appointments/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ngay_gio_bat_dau,
          khach_hang_id: user?.id,
          nhan_su_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
          goi_dich_vu_id: targetDichVuId,
          ly_do_kham: bookingType === 'dich_vu' ? `Trị liệu lẻ: ${selectedService?.ten_dich_vu || 'Không rõ'}` : (formData.ly_do_kham || 'Khám lượng giá ban đầu'),
          temp_hold_id: tempHoldId
        }),
      });

      if (response.ok) {
        const appt = await response.json();
        sessionStorage.removeItem('booking_temp_hold_id'); // Prevent release on unmount since it is finalized
        toast.success(bookingType === 'dich_vu' ? 'Đăng ký lịch dịch vụ lẻ thành công!' : 'Đăng ký lịch khám lượng giá thành công!', { id: toastId });
        if (user) {
          navigate('/appointments');
        } else {
          navigate(`/booking/success/${appt.id}`);
        }
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

  const handleTimeout = useCallback(async () => {
    const holdId = sessionStorage.getItem('booking_temp_hold_id');
    if (holdId) {
      try {
        await fetch(`${BASE_URL}/client/appointments/hold/${holdId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to release hold on timeout:', err);
      }
    }
    setTimeField('');
    toast.error('Thời gian giữ chỗ đã hết hạn. Vui lòng chọn lại khung giờ.', { duration: 5000 });
    setActiveStep(3);
  }, [setTimeField, setActiveStep]);

  // Prevent flashing component structure if unauthenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
        {/* Modal Container Card - Bo góc tối đa rounded-[32px] sm:rounded-[40px] */}
        <div
          className="relative max-w-[540px] w-full bg-white rounded-[32px] sm:rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-[0_30px_70px_-10px_rgba(15,23,42,0.22)] z-10 text-center animate-in fade-in zoom-in duration-300"
        >
          {/* Soft Teal Circular Container with User Icon */}
          <div className="w-20 h-20 bg-[#2EC4B6]/10 text-[#2EC4B6] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <User size={36} strokeWidth={2.2} />
          </div>

          {/* Modern Bold Typography Header */}
          <h3 className="font-heading font-black text-2xl sm:text-[28px] text-secondary text-center mb-4 tracking-tight leading-snug">
            Yêu cầu đăng nhập
          </h3>

          {/* Subtitle / UX copy explaining exactly why this is needed */}
          <p className="text-slate-500 font-semibold text-sm leading-relaxed text-center mb-10 px-2 max-w-[420px] mx-auto">
            Quý khách vui lòng đăng nhập tài khoản để tiến hành đặt lịch khám lượng giá và trị liệu tại trung tâm OfficeCare.
          </p>

          {/* Premium Action Buttons - Side-by-Side on desktop, stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[13px] tracking-wide py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-[0_4px_14px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-[0_6px_20px_rgba(15,23,42,0.4)] cursor-pointer"
            >
              HỦY
            </button>
            <button
              onClick={() => {
                navigate('/login', { state: { from: '/booking' } });
              }}
              className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold text-[13px] tracking-wide py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-[0_4px_14px_rgba(46,196,182,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-[0_6px_20px_rgba(46,196,182,0.4)] cursor-pointer"
            >
              ĐĂNG NHẬP NGAY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-20 px-4 sm:px-6 lg:px-8">
      {/* Terms and Conditions Consent Modal Gate */}
      {user && user.ngay_dong_y_dieu_khoan === null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-2xl w-full bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-[0_30px_70px_-10px_rgba(15,23,42,0.22)] p-6 md:p-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="text-center pb-5 border-b border-slate-100 shrink-0">
              <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-3 shadow-inner">
                📜 Cam kết chất lượng
              </span>
              <h2 className="font-heading font-black text-xl md:text-2xl text-slate-900 tracking-tight leading-tight mb-2">
                Điều khoản dịch vụ & Quy định
              </h2>
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">
                Áp dụng cho mọi hoạt động trị liệu tại OfficeCare
              </p>
            </div>

            {/* Scrollable Terms Content */}
            <div className="flex-1 overflow-y-auto py-6 pr-2 my-4 border-b border-slate-100 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
              <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                Chào mừng quý khách đến với trung tâm Vật lý trị liệu và Phục hồi chức năng <strong>OfficeCare</strong>. Trước khi tiếp tục đặt lịch hẹn điều trị, xin vui lòng đọc kỹ và xác nhận các điều khoản quy định dưới đây:
              </p>

              {TERMS_OF_SERVICE.map((section) => (
                <div key={section.heading} className="space-y-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="size-1.5 bg-[#0D9488] rounded-full shrink-0" />
                    {section.heading}
                  </h3>
                  <div className="space-y-2.5 pl-3.5">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        {p}
                      </p>
                    ))}
                    {section.bullets && (
                      <ul className="space-y-1.5 pl-1">
                        {section.bullets.map((b, idx) => (
                          <li key={idx} className="text-[11px] text-slate-500 font-semibold leading-relaxed flex items-start gap-2">
                            <span className="mt-1.5 size-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Form & Agreement Checkbox */}
            <div className="pt-2 shrink-0 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 size-4 text-primary border-slate-200 rounded-md focus:ring-primary/20 cursor-pointer"
                />
                <span className="text-[11px] text-slate-550 font-bold group-hover:text-secondary transition-colors leading-relaxed select-none">
                  Tôi đã đọc, hiểu rõ và đồng ý với tất cả Điều khoản dịch vụ & Quy chế uy tín của OfficeCare.
                </span>
              </label>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="py-3.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center flex-1 shadow-sm"
                >
                  Quay lại trang chủ
                </button>
                <button
                  type="button"
                  disabled={!acceptedTerms || agreeingLoading}
                  onClick={handleAgreeTerms}
                  className="py-3.5 px-6 bg-primary hover:bg-[#25A89C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-[2] shadow-md shadow-primary/10 cursor-pointer"
                >
                  {agreeingLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Đang lưu đồng ý...
                    </>
                  ) : (
                    'Đồng ý & Tiếp tục đặt lịch'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              Đặt lịch khám lượng giá hoặc trị liệu với chuyên gia để xác định nguyên nhân đau nhức và xây dựng lộ trình phục hồi sức khỏe phù hợp.
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
                <span className="text-xs font-extrabold text-[#0F172A]">Trị liệu chuyên sâu</span>
              </div>
            </motion.div>

            {/* Elegant trust info banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl max-w-md mt-4"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold">✓</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-800">Đặt lịch hẹn nhanh trong 3 bước</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Lựa chọn dịch vụ, thời gian và chuyên gia mong muốn ở biểu mẫu bên dưới. Lịch hẹn của bạn sẽ được đồng bộ và xác nhận.
                </p>
              </div>
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
                  onTimeout={handleTimeout}
                  services={services}
                  servicesLoading={servicesLoading}
                  state={state}
                  bookedSlots={bookedSlots}
                  specialists={specialists}
                  slotAvailability={slotAvailability}
                  selectedStaffId={selectedStaffId}
                  setSelectedStaffId={setSelectedStaffId}
                  hasExistingClinicalExam={hasExistingClinicalExam}
                  tempHoldId={tempHoldId}
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
                  bookingType === 'dich_vu' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-emerald-50 text-emerald-650 border-emerald-100'
                }`}>
                  {bookingType === 'dich_vu' ? 'Trị liệu lẻ' : 'Lịch khám'}
                </span>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-jakarta font-black text-[#0F172A]">
                    {selectedService?.ten_dich_vu || (bookingType === 'dich_vu' ? 'Chọn dịch vụ' : 'Chọn gói khám')}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {bookingType === 'dich_vu' ? 'Trị liệu dịch vụ lẻ nhanh' : 'Đánh giá & lượng giá chuyên sâu'}
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
                    {selectedService ? `${selectedService.thoi_luong_phut} phút` : '...'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider">Chi phí</span>
                  <span className="text-teal-600 bg-teal-50 border-teal-100 font-extrabold px-2.5 py-0.5 rounded-full border">
                    {selectedService ? `${Number(selectedService.don_gia).toLocaleString('vi-VN')}đ` : '...'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Benefit checks */}
              <div className="space-y-3 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {bookingType === 'dich_vu' ? 'Nội dung thực hiện' : 'Quyền lợi khám'}
                </p>
                <ul className="space-y-2 text-xs font-bold text-slate-650">
                  {selectedService?.muc_tieu ? (
                    selectedService.muc_tieu.split('\n').filter((l: string) => l.trim()).slice(0, 3).map((goal: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-[#2EC4B6]">✓</span>
                        <span>{goal.replace(/^-\s*/, '').replace(/^\*\s*/, '')}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-[#2EC4B6]">✓</span> Lượng giá tầm vận động (ROM)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#2EC4B6]">✓</span> Xác định tận gốc nguyên nhân đau
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#2EC4B6]">✓</span> Nhận phác đồ y khoa cá nhân hóa
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC PROCESS & OBJECTIVE SECTION (Replaces TrustSection) */}
        {selectedService ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-xl text-left space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-teal-55 text-[#2EC4B6] border border-teal-100">
                Chi tiết dịch vụ đã chọn
              </span>
              <h3 className="text-2xl font-jakarta font-black text-slate-800 tracking-tight leading-tight">
                Quy trình & Mục tiêu trị liệu của {selectedService.ten_dich_vu}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Quy trình thực hiện (Process) */}
              <div className="bg-slate-50/50 rounded-3xl p-6.5 border border-slate-100 space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/60 pb-3">
                  <span className="text-[#2EC4B6]">📋</span> Quy trình thực hiện
                </h4>
                {selectedService.quy_trinh ? (
                  <ul className="space-y-3 pl-0 list-none">
                    {selectedService.quy_trinh.split('\n').filter((line: string) => line.trim()).map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-xs font-bold text-slate-650 leading-relaxed">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#2EC4B6]/15 text-[#2EC4B6] text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step.replace(/^\d+\.\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-455 font-bold italic text-slate-400">Chưa có quy trình cụ thể cho dịch vụ này.</p>
                )}
              </div>

              {/* Mục tiêu trị liệu (Objective) */}
              <div className="bg-slate-50/50 rounded-3xl p-6.5 border border-slate-100 space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/60 pb-3">
                  <span className="text-[#2EC4B6]">🎯</span> Mục tiêu trị liệu
                </h4>
                {selectedService.muc_tieu ? (
                  <ul className="space-y-3 pl-0 list-none">
                    {selectedService.muc_tieu.split('\n').filter((line: string) => line.trim()).map((goal: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-xs font-bold text-slate-650 leading-relaxed">
                        <span className="text-emerald-500 font-extrabold shrink-0 mt-0.5">✓</span>
                        <span>{goal.replace(/^-\s*/, '').replace(/^\*\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-455 font-bold italic text-slate-400">Chưa có mục tiêu cụ thể cho dịch vụ này.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/50 border border-slate-150 border-dashed rounded-[32px] p-10 text-center text-slate-400 font-bold">
            💡 Vui lòng chọn một dịch vụ khám hoặc trị liệu lẻ để xem Quy trình & Mục tiêu điều trị chi tiết.
          </div>
        )}

      </div>
    </div>
  );
}

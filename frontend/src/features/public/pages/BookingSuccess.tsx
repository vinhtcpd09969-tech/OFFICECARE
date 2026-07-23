import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Activity, 
  AlertCircle, 
  Home as HomeIcon,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';

interface AppointmentData {
  id: string;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: 'chua_xac_nhan' | 'cho_xac_nhan' | 'da_xac_nhan' | 'da_checkin' | 'dang_kham' | 'hoan_thanh' | 'da_huy' | 'khong_den' | 'da_huy_phat' | 'khach_khong_den_phat' | 'khach_khong_den';
  ho_ten_khach: string;
  so_dien_thoai: string;
  gioi_tinh_khach: string;
  ten_dich_vu: string | null;
  ten_ky_thuat_vien: string | null;
  ky_thuat_vien_id: string | null;
  phong_id: string | null;
  ten_phong: string | null;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ly_do_huy: string | null;
  ghi_chu_noi_bo?: string | null;
  thoi_gian_huy: string | null;
  ly_do_kham: string | null;
  ghi_chu_dat_lich: string | null;
  thoi_gian_tao: string;
  han_xac_nhan?: string | null;
}

export default function BookingSuccess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [triggerTransition, setTriggerTransition] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!appointment || appointment.trang_thai !== 'chua_xac_nhan' || !appointment.han_xac_nhan) {
      setOtpTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(appointment.han_xac_nhan!).getTime() - Date.now();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    setOtpTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setOtpTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [appointment?.han_xac_nhan, appointment?.trang_thai]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpInput.trim();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error('Vui lòng nhập đúng mã OTP 6 chữ số.');
      return;
    }

    setOtpVerifying(true);
    try {
      const response = await fetch(`http://localhost:5001/api/client/appointments/public/confirm-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, otp }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success('Xác thực OTP thành công! Lịch hẹn của bạn đang chờ Lễ tân duyệt.');
        setAppointment(resData.appointment || null);
      } else {
        toast.error(resData.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      console.error('Lỗi xác thực OTP:', err);
      toast.error('Không thể kết nối máy chủ xác thực.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpResending(true);
    try {
      const response = await fetch(`http://localhost:5001/api/client/appointments/public/${id}/resend-otp`, {
        method: 'POST',
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success('Đã gửi lại mã OTP thành công! Vui lòng kiểm tra email của bạn.');
        const trackRes = await fetch(`http://localhost:5001/api/client/appointments/public/track/${id}`);
        if (trackRes.ok) {
          const trackData = await trackRes.json();
          setAppointment(trackData);
        }
      } else {
        toast.error(resData.message || 'Không thể gửi lại OTP.');
      }
    } catch (err) {
      console.error('Lỗi gửi lại OTP:', err);
      toast.error('Không thể kết nối máy chủ.');
    } finally {
      setOtpResending(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('confirmed') === 'true') {
      toast.success('🎉 Xác nhận lịch hẹn qua email thành công!', { duration: 6000 });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let pollCount = 0;

    const fetchStatus = async (isFirstLoad = false) => {
      try {
        const response = await fetch(`http://localhost:5001/api/client/appointments/public/track/${id}`);
        if (!response.ok) {
          throw new Error('Không thể tải thông tin lịch hẹn.');
        }
        const data = await response.json();
        
        if (isMounted) {
          if (appointment && appointment.trang_thai === 'cho_xac_nhan' && data.trang_thai === 'da_xac_nhan') {
            setTriggerTransition(true);
            toast.success('Trung tâm xác nhận đã phê duyệt lịch hẹn của bạn!', { icon: '🎉', duration: 5000 });
            setTimeout(() => setTriggerTransition(false), 3000);
          }

          setAppointment(data);
          setError(null);
          if (isFirstLoad) setLoading(false);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải trạng thái lịch hẹn:', err);
        if (isMounted && isFirstLoad) {
          setError(err.message || 'Lỗi kết nối máy chủ y khoa.');
          setLoading(false);
        }
      }
    };

    fetchStatus(true);

    const interval = setInterval(() => {
      pollCount++;
      if (pollCount > 360) {
        clearInterval(interval);
        return;
      }
      fetchStatus(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id, appointment?.trang_thai]);

  const formatFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative size-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-t-2 border-emerald-400 animate-spin animate-reverse"></div>
          </div>
          <p className="text-[10px] font-heading font-black tracking-widest text-slate-400 uppercase">
            Đang đồng bộ dữ liệu y khoa...
          </p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-850 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-red-150 p-8 text-center space-y-6 rounded-[24px] shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-heading font-black text-slate-900 uppercase tracking-wider">Không tìm thấy lịch đặt</h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            {error || 'Lịch đặt không tồn tại hoặc đường dẫn của bạn đã hết hạn. Vui lòng kiểm tra lại.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-slate-700 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all border border-zinc-200"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  const isUnconfirmed = appointment.trang_thai === 'chua_xac_nhan';
  const isConfirmed = ['da_xac_nhan', 'da_checkin', 'dang_kham', 'hoan_thanh'].includes(appointment.trang_thai);
  const isCancelled = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(appointment.trang_thai);

  const isStep2Passed = ['da_xac_nhan', 'da_checkin', 'dang_kham', 'hoan_thanh'].includes(appointment.trang_thai);
  const isStep2Pending = ['chua_xac_nhan', 'cho_xac_nhan'].includes(appointment.trang_thai) && !isCancelled;
  const isStep4Passed = ['hoan_thanh'].includes(appointment.trang_thai);
  const isStep4Pending = !isStep4Passed && !isCancelled && isStep2Passed;

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-700 py-16 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-500 ${triggerTransition ? 'bg-emerald-50' : ''}`}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00c_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60"></div>

      <div className="max-w-2xl mx-auto relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Trang chủ</span>
            <ChevronRight size={12} />
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/booking')}>Đặt Lịch</span>
            <ChevronRight size={12} />
            <span className="text-slate-800">Xác thực lịch đặt</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Mã lịch đặt:</span>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs">
              {appointment.ma_lich_dat}
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
            <span className="size-1.5 bg-primary rounded-full animate-ping"></span>
            Thông tin hệ thống: Đăng ký thành công
          </div>
          <h1 className="text-3xl font-heading font-black text-slate-900 tracking-tight uppercase">
            {isConfirmed ? 'Đăng Ký Lịch Hẹn Thành Công' : isCancelled ? 'Lịch Hẹn Đã Bị Hủy' : isUnconfirmed ? 'Đang Chờ Xác Thực OTP' : 'Lịch Hẹn Đang Chờ Phê Duyệt'}
          </h1>
          <p className="text-sm text-slate-500 font-semibold max-w-xl mx-auto leading-relaxed">
            {isConfirmed 
              ? 'Lịch hẹn của bạn đã được tiếp nhận và xác nhận thành công. Vui lòng tới phòng khám đúng giờ hẹn để bắt đầu ca trị liệu.'
              : isCancelled 
                ? `Lịch hẹn này đã bị hủy. Lý do: "${appointment.ly_do_huy || appointment.ghi_chu_noi_bo || 'Hủy bởi hệ thống'}"`
                : isUnconfirmed
                  ? 'Bạn đã đăng ký thông tin lịch đặt thành công! Vui lòng kiểm tra hòm thư email và nhập mã OTP 6 số để kích hoạt ca hẹn.'
                  : 'Lịch hẹn đã được xác thực OTP thành công. Trung tâm xác nhận đang sắp xếp bác sĩ phụ trách và phòng điều trị cho bạn.'}
          </p>
        </div>

        {/* OTP VERIFICATION CARD (Displayed only when unconfirmed) */}
        {isUnconfirmed && (
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/20 p-6 sm:p-8 rounded-[24px] shadow-[0_10px_30px_rgba(245,158,11,0.03)] text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-amber-500 text-white rounded-full flex items-center justify-center font-black animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                🔑
              </div>
              <div>
                <h3 className="text-sm font-heading font-black text-amber-800 dark:text-amber-500 uppercase tracking-wider">
                  Xác Thực Lịch Hẹn Bằng OTP
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Yêu cầu nhập mã xác thực
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-650 dark:text-zinc-400 font-semibold leading-relaxed">
              Chúng tôi đã gửi một mã OTP 6 chữ số đến địa chỉ email đăng ký của bạn. Vui lòng nhập mã để kích hoạt và giữ chỗ lịch hẹn.
            </p>

            {otpTimeLeft !== null && (
              <div className={`p-3 rounded-xl text-xs flex items-center justify-between font-semibold ${otpTimeLeft > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-fade-in' : 'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse'}`}>
                <div className="flex items-center gap-2">
                  <Clock size={14} className={otpTimeLeft > 0 ? 'text-amber-500 animate-pulse shrink-0' : 'text-rose-500 shrink-0'} />
                  <span>{otpTimeLeft > 0 ? 'Mã OTP sẽ hết hạn sau:' : 'Mã OTP đã hết hạn!'}</span>
                </div>
                <span className="font-mono font-extrabold text-sm px-2 py-0.5 bg-white rounded-lg shadow-sm shrink-0">
                  {otpTimeLeft > 0 ? `${Math.floor(otpTimeLeft / 60)}:${(otpTimeLeft % 60).toString().padStart(2, '0')}` : '0:00'}
                </span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập 6 chữ số OTP"
                disabled={otpVerifying || (otpTimeLeft !== null && otpTimeLeft <= 0)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-center text-lg font-mono font-black tracking-widest rounded-2xl outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                type="submit"
                disabled={otpVerifying || otpInput.length !== 6 || (otpTimeLeft !== null && otpTimeLeft <= 0)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
              >
                {otpVerifying ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </form>

            <div className="flex justify-between items-center text-[10px] pt-1 font-bold">
              <span className="text-slate-400">Không nhận được mã?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpResending}
                className="text-amber-600 hover:text-amber-700 hover:underline cursor-pointer disabled:opacity-50"
              >
                {otpResending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
              </button>
            </div>
          </div>
        )}

        {/* LỊCH HẸN DETAILS CARD (Centerpiece) */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 sm:p-8 shadow-sm space-y-6 text-left">
          <h3 className="text-sm font-heading font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Activity size={16} className="text-[#0D9488]" />
            Thông Tin Chi Tiết Lịch Đăng Ký
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Dịch vụ trị liệu</span>
              <span className="text-slate-800 font-extrabold">{appointment.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}</span>
            </div>

            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px] mt-0.5">Thời gian bắt đầu</span>
              <div className="text-right">
                <span className="text-slate-800 font-extrabold block">{getRelativeTime(appointment.ngay_gio_bat_dau)}</span>
                <span className="text-slate-455 text-[10px] font-bold block mt-0.5">{formatFullDate(appointment.ngay_gio_bat_dau).split(' lúc ')[0]}</span>
              </div>
            </div>

            {isConfirmed && appointment.ten_phong && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Phòng khám lâm sàng</span>
                <span className="text-[#0D9488] font-extrabold flex items-center gap-1">
                  <MapPin size={13} />
                  {appointment.ten_phong}
                </span>
              </div>
            )}

            {isConfirmed && appointment.ten_ky_thuat_vien && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Bác sĩ lượng giá</span>
                <span className="text-slate-855 font-black text-slate-800 flex items-center gap-1">
                  <User size={13} className="text-[#0D9488]" />
                  {appointment.ten_ky_thuat_vien}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pb-1">
              <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Họ tên bệnh nhân</span>
              <span className="text-slate-800 font-extrabold">{appointment.ho_ten_khach}</span>
            </div>
          </div>
        </div>

        {/* Live Progress Logs Panel */}
        {!isCancelled && (
          <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[24px] shadow-sm space-y-6 text-left">
            <h3 className="text-sm font-heading font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Tiến Trình Xác Thực Y Khoa
            </h3>

            {/* Progress Steps */}
            <div className="relative border-l border-slate-250 ml-3 pl-4 space-y-5 text-xs">
              {/* Step 1: Đăng ký lịch thành công */}
              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 size-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-white ring-4 ring-emerald-50">
                  <CheckCircle2 size={8} />
                </div>
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                  1. Đăng ký lịch thành công <span className="text-[9px] text-slate-400 font-mono font-normal">[{getRelativeTime(appointment.thoi_gian_tao)}]</span>
                </h4>
              </div>

              {/* Step 2: Đã Xác nhận */}
              <div className="relative">
                <div className={`absolute -left-[23px] top-0.5 size-3 rounded-full border border-white flex items-center justify-center text-white
                  ${isStep2Passed
                    ? 'bg-emerald-500 ring-4 ring-emerald-50' 
                    : isStep2Pending
                      ? 'bg-amber-500 animate-pulse ring-4 ring-amber-50'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isStep2Passed ? <CheckCircle2 size={8} /> : <Clock size={8} />}
                </div>
                <h4 className={`font-extrabold uppercase tracking-wider text-[10px] ${isStep2Passed ? 'text-slate-800' : 'text-slate-400'}`}>
                  2. Trung tâm phê duyệt & xác nhận
                </h4>
              </div>

              {/* Step 3: Hoàn thành */}
              <div className="relative">
                <div className={`absolute -left-[23px] top-0.5 size-3 rounded-full border border-white flex items-center justify-center text-white
                  ${isStep4Passed 
                    ? 'bg-emerald-500 ring-4 ring-emerald-50' 
                    : isStep4Pending
                      ? 'bg-amber-500 animate-pulse ring-4 ring-amber-50'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isStep4Passed ? <CheckCircle2 size={8} /> : <Clock size={8} />}
                </div>
                <h4 className={`font-extrabold uppercase tracking-wider text-[10px] ${isStep4Passed ? 'text-slate-800' : 'text-slate-400'}`}>
                  3. Hoàn thành khám trị liệu
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Ghi chú & Lời khuyên */}
        {!isCancelled && appointment.ghi_chu_noi_bo && (
          <div className="bg-amber-50/20 border border-amber-100 p-6 rounded-[24px] text-left space-y-3">
            <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              📌 Lời khuyên từ phòng khám:
            </h4>
            <p className="text-xs text-slate-650 italic font-semibold">
              "{appointment.ghi_chu_noi_bo}"
            </p>
          </div>
        )}

        {/* Hotline Note */}
        <div className="bg-slate-50 border border-slate-150 p-6 rounded-[24px] text-left text-xs text-slate-500 leading-relaxed font-semibold">
          ⚠️ <strong>Lưu ý:</strong> Mọi nhu cầu thay đổi, dời hoặc hủy ca hẹn vui lòng liên hệ hotline: <strong>1900 6868</strong> trước giờ bắt đầu tối thiểu <strong>8 tiếng</strong> để được hỗ trợ kịp thời.
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-600 font-extrabold rounded-xl text-xs uppercase tracking-widest transition-all border border-slate-200 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <HomeIcon size={14} />
            Quay lại Trang chủ
          </button>
          
          {isAuthenticated() ? (
            <button
              onClick={() => navigate('/appointments')}
              className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
            >
              Vào trang Lịch hẹn của tôi
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98 cursor-pointer"
            >
              Đăng nhập để xem Lịch đặt
              <ArrowRight size={14} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Activity, 
  ShieldCheck, 
  QrCode, 
  AlertCircle, 
  Home as HomeIcon,
  ChevronRight,
  ArrowRight,
  Stethoscope,
  Info,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';

interface AppointmentData {
  id: string;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: 'chua_xac_nhan' | 'cho_xac_nhan' | 'da_xac_nhan' | 'hoan_thanh' | 'da_huy';
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
  thoi_gian_huy: string | null;
  ly_do_kham: string | null;
  ghi_chu_dat_lich: string | null;
  thoi_gian_tao: string;
}

export default function BookingSuccess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [triggerTransition, setTriggerTransition] = useState(false);

  // Check email confirmed redirect param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('confirmed') === 'true') {
      toast.success('🎉 Xác nhận lịch hẹn qua email thành công!', { duration: 6000 });
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.1);
          osc.frequency.setValueAtTime(783.99, now + 0.2);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        }
      } catch (e) {
        console.error('Lỗi âm thanh:', e);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Poll status every 5 seconds
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
          // Detect transition from pending to confirmed to play animation
          if (appointment && appointment.trang_thai === 'cho_xac_nhan' && data.trang_thai === 'da_xac_nhan') {
            setTriggerTransition(true);
            toast.success('Lễ tân đã phê duyệt lịch hẹn của bạn!', { icon: '🎉', duration: 5000 });
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
      // Limit polling to 30 minutes to save bandwidth (360 ticks)
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
  const isPending = appointment.trang_thai === 'cho_xac_nhan';
  const isConfirmed = appointment.trang_thai === 'da_xac_nhan';
  const isCancelled = appointment.trang_thai === 'da_huy';

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-700 py-16 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-500 ${triggerTransition ? 'bg-emerald-50' : ''}`}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00c_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/')}>Trang chủ</span>
            <ChevronRight size={12} />
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/booking')}>Đặt Lịch</span>
            <ChevronRight size={12} />
            <span className="text-slate-800">Thông tin lịch đặt</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Mã lịch đặt:</span>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs">
              {appointment.ma_lich_dat}
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3 rounded-full">
            <span className="size-1.5 bg-primary rounded-full animate-ping"></span>
            Thông tin hệ thống: Khám lâm sàng
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight uppercase">
            {isConfirmed ? 'Lịch Hẹn Đã Được Xác Nhận' : isCancelled ? 'Lịch Hẹn Đã Bị Hủy' : isUnconfirmed ? 'Đang Chờ Xác Nhận Email' : 'Lịch Hẹn Đang Chờ Phân Bổ'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-semibold max-w-2xl leading-relaxed">
            {isConfirmed 
              ? 'Lịch hẹn của bạn đã được tiếp nhận thành công. Mời bạn quét mã QR dưới đây tại quầy lễ tân để tiến hành check-in.'
              : isCancelled 
                ? `Lịch hẹn này đã được hủy bỏ. Lý do: "${appointment.ly_do_huy || 'Hủy bởi hệ thống'}"`
                : isUnconfirmed
                  ? 'Bạn đã đặt lịch thành công! Vui lòng kiểm tra email của bạn để xác nhận giữ chỗ. Nếu chưa xác nhận, thông tin sẽ được chuyển đến bộ phận lễ tân để liên hệ hỗ trợ trực tiếp.'
                  : 'Lịch hẹn đã được bạn xác nhận qua email thành công. Lễ tân đang rà soát ca trực và sắp xếp phòng khám cho bạn.'}
          </p>
        </div>

        {isUnconfirmed && (
          <div className="mb-8 bg-rose-50 border-2 border-rose-200 p-5 rounded-[24px] text-left text-xs flex items-start gap-4 text-rose-900 leading-relaxed font-semibold shadow-sm animate-pulse">
            <div className="size-8 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
              📧
            </div>
            <div>
              <p className="font-extrabold uppercase tracking-wider text-rose-800 text-[10px]">Yêu cầu xác thực lịch đặt</p>
              <p className="mt-1 font-extrabold text-sm text-rose-700">
                Vui lòng kiểm tra hộp thư đến Email của bạn và nhấn nút "Xác Nhận Giữ Chỗ Ngay" để hoàn tất giữ lịch hẹn khám!
              </p>
            </div>
          </div>
        )}

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (Span 5): Premium Light Pass Ticket */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className={`bg-white border transition-all duration-700 relative overflow-hidden rounded-[24px] shadow-sm
              ${isConfirmed 
                ? 'border-emerald-200 shadow-emerald-500/5' 
                : isCancelled 
                  ? 'border-rose-200 shadow-rose-500/5' 
                  : 'border-amber-200 shadow-amber-500/5'
              }`}
            >
              
              {/* Status Header Band */}
              <div className={`px-6 py-4 flex justify-between items-center text-xs font-black uppercase tracking-wider border-b
                ${isConfirmed 
                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                  : isCancelled 
                    ? 'bg-rose-50/50 border-rose-100 text-rose-800' 
                    : 'bg-amber-50/50 border-amber-100 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full block
                    ${isConfirmed 
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                      : isCancelled 
                        ? 'bg-rose-500' 
                        : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                    }`}
                  ></span>
                  {isConfirmed ? 'CHECK-IN SẴN SÀNG' : isCancelled ? 'ĐÃ HỦY LỊCH' : 'ĐANG CHỜ PHÊ DUYỆT'}
                </div>
                <div className="font-mono text-[9px] text-slate-400 tracking-wider">
                  PHYSIO_PASS
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-6 space-y-6">
                
                {/* Visual QR Code Box */}
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[20px] relative flex flex-col items-center justify-center group">
                  
                  {/* Laser Scan line effect */}
                  {!isCancelled && isConfirmed && (
                    <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-bounce z-10 pointer-events-none" style={{ animationDuration: '3.5s' }}></div>
                  )}

                  {/* QR Image Container */}
                  <div className="relative size-40 bg-white p-3.5 rounded-xl shadow-md border border-slate-100 transition-transform group-hover:scale-102 duration-300">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                      <path d="M0,0 h30 v10 h-20 v20 h-10 z" fill="currentColor"/>
                      <path d="M70,0 h30 v30 h-10 v-20 h-20 z" fill="currentColor"/>
                      <path d="M0,70 h10 v20 h20 v10 h-30 z" fill="currentColor"/>
                      <path d="M80,80 h10 v10 h-10 z" fill="currentColor"/>
                      <path d="M10,10 h10 v10 h-10 z" fill="currentColor"/>
                      <path d="M80,10 h10 v10 h-10 z" fill="currentColor"/>
                      <path d="M10,80 h10 v10 h-10 z" fill="currentColor"/>
                      
                      {/* Grid patterns */}
                      <rect x="35" y="10" width="10" height="10" fill="currentColor" />
                      <rect x="50" y="10" width="5" height="5" fill="currentColor" />
                      <rect x="50" y="20" width="15" height="5" fill="currentColor" />
                      <rect x="35" y="35" width="5" height="15" fill="currentColor" />
                      <rect x="45" y="45" width="20" height="10" fill="currentColor" />
                      <rect x="15" y="35" width="15" height="5" fill="currentColor" />
                      <rect x="10" y="45" width="5" height="15" fill="currentColor" />
                      <rect x="70" y="35" width="15" height="15" fill="currentColor" />
                      <rect x="70" y="55" width="10" height="20" fill="currentColor" />
                      <rect x="35" y="70" width="25" height="5" fill="currentColor" />
                      <rect x="35" y="80" width="10" height="10" fill="currentColor" />
                      <rect x="50" y="85" width="15" height="5" fill="currentColor" />
                    </svg>

                    {/* Pending Watermark overlay */}
                    {(isUnconfirmed || isPending) && (
                      <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-3 text-center rounded-xl border border-amber-100">
                        <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse mb-1" />
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                          {isUnconfirmed ? 'CHƯA XÁC NHẬN (EMAIL)' : 'CHỜ PHÂN BỔ'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-1">
                          {isUnconfirmed ? 'Vui lòng xác nhận qua email để giữ chỗ' : 'Đang chờ Quản lý phân phòng/bác sĩ'}
                        </span>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-3 text-center rounded-xl border border-rose-100">
                        <AlertCircle className="w-8 h-8 text-rose-500 mb-1" />
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">ĐÃ HỦY</span>
                      </div>
                    )}
                  </div>
                  
                  <span className="mt-3 text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                    {isConfirmed ? 'QUÉT TẠI QUẦY ĐỂ CHECK-IN' : 'ĐANG CHỜ HỆ THỐNG PHÊ DUYỆT'}
                  </span>
                </div>

                {/* Ticket Specifications */}
                <div className="space-y-3.5 pt-1 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Dịch vụ</span>
                    <span className="text-slate-800 font-extrabold">{appointment.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}</span>
                  </div>

                  <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mt-0.5">Giờ Khám</span>
                    <div className="text-right">
                      <span className="text-slate-800 font-extrabold block">{getRelativeTime(appointment.ngay_gio_bat_dau)}</span>
                      <span className="text-slate-400 text-[10px] font-bold block mt-0.5">{formatFullDate(appointment.ngay_gio_bat_dau).split(' lúc ')[0]}</span>
                    </div>
                  </div>

                  {isConfirmed && appointment.ten_phong && (
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Phòng lâm sàng</span>
                      <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                        <MapPin size={13} />
                        {appointment.ten_phong}
                      </span>
                    </div>
                  )}

                  {isConfirmed && appointment.ten_ky_thuat_vien && (
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Bác sĩ lượng giá</span>
                      <span className="text-slate-800 font-extrabold flex items-center gap-1">
                        <User size={13} className="text-primary" />
                        {appointment.ten_ky_thuat_vien}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Khách hàng</span>
                    <span className="text-slate-800 font-extrabold">{appointment.ho_ten_khach}</span>
                  </div>
                </div>

                {/* Ticket Circle Cutouts and Dashed line */}
                <div className="relative h-px border-t border-dashed border-slate-200 my-2">
                  <span className="absolute -left-9 -top-2.5 size-5 bg-slate-50 rounded-full border-r border-slate-200"></span>
                  <span className="absolute -right-9 -top-2.5 size-5 bg-slate-50 rounded-full border-l border-slate-200"></span>
                </div>

                {/* Invitation Details */}
                <div className="text-center bg-slate-50 p-4 border border-slate-100 rounded-xl">
                  {isConfirmed ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">VÉ CHECK-IN HỢP LỆ</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Mời quý khách tới quầy lễ tân để tiến hành check-in.</p>
                    </div>
                  ) : isCancelled ? (
                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider">LỊCH HẸN ĐÃ BỊ HỦY</p>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-amber-600 uppercase tracking-wider animate-pulse">
                        {isUnconfirmed ? 'CHƯA XÁC NHẬN GIỮ CHỖ' : 'LỄ TÂN ĐANG XẾP LỊCH'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {isUnconfirmed ? 'Vui lòng kiểm tra hộp thư đến của bạn để xác nhận lịch' : 'Bác sĩ và số phòng sẽ hiển thị ngay khi lịch đặt được xác nhận.'}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (Span 7): Progress Timeline & Instructions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Progress Logs Panel */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-[24px] shadow-sm space-y-8">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-sm font-heading font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  Tiến Trình Xác Thực Y Khoa
                </h3>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider">PROGRESS_LOG</span>
              </div>

              {/* Progress Steps */}
              <div className="relative border-l border-slate-100 ml-4 pl-6 space-y-8 text-xs">
                
                {/* Step 1: Booking success */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 size-4 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-white ring-4 ring-emerald-50">
                    <CheckCircle2 size={10} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      1. Gửi Đăng Ký Thành Công
                      <span className="text-[10px] text-slate-400 font-mono font-normal">[{getRelativeTime(appointment.thoi_gian_tao)}]</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Thông tin lịch khám lượng giá đã được lưu vào hệ thống PhysioFlow thành công.
                    </p>
                  </div>
                </div>

                {/* Step 2: Reception review */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 size-4 rounded-full border border-white flex items-center justify-center text-white
                    ${isConfirmed || appointment.trang_thai === 'hoan_thanh'
                      ? 'bg-emerald-500 ring-4 ring-emerald-50' 
                      : isCancelled
                        ? 'bg-rose-500'
                        : 'bg-amber-500 animate-pulse ring-4 ring-amber-50'
                    }`}
                  >
                    {isConfirmed || appointment.trang_thai === 'hoan_thanh' ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <Clock size={10} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider">
                      2. Lễ Tân Xác Nhận Lịch Trình
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      {isConfirmed || appointment.trang_thai === 'hoan_thanh' ? (
                        <span className="text-emerald-600 font-bold">✓ Đã xác thực lịch đặt. Lễ tân đã xếp phòng và nhân sự trực tiếp khám cho bạn.</span>
                      ) : isCancelled ? (
                        <span className="text-rose-600 font-bold">✕ Lịch khám này đã bị hủy.</span>
                      ) : (
                        'Nhân viên tiếp nhận đang rà soát ca trực của Bác sĩ và kiểm tra phòng khám lâm sàng trống.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Step 3: Check-in ready */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 size-4 rounded-full border border-white flex items-center justify-center text-slate-400
                    ${isConfirmed 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-50 animate-pulse' 
                      : appointment.trang_thai === 'hoan_thanh'
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                        : 'bg-slate-100'
                    }`}
                  >
                    {appointment.trang_thai === 'hoan_thanh' ? (
                      <CheckCircle2 size={10} />
                    ) : (
                      <QrCode size={10} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider">
                      3. Check-in & Kiểm Tra Sinh Hiệu
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      {isConfirmed ? (
                        <span className="text-primary font-black animate-pulse">● SẴN SÀNG TIẾP ĐÓN: Vui lòng có mặt tại phòng khám để lễ tân quét mã check-in.</span>
                      ) : appointment.trang_thai === 'hoan_thanh' ? (
                        <span className="text-slate-400 font-semibold">Đã hoàn thành khám lượng giá lâm sàng.</span>
                      ) : (
                        'Quý khách hãy đến trước giờ hẹn 10 phút để thực hiện đo chỉ số huyết áp, cân nặng miễn phí trước khi gặp Bác sĩ chuyên khoa.'
                      )}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* Diagnostics details card */}
            <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Stethoscope size={15} className="text-primary" />
                Triệu chứng đã đăng ký
              </h3>
              
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-xs leading-relaxed text-slate-700 font-medium space-y-3">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Mô tả triệu chứng & Vùng đau nhức:</span>
                  <p className="bg-white p-3 border border-slate-200 font-bold text-slate-800 rounded-lg">{appointment.ly_do_kham || 'Không có mô tả chi tiết.'}</p>
                </div>
                
                {appointment.ghi_chu_dat_lich && (
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Ghi chú gửi kèm:</span>
                    <p className="italic text-slate-500">"{appointment.ghi_chu_dat_lich}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preparation Clinical guidelines card */}
            <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Info size={15} className="text-primary" />
                Chỉ Dẫn Cho Buổi Hẹn Khám
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-slate-500">
                <div className="flex gap-2.5 items-start bg-slate-50 p-3.5 border border-slate-100 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-slate-800 block mb-0.5">Trang phục thoải mái</strong>
                    Mặc đồ co giãn tốt hoặc rộng rãi để thuận tiện kiểm tra và đo đạc tầm vận động khớp khớp vai/lưng/gối.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start bg-slate-50 p-3.5 border border-slate-100 rounded-xl">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-slate-800 block mb-0.5">Hồ sơ bệnh án cũ</strong>
                    Mang theo kết quả chụp X-Quang, phim MRI hoặc đơn thuốc cũ liên quan (nếu có) để bác sĩ chẩn đoán chính xác.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl text-xs uppercase tracking-widest transition-all border border-slate-200 flex items-center justify-center gap-2 active:scale-98"
              >
                <HomeIcon size={14} />
                Quay lại Trang chủ
              </button>
              
              {isAuthenticated() ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
                >
                  Vào Dashboard Quản lý
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
                >
                  Đăng nhập để xem Lịch đặt
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

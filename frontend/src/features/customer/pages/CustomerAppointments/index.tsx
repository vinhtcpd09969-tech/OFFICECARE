import { useState, useEffect } from 'react';
import { 
  Calendar, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  PlusCircle,
  Star,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '../../../../utils/imageUrl';

interface Appointment {
  id: string;
  phac_do_dieu_tri_id?: string | null;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: string;
  loai_lich: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_dich_vu: string | null;
  ten_ky_thuat_vien: string | null;
  ten_phong: string | null;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ly_do_huy: string | null;
  ghi_chu_noi_bo: string | null;
  thoi_gian_huy: string | null;
  ly_do_kham: string | null;
  thoi_gian_tao: string;
  han_xac_nhan?: string | null;
  rating_id?: string | null;
  rating_stars?: number | null;
  rating_comment?: string | null;
  rating_service_id?: string | null;
  rating_service_stars?: number | null;
  rating_service_comment?: string | null;
  rating_staff_id?: string | null;
  rating_staff_stars?: number | null;
  rating_staff_comment?: string | null;
  loai_goi?: string;
  phac_do_status?: string;
  diem_uy_tin?: number;
  anh_bac_si?: string | null;
}

export default function CustomerAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lyDoHuy, setLyDoHuy] = useState<string>('');
  const [ratingApptId, setRatingApptId] = useState<string | null>(null);
  
  // Separate rating states
  const [ratingStarsService, setRatingStarsService] = useState<number>(5);
  const [ratingCommentService, setRatingCommentService] = useState<string>('');
  const [ratingStarsStaff, setRatingStarsStaff] = useState<number>(5);
  const [ratingCommentStaff, setRatingCommentStaff] = useState<string>('');

  // Pending ratings list for top notification banner
  const [pendingRatingAppts, setPendingRatingAppts] = useState<any[]>([]);

  const fetchPendingRatings = async () => {
    try {
      const res = await api.get('/client/appointments/pending-rating');
      setPendingRatingAppts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi nạp danh sách chưa đánh giá:', err);
    }
  };

  // Filtering States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateMode, setDateMode] = useState<'day' | 'week' | 'month'>('week');
  const [dateAnchor, setDateAnchor] = useState<Date>(new Date());

  // Inline OTP states
  const [otpInput, setOtpInput] = useState<string>('');
  const [verifyingOtpId, setVerifyingOtpId] = useState<string | null>(null);
  const [resendingOtpId, setResendingOtpId] = useState<string | null>(null);

  // Time ticker state for realtime countdown
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/client/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lịch hẹn:', error);
      toast.error('Không thể tải danh sách lịch hẹn của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPendingRatings();
  }, []);

  const handleRatingSubmit = async () => {
    if (!ratingApptId) return;
    const toastId = toast.loading('Đang gửi đánh giá...');
    try {
      const appt = appointments.find(a => a.id === ratingApptId) || pendingRatingAppts.find(a => a.id === ratingApptId);
      const isPackage = appt?.loai_goi === 'LIEU_TRINH';
      const isPackageFinished = appt?.phac_do_status === 'hoan_thanh' || appt?.phac_do_status === 'huy_ngang';
      const canRateService = !isPackage || isPackageFinished;

      await api.post(`/client/appointments/${ratingApptId}/rate`, {
        rating_dich_vu: canRateService ? ratingStarsService : undefined,
        comment_dich_vu: canRateService ? ratingCommentService : undefined,
        rating_ktv: ratingStarsStaff,
        comment_ktv: ratingCommentStaff
      });
      toast.success('Cảm ơn bạn đã gửi đánh giá cho dịch vụ và kỹ thuật viên!', { id: toastId });
      setRatingApptId(null);
      setRatingStarsService(5);
      setRatingCommentService('');
      setRatingStarsStaff(5);
      setRatingCommentStaff('');
      fetchAppointments();
      fetchPendingRatings();
    } catch (error: any) {
      console.error('Lỗi khi gửi đánh giá:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá.', { id: toastId });
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingId || !lyDoHuy.trim()) {
      toast.error('Vui lòng cung cấp lý do hủy lịch hẹn!');
      return;
    }

    const toastId = toast.loading('Đang gửi yêu cầu hủy lịch hẹn...');
    try {
      await api.patch(`/client/appointments/${cancellingId}/cancel`, { ghi_chu_noi_bo: lyDoHuy, ly_do_huy: lyDoHuy });
      toast.success('Đã gửi yêu cầu hủy lịch hẹn! Vui lòng chờ Trung tâm xác nhận.', { id: toastId });
      setCancellingId(null);
      setLyDoHuy('');
      fetchAppointments();
    } catch (error: any) {
      console.error('Lỗi khi hủy lịch hẹn:', error);
      toast.error(error.response?.data?.message || 'Không thể hủy lịch hẹn.', { id: toastId });
    }
  };

  const handleVerifyOtp = async (apptId: string) => {
    if (otpInput.length !== 6 || !/^\d+$/.test(otpInput)) {
      toast.error('Vui lòng nhập đúng mã OTP 6 chữ số.');
      return;
    }
    setVerifyingOtpId(apptId);
    try {
      const response = await api.post(`/client/appointments/public/confirm-otp`, {
        id: apptId,
        otp: otpInput
      });
      if (response.data.success) {
        toast.success('Xác thực OTP thành công! Lịch hẹn của bạn đang chờ Trung tâm xác nhận.');
        setOtpInput('');
        fetchAppointments();
      } else {
        toast.error(response.data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err: any) {
      console.error('Lỗi xác thực OTP:', err);
      toast.error(err.response?.data?.message || 'Không thể kết nối máy chủ xác thực.');
    } finally {
      setVerifyingOtpId(null);
    }
  };

  const handleResendOtp = async (apptId: string) => {
    setResendingOtpId(apptId);
    try {
      const response = await api.post(`/client/appointments/public/${apptId}/resend-otp`);
      if (response.data.success) {
        toast.success('Đã gửi lại mã OTP thành công! Vui lòng kiểm tra email của bạn.');
      } else {
        toast.error(response.data.message || 'Không thể gửi lại OTP.');
      }
    } catch (err: any) {
      console.error('Lỗi gửi lại OTP:', err);
      toast.error(err.response?.data?.message || 'Không thể kết nối máy chủ.');
    } finally {
      setResendingOtpId(null);
    }
  };

  // Date helpers
  const getWeekRange = (anchor: Date) => {
    const day = anchor.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };

  const handleDateNavigate = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    setDateAnchor(prev => {
      const newDate = new Date(prev);
      if (dateMode === 'day') {
        newDate.setDate(prev.getDate() + offset);
      } else if (dateMode === 'week') {
        newDate.setDate(prev.getDate() + offset * 7);
      } else if (dateMode === 'month') {
        newDate.setMonth(prev.getMonth() + offset);
      }
      return newDate;
    });
  };

  const handleQuickJump = () => {
    setDateAnchor(new Date());
  };

  const getQuickJumpLabel = () => {
    if (dateMode === 'day') return 'HÔM NAY';
    if (dateMode === 'week') return 'TUẦN NÀY';
    return 'THÁNG NÀY';
  };

  const getDateRangeLabel = () => {
    if (dateMode === 'day') {
      return `Ngày: ${dateAnchor.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    }
    if (dateMode === 'week') {
      const { monday, sunday } = getWeekRange(dateAnchor);
      const startStr = `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth() + 1).toString().padStart(2, '0')}`;
      const endStr = `${sunday.getDate().toString().padStart(2, '0')}/${(sunday.getMonth() + 1).toString().padStart(2, '0')}/${sunday.getFullYear()}`;
      return `Tuần: ${startStr} – ${endStr}`;
    }
    const monthStr = (dateAnchor.getMonth() + 1).toString().padStart(2, '0');
    return `Tháng: ${monthStr}/${dateAnchor.getFullYear()}`;
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  const getCountdownString = (startTimeIso: string) => {
    const start = new Date(startTimeIso).getTime();
    const diff = start - currentTime.getTime();
    if (diff <= 0) {
      return 'Lịch hẹn đang diễn ra hoặc sắp bắt đầu';
    }
    const sec = Math.floor(diff / 1000);
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    
    let parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return `Bắt đầu sau: ${parts.join(' ')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cho_xac_nhan':
      case 'chua_xac_nhan':
        return (
          <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
            Chờ Duyệt
          </span>
        );
      case 'da_xac_nhan':
        return (
          <span className="text-[9px] font-black text-[#0D9488] bg-teal-50 border border-teal-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
            Đã Xác Nhận
          </span>
        );
      case 'da_checkin':
        return (
          <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
            Đã Check-in
          </span>
        );
      case 'dang_kham':
        return (
          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
            Đang Khám / Trị Liệu
          </span>
        );
      case 'cho_huy':
        return (
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
            Chờ Hủy
          </span>
        );
      case 'da_huy':
      case 'da_huy_phat':
        return (
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
            Đã Hủy
          </span>
        );
      case 'khong_den':
      case 'khach_khong_den':
      case 'khach_khong_den_phat':
        return (
          <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
            Vắng Mặt
          </span>
        );
      case 'hoan_thanh':
        return (
          <span className="text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
            Hoàn Thành
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-black text-gray-500 bg-gray-50 border border-gray-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'cho_xac_nhan':
      case 'chua_xac_nhan':
        return 'from-amber-400 to-yellow-300';
      case 'da_xac_nhan':
        return 'from-[#0D9488] to-[#14B8A6]';
      case 'da_checkin':
        return 'from-teal-500 to-cyan-400';
      case 'dang_kham':
        return 'from-emerald-500 to-teal-400';
      case 'cho_huy':
        return 'from-rose-500 to-pink-500';
      case 'da_huy':
      case 'da_huy_phat':
      case 'khong_den':
      case 'khach_khong_den':
      case 'khach_khong_den_phat':
        return 'from-rose-600 to-red-500';
      case 'hoan_thanh':
        return 'from-slate-400 to-slate-500';
      default:
        return 'from-zinc-300 to-zinc-400';
    }
  };

  // Điều hướng sang trang Hồ sơ trị liệu, tự mở đúng gói (và cuộn tới đúng buổi nếu buổi đó thuộc
  // 1 gói liệu trình) — thay cho stub toast cũ.
  const handleViewTreatmentDetail = (app: Appointment) => {
    if (!app.phac_do_dieu_tri_id) {
      navigate('/medical-record');
      return;
    }
    navigate(`/medical-record?phac_do_id=${app.phac_do_dieu_tri_id}&buoi=${app.id}`);
  };

  // Counters & Metrics
  const totalCount = appointments.length;
  const upcomingCount = appointments.filter(app => ['cho_xac_nhan', 'chua_xac_nhan', 'da_xac_nhan'].includes(app.trang_thai)).length;
  const completedCount = appointments.filter(app => app.trang_thai === 'hoan_thanh').length;
  const cancelledCount = appointments.filter(app => ['da_huy', 'da_huy_phat', 'cho_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(app.trang_thai)).length;

  const recoveryRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Calculate total hours of usage based on actual duration of completed sessions
  const totalHours = appointments
    .filter(app => app.trang_thai === 'hoan_thanh')
    .reduce((sum, app) => {
      const start = new Date(app.ngay_gio_bat_dau).getTime();
      const end = new Date(app.ngay_gio_ket_thuc).getTime();
      const durationHours = (end - start) / (1000 * 60 * 60);
      return sum + (isNaN(durationHours) ? 0 : durationHours);
    }, 0);

  const diemUyTin = appointments.length > 0 ? (appointments[0].diem_uy_tin ?? 100) : 100;

  // Filter implementation
  const filteredAppointments = appointments.filter((app) => {
    // 1. Status Filter
    if (statusFilter === 'upcoming') {
      if (!['cho_xac_nhan', 'chua_xac_nhan', 'da_xac_nhan'].includes(app.trang_thai)) return false;
    } else if (statusFilter === 'completed') {
      if (app.trang_thai !== 'hoan_thanh') return false;
    } else if (statusFilter === 'cancelled') {
      if (!['da_huy', 'da_huy_phat', 'cho_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(app.trang_thai)) return false;
    }

    // 2. Date Navigation Filter
    const appDate = new Date(app.ngay_gio_bat_dau);
    
    if (dateMode === 'day') {
      return (
        appDate.getDate() === dateAnchor.getDate() &&
        appDate.getMonth() === dateAnchor.getMonth() &&
        appDate.getFullYear() === dateAnchor.getFullYear()
      );
    }
    
    if (dateMode === 'week') {
      const { monday, sunday } = getWeekRange(dateAnchor);
      return appDate >= monday && appDate <= sunday;
    }
    
    if (dateMode === 'month') {
      return (
        appDate.getMonth() === dateAnchor.getMonth() &&
        appDate.getFullYear() === dateAnchor.getFullYear()
      );
    }

    return true;
  });

  return (
    <div className="space-y-6 font-jakarta text-[#0F172A] min-h-screen bg-slate-50/50 p-2 sm:p-6 rounded-[32px]">
      
      {/* Title & Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-[#0D9488]/10 text-[#0D9488] rounded-2xl flex items-center justify-center shadow-xs">
              <Calendar size={22} />
            </span>
            Hành Trình Trị Liệu & Lịch Hẹn
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Quản lý lộ trình thăm khám lượng giá y khoa và đặt lịch trị liệu chuyên sâu.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/booking')}
          className="flex items-center gap-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-teal-500/10 cursor-pointer"
        >
          <PlusCircle size={15} /> Đăng ký buổi khám mới
        </motion.button>
      </div>

      {/* Main Grid: Left side stats, Right side filters and list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Recovery Journey Analytics (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Reputation Info Box */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="p-1 bg-[#0D9488]/10 rounded-lg text-[#0D9488]">
                <ShieldCheck size={16} />
              </span>
              Chỉ số tuân thủ y khoa
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">Điểm uy tín bệnh nhân</span>
                <span className="text-lg font-black text-slate-900">{diemUyTin} <span className="text-xs text-slate-400 font-bold">/ 100</span></span>
              </div>

              {/* Progress bar scale from red to green */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    diemUyTin >= 80 ? 'bg-emerald-500' : diemUyTin >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${diemUyTin}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                Hệ thống OfficeCare đánh giá điểm uy tín tự động. Việc hủy lịch hẹn trễ (dưới 8 tiếng) hoặc không đến điều trị (no-show) sẽ làm giảm điểm uy tín và hạn chế khả năng đặt lịch trực tuyến của bạn.
              </p>
            </div>
          </div>

          {/* Recovery Progress Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-[28px] p-6 shadow-xl border border-slate-700/40 relative overflow-hidden">
            {/* Background design pattern */}
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <h3 className="text-xs font-black uppercase tracking-widest text-teal-400 flex items-center gap-1.5 mb-5">
              <TrendingUp size={14} /> Hành trình phục hồi
            </h3>

            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Circular Gauge */}
              <div className="relative size-28">
                <svg className="size-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-slate-700/50"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-teal-450"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 * (1 - recoveryRate / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black tracking-tight">{recoveryRate}%</span>
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{completedCount}/{totalCount} Ca</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-black text-slate-100">
                  {recoveryRate >= 70 
                    ? 'Tiến trình trị liệu vượt bậc!' 
                    : recoveryRate >= 30 
                      ? 'Đang tiến triển ổn định' 
                      : 'Mới bắt đầu lộ trình'}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed px-4">
                  Bạn đã hoàn thành {completedCount} ca trong tổng số {totalCount} ca hẹn của lộ trình.
                </p>
              </div>
            </div>

            {/* Micro Stats inside Card */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-slate-700/50 mt-5 pt-4.5 text-center">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Tổng giờ sử dụng</span>
                <span className="text-sm font-black text-white block">{totalHours.toFixed(1)} giờ</span>
              </div>
              <div className="space-y-0.5 border-l border-slate-700/50">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Độ Tuân Thủ</span>
                <span className="text-sm font-black text-teal-450 block">{diemUyTin}%</span>
              </div>
            </div>
          </div>

          {/* Medical Record Tip */}
          <div className="bg-teal-50/50 border border-teal-100/30 rounded-[28px] p-5 space-y-3">
            <h4 className="text-[11px] font-black text-teal-850 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={15} /> Lời khuyên hồi phục y khoa
            </h4>
            <p className="text-[10px] text-slate-650 font-semibold leading-relaxed">
              Bạn có thể theo dõi chi tiết bệnh án, hồ sơ lượng giá cơ sinh học của Bác sĩ lượng giá và ghi nhận chẩn đoán chi tiết ngay tại mục <strong>Hồ sơ điều trị</strong> của bạn.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Appointments & Filters (col-span-8) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Pending Reviews Notification Banner */}
          {pendingRatingAppts.length > 0 && (() => {
            const app = pendingRatingAppts[0];
            return (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-[28px] p-5 shadow-xs flex items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                    <Star className="fill-amber-500 text-amber-500" size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-secondary leading-tight flex items-center gap-1.5">
                      🔔 Góp ý chất lượng y khoa
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
                      Bạn vừa hoàn thành trị liệu <strong>{app.ten_dich_vu}</strong>{app.ten_bac_si ? ` cùng KTV ${app.ten_bac_si}` : ''}. Hãy dành 1 phút đóng góp ý kiến nhé!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRatingApptId(app.id);
                    setRatingStarsService(app.rating_service_stars || 5);
                    setRatingCommentService(app.rating_service_comment || '');
                    setRatingStarsStaff(app.rating_staff_stars || 5);
                    setRatingCommentStaff(app.rating_staff_comment || '');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Đánh giá ngay
                </button>
              </div>
            );
          })()}

          {/* Filters Bar */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-4.5 shadow-sm space-y-4">
            
            {/* Status filters (Horizontal Pills with count badges) */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Tất cả lịch', value: 'all', count: totalCount },
                { label: 'Sắp tới', value: 'upcoming', count: upcomingCount },
                { label: 'Đã hoàn thành', value: 'completed', count: completedCount },
                { label: 'Đã hủy & Vắng mặt', value: 'cancelled', count: cancelledCount }
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setStatusFilter(pill.value)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition-all border flex items-center gap-1.5 ${
                    statusFilter === pill.value
                      ? 'bg-[#0D9488] text-white border-transparent shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-slate-150 hover:bg-slate-100'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    statusFilter === pill.value
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Date Navigator & Capsule Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-slate-50">
              
              {/* Navigator */}
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-150">
                <button
                  onClick={() => handleDateNavigate('prev')}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <button 
                  onClick={handleQuickJump}
                  className="px-2.5 py-1 hover:bg-white rounded-lg text-[9px] font-black uppercase text-slate-600 hover:text-slate-900 tracking-wider transition-all cursor-pointer"
                >
                  {getQuickJumpLabel()}
                </button>

                <span className="text-[10px] font-black text-slate-700 px-1 select-none">
                  {getDateRangeLabel()}
                </span>

                <button
                  onClick={() => handleDateNavigate('next')}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day/Week/Month selector capsules */}
              <div className="bg-slate-100 p-0.5 rounded-full flex gap-0.5 self-end sm:self-auto border border-slate-200/50">
                {[
                  { label: 'NGÀY', value: 'day' },
                  { label: 'TUẦN', value: 'week' },
                  { label: 'THÁNG', value: 'month' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setDateMode(mode.value as any)}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                      dateMode === mode.value
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="bg-white rounded-[28px] border border-slate-100 p-16 text-center space-y-4 shadow-sm flex flex-col items-center justify-center">
              <RefreshCw className="animate-spin text-[#0D9488] size-8" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải lịch hẹn...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-dashed border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="size-12 bg-teal-50 border border-teal-100 text-[#0D9488] rounded-xl flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle size={20} />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="font-heading font-black text-sm text-slate-800">Không tìm thấy ca hẹn nào</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Không có ca hẹn nào được ghi nhận khớp với bộ lọc thời gian này.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAppointments.map((app) => {
                  const { dateStr, timeStr } = formatDateTime(app.ngay_gio_bat_dau);
                  const gradientStatus = getStatusColorClass(app.trang_thai);
                  const docAvatar = resolveImageUrl(app.anh_bac_si);
                  
                  const isUnconfirmed = app.trang_thai === 'chua_xac_nhan';
                  const isPending = app.trang_thai === 'cho_xac_nhan';
                  const isConfirmed = app.trang_thai === 'da_xac_nhan';
                  // Đã check-in / đang khám-trị liệu: đã qua bước Xác nhận từ lâu, chỉ còn thiếu bước
                  // Hoàn thành — dùng chung nhánh hiển thị với isConfirmed cho thanh tiến trình 3 bước
                  // (Đăng ký/Xác nhận/Hoàn thành) để không bị tụt về 0% như khi mới đăng ký.
                  const isCheckedInOrInSession = ['da_checkin', 'dang_kham'].includes(app.trang_thai);
                  const isCompleted = app.trang_thai === 'hoan_thanh';
                  const isCancelled = ['da_huy', 'da_huy_phat', 'cho_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(app.trang_thai);

                  // Khách chỉ được tự hủy khi còn ≥ 8 tiếng trước giờ hẹn (khớp gate ở backend
                  // cancelCustomerAppointment). Dưới mốc đó phải gọi Lễ tân hủy giúp.
                  const hoursUntilStart = (new Date(app.ngay_gio_bat_dau).getTime() - currentTime.getTime()) / (1000 * 60 * 60);
                  const canSelfCancel = hoursUntilStart >= 8;

                  const showWarningNotice = ['da_xac_nhan', 'cho_xac_nhan', 'chua_xac_nhan'].includes(app.trang_thai);
                  
                  const getInitials = (fullName: string | null) => {
                    if (!fullName) return 'BS';
                    const parts = fullName.trim().split(' ');
                    if (parts.length >= 2) {
                      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return fullName.substring(0, 2).toUpperCase();
                  };

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      key={app.id}
                      className="bg-white text-slate-700 border border-slate-100 hover:border-teal-200/50 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 rounded-[28px]"
                    >
                      {/* Left border status bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b ${gradientStatus}`}></div>

                      <div className="p-5 pl-6 space-y-4">
                        {/* Card Header Info */}
                        <div className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2.5">
                          <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded">
                            {app.ma_lich_dat}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                              app.loai_lich === 'kham_moi' 
                                ? 'bg-blue-50 border-blue-100 text-blue-600' 
                                : 'bg-purple-50 border-purple-100 text-purple-600'
                            }`}>
                              {app.loai_lich === 'kham_moi' ? 'Khám' : 'Trị liệu'}
                            </span>
                            {getStatusBadge(app.trang_thai)}
                          </div>
                        </div>

                        {/* Title of service */}
                        <div className="space-y-1.5">
                          <h3 className="font-heading font-black text-slate-900 text-xs uppercase tracking-wide leading-snug">
                            {app.ten_dich_vu || 'Khám Lâm Sàng & Lượng Giá'}
                          </h3>
                          
                          {/* Date details */}
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#0D9488]">
                            <Clock size={12} />
                            <span>{timeStr}</span>
                            <span className="text-slate-300">•</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {/* Countdown for Confirmed */}
                        {isConfirmed && (
                          <div className="bg-amber-500/10 text-amber-800 border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2 text-[10px] font-black animate-pulse">
                            <span className="text-base leading-none">⏳</span>
                            <span className="tracking-wide">{getCountdownString(app.ngay_gio_bat_dau)}</span>
                          </div>
                        )}

                        {/* Doctor and Location layout */}
                        {!isCancelled && (
                          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between pt-1 border-t border-slate-50/80">
                            
                            <div className="flex items-center gap-2">
                              {app.ten_ky_thuat_vien ? (
                                <>
                                  <div className="size-7 rounded-full overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-slate-100 flex items-center justify-center">
                                    {docAvatar ? (
                                      <img src={docAvatar} alt={app.ten_ky_thuat_vien} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] font-black text-slate-600">{getInitials(app.ten_ky_thuat_vien)}</span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">Bác sĩ phụ trách</span>
                                    <span className="text-[11px] font-black text-slate-800 block mt-0.5">{app.ten_ky_thuat_vien}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="size-7 rounded-full border-2 border-dashed border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center">
                                    <User size={12} className="text-slate-400" />
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">Bác sĩ phụ trách</span>
                                    <span className="text-[11px] font-bold text-amber-600 block mt-0.5 italic">Đang phân công</span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                <MapPin size={12} className="text-slate-400" />
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-450 uppercase font-black block leading-none">Phòng ban</span>
                                <span className={`text-[11px] font-black block mt-0.5 ${app.ten_phong ? 'text-slate-800' : 'text-amber-600 italic font-bold'}`}>
                                  {app.ten_phong || 'Đang xếp phòng'}
                                </span>
                              </div>
                            </div>

                          </div>
                        )}

                        {/* Premium Workflow Stepper (Horizontal Pipeline) */}
                        {!isCancelled && (
                          <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/80 mt-1">
                            <div className="flex justify-between items-center relative">
                              {/* Track Line */}
                              <div className="absolute left-4 right-4 top-2 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                              
                              {/* Active Track Line fill */}
                              <div
                                className="absolute left-4 top-2 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                                style={{
                                  width: isCompleted ? '100%' : (isConfirmed || isCheckedInOrInSession) ? '50%' : '0%'
                                }}
                              />

                              {/* Step 1: Đăng ký */}
                              <div className="flex flex-col items-center z-10">
                                <div className="size-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                </div>
                                <span className="text-[9px] font-black text-slate-800 mt-1 uppercase tracking-wide">Đăng ký</span>
                              </div>

                              {/* Step 2: Xác nhận */}
                              <div className="flex flex-col items-center z-10">
                                <div className={`size-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-all ${
                                  isConfirmed || isCheckedInOrInSession || isCompleted
                                    ? 'bg-emerald-500'
                                    : isPending || isUnconfirmed
                                      ? 'bg-amber-500 animate-pulse'
                                      : 'bg-slate-250'
                                }`}>
                                  {(isConfirmed || isCheckedInOrInSession || isCompleted) && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </div>
                                <span className={`text-[9px] font-black mt-1 uppercase tracking-wide ${
                                  isConfirmed || isCheckedInOrInSession || isCompleted || isPending || isUnconfirmed
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}>Xác nhận</span>
                              </div>

                              {/* Step 3: Hoàn thành */}
                              <div className="flex flex-col items-center z-10">
                                <div className={`size-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-all ${
                                  isCompleted ? 'bg-emerald-500' : 'bg-slate-250'
                                }`}>
                                  {isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </div>
                                <span className={`text-[9px] font-black mt-1 uppercase tracking-wide ${
                                  isCompleted ? 'text-slate-800' : 'text-slate-400'
                                }`}>Hoàn thành</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* OTP Inline Form */}
                        {isUnconfirmed && (() => {
                          const otpTimeLeft = app.han_xac_nhan ? Math.max(0, Math.floor((new Date(app.han_xac_nhan).getTime() - currentTime.getTime()) / 1000)) : 0;
                          return (
                            <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl text-[11px] space-y-3 text-left">
                              <span className="text-rose-700 font-black flex items-center gap-1 uppercase text-[9px] tracking-wider">📧 CẦN XÁC THỰC LỊCH BẰNG OTP!</span>
                              
                              {app.han_xac_nhan && (
                                <div className={`p-2 py-1.5 rounded-xl text-[10px] flex items-center justify-between font-semibold ${otpTimeLeft > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200/50' : 'bg-rose-50 border border-rose-250 text-rose-800 animate-pulse'}`}>
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={12} className={otpTimeLeft > 0 ? 'text-amber-500 animate-pulse' : 'text-rose-500'} />
                                    <span>{otpTimeLeft > 0 ? 'Mã OTP hết hạn sau:' : 'Mã OTP đã hết hạn!'}</span>
                                  </div>
                                  <span className="font-mono font-black">
                                    {otpTimeLeft > 0 ? `${Math.floor(otpTimeLeft / 60)}:${(otpTimeLeft % 60).toString().padStart(2, '0')}` : '0:00'}
                                  </span>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                  placeholder="Nhập 6 số OTP"
                                  disabled={verifyingOtpId === app.id || (!!app.han_xac_nhan && otpTimeLeft <= 0)}
                                  className="flex-1 px-3 py-2 bg-white border border-slate-200 focus:border-amber-500 text-center font-mono font-black tracking-widest text-xs rounded-xl outline-none transition-all disabled:bg-slate-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleVerifyOtp(app.id)}
                                  disabled={verifyingOtpId === app.id || otpInput.length !== 6 || (!!app.han_xac_nhan && otpTimeLeft <= 0)}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                                >
                                  Xác thực
                                </button>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-slate-455">Không nhận được mã?</span>
                                <button
                                  type="button"
                                  onClick={() => handleResendOtp(app.id)}
                                  disabled={resendingOtpId === app.id}
                                  className="text-amber-600 hover:text-amber-700 hover:underline cursor-pointer disabled:opacity-50"
                                >
                                  {resendingOtpId === app.id ? 'Đang gửi...' : 'Gửi lại OTP'}
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Canceled reasons */}
                        {isCancelled && (
                          <div className="bg-rose-50/20 border border-rose-100/60 p-3 rounded-xl text-[11px] font-semibold leading-relaxed">
                            <p className="font-black text-rose-600 flex items-center gap-1 uppercase text-[9px] tracking-wider">
                              <XCircle size={12} /> 
                              {app.trang_thai.includes('huy') ? 'Đã Hủy Lịch Hẹn' : 'Vắng Mặt (No-Show)'}
                            </p>
                            <p className="text-slate-400 mt-1 italic font-medium text-[10px]">
                              "Lý do: {app.ghi_chu_noi_bo || app.ly_do_huy || 'Không có lý do chi tiết'}"
                            </p>
                          </div>
                        )}

                        {/* Clinic Advice */}
                        {!isCancelled && app.ghi_chu_noi_bo && (
                          <div className="bg-amber-50/25 border border-amber-100/60 p-3 rounded-xl text-[11px] leading-relaxed">
                            <p className="font-black text-amber-800 uppercase text-[9px] tracking-wider">📌 Dặn dò y khoa:</p>
                            <p className="mt-0.5 text-slate-500 italic font-medium">"{app.ghi_chu_noi_bo}"</p>
                          </div>
                        )}

                        {/* Warning Box */}
                        {showWarningNotice && (
                          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-[10px] text-slate-450 leading-relaxed font-semibold">
                            ⚠️ <strong>Lưu ý:</strong> Vui lòng đổi lịch hẹn trước ít nhất <strong>8 tiếng</strong> qua Hotline: <strong>1900 6868</strong> để tránh bị trừ điểm uy tín.
                          </div>
                        )}

                      </div>

                      {/* Side-by-side Compact Action Footer */}
                      <div className="p-4 px-5 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-2 rounded-b-[28px]">
                        {isCompleted && (
                          app.rating_id ? (
                            <div className="border border-slate-200/80 p-2.5 rounded-xl text-[11px] font-bold text-slate-500 space-y-1 bg-white shadow-inner text-center">
                              <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={12} 
                                    className={i < (app.rating_stars || 5) ? 'fill-amber-400 stroke-none' : 'text-zinc-200 fill-zinc-200 stroke-none'} 
                                  />
                                ))}
                                <span className="text-slate-700 font-extrabold ml-1">{app.rating_stars || 5} / 5</span>
                              </div>
                              {app.rating_comment && <p className="text-[10px] text-slate-400 italic">"{app.rating_comment}"</p>}
                            </div>
                          ) : (
                            <div className="w-full">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleViewTreatmentDetail(app)}
                                className="w-full bg-[#0F172A] hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all text-center cursor-pointer shadow-xs"
                              >
                                Chi tiết buổi
                              </motion.button>
                            </div>
                          )
                        )}

                        {(app.trang_thai === 'cho_xac_nhan' || app.trang_thai === 'da_xac_nhan') && (
                          canSelfCancel ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setCancellingId(app.id)}
                              className="w-full bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-slate-650 font-extrabold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              Yêu cầu hủy lịch
                            </motion.button>
                          ) : (
                            <div className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3 text-center space-y-0.5">
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-wider flex items-center justify-center gap-1">
                                <Clock size={11} /> Đã quá mốc tự hủy (dưới 8 tiếng)
                              </p>
                              <p className="text-[9px] text-slate-400 font-semibold leading-snug">
                                Vui lòng gọi Hotline để Lễ tân hỗ trợ hủy/đổi lịch.
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>

      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      <AnimatePresence>
        {cancellingId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancellingId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white text-slate-800 rounded-[24px] border border-slate-100 max-w-sm w-full p-6 shadow-xl relative z-10 font-jakarta"
            >
              <form onSubmit={handleCancelSubmit} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
                    <XCircle size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Yêu cầu hủy lịch?</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed px-2">
                    Trung tâm xác nhận sẽ liên hệ điện thoại để xác minh yêu cầu. Hủy lịch quá trễ (dưới 8 tiếng) hoặc không báo trước có thể ảnh hưởng đến Điểm uy tín của bạn.
                  </p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="lyDoHuyInput" className="text-[9px] font-black text-slate-455 uppercase block tracking-wider">Lý do hủy lịch *</label>
                  <textarea
                    id="lyDoHuyInput"
                    rows={3}
                    required
                    value={lyDoHuy}
                    onChange={(e) => setLyDoHuy(e.target.value)}
                    placeholder="Hãy ghi lý do hủy ca..."
                    className="w-full bg-slate-50 border border-slate-150 focus:border-[#14B8A6]/60 p-3 rounded-lg text-xs font-bold resize-none outline-none text-slate-800 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] uppercase tracking-wider py-3 rounded-xl shadow-xs cursor-pointer"
                  >
                    Gửi yêu cầu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingId(null);
                      setLyDoHuy('');
                    }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider py-3 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    Quay lại
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RATING MODAL */}
      <AnimatePresence>
        {ratingApptId && (() => {
          const activeAppt = appointments.find(a => a.id === ratingApptId);
          const isPackage = activeAppt?.loai_goi === 'LIEU_TRINH';
          const isPackageFinished = activeAppt?.phac_do_status === 'hoan_thanh' || activeAppt?.phac_do_status === 'huy_ngang';
          const canRateService = !isPackage || isPackageFinished;

          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRatingApptId(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white text-slate-800 rounded-[28px] border border-slate-100 max-w-md w-full p-6 md:p-8 shadow-2xl relative z-10 font-jakarta max-h-[90vh] overflow-y-auto space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mx-auto border border-amber-100 shadow-xs">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Đánh giá trị liệu</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed px-2">
                    Ý kiến khách quan giúp chúng tôi liên tục tối ưu hóa phác đồ điều trị và nâng cao tay nghề nhân sự.
                  </p>
                </div>

                <div className="space-y-6 divide-y divide-slate-100">
                  {/* 1. SERVICE QUALITY RATING */}
                  <div className="space-y-4 pt-4 first:pt-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-secondary uppercase tracking-wider">
                        1. Chất lượng Dịch vụ
                      </h4>
                      {!canRateService && (
                        <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-md uppercase">
                          Khóa
                        </span>
                      )}
                    </div>

                    {!canRateService ? (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-center space-y-2">
                        <div className="flex justify-center gap-1 opacity-40">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={20} className="text-zinc-300 fill-zinc-200" />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-extrabold leading-normal">
                          🔒 Bạn có thể đánh giá gói liệu trình này khi hoàn thành toàn bộ lộ trình trị liệu.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingStarsService(star)}
                              className="p-1 hover:scale-110 active:scale-95 transition-all text-amber-400 cursor-pointer"
                            >
                              <Star
                                size={26}
                                fill={star <= ratingStarsService ? "#FF9F1C" : "none"}
                                stroke={star <= ratingStarsService ? "#FF9F1C" : "currentColor"}
                                className="stroke-[1.5]"
                              />
                            </button>
                          ))}
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label htmlFor="nhanXetService" className="text-[9px] font-black text-slate-455 uppercase block tracking-wider">Nhận xét về gói dịch vụ</label>
                          <textarea
                            id="nhanXetService"
                            rows={2}
                            value={ratingCommentService}
                            onChange={(e) => setRatingCommentService(e.target.value)}
                            placeholder="Mức độ phục hồi, cơ sở vật chất, thiết bị y khoa..."
                            className="w-full bg-slate-50 border border-slate-150 focus:border-[#14B8A6]/60 p-3 rounded-lg text-xs font-bold resize-none outline-none text-slate-800 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. STAFF QUALITY RATING */}
                  <div className="space-y-4 pt-5">
                    <h4 className="text-[11px] font-black text-secondary uppercase tracking-wider text-left">
                      2. Kỹ thuật viên / Bác sĩ ({activeAppt?.ten_ky_thuat_vien || 'Phụ trách'})
                    </h4>

                    <div className="flex justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingStarsStaff(star)}
                          className="p-1 hover:scale-110 active:scale-95 transition-all text-amber-400 cursor-pointer"
                        >
                          <Star
                            size={26}
                            fill={star <= ratingStarsStaff ? "#FF9F1C" : "none"}
                            stroke={star <= ratingStarsStaff ? "#FF9F1C" : "currentColor"}
                            className="stroke-[1.5]"
                          />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label htmlFor="nhanXetStaff" className="text-[9px] font-black text-slate-455 uppercase block tracking-wider">Nhận xét về KTV / Bác sĩ</label>
                      <textarea
                        id="nhanXetStaff"
                        rows={2}
                        value={ratingCommentStaff}
                        onChange={(e) => setRatingCommentStaff(e.target.value)}
                        placeholder="Tay nghề, thái độ phục vụ chu đáo tận tâm..."
                        className="w-full bg-slate-50 border border-slate-150 focus:border-[#14B8A6]/60 p-3 rounded-lg text-xs font-bold resize-none outline-none text-slate-800 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleRatingSubmit}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider py-3 rounded-xl shadow-xs cursor-pointer flex items-center justify-center"
                  >
                    Gửi đánh giá
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRatingApptId(null);
                      setRatingStarsService(5);
                      setRatingCommentService('');
                      setRatingStarsStaff(5);
                      setRatingCommentStaff('');
                    }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider py-3 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

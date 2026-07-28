import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  AlertCircle,
  X,
  XCircle,
  RefreshCw,
  PlusCircle,
  Star,
  Clock,
  User,
  MapPin,
  TrendingUp,
  ShieldCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '../../../../utils/imageUrl';
import { useAuthStore } from '../../../../stores/authStore';
import { CustomDatePicker } from '../../../../components/CustomDatePicker';
import { StatusHistoryModal } from '../../../../components/StatusHistoryModal';

interface Appointment {
  id: string;
  phac_do_dieu_tri_id?: string | null;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: string;
  trang_thai_kham?: string | null;
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
  so_thu_tu_buoi?: number | null;
  tong_so_buoi_goi?: number | null;
}

export default function CustomerAppointments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lyDoHuy, setLyDoHuy] = useState<string>('');
  const [ratingApptId, setRatingApptId] = useState<string | null>(null);
  const [selectedTimelineAppt, setSelectedTimelineAppt] = useState<any | null>(null);

  // Separate rating states
  const [ratingStarsService, setRatingStarsService] = useState<number>(5);
  const [ratingCommentService, setRatingCommentService] = useState<string>('');
  const [ratingStarsStaff, setRatingStarsStaff] = useState<number>(5);
  const [ratingCommentStaff, setRatingCommentStaff] = useState<string>('');

  // Pending ratings list for top notification banner
  const [pendingRatingAppts, setPendingRatingAppts] = useState<any[]>([]);
  const [hideReviewBanner, setHideReviewBanner] = useState<boolean>(() => sessionStorage.getItem('hide_review_banner') === 'true');

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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Nếu được điều hướng tới kèm ?date=YYYY-MM-DD (vd sau khi đặt buổi tiếp theo của gói liệu
  // trình), tự chuyển sang xem đúng ngày đó thay vì mặc định.
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam) return;
    setStartDate(dateParam);
    setEndDate(dateParam);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const isPackageFinished = appt?.phac_do_status === 'hoan_thanh' || appt?.phac_do_status === 'huy';
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

  // Điều hướng sang trang Hồ sơ trị liệu, tự chuyển sang tab tương ứng và cuộn/bật nội dung buổi
  const handleViewTreatmentDetail = (app: Appointment) => {
    if (app.phac_do_dieu_tri_id) {
      navigate(`/medical-record?tab=goi&phac_do_id=${app.phac_do_dieu_tri_id}&buoi=${app.id}`);
    } else if (app.loai_goi === 'KHAM' || app.trang_thai_kham === 'kham_moi' || (app.ten_dich_vu && app.ten_dich_vu.toLowerCase().includes('khám'))) {
      navigate(`/medical-record?tab=kham&cuoc_hen_id=${app.id}`);
    } else {
      navigate(`/medical-record?tab=le&cuoc_hen_id=${app.id}`);
    }
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

  // Ưu tiên điểm mới nhất kèm theo danh sách lịch hẹn (làm mới sau mỗi lần hủy/no-show); khi danh
  // sách rỗng (khách mới, hoặc lịch trong khoảng lọc hiện tại không có), KHÔNG được mặc định cứng về
  // 100 — trước đây làm vậy khiến điểm uy tín thật sự đã tụt (vd 0) vẫn hiển thị sai thành 100/100.
  // Dùng lại điểm đã có sẵn trong hồ sơ đăng nhập (authStore) làm phương án dự phòng.
  const diemUyTin = appointments[0]?.diem_uy_tin ?? user?.diem_uy_tin ?? 100;

  // Filter & Priority Sorting implementation
  const filteredAppointments = useMemo(() => {
    const isUpcomingStatus = (status: string) => {
      return ['cho_xac_nhan', 'chua_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham', 'cho_huy'].includes(status);
    };

    const sorted = [...appointments].sort((a, b) => {
      const aUpcoming = isUpcomingStatus(a.trang_thai);
      const bUpcoming = isUpcomingStatus(b.trang_thai);

      // Ưu tiên đưa lịch sắp tới / mới tạo (Chờ duyệt, Đã xác nhận, Đang khám...) lên ĐẦU danh sách
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      // Nếu cả 2 đều là lịch sắp tới, ưu tiên ngày gần nhất (gần hiện tại nhất lên trước)
      if (aUpcoming && bUpcoming) {
        return new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime();
      }

      // Nếu cả 2 đều là lịch cũ/hoàn thành/hủy, sắp xếp lịch gần đây nhất lên trước
      return new Date(b.ngay_gio_bat_dau).getTime() - new Date(a.ngay_gio_bat_dau).getTime();
    });

    return sorted.filter((app) => {
      // 1. Status Filter
      if (statusFilter === 'upcoming') {
        if (!isUpcomingStatus(app.trang_thai)) return false;
      } else if (statusFilter === 'completed') {
        if (app.trang_thai !== 'hoan_thanh') return false;
      } else if (statusFilter === 'cancelled') {
        if (!['da_huy', 'da_huy_phat', 'cho_huy', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(app.trang_thai)) return false;
      }

      // 2. Date Range Filter
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00').getTime();
        const appTime = new Date(app.ngay_gio_bat_dau).getTime();
        if (appTime < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59').getTime();
        const appTime = new Date(app.ngay_gio_bat_dau).getTime();
        if (appTime > end) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, startDate, endDate]);

  return (
    <div className="space-y-6 font-jakarta text-[#0F172A] min-h-screen bg-slate-50/50 p-2 sm:p-6 rounded-[32px]">



      {/* Top Hero Analytics Banner (Pro Max Medical Ambient Strip) */}
      <div className="relative overflow-hidden rounded-[32px] p-6 md:p-8 text-white shadow-xl bg-gradient-to-r from-[#0D4B46] via-[#0F766E] to-[#115E59] border border-teal-600/30">
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 bg-emerald-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-[10px] font-black uppercase tracking-widest border border-white/15">
              🛡️ Quản Lý Lịch Hẹn & Phác Đồ
            </span>
            <h1 className="font-heading text-2xl md:text-3xl font-black text-white tracking-tight">
              Hành Trình Phục Hồi Y Khoa
            </h1>
            <p className="text-xs text-teal-100/80 font-medium max-w-xl">
              Theo dõi chi tiết các ca hẹn, độ tuân thủ và tiến trình điều trị cơ xương khớp cá nhân hóa.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/booking')}
            className="flex items-center gap-2 bg-white text-[#0D9488] hover:bg-teal-50 font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-lg cursor-pointer shrink-0"
          >
            <PlusCircle size={16} /> Đăng ký buổi khám mới
          </motion.button>
        </div>

        {/* 4 Metric Glass Tiles Horizontal Grid */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-7">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5 transition-all hover:bg-white/15">
            <div className="size-10 rounded-xl bg-teal-400/20 border border-teal-300/30 text-teal-200 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <div className="font-heading text-xl font-black tabular-nums text-white">{totalCount} Ca</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100/70">Tổng số ca hẹn</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5 transition-all hover:bg-white/15">
            <div className="size-10 rounded-xl bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="font-heading text-xl font-black tabular-nums text-white">{recoveryRate}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100/70">Hoàn thành ({completedCount}/{totalCount})</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5 transition-all hover:bg-white/15">
            <div className="size-10 rounded-xl bg-sky-400/20 border border-sky-300/30 text-sky-200 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="font-heading text-xl font-black tabular-nums text-white">{totalHours.toFixed(1)} giờ</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100/70">Thời lượng trị liệu</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5 transition-all hover:bg-white/15">
            <div className="size-10 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="font-heading text-xl font-black tabular-nums text-white">{diemUyTin}/100</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100/70">Điểm tuân thủ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Full 12 Columns) */}
      <div className="space-y-6">

        {/* Pending Reviews Notification Banner */}
        {!hideReviewBanner && pendingRatingAppts.length > 0 && (() => {
          const app = pendingRatingAppts[0];
          return (
            <div className="relative bg-gradient-to-r from-amber-50/90 via-orange-50/90 to-yellow-50/90 border border-amber-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 animate-in slide-in-from-top-3 duration-300">
              <div className="flex items-start gap-3 min-w-0 flex-1 pr-6 sm:pr-0">
                <div className="size-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                  <Star className="fill-amber-500 text-amber-500" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs text-slate-800 leading-tight flex items-center gap-1.5">
                    🔔 Góp ý chất lượng y khoa
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                    Bạn vừa hoàn thành trị liệu <strong>{app.ten_dich_vu}</strong>{app.ten_bac_si ? ` cùng KTV ${app.ten_bac_si}` : ''}. Hãy dành 1 phút đóng góp ý kiến nhé!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setRatingApptId(app.id);
                    setRatingStarsService(app.rating_service_stars || 5);
                    setRatingCommentService(app.rating_service_comment || '');
                    setRatingStarsStaff(app.rating_staff_stars || 5);
                    setRatingCommentStaff(app.rating_staff_comment || '');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Đánh giá ngay
                </button>

                {/* Nút ẩn/tắt thông báo Đánh giá */}
                <button
                  type="button"
                  title="Tắt thông báo này"
                  onClick={() => {
                    setHideReviewBanner(true);
                    sessionStorage.setItem('hide_review_banner', 'true');
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-amber-100/60 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Integrated Filter Toolbar */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Status pills segmented bar */}
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
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border flex items-center gap-2 cursor-pointer ${
                    statusFilter === pill.value
                      ? 'bg-[#0D9488] text-white border-transparent shadow-sm scale-[1.02]'
                      : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${
                    statusFilter === pill.value ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                  }`}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Date filter range inputs */}
            <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Từ ngày:</span>
                <CustomDatePicker
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholder="Chọn ngày"
                  align="left"
                  className="w-36"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Đến:</span>
                <CustomDatePicker
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholder="Chọn ngày"
                  align="left"
                  className="w-36"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Xóa bộ lọc ngày"
                >
                  <XCircle size={16} />
                </button>
              )}
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

                  // Buổi thuộc gói liệu trình: nêu rõ đang là buổi thứ mấy/tổng số buổi, tránh chỉ
                  // hiện tên gói trơ trọi khiến khách không biết đây là buổi nào trong liệu trình.
                  const isPackageSession = app.loai_goi === 'LIEU_TRINH' && !!app.so_thu_tu_buoi;

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
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${app.loai_lich === 'kham_moi'
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
                            {isPackageSession && (
                              <span className="ml-2 inline-flex items-center normal-case text-[10px] font-black text-[#0d766e] bg-[#0d9488]/10 px-2 py-0.5 rounded border border-[#0d9488]/15 align-middle">
                                Buổi {app.so_thu_tu_buoi} / {app.tong_so_buoi_goi ?? '?'}
                              </span>
                            )}
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
                                <div className={`size-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-all ${isConfirmed || isCheckedInOrInSession || isCompleted
                                    ? 'bg-emerald-500'
                                    : isPending || isUnconfirmed
                                      ? 'bg-amber-500 animate-pulse'
                                      : 'bg-slate-250'
                                  }`}>
                                  {(isConfirmed || isCheckedInOrInSession || isCompleted) && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </div>
                                <span className={`text-[9px] font-black mt-1 uppercase tracking-wide ${isConfirmed || isCheckedInOrInSession || isCompleted || isPending || isUnconfirmed
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                  }`}>Xác nhận</span>
                              </div>

                              {/* Step 3: Hoàn thành */}
                              <div className="flex flex-col items-center z-10">
                                <div className={`size-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-slate-250'
                                  }`}>
                                  {isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                </div>
                                <span className={`text-[9px] font-black mt-1 uppercase tracking-wide ${isCompleted ? 'text-slate-800' : 'text-slate-400'
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
                              "Lý do: {app.ly_do_huy || app.ghi_chu_noi_bo || 'Không có lý do chi tiết'}"
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
                            ⚠️ <strong>Lưu ý:</strong> Quý khách có nhu cầu thay đổi giờ lịch hẹn vui lòng liên hệ Hotline: <strong>1900 6868</strong> hoặc{' '}
                            <a
                              href="https://www.facebook.com/profile.php?id=61591064963268"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0D9488] font-black underline underline-offset-2 hover:text-[#0b7d72]"
                            >
                              Chat với phòng khám
                            </a>{' '}
                            để được hỗ trợ.
                          </div>
                        )}

                      </div>

                      {/* Dual Action Footer: Status History & Session Details */}
                      <div className="p-4 px-5 bg-slate-50/60 border-t border-slate-100 flex flex-wrap sm:flex-nowrap gap-2 rounded-b-[28px]">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTimelineAppt(app)}
                          className="flex-1 bg-white hover:bg-teal-50 text-teal-700 hover:text-teal-800 border border-teal-200/80 hover:border-teal-300 font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Clock size={13} className="text-teal-600" />
                          Lịch sử trạng thái
                        </motion.button>

                        {isCompleted && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleViewTreatmentDetail(app)}
                            className="flex-1 bg-[#0F172A] hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <FileText size={13} />
                            Chi tiết buổi
                          </motion.button>
                        )}

                        {(app.trang_thai === 'cho_xac_nhan' || app.trang_thai === 'da_xac_nhan') && canSelfCancel && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCancellingId(app.id)}
                            className="w-full sm:w-auto bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-slate-650 font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow-2xs"
                          >
                            Yêu cầu hủy lịch
                          </motion.button>
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
        {cancellingId && (() => {
          const cancellingAppt = appointments.find(a => a.id === cancellingId);
          const getRemainingTimeText = (startDateStr?: string) => {
            if (!startDateStr) return '';
            const startMs = new Date(startDateStr).getTime();
            const nowMs = Date.now();
            const diffMs = startMs - nowMs;
            if (diffMs <= 0) return '0 phút';

            const totalMinutes = Math.floor(diffMs / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            if (hours > 0) {
              return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`;
            }
            return `${minutes} phút`;
          };

          const remainingTime = getRemainingTimeText(cancellingAppt?.ngay_gio_bat_dau);

          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setCancellingId(null);
                  setLyDoHuy('');
                }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white text-slate-800 rounded-[28px] border border-slate-100 max-w-md w-full p-6 shadow-2xl relative z-10 font-jakarta space-y-4"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/60 shadow-xs">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    Xác nhận Hủy Lịch Hẹn
                  </h3>

                  {remainingTime && (
                    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-amber-200/80">
                      <span>⏱️ Lịch hẹn còn</span>
                      <span className="text-rose-600 font-black">{remainingTime}</span>
                      <span>nữa mới bắt đầu</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl text-xs text-slate-600 leading-relaxed font-medium space-y-1">
                  <p>
                    Nếu có nhu cầu thay đổi lịch hẹn, vui lòng liên hệ Hotline{' '}
                    <a href="tel:19006868" className="font-extrabold text-slate-900 hover:text-[#0D9488]">1900 6868</a>{' '}
                    hoặc{' '}
                    <a
                      href="https://www.facebook.com/profile.php?id=61591064963268"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-extrabold text-[#0D9488] underline hover:text-[#0b7d72]"
                    >
                      Chat với phòng khám
                    </a>{' '}
                    để được hỗ trợ đổi giờ tốt nhất.
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-2xl text-xs font-bold text-rose-800 space-y-1">
                  <p className="flex items-center gap-1.5 text-rose-700 font-black">
                    ⚠️ Hủy lịch sẽ ảnh hưởng đến Điểm uy tín của khách hàng!
                  </p>
                  <p className="text-[11px] font-medium text-rose-600 leading-snug">
                    Xác nhận hủy lịch sẽ làm giảm 10 điểm uy tín tích lũy của bạn trong hệ thống.
                  </p>
                </div>

                <form onSubmit={handleCancelSubmit} className="space-y-3.5">
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="lyDoHuyInput" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Lý do hủy lịch *
                    </label>
                    <textarea
                      id="lyDoHuyInput"
                      rows={2}
                      required
                      value={lyDoHuy}
                      onChange={(e) => setLyDoHuy(e.target.value)}
                      placeholder="Nhập lý do hủy lịch hẹn..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#0D9488] p-3 rounded-xl text-xs font-semibold resize-none outline-none text-slate-800 transition-colors"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold italic text-center leading-snug">
                    *(Điểm uy tín dưới 50% sẽ có nguy cơ bị khóa tài khoản)*
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCancellingId(null);
                        setLyDoHuy('');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl border border-slate-200 transition-all cursor-pointer"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer transition-all"
                    >
                      Vẫn muốn hủy lịch
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* RATING MODAL */}
      <AnimatePresence>
        {ratingApptId && (() => {
          const activeAppt = appointments.find(a => a.id === ratingApptId);
          const isPackage = activeAppt?.loai_goi === 'LIEU_TRINH';
          const isPackageFinished = activeAppt?.phac_do_status === 'hoan_thanh' || activeAppt?.phac_do_status === 'huy';
          const canRateService = !isPackage || isPackageFinished;
          const hasExistingServiceReview = !!activeAppt?.rating_service_id;
          const hasExistingStaffReview = !!activeAppt?.rating_staff_id;
          const isEditingAny = hasExistingServiceReview || hasExistingStaffReview;

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
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    {isEditingAny ? 'Sửa đánh giá' : 'Đánh giá trị liệu'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed px-2">
                    {isEditingAny
                      ? 'Bạn đã đánh giá mục này trước đó — nội dung bên dưới là đánh giá cũ, chỉnh sửa rồi gửi lại để cập nhật.'
                      : 'Ý kiến khách quan giúp chúng tôi liên tục tối ưu hóa phác đồ điều trị và nâng cao tay nghề nhân sự.'}
                  </p>
                </div>

                <div className="space-y-6 divide-y divide-slate-100">
                  {/* 1. SERVICE QUALITY RATING */}
                  <div className="space-y-4 pt-4 first:pt-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-secondary uppercase tracking-wider">
                        1. Chất lượng Dịch vụ
                      </h4>
                      {hasExistingServiceReview && (
                        <span className="text-[8px] bg-teal-50 text-teal-600 font-black px-2 py-0.5 rounded-md uppercase border border-teal-100">
                          Đã đánh giá — đang sửa
                        </span>
                      )}
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
                            placeholder="Bạn có hài lòng về quy trình của gói, hiệu quả trị liệu, cơ sở vật chất và trang thiết bị không? Hãy chia sẻ trải nghiệm của bạn..."
                            className="w-full bg-slate-50 border border-slate-150 focus:border-[#14B8A6]/60 p-3 rounded-lg text-xs font-bold resize-none outline-none text-slate-800 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. STAFF QUALITY RATING */}
                  <div className="space-y-4 pt-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-secondary uppercase tracking-wider text-left">
                        2. Kỹ thuật viên / Bác sĩ ({activeAppt?.ten_ky_thuat_vien || 'Phụ trách'})
                      </h4>
                      {hasExistingStaffReview && (
                        <span className="text-[8px] bg-teal-50 text-teal-600 font-black px-2 py-0.5 rounded-md uppercase border border-teal-100 shrink-0">
                          Đã đánh giá — đang sửa
                        </span>
                      )}
                    </div>

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
                        placeholder="Bạn có hài lòng về nhân sự khi làm không? Thái độ phục vụ, tay nghề chuyên môn của bác sĩ / KTV như thế nào..."
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
                    {isEditingAny ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
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

      {/* STATUS HISTORY TIMELINE MODAL */}
      <StatusHistoryModal
        isOpen={!!selectedTimelineAppt}
        onClose={() => setSelectedTimelineAppt(null)}
        appointment={selectedTimelineAppt}
      />

    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Phone,
  Calendar as CalendarIcon,
  FileText,
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  User,
  HeartPulse,
  ClipboardList,
  ShieldAlert,
  FlameKindling,
  Timer,
  History as HistoryIcon
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/authStore';
import {
  getAppointmentDetail,
  getPatientProfile,
  getPackages,
  saveAssessment,
  getActiveSession,
  PatientProfile,
  PackageItem
} from '../../api/doctor.api';
type ActiveModal = { type: 'plan'; id: string } | { type: 'visit'; id: string } | null;
import {
  getAppointmentDetail as getAppointmentDetailKtv,
  saveTreatmentRecord as saveTreatmentRecordKtv,
  getPatientProfile as getPatientProfileKtv,
  getActiveSession as getActiveSessionKtv
} from '../../../technician/api/technician.api';
import { StaffAvatar } from '../DoctorMedicalRecords/components/StaffAvatar';
import { PlanColumn } from '../DoctorMedicalRecords/components/PlanColumn';
import { VisitColumn } from '../DoctorMedicalRecords/components/VisitColumn';
import { PlanDetailModal } from '../DoctorMedicalRecords/components/PlanDetailModal';
import { VisitDetailModal } from '../DoctorMedicalRecords/components/VisitDetailModal';

const formatCountdown = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const totalSeconds = Math.floor(abs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const getVasDescription = (score: number | null) => {
  if (score === null || score === undefined) return 'Vui lòng chọn mức độ đau';
  if (score === 0) return '🟢 0 - Không đau: Cơ thể hoàn toàn bình thường, thoải mái.';
  if (score <= 3) return `🟢 ${score} - Đau nhẹ: Ê ẩm, mỏi nhẹ (Vẫn làm việc, sinh hoạt bình thường).`;
  if (score <= 6) return `🟡 ${score} - Đau vừa: Nhức rõ rệt, cản trở nhẹ khớp (Gây bất tiện khi cử động).`;
  if (score <= 9) return `🔴 ${score} - Đau nặng: Đau buốt dữ dội (Hạn chế vận động, ảnh hưởng sinh hoạt).`;
  return '🔴 10 - Đau cực độ: Đau kinh khủng không thể chịu đựng nổi, cần can thiệp y tế khẩn cấp.';
};

/** Màu badge nổi theo mức VAS hiện tại — cùng bảng màu ngữ nghĩa dùng xuyên suốt trang. */
const getVasBadgeBg = (score: number) => {
  if (score === 0) return 'bg-emerald-500';
  if (score <= 3) return 'bg-teal-500';
  if (score <= 6) return 'bg-amber-500';
  if (score <= 9) return 'bg-rose-500';
  return 'bg-red-600';
};

/** Thanh trượt chọn điểm đau VAS (0-10) — kéo tới đâu hiện mức đau tới đó, track gradient xanh→đỏ. */
function VasSlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const percent = (value / 10) * 100;
  return (
    <div className="relative pt-8 pb-1 px-1">
      <style>{`
        .vas-slider-input { -webkit-appearance: none; appearance: none; width: 100%; height: 22px; background: transparent; cursor: pointer; }
        .vas-slider-input::-webkit-slider-runnable-track { height: 10px; border-radius: 9999px; background: linear-gradient(to right, #10b981 0%, #14b8a6 15%, #f59e0b 50%, #f43f5e 80%, #dc2626 100%); }
        .vas-slider-input::-moz-range-track { height: 10px; border-radius: 9999px; background: linear-gradient(to right, #10b981 0%, #14b8a6 15%, #f59e0b 50%, #f43f5e 80%, #dc2626 100%); }
        .vas-slider-input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; margin-top: -6px; border-radius: 9999px; background: #fff; border: 3px solid #0F172A; box-shadow: 0 2px 6px rgba(0,0,0,0.25); cursor: grab; }
        .vas-slider-input::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
        .vas-slider-input::-moz-range-thumb { width: 22px; height: 22px; border-radius: 9999px; background: #fff; border: 3px solid #0F172A; box-shadow: 0 2px 6px rgba(0,0,0,0.25); cursor: grab; }
      `}</style>
      <div
        className="absolute top-0 -translate-x-1/2 transition-all duration-100 pointer-events-none"
        style={{ left: `calc(${percent}% + ${11 - percent * 0.22}px)` }}
      >
        <div className={`px-2 py-1 rounded-lg text-[11px] font-black text-white shadow-md ${getVasBadgeBg(value)}`}>
          {value}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="vas-slider-input"
      />
      <div className="flex justify-between text-[8px] font-bold text-zinc-350 dark:text-zinc-600 mt-1 px-0.5">
        <span>0 · Không đau</span>
        <span>10 · Cực độ</span>
      </div>
    </div>
  );
}

export default function ClinicalAssessment() {
  const { id: routeId } = useParams<{ id: string }>();
  const storedId = localStorage.getItem('active_appointment_id');
  const appointmentId = routeId || storedId || undefined;
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const isKtv = Number(user?.vai_tro_id) === 3;

  // Ca khám hiện tại
  const [appointment, setAppointment] = useState<any>(null);
  // Hồ sơ bệnh lịch sử
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  
  // Danh mục đề xuất
  const [packages, setPackages] = useState<PackageItem[]>([]);

  // Form State
  const [chanDoan, setChanDoan] = useState('');
  const [chongChiDinh, setChongChiDinh] = useState('');
  const [goiDichVuId, setGoiDichVuId] = useState<string>('');
  const [ghiChu, setGhiChu] = useState('');

  // VAS states for KTV
  const [vasTruoc, setVasTruoc] = useState<number>(5);
  const [vasSau, setVasSau] = useState<number>(0);

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assess' | 'history'>('assess');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{ type: 'plan' | 'visit'; id: string } | null>(null);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPendingConflictModal, setShowPendingConflictModal] = useState(false);

  // Đồng hồ đếm ngược tới giờ kết thúc buổi — chạy độc lập, tick mỗi giây
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tải dữ liệu ban đầu
  const loadInitialData = useCallback(async () => {
    if (!appointmentId) return;
    localStorage.setItem('active_appointment_id', appointmentId);
    localStorage.setItem('active_appointment_role', isKtv ? 'ktv' : 'doctor');
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Tải chi tiết ca khám
      const apptRes = isKtv
        ? await getAppointmentDetailKtv(appointmentId)
        : await getAppointmentDetail(appointmentId);
      const apptData = apptRes.data;
      setAppointment(apptData);

      // Điền sẵn chẩn đoán nếu đã có lưu nháp trước đó
      if (apptData.chan_doan) setChanDoan(apptData.chan_doan);
      if (apptData.chong_chi_dinh) setChongChiDinh(apptData.chong_chi_dinh);
      if (apptData.goi_dich_vu_id) setGoiDichVuId(apptData.goi_dich_vu_id);
      if (apptData.ghi_chu) setGhiChu(apptData.ghi_chu);
      if (apptData.vas_truoc !== undefined && apptData.vas_truoc !== null) setVasTruoc(apptData.vas_truoc);
      if (apptData.vas_sau !== undefined && apptData.vas_sau !== null) setVasSau(apptData.vas_sau);

      // 2. Tải danh mục gói liệu trình để làm đề xuất (chỉ bác sĩ)
      if (!isKtv) {
        const packagesRes = await getPackages();
        setPackages(packagesRes.data);
      }

      // 3. Tải hồ sơ điều trị cũ của bệnh nhân (nếu đã liên kết khách hàng)
      if (apptData.khach_hang_id) {
        const profileRes = isKtv
          ? await getPatientProfileKtv(apptData.khach_hang_id)
          : await getPatientProfile(apptData.khach_hang_id);
        setProfile(profileRes.data);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải dữ liệu khám bệnh:', error);
      setErrorMsg(error.response?.data?.message || 'Không thể tải dữ liệu ca khám. Vui lòng thử lại.');
      if (error.response?.data?.activeSessionId) {
        setActiveSessionId(error.response.data.activeSessionId);
      }
    } finally {
      setLoading(false);
    }
  }, [appointmentId, isKtv]);

  // Tự động kiểm tra ca khám / trị liệu đang hoạt động trên máy chủ nếu truy cập đường dẫn Desk chung
  useEffect(() => {
    if (!routeId) {
      const checkActiveSession = async () => {
        try {
          const res = isKtv ? await getActiveSessionKtv() : await getActiveSession();
          if (res.data) {
            // Nếu có ca đang dang dở, cập nhật localStorage và chuyển hướng đến đó
            localStorage.setItem('active_appointment_id', res.data.id);
            navigate(isKtv 
              ? `/technician/appointments/${res.data.id}/assess` 
              : `/doctor/appointments/${res.data.id}/assess`, 
              { replace: true }
            );
          } else {
            // Nếu không có ca nào đang mở dở, xóa storedId cũ để hiển thị giao diện trống
            localStorage.removeItem('active_appointment_id');
            setLoading(false);
          }
        } catch (err) {
          console.error('Lỗi khi kiểm tra ca đang hoạt động:', err);
          setLoading(false);
        }
      };
      checkActiveSession();
    }
  }, [routeId, isKtv, navigate]);

  // Chỉ gọi tải dữ liệu khi có ID cụ thể trên đường dẫn URL
  useEffect(() => {
    if (routeId) {
      loadInitialData();
    }
  }, [routeId, loadInitialData]);

  const filteredPackages = useMemo(() => {
    if (!packageSearchQuery.trim()) return packages;
    const query = packageSearchQuery.toLowerCase();
    return packages.filter((pkg) => 
      pkg.ten_goi.toLowerCase().includes(query) || 
      (pkg.mo_ta && pkg.mo_ta.toLowerCase().includes(query))
    );
  }, [packages, packageSearchQuery]);

  const activePlan = useMemo(() => {
    if (selectedHistoryItem?.type !== 'plan' || !profile) return null;
    return profile.treatmentPlans.find((p) => p.id === selectedHistoryItem.id) || null;
  }, [selectedHistoryItem, profile]);

  const activeVisit = useMemo(() => {
    if (selectedHistoryItem?.type !== 'visit' || !profile) return null;
    return profile.visits.find((v) => v.id === selectedHistoryItem.id) || null;
  }, [selectedHistoryItem, profile]);

  // Tự động chọn bản ghi đầu tiên khi chuyển sang tab Lịch sử và chưa chọn gì
  useEffect(() => {
    if (activeTab === 'history' && !selectedHistoryItem && profile) {
      if (profile.treatmentPlans?.[0]) {
        setSelectedHistoryItem({ type: 'plan', id: profile.treatmentPlans[0].id });
      } else if (profile.visits?.[0]) {
        setSelectedHistoryItem({ type: 'visit', id: profile.visits[0].id });
      }
    }
  }, [activeTab, selectedHistoryItem, profile]);

  const linkedPlanForActiveVisit = useMemo(() => {
    if (!activeVisit?.prescribed_plan_id || !profile) return null;
    return profile.treatmentPlans.find((p) => p.id === activeVisit.prescribed_plan_id) || null;
  }, [activeVisit, profile]);

  // Buổi gần nhất LIÊN QUAN tới ca hôm nay — CHỈ áp dụng cho gói liệu trình (khách đang làm buổi N
  // của 1 gói nhiều buổi). Lấy đúng buổi liền trước (N-1) TRONG CÙNG gói đó — không lấy buổi gần
  // nhất của dịch vụ lẻ hay của gói khác, và chỉ hiện khi buổi liền trước đó đã thực sự hoàn thành
  // (buổi liền trước "không đến"/"đã hủy" thì không có gì để lưu ý — ẩn hẳn banner).
  const latestRelevantSession = useMemo(() => {
    if (!appointment?.phac_do_dieu_tri_id || !appointment?.id || !profile?.treatmentPlans?.length) return null;
    const plan = profile.treatmentPlans.find((p) => p.id === appointment.phac_do_dieu_tri_id);
    if (!plan || plan.loai_dieu_tri !== 'goi') return null;
    const sortedSessions = [...plan.sessions].sort(
      (a, b) => Number(a.so_thu_tu_buoi) - Number(b.so_thu_tu_buoi)
    );
    const todayIdx = sortedSessions.findIndex((s) => s.id === appointment.id);
    if (todayIdx <= 0) return null;
    const prevSession = sortedSessions[todayIdx - 1];
    if (!prevSession || prevSession.trang_thai !== 'hoan_thanh') return null;
    return { session: prevSession, plan };
  }, [profile, appointment]);

  // Đếm ngược tới giờ kết thúc buổi — chỉ có ý nghĩa khi ca đã thật sự "mở bàn" (dang_kham)
  const remainingMs = useMemo(() => {
    if (!appointment?.ngay_gio_ket_thuc) return null;
    return new Date(appointment.ngay_gio_ket_thuc).getTime() - now.getTime();
  }, [appointment, now]);
  const isSessionOpen = appointment?.trang_thai === 'dang_kham';
  const isOverdue = isSessionOpen && remainingMs !== null && remainingMs <= 0;

  // Thực tế lưu dữ liệu từ Modal xác nhận. `options` chỉ dùng khi được gọi lại từ modal xử lý xung
  // đột chỉ định liệu trình (resolvePendingConflict: xóa chỉ định cũ rồi lưu; skipPackage: giữ
  // nguyên chỉ định cũ, không chỉ định gói cho ca khám này).
  const handleConfirmSubmit = async (options?: { resolvePendingConflict?: boolean; skipPackage?: boolean }) => {
    if (!appointmentId) return;
    setShowConfirmModal(false);
    setShowPendingConflictModal(false);
    setSubmitLoading(true);
    try {
      if (isKtv) {
        await saveTreatmentRecordKtv({
          lich_dat_id: appointmentId,
          vas_truoc: vasTruoc,
          vas_sau: vasSau,
          ghi_chu: ghiChu || null
        });
        toast.success('Ghi nhận kết quả buổi trị liệu thành công!');
        localStorage.removeItem('active_appointment_id');
        localStorage.removeItem('active_appointment_role');
        navigate('/technician/appointments');
      } else {
        await saveAssessment({
          lich_dat_id: appointmentId,
          chan_doan: chanDoan,
          chong_chi_dinh: chongChiDinh,
          goi_dich_vu_id: options?.skipPackage ? null : (goiDichVuId || null),
          ghi_chu: ghiChu || null,
          resolvePendingConflict: options?.resolvePendingConflict
        });
        toast.success('Ghi nhận chẩn đoán lâm sàng và hoàn thành ca khám thành công!');
        localStorage.removeItem('active_appointment_id');
        localStorage.removeItem('active_appointment_role');
        navigate('/doctor'); // Trở lại danh sách hàng chờ
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu hồ sơ điều trị:', error);
      if (!isKtv && error.response?.data?.errorCode === 'PENDING_LIEU_TRINH_CONFLICT') {
        setShowPendingConflictModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ điều trị.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Xử lý gửi kết quả khám: Chỉ validate và mở Modal xác nhận
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId) return;

    if (isKtv) {
      if (vasTruoc === undefined || vasSau === undefined) {
        toast.error('Vui lòng điền đầy đủ lượng giá VAS trước và sau buổi.');
        return;
      }
      if (!ghiChu.trim()) {
        toast.error('Vui lòng điền diễn tiến / ghi chú trị liệu.');
        return;
      }
    } else {
      if (!chanDoan.trim()) {
        toast.error('Vui lòng điền chẩn đoán lâm sàng của bệnh nhân.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  // Tính tuổi bệnh nhân
  const patientAge = useMemo(() => {
    if (!appointment?.ngay_sinh) return '';
    try {
      const birthYear = new Date(appointment.ngay_sinh).getFullYear();
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    } catch {
      return '';
    }
  }, [appointment]);

  if (loading || (appointmentId && !appointment && !errorMsg)) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-650">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Đang tải hồ sơ điều trị khách hàng...</p>
      </div>
    );
  }

  if (!appointmentId) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-md mx-auto">
        <div className="size-20 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-450 dark:text-zinc-500 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <HeartPulse size={36} className="text-zinc-400 dark:text-zinc-550 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
        </div>
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-lg font-black text-secondary dark:text-zinc-100 uppercase tracking-tight">
            Bàn làm việc chưa có bệnh nhân
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed max-w-sm mx-auto">
            Hiện tại bạn không có ca khám hay ca trị liệu nào đang được mở. Vui lòng chọn một ca hẹn từ danh sách lịch hẹn để bắt đầu làm việc.
          </p>
        </div>
        <button
          onClick={() => navigate(isKtv ? '/technician/appointments' : '/doctor/appointments')}
          className="px-6 py-3 bg-primary hover:bg-primary/95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Xem danh sách lịch hẹn
        </button>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-6 rounded-3xl text-center max-w-lg mx-auto mt-12 space-y-4 animate-in fade-in duration-300">
        <AlertTriangle className="size-12 text-rose-500 mx-auto" />
        <h3 className="font-extrabold text-secondary dark:text-red-400">Đã xảy ra lỗi</h3>
        <p className="text-xs text-zinc-650 dark:text-zinc-400 font-semibold leading-relaxed">{errorMsg}</p>
        <button 
          onClick={() => {
            if (activeSessionId) {
              localStorage.setItem('active_appointment_id', activeSessionId);
              navigate(isKtv 
                ? `/technician/appointments/${activeSessionId}/assess` 
                : `/doctor/appointments/${activeSessionId}/assess`
              );
            } else {
              navigate(isKtv ? '/technician/appointments' : '/doctor');
            }
          }}
          className="bg-primary hover:opacity-95 text-zinc-950 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
        >
          {activeSessionId 
            ? 'Trở lại bàn làm việc' 
            : (isKtv ? 'Trở lại danh sách lịch hẹn' : 'Trở lại hàng chờ')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* Banner quá giờ — nổi bật, không thể bỏ sót */}
      <AnimatePresence>
        {isOverdue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(244,63,94,0.25)', '0 0 0 8px rgba(244,63,94,0)'] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-955/15 border border-rose-200/70 dark:border-rose-900/40"
            >
              <AlertTriangle size={18} className="text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                Đã quá giờ kết thúc buổi <span className="font-mono font-black">{formatCountdown(remainingMs || 0)}</span> — vui lòng hoàn tất và bấm "{isKtv ? 'Xác nhận hoàn thành ca trị liệu' : 'Hoàn thành ca khám'}" sớm nhất có thể.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner "Buổi gần nhất liên quan" — trả lời ngay câu "buổi trước có gì cần lưu ý" mà không
          cần tự lọc qua từng chip phác đồ/dịch vụ lẻ bên dưới. */}
      {latestRelevantSession && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-955/10 p-4 flex flex-col sm:flex-row sm:items-start gap-4"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <StaffAvatar
              name={latestRelevantSession.session.ten_ky_thuat_vien}
              avatarUrl={latestRelevantSession.session.anh_ky_thuat_vien}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                📌 Buổi gần nhất liên quan
                <span className="font-bold normal-case text-amber-600/80 dark:text-amber-500/70">
                  · Buổi {latestRelevantSession.session.so_thu_tu_buoi} — cùng liệu trình đang thực hiện
                </span>
              </p>
              <p className="text-xs font-extrabold text-secondary dark:text-zinc-150 mt-1 truncate">
                {latestRelevantSession.plan.ten_goi || latestRelevantSession.plan.ten_dich_vu}
                {latestRelevantSession.session.thoi_gian_bat_dau && (
                  <span className="text-zinc-400 dark:text-zinc-500 font-bold ml-2">
                    {new Date(latestRelevantSession.session.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold mt-1.5 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 shrink-0">
                  <FlameKindling size={12} className="text-amber-500" />
                  VAS {latestRelevantSession.session.danh_gia_truoc_buoi ?? '?'}
                  <TrendingUp size={11} className="text-zinc-400" />
                  {latestRelevantSession.session.danh_gia_sau_buoi ?? '?'}
                </span>
                {latestRelevantSession.session.danh_gia_hieu_qua && (
                  <span className="italic text-zinc-500 dark:text-zinc-450 truncate">
                    "{latestRelevantSession.session.danh_gia_hieu_qua}"
                  </span>
                )}
              </p>
              {latestRelevantSession.session.canh_bao_dac_biet && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1.5">
                  <AlertTriangle size={12} className="shrink-0" /> {latestRelevantSession.session.canh_bao_dac_biet}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setSelectedHistoryItem({ type: 'plan', id: latestRelevantSession.plan.id });
            }}
            className="shrink-0 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
          >
            Xem lịch sử đầy đủ ↓
          </button>
        </motion.div>
      )}

      {/* Premium Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[20px] p-1.5 shadow-xs border border-zinc-150/60 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('assess')}
          className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'assess'
              ? 'bg-primary text-zinc-950 shadow-xs'
              : 'text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
          }`}
        >
          <HeartPulse size={14} />
          {isKtv ? 'Lượng giá buổi trị liệu' : 'Khám lâm sàng'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 md:flex-none px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-primary text-zinc-950 shadow-xs'
              : 'text-zinc-555 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-855'
          }`}
        >
          <ClipboardList size={14} />
          Lịch sử Hồ sơ điều trị
        </button>
      </div>

      {activeTab === 'assess' && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Patient Card Header - Premium Clinic Desk Summary */}
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 p-6 shadow-sm relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 bg-primary/5 dark:bg-primary/10 w-32 h-32 rounded-full -mr-8 -mt-8 blur-2xl"></div>
            
            {/* Top Row: Workspace Label & Appointment ID */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-455 dark:text-zinc-500">
                  Bàn làm việc
                </span>
              </div>
              <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                Mã: {appointment.ma_lich_dat}
              </span>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column (lg:col-span-8): Avatar & Name & Service Info */}
              <div className="lg:col-span-8 flex items-start gap-4">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/5 border border-primary/25 flex items-center justify-center text-primary font-black text-xl shadow-inner shrink-0 scale-105">
                  {(appointment.ten_khach_hang || appointment.ho_ten_khach || 'K').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-secondary dark:text-zinc-100 truncate">
                      {appointment.ten_khach_hang || appointment.ho_ten_khach}
                    </h2>
                    <span className="text-[9px] font-extrabold text-zinc-550 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
                      {appointment.loai === 'KHAM' ? 'Khám lâm sàng' : 'Trị liệu'}
                    </span>
                  </div>

                  {/* Demographic Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-zinc-550 dark:text-zinc-450">
                    <span className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-150/80 dark:border-zinc-800 rounded-md">
                      Giới tính: <span className="text-secondary dark:text-zinc-200 capitalize">{appointment.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-150/80 dark:border-zinc-800 rounded-md">
                      Tuổi: <span className="text-secondary dark:text-zinc-200">{patientAge || 'N/A'}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-150/80 dark:border-zinc-800 rounded-md">
                      SĐT: <span className="text-secondary dark:text-zinc-200">{appointment.so_dien_thoai || appointment.sdt_khach_hang || 'N/A'}</span>
                    </span>
                  </div>

                  {/* Service Package Text */}
                  {appointment.loai !== 'KHAM' && appointment.ten_dich_vu ? (
                    <p className="text-xs text-zinc-650 dark:text-zinc-350 font-bold mt-1 text-left leading-relaxed">
                      Dịch vụ: <span className="text-secondary dark:text-zinc-100">{appointment.ten_dich_vu}</span>
                      {appointment.phac_do_dieu_tri_id && appointment.so_thu_tu_buoi && (
                        <span className="text-primary font-black"> — Buổi {appointment.so_thu_tu_buoi}{appointment.pd_tong_so_buoi ? `/${appointment.pd_tong_so_buoi}` : ''}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 font-bold italic mt-1">Hồ sơ khám lâm sàng chưa lập phác đồ</p>
                  )}
                </div>
              </div>

              {/* Right Column (lg:col-span-4): Stats / Time Box & Countdown */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end items-stretch sm:items-center lg:items-end">
                
                {/* Appointment time Box */}
                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2 rounded-2xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2 w-full max-w-[240px] shrink-0">
                  <CalendarIcon size={13} className="text-primary shrink-0" />
                  <div className="leading-tight text-left">
                    <p className="text-[7px] text-zinc-400 dark:text-zinc-500 font-black uppercase">Thời gian hẹn</p>
                    <p className="text-[10px] font-mono font-black text-secondary dark:text-zinc-200 mt-0.5">
                      {new Date(appointment.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} — {new Date(appointment.ngay_gio_bat_dau).toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'})}
                    </p>
                  </div>
                </div>

                {/* Countdown Box */}
                {isSessionOpen && remainingMs !== null && !isOverdue && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-955/10 p-2 rounded-2xl border border-emerald-150/50 dark:border-emerald-900/30 flex items-center gap-2 w-full max-w-[240px] shadow-xs shrink-0">
                    <Timer size={13} className="text-emerald-500 shrink-0 animate-pulse" />
                    <div className="leading-tight text-left">
                      <p className="text-[7px] text-emerald-650 dark:text-emerald-500 font-black uppercase tracking-wider">Thời gian còn lại</p>
                      <p className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                        {formatCountdown(remainingMs)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>


          <form 
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-3 mb-1">
              <button
                type="button"
                onClick={() => navigate(isKtv ? '/technician/appointments' : '/doctor')}
                className="p-2 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all shrink-0"
              >
                <ArrowLeft size={14} />
              </button>
              <span className="font-mono text-[10px] text-primary font-extrabold">
                {appointment.ma_lich_dat}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-wider flex items-baseline gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-primary shrink-0" />
                  {isKtv ? 'Lượng giá buổi trị liệu' : 'Kết luận lâm sàng'}
                </span>
                {appointment && (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-extrabold lowercase">
                    {(() => {
                      const d = new Date(appointment.ngay_gio_bat_dau);
                      const hour = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                      const day = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
                      return `( ${hour} ngày ${day} )`;
                    })()}
                  </span>
                )}
              </h3>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">
                {isKtv ? 'Chỉ số đau (VAS) & nhật ký trị liệu' : 'Chẩn đoán & Khuyến nghị điều trị'}
              </p>
            </div>

            {/* Lý do khám bệnh / trị liệu (Đổ tự động từ ca hiện tại, ẩn đối với KTV) */}
            {appointment && !isKtv && (
              <div className="bg-zinc-50/60 dark:bg-zinc-850/20 p-4 rounded-xl border border-zinc-150/50 dark:border-zinc-800 space-y-3 text-left">
                <div>
                  <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Lý do {appointment.loai === 'KHAM' ? 'khám bệnh' : 'trị liệu'}
                  </span>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                    {appointment.ly_do_kham || 'Không có mô tả chi tiết lý do.'}
                  </p>
                </div>
                {appointment.anh_dinh_kem_url && (
                  <div className="space-y-1.5 pt-1.5 border-t border-zinc-150/40 dark:border-zinc-800/40">
                    <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Ảnh tổn thương đính kèm
                    </span>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden max-w-[200px] bg-zinc-100 dark:bg-zinc-950 p-1">
                      <img 
                        src={appointment.anh_dinh_kem_url} 
                        alt="Ảnh tổn thương" 
                        className="w-full max-h-40 object-contain rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isKtv ? (
              <>
                {/* Pain Scale (VAS) circular selectors - Pro Max */}
                <div className="space-y-5 pt-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex justify-between">
                      <span>Mức độ đau Trước trị liệu (VAS) <span className="text-rose-500">*</span></span>
                      <span className="text-primary font-bold">Mức {vasTruoc}</span>
                    </label>
                    <VasSlider value={vasTruoc} onChange={setVasTruoc} />
                    {vasTruoc !== null && (
                      <p className="text-[10px] text-zinc-650 dark:text-zinc-450 font-bold mt-2 italic bg-zinc-50 dark:bg-zinc-850/50 p-3 rounded-xl border border-zinc-150/40 dark:border-zinc-800/80 leading-relaxed">
                        {getVasDescription(vasTruoc)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex justify-between">
                      <span>Mức độ đau Sau trị liệu (VAS) <span className="text-rose-500">*</span></span>
                      <span className="text-primary font-bold">Mức {vasSau}</span>
                    </label>
                    <VasSlider value={vasSau} onChange={setVasSau} />
                    {vasSau !== null && (
                      <p className="text-[10px] text-zinc-655 dark:text-zinc-450 font-bold mt-2 italic bg-zinc-50 dark:bg-zinc-850/50 p-3 rounded-xl border border-zinc-150/40 dark:border-zinc-800/80 leading-relaxed">
                        {getVasDescription(vasSau)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Diễn tiến / Ghi chú trị liệu */}
                <div className="space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex items-center gap-1.5">
                    <FileText size={14} className="text-primary" />
                    Ghi chú buổi trị liệu <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                    placeholder="Nhập tiến trình tập, kỹ thuật đã thực hiện, phản hồi cơ thể của khách (vd: giãn cơ, bấm huyệt vùng cổ, xung siêu âm nhẹ nhàng)..."
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Chẩn đoán */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex items-center gap-1.5">
                    <HeartPulse size={14} className="text-primary" />
                    Chẩn đoán lâm sàng <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={chanDoan}
                    onChange={(e) => setChanDoan(e.target.value)}
                    placeholder="Nhập chẩn đoán y khoa... (ví dụ: Thoái hóa đốt sống cổ C5-C6 gây chèn ép thần kinh vai gáy)"
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-850/50 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
                  />
                </div>

                {/* Chống chỉ định */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Chống chỉ định y khoa (nếu có)
                  </label>
                  <textarea
                    value={chongChiDinh}
                    onChange={(e) => setChongChiDinh(e.target.value)}
                    placeholder="Những vùng tránh can thiệp mạnh (ví dụ: Tránh siêu âm nhiệt vùng có kim loại, không dán parafin nóng vùng cổ chân có viêm cấp)..."
                    rows={2}
                    className="w-full px-4 py-3 bg-rose-50/10 dark:bg-rose-955/5 border border-rose-200/50 dark:border-rose-900/40 rounded-2xl text-xs font-semibold text-rose-650 dark:text-rose-450 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all placeholder-rose-350"
                  />
                </div>

                {/* Đề xuất gói liệu trình */}
                <div className="space-y-4 pt-4 border-t border-zinc-150/65 dark:border-zinc-800/80">
                  <style>{`
                    .package-scroll::-webkit-scrollbar { width: 5px; }
                    .package-scroll::-webkit-scrollbar-track { background: transparent; }
                    .package-scroll::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 99px; }
                    .dark .package-scroll::-webkit-scrollbar-thumb { background: #27272a; }
                  `}</style>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
                        <ClipboardList size={13} className="text-primary" /> Khuyến nghị phác đồ trị liệu
                      </h4>
                      <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5">Lựa chọn gói phác đồ đề xuất cho khách</p>
                    </div>

                    {/* Ô Tìm kiếm nhanh */}
                    <div className="relative w-full sm:w-48">
                      <input
                        type="text"
                        value={packageSearchQuery}
                        onChange={(e) => setPackageSearchQuery(e.target.value)}
                        placeholder="Tìm nhanh gói..."
                        className="w-full bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl pl-7 pr-3 py-1.5 text-[10px] font-semibold text-secondary outline-none transition-all placeholder-zinc-400"
                      />
                      <svg className="absolute left-2.5 top-2.5 text-zinc-400 size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Cảnh báo sớm — khách đang có chỉ định/phác đồ liệu trình khác còn hiệu lực. Chỉ
                      mang tính thông tin: quyết định xóa/giữ chỉ định cũ diễn ra ở modal lúc bấm lưu,
                      không xử lý ngay tại đây để tránh sửa DB ngoài luồng lưu chính thức. */}
                  {appointment?.package_conflict?.blocked && (
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                      appointment.package_conflict.type === 'active_plan'
                        ? 'bg-rose-50 dark:bg-rose-955/10 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300'
                    }`}>
                      {appointment.package_conflict.type === 'active_plan' ? (
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      ) : (
                        <Timer size={16} className="shrink-0 mt-0.5" />
                      )}
                      <p className="min-w-0 flex-1 text-xs font-semibold leading-relaxed">
                        {appointment.package_conflict.type === 'active_plan' ? (
                          <>Khách hàng đang điều trị gói <strong>"{appointment.package_conflict.ten_goi}"</strong>. Không thể chỉ định liệu trình mới cho tới khi liệu trình này hoàn thành hoặc bị hủy.</>
                        ) : (
                          <>
                            Khách hàng đang có chỉ định <strong>"{appointment.package_conflict.ten_goi}"</strong> từ ca khám trước
                            {appointment.package_conflict.han_kich_hoat && (() => {
                              const daysLeft = Math.ceil((new Date(appointment.package_conflict.han_kich_hoat).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                              return daysLeft > 0 ? `, còn ${daysLeft} ngày để kích hoạt` : '';
                            })()}
                            {' '}(chưa thanh toán). Nếu chỉ định gói mới, bạn sẽ được chọn xóa hoặc giữ chỉ định này lúc lưu.
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">
                      Đề xuất gói liệu trình {packageSearchQuery && `(Đã lọc: ${filteredPackages.length})`}
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[265px] overflow-y-auto pr-1.5 package-scroll">
                      {/* Thẻ không đề xuất gói (Luôn hiển thị đầu tiên) */}
                      {!packageSearchQuery && (
                        <div
                          onClick={() => setGoiDichVuId('')}
                          className={`group relative p-3 border.5 rounded-xl cursor-pointer transition-all duration-300 flex items-start gap-2.5 select-none ${
                            !goiDichVuId
                              ? 'border-zinc-400 dark:border-zinc-650 bg-zinc-50 dark:bg-zinc-850/60 ring-2 ring-zinc-500/10 shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900/10 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/20'
                          }`}
                        >
                          <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-[9px] shrink-0 border transition-all ${
                            !goiDichVuId
                              ? 'bg-zinc-500 text-white border-zinc-500 shadow-sm'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-450 border-zinc-200 dark:border-zinc-700'
                          }`}>
                            OFF
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <h5 className="text-[11px] font-black text-secondary dark:text-zinc-200 leading-tight">Không đề xuất phác đồ</h5>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 font-semibold leading-tight">
                              Không đề xuất gói
                            </p>
                          </div>
                          {!goiDichVuId && (
                            <div className="absolute top-2 right-2 bg-zinc-500 text-white rounded-full p-0.5 shadow-sm scale-90">
                              <CheckCircle size={10} className="stroke-[3]" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Các thẻ gói đã lọc */}
                      {filteredPackages.map((pkg) => {
                        const isSelected = goiDichVuId === pkg.id;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => setGoiDichVuId(pkg.id)}
                            className={`group relative p-3 border.5 rounded-xl cursor-pointer transition-all duration-300 flex flex-col justify-between select-none ${
                              isSelected
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/10 shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900/10 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/20'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 w-full text-left">
                              <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-[9px] shrink-0 border transition-all ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                              }`}>
                                GOI
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[11px] font-black text-secondary dark:text-zinc-200 leading-tight line-clamp-2">
                                  {pkg.ten_goi}
                                </h5>
                                {pkg.mo_ta && (
                                  <p className="text-[9px] text-zinc-400 dark:text-zinc-550 mt-1 font-semibold leading-tight line-clamp-2">
                                    {pkg.mo_ta}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-zinc-150 dark:border-zinc-800/80 w-full">
                              <span className="text-[9px] text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider">Giá gói</span>
                              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-450 tabular-nums">
                                {pkg.gia_goi.toLocaleString('vi-VN')}đ
                              </span>
                            </div>

                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5 shadow-sm scale-90">
                                <CheckCircle size={10} className="stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {filteredPackages.length === 0 && (
                        <div className="col-span-2 py-8 text-center text-[11px] text-zinc-400 font-semibold italic">
                          Không tìm thấy gói phác đồ phù hợp.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dặn dò bác sĩ */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                    Ghi chú / Dặn dò thêm
                  </label>
                  <textarea
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                    placeholder="Nhập hướng dẫn tập luyện thêm tại nhà hoặc dặn dò đặc biệt..."
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 uppercase tracking-widest"
            >
              {submitLoading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {isKtv ? 'Xác nhận hoàn thành ca trị liệu' : 'Hoàn thành ca khám'}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 p-6 shadow-sm min-h-[500px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: History Lists (col-span-4) */}
            <div className="lg:col-span-4 space-y-6 lg:border-r lg:border-zinc-150 lg:dark:border-zinc-800 lg:pr-6 max-h-[70vh] overflow-y-auto pr-1 package-scroll">
              <div className="space-y-4">
                <PlanColumn
                  plans={profile?.treatmentPlans || []}
                  onOpenPlan={(id) => setSelectedHistoryItem({ type: 'plan', id })}
                />
                
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 my-4" />
                
                <VisitColumn
                  visits={profile?.visits || []}
                  onOpenVisit={(id) => setSelectedHistoryItem({ type: 'visit', id })}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Inline Detailed View (col-span-8) */}
            <div className="lg:col-span-8 min-h-[400px]">
              {selectedHistoryItem ? (
                <>
                  {activePlan && (
                    <PlanDetailModal
                      key={`plan-inline-${activePlan.id}`}
                      plan={activePlan}
                      onJumpToVisit={(visitId) => setSelectedHistoryItem({ type: 'visit', id: visitId })}
                      isInline={true}
                    />
                  )}
                  {activeVisit && (
                    <VisitDetailModal
                      key={`visit-inline-${activeVisit.id}`}
                      visit={activeVisit}
                      linkedPlan={linkedPlanForActiveVisit}
                      onJumpToPlan={(planId) => setSelectedHistoryItem({ type: 'plan', id: planId })}
                      isInline={true}
                    />
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl min-h-[400px]">
                  <ClipboardList className="size-16 text-zinc-300 dark:text-zinc-700 animate-pulse mb-4" />
                  <h4 className="text-sm font-black text-secondary dark:text-zinc-350 uppercase tracking-wider">Hồ sơ lịch sử điều trị</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold max-w-sm mt-2">
                    Vui lòng chọn một phác đồ trị liệu hoặc một ca khám lâm sàng ở cột bên trái để xem thông tin chi tiết.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <AnimatePresence>
        {showConfirmModal && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[80]"
            />

            {/* Modal Dialog */}
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-[28px] p-6 shadow-2xl pointer-events-auto overflow-hidden relative"
              >
                {/* Header / Icon */}
                <div className="text-center space-y-4">
                  {isOverdue ? (
                    <div className="mx-auto size-14 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
                      <AlertTriangle size={24} className="animate-bounce" />
                    </div>
                  ) : (
                    <div className="mx-auto size-14 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                      <CheckCircle size={24} />
                    </div>
                  )}

                  <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-widest">
                    {isOverdue ? '⚠️ Cảnh báo quá giờ ca hẹn!' : 'Xác nhận hoàn thành ca'}
                  </h3>

                  {/* Timing chip like the image */}
                  {remainingMs !== null && (
                    isOverdue ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-955/15 border border-rose-200/50 dark:border-rose-900/40 text-rose-600 dark:text-rose-455 rounded-2xl mx-auto w-fit shadow-xs">
                        <AlertTriangle size={14} className="stroke-[2.5]" />
                        <div className="text-left leading-tight">
                          <p className="text-[8px] font-black uppercase tracking-wider opacity-85">QUÁ GIỜ</p>
                          <p className="text-[12px] font-mono font-black tabular-nums">Đã hết thời gian buổi hẹn</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-955/15 border border-emerald-200/50 dark:border-emerald-900/40 text-emerald-650 dark:text-emerald-455 rounded-2xl mx-auto w-fit shadow-xs">
                        <Timer size={14} className="stroke-[2.5]" />
                        <div className="text-left leading-tight">
                          <p className="text-[8px] font-black uppercase tracking-wider opacity-85">CÒN LẠI</p>
                          <p className="text-[12px] font-mono font-black tabular-nums">{formatCountdown(remainingMs)}</p>
                        </div>
                      </div>
                    )
                  )}

                  <div className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed px-2">
                    {isOverdue ? (
                      <p>
                        Ca {isKtv ? 'trị liệu' : 'khám'} của khách hàng <span className="font-extrabold text-secondary dark:text-zinc-200">{appointment?.ten_khach_hang || appointment?.ho_ten_khach}</span> đã <span className="text-rose-500 font-extrabold">QUÁ GIỜ</span> quy định. Bạn có chắc chắn muốn kết thúc và lưu hồ sơ ngay bây giờ?
                      </p>
                    ) : (
                      <p>
                        Bạn đang hoàn thành sớm ca {isKtv ? 'trị liệu' : 'khám'} của bệnh nhân <span className="font-extrabold text-secondary dark:text-zinc-200">{appointment?.ten_khach_hang || appointment?.ho_ten_khach}</span>. Xác nhận lưu hồ sơ và giải phóng phòng?
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-150 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-650 dark:text-zinc-300 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmSubmit()}
                    className={`flex-1 py-3 text-white rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md ${
                      isOverdue
                        ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                        : 'bg-primary hover:bg-primary/95 shadow-primary/10'
                    }`}
                  >
                    Xác nhận hoàn thành
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {showPendingConflictModal && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPendingConflictModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[80]"
            />

            {/* Modal Dialog */}
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-[28px] p-6 shadow-2xl pointer-events-auto overflow-hidden relative"
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto size-14 bg-amber-50 dark:bg-amber-955/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                    <Timer size={24} />
                  </div>

                  <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-widest">
                    Khách đang có chỉ định khác
                  </h3>

                  <div className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed px-2">
                    <p>
                      Khách hàng <span className="font-extrabold text-secondary dark:text-zinc-200">{appointment?.ten_khach_hang || appointment?.ho_ten_khach}</span> đã được chỉ định gói{' '}
                      <span className="font-extrabold text-secondary dark:text-zinc-200">"{appointment?.package_conflict?.ten_goi}"</span> từ ca khám trước, còn hạn kích hoạt và chưa thanh toán. Chọn 1 trong 3 lựa chọn dưới đây:
                    </p>
                  </div>
                </div>

                {/* 3 lựa chọn */}
                <div className="flex flex-col gap-2.5 mt-6">
                  <button
                    type="button"
                    onClick={() => handleConfirmSubmit({ resolvePendingConflict: true })}
                    className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-rose-500/10 text-left"
                  >
                    Xóa chỉ định cũ, dùng gói mới
                    <span className="block text-[9px] font-bold normal-case tracking-normal opacity-80 mt-0.5">Không thể hoàn tác — chỉ định cũ bị xóa hẳn khỏi hệ thống</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmSubmit({ skipPackage: true })}
                    className="w-full py-3 px-4 bg-zinc-100 hover:bg-zinc-150 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-755 dark:text-zinc-200 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer text-left"
                  >
                    Giữ chỉ định cũ, không chỉ định gói cho ca khám này
                    <span className="block text-[9px] font-bold normal-case tracking-normal opacity-70 mt-0.5">Vẫn lưu chẩn đoán/hoàn thành ca khám bình thường</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPendingConflictModal(false)}
                    className="w-full py-2.5 text-zinc-450 dark:text-zinc-500 rounded-2xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    Quay lại chọn gói khác
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

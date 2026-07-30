import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  HeartPulse,
  ClipboardList,
  ShieldAlert,
  FlameKindling,
  Timer,
  Stethoscope,
  Activity,
  Sparkles,
  UserCheck,
  Coins,
  Clock,
  User
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import {
  getAppointmentDetail,
  getPatientProfile,
  getPackages,
  saveAssessment,
  getActiveSession,
  PatientProfile,
  PackageItem
} from '../../features/doctor/api/doctor.api';
import {
  getAppointmentDetail as getAppointmentDetailKtv,
  saveTreatmentRecord as saveTreatmentRecordKtv,
  getPatientProfile as getPatientProfileKtv,
  getActiveSession as getActiveSessionKtv
} from '../../features/technician/api/technician.api';
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

  // Ca đã kết thúc (hoàn thành/hủy/không đến) — chỉ được xem lại, cấm hoàn thành lại lần nữa vì sẽ
  // ghi đè/xóa dữ liệu lâm sàng + chỉ định gói đã dùng để lập hóa đơn thật (backend cũng đã chặn,
  // đây là lớp bảo vệ UI để tránh nhân viên bấm nhầm).
  const isTerminalStatus = !!appointment && [
    'hoan_thanh', 'da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'
  ].includes(appointment.trang_thai);

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
    if (isTerminalStatus) {
      toast.error('Ca này đã kết thúc, không thể chỉnh sửa hoặc hoàn thành lại.');
      return;
    }

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
      if (!chongChiDinh.trim()) {
        toast.error('Vui lòng điền chống chỉ định y khoa (nếu không có, ghi rõ "Không có").');
        return;
      }
      if (!ghiChu.trim()) {
        toast.error('Vui lòng điền ghi chú / dặn dò cho khách hàng.');
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

      {/* Premium Tab Navigation HUD */}
      <div className="flex border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[24px] p-2 shadow-xl shadow-slate-200/40 dark:shadow-none gap-2 font-jakarta">
        <button
          type="button"
          onClick={() => setActiveTab('assess')}
          className={`flex-1 md:flex-none px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
            activeTab === 'assess'
              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/25 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
          }`}
        >
          <Stethoscope size={16} />
          {isKtv ? 'Bàn Lượng Giá Trị Liệu' : 'Bàn Khám Lâm Sàng'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 md:flex-none px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/25 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
          }`}
        >
          <ClipboardList size={16} />
          Lịch Sử Hồ Sơ Điều Trị
        </button>
      </div>

      {activeTab === 'assess' && (
        <div className="max-w-7xl mx-auto space-y-6 font-jakarta">

          {isTerminalStatus && (
            <div className="flex items-center gap-3 px-6 py-4 rounded-[22px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ca này đã kết thúc (trạng thái: <span className="font-black text-slate-900 dark:text-white uppercase">{appointment?.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : appointment?.trang_thai}</span>) — Chỉ xem lại thông tin, không thể sửa hoặc hoàn thành lại.
              </p>
            </div>
          )}

          {/* Patient Header HUD Banner - Pro Max Medical Summary */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/30 dark:shadow-none relative overflow-hidden space-y-5 text-left">
            <div className="absolute top-0 right-0 bg-teal-500/5 w-64 h-64 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Top Row: Workspace Title & Appointment ID */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  {isKtv ? 'BÀN KHÁM KỸ THUẬT VIÊN PHỤC HỒI CHỨC NĂNG' : 'BÀN KHÁM LÂM SÀNG BÁC SĨ CHUYÊN KHOA'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(isKtv ? '/technician/appointments' : '/doctor')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Trở về
                </button>
                <span className="font-mono text-xs font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
                  MÃ CA: {appointment.ma_lich_dat}
                </span>
              </div>
            </div>

            {/* Main Patient Demographics Row */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-teal-600/30 shrink-0">
                  {(appointment.ten_khach_hang || appointment.ho_ten_khach || 'K').charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">
                      {appointment.ten_khach_hang || appointment.ho_ten_khach}
                    </h2>
                    <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
                      {appointment.loai === 'KHAM' ? '🩺 Khám lâm sàng' : '⚡ Trị liệu phác đồ'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      Giới tính: <strong className="text-slate-900 dark:text-white capitalize">{appointment.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}</strong>
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      Tuổi: <strong className="text-slate-900 dark:text-white">{patientAge || 'N/A'}</strong>
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      SĐT: <strong className="text-slate-900 dark:text-white">{appointment.so_dien_thoai || appointment.sdt_khach_hang || 'N/A'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Appointment Time & Session Countdown Badges */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
                  <CalendarIcon size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="text-left leading-tight">
                    <p className="text-[9px] font-black uppercase text-slate-400">Thời gian hẹn khám</p>
                    <p className="text-xs font-mono font-black text-slate-900 dark:text-white mt-0.5">
                      {new Date(appointment.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} — {new Date(appointment.ngay_gio_bat_dau).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                    </p>
                  </div>
                </div>

                {isSessionOpen && remainingMs !== null && !isOverdue && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 shadow-xs">
                    <Timer size={16} className="text-emerald-500 shrink-0 animate-pulse" />
                    <div className="text-left leading-tight">
                      <p className="text-[9px] font-black uppercase text-emerald-700 dark:emerald-400">Còn lại trong ca</p>
                      <p className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                        {formatCountdown(remainingMs)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2-Column Grid Layout Pro Max */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column (8 cols): Main Form */}
            <div className="lg:col-span-8 space-y-6">
              <form 
                onSubmit={handleSubmit}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-6 text-left"
              >
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2.5">
                    <ClipboardList size={18} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    {isKtv ? 'LƯỢNG GIÁ & NHẬT KÝ ĐIỀU TRỊ BỆNH NHÂN' : 'KẾT LUẬN LÂM SÀNG & KHUYẾN NGHỊ PHÁC ĐỒ'}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {isKtv ? 'Ghi nhận chỉ số đau VAS trước/sau ca và diễn tiến điều trị thực tế.' : 'Ghi nhận chẩn đoán y khoa, chống chỉ định và đề xuất phác đồ gói trị liệu phù hợp.'}
                  </p>
                </div>

                {/* Chief Complaint / Reason for visit */}
                {appointment && !isKtv && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 text-left">
                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                      Lý do khám bệnh & Triệu chứng ban đầu:
                    </span>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {appointment.ly_do_kham || 'Không có mô tả chi tiết lý do khám.'}
                    </p>
                    {appointment.anh_dinh_kem_url && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                          Hình ảnh tổn thương đính kèm:
                        </span>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-w-[220px] bg-slate-100 dark:bg-slate-950 p-1">
                          <img 
                            src={appointment.anh_dinh_kem_url} 
                            alt="Ảnh tổn thương" 
                            className="w-full max-h-40 object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isKtv ? (
                  <>
                    {/* Pain Scale (VAS) Sliders */}
                    <div className="space-y-6 pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex justify-between">
                          <span>Mức độ đau TRƯỚC trị liệu (VAS) <span className="text-rose-500">*</span></span>
                          <span className="text-teal-600 dark:text-teal-400 font-extrabold">Mức {vasTruoc}</span>
                        </label>
                        <VasSlider value={vasTruoc} onChange={setVasTruoc} />
                        {vasTruoc !== null && (
                          <p className="text-xs font-semibold italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 leading-relaxed">
                            {getVasDescription(vasTruoc)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex justify-between">
                          <span>Mức độ đau SAU trị liệu (VAS) <span className="text-rose-500">*</span></span>
                          <span className="text-teal-600 dark:text-teal-400 font-extrabold">Mức {vasSau}</span>
                        </label>
                        <VasSlider value={vasSau} onChange={setVasSau} />
                        {vasSau !== null && (
                          <p className="text-xs font-semibold italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 leading-relaxed">
                            {getVasDescription(vasSau)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* KTV Note */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                        <FileText size={16} className="text-teal-600 dark:text-teal-400" />
                        Ghi chú diễn tiến ca trị liệu <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={ghiChu}
                        onChange={(e) => setGhiChu(e.target.value)}
                        placeholder="Nhập tiến trình tập, kỹ thuật đã thực hiện (vd: Giãn cơ cổ vai gáy, dán parafin nóng, xung siêu âm tần số 1.5MHz)..."
                        rows={4}
                        required
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all placeholder-slate-400"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Clinical Diagnosis */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block flex items-center gap-2">
                        <Stethoscope size={16} className="text-teal-600 dark:text-teal-400" />
                        Chẩn đoán lâm sàng Bác sĩ <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={chanDoan}
                        onChange={(e) => setChanDoan(e.target.value)}
                        placeholder="Nhập chẩn đoán y khoa chính xác... (ví dụ: Thoái hóa đốt sống cổ C5-C6 gây chèn ép rễ thần kinh vai gáy)"
                        rows={4}
                        required
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all placeholder-slate-400"
                      />
                    </div>

                    {/* Medical Contraindications */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block flex items-center gap-2">
                        <ShieldAlert size={16} /> Chống chỉ định y khoa đặc biệt <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={chongChiDinh}
                        onChange={(e) => setChongChiDinh(e.target.value)}
                        placeholder="Vùng cần tránh tác động mạnh (ví dụ: Không dùng sóng xung kích vùng cột sống thắt lưng có nẹp kim loại)... Nếu không có ghi &quot;Không có&quot;."
                        rows={2}
                        required
                        className="w-full px-4 py-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-900 dark:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all placeholder-rose-300"
                      />
                    </div>

                    {/* Package Recommendation Grid */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <ClipboardList size={16} className="text-teal-600 dark:text-teal-400" /> Khuyến nghị phác đồ gói trị liệu
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">Chọn gói điều trị chuyên sâu đề xuất cho bệnh nhân</p>
                        </div>

                        {/* Search package input */}
                        <div className="relative w-full sm:w-56">
                          <input
                            type="text"
                            value={packageSearchQuery}
                            onChange={(e) => setPackageSearchQuery(e.target.value)}
                            placeholder="Tìm nhanh tên gói..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all placeholder-slate-400"
                          />
                          <svg className="absolute left-2.5 top-2.5 text-slate-400 size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>

                      {/* Package Grid Cards */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1 package-scroll">
                          {/* Option 1: No Package */}
                          {!packageSearchQuery && (
                            <div
                              onClick={() => setGoiDichVuId('')}
                              className={`group relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3 select-none ${
                                !goiDichVuId
                                  ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/40 shadow-sm'
                                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                              }`}
                            >
                              <div className={`p-2 rounded-xl shrink-0 ${!goiDichVuId ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                <ShieldAlert size={18} />
                              </div>
                              <div className="space-y-0.5">
                                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase">Không đề xuất phác đồ</h5>
                                <p className="text-[10px] text-slate-500 font-semibold leading-tight">Khách hàng chỉ thực hiện khám lâm sàng đơn lẻ.</p>
                              </div>
                            </div>
                          )}

                          {/* Dynamic Package Cards */}
                          {filteredPackages.map((pkg) => {
                            const isSelected = goiDichVuId === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setGoiDichVuId(pkg.id)}
                                className={`group relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between select-none ${
                                  isSelected
                                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/40 shadow-sm scale-[1.01]'
                                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800">
                                      {pkg.tong_so_buoi} Buổi
                                    </span>
                                    {isSelected && <CheckCircle size={14} className="text-teal-600 dark:text-teal-400" />}
                                  </div>
                                  <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-snug line-clamp-1">{pkg.ten_goi}</h5>
                                  {pkg.mo_ta && <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 leading-tight">{pkg.mo_ta}</p>}
                                </div>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between mt-2">
                                  <span className="text-[9px] font-black uppercase text-slate-400">Đơn giá gói</span>
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{pkg.gia_goi.toLocaleString('vi-VN')}đ</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                        Ghi chú & Dặn dò thêm cho bệnh nhân <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={ghiChu}
                        onChange={(e) => setGhiChu(e.target.value)}
                        placeholder="Nhập dặn dò về chế độ tập luyện tại nhà, tư thế ngồi làm việc đúng..."
                        rows={2}
                        required
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all placeholder-slate-400"
                      />
                    </div>
                  </>
                )}

                {/* Pro Max Submit Button */}
                {!isTerminalStatus && (
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-600/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    {submitLoading ? (
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        {isKtv ? 'XÁC NHẬN HOÀN THÀNH CA TRỊ LIỆU' : 'XÁC NHẬN HOÀN THÀNH CA KHÁM'}
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>

            {/* Right Column (4 cols): Medical HUD Sidebar */}
            <div className="lg:col-span-4 space-y-6">

              {/* Card 1: Medical Vital Signs HUD Widget */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-teal-600 dark:text-teal-400" />
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">Sinh Hiệu Bệnh Nhân</h4>
                  </div>
                  <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    🟢 Ổn định
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase text-slate-400">Nhịp tim</p>
                    <p className="text-sm font-mono font-black text-teal-600 dark:text-teal-400 mt-0.5">75 BPM</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase text-slate-400">Huyết áp</p>
                    <p className="text-sm font-mono font-black text-teal-600 dark:text-teal-400 mt-0.5">120/80</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase text-slate-400">Nhiệt độ</p>
                    <p className="text-sm font-mono font-black text-teal-600 dark:text-teal-400 mt-0.5">36.8 °C</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase text-slate-400">Mức đau VAS</p>
                    <p className="text-sm font-mono font-black text-rose-600 dark:text-rose-400 mt-0.5">
                      {isKtv ? (vasTruoc ?? 0) : 3} / 10
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Recent Session Summary */}
              {latestRelevantSession && (
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-amber-200/80 dark:border-amber-800 p-6 shadow-xl shadow-amber-500/5 text-left space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 border-b border-amber-100 dark:border-amber-900/40 pb-2.5">
                    <FlameKindling size={16} />
                    <h4 className="text-xs font-black uppercase tracking-wider">Buổi Trị Liệu Gần Nhất</h4>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {latestRelevantSession.plan.ten_goi || latestRelevantSession.plan.ten_dich_vu}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Buổi #{latestRelevantSession.session.so_thu_tu_buoi} — VAS: {latestRelevantSession.session.danh_gia_truoc_buoi ?? '?'} ➔ {latestRelevantSession.session.danh_gia_sau_buoi ?? '?'}
                  </p>
                  {latestRelevantSession.session.danh_gia_hieu_qua && (
                    <p className="text-[11px] italic font-bold text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/50">
                      "{latestRelevantSession.session.danh_gia_hieu_qua}"
                    </p>
                  )}
                </div>
              )}

              {/* Card 3: Clinical Flow HUD */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/30 dark:shadow-none space-y-4 text-left">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                  <Clock size={16} className="text-teal-600 dark:text-teal-400" />
                  Quy Trình Khám Lâm Sàng 3 Bước
                </h4>
                <div className="space-y-3 text-xs font-bold">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Tiếp nhận & Đo sinh hiệu ban đầu</span>
                  </div>
                  <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black animate-pulse">2</span>
                    <span className="font-black uppercase">Khám chuyên khoa & Kết luận</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-black">3</span>
                    <span>Chỉ định phác đồ & Bàn giao KTV</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

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

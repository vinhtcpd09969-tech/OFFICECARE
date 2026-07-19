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
  Timer
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/authStore';
import {
  getAppointmentDetail,
  getPatientProfile,
  getPackages,
  saveAssessment,
  PatientProfile,
  PackageItem
} from '../../api/doctor.api';
type ActiveModal = { type: 'plan'; id: string } | { type: 'visit'; id: string } | null;
import {
  getAppointmentDetail as getAppointmentDetailKtv,
  saveTreatmentRecord as saveTreatmentRecordKtv,
  getPatientProfile as getPatientProfileKtv
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
  const { id: appointmentId } = useParams<{ id: string }>();
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

  // Popup phác đồ/ca khám đang mở trong khối "Hồ sơ điều trị" (2 cột Phác đồ / Khám & Dịch vụ lẻ)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Đồng hồ đếm ngược tới giờ kết thúc buổi — chạy độc lập, tick mỗi giây
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tải dữ liệu ban đầu
  const loadInitialData = useCallback(async () => {
    if (!appointmentId) return;
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
    } finally {
      setLoading(false);
    }
  }, [appointmentId, isKtv]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const activePlan = useMemo(() => {
    if (activeModal?.type !== 'plan' || !profile) return null;
    return profile.treatmentPlans.find((p) => p.id === activeModal.id) || null;
  }, [activeModal, profile]);

  const activeVisit = useMemo(() => {
    if (activeModal?.type !== 'visit' || !profile) return null;
    return profile.visits.find((v) => v.id === activeModal.id) || null;
  }, [activeModal, profile]);

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

  // Xử lý gửi kết quả khám
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
        navigate('/technician/appointments');
      } else {
        await saveAssessment({
          lich_dat_id: appointmentId,
          chan_doan: chanDoan,
          chong_chi_dinh: chongChiDinh,
          goi_dich_vu_id: goiDichVuId || null,
          ghi_chu: ghiChu || null
        });
        toast.success('Ghi nhận chẩn đoán lâm sàng và hoàn thành ca khám thành công!');
        navigate('/doctor'); // Trở lại danh sách hàng chờ
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu hồ sơ điều trị:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ điều trị.');
    } finally {
      setSubmitLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-650">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Đang tải hồ sơ điều trị khách hàng...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-6 rounded-3xl text-center max-w-lg mx-auto mt-12 space-y-4">
        <AlertTriangle className="size-12 text-rose-500 mx-auto" />
        <h3 className="font-extrabold text-secondary dark:text-red-400">Đã xảy ra lỗi</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">{errorMsg}</p>
        <button 
          onClick={() => navigate(isKtv ? '/technician/appointments' : '/doctor')}
          className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 shadow-soft-button"
        >
          {isKtv ? 'Trở lại lịch hẹn' : 'Trở lại hàng chờ'}
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
            onClick={() => setActiveModal({ type: 'plan', id: latestRelevantSession.plan.id })}
            className="shrink-0 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap"
          >
            Xem lịch sử đầy đủ ↓
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Diagnostic & Recommendations Form (5 Cols) */}
        <div className="lg:col-span-5">
          <form 
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 p-6 shadow-sm space-y-5 sticky top-24"
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

            {/* Lý do khám bệnh / trị liệu (Đổ tự động từ ca hiện tại) */}
            {appointment && (
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
                <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Khuyến nghị phác đồ trị liệu</h4>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5">Lựa chọn gói liệu trình đề xuất cho khách</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Đề xuất gói liệu trình
                    </label>
                    <select
                      value={goiDichVuId}
                      onChange={(e) => setGoiDichVuId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">-- Không đề xuất gói --</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.ten_goi} ({pkg.gia_goi.toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
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

        {/* RIGHT COLUMN: Patient Info & History (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Patient Card Header - Pro Max */}
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary/5 dark:bg-primary/10 w-24 h-24 rounded-full -mr-6 -mt-6 blur-2xl"></div>

            {/* Đồng hồ đếm ngược tới giờ kết thúc buổi — chỉ hiện khi bàn khám đang mở và chưa quá giờ */}
            {isSessionOpen && remainingMs !== null && !isOverdue && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm ${
                  remainingMs < 5 * 60 * 1000
                    ? 'bg-amber-50 dark:bg-amber-955/15 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                    : 'bg-primary/5 border-primary/15 text-primary'
                }`}
              >
                <Timer size={13} className={remainingMs < 5 * 60 * 1000 ? 'animate-pulse' : ''} />
                <div className="leading-tight">
                  <p className="text-[7px] font-black uppercase tracking-wider opacity-70">Còn lại</p>
                  <p className="text-[11px] font-mono font-black tabular-nums">{formatCountdown(remainingMs)}</p>
                </div>
              </motion.div>
            )}

            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-inner shrink-0 scale-105">
              {(appointment.ten_khach_hang || appointment.ho_ten_khach || 'K').charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 w-full space-y-4 text-center md:text-left">
              <div>
                <h2 className="text-lg font-black text-secondary dark:text-zinc-100 flex items-center justify-center md:justify-start gap-2.5">
                  {appointment.ten_khach_hang || appointment.ho_ten_khach}
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/25">
                    {appointment.loai === 'KHAM' ? 'Khám lâm sàng' : 'Trị liệu'}
                  </span>
                </h2>
                <p className="text-zinc-400 dark:text-zinc-550 text-[10px] font-bold uppercase mt-1">Hồ sơ khách hàng</p>
                {appointment.loai !== 'KHAM' && appointment.ten_dich_vu && (
                  <p className="text-[11px] font-bold text-secondary dark:text-zinc-200 mt-1.5">
                    {appointment.ten_dich_vu}
                    {appointment.phac_do_dieu_tri_id && appointment.so_thu_tu_buoi && (
                      <span className="text-primary"> — Buổi {appointment.so_thu_tu_buoi}{appointment.pd_tong_so_buoi ? `/${appointment.pd_tong_so_buoi}` : ''}</span>
                    )}
                  </p>
                )}
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <User size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Giới tính</p>
                    <p className="text-xs font-bold text-secondary dark:text-zinc-200 capitalize truncate">
                      {appointment.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <Activity size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Tuổi</p>
                    <p className="text-xs font-bold text-secondary dark:text-zinc-200 truncate">
                      {patientAge || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <Phone size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Điện thoại</p>
                    <p className="text-xs font-bold text-secondary dark:text-zinc-200 truncate">
                      {appointment.so_dien_thoai || appointment.sdt_khach_hang || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <CalendarIcon size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Giờ hẹn</p>
                    <p className="text-[10px] font-bold text-secondary dark:text-zinc-200 truncate">
                      {new Date(appointment.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(appointment.ngay_gio_bat_dau).toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'})}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hồ sơ điều trị — 2 cột giống Admin: Phác đồ điều trị (trái) / Khám & Dịch vụ lẻ (phải).
              Dùng chung đúng component với trang "Hồ sơ điều trị" của Bác sĩ/KTV — không còn bản sao
              chép lệch riêng cho bàn khám. Mỗi thẻ chỉ tóm tắt, bấm "Chi tiết" mới mở popup. */}
          <div id="history-panel" className="scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-6">
            <PlanColumn
              plans={profile?.treatmentPlans || []}
              onOpenPlan={(id) => setActiveModal({ type: 'plan', id })}
            />
            <VisitColumn
              visits={profile?.visits || []}
              onOpenVisit={(id) => setActiveModal({ type: 'visit', id })}
            />
          </div>
        </div>

      </div>

      <AnimatePresence>
        {activePlan && (
          <PlanDetailModal
            key={`plan-${activePlan.id}`}
            plan={activePlan}
            onClose={() => setActiveModal(null)}
            onJumpToVisit={(visitId) => setActiveModal({ type: 'visit', id: visitId })}
          />
        )}
        {activeVisit && (
          <VisitDetailModal
            key={`visit-${activeVisit.id}`}
            visit={activeVisit}
            linkedPlan={linkedPlanForActiveVisit}
            onClose={() => setActiveModal(null)}
            onJumpToPlan={(planId) => setActiveModal({ type: 'plan', id: planId })}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

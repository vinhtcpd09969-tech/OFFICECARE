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
  FileSpreadsheet,
  TrendingUp,
  User,
  HeartPulse,
  History,
  ClipboardList,
  ShieldAlert,
  FlameKindling,
  Timer,
  Check,
  X,
  Minus,
  Clock3,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/authStore';
import { resolveImageUrl } from '../../../../utils/imageUrl';
import {
  getAppointmentDetail,
  getPatientProfile,
  getServices,
  getPackages,
  saveAssessment,
  PatientProfile,
  TreatmentPlan,
  ServiceItem,
  PackageItem
} from '../../api/doctor.api';
import {
  getAppointmentDetail as getAppointmentDetailKtv,
  saveTreatmentRecord as saveTreatmentRecordKtv,
  getPatientProfile as getPatientProfileKtv
} from '../../../technician/api/technician.api';

// --- Trạng thái buổi/phác đồ: map trực tiếp enum thật của cuoc_hen.trang_thai /
// phac_do_dieu_tri.trang_thai, không phỏng đoán theo "có tồn tại record hay không" ---
const SESSION_STATUS_META: Record<string, { label: string; ring: string; text: string; dot: string; Icon: typeof Check }> = {
  hoan_thanh: { label: 'Hoàn thành', ring: 'border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', Icon: Check },
  khong_den: { label: 'Không đến', ring: 'border-slate-300 dark:border-zinc-600', text: 'text-slate-400 dark:text-zinc-500', dot: 'bg-slate-400', Icon: Minus },
  khach_khong_den: { label: 'Không đến', ring: 'border-slate-300 dark:border-zinc-600', text: 'text-slate-400 dark:text-zinc-500', dot: 'bg-slate-400', Icon: Minus },
  khach_khong_den_phat: { label: 'Không đến', ring: 'border-slate-300 dark:border-zinc-600', text: 'text-slate-400 dark:text-zinc-500', dot: 'bg-slate-400', Icon: Minus },
  da_huy: { label: 'Đã hủy', ring: 'border-rose-400', text: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500', Icon: X },
  huy: { label: 'Đã hủy', ring: 'border-rose-400', text: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500', Icon: X },
  da_huy_phat: { label: 'Đã hủy', ring: 'border-rose-400', text: 'text-rose-500 dark:text-rose-400', dot: 'bg-rose-500', Icon: X },
};
const DEFAULT_SESSION_STATUS = { label: 'Chưa diễn ra', ring: 'border-dashed border-zinc-300 dark:border-zinc-700', text: 'text-zinc-400 dark:text-zinc-550', dot: 'bg-zinc-300', Icon: Clock3 };
const getSessionStatusMeta = (trangThai: string) => SESSION_STATUS_META[trangThai] || DEFAULT_SESSION_STATUS;

const PLAN_STATUS_META: Record<string, { label: string; badge: string; ring: string }> = {
  huy: { label: 'Đã hủy', badge: 'bg-rose-50 dark:bg-rose-955/15 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40', ring: '#f43f5e' },
  hoan_thanh: { label: 'Hoàn thành', badge: 'bg-emerald-50 dark:bg-emerald-955/15 text-emerald-650 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40', ring: '#10b981' },
  cho_kich_hoat: { label: 'Chờ kích hoạt', badge: 'bg-amber-50 dark:bg-amber-955/15 text-amber-650 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40', ring: '#f59e0b' },
  dang_dieu_tri: { label: 'Đang điều trị', badge: 'bg-primary/10 text-primary border-primary/25', ring: '#2EC4B6' },
};
const getPlanStatusMeta = (trangThai: string) => PLAN_STATUS_META[trangThai] || PLAN_STATUS_META.dang_dieu_tri;

const formatCountdown = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const totalSeconds = Math.floor(abs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/** Vòng tròn tiến độ SVG — dùng cho chip chọn gói/dịch vụ. */
export function ProgressRing({ percent, color, size = 44, strokeWidth = 4, children }: {
  percent: number; color: string; size?: number; strokeWidth?: number; children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-zinc-100 dark:stroke-zinc-800" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/** Avatar nhân sự bọc vòng màu trạng thái + icon nhỏ đè góc — "nhân vật hóa" timeline thay vì badge chữ. */
function StaffAvatar({ name, avatarUrl, size = 40, statusMeta }: {
  name?: string | null; avatarUrl?: string | null; size?: number; statusMeta?: { ring: string; dot: string; Icon: typeof Check };
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`w-full h-full rounded-full border-2 ${statusMeta?.ring || 'border-zinc-200 dark:border-zinc-700'} overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary font-black`}
        style={{ fontSize: size * 0.38 }}
      >
        {avatarUrl ? (
          <img src={resolveImageUrl(avatarUrl)} alt={name || ''} className="w-full h-full object-cover" />
        ) : initial}
      </div>
      {statusMeta && (
        <div className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full ${statusMeta.dot} flex items-center justify-center ring-2 ring-white dark:ring-zinc-900`}>
          <statusMeta.Icon size={9} className="text-white stroke-[3]" />
        </div>
      )}
    </div>
  );
}

/**
 * Nội dung 1 buổi trị liệu: dòng trạng thái + (nếu hoàn thành) khối VAS/cảnh báo/ghi chú xổ ra được.
 * `large`: dùng cho dịch vụ lẻ (luôn 1 buổi) — avatar lớn, căn giữa, luôn mở sẵn, bỏ nhãn "Buổi N".
 */
export function SessionDetailBlock({ session, large = false, expandedSessionId, setExpandedSessionId }: {
  session: any;
  large?: boolean;
  expandedSessionId: string | null;
  setExpandedSessionId: (id: string | null) => void;
}) {
  if (!session) {
    return <p className="text-xs text-zinc-400 font-semibold text-center py-6">Chưa có dữ liệu buổi.</p>;
  }
  const statusMeta = getSessionStatusMeta(session.trang_thai);
  const isFinished = session.trang_thai === 'hoan_thanh';
  const isNoShow = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(session.trang_thai);
  const isCancelled = ['da_huy', 'huy', 'da_huy_phat'].includes(session.trang_thai);
  const isExpanded = isFinished && expandedSessionId === session.id;

  // Dịch vụ lẻ ("large"): header của khối cha (sân khấu chi tiết) đã tự làm nút bấm ẩn/hiện rồi —
  // ở đây không tự vẽ avatar/tên/trạng thái nữa khi đang ẩn (từng bị phản hồi là lặp lại thông tin
  // với header), chỉ hiện 1 dòng tóm tắt cho buổi chưa hoàn thành, hoặc nội dung đầy đủ khi đã mở.
  if (large) {
    if (!isFinished) {
      return (
        <div className="text-center py-1">
          {isNoShow && <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-550">Khách không đến buổi này.</p>}
          {isCancelled && <p className="text-[10px] font-semibold text-rose-500">Buổi đã bị hủy.</p>}
        </div>
      );
    }
    if (!isExpanded) return null;
  }

  const canToggle = isFinished && !large;

  return (
    <div className={large ? 'flex flex-col items-center text-center gap-2.5' : ''}>
      {large ? (
        <>
          <StaffAvatar name={session.ten_ky_thuat_vien} avatarUrl={session.anh_ky_thuat_vien} size={56} statusMeta={statusMeta} />
          <span className="min-w-0 font-extrabold text-sm text-secondary dark:text-zinc-300">
            <span className="text-primary">{session.ten_ky_thuat_vien || 'Chưa phân công'}</span>
          </span>
        </>
      ) : (
        <button
          type="button"
          disabled={!canToggle}
          onClick={() => canToggle && setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
          className={`flex items-center gap-2.5 w-full justify-between ${canToggle ? 'cursor-pointer group' : 'cursor-default'}`}
        >
          <span className="min-w-0 font-extrabold text-[10px] flex-1 text-left text-secondary dark:text-zinc-300">
            {`Buổi ${session.so_thu_tu_buoi} • `}
            <span className="text-primary">{session.ten_ky_thuat_vien || 'Chưa phân công'}</span>
          </span>
          <span className={`shrink-0 flex items-center gap-1 text-[9px] font-black uppercase ${statusMeta.text}`}>
            {statusMeta.label}
            {canToggle && <ChevronDown size={11} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
          </span>
        </button>
      )}

      {!large && isNoShow && <p className="text-[9px] font-semibold text-slate-400 dark:text-zinc-550 mt-1">Khách không đến buổi này.</p>}
      {!large && isCancelled && <p className="text-[9px] font-semibold text-rose-500 mt-1">Buổi đã bị hủy.</p>}

      {isFinished && isExpanded && (
        <div className={`${large ? 'w-full' : 'mt-3'} grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-50/50 dark:bg-zinc-855/15 p-4 rounded-xl border border-zinc-150/50 dark:border-zinc-800/80 text-[10px]`}>
          <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase text-[8px] tracking-wider block">VAS Trước trị liệu</span>
            <p className="font-extrabold text-secondary dark:text-zinc-200 mt-1 flex items-center gap-1.5">
              <FlameKindling size={12} className="text-amber-500" />
              Mức {session.danh_gia_truoc_buoi || 'N/A'}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
            <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase text-[8px] tracking-wider block">VAS Sau trị liệu</span>
            <p className="font-extrabold text-secondary dark:text-zinc-200 mt-1 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-emerald-500" />
              Mức {session.danh_gia_sau_buoi || 'N/A'}
            </p>
          </div>
          {session.canh_bao_dac_biet && (
            <div className="md:col-span-2 bg-rose-50/50 dark:bg-rose-955/15 text-rose-500 font-bold p-2.5 rounded-lg border border-rose-100/50 flex items-center gap-2 text-[10px]">
              <AlertTriangle size={14} />
              Cảnh báo: {session.canh_bao_dac_biet}
            </div>
          )}
          {session.ai_tom_tat_ngan && (
            <div className="md:col-span-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-2 flex items-center gap-1.5 text-[9px] text-primary font-bold">
              <TrendingUp size={12} /> Tiến trình: {session.ai_tom_tat_ngan}
            </div>
          )}
          {session.danh_gia_hieu_qua && (
            <div className="md:col-span-2 border-t border-zinc-150/40 dark:border-zinc-800/50 pt-2.5">
              <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase text-[8px] tracking-wider">Diễn tiến / Ghi chú trị liệu</span>
              <p className="font-semibold text-zinc-650 dark:text-zinc-355 mt-1 italic leading-relaxed">
                "{session.danh_gia_hieu_qua}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);

  // Form State
  const [chanDoan, setChanDoan] = useState('');
  const [chongChiDinh, setChongChiDinh] = useState('');
  const [goiDichVuId, setGoiDichVuId] = useState<string>('');
  const [dichVuId, setDichVuId] = useState<string>('');
  const [ghiChu, setGhiChu] = useState('');

  // VAS states for KTV
  const [vasTruoc, setVasTruoc] = useState<number>(5);
  const [vasSau, setVasSau] = useState<number>(0);

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'treatments'>('history');
  const [errorMsg, setErrorMsg] = useState('');

  // Gói/dịch vụ đang chọn trong dải chip "Tiến trình trị liệu"
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  // Buổi đang xổ chi tiết (chỉ áp dụng cho buổi hoàn thành, có VAS/ghi chú để xem)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

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
      if (apptData.dich_vu_id) setDichVuId(apptData.dich_vu_id);
      if (apptData.ghi_chu) setGhiChu(apptData.ghi_chu);
      if (apptData.vas_truoc !== undefined && apptData.vas_truoc !== null) setVasTruoc(apptData.vas_truoc);
      if (apptData.vas_sau !== undefined && apptData.vas_sau !== null) setVasSau(apptData.vas_sau);

      // 2. Tải danh mục dịch vụ và gói để làm đề xuất (chỉ bác sĩ)
      if (!isKtv) {
        const [servicesRes, packagesRes] = await Promise.all([
          getServices(),
          getPackages()
        ]);
        setServices(servicesRes.data);
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

  // Mặc định chọn gói/dịch vụ gần nhất (backend đã ORDER BY ngay_kich_hoat DESC) khi hồ sơ tải xong
  useEffect(() => {
    if (profile?.treatmentPlans?.length && !selectedPlanId) {
      setSelectedPlanId(profile.treatmentPlans[0].id);
    }
  }, [profile, selectedPlanId]);

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
          dich_vu_id: dichVuId || null,
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
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate(isKtv ? '/technician/appointments' : '/doctor')}
          className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-all shadow-sm hover:scale-105"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-2">
            {isKtv ? 'Bàn Trị Liệu & Lượng Giá KTV' : 'Khám Lâm Sàng & Lượng Giá'}
          </h1>
          <p className="text-zinc-400 dark:text-zinc-550 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
            Mã ca khám: <span className="font-mono text-primary font-extrabold">{appointment.ma_lich_dat}</span>
          </p>
        </div>

        {/* Đồng hồ đếm ngược tới giờ kết thúc buổi — chỉ hiện khi bàn khám đang mở và chưa quá giờ */}
        {isSessionOpen && remainingMs !== null && !isOverdue && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border shadow-sm ${
              remainingMs < 5 * 60 * 1000
                ? 'bg-amber-50 dark:bg-amber-955/15 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                : 'bg-primary/5 border-primary/15 text-primary'
            }`}
          >
            <Timer size={15} className={remainingMs < 5 * 60 * 1000 ? 'animate-pulse' : ''} />
            <div className="leading-tight">
              <p className="text-[8px] font-black uppercase tracking-wider opacity-70">Còn lại</p>
              <p className="text-xs font-mono font-black tabular-nums">{formatCountdown(remainingMs)}</p>
            </div>
          </motion.div>
        )}
      </div>

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
              setActiveTab('treatments');
              document.getElementById('history-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
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

                {/* Đề xuất dịch vụ điều trị */}
                <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Khuyến nghị phác đồ trị liệu</h4>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5">Lựa chọn gói phục hồi hoặc dịch vụ lẻ đề xuất cho khách</p>
                  </div>

                  {/* Gói đề xuất */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Đề xuất gói điều trị (Ưu tiên)
                    </label>
                    <select
                      value={goiDichVuId}
                      onChange={(e) => {
                        setGoiDichVuId(e.target.value);
                        if (e.target.value) setDichVuId(''); // Nếu chọn gói thì xóa chọn dịch vụ lẻ
                      }}
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

                  {/* Dịch vụ lẻ đề xuất */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Hoặc đề xuất dịch vụ lẻ (Sử dụng 1 buổi)
                    </label>
                    <select
                      value={dichVuId}
                      onChange={(e) => {
                        setDichVuId(e.target.value);
                        if (e.target.value) setGoiDichVuId(''); // Nếu chọn dịch vụ thì xóa chọn gói
                      }}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">-- Không đề xuất dịch vụ lẻ --</option>
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.ten_dich_vu} ({svc.gia_hien_tai.toLocaleString('vi-VN')}đ)
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

          {/* Medical Records Navigation Tabs - sliding Pill Style */}
          <div id="history-panel" className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col scroll-mt-24">
            <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-t-[24px] flex gap-1 border-b border-zinc-200/50 dark:border-zinc-800/80">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20 dark:border-zinc-800/40 scale-102'
                    : 'text-zinc-400 dark:text-zinc-555 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <History size={14} />
                Lịch sử chẩn đoán ({profile?.medicalRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('treatments')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'treatments'
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20 dark:border-zinc-800/40 scale-102'
                    : 'text-zinc-400 dark:text-zinc-555 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <FileSpreadsheet size={14} />
                Tiến trình trị liệu ({profile?.treatmentPlans?.length || 0})
              </button>
            </div>

            <div className="p-6 min-h-[300px]">
              
              {/* Tab 2: Lịch sử chẩn đoán trước đó */}
              {activeTab === 'history' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {!profile || profile.medicalRecords.length === 0 ? (
                    <div className="text-center py-16 text-zinc-450 dark:text-zinc-550 flex flex-col items-center justify-center gap-3">
                      <FileText size={32} className="text-zinc-300" />
                      <p className="text-xs font-extrabold uppercase tracking-wide">Chưa có lịch sử hồ sơ lâm sàng</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-dashed border-zinc-200 dark:border-zinc-800/80 pl-8 space-y-6 ml-4 text-left">
                      {profile.medicalRecords.map((record, idx) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 26 }}
                          className="relative group"
                        >
                          {/* Node: avatar bác sĩ thay cho chấm tròn thuần túy */}
                          <div className="absolute -left-[43px] top-0">
                            <StaffAvatar name={record.ten_bac_si} avatarUrl={record.anh_bac_si} size={32} />
                          </div>

                          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 group-hover:border-primary/30 rounded-2xl p-5 shadow-sm group-hover:shadow transition-all duration-300 space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <HeartPulse size={12} className="text-primary" />
                                BS: <span className="text-secondary dark:text-zinc-200">{record.ten_bac_si}</span>
                              </span>
                              <span className="font-mono">{new Date(record.thoi_gian_tao).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div>
                              <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">Chẩn đoán</p>
                              <p className="text-xs font-extrabold text-secondary dark:text-zinc-150 mt-0.5 leading-relaxed">{record.chan_doan}</p>
                            </div>

                            {record.chong_chi_dinh && (
                              <div className="bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100/50 dark:border-rose-900/30 px-4 py-2.5 rounded-xl flex items-start gap-2.5">
                                <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[8px] text-rose-550 font-black uppercase tracking-widest">Chống chỉ định</p>
                                  <p className="text-xs font-bold text-rose-600 dark:text-rose-455 mt-0.5 leading-relaxed">{record.chong_chi_dinh}</p>
                                </div>
                              </div>
                            )}

                            {(record.khuyen_nghi_dich_vu || record.khuyen_nghi_goi) && (
                              <div className="flex gap-2 flex-wrap border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
                                {record.khuyen_nghi_dich_vu && (
                                  <span className="text-[8px] font-black bg-primary/10 text-primary border border-primary/25 px-2.5 py-1 rounded uppercase tracking-wider">
                                    Đề xuất: {record.khuyen_nghi_dich_vu}
                                  </span>
                                )}
                                {record.khuyen_nghi_goi && (
                                  <span className="text-[8px] font-black bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-150/30 px-2.5 py-1 rounded uppercase tracking-wider">
                                    Gói đề xuất: {record.khuyen_nghi_goi}
                                  </span>
                                )}
                              </div>
                            )}

                            {record.ghi_chu && (
                              <div className="text-[10px] text-zinc-550 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-850/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60 leading-relaxed italic">
                                Dặn dò: "{record.ghi_chu}"
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Tiến trình trị liệu — dải chip chọn gói/dịch vụ (master) + sân khấu chi tiết */}
              {activeTab === 'treatments' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {!profile || profile.treatmentPlans.length === 0 ? (
                    <div className="text-center py-16 text-zinc-450 dark:text-zinc-555 flex flex-col items-center justify-center gap-3">
                      <FileSpreadsheet size={32} className="text-zinc-300" />
                      <p className="text-xs font-extrabold uppercase tracking-wide">Chưa có lịch sử trị liệu</p>
                    </div>
                  ) : (
                    <>
                      {/* Dải chip chọn gói/dịch vụ — gọn dù khách có bao nhiêu gói. Chỉ 1 mục duy
                          nhất thì ẩn hẳn (không có gì để chọn, chỉ dư thừa với header sân khấu bên
                          dưới), đi thẳng vào sân khấu chi tiết. */}
                      {profile.treatmentPlans.length > 1 && (
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                        {profile.treatmentPlans.map((plan) => {
                          const meta = getPlanStatusMeta(plan.trang_thai);
                          const isSelected = selectedPlanId === plan.id;
                          const percent = plan.tong_so_buoi > 0 ? (plan.so_buoi_da_dung / plan.tong_so_buoi) * 100 : 0;
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => { setSelectedPlanId(plan.id); setExpandedSessionId(null); }}
                              className={`relative shrink-0 w-[172px] text-left rounded-2xl border p-3.5 transition-colors overflow-hidden ${
                                isSelected
                                  ? 'border-primary/40'
                                  : 'border-zinc-150/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-250 dark:hover:border-zinc-700'
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="planChipActive"
                                  className="absolute inset-0 bg-primary/5"
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                              )}
                              <div className="relative flex items-center gap-2.5">
                                {plan.loai_dieu_tri === 'goi' ? (
                                  <ProgressRing percent={percent} color={meta.ring} size={38} strokeWidth={3.5}>
                                    <span className="text-[9px] font-black" style={{ color: meta.ring }}>
                                      {plan.so_buoi_da_dung}/{plan.tong_so_buoi}
                                    </span>
                                  </ProgressRing>
                                ) : (
                                  <div className="size-[38px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.ring}1A` }}>
                                    <FileText size={16} style={{ color: meta.ring }} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                                    {plan.loai_dieu_tri === 'goi' ? 'Liệu trình' : 'Dịch vụ lẻ'}
                                  </p>
                                  <p className="text-[11px] font-black text-secondary dark:text-zinc-150 truncate leading-tight mt-0.5">
                                    {plan.ten_goi || plan.ten_dich_vu}
                                  </p>
                                </div>
                              </div>
                              <span className={`relative mt-2.5 inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded border ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      )}

                      {/* Sân khấu chi tiết — chỉ hiện đúng 1 gói/dịch vụ đang chọn */}
                      <AnimatePresence mode="wait">
                        {(() => {
                          const plan: TreatmentPlan | undefined = profile.treatmentPlans.find((p) => p.id === selectedPlanId);
                          if (!plan) return null;
                          const planMeta = getPlanStatusMeta(plan.trang_thai);
                          const isSingle = plan.loai_dieu_tri === 'dich_vu';
                          const singleSession = isSingle ? plan.sessions[0] : null;
                          const singleCanExpand = !!singleSession && singleSession.trang_thai === 'hoan_thanh';
                          const singleIsExpanded = singleCanExpand && expandedSessionId === singleSession!.id;
                          // Dịch vụ lẻ hoàn thành nhưng đang ẩn: không có gì để vẽ (SessionDetailBlock
                          // trả về null) — bỏ luôn khung "p-4" bọc ngoài để không dư 1 khoảng trắng
                          // rỗng dưới header, giữ đúng cảm giác gọn như lúc chỉ có mỗi header.
                          const hideContentBlock = isSingle && singleCanExpand && !singleIsExpanded;
                          return (
                            <motion.div
                              key={plan.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              className="border border-zinc-150/60 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
                            >
                              <div
                                className={`bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-150/60 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2.5 ${singleCanExpand ? 'cursor-pointer select-none hover:bg-zinc-100/70 dark:hover:bg-zinc-900/80 transition-colors' : ''}`}
                                onClick={() => {
                                  if (!singleCanExpand || !singleSession) return;
                                  setExpandedSessionId(expandedSessionId === singleSession.id ? null : singleSession.id);
                                }}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] font-bold text-zinc-450 dark:text-zinc-500 tracking-wider">
                                      {plan.ma_lich_dieu_tri}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${planMeta.badge}`}>
                                      {planMeta.label}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-black text-secondary dark:text-zinc-150 mt-1.5">
                                    {plan.ten_goi || plan.ten_dich_vu}
                                  </h5>
                                </div>
                                {!isSingle && (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                    Tiến độ: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi
                                  </span>
                                )}
                                {singleCanExpand && (
                                  <ChevronDown size={16} className={`text-zinc-400 shrink-0 transition-transform ${singleIsExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </div>

                              {plan.trang_thai === 'huy' && (
                                <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-50/70 dark:bg-rose-955/10 border-b border-rose-100 dark:border-rose-900/30">
                                  <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                    Phác đồ đã bị hủy — các buổi sau đó không còn hiệu lực.
                                  </p>
                                </div>
                              )}

                              {!hideContentBlock && (
                              <div className="p-4">
                                {isSingle ? (
                                  <SessionDetailBlock
                                    session={plan.sessions[0]}
                                    large
                                    expandedSessionId={expandedSessionId}
                                    setExpandedSessionId={setExpandedSessionId}
                                  />
                                ) : (
                                  <div className="max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
                                    {plan.sessions.map((session, sIdx) => {
                                      const statusMeta = getSessionStatusMeta(session.trang_thai);
                                      const isLast = sIdx === plan.sessions.length - 1;
                                      return (
                                        <motion.div
                                          key={session.id}
                                          initial={{ opacity: 0, x: -8 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: sIdx * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
                                          className="flex gap-3"
                                        >
                                          <div className="flex flex-col items-center">
                                            <StaffAvatar name={session.ten_ky_thuat_vien} avatarUrl={session.anh_ky_thuat_vien} size={38} statusMeta={statusMeta} />
                                            {!isLast && (
                                              <div className={`w-0.5 flex-1 my-1 min-h-[16px] ${session.trang_thai === 'hoan_thanh' ? 'bg-emerald-300' : 'bg-zinc-150 dark:bg-zinc-800'}`} />
                                            )}
                                          </div>
                                          <div className="flex-1 pb-4 min-w-0">
                                            <SessionDetailBlock
                                              session={session}
                                              expandedSessionId={expandedSessionId}
                                              setExpandedSessionId={setExpandedSessionId}
                                            />
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              )}
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

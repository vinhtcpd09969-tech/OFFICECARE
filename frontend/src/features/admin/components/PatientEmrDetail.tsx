import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft, FileText, Stethoscope,
  AlertTriangle, ChevronDown, ChevronUp, Calendar, MapPin, Clock, ImageIcon, MessageSquareText, X,
  HeartPulse, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { getMinPaymentRequired, isPlanCancelled, isPlanExpired } from '../../../utils/billing';
import { formatCountdown } from '../../../utils/format';
import { getStaffRoleTitle } from '../../../utils/staff';
import { TreatmentSessionDetailBody } from '../../../components/TreatmentSessionDetailBody';
import type { EmrHighlightTarget } from './customers/hooks/useCustomerEmr';

interface PatientEmrDetailProps {
  patient: any;
  onBack: () => void;
  showAdminInfo?: boolean;
  // Đích cần cuộn tới + nhấp nháy khi mở hồ sơ từ 1 dòng cụ thể ở tab "Hồ sơ điều trị" (khớp id
  // card phác đồ/ca khám bên dưới) — undefined khi mở qua nút "Xem hồ sơ" ở tab khách hàng.
  highlightTarget?: EmrHighlightTarget | null;
}

// Badge trạng thái phác đồ — trước đây chỉ phân biệt dang_dieu_tri/cho_kich_hoat, MỌI trạng thái
// khác (kể cả 'huy') đều rơi vào nhánh else và bị gán nhãn "Hoàn thành", khiến liệu trình đã hủy
// hiện sai thành đã hoàn thành trong hồ sơ khách hàng. Tách rõ 4 trạng thái thật.
const PLAN_STATUS_BADGE: Record<string, { className: string; label: string }> = {
  dang_dieu_tri: { className: 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs font-black', label: 'Đang điều trị' },
  cho_kich_hoat: { className: 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs font-black', label: 'Chờ kích hoạt' },
  hoan_thanh: { className: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs font-black', label: 'Hoàn thành' },
  huy: { className: 'bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs font-black', label: 'Đã hủy' }
};
const getPlanStatusBadge = (trangThai: string) => PLAN_STATUS_BADGE[trangThai] || PLAN_STATUS_BADGE.hoan_thanh;

export default function PatientEmrDetail({ patient, onBack, showAdminInfo = true, highlightTarget }: PatientEmrDetailProps) {
  // "Phác đồ điều trị" và "Khám & Dịch vụ lẻ" hiện đồng thời thành 2 bảng cạnh nhau — bấm "Chi tiết"
  // trên 1 dòng mở popup hiển thị đầy đủ nội dung (thay vì accordion nội tuyến kéo dài cả trang).
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  // Cuộn tới + nhấp nháy đúng card vừa bấm vào từ tab "Hồ sơ điều trị" (id card = `${type}-card-${id}`
  // gắn bên dưới) — cho người dùng biết rõ mình vừa chuyển từ dòng nào sang.
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  useEffect(() => {
    if (!highlightTarget || !patient) return;
    const el = document.getElementById(`${highlightTarget.type}-card-${highlightTarget.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActiveHighlightId(highlightTarget.id);
    const timer = setTimeout(() => setActiveHighlightId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightTarget, patient]);

  const selectedPlan = useMemo(() => {
    return patient?.plans?.find((p: any) => p.id === expandedPlanId);
  }, [patient, expandedPlanId]);

  const selectedPlanSessions = useMemo(() => {
    const isPrepaidPackage = selectedPlan?.hinh_thuc_thanh_toan_goi === 'tra_thang';
    const raw = patient?.appointments?.filter(
      (ap: any) => ap.phac_do_dieu_tri_id === expandedPlanId
    ) || [];
    // Buổi "không đến" của gói trả từng buổi (Nhóm A) không mất buổi — coi slot như chưa từng
    // đặt để cho đặt lại đúng buổi đó. Gói đã trả trước (Nhóm B) thì buổi không đến vẫn bị tính
    // tiêu thụ nên giữ lại để khóa slot (resolveNoShowOutcome, docs/BUSINESS_RULES.md).
    return raw.filter((ap: any) => {
      const isNoShow = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(ap.trang_thai);
      return !isNoShow || isPrepaidPackage;
    });
  }, [patient, expandedPlanId, selectedPlan]);

  // Find the exact next unscheduled session number
  const firstEmptySessionNum = useMemo(() => {
    if (!selectedPlan) return 1;
    for (let i = 1; i <= selectedPlan.tong_so_buoi; i++) {
      const apptExists = selectedPlanSessions.some((ap: any) =>
        ap.so_thu_tu_buoi === i && ap.loai !== 'KHAM'
      );
      if (!apptExists) {
        return i;
      }
    }
    return selectedPlan.tong_so_buoi + 1;
  }, [selectedPlan, selectedPlanSessions]);

  // Selected appointment details (chi tiết ca khám/dịch vụ lẻ đang mở trong popup)
  const selectedApt = useMemo(() => {
    return patient?.appointments?.find((ap: any) => ap.id === expandedAptId);
  }, [patient, expandedAptId]);

  const prescribedPlan = useMemo(() => {
    return selectedApt
      ? patient?.plans?.find((p: any) => p.cuoc_hen_id === selectedApt.id)
      : null;
  }, [patient, selectedApt]);

  const bookedApt = useMemo(() => {
    if (!prescribedPlan) return null;
    return patient?.appointments?.find((ap: any) =>
      String(ap.goi_dich_vu_id) === String(prescribedPlan.goi_dich_vu_id) &&
      ap.loai !== 'KHAM' &&
      ap.trang_thai !== 'da_huy'
    );
  }, [patient, prescribedPlan]);

  // Ghim banner nhắc nhở (patient.reminder, backend tính) đúng vào card liệu trình mà nó nói tới,
  // thay vì hiện thành 1 banner riêng đầu trang — khớp loại reminder với đúng trạng thái phác đồ.
  const reminderTargetPlanId = useMemo(() => {
    if (!patient?.reminder) return null;
    const plans = patient?.plans || [];
    if (patient.reminder.type === 'in_treatment') {
      return plans.find((p: any) => p.trang_thai === 'dang_dieu_tri')?.id || null;
    }
    if (patient.reminder.type === 'pending_activation') {
      return plans.find((p: any) => String(p.id).startsWith('virtual-'))?.id || null;
    }
    return null;
  }, [patient]);

  const realPlans = patient?.plans?.filter((pl: any) => !pl.id.startsWith('virtual-')) || [];
  const historyItems = patient?.appointments?.filter(
    (ap: any) => !ap.phac_do_dieu_tri_id || ap.loai === 'KHAM'
  ) || [];
  const STATUS_META: Record<string, { label: string; cls: string }> = {
    hoan_thanh: { label: 'Đã hoàn thành', cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-extrabold' },
    da_xac_nhan: { label: 'Đã đặt lịch', cls: 'bg-amber-50 text-amber-800 border border-amber-200/60 font-extrabold' },
    da_checkin: { label: 'Đang khám', cls: 'bg-sky-50 text-sky-800 border border-sky-200/60 font-extrabold' },
    cho_tai_luong_gia: { label: 'Chờ tái lượng giá', cls: 'bg-amber-50 text-amber-800 border border-amber-200/60 font-extrabold' },
    khong_den: { label: 'Không đến', cls: 'bg-rose-50 text-rose-800 border border-rose-200/60 font-extrabold' },
    khach_khong_den: { label: 'Không đến', cls: 'bg-rose-50 text-rose-800 border border-rose-200/60 font-extrabold' },
    khach_khong_den_phat: { label: 'Không đến', cls: 'bg-rose-50 text-rose-800 border border-rose-200/60 font-extrabold' }
  };
  const PAY_META: Record<string, { label: string; cls: string }> = {
    da_thanh_toan: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-extrabold' },
    chua_thanh_toan: { label: 'Chưa thanh toán', cls: 'bg-amber-50 text-amber-800 border border-amber-200/60 font-extrabold' }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Patient Header Soft Light */}
      <div className="bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/40 border border-slate-200/80 rounded-3xl p-5 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white hover:bg-teal-50 hover:text-[#0D9488] border border-slate-200/80 rounded-2xl text-slate-600 transition-all shadow-2xs active:scale-95 shrink-0 cursor-pointer"
            title="Quay lại danh sách"
          >
            <ChevronLeft size={18} className="stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-black text-slate-900 tracking-tight">{patient?.ho_ten}</h3>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Bệnh nhân điều trị tích hợp
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                <span className="font-extrabold font-mono text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                  {'KH-' + patient?.id?.substring(0, 8).toUpperCase()}
                </span>
                <span>• {patient?.so_dien_thoai}</span>
                {patient?.email && <span className="text-slate-400">• {patient.email}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={showAdminInfo ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "w-full"}>
        {/* Left Column: Patient Profile Summary ProMax */}
        {showAdminInfo && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center font-black text-xl uppercase shadow-md shadow-teal-500/15 shrink-0">
                  {patient?.ho_ten?.charAt(0) || 'K'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">{patient?.ho_ten}</h4>
                  <span className="text-[10px] text-teal-800 font-black font-mono bg-teal-50 border border-teal-200/50 px-2 py-0.5 rounded-md inline-block mt-1.5">
                    {'KH-' + patient?.id?.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Số điện thoại:</span>
                  <strong className="text-slate-800 font-bold font-mono">{patient?.so_dien_thoai}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <strong className="text-slate-800 font-bold truncate max-w-[160px]">{patient?.email || 'Chưa cung cấp'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Điểm uy tín:</span>
                  <strong className="text-teal-600 font-extrabold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">{patient?.diem_uy_tin || 0}đ</strong>
                </div>
              </div>
            </div>

            {/* Quick statistics ProMax */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={15} className="text-teal-600" /> Thống kê hồ sơ
              </h4>
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/30 border border-teal-100/80 p-3.5 rounded-2xl text-center shadow-2xs">
                  <span className="text-2xl font-black text-[#0D9488] block">{realPlans.length}</span>
                  <span className="text-[9px] font-black text-teal-800 uppercase tracking-wider block mt-0.5">Gói liệu trình</span>
                </div>
                <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/30 border border-indigo-100/80 p-3.5 rounded-2xl text-center shadow-2xs">
                  <span className="text-2xl font-black text-indigo-600 block">
                    {patient?.appointments?.filter((ap: any) => ap.trang_thai === 'hoan_thanh').length || 0}
                  </span>
                  <span className="text-[9px] font-black text-indigo-800 uppercase tracking-wider block mt-0.5">Buổi hoàn thành</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right/Main: 2 bảng luôn hiện song song — Gói liệu trình & Gói khám/Dịch vụ đơn lẻ */}
        <div className={showAdminInfo ? "lg:col-span-2" : "w-full"}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ===== BẢNG TRÁI: Gói liệu trình ===== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-zinc-800 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/60 dark:border-zinc-700 w-fit">
                <HeartPulse size={15} className="text-[#0D9488]" />
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  Gói liệu trình ({realPlans.length})
                </h4>
              </div>

              {realPlans.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl py-12 text-center text-slate-400 dark:text-zinc-500 font-semibold text-xs shadow-xs">
                  Bệnh nhân chưa có gói liệu trình nào.
                </div>
              ) : (
                realPlans.map((pl: any) => {
                  const progressPercent = Math.min(100, Math.round(((pl.so_buoi_da_dung || 0) / (pl.tong_so_buoi || 10)) * 100));
                  const showReminder = reminderTargetPlanId === pl.id && patient?.reminder;
                  const isHighlighted = activeHighlightId === pl.id;
                  return (
                    <div
                      key={pl.id}
                      id={`plan-card-${pl.id}`}
                      className={`bg-white dark:bg-zinc-900 border rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden ${
                        isHighlighted ? 'animate-highlight-once ring-2 ring-teal-400 ring-offset-2 border-teal-300' : 'border-slate-200/80 dark:border-zinc-800 hover:border-teal-500/40'
                      }`}
                    >
                      <div className="p-5 space-y-4">
                        {showReminder && (
                          <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/60 dark:to-amber-900/40 border border-amber-300/60 dark:border-amber-800/60 rounded-2xl px-3.5 py-2.5 shadow-2xs">
                            <Clock size={15} className="text-amber-600 dark:text-amber-400 stroke-[2.5] shrink-0 mt-0.5 animate-pulse" />
                            <p className="text-[11px] font-black text-amber-900 dark:text-amber-200 leading-relaxed">{patient.reminder.message}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getPlanStatusBadge(pl.trang_thai).className}`}>
                                {getPlanStatusBadge(pl.trang_thai).label}
                              </span>
                              {pl.hinh_thuc_thanh_toan_goi && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-700">
                                  {pl.hinh_thuc_thanh_toan_goi === 'tung_buoi' ? 'Trả từng buổi' : 'Trả thẳng'}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2 flex-wrap">
                              {pl.ten_goi} ({pl.tong_so_buoi} buổi)
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-1.5 flex items-center gap-1 flex-wrap">
                              Bác sĩ: <strong className="text-slate-700 dark:text-zinc-200">{pl.ten_bac_si || 'N/A'}</strong> • Ngày kích hoạt: {pl.ngay_kich_hoat ? format(new Date(pl.ngay_kich_hoat), 'dd/MM/yyyy') : 'N/A'}
                            </p>
                            {pl.han_su_dung && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                                Hạn sử dụng: <strong className="text-slate-700 dark:text-zinc-200 font-bold">{format(new Date(pl.han_su_dung), 'dd/MM/yyyy')}</strong>
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedPlanId(pl.id)}
                            className="px-3.5 py-1.5 bg-slate-900 dark:bg-zinc-800 hover:bg-[#0D9488] dark:hover:bg-teal-600 text-white rounded-xl font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 border border-slate-800 dark:border-zinc-700"
                          >
                            Chi tiết
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        {/* Progress bar ProMax */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[11px] font-extrabold text-slate-600 dark:text-zinc-300">
                            <span>Tiến độ liệu trình: {pl.so_buoi_da_dung}/{pl.tong_so_buoi} buổi</span>
                            <span className="text-[#0D9488] dark:text-teal-400 font-black">{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-zinc-700">
                            <div className="bg-gradient-to-r from-[#0D9488] to-emerald-400 h-full rounded-full transition-all duration-500 shadow-2xs" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ===== BẢNG PHẢI: Gói khám & Dịch vụ đơn lẻ ===== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-zinc-800 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/60 dark:border-zinc-700 w-fit">
                <Stethoscope size={15} className="text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  Gói khám và gói dịch vụ đơn lẻ ({historyItems.length})
                </h4>
              </div>

              {historyItems.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl py-12 text-center text-slate-400 dark:text-zinc-500 font-semibold text-xs shadow-xs">
                  Bệnh nhân chưa có lịch sử gói khám hoặc gói dịch vụ đơn lẻ nào.
                </div>
              ) : (
                historyItems.map((ap: any) => {
                  const statusMeta = STATUS_META[ap.trang_thai] || { label: ap.trang_thai, cls: 'bg-slate-100 text-slate-600' };
                  const payMeta = ap.trang_thai_thanh_toan ? PAY_META[ap.trang_thai_thanh_toan] : null;
                  const isHighlighted = activeHighlightId === ap.id;
                  return (
                    <div
                      key={ap.id}
                      id={`visit-card-${ap.id}`}
                      className={`bg-white dark:bg-zinc-900 border rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden ${
                        isHighlighted ? 'animate-highlight-once ring-2 ring-teal-400 ring-offset-2 border-teal-300' : 'border-slate-200/80 dark:border-zinc-800 hover:border-indigo-500/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedAptId(ap.id)}
                        className="w-full p-5 flex justify-between items-center gap-4 text-left cursor-pointer select-none hover:bg-slate-50/40 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${ap.loai === 'KHAM' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800' : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800'
                              }`}>
                              {ap.loai === 'KHAM' ? 'Khám lâm sàng' : 'Dịch vụ lẻ'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${statusMeta.cls}`}>
                              {statusMeta.label}
                            </span>
                            {payMeta && (
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${payMeta.cls}`}>
                                {payMeta.label}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 leading-snug">{ap.ten_dich_vu || (ap.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu dịch vụ lẻ')}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                            {format(new Date(ap.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • Thực hiện: <strong className="text-slate-700 dark:text-zinc-200">{ap.ten_nhan_su || 'Chưa phân công'}</strong>
                          </p>
                        </div>
                        <span className="px-3.5 py-1.5 bg-slate-900 dark:bg-zinc-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 border border-slate-800 dark:border-zinc-700">
                          Chi tiết
                          <ChevronDown size={12} />
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ===== POPUP: Chi tiết phác đồ điều trị ===== */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center py-4 pr-4 pl-64">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedPlanId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="relative w-full max-w-3xl max-h-[85vh] bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-start gap-4 p-5 border-b border-slate-100 shrink-0">
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getPlanStatusBadge(selectedPlan.trang_thai).className}`}>
                    {getPlanStatusBadge(selectedPlan.trang_thai).label}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">{selectedPlan.ten_goi}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Bác sĩ: {selectedPlan.ten_bac_si || 'N/A'} • Ngày kích hoạt: {selectedPlan.ngay_kich_hoat ? format(new Date(selectedPlan.ngay_kich_hoat), 'dd/MM/yyyy') : 'N/A'}
                    {selectedPlan.han_su_dung && <> • Hạn sử dụng: <strong className="text-slate-600">{format(new Date(selectedPlan.han_su_dung), 'dd/MM/yyyy')}</strong></>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedPlanId(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all shrink-0"
                >
                  <X size={16} className="stroke-[2.5]" />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto">
                {selectedPlan.trang_thai === 'cho_kich_hoat' && selectedPlan.loai_goi !== 'LE' && (
                  <button
                    type="button"
                    onClick={() => {
                      const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                      if (selectedPlan.cuoc_hen_id) {
                        window.location.href = `${basePath}/quick-billing?lich_dat_id=${selectedPlan.cuoc_hen_id}`;
                      } else {
                        window.location.href = `${basePath}/quick-billing?customer_id=${patient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}&lich_dieu_tri_id=${selectedPlan.id}`;
                      }
                    }}
                    className="px-3 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span>💵 Thanh toán & Kích hoạt</span>
                  </button>
                )}

                {/* Chuyên gia chỉ định & thời gian khám gốc — cùng dữ liệu hiển thị bên popup Khám,
                    chỉ bỏ lý do khám + ảnh khách hàng (riêng cho ca khám, không thuộc về gói).
                    Bấm vào để mở lại đúng ca khám đã chỉ định gói này (đảo ngược của nút "Ca khám
                    này đã chỉ định phác đồ" bên popup Khám — setExpandedAptId ở dưới). */}
                {(() => {
                  const canViewExamSession = !!selectedPlan.cuoc_hen_id &&
                    (patient?.appointments || []).some((ap: any) => ap.id === selectedPlan.cuoc_hen_id);

                  const handleViewExamSession = () => {
                    if (!canViewExamSession) return;
                    setExpandedPlanId(null);
                    setExpandedAptId(selectedPlan.cuoc_hen_id);
                  };

                  return (
                    <div
                      role={canViewExamSession ? 'button' : undefined}
                      tabIndex={canViewExamSession ? 0 : undefined}
                      onClick={handleViewExamSession}
                      onKeyDown={(e) => {
                        if (canViewExamSession && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleViewExamSession();
                        }
                      }}
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl transition-all ${
                        canViewExamSession ? 'group cursor-pointer active:scale-[0.99]' : ''
                      }`}
                    >
                      <div className={`border rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition-all ${
                        canViewExamSession
                          ? 'border-teal-150 bg-gradient-to-br from-teal-50/60 to-white group-hover:border-teal-300 group-hover:shadow-md'
                          : 'border-slate-100 bg-white'
                      }`}>
                        {selectedPlan.anh_bac_si ? (
                          <img
                            src={resolveImageUrl(selectedPlan.anh_bac_si)}
                            alt={selectedPlan.ten_bac_si}
                            className="size-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="size-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {selectedPlan.ten_bac_si?.trim()?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Bác sĩ chỉ định</span>
                          <h4 className="text-xs font-bold text-slate-800 mt-0.5">{selectedPlan.ten_bac_si || 'Chưa phân công'}</h4>
                          <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {getStaffRoleTitle(selectedPlan.ten_bac_si, selectedPlan.vai_tro_bac_si)}
                          </span>
                        </div>
                      </div>

                      <div className={`border rounded-xl p-3.5 flex flex-col gap-1.5 text-[11px] text-slate-600 font-semibold shadow-sm transition-all ${
                        canViewExamSession
                          ? 'border-teal-150 bg-gradient-to-br from-teal-50/60 to-white group-hover:border-teal-300 group-hover:shadow-md'
                          : 'border-slate-100 bg-white'
                      }`}>
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Thời gian khám chỉ định gói</span>
                          {canViewExamSession && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-white bg-teal-600 group-hover:bg-teal-700 px-2 py-1 rounded-full shrink-0 shadow-sm transition-colors">
                              Xem ca khám <ChevronDown size={11} className="-rotate-90 stroke-[3]" />
                            </span>
                          )}
                        </span>
                        {selectedPlan.ngay_gio_kham ? (
                          <>
                            <span className="flex items-center gap-2">
                              <Calendar size={12} className="text-slate-400 shrink-0" />
                              {format(new Date(selectedPlan.ngay_gio_kham), 'EEEE, dd/MM/yyyy')}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock size={12} className="text-slate-400 shrink-0" />
                              {format(new Date(selectedPlan.ngay_gio_kham), 'HH:mm')}
                              {selectedPlan.ngay_gio_ket_thuc_kham && <> - {format(new Date(selectedPlan.ngay_gio_ket_thuc_kham), 'HH:mm')}</>}
                            </span>
                          </>
                        ) : (
                          <span>Chưa ghi nhận buổi khám chỉ định.</span>
                        )}
                        {selectedPlan.ten_phong_kham && (
                          <span className="flex items-center gap-2">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            {selectedPlan.ten_phong_kham}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Hồ sơ Khám lâm sàng — chỉ giữ chẩn đoán + chống chỉ định bác sĩ nhập */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-55/40 pb-2.5">
                    <FileText size={14} className="text-teal-600 stroke-[2.5]" />
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Hồ sơ Khám lâm sàng</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                      <span className="text-[9px] font-bold text-teal-750 uppercase tracking-widest block">Chẩn đoán y khoa</span>
                      <p className="text-xs font-bold text-teal-955 leading-relaxed">
                        {selectedPlan.chan_doan || 'Chưa có chẩn đoán cụ thể.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-3 bg-rose-50/20 border border-rose-100/30 rounded-xl">
                      <span className="text-[9px] font-bold text-rose-800 uppercase tracking-widest block flex items-center gap-1">
                        <AlertTriangle size={11} className="text-rose-505" /> Chống chỉ định y khoa
                      </span>
                      <p className="text-xs font-bold text-rose-950 leading-relaxed">
                        {selectedPlan.chong_chi_dinh && selectedPlan.chong_chi_dinh !== '1' ? selectedPlan.chong_chi_dinh : 'Không ghi nhận chống chỉ định.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Danh sách buổi điều trị */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2.5">Các buổi điều trị</h4>

                  <div className="space-y-3">
                    {Array.from({ length: selectedPlan.tong_so_buoi }).map((_, index) => {
                      const sessionNum = index + 1;
                      const appt = selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum && ap.loai !== 'KHAM');
                      const isUnbooked = !appt && sessionNum === firstEmptySessionNum;
                      const isFinished = appt?.trang_thai === 'hoan_thanh';
                      const isNoShowForfeited = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(appt?.trang_thai);

                      if (appt) {
                        const isSessionExpanded = expandedSessionId === appt.id;
                        const initial = appt.ten_nhan_su?.trim()?.charAt(0)?.toUpperCase() || '?';
                        return (
                          <div
                            key={appt.id}
                            className={`border rounded-xl overflow-hidden bg-white transition-all duration-300 ${isSessionExpanded ? 'border-indigo-105 shadow-sm ring-1 ring-indigo-50/50' : 'border-slate-100 hover:border-slate-200 shadow-sm'
                              }`}
                          >
                            <div
                              onClick={() => setExpandedSessionId(isSessionExpanded ? null : appt.id)}
                              className="p-4 flex justify-between items-center gap-4 cursor-pointer select-none hover:bg-slate-50/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-[11px] border shadow-sm ${isFinished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isNoShowForfeited ? 'bg-slate-100 text-slate-400 border-slate-200/50' : 'bg-amber-50 text-amber-700 border-amber-100'
                                      }`}>
                                  {sessionNum}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${isFinished ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : isNoShowForfeited ? 'bg-slate-100 text-slate-400 border border-slate-200/50' : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                                        }`}>
                                      {isFinished ? 'Hoàn thành' : isNoShowForfeited ? 'Không đến (đã tính phí)' : 'Đã đặt lịch'}
                                    </span>
                                    <strong className="text-xs font-bold text-slate-800">
                                      Buổi {sessionNum} • Trị liệu phục hồi
                                    </strong>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                    {format(new Date(appt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • Thực hiện: {appt.ten_nhan_su || 'Chưa phân công'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {appt.vas_truoc !== null && (
                                  <span className="text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                                    VAS: {appt.vas_truoc} ➔ {appt.vas_sau}
                                  </span>
                                )}
                                {isSessionExpanded ? <ChevronUp size={14} className="text-slate-455 stroke-[2.5]" /> : <ChevronDown size={14} className="text-slate-455 stroke-[2.5]" />}
                              </div>
                            </div>

                            {isSessionExpanded && (
                              <div className="px-4 pb-4 pt-3 border-t border-slate-100/60 bg-slate-50/15 space-y-4 animate-fade-in text-xs">
                                <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    {appt.anh_nhan_su ? (
                                      <img
                                        src={resolveImageUrl(appt.anh_nhan_su)}
                                        alt={appt.ten_nhan_su}
                                        className="size-10 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                                      />
                                    ) : (
                                      <div className="size-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                                        {initial}
                                      </div>
                                    )}
                                    <div>
                                      <h5 className="font-extrabold text-slate-800">{appt.ten_nhan_su || 'Chưa phân công'}</h5>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                        {getStaffRoleTitle(appt.ten_nhan_su, appt.vai_tro_id)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:items-end gap-1 text-[10px] text-slate-500 font-semibold">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={11} className="text-slate-400 stroke-[2.25]" />
                                      {format(new Date(appt.ngay_gio_bat_dau), 'EEEE, dd/MM/yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock size={11} className="text-slate-400 stroke-[2.25]" />
                                      {format(new Date(appt.ngay_gio_bat_dau), 'HH:mm')} - {format(new Date(appt.ngay_gio_ket_thuc), 'HH:mm')}
                                    </span>
                                    {appt.ten_phong && (
                                      <span className="flex items-center gap-1">
                                        <MapPin size={11} className="text-slate-400 stroke-[2.25]" />
                                        {appt.ten_phong}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-2">
                                  <TreatmentSessionDetailBody
                                    chanDoan={appt.chan_doan_tri_lieu}
                                    ghiChu={appt.ghi_chu_tri_lieu}
                                    chongChiDinh={appt.chong_chi_dinh_tri_lieu}
                                    vasTruoc={appt.vas_truoc}
                                    vasSau={appt.vas_sau}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } else if (isUnbooked) {
                        const isCancelled = isPlanCancelled(selectedPlan);
                        const isExpired = !isCancelled && isPlanExpired(selectedPlan);
                        const isUnpaid = !isCancelled && selectedPlan.trang_thai === 'cho_kich_hoat' && selectedPlan.loai_goi !== 'LE';

                        const prevAppt = sessionNum > 1
                          ? selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum - 1 && ap.loai !== 'KHAM')
                          : null;
                        const isPrevNoShowForfeited = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(prevAppt?.trang_thai);
                        const isPrevFinished = sessionNum === 1 || (prevAppt && (prevAppt.trang_thai === 'hoan_thanh' || isPrevNoShowForfeited));

                        const minRequired = getMinPaymentRequired(
                          selectedPlan.hinh_thuc_thanh_toan_goi || 'tra_thang',
                          Number(selectedPlan.tong_tien_phai_tra || 0),
                          Number(selectedPlan.tong_so_buoi || 10),
                          sessionNum
                        );
                        const soTienDaTra = Number(selectedPlan.so_tien_da_tra || 0);
                        const isPaymentBlocked = !isCancelled && !isExpired && selectedPlan.loai_goi !== 'LE' && soTienDaTra < minRequired;
                        const isBlocked = isCancelled || isExpired || !isPrevFinished || isPaymentBlocked;
                        const blockMessage = isCancelled
                          ? '🚫 Gói đã bị hủy và hoàn tiền — không thể đặt thêm buổi điều trị.'
                          : (isExpired
                            ? `⛔ Gói đã quá hạn sử dụng (hạn ${selectedPlan.han_su_dung ? new Date(selectedPlan.han_su_dung).toLocaleDateString('vi-VN') : ''}) — liên hệ Admin để xử lý trước khi đặt thêm buổi.`
                            : (!isPrevFinished
                              ? `⚠️ Vui lòng hoàn thành buổi điều trị số ${sessionNum - 1} để đặt lịch buổi này.`
                              : `⚠️ Vui lòng thanh toán liệu trình để đặt lịch buổi này.`));

                        return (
                          <div key={sessionNum} className={`border rounded-xl p-4 flex justify-between items-center gap-4 ${isCancelled || isExpired
                              ? 'border-rose-100 bg-rose-50/20 opacity-75'
                              : isUnpaid || isBlocked
                                ? 'border-amber-100 bg-amber-50/10 opacity-80'
                                : 'border-sky-100 bg-sky-50/30'
                            }`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isCancelled || isExpired
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : isUnpaid ? 'bg-amber-100 text-amber-800 border border-amber-200' : (isBlocked ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-sky-100 text-sky-800 border border-sky-200')
                                  }`}>
                                  {isCancelled ? 'Đã hủy gói' : (isExpired ? 'Quá hạn sử dụng' : (isUnpaid ? 'Chờ kích hoạt' : (isBlocked ? 'Chưa đủ điều kiện' : 'Chưa đặt lịch')))}
                                </span>
                                <strong className="text-xs font-bold text-slate-800">
                                  Buổi {sessionNum} • Trị liệu phục hồi
                                </strong>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                {isUnpaid
                                  ? '⚠️ Vui lòng kích hoạt và thanh toán gói để bắt đầu đặt lịch.'
                                  : (isBlocked ? blockMessage : 'Sẵn sàng để lên lịch đặt chỗ.')}
                              </p>
                            </div>

                            {isUnpaid ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                                  window.location.href = `${basePath}/quick-billing?customer_id=${patient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}&dang_ky_goi=true`;
                                }}
                                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                              >
                                Kích hoạt ngay
                              </button>
                            ) : isPaymentBlocked && isPrevFinished && selectedPlan.hoa_don_id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedPlan.hinh_thuc_thanh_toan_goi === 'tung_buoi') {
                                    const checkoutPath = window.location.pathname.startsWith('/receptionist') ? '/receptionist/billing' : '/admin/quick-billing';
                                    window.location.href = `${checkoutPath}?customer_id=${patient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}`;
                                    return;
                                  }
                                  const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist/billing' : '/admin/finance';
                                  window.location.href = `${basePath}?hoa_don_id=${selectedPlan.hoa_don_id}`;
                                }}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                              >
                                💵 Thanh toán
                              </button>
                            ) : isBlocked ? (
                              <button
                                disabled
                                className="px-4 py-2 bg-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed shrink-0"
                              >
                                Đặt lịch
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                                  window.location.href = `${basePath}/appointments?khach_hang_id=${patient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}`;
                                }}
                                  className="px-4 py-2 bg-[#0D9488] hover:bg-[#0b7d72] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                                >
                                  Đặt lịch
                                </button>
                              )}
                          </div>
                        );
                      } else {
                        return (
                          <div key={sessionNum} className="border border-dashed border-slate-100 rounded-xl p-4 flex justify-between items-center gap-4 opacity-50 bg-slate-50/20">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-500">
                                  Chưa tới hạn
                                </span>
                                <strong className="text-xs font-bold text-slate-500">
                                  Buổi {sessionNum} • Trị liệu phục hồi
                                </strong>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== POPUP: Chi tiết khám/dịch vụ lẻ ===== */}
      <AnimatePresence>
        {selectedApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center py-4 pr-4 pl-64">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedAptId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="relative w-full max-w-3xl max-h-[85vh] bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-start gap-4 p-5 border-b border-slate-100 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${selectedApt.loai === 'KHAM' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-650'
                      }`}>
                      {selectedApt.loai === 'KHAM' ? 'Khám lâm sàng' : 'Dịch vụ lẻ'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${(STATUS_META[selectedApt.trang_thai] || { cls: 'bg-slate-100 text-slate-600' }).cls}`}>
                      {(STATUS_META[selectedApt.trang_thai] || { label: selectedApt.trang_thai }).label}
                    </span>
                    {selectedApt.trang_thai_thanh_toan && PAY_META[selectedApt.trang_thai_thanh_toan] && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${PAY_META[selectedApt.trang_thai_thanh_toan].cls}`}>
                        {PAY_META[selectedApt.trang_thai_thanh_toan].label}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedApt.ten_dich_vu || (selectedApt.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu dịch vụ lẻ')}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {format(new Date(selectedApt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • Thực hiện: {selectedApt.ten_nhan_su || 'Chưa phân công'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedAptId(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all shrink-0"
                >
                  <X size={16} className="stroke-[2.5]" />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto">
                {/* Gói chỉ định từ ca khám */}
                {prescribedPlan && prescribedPlan.trang_thai === 'cho_kich_hoat' && (
                  prescribedPlan.loai_goi === 'LE' ? (
                    <div className="border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50/70 via-sky-50/30 to-white dark:from-sky-950/60 dark:via-zinc-800 dark:to-zinc-900 text-sky-900 dark:text-sky-200 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                            <Stethoscope size={16} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                                Dịch vụ lẻ chỉ định từ ca khám
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${!bookedApt
                                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                  : bookedApt.trang_thai === 'hoan_thanh'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}>
                                {!bookedApt ? 'Chưa đặt lịch' : bookedApt.trang_thai === 'hoan_thanh' ? 'Đã hoàn thành' : 'Đã đặt lịch'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-1">
                              {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
                              {bookedApt
                                ? `Lịch hẹn: ${format(new Date(bookedApt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • KTV ${bookedApt.ten_nhan_su || 'Chưa phân công'}`
                                : 'Bác sĩ đã chỉ định dịch vụ lẻ này. Khách hàng sẽ thanh toán sau khi thực hiện dịch vụ.'}
                            </p>
                          </div>
                        </div>

                        {!bookedApt && (
                          <button
                            type="button"
                            onClick={() => {
                              const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                              window.location.href = `${basePath}/appointments?khach_hang_id=${patient.id}&goi_dich_vu_id=${prescribedPlan.goi_dich_vu_id}`;
                            }}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>📅 Đặt lịch hẹn</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/70 via-amber-50/30 to-white dark:from-amber-950/60 dark:via-zinc-800 dark:to-zinc-900 text-amber-900 dark:text-amber-200 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                            <Stethoscope size={16} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                                Gói chỉ định từ ca khám này
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Chờ kích hoạt
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-1">
                              {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
                              Bác sĩ đã chỉ định phác đồ điều trị này. Vui lòng thanh toán để kích hoạt và bắt đầu buổi trị liệu.
                            </p>
                            {prescribedPlan.han_kich_hoat && (() => {
                              const countdown = formatCountdown(prescribedPlan.han_kich_hoat);
                              return (
                                <p className={`text-[10px] font-bold mt-1 ${countdown.urgent ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`}>
                                  ⏱ {countdown.text}
                                </p>
                              );
                            })()}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                            window.location.href = `${basePath}/quick-billing?lich_dat_id=${prescribedPlan.cuoc_hen_id}&dang_ky_goi=true`;
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <span>💵 Thanh toán & Kích hoạt gói</span>
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Ca khám này đã dẫn tới 1 phác đồ được kích hoạt — cho xem nhanh phác đồ đó */}
                {prescribedPlan && prescribedPlan.trang_thai !== 'cho_kich_hoat' && (
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedAptId(null);
                      setExpandedPlanId(prescribedPlan.id);
                    }}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl p-4 border text-left transition-all active:scale-[0.99] cursor-pointer ${prescribedPlan.trang_thai === 'huy'
                        ? 'border-rose-200 dark:border-rose-800 bg-gradient-to-r from-rose-50/70 via-rose-50/30 to-white dark:from-rose-950/60 dark:via-zinc-800 dark:to-zinc-900'
                        : 'border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50/70 via-teal-50/30 to-white dark:from-teal-950/60 dark:via-zinc-800 dark:to-zinc-900'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${prescribedPlan.trang_thai === 'huy' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' : 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                        }`}>
                        <Stethoscope size={16} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                          Ca khám này đã chỉ định phác đồ
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-1">
                          {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
                          {prescribedPlan.trang_thai === 'dang_dieu_tri' ? 'Đang điều trị' : prescribedPlan.trang_thai === 'hoan_thanh' ? 'Đã hoàn thành liệu trình' : 'Đã hủy'} • Bấm để xem chi tiết phác đồ
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 dark:text-zinc-400 -rotate-90 stroke-[2.5] shrink-0" />
                  </button>
                )}

                {/* Lý do khám & ảnh đính kèm — riêng cho ca khám lâm sàng */}
                {selectedApt.loai === 'KHAM' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <MessageSquareText size={11} className="text-slate-400" /> Lý do khám (khách hàng cung cấp)
                      </span>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        {selectedApt.ly_do_kham || 'Khách hàng không ghi lý do khám.'}
                      </p>
                    </div>

                    {selectedApt.anh_dinh_kem_url && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-slate-400" /> Ảnh khách hàng đính kèm
                        </span>
                        <div className="rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200/60">
                          <a href={resolveImageUrl(selectedApt.anh_dinh_kem_url)} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={resolveImageUrl(selectedApt.anh_dinh_kem_url)}
                              alt="Ảnh đính kèm của khách hàng"
                              className="max-h-80 w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Time & Expert row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 bg-white shadow-sm">
                    {selectedApt.anh_nhan_su ? (
                      <img
                        src={resolveImageUrl(selectedApt.anh_nhan_su)}
                        alt={selectedApt.ten_nhan_su}
                        className="size-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {selectedApt.ten_nhan_su?.trim()?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Chuyên gia phụ trách</span>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5">{selectedApt.ten_nhan_su || 'Chưa phân công'}</h4>
                      <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                        {getStaffRoleTitle(selectedApt.ten_nhan_su, selectedApt.vai_tro_id)}
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-3.5 flex flex-col gap-1.5 bg-white text-[11px] text-slate-600 font-semibold shadow-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Thời gian thực hiện</span>
                    <span className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-400 shrink-0" />
                      {format(new Date(selectedApt.ngay_gio_bat_dau), 'EEEE, dd/MM/yyyy')}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-400 shrink-0" />
                      {format(new Date(selectedApt.ngay_gio_bat_dau), 'HH:mm')} - {format(new Date(selectedApt.ngay_gio_ket_thuc), 'HH:mm')}
                    </span>
                    {selectedApt.ten_phong && (
                      <span className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        {selectedApt.ten_phong}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chẩn đoán/chống chỉ định chỉ có ở KHAM; VAS chỉ có ở dịch vụ lẻ/trị liệu — 2 loại
                    dữ liệu loại trừ nhau theo đúng quy tắc nghiệp vụ, component tự ẩn field null,
                    không còn fallback "Đang chờ cập nhật..." sai bản chất cho dịch vụ lẻ. */}
                <TreatmentSessionDetailBody
                  chanDoan={selectedApt.chan_doan_tri_lieu}
                  ghiChu={selectedApt.ghi_chu_tri_lieu}
                  ghiChuLabel="Ghi chú & Chỉ định thêm"
                  chongChiDinh={selectedApt.chong_chi_dinh_tri_lieu}
                  vasTruoc={selectedApt.vas_truoc}
                  vasSau={selectedApt.vas_sau}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

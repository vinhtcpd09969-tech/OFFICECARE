import { useState, useMemo } from 'react';
import {
  ChevronLeft, FileText, Printer, Stethoscope,
  AlertTriangle, ChevronDown, ChevronUp, Calendar, MapPin, Clock, ImageIcon, MessageSquareText, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { getMinPaymentRequired, isPlanCancelled, resolveGrossBeforeExamDeduction } from '../../../utils/billing';
const getStaffRoleTitle = (staffName: string, roleId: number) => {
  const nameLower = (staffName || '').toLowerCase();
  if (nameLower.includes('ktv') || nameLower.includes('kỹ thuật viên') || nameLower.includes('kĩ thuật viên')) {
    return 'Kỹ thuật viên PHCN';
  }
  if (nameLower.includes('bs') || nameLower.includes('bác sĩ') || nameLower.includes('bác sỹ')) {
    return 'Bác sĩ chuyên khoa';
  }
  return roleId === 3 ? 'Bác sĩ chuyên khoa' : 'Kỹ thuật viên PHCN';
};

interface PatientEmrDetailProps {
  patient: any;
  onBack: () => void;
  showAdminInfo?: boolean;
}

export default function PatientEmrDetail({ patient, onBack, showAdminInfo = true }: PatientEmrDetailProps) {
  // "Phác đồ điều trị" và "Khám & Dịch vụ lẻ" hiện đồng thời thành 2 bảng cạnh nhau — bấm "Chi tiết"
  // trên 1 dòng mở popup hiển thị đầy đủ nội dung (thay vì accordion nội tuyến kéo dài cả trang).
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const selectedPlan = useMemo(() => {
    return patient?.plans?.find((p: any) => p.id === expandedPlanId);
  }, [patient, expandedPlanId]);

  const selectedPlanSessions = useMemo(() => {
    const isPrepaidPackage = selectedPlan?.hinh_thuc_thanh_toan_goi === 'tra_thang' || selectedPlan?.hinh_thuc_thanh_toan_goi === 'tra_gop';
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

  const handlePrint = () => {
    window.print();
  };

  const realPlans = patient?.plans?.filter((pl: any) => !pl.id.startsWith('virtual-')) || [];
  const historyItems = patient?.appointments?.filter(
    (ap: any) => !ap.phac_do_dieu_tri_id || ap.loai === 'KHAM'
  ) || [];
  const STATUS_META: Record<string, { label: string; cls: string }> = {
    hoan_thanh: { label: 'Đã hoàn thành', cls: 'bg-emerald-50 text-emerald-700' },
    cho_xac_nhan: { label: 'Chờ xác nhận', cls: 'bg-slate-100 text-slate-600' },
    da_xac_nhan: { label: 'Đã đặt lịch', cls: 'bg-amber-50 text-amber-700' },
    da_checkin: { label: 'Đang khám', cls: 'bg-sky-50 text-sky-700' },
    khong_den: { label: 'Không đến', cls: 'bg-rose-50 text-rose-700' },
    khach_khong_den: { label: 'Không đến', cls: 'bg-rose-50 text-rose-700' },
    khach_khong_den_phat: { label: 'Không đến', cls: 'bg-rose-50 text-rose-700' }
  };
  const PAY_META: Record<string, { label: string; cls: string }> = {
    da_thanh_toan: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700' },
    chua_thanh_toan: { label: 'Chưa thanh toán', cls: 'bg-amber-50 text-amber-700' }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Patient Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-650 hover:text-slate-850 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <ChevronLeft size={16} className="stroke-[3]" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-bold text-sm uppercase shadow-md shadow-slate-950/15 border border-slate-700/10 shrink-0">
              {patient?.ho_ten?.charAt(0) || 'K'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{patient?.ho_ten}</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                <span className="font-extrabold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">
                  {'KH-' + patient?.id?.substring(0, 8).toUpperCase()}
                </span>
                {patient?.so_dien_thoai} • Bệnh nhân điều trị tích hợp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 rounded-xl text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Printer size={13} className="stroke-[2.5]" />
            <span>In hồ sơ</span>
          </button>
        </div>
      </div>

      <div className={showAdminInfo ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "w-full"}>
        {/* Left Column: Patient Profile Summary */}
        {showAdminInfo && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl uppercase shadow-md shadow-teal-500/10 shrink-0">
                  {patient?.ho_ten?.charAt(0) || 'K'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-805 leading-tight">{patient?.ho_ten}</h4>
                  <span className="text-[10px] text-slate-400 font-extrabold font-mono bg-slate-50 px-1.5 py-0.5 rounded inline-block mt-1.5">
                    {'KH-' + patient?.id?.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Số điện thoại:</span>
                  <strong className="text-slate-700 font-bold">{patient?.so_dien_thoai}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Email:</span>
                  <strong className="text-slate-700 font-bold">{patient?.email || 'Chưa cung cấp'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Điểm uy tín:</span>
                  <strong className="text-teal-600 font-bold">{patient?.diem_uy_tin || 0}đ</strong>
                </div>
              </div>
            </div>

            {/* Quick statistics */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider">Thống kê hồ sơ</h4>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="text-[20px] font-bold text-slate-850 block">{realPlans.length}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Phác đồ</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="text-[20px] font-bold text-slate-850 block">
                    {patient?.appointments?.filter((ap: any) => ap.trang_thai === 'hoan_thanh').length || 0}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Buổi hoàn thành</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right/Main: 2 bảng luôn hiện song song — Phác đồ điều trị & Khám/Dịch vụ lẻ */}
        <div className={showAdminInfo ? "lg:col-span-2" : "w-full"}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ===== BẢNG TRÁI: Phác đồ điều trị ===== */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider">
                Phác đồ điều trị ({realPlans.length})
              </h4>

              {realPlans.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-slate-400 font-semibold text-xs shadow-sm">
                  Bệnh nhân chưa có phác đồ điều trị nào.
                </div>
              ) : (
                realPlans.map((pl: any) => {
                  const progressPercent = Math.min(100, Math.round(((pl.so_buoi_da_dung || 0) / (pl.tong_so_buoi || 10)) * 100));
                  const showReminder = reminderTargetPlanId === pl.id && patient?.reminder;
                  return (
                    <div key={pl.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-slate-200">
                      <div className="p-5 space-y-4">
                        {showReminder && (
                          <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2.5">
                            <Clock size={13} className="text-amber-600 stroke-[2.5] shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-900 leading-relaxed">{patient.reminder.message}</p>
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase ${pl.trang_thai === 'dang_dieu_tri'
                                ? 'bg-teal-50 text-teal-700 border border-teal-100/50'
                                : pl.trang_thai === 'cho_kich_hoat'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                                  : 'bg-slate-100 text-slate-650'
                              }`}>
                              {pl.trang_thai === 'dang_dieu_tri' ? 'Đang điều trị' : pl.trang_thai === 'cho_kich_hoat' ? 'Chờ kích hoạt' : 'Hoàn thành'}
                            </span>
                            <h4 className="text-sm font-bold text-slate-805 mt-1.5">{pl.ten_goi}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              Bác sĩ: {pl.ten_bac_si || 'N/A'} • Ngày kích hoạt: {pl.ngay_kich_hoat ? format(new Date(pl.ngay_kich_hoat), 'dd/MM/yyyy') : 'N/A'}
                            </p>
                            {pl.han_su_dung && (
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                Hạn sử dụng: <strong className="text-slate-600">{format(new Date(pl.han_su_dung), 'dd/MM/yyyy')}</strong>
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setExpandedPlanId(pl.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 shrink-0"
                          >
                            Chi tiết
                            <ChevronDown size={11} />
                          </button>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Tiến độ liệu trình: {pl.so_buoi_da_dung}/{pl.tong_so_buoi} buổi</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ===== BẢNG PHẢI: Khám & Dịch vụ lẻ ===== */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-805 uppercase tracking-wider">
                Khám & Dịch vụ lẻ ({historyItems.length})
              </h4>

              {historyItems.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-slate-400 font-semibold text-xs shadow-sm">
                  Bệnh nhân chưa có lịch sử ca khám hoặc dịch vụ lẻ nào.
                </div>
              ) : (
                historyItems.map((ap: any) => {
                  const statusMeta = STATUS_META[ap.trang_thai] || { label: ap.trang_thai, cls: 'bg-slate-100 text-slate-600' };
                  const payMeta = ap.trang_thai_thanh_toan ? PAY_META[ap.trang_thai_thanh_toan] : null;
                  return (
                    <div key={ap.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-slate-200">
                      <button
                        type="button"
                        onClick={() => setExpandedAptId(ap.id)}
                        className="w-full p-4 flex justify-between items-center gap-4 text-left cursor-pointer select-none hover:bg-slate-50/30 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${ap.loai === 'KHAM' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-650'
                              }`}>
                              {ap.loai === 'KHAM' ? 'Khám lâm sàng' : 'Dịch vụ lẻ'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${statusMeta.cls}`}>
                              {statusMeta.label}
                            </span>
                            {payMeta && (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${payMeta.cls}`}>
                                {payMeta.label}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">{ap.ten_dich_vu || (ap.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu dịch vụ lẻ')}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {format(new Date(ap.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • Thực hiện: {ap.ten_nhan_su || 'Chưa phân công'}
                          </p>
                        </div>
                        <span className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 shrink-0">
                          Chi tiết
                          <ChevronDown size={11} />
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
                  <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase ${selectedPlan.trang_thai === 'dang_dieu_tri'
                      ? 'bg-teal-50 text-teal-700 border border-teal-100/50'
                      : selectedPlan.trang_thai === 'cho_kich_hoat'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                        : 'bg-slate-100 text-slate-650'
                    }`}>
                    {selectedPlan.trang_thai === 'dang_dieu_tri' ? 'Đang điều trị' : selectedPlan.trang_thai === 'cho_kich_hoat' ? 'Chờ kích hoạt' : 'Hoàn thành'}
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
                    chỉ bỏ lý do khám + ảnh khách hàng (riêng cho ca khám, không thuộc về gói) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 bg-white shadow-sm">
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

                  <div className="border border-slate-100 rounded-xl p-3.5 flex flex-col gap-1.5 bg-white text-[11px] text-slate-600 font-semibold shadow-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Thời gian khám chỉ định gói</span>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {appt.chan_doan_tri_lieu && (
                                    <div className="p-3 bg-teal-50/10 border border-teal-100/20 rounded-xl">
                                      <span className="text-[9px] font-bold text-teal-700 uppercase tracking-widest block mb-1">Nhật ký trị liệu của KTV</span>
                                      <p className="text-slate-700 font-bold leading-relaxed">{appt.chan_doan_tri_lieu}</p>
                                    </div>
                                  )}

                                  {appt.chong_chi_dinh_tri_lieu && (
                                    <div className="p-3 bg-rose-50/20 border border-rose-100/20 rounded-xl">
                                      <span className="text-[9px] font-bold text-rose-700 uppercase tracking-widest block mb-1 flex items-center gap-1">
                                        <AlertTriangle size={11} /> Ghi nhận chống chỉ định
                                      </span>
                                      <p className="text-rose-950 font-bold leading-relaxed">{appt.chong_chi_dinh_tri_lieu}</p>
                                    </div>
                                  )}
                                </div>

                                {appt.ghi_chu_tri_lieu && (
                                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú & Hướng dẫn phục hồi</span>
                                    <p className="text-slate-650 italic">"{appt.ghi_chu_tri_lieu}"</p>
                                  </div>
                                )}

                                {appt.vas_truoc !== null && appt.vas_sau !== null && (
                                  <div className="space-y-1.5 pt-2.5 border-t border-slate-100/70">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                      <span>Chỉ số đau (VAS Pain Scale):</span>
                                      <span className="text-slate-800 font-extrabold">
                                        Cảm giác đau giảm: VAS {appt.vas_truoc} (Trước) ➔ VAS {appt.vas_sau} (Sau)
                                      </span>
                                    </div>
                                    <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex items-center px-1">
                                      <div
                                        className="absolute h-2 bg-gradient-to-r from-teal-500 to-rose-500 rounded-full"
                                        style={{
                                          left: `${(appt.vas_sau || 0) * 10}%`,
                                          right: `${100 - (appt.vas_truoc || 10) * 10}%`
                                        }}
                                      />
                                      <span className="absolute text-[8px] font-bold text-teal-800 font-mono" style={{ left: `${(appt.vas_sau || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                                        ▲ {appt.vas_sau}
                                      </span>
                                      <span className="absolute text-[8px] font-bold text-rose-800 font-mono" style={{ left: `${(appt.vas_truoc || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                                        ▲ {appt.vas_truoc}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      } else if (isUnbooked) {
                        const isCancelled = isPlanCancelled(selectedPlan);
                        const isUnpaid = !isCancelled && selectedPlan.trang_thai === 'cho_kich_hoat' && selectedPlan.loai_goi !== 'LE';

                        const prevAppt = sessionNum > 1
                          ? selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum - 1 && ap.loai !== 'KHAM')
                          : null;
                        const isPrevNoShowForfeited = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(prevAppt?.trang_thai);
                        const isPrevFinished = sessionNum === 1 || (prevAppt && (prevAppt.trang_thai === 'hoan_thanh' || isPrevNoShowForfeited));

                        const grossBeforeExamDeduction = resolveGrossBeforeExamDeduction(selectedPlan);
                        const minRequired = getMinPaymentRequired(
                          selectedPlan.hinh_thuc_thanh_toan_goi || 'tra_thang',
                          Number(selectedPlan.tong_tien_phai_tra || 0),
                          Number(selectedPlan.tong_so_buoi || 10),
                          sessionNum,
                          grossBeforeExamDeduction
                        );
                        const soTienDaTra = Number(selectedPlan.so_tien_da_tra || 0);
                        const isPaymentBlocked = !isCancelled && selectedPlan.loai_goi !== 'LE' && soTienDaTra < minRequired;
                        const isBlocked = isCancelled || !isPrevFinished || isPaymentBlocked;
                        const blockMessage = isCancelled
                          ? '🚫 Gói đã bị hủy và hoàn tiền — không thể đặt thêm buổi điều trị.'
                          : (!isPrevFinished
                            ? `⚠️ Vui lòng hoàn thành buổi điều trị số ${sessionNum - 1} để đặt lịch buổi này.`
                            : (selectedPlan.hinh_thuc_thanh_toan_goi === 'tra_gop'
                              ? `⚠️ Vui lòng thanh toán Đợt 2 của gói trả góp để đặt lịch buổi này.`
                              : `⚠️ Vui lòng thanh toán liệu trình để đặt lịch buổi này.`));

                        return (
                          <div key={sessionNum} className={`border rounded-xl p-4 flex justify-between items-center gap-4 ${isCancelled
                              ? 'border-rose-100 bg-rose-50/20 opacity-75'
                              : isUnpaid || isBlocked
                                ? 'border-amber-100 bg-amber-50/10 opacity-80'
                                : 'border-sky-100 bg-sky-50/30'
                            }`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isCancelled
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : isUnpaid ? 'bg-amber-100 text-amber-800 border border-amber-200' : (isBlocked ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-sky-100 text-sky-850')
                                  }`}>
                                  {isCancelled ? 'Đã hủy gói' : (isUnpaid ? 'Chờ kích hoạt' : (isBlocked ? 'Chưa đủ điều kiện' : 'Chưa đặt lịch'))}
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
                                💵 {selectedPlan.hinh_thuc_thanh_toan_goi === 'tra_gop' ? 'Thanh toán Đợt 2' : 'Thanh toán'}
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
                                className="px-4 py-2 bg-sky-650 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
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
                    <div className="border border-sky-200 bg-gradient-to-r from-sky-50/70 via-sky-50/30 to-white text-sky-900 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 text-sky-700">
                            <Stethoscope size={16} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Dịch vụ lẻ chỉ định từ ca khám
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${!bookedApt
                                  ? 'bg-sky-100 text-sky-800 border-sky-200'
                                  : bookedApt.trang_thai === 'hoan_thanh'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                }`}>
                                {!bookedApt ? 'Chưa đặt lịch' : bookedApt.trang_thai === 'hoan_thanh' ? 'Đã hoàn thành' : 'Đã đặt lịch'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 mt-1">
                              {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                            </h4>
                            <p className="text-[10px] text-slate-505 font-semibold mt-0.5">
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
                    <div className="border border-amber-200 bg-gradient-to-r from-amber-50/70 via-amber-50/30 to-white text-amber-900 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 text-amber-700">
                            <Stethoscope size={16} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Gói chỉ định từ ca khám này
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                Chờ kích hoạt
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 mt-1">
                              {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                            </h4>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              Bác sĩ đã chỉ định phác đồ điều trị này. Vui lòng thanh toán để kích hoạt và bắt đầu buổi trị liệu.
                            </p>
                            {prescribedPlan.han_kich_hoat && (() => {
                              const daysLeft = Math.ceil(
                                (new Date(prescribedPlan.han_kich_hoat).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                              );
                              return (
                                <p className={`text-[10px] font-bold mt-1 ${daysLeft <= 3 ? 'text-red-600' : 'text-amber-700'}`}>
                                  ⏱ {daysLeft > 0 ? `Còn ${daysLeft} ngày để kích hoạt` : 'Hết hạn hôm nay'}
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
                        ? 'border-rose-200 bg-gradient-to-r from-rose-50/70 via-rose-50/30 to-white'
                        : 'border-teal-200 bg-gradient-to-r from-teal-50/70 via-teal-50/30 to-white'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${prescribedPlan.trang_thai === 'huy' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                        <Stethoscope size={16} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Ca khám này đã chỉ định phác đồ
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 mt-1">
                          {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                        </h4>
                        <p className="text-[10px] text-slate-505 font-semibold mt-0.5">
                          {prescribedPlan.trang_thai === 'dang_dieu_tri' ? 'Đang điều trị' : prescribedPlan.trang_thai === 'hoan_thanh' ? 'Đã hoàn thành liệu trình' : 'Đã hủy'} • Bấm để xem chi tiết phác đồ
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 -rotate-90 stroke-[2.5] shrink-0" />
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
                      <div className="p-3.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <ImageIcon size={11} className="text-slate-400" /> Ảnh khách hàng đính kèm
                        </span>
                        <a href={resolveImageUrl(selectedApt.anh_dinh_kem_url)} target="_blank" rel="noreferrer">
                          <img
                            src={resolveImageUrl(selectedApt.anh_dinh_kem_url)}
                            alt="Ảnh đính kèm của khách hàng"
                            className="max-h-64 rounded-xl border border-slate-100 object-contain"
                          />
                        </a>
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

                {/* Pain Scale visualizer if available */}
                {selectedApt.vas_truoc !== null && selectedApt.vas_sau !== null && (
                  <div className="border border-slate-100 rounded-xl p-3.5 space-y-2 bg-white">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Kết quả lượng giá đau (VAS):</span>
                      <span className="text-slate-800 font-extrabold">
                        VAS {selectedApt.vas_truoc} (Trước) ➔ VAS {selectedApt.vas_sau} (Sau)
                      </span>
                    </div>
                    <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex items-center px-1">
                      <div
                        className="absolute h-2 bg-gradient-to-r from-teal-500 to-rose-500 rounded-full"
                        style={{
                          left: `${(selectedApt.vas_sau || 0) * 10}%`,
                          right: `${100 - (selectedApt.vas_truoc || 10) * 10}%`
                        }}
                      />
                      <span className="absolute text-[8px] font-bold text-teal-800 font-mono" style={{ left: `${(selectedApt.vas_sau || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                        ▲ {selectedApt.vas_sau}
                      </span>
                      <span className="absolute text-[8px] font-bold text-rose-800 font-mono" style={{ left: `${(selectedApt.vas_truoc || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                        ▲ {selectedApt.vas_truoc}
                      </span>
                    </div>
                  </div>
                )}

                {/* Diagnostics and Treatment journal */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                      <span className="text-[9px] font-bold text-teal-855 uppercase tracking-widest block">Chẩn đoán / Ghi chép trị liệu</span>
                      <p className="text-xs font-bold text-teal-950 leading-relaxed">
                        {selectedApt.chan_doan_tri_lieu || 'Đang chờ cập nhật chẩn đoán.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-3 bg-rose-50/20 border border-rose-100/30 rounded-xl">
                      <span className="text-[9px] font-bold text-rose-850 uppercase tracking-widest block flex items-center gap-1">
                        <AlertTriangle size={11} className="text-rose-500" /> Chống chỉ định lâm sàng
                      </span>
                      <p className="text-xs font-bold text-rose-955 leading-relaxed">
                        {selectedApt.chong_chi_dinh_tri_lieu || 'Không ghi nhận chống chỉ định.'}
                      </p>
                    </div>
                  </div>

                  {selectedApt.ghi_chu_tri_lieu && (
                    <div className="text-xs">
                      <span className="text-[9px] text-slate-400 block font-mono uppercase">Ghi chú & Chỉ định thêm</span>
                      <p className="text-slate-700 italic mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        "{selectedApt.ghi_chu_tri_lieu}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

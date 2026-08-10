import { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  PhoneCall,
  Stethoscope,
  Clock,
  CheckCircle2,
  User,
  Eye,
  CheckCircle,
  Sparkles,
  AlertCircle,
  BellRing,
  Play,
  Zap,
  Building2,
  Cpu,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { useAuthStore } from '../../../stores/authStore';
import { playCallInAudioChime } from '../../../utils/callInSignal';
import { callInPatient, markPatientAbsent } from '../api/doctor.api';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

function fmtMinutes(mins: number): string {
  if (mins <= 0) return '0p';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}p` : ''}` : `${m}p`;
}

export interface SpecialistAppointmentItem {
  id: string;
  ma_lich_dat?: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  gioi_tinh?: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc?: string;
  ly_do_kham?: string;
  trang_thai: string;
  trang_thai_thanh_toan?: string;
  ten_dich_vu?: string;
  bac_si_id?: number | null;
  nhan_su_id?: number | null;
  so_thu_tu_buoi?: number | null;
  tong_so_buoi_goi?: number | null;
  buoi?: 'sang' | 'chieu';
  thoi_gian_checkin?: string | null;
  thoi_gian_goi_vao?: string | null;
  thoi_gian_bat_dau?: string | null;
  thoi_luong_phut?: number;
  so_lan_goi_khong_co_mat?: number;
  so_thu_tu_hang_doi?: number | null;
  trang_thai_cu?: string;
  is_reassessment?: boolean;
  ten_phong?: string;
}

interface SpecialistFlowBoardProps {
  appointments: SpecialistAppointmentItem[];
  currentUserId: string | number;
  selectedDateStr: string;
  searchTerm?: string;
  onOpenDetailModal?: (apt: SpecialistAppointmentItem) => void;
  onRefresh?: () => void;
}

export function SpecialistFlowBoard({
  appointments,
  currentUserId,
  selectedDateStr,
  searchTerm = '',
  onOpenDetailModal,
  onRefresh,
}: SpecialistFlowBoardProps) {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isKtv = Number(user?.vai_tro_id) === 3;
  const basePath = isKtv ? '/technician/appointments' : '/doctor/appointments';
  const currentUserIdStr = String(currentUserId);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [confirmAbsentApt, setConfirmAbsentApt] = useState<SpecialistAppointmentItem | null>(null);
  const [openDeskConfirmApt, setOpenDeskConfirmApt] = useState<SpecialistAppointmentItem | null>(null);

  // Lấy thông tin phòng làm việc & danh sách thiết bị y tế tại phòng của nhân sự
  const [workstation, setWorkstation] = useState<{
    phong: { phong_id: number; ten_phong: string; ma_phong: string; gio_bat_dau: string; gio_ket_thuc: string } | null;
    thiet_bi: Array<{ id: string; ma_thiet_bi: string; ten_thiet_bi: string; trang_thai: string; ghi_chu?: string }>;
  } | null>(null);

  useEffect(() => {
    if (!isKtv) return;
    api.get('/technician/workstation-info')
      .then((res) => setWorkstation(res.data))
      .catch(() => {});
  }, [isKtv]);

  // Accordion Expand/Collapse states
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    da_checkin: true, // Mặc định mở nhóm "Đang chờ tại quầy"
    hoan_thanh: true,  // Mặc định mở nhóm "Đã hoàn thành"
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // QUY TẮC HIỂN THỊ CẨN MẬT (VISIBILITY FILTER):
  // 1. Chỉ lấy các ca của NGÀY ĐANG XEM (selectedDateStr).
  // 2. Ca đặt chọn "Bất kỳ" (nhan_su_id IS NULL) -> Hiển thị cho toàn bộ Chuyên viên trong ca.
  // 3. Ca đặt chọn đích danh Chuyên viên A (nhan_su_id = A) -> CHỈ Chuyên viên A thấy. Chuyên viên B KHÔNG THẤY!
  const doctorAppointments = useMemo(() => {
    const lower = searchTerm.trim().toLowerCase();

    return appointments.filter((apt) => {
      // Filter date
      const aptDateStr = format(new Date(apt.ngay_gio_bat_dau), 'yyyy-MM-dd');
      if (aptDateStr !== selectedDateStr) return false;

      // Filter Visibility
      const aptStaffId = apt.bac_si_id || apt.nhan_su_id;
      if (aptStaffId && String(aptStaffId) !== currentUserIdStr) {
        return false; // Lịch của Chuyên viên khác -> ẨN BỎ
      }

      // Filter Search
      if (lower) {
        const matchName = apt.ten_khach_hang?.toLowerCase().includes(lower);
        const matchCode = apt.ma_lich_dat?.toLowerCase().includes(lower);
        const matchPhone = apt.so_dien_thoai?.toLowerCase().includes(lower);
        if (!matchName && !matchCode && !matchPhone) return false;
      }

      return true;
    });
  }, [appointments, selectedDateStr, currentUserIdStr, searchTerm]);

  // Phân nhóm ca phục vụ cho Chuyên viên:
  // 1. ĐANG CHỜ TẠI QUẦY (Đã Check-in tại quầy Lễ tân)
  // Ưu tiên đẩy ca TÁI LƯỢNG GIÁ (`is_reassessment` hoặc `trang_thai_cu === 'cho_tai_luong_gia'`) LÊN ĐẦU HÀNG ĐỢI
  const waitingList = useMemo(() => {
    const rawList = doctorAppointments.filter(
      (a) => a.trang_thai === 'da_checkin' || a.trang_thai === 'check_in' || a.trang_thai === 'dang_kham'
    );

    return rawList.sort((a, b) => {
      const isReA = a.is_reassessment || a.trang_thai_cu === 'cho_tai_luong_gia';
      const isReB = b.is_reassessment || b.trang_thai_cu === 'cho_tai_luong_gia';
      if (isReA && !isReB) return -1;
      if (!isReA && isReB) return 1;

      // Đúng nguyên tắc hàng đợi đã chốt: sắp theo `thoi_gian_checkin`. Khách bị "Không vào" (B11)
      // đã được backend tự cập nhật lại mốc này thành NOW() nên tự động rơi xuống cuối — không cần
      // tie-break riêng theo đếm gọi hụt nữa.
      const checkinA = a.thoi_gian_checkin ? new Date(a.thoi_gian_checkin).getTime() : 0;
      const checkinB = b.thoi_gian_checkin ? new Date(b.thoi_gian_checkin).getTime() : 0;
      return checkinA - checkinB;
    });
  }, [doctorAppointments]);

  // 2. ĐÃ HOÀN THÀNH HÔM NAY
  const completedList = useMemo(
    () => doctorAppointments.filter((a) => a.trang_thai === 'hoan_thanh'),
    [doctorAppointments]
  );

  // Phát tín hiệu Gọi vào phòng — B2/B19: ghi nhận thật ở server (thoi_gian_goi_vao, và gán nhân
  // sự nếu ca đang "Bất kỳ") rồi mới phát chuông/toast bằng tên phòng + tên nhân sự THẬT trả về.
  // Không còn phát qua localStorage/BroadcastChannel (chỉ hoạt động cùng 1 trình duyệt) — Lễ tân ở
  // máy khác nhận biết qua polling danh sách lịch hẹn (đã có sẵn, xem TodayFlowBoard), đọc thẳng
  // `thoi_gian_goi_vao` vừa ghi ở đây.
  const handleCallInSignal = async (apt: SpecialistAppointmentItem) => {
    if (pendingActionId) return;
    setPendingActionId(apt.id);
    try {
      const { data } = await callInPatient(apt.id);
      playCallInAudioChime();
      const roomSuffix = data.ten_phong ? ` vào ${data.ten_phong}` : '';
      toast.success(`🔊 Đã mời ${apt.ten_khach_hang}${roomSuffix}!`);
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gọi bệnh nhân — vui lòng thử lại.');
    } finally {
      setPendingActionId(null);
    }
  };

  // B11 — bấm "Không vào": lần 1 (đếm hiện tại = 0) xử lý êm không hỏi lại; lần 2 (đếm hiện tại = 1)
  // bắt buộc xác nhận vì đây là hành động khó đảo ngược (chuyển "Không đến", mất tiền nếu đã thanh
  // toán + cộng no-show).
  const handleMarkAbsentClick = (apt: SpecialistAppointmentItem) => {
    if (pendingActionId) return;
    if ((apt.so_lan_goi_khong_co_mat || 0) >= 1) {
      setConfirmAbsentApt(apt);
      return;
    }
    void runMarkAbsent(apt);
  };

  const runMarkAbsent = async (apt: SpecialistAppointmentItem) => {
    setPendingActionId(apt.id);
    try {
      const { data } = await markPatientAbsent(apt.id);
      if (data.shouldFinalize) {
        toast.success(`Đã đánh dấu ${apt.ten_khach_hang} KHÔNG ĐẾN.`);
      } else {
        toast(`Đã đẩy ${apt.ten_khach_hang} xuống cuối hàng đợi — gọi lại khi rảnh.`, { icon: '⚠️' });
      }
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật — vui lòng thử lại.');
    } finally {
      setPendingActionId(null);
    }
  };

  // Mở Bàn Tư Vấn / Lượng Giá Riêng / Bàn Trị Liệu KTV
  const handleOpenAssessmentDesk = (apt: SpecialistAppointmentItem) => {
    if (apt.trang_thai === 'dang_kham' || apt.trang_thai === 'cho_tai_luong_gia') {
      navigate(`${basePath}/${apt.id}/assess`);
      return;
    }
    setOpenDeskConfirmApt(apt);
  };

  return (
    <div className="space-y-6">

      {/* THÔNG TIN PHÒNG TRỰC & THIẾT BỊ Y TẾ TẠI PHÒNG (CHỈ HIỂN THỊ CHO KTV) */}
      {isKtv && workstation?.phong && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black uppercase tracking-wider font-jakarta text-white">
                    🏢 {workstation.phong.ten_phong}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {workstation.phong.ma_phong}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 font-medium">
                  Ca trực hôm nay: <span className="font-bold text-white">{workstation.phong.gio_bat_dau} - {workstation.phong.gio_ket_thuc}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 bg-indigo-950/80 px-3.5 py-1.5 rounded-2xl border border-indigo-500/30">
              <Cpu size={16} className="text-teal-400" />
              <span>{workstation.thiet_bi?.length || 0} Thiết bị có sẵn</span>
            </div>
          </div>

          {/* Danh sách thiết bị y tế có sẵn tại phòng */}
          {workstation.thiet_bi && workstation.thiet_bi.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mr-1">Trang thiết bị tại phòng:</span>
              {workstation.thiet_bi.map(tb => {
                const isBaoTri = tb.trang_thai === 'dang_bao_tri';
                const isDangSuDung = tb.trang_thai === 'dang_su_dung';
                return (
                  <div
                    key={tb.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isBaoTri
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : isDangSuDung
                          ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40'
                          : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
                    }`}
                  >
                    <span>{isBaoTri ? '⚠️' : isDangSuDung ? '⚡' : '✅'}</span>
                    <span>{tb.ten_thiet_bi}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                      isBaoTri
                        ? 'bg-amber-500/20 text-amber-200'
                        : isDangSuDung
                          ? 'bg-cyan-500/20 text-cyan-100'
                          : 'bg-emerald-500/20 text-emerald-100'
                    }`}>
                      {isBaoTri ? 'Bảo trì' : isDangSuDung ? 'Đang dùng' : 'Sẵn sàng'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-indigo-300/70 italic">Phòng này chưa có thiết bị y tế gán cố định.</p>
          )}
        </div>
      )}

      {/* 2 THẺ KPI TẬP TRUNG NGHIỆP VỤ CHO CHUYÊN VIÊN PHCN & KTV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thẻ 1: Đang chờ tại quầy (bao gồm cả Tái lượng giá ưu tiên) */}
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🟡 BỆNH NHÂN ĐANG CHỜ TẠI QUẦY</span>
            </p>
            <h4 className="text-3xl font-black text-slate-900 dark:text-zinc-100">
              {waitingList.length} <span className="text-xs font-bold text-slate-500">bệnh nhân</span>
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Đã check-in tại quầy Lễ tân, sẵn sàng gọi vào tư vấn
            </p>
          </div>
          <div className="size-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock size={28} />
          </div>
        </div>

        {/* Thẻ 2: Đã hoàn thành hôm nay */}
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🟢 ĐÃ HOÀN THÀNH HÔM NAY</span>
            </p>
            <h4 className="text-3xl font-black text-slate-900 dark:text-zinc-100">
              {completedList.length} <span className="text-xs font-bold text-slate-500">ca</span>
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Đã kết thúc lượng giá & ra chỉ định thành công
            </p>
          </div>
          <div className="size-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle size={28} />
          </div>
        </div>
      </div>

      {/* DANH SÁCH HÀNG ĐỢI PHỤC VỤ (CHỈ CÓ ĐANG CHỜ & HOÀN THÀNH) */}
      <div className="space-y-4">
        {/* GROUP 1: BỆNH NHÂN ĐANG CHỜ TẠI QUẦY (ĐÃ CHECK-IN) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleGroup('da_checkin')}
            className="w-full p-4.5 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {openGroups.da_checkin ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span className="font-heading text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                🟡 BỆNH NHÂN ĐANG CHỜ TẠI QUẦY ({waitingList.length})
              </span>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                — Đã check-in tại quầy, sẵn sàng gọi vào bàn làm việc
              </span>
            </div>
          </button>

          {openGroups.da_checkin && (
            <div className="p-4 space-y-3">
              {waitingList.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="size-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                    <Clock size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                    Hiện không có bệnh nhân nào đang chờ trong hàng đợi.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {waitingList.map((apt) => {
                    {
                      const assignedStaffId = apt.bac_si_id || apt.nhan_su_id || (apt as any).chuyen_gia_id;
                      const isAssignedToMe = Boolean(
                        assignedStaffId &&
                        currentUserIdStr &&
                        String(assignedStaffId) !== 'null' &&
                        String(assignedStaffId) !== 'undefined' &&
                        String(assignedStaffId) === String(currentUserIdStr)
                      );
                      const isReassessment = apt.is_reassessment || apt.trang_thai_cu === 'cho_tai_luong_gia';

                      return (
                        <div
                          key={apt.id}
                          className={`py-3.5 px-3 rounded-2xl transition-all flex flex-wrap items-center justify-between gap-4 ${
                            isReassessment
                              ? 'bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 my-1'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`size-11 rounded-2xl flex items-center justify-center font-black text-xs ${
                                isReassessment
                                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {isReassessment ? <Sparkles size={20} /> : <User size={20} />}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Số thứ tự hàng đợi TRONG NGÀY — riêng cho nhóm Lượng giá, không lẫn
                                    với số thứ tự của nhóm Điều trị/dịch vụ lẻ (mỗi nhóm 1 dãy số bắt đầu
                                    từ 1, gán lúc Lễ tân check-in — xem phien_lam_viec.so_thu_tu_hang_doi) */}
                                {apt.so_thu_tu_hang_doi != null && (
                                  <span className="size-6 rounded-lg bg-slate-800 dark:bg-zinc-700 text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0">
                                    {apt.so_thu_tu_hang_doi}
                                  </span>
                                )}
                                <h5 className="font-black text-sm text-slate-900 dark:text-zinc-100">
                                  {apt.ten_khach_hang}
                                </h5>

                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                  {apt.ma_lich_dat || `LH-${apt.id}`}
                                </span>

                                {/* NHÃN ƯU TIÊN TÁI LƯỢNG GIÁ TỰ ĐỘNG BẬT KHI LỄ TÂN CHECK-IN LẠI CA CŨ */}
                                {isReassessment && (
                                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white flex items-center gap-1 animate-pulse">
                                    <Sparkles size={11} />
                                    <span>🔄 TÁI LƯỢNG GIÁ - ƯU TIÊN GỌI</span>
                                  </span>
                                )}

                                {isAssignedToMe ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                                    Đích danh bạn
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                    Hàng đợi chung (Bất kỳ)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center flex-wrap gap-x-2 gap-y-1">
                                <span>{apt.ten_dich_vu || 'Khám lâm sàng & Lượng giá PHCN'} · SĐT: {apt.so_dien_thoai || '---'}</span>
                                {(() => {
                                  if (apt.trang_thai !== 'da_checkin') return null;
                                  const waitMinutes = apt.thoi_gian_checkin
                                    ? Math.max(0, Math.round((Date.now() - new Date(apt.thoi_gian_checkin).getTime()) / 60000))
                                    : null;
                                  if (waitMinutes === null) return null;
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/60 px-2 py-0.5 rounded-md border border-amber-200/70 dark:border-amber-900/50 shadow-2xs">
                                      <Clock size={11} /> Chờ {fmtMinutes(waitMinutes)}
                                    </span>
                                  );
                                })()}
                              </p>

                              {/* B11 — cảnh báo thường trực về số lần gọi không có mặt */}
                              {((apt.so_lan_goi_khong_co_mat || 0) > 0 || !!apt.thoi_gian_goi_vao) && (() => {
                                const missedCount = apt.so_lan_goi_khong_co_mat || 0;
                                const isCallingNow = !!apt.thoi_gian_goi_vao;
                                const currentCallNum = isCallingNow ? missedCount + 1 : missedCount;
                                if (currentCallNum === 0) return null;

                                return (
                                  <p className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                                    <AlertCircle size={11} />
                                    <span>
                                      {currentCallNum >= 2
                                        ? `Đã gọi lần ${currentCallNum} — Cân nhắc vắng mặt (Không đến)`
                                        : `Đã gọi lần 1`}
                                    </span>
                                  </p>
                                );
                              })()}

                              {/* Cảnh báo ca đang mở quá giờ dự kiến */}
                              {apt.trang_thai === 'dang_kham' && apt.thoi_gian_bat_dau && (() => {
                                const startTime = new Date(apt.thoi_gian_bat_dau).getTime();
                                const duration = Number(apt.thoi_luong_phut) || (apt as any).thoi_gian_phut || 30;
                                const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
                                if (elapsedMinutes <= duration) return null;

                                return (
                                  <p className="text-[10.5px] font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 bg-rose-50 dark:bg-rose-955/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50 w-fit animate-pulse">
                                    <AlertCircle size={11} />
                                    <span>Ca quá giờ dự kiến ({elapsedMinutes}/{duration}p)</span>
                                  </p>
                                );
                              })()}
                            </div>
                          </div>

                          {/* CÁC NÚT THAO TÁC CỦA CHUYÊN VIÊN */}
                          <div className="flex items-center gap-2">
                            {apt.trang_thai !== 'dang_kham' && (
                              apt.thoi_gian_goi_vao ? (
                                <>
                                  <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-955/40 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-200/80 dark:border-amber-800/60 select-none cursor-default">
                                    <BellRing size={14} className="animate-pulse text-amber-500" />
                                    <span>
                                      {(apt.so_lan_goi_khong_co_mat || 0) > 0
                                        ? `🔔 Đã gọi lần ${(apt.so_lan_goi_khong_co_mat || 0) + 1} lúc ${format(new Date(apt.thoi_gian_goi_vao), 'HH:mm')}`
                                        : `🔔 Đã phát tín hiệu gọi vào lúc ${format(new Date(apt.thoi_gian_goi_vao), 'HH:mm')}`}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAbsentClick(apt)}
                                    disabled={pendingActionId === apt.id}
                                    className="px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <AlertCircle size={14} />
                                    <span>Không vào</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCallInSignal(apt)}
                                  disabled={pendingActionId === apt.id}
                                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                >
                                  <PhoneCall size={14} />
                                  <span>
                                    {(apt.so_lan_goi_khong_co_mat || 0) > 0
                                      ? `📞 GỌI LẠI (Lần ${(apt.so_lan_goi_khong_co_mat || 0) + 1})`
                                      : '📞 GỌI VÀO'}
                                  </span>
                                </button>
                              )
                            )}

                            {(() => {
                              // Đọc thẳng trạng thái thật từ server (đã refetch mỗi 8s) — KHÔNG còn
                              // qua localStorage (C16): 1 khóa chia sẻ không đủ chỗ cho 2 bàn KTV
                              // (A1b) và không đồng bộ được giữa các thiết bị/tab khác nhau.
                              const isCurrentInDesk = Boolean(
                                (apt.trang_thai === 'dang_kham' || apt.trang_thai === 'cho_tai_luong_gia') && isAssignedToMe
                              );

                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssessmentDesk(apt)}
                                  className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                                    isCurrentInDesk
                                      ? 'bg-[#0d9488] hover:bg-[#0b7970] shadow-teal-600/20 ring-2 ring-teal-400/50 animate-pulse-subtle'
                                      : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'
                                  }`}
                                >
                                  <Stethoscope size={14} />
                                  <span>{isCurrentInDesk ? '🩺 QUAY LẠI BÀN' : '🩺 MỞ BÀN'}</span>
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* GROUP 2: BỆNH NHÂN ĐÃ HOÀN THÀNH HÔM NAY */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleGroup('hoan_thanh')}
            className="w-full p-4.5 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-200/50 dark:border-emerald-900/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {openGroups.hoan_thanh ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span className="font-heading text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                🟢 BỆNH NHÂN ĐÃ HOÀN THÀNH HÔM NAY ({completedList.length})
              </span>
            </div>
          </button>

          {openGroups.hoan_thanh && (
            <div className="p-4 space-y-3">
              {completedList.length === 0 ? (
                <p className="text-xs text-center py-6 font-bold text-slate-400 dark:text-zinc-500">
                  Chưa có ca nào hoàn thành hôm nay.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {completedList.map((apt) => (
                    <div key={apt.id} className="py-3 px-2 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                            {apt.ten_khach_hang}
                          </h5>
                          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                            Đã hoàn thành lượng giá & chỉ định thành công
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDetailModal?.(apt)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>👁 XEM HỒ SƠ</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmAbsentApt}
        title="Xác nhận KHÔNG ĐẾN"
        message={
          confirmAbsentApt
            ? `${confirmAbsentApt.ten_khach_hang} đã được gọi 2 lần nhưng không vào. Xác nhận sẽ chuyển ca này sang "Không đến" — khách sẽ mất tiền (nếu đã thanh toán) và bị cộng 1 lần no-show. Tiếp tục?`
            : ''
        }
        type="danger"
        confirmLabel="Xác nhận Không đến"
        cancelLabel="Để sau"
        onConfirm={() => {
          if (confirmAbsentApt) void runMarkAbsent(confirmAbsentApt);
          setConfirmAbsentApt(null);
        }}
        onCancel={() => setConfirmAbsentApt(null)}
      />

      {/* MODAL XÁC NHẬN BỆNH NHÂN ĐÃ VÀO PHÒNG TRƯỚC KHI MỞ BÀN */}
      {openDeskConfirmApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto font-bold text-2xl shadow-inner border border-emerald-500/30">
              {isKtv ? <Zap size={34} /> : <Stethoscope size={34} />}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                {isKtv ? 'Xác nhận khách đã vào phòng trị liệu?' : 'Xác nhận khách đã vào phòng?'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold leading-relaxed">
                Vui lòng xác nhận bệnh nhân <span className="font-black text-emerald-600 dark:text-emerald-400">{openDeskConfirmApt.ten_khach_hang}</span>
                {openDeskConfirmApt.so_thu_tu_hang_doi != null && <span className="font-black text-amber-600 dark:text-amber-400"> (STT {openDeskConfirmApt.so_thu_tu_hang_doi})</span>} đã có mặt trong phòng trước khi chính thức {isKtv ? 'mở bàn trị liệu và tạo nhật ký kỹ thuật thủ công.' : 'mở bàn làm việc và tạo nhật ký điều trị.'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpenDeskConfirmApt(null)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
              >
                Chưa vào — Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const aptId = openDeskConfirmApt.id;
                  setOpenDeskConfirmApt(null);
                  navigate(`${basePath}/${aptId}/assess`);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play size={16} /> {isKtv ? '⚡ Khách đã vào — Bắt đầu trị liệu' : '✅ Khách đã vào — Mở bàn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

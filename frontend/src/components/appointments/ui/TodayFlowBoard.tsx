import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone, User2, Clock3, CheckCircle2, DollarSign, Eye, Users, Activity, Sun, Moon, Check, Volume2, ArrowDownCircle, UserX, AlertCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment, Staff } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { statusConfig } from '../../appointmentStatusConfig';
import { isAwaitingPaymentForList, isPaymentDue } from '../../../utils/billing';
import { getSmartSearchScore } from '../../../utils/smartSearch';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { ConfirmDialog } from '../../ConfirmDialog';
import { playCallInAudioChime } from '../../../utils/callInSignal';
import { useAuthStore } from '../../../stores/authStore';

/** Custom Dropdown chọn nhân sự có ảnh đại diện (avatar) siêu đẹp */
function StaffSelectDropdown({
  value,
  options,
  staffList,
  onChange,
  roleLabel
}: {
  value: string | number | null;
  options: Array<{ id: string | number; name: string; avatarUrl?: string; avatar_url?: string }>;
  staffList: Staff[];
  onChange: (id: string | number | null) => void;
  roleLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const getStaffAvatar = (staffId: string | number, optionAvatar?: string) => {
    if (optionAvatar) return resolveImageUrl(optionAvatar);
    const found = staffList.find(s => String(s.id) === String(staffId)) as any;
    if (found) {
      const url = found.anh_dai_dien || found.avatar_url || found.avatarUrl;
      if (url) return resolveImageUrl(url);
    }
    return null;
  };

  const selectedOption = options.find(o => String(o.id) === String(value));
  const selectedAvatar = value ? getStaffAvatar(value, selectedOption?.avatarUrl || selectedOption?.avatar_url) : null;

  return (
    <div ref={wrapperRef} className="relative shrink-0 w-full lg:w-72 rounded-2xl border p-4 bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100 truncate">
          LỌC THEO {roleLabel.toUpperCase()}
        </span>
        <span className="text-[9px] font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200/60 font-black shrink-0">
          {options.length} NHÂN SỰ
        </span>
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl hover:border-teal-500/50 transition-all cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {!value ? (
            <div className="size-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-[#0d9488] dark:text-teal-400 flex items-center justify-center shrink-0 font-bold border border-teal-200/50">
              <Users size={16} />
            </div>
          ) : selectedAvatar ? (
            <img
              src={selectedAvatar}
              alt={selectedOption?.name}
              className="size-8 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-zinc-700"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          ) : (
            <div className="size-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {(selectedOption?.name || 'N').trim().split(/\s+/).pop()?.[0] || 'N'}
            </div>
          )}

          <div className="min-w-0">
            <span className="block text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
              {value ? selectedOption?.name : `Tất cả ${roleLabel}`}
            </span>
            <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-bold truncate">
              {value ? roleLabel : 'Xem toàn bộ danh sách'}
            </span>
          </div>
        </div>

        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
          <button
            type="button"
            onClick={() => { onChange(null); setIsOpen(false); }}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left cursor-pointer ${
              !value ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0d9488] font-black' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-teal-100/70 dark:bg-teal-900/50 text-[#0d9488] flex items-center justify-center font-bold text-xs">
                <Users size={14} />
              </div>
              <span className="text-xs font-bold">Tất cả {roleLabel}</span>
            </div>
            {!value && <Check size={14} className="text-[#0d9488]" />}
          </button>

          <div className="h-[1px] bg-slate-100 dark:bg-zinc-800 my-1" />

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = String(opt.id) === String(value);
              const avatar = getStaffAvatar(opt.id, opt.avatarUrl || opt.avatar_url);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onChange(opt.id); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left cursor-pointer ${
                    isSelected ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0d9488]' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={opt.name}
                        className="size-7 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="size-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {opt.name.trim().split(/\s+/).pop()?.[0] || 'N'}
                      </div>
                    )}
                    <span className="text-xs font-bold truncate">{opt.name}</span>
                  </div>

                  {isSelected && <Check size={14} className="text-[#0d9488] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const BUOI_LABEL: Record<string, string> = { sang: 'Sáng', chieu: 'Chiều' };
const BUOI_WINDOW: Record<'sang' | 'chieu', { start: number; end: number }> = {
  // Phút trong ngày (0-1439), khớp GIO_NHAN_KHACH backend (7h30-12h00 / 12h00-19h30).
  sang: { start: 7 * 60 + 30, end: 12 * 60 },
  chieu: { start: 12 * 60, end: 19 * 60 + 30 },
};

const TERMINAL_STATUSES = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'];



interface TodayFlowBoardProps {
  /** TOÀN BỘ lịch hẹn của ngày đang xem (cả khám lẫn điều trị, chưa lọc activeType) — widget Sức
   * khỏe ca cần nhìn cả 2 túi vai trò cùng lúc, không phụ thuộc tab đang xem. Board này dùng cho MỌI
   * ngày (không chỉ hôm nay), xem ghi chú date-awareness ở useSucKhoeCa. */
  appointments: Appointment[];
  activeType: 'kham' | 'dieu_tri';
  searchTerm: string;
  staffList: Staff[];
  schedulesList: any[];
  selectedDateStr: string;
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
  /** B11 (bản Lễ tân) — đẩy khách xuống cuối hàng đợi (đi vệ sinh/bỏ về tạm...), KHÔNG đổi trạng
   * thái, chỉ tăng đếm gọi hụt + reset thoi_gian_checkin. Optional để không phá các nơi khác đang
   * dùng TodayFlowBoard mà chưa nối 2 hành động mới này. */
  onPushBack?: (apt: Appointment) => void;
  /** Lễ tân tự tay chuyển "Không đến" cho ca ĐÃ check-in — dùng khi đã gọi/đẩy nhiều lần mà khách
   * vẫn không xuất hiện, không cần chờ quét tự động cuối buổi (B10). */
  onMarkNoShow?: (apt: Appointment) => void;
  onOpenWalkInModal: () => void;
  /** Lịch hẹn đích của 1 deep-link (mascot notification, v.v.) — nhóm mặc định thu gọn (Xong/Ngoại
   * lệ) phải tự mở nếu chứa đúng lịch này, nếu không `scrollToAppointment` sẽ không tìm thấy DOM
   * element vì nhóm thu gọn không render con (xem lỗi "Không tìm thấy ca hẹn trên bảng lịch trình"). */
  focusAppointmentId?: string;
  /** Admin có bộ lọc "chỉ xem lịch của 1 nhân sự" — chỉ thu hẹp danh sách dòng, KHÔNG áp lên widget
   * Sức khỏe ca (widget đó đọc sức khỏe của CẢ ca, lọc theo 1 người sẽ làm sai ý nghĩa "còn bao
   * nhiêu chỗ trống của toàn ca"). Lễ tân không có bộ lọc này → luôn undefined. */
  staffFilterId?: string | null;
  /** Danh sách nhân sự (đúng vai trò của tab đang xem) để đổ vào dropdown lọc — CHỈ Admin truyền
   * (Lễ tân không có quyền này). Không truyền hoặc mảng rỗng → không render dropdown. */
  staffFilterOptions?: Array<{ id: string; name: string }>;
  onStaffFilterChange?: (id: string | null) => void;
  onOpenWorkloadModal?: () => void;
  /** Giải phóng chỉ định nhân sự đích danh, chuyển về Hàng đợi chung (nhan_su_id = null) khi nhân sự bị tắc ca */
  onUnassign?: (apt: Appointment) => void;
  /** Component thanh bộ lọc & chuyển tab lịch lượng giá / điều trị (Ảnh 1) gộp chung vào cùng card */
  filterBar?: React.ReactNode;
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function fmtMinutes(mins: number): string {
  if (mins <= 0) return '0p';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}p` : ''}` : `${m}p`;
}

/** Widget "Sức khỏe ca" (B21) — bản rút gọn: công suất còn lại suy từ ca trực trong ngày (chưa nhân
 * số bàn song song, mặc định an toàn = 1 khách/nhân sự), nhu cầu suy từ tổng thời lượng các ca đã
 * check-in/đang làm nhưng chưa xong. Không tính "hạn đến muộn nhất" (B22) — để làm sau, cần thêm
 * tham số giờ đóng cửa chưa có ở frontend.
 *
 * Board này giờ dùng cho MỌI ngày (không chỉ hôm nay — xem TodayFlowBoard), nên "còn lại" chỉ được
 * cắt theo giờ hiện tại (nowMins) khi ngày đang xem ĐÚNG LÀ hôm nay — xem ngày khác mà vẫn lấy
 * nowMins làm mốc dưới sẽ tính sai (vd 20h tối nay xem lịch NGÀY MAI sẽ ra "còn 0 phút" cho mọi ca,
 * dù ngày mai chưa bắt đầu). */
function useSucKhoeCa(appointments: Appointment[], staffList: Staff[], schedulesList: any[], selectedDateStr: string, activeType: 'kham' | 'dieu_tri') {
  return useMemo(() => {
    const now = new Date();
    const nowMins = minutesOfDay(now);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = selectedDateStr === todayStr;
    const isPastDate = selectedDateStr < todayStr;

    const staffById = new Map(staffList.map((s) => [String(s.id), s]));

    const isRoleMatch = (staff: any, sch: any, roleKey: string) => {
      const roleId = Number(staff?.vai_tro_id || sch?.vai_tro_id);
      const roleName = String(staff?.vai_tro || sch?.vai_tro || '');
      if (roleKey === 'Bác sĩ' || roleKey === 'chuyen_vien') {
        return roleId === 4 || roleName === 'Chuyên viên PHCN' || roleName === 'Bác sĩ';
      }
      if (roleKey === 'Kỹ thuật viên' || roleKey === 'ktv') {
        return roleId === 3 || roleName === 'Kỹ thuật viên';
      }
      return false;
    };

    const capacityFor = (vaiTro: string, buoi: 'sang' | 'chieu') => {
      const win = BUOI_WINDOW[buoi];
      let total = 0;
      schedulesList.forEach((sch: any) => {
        if (sch.ngay !== selectedDateStr || sch.trang_thai !== 'hoat_dong') return;
        const staff = staffById.get(String(sch.nguoi_dung_id));
        if (!isRoleMatch(staff, sch, vaiTro)) return;
        const [sh, sm] = String(sch.gio_bat_dau).split(':').map(Number);
        const [eh, em] = String(sch.gio_ket_thuc).split(':').map(Number);
        const shiftStart = sh * 60 + sm;
        const shiftEnd = eh * 60 + em;
        const from = isToday ? Math.max(nowMins, shiftStart, win.start) : Math.max(shiftStart, win.start);
        const to = Math.min(shiftEnd, win.end);
        const parallelMultiplier = Number((staff as any)?.so_khach_song_song) || (isRoleMatch(staff, sch, 'ktv') ? 2 : 1);
        total += Math.max(0, (to - from) * parallelMultiplier);
      });
      return total;
    };

    const demandFor = (vaiTro: string, buoi: 'sang' | 'chieu') => {
      const isKham = vaiTro === 'Bác sĩ';
      let total = 0;
      appointments.forEach((apt) => {
        if (apt.buoi !== buoi) return;
        if (!['da_checkin', 'dang_kham'].includes(apt.trang_thai)) return;
        const matchNhom = isKham ? apt.loai_lich === 'kham_moi' : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
        if (!matchNhom) return;
        total += Number(apt.thoi_luong_phut) || 30;
      });
      return total;
    };

    const buoiList: Array<'sang' | 'chieu'> = ['sang', 'chieu'];
    // Chỉ hiện túi vai trò khớp tab đang xem — Lịch khám dùng túi Chuyên viên, Lịch điều trị dùng
    // túi KTV (2 túi độc lập, xem "Tách túi theo vai trò" trong kế hoạch). Hiện cả 2 khi đang xem
    // tab không liên quan chỉ gây nhiễu, không giúp Lễ tân hành động được gì.
    const roles: Array<{ key: string; label: string }> =
      activeType === 'kham'
        ? [{ key: 'Bác sĩ', label: 'Chuyên viên' }]
        : [{ key: 'Kỹ thuật viên', label: 'KTV' }];

    return buoiList.map((buoi) => ({
      buoi,
      label: BUOI_LABEL[buoi],
      isCurrent: isToday && nowMins >= BUOI_WINDOW[buoi].start && nowMins < BUOI_WINDOW[buoi].end,
      isPast: isPastDate || (isToday && nowMins >= BUOI_WINDOW[buoi].end),
      roles: roles.map((r) => {
        const capacity = capacityFor(r.key, buoi);
        const demand = demandFor(r.key, buoi);
        return { label: r.label, capacity, demand, over: demand > capacity && capacity >= 0 };
      }),
    }));
  }, [appointments, staffList, schedulesList, selectedDateStr, activeType]);
}

/** Badge thanh toán — PHẢI dùng isPaymentDue (toán học thanh toán thuần túy), KHÔNG dùng
 * isAwaitingPaymentForList: hàm đó cố ý coi "chưa hoàn thành = không cần báo" (dùng cho danh sách
 * nhắc riêng của Lễ tân), nên trước khi hoàn thành nó luôn trả false — khiến badge hiện "Đã thu"
 * giả cho MỌI lịch chưa xong dù chưa thu đồng nào. Badge hiển thị ở đây cần đúng trạng thái thật
 * tại mọi thời điểm (A10c: "hai chỉ báo nằm cạnh nhau" — badge không được nói dối để đợi 1 điều
 * kiện khác). */
function PaymentBadge({ apt }: { apt: Appointment }) {
  // A15 — giao dịch PayOS đang treo (đã tạo link, chưa có webhook xác nhận) phải nói thật thay vì
  // báo "Chưa thu" khiến khách/Lễ tân hoảng và thu trùng — xem mục "dang_cho_thanh_toan" trong kế hoạch.
  if (apt.trang_thai_thanh_toan === 'dang_cho_thanh_toan') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border border-amber-150 dark:border-amber-900/30 whitespace-nowrap">
        ⏳ Đang xác nhận
      </span>
    );
  }
  const due = isPaymentDue(apt);
  if (due) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-150 dark:border-rose-900/30 whitespace-nowrap">
        ⚠ Chưa thu
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450 border border-emerald-150 dark:border-emerald-900/30 whitespace-nowrap">
      ✓ Đã thu
    </span>
  );
}

function StaffCell({ apt, staffList }: { apt: Appointment; staffList: Staff[] }) {
  const name = apt.ten_ky_thuat_vien;
  if (!name) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="size-6 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <User2 size={11} className="text-slate-350 dark:text-zinc-600" />
        </div>
        <span className="text-[10px] text-slate-400 dark:text-zinc-550 italic">Bất kỳ</span>
      </div>
    );
  }
  const staff = staffList.find((s) => String(s.id) === String(apt.bac_si_id));
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {staff?.anh_dai_dien ? (
        <img
          src={resolveImageUrl(staff.anh_dai_dien)}
          alt={name}
          className="size-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-700"
        />
      ) : (
        <div className="size-6 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 flex items-center justify-center text-[9px] font-black shrink-0">
          {/* Chữ cái đầu của TÊN (từ cuối trong tên đầy đủ kiểu Việt), không phải ký tự cuối chuỗi */}
          {(name.trim().split(/\s+/).pop() || name)[0]}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">{name}</p>
        {apt.ten_phong && (
          <p className="text-[9px] text-slate-400 dark:text-zinc-550 truncate">{apt.ten_phong}</p>
        )}
      </div>
    </div>
  );
}

type RowVariant = 'chua_den' | 'dang_cho' | 'dang_lam' | 'xong' | 'ngoai_le';

function AppointmentRow({
  apt,
  variant,
  staffList,
  allAppointments = [],
  onOpenDetailModal,
  onQuickCheckin,
  onPushBack,
  onMarkNoShow,
  onUnassign,
  focusAppointmentId,
}: {
  apt: Appointment;
  variant: RowVariant;
  staffList: Staff[];
  allAppointments?: Appointment[];
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
  onPushBack?: (apt: Appointment) => void;
  onMarkNoShow?: (apt: Appointment) => void;
  onUnassign?: (apt: Appointment) => void;
  focusAppointmentId?: string;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const billingRoute = user?.vai_tro_id === 2 ? '/receptionist/billing' : '/admin/quick-billing';
  const meta = statusConfig[apt.trang_thai] || { label: apt.trang_thai, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
  const isPackageSession = Boolean(apt.so_thu_tu_buoi || (apt as any).phac_do_dieu_tri_id || apt.loai_goi === 'LIEU_TRINH');
  const waitMinutes = apt.thoi_gian_checkin
    ? Math.max(0, Math.round((Date.now() - new Date(apt.thoi_gian_checkin).getTime()) / 60000))
    : null;

  const isCalledIn = !!apt.thoi_gian_goi_vao && apt.trang_thai === 'da_checkin';
  const missedCalls = apt.so_lan_goi_khong_co_mat || 0;
  
  // Highlight màu vàng nổi bật & hiệu ứng nổi nhẹ nhàng khi mascot/liên kết điều hướng tới lịch
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (focusAppointmentId && String(apt.id) === String(focusAppointmentId)) {
      setHighlighted(true);
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(`appointment-card-${apt.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const fadeTimer = setTimeout(() => {
        setHighlighted(false);
      }, 4500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(fadeTimer);
      };
    } else {
      setHighlighted(false);
    }
  }, [focusAppointmentId, apt.id]);

  return (
    <div
      id={`appointment-card-${apt.id}`}
      className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 last:border-b-0 transition-all duration-700 ease-out ${
        highlighted
          ? 'relative z-20 -translate-y-1.5 scale-[1.015] bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 dark:from-amber-950/80 dark:via-amber-900/60 dark:to-amber-950/80 border-amber-400 dark:border-amber-500 ring-4 ring-amber-400/40 dark:ring-amber-500/30 shadow-2xl shadow-amber-500/25 rounded-2xl my-1.5'
          : isCalledIn
            ? 'bg-amber-50/90 dark:bg-amber-955/40 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/80 shadow-md'
            : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
      }`}
    >
        {/* Buổi + trạng thái */}
        <div className="w-[110px] shrink-0 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              {apt.buoi ? BUOI_LABEL[apt.buoi] : '—'}
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border w-fit shadow-2xs ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </span>
        </div>

        {/* Khách hàng */}
        <div className="w-[180px] shrink-0 min-w-0 flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="size-9 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center border border-slate-200/60 dark:border-zinc-700 shadow-2xs">
              {(apt.ten_khach_hang || apt.ho_ten_khach || 'K').trim().split(/\s+/).pop()?.[0] || 'K'}
            </div>
            {/* Số thứ tự hàng đợi TRONG NGÀY — chỉ hiển thị khi ĐANG CHỜ hoặc ĐANG KHÁM, tự ẩn khi XONG */}
            {apt.so_thu_tu_hang_doi != null && apt.trang_thai !== 'hoan_thanh' && (
              <span className="absolute -top-2 -left-2 size-6 rounded-full bg-slate-800 dark:bg-zinc-600 text-white font-mono font-black text-[11px] flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 shadow-sm">
                {apt.so_thu_tu_hang_doi}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">{apt.ten_khach_hang || apt.ho_ten_khach}</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {apt.so_dien_thoai}
            </p>
          </div>
        </div>

      {/* Dịch vụ / gói */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            {apt.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}
          </span>
          {((apt as any).is_reassessment || (apt as any).trang_thai_cu === 'cho_tai_luong_gia' || apt.trang_thai === 'cho_tai_luong_gia') && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-2xs shrink-0">
              <Sparkles size={11} /> 🔄 TÁI LƯỢNG GIÁ
            </span>
          )}
          {isPackageSession && (
            <span className="text-[10px] font-black text-[#0d766e] dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-teal-200/50 shrink-0">
              Buổi {apt.so_thu_tu_buoi}/{apt.tong_so_buoi_goi ?? '?'}
            </span>
          )}
        </div>
        {/* DỰ BÁO GIỜ XONG CHO CA ĐANG THỰC HIỆN */}
        {variant === 'dang_lam' && (() => {
          const duration = Number((apt as any).thoi_luong_phut) || 30;
          const startMs = ((apt as any).thoi_gian_bat_dau || apt.ngay_gio_bat_dau) ? new Date((apt as any).thoi_gian_bat_dau || apt.ngay_gio_bat_dau).getTime() : Date.now();
          const finishMs = startMs + duration * 60000;
          const finishTimeStr = format(new Date(finishMs), 'HH:mm');

          return (
            <p className="text-[11px] font-black text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mt-1 bg-teal-50 dark:bg-teal-955/50 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800/60 w-fit">
              <span>⏰ DỰ KIẾN XONG: <strong>{finishTimeStr}</strong> ({duration}p)</span>
            </p>
          );
        })()}

        {variant === 'dang_cho' && waitMinutes !== null && (
          <div className="space-y-0.5">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
              <Clock3 size={11} /> Chờ {fmtMinutes(waitMinutes)}
            </p>

            {/* B23 — DỰ BÁO GIỜ GỌI VÀO (DỰ KIẾN GỌI) CHO CA ĐANG CHỜ */}
            {(() => {
              const staffId = apt.bac_si_id || (apt as any).nhan_su_id || (apt as any).ky_thuat_vien_id;
              const allWaiting = (allAppointments || [])
                .filter(a => a.trang_thai === 'da_checkin' || a.trang_thai === 'cho_tai_luong_gia')
                .sort((a, b) => {
                  const isReA = (a as any).is_reassessment || a.trang_thai === 'cho_tai_luong_gia';
                  const isReB = (b as any).is_reassessment || b.trang_thai === 'cho_tai_luong_gia';
                  if (isReA && !isReB) return -1;
                  if (!isReA && isReB) return 1;
                  return new Date(a.thoi_gian_checkin || a.thoi_gian_tao || 0).getTime() - new Date(b.thoi_gian_checkin || b.thoi_gian_tao || 0).getTime();
                });

              let estimatedWaitMins = 0;
              let isFreeNow = false;

              if (staffId) {
                // 1. Khách chọn ĐÍCH DANH nhân sự staffId
                const activeSession = (allAppointments || []).find(a => 
                  String(a.bac_si_id || (a as any).nhan_su_id || (a as any).ky_thuat_vien_id) === String(staffId) && 
                  a.trang_thai === 'dang_kham'
                );

                let currentSessionRemaining = 0;
                if (activeSession) {
                  const duration = Number((activeSession as any).thoi_luong_phut) || 30;
                  const startMs = ((activeSession as any).thoi_gian_bat_dau || activeSession.ngay_gio_bat_dau) ? new Date((activeSession as any).thoi_gian_bat_dau || activeSession.ngay_gio_bat_dau).getTime() : Date.now();
                  const elapsedMins = Math.floor((Date.now() - startMs) / 60000);
                  currentSessionRemaining = Math.max(1, duration - elapsedMins);
                }

                const staffQueue = allWaiting.filter(a => String(a.bac_si_id || (a as any).nhan_su_id || (a as any).ky_thuat_vien_id) === String(staffId));
                const posInQueue = staffQueue.findIndex(a => String(a.id) === String(apt.id));

                let queueBeforeMins = 0;
                if (posInQueue > 0) {
                  for (let i = 0; i < posInQueue; i++) {
                    queueBeforeMins += Number((staffQueue[i] as any).thoi_luong_phut) || 30;
                  }
                }

                estimatedWaitMins = currentSessionRemaining + queueBeforeMins;
                if (!activeSession && posInQueue === 0) {
                  isFreeNow = true;
                }
              } else {
                // 2. Khách ở HÀNG ĐỢI CHUNG (nhan_su_id === null / Bất kỳ)
                const workingStaffIds = new Set(
                  (allAppointments || [])
                    .filter(a => a.trang_thai === 'dang_kham')
                    .map(a => String(a.bac_si_id || (a as any).nhan_su_id || (a as any).ky_thuat_vien_id))
                );

                const commonQueue = allWaiting.filter(a => !a.bac_si_id && !(a as any).nhan_su_id);
                const posInCommonQueue = commonQueue.findIndex(a => String(a.id) === String(apt.id));
                const availableStaffCount = staffList.filter(s => !workingStaffIds.has(String(s.id))).length;

                if (availableStaffCount > 0 && posInCommonQueue < availableStaffCount) {
                  isFreeNow = true;
                  estimatedWaitMins = 0;
                } else {
                  const activeSessions = (allAppointments || []).filter(a => a.trang_thai === 'dang_kham');
                  if (activeSessions.length > 0) {
                    const remainingTimes = activeSessions.map(a => {
                      const duration = Number((a as any).thoi_luong_phut) || 30;
                      const startMs = ((a as any).thoi_gian_bat_dau || a.ngay_gio_bat_dau) ? new Date((a as any).thoi_gian_bat_dau || a.ngay_gio_bat_dau).getTime() : Date.now();
                      const elapsedMins = Math.floor((Date.now() - startMs) / 60000);
                      return Math.max(1, duration - elapsedMins);
                    });
                    const minRemainingMins = Math.min(...remainingTimes);
                    const extraAhead = Math.max(0, posInCommonQueue - (availableStaffCount || 0));
                    const staffCountOnDuty = Math.max(1, staffList.length);
                    const extraWaitMins = Math.floor((extraAhead * 30) / staffCountOnDuty);

                    estimatedWaitMins = minRemainingMins + extraWaitMins;
                  } else {
                    isFreeNow = true;
                  }
                }
              }

              const projectedTimeMs = Date.now() + estimatedWaitMins * 60000;
              const projectedTimeStr = format(new Date(projectedTimeMs), 'HH:mm');

              return (
                <p className={`text-[10px] font-extrabold flex items-center gap-1 ${
                  isFreeNow ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
                }`}>
                  <span>⏱️ Dự kiến gọi: <strong className={`font-black ${isFreeNow ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'}`}>
                    {isFreeNow ? 'Ngay bây giờ (Sẵn sàng)' : `~${projectedTimeStr} (sau ~${estimatedWaitMins}p)`}
                  </strong></span>
                </p>
              );
            })()}
          </div>
        )}
        {/* B22 — DỰ BÁO HẠN ĐẾN MUỘN NHẤT THEO THỜI LƯỢNG DỊCH VỤ HOẶC HẠN TÁI LƯỢNG GIÁ */}
        {variant === 'chua_den' && (() => {
          if (apt.trang_thai === 'cho_tai_luong_gia' || (apt as any).han_tai_kham) {
            let formattedDeadline = '';
            let isOverdue = false;

            const textToSearch = `${(apt as any).ghi_chu || ''} ${(apt as any).ghi_chu_noi_bo || ''} ${(apt as any).chan_doan || ''} ${(apt as any).ly_do_kham || ''}`;
            
            // Ưu tiên 1: Chuỗi có đầy đủ giờ + ngày từ ghi chú chuyên viên, ví dụ "[Hạn tái lượng giá: 23:30 ngày 22/08/2026]"
            const matchExplicit = textToSearch.match(/\[Hạn tái lượng giá:\s*([^\]]+)\]/i) 
              || textToSearch.match(/(\d{1,2}:\d{2}\s+ngày\s+\d{1,2}\/\d{1,2}\/\d{4})/i);

            if (matchExplicit && matchExplicit[1]) {
              formattedDeadline = matchExplicit[1].trim();
            } else if ((apt as any).han_tai_kham) {
              const raw = String((apt as any).han_tai_kham).trim();
              const datePart = raw.split('T')[0].split(' ')[0];
              let dStr = '';
              if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, d] = datePart.split('-');
                dStr = `${d}/${m}/${y}`;
              } else {
                dStr = datePart;
              }

              // Trích xuất giờ từ thời điểm chuyên viên bắt đầu lượng giá / check-in
              const sourceTime = apt.thoi_gian_bat_dau || apt.thoi_gian_checkin || apt.thoi_gian_tao;
              if (sourceTime) {
                try {
                  const tDate = new Date(sourceTime);
                  const hh = String(tDate.getHours()).padStart(2, '0');
                  const mm = String(tDate.getMinutes()).padStart(2, '0');
                  formattedDeadline = `${hh}:${mm} ngày ${dStr}`;
                } catch {
                  formattedDeadline = dStr;
                }
              } else {
                formattedDeadline = dStr;
              }
            } else {
              // Fallback: 3 ngày tính từ thời điểm tạo / bắt đầu ca
              const baseDate = apt.thoi_gian_bat_dau || apt.thoi_gian_checkin || apt.thoi_gian_tao;
              const d = baseDate ? new Date(baseDate) : new Date();
              d.setDate(d.getDate() + 3);
              const hh = String(d.getHours()).padStart(2, '0');
              const mm = String(d.getMinutes()).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              const MM = String(d.getMonth() + 1).padStart(2, '0');
              const yyyy = d.getFullYear();
              formattedDeadline = `${hh}:${mm} ngày ${dd}/${MM}/${yyyy}`;
            }

            return (
              <p className={`text-[10px] font-extrabold flex items-center gap-1 mt-0.5 ${
                isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-800 dark:text-amber-300'
              }`}>
                <Clock3 size={11} className={isOverdue ? 'text-rose-600 shrink-0' : 'text-amber-600 shrink-0'} />
                <span>
                  ⏱️ Hạn quay lại muộn nhất: <strong className={`font-black ${isOverdue ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-zinc-100'}`}>{formattedDeadline}</strong>
                  {isOverdue && ' (⚠️ Đã quá hạn)'}
                </span>
              </p>
            );
          }

          const duration = Number((apt as any).thoi_luong_phut) || 30;
          const isSang = apt.buoi === 'sang' || (apt.ngay_gio_bat_dau && new Date(apt.ngay_gio_bat_dau).getHours() < 12);
          const latestMins = (isSang ? 12 * 60 : 19 * 60 + 30) - duration;
          const latestHours = Math.floor(latestMins / 60);
          const latestRemMins = latestMins % 60;
          const latestTimeStr = `${latestHours}h${latestRemMins < 10 ? '0' : ''}${latestRemMins}`;

          return (
            <p className="text-[10px] text-teal-700 dark:text-teal-400 font-extrabold flex items-center gap-1 mt-0.5">
              <Clock3 size={11} className="text-teal-600 shrink-0" />
              <span>⏱️ Hạn đến muộn nhất: <strong className="font-black text-slate-900 dark:text-zinc-100">{latestTimeStr}</strong> ({duration}p)</span>
            </p>
          );
        })()}
        {/* B11 — hiện thường trực đồng bộ 100% với Bàn Chuyên viên/Bác sĩ */}
        {variant === 'dang_cho' && (missedCalls > 0 || isCalledIn) && (() => {
          const isCallingNow = isCalledIn;
          const currentCallNum = isCallingNow ? missedCalls + 1 : missedCalls;
          if (currentCallNum === 0) return null;

          return (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1 mt-0.5">
              <AlertCircle size={12} className="shrink-0" />
              <span>
                {currentCallNum >= 2
                  ? `Đã gọi lần ${currentCallNum} — Cân nhắc vắng mặt (Không đến)`
                  : `Đã gọi lần 1`}
              </span>
            </p>
          );
        })()}
      </div>

      {/* Nhân sự / Phòng — badge "đang gọi vào" gộp chung cột này đồng bộ 100% với Bàn Chuyên viên */}
      <div className="w-[180px] shrink-0 space-y-1">
        {isCalledIn && (() => {
          const currentCallNum = missedCalls + 1;
          const callTimeStr = apt.thoi_gian_goi_vao ? format(new Date(apt.thoi_gian_goi_vao), 'HH:mm') : '';
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-955/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs w-fit tracking-wide animate-pulse">
              <Volume2 size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                {currentCallNum > 1
                  ? `🔔 Đã gọi lần ${currentCallNum}${callTimeStr ? ` lúc ${callTimeStr}` : ''}`
                  : `🔔 Đã phát tín hiệu gọi vào${callTimeStr ? ` lúc ${callTimeStr}` : ''}`}
              </span>
            </span>
          );
        })()}
        <StaffCell apt={apt} staffList={staffList} />
      </div>

      {/* Thanh toán */}
      <div className="w-[100px] shrink-0">
        {!TERMINAL_STATUSES.includes(apt.trang_thai) && <PaymentBadge apt={apt} />}
      </div>

      {/* Thao tác */}
      <div className="w-[230px] shrink-0 flex items-center justify-end gap-1.5">
        {variant === 'chua_den' && (
          apt.trang_thai === 'cho_tai_luong_gia' ? (
            <button
              type="button"
              onClick={() => onQuickCheckin(apt)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-700 hover:to-teal-700 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Khách quay lại tái lượng giá — Check-in vào đầu hàng đợi"
            >
              <CheckCircle2 size={13} /> CHECK-IN TÁI KHÁM
            </button>
          ) : apt.loai_lich === 'kham_moi' && isPaymentDue(apt) ? (
            <button
              type="button"
              onClick={() => navigate(`${billingRoute}?lich_dat_id=${apt.id}`)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Bắt buộc thu tiền Lượng giá trước khi Check-in"
            >
              <DollarSign size={13} /> THU TIỀN TRƯỚC
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onQuickCheckin(apt)}
              className="px-3 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0b7970] text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 size={13} /> CHECK-IN
            </button>
          )
        )}
        {variant !== 'chua_den' && !TERMINAL_STATUSES.includes(apt.trang_thai) && isPaymentDue(apt) && (
          <button
            type="button"
            onClick={() => navigate(`${billingRoute}?lich_dat_id=${apt.id}`)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <DollarSign size={13} /> THU TIỀN
          </button>
        )}
        {/* Nút Giải phóng nhân sự về Hàng đợi chung (khi khách đang được gán đích danh cho 1 nhân sự bị tắc) */}
        {variant === 'dang_cho' && (apt.bac_si_id != null || (apt as any).nhan_su_id != null) && onUnassign && (
          <button
            type="button"
            onClick={() => onUnassign(apt)}
            title="Giải phóng chỉ định đích danh — Chuyển ca này về Hàng đợi chung để nhân sự rảnh bất kỳ gọi vào"
            className="px-2 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-955/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-300/80 dark:border-amber-700/60 font-black text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <UserX size={13} /> HÀNG CHỜ CHUNG
          </button>
        )}

        {/* B11 (bản Lễ tân) — ẩn nút "Đẩy xuống" khi đã gọi lần 2 (nhường chỗ cho nút Không đến) */}
        {variant === 'dang_cho' && onPushBack && (() => {
          const currentCallNum = isCalledIn ? missedCalls + 1 : missedCalls;
          if (currentCallNum >= 2) return null;
          return (
            <button
              type="button"
              onClick={() => onPushBack(apt)}
              title="Đẩy xuống cuối hàng đợi (khách rời chỗ chờ, đi vệ sinh...)"
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-955/40 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer shrink-0"
            >
              <ArrowDownCircle size={14} />
            </button>
          );
        })()}
        {variant === 'dang_cho' && missedCalls >= 1 && onMarkNoShow && (
          <button
            type="button"
            onClick={() => onMarkNoShow(apt)}
            title={`Đã gọi ${missedCalls} lần không thấy khách — đánh dấu Không đến`}
            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer shrink-0"
          >
            <UserX size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenDetailModal(apt)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 font-extrabold text-[11px] flex items-center gap-1 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer whitespace-nowrap"
        >
          <Eye size={13} /> XEM
        </button>
      </div>
    </div>
  );
}

/** Hàng tiêu đề cột — khớp CHÍNH XÁC bề rộng từng ô của AppointmentRow, để không lệch hàng. Chỉ
 * hiện 1 lần trên đầu mỗi nhóm (không lặp lại theo từng dòng), tránh vừa dư thừa vừa vẫn rõ cột
 * nào là cột nào — trước đây chỉ có tên khách trần trụi, không rõ ngữ cảnh của từng giá trị. */
function ColumnHeaderRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50/80 dark:bg-zinc-850/60 border-b border-slate-200/60 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
      <div className="w-[110px] shrink-0">Buổi/TT</div>
      <div className="w-[180px] shrink-0">Khách hàng</div>
      <div className="flex-1 min-w-0">Dịch vụ / Gói</div>
      <div className="w-[180px] shrink-0">Nhân sự / Phòng</div>
      <div className="w-[100px] shrink-0">Thanh toán</div>
      <div className="w-[230px] shrink-0 text-right pr-4">Thao tác</div>
    </div>
  );
}


// A5 — bảng dòng chảy dùng chung cho MỌI ngày đơn lẻ (không chỉ hôm nay) và cả 2 actor (Lễ tân +
// Admin) — tên giữ nguyên "TodayFlowBoard" vì đây là nơi tính năng bắt đầu, nhưng hành vi đã tổng
// quát hóa để tránh có 2 giao diện khác nhau khi xem lịch của ngày khác/actor khác.
export function TodayFlowBoard({
  appointments,
  activeType,
  searchTerm,
  staffList,
  schedulesList,
  selectedDateStr,
  onOpenDetailModal,
  onQuickCheckin,
  onPushBack,
  onMarkNoShow,
  onUnassign,
  onOpenWalkInModal: _onOpenWalkInModal,
  focusAppointmentId,
  staffFilterId,
  staffFilterOptions,
  onStaffFilterChange,
  onOpenWorkloadModal,
  filterBar,
}: TodayFlowBoardProps) {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'chua_den' | 'dang_cho' | 'dang_lam' | 'xong' | 'cho_tai_luong_gia' | 'ngoai_le'>('chua_den');
  // B2/B19 — phát hiện "Gọi vào" MỚI bằng cách so sánh `thoi_gian_goi_vao` giữa các lần `appointments`
  // được refetch (mỗi 8s, xem useAppointmentsData) — thay cho tín hiệu localStorage/BroadcastChannel
  // cũ (chỉ hoạt động cùng 1 trình duyệt). Chuông/toast giờ đúng cả khi Lễ tân và Chuyên viên ngồi 2
  // máy khác nhau, đánh đổi lại độ trễ tối đa ~8 giây thay vì tức thời.
  const seenCallInKeys = useRef<Set<string>>(new Set());
  const isFirstCallInScan = useRef(true);

  useEffect(() => {
    const activeCallIns = appointments.filter((a) => a.thoi_gian_goi_vao && a.trang_thai === 'da_checkin');
    const currentKeys = activeCallIns.map((a) => `${a.id}:${a.thoi_gian_goi_vao}`);

    if (isFirstCallInScan.current) {
      currentKeys.forEach((k) => seenCallInKeys.current.add(k));
      isFirstCallInScan.current = false;
      return;
    }

    for (const apt of activeCallIns) {
      const key = `${apt.id}:${apt.thoi_gian_goi_vao}`;
      if (seenCallInKeys.current.has(key)) continue;
      seenCallInKeys.current.add(key);

      playCallInAudioChime();
      toast(() => (
        <div className="flex items-center gap-3 p-1 text-white">
          <div className="size-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/20 shrink-0">
            🔊
          </div>
          <div>
            <p className="text-xs font-black tracking-wide text-amber-400 uppercase">CHUYÊN VIÊN ĐÃ GỌI VÀO PHÒNG!</p>
            <p className="text-xs text-slate-100 font-semibold mt-0.5 leading-snug">
              Mời khách hàng <span className="font-black text-amber-300 underline decoration-amber-400/50 underline-offset-2">{apt.ten_khach_hang}</span>
              {apt.so_thu_tu_hang_doi != null ? <span className="font-black text-amber-300 ml-1">(Số {apt.so_thu_tu_hang_doi})</span> : ''}
              {apt.ten_phong ? ` vào ${apt.ten_phong}` : ''}
              {apt.ten_ky_thuat_vien ? ` — ${apt.ten_ky_thuat_vien}` : ''}
            </p>
          </div>
        </div>
      ), {
        duration: 7000,
        style: {
          borderRadius: '16px',
          background: '#0F172A',
          color: '#FFFFFF',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.2)',
          padding: '12px 16px',
        }
      });
    }
  }, [appointments]);

  useEffect(() => {
    if (!focusAppointmentId) return;
    const target = appointments.find((a) => String(a.id) === String(focusAppointmentId));
    if (!target) return;

    if (target.trang_thai === 'da_xac_nhan') {
      setActiveTab('chua_den');
    } else if (target.trang_thai === 'cho_tai_luong_gia') {
      setActiveTab('cho_tai_luong_gia');
    } else if (target.trang_thai === 'da_checkin') {
      setActiveTab('dang_cho');
    } else if (target.trang_thai === 'dang_kham') {
      setActiveTab('dang_lam');
    } else if (target.trang_thai === 'hoan_thanh') {
      setActiveTab('xong');
    } else if (TERMINAL_STATUSES.includes(target.trang_thai)) {
      setActiveTab('ngoai_le');
    }
  }, [focusAppointmentId, appointments]);

  // Sức khỏe ca PHẢI nhìn cả ca (mọi nhân sự), nên nhận `appointments` gốc — lọc theo staff chỉ áp
  // xuống danh sách dòng (typedAppointments) bên dưới.
  const sucKhoeCa = useSucKhoeCa(appointments, staffList, schedulesList, selectedDateStr, activeType);

  const typedAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchType = activeType === 'kham' ? apt.loai_lich === 'kham_moi' : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
      const matchStaff = !staffFilterId || String(apt.bac_si_id) === String(staffFilterId);
      return matchType && matchStaff;
    });
  }, [appointments, activeType, staffFilterId]);

  const searched = useMemo(() => {
    if (!searchTerm.trim()) return typedAppointments;
    return typedAppointments.filter(
      (apt) =>
        getSmartSearchScore(apt.ten_khach_hang || '', searchTerm) > 0 ||
        (apt.so_dien_thoai || '').includes(searchTerm.trim()) ||
        apt.ma_lich_dat?.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [typedAppointments, searchTerm]);

  const groups = useMemo(() => {
    const chuaDen = searched
      .filter((a) => a.trang_thai === 'da_xac_nhan')
      .sort((a, b) => new Date(a.thoi_gian_tao || 0).getTime() - new Date(b.thoi_gian_tao || 0).getTime());

    const choTaiLuongGia = searched
      .filter((a) => a.trang_thai === 'cho_tai_luong_gia')
      .sort((a, b) => new Date(a.thoi_gian_tao || 0).getTime() - new Date(b.thoi_gian_tao || 0).getTime());

    const dangCho = searched
      .filter((a) => a.trang_thai === 'da_checkin')
      .sort((a, b) => {
        const isReA = (a as any).is_reassessment || a.trang_thai === 'cho_tai_luong_gia' || (a as any).trang_thai_cu === 'cho_tai_luong_gia';
        const isReB = (b as any).is_reassessment || b.trang_thai === 'cho_tai_luong_gia' || (b as any).trang_thai_cu === 'cho_tai_luong_gia';
        if (isReA && !isReB) return -1;
        if (!isReA && isReB) return 1;
        return new Date(a.thoi_gian_checkin || 0).getTime() - new Date(b.thoi_gian_checkin || 0).getTime();
      });

    const dangLam = searched.filter((a) => a.trang_thai === 'dang_kham');

    const xong = searched
      .filter((a) => a.trang_thai === 'hoan_thanh')
      .sort((a, b) => new Date(b.thoi_gian_tao || 0).getTime() - new Date(a.thoi_gian_tao || 0).getTime());

    const ngoaiLe = searched.filter((a) => TERMINAL_STATUSES.includes(a.trang_thai));

    return { chuaDen, choTaiLuongGia, dangCho, dangLam, xong, ngoaiLe };
  }, [searched]);

  const xongChuaThu = groups.xong.filter(isAwaitingPaymentForList).length;


  // Check-in là thao tác đổi trạng thái tức thời (không giống "Thu tiền" — nút đó chỉ điều hướng
  // sang trang thanh toán, nơi tự có bước xác nhận riêng của chính nó) — bấm nhầm 1 cái là dữ liệu
  // sai ngay, nên bắt buộc phải qua 1 bước xác nhận trước khi gọi API thật.
  const [pendingCheckin, setPendingCheckin] = useState<Appointment | null>(null);
  const [pendingOvertimeCheckin, setPendingOvertimeCheckin] = useState<Appointment | null>(null);

  const requestCheckin = (apt: Appointment) => {
    if (user?.vai_tro_id === 2 && apt.ngay_gio_bat_dau) {
      const apptDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(apt.ngay_gio_bat_dau));
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      if (apptDateStr > todayStr) {
        const formattedDate = new Date(apt.ngay_gio_bat_dau).toLocaleDateString('vi-VN');
        toast.error(`⚠️ Lễ tân chỉ được phép Check-in cho các ca hẹn trong ngày hôm nay. Không thể check-in vượt thời gian cho ca hẹn ngày ${formattedDate}.`);
        return;
      }
    }

    // B20 — Cảnh báo Check-in sát giờ đóng cửa (20:00 PM)
    const duration = Number((apt as any).thoi_luong_phut) || 45;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const CLOSING_MINS = 20 * 60; // 20:00 PM
    if (currentMins + duration > CLOSING_MINS && now.getHours() >= 17) {
      setPendingOvertimeCheckin(apt);
      return;
    }

    setPendingCheckin(apt);
  };

  // B11 — "Không đến" thủ công của Lễ tân là hành động khó đảo ngược (mất tiền nếu đã thanh toán +
  // cộng no-show) nên luôn qua 1 bước xác nhận, giống mẫu pendingCheckin ở trên. "Đẩy xuống" không
  // cần popup — chỉ đẩy cuối hàng đợi, không đổi trạng thái, không mất gì.
  const [pendingNoShow, setPendingNoShow] = useState<Appointment | null>(null);

  return (
    <div className="space-y-4">
      {/* 1. KHỐI TỔNG HỢP: ĐIỀU HƯỚNG BỘ LỌC + SỨC KHỎE CA TRỰC (GỘP 2 CARD ẢNH 1) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 md:p-5 shadow-xs space-y-4">
        {filterBar}

        {filterBar && (
          <div className="border-t border-slate-100 dark:border-zinc-800/80 my-4" />
        )}

        {/* Card Header Row: tiêu đề + nút mở Modal Tải Nhân Sự */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-black">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>SỨC KHỎE CA TRỰC & NĂNG LỰC PHỤC VỤ</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                Dự báo sức chứa & ngân sách thời gian thực hiện theo ca trong ngày
              </p>
            </div>
          </div>

          {onOpenWorkloadModal && (
            <button
              type="button"
              onClick={onOpenWorkloadModal}
              className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0d9488] dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200/80 dark:border-teal-800/60 font-black text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              title="Xem chi tiết tải làm việc và ca mở của từng nhân sự"
            >
              <Users size={15} />
              <span>📊 Trạng Thái Nhân Sự Ca Trực</span>
            </button>
          )}
        </div>

        {/* Card Body: Ca sáng / Ca chiều + Dropdown lọc nhân sự */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {sucKhoeCa.map((b) => {
              const isSang = b.buoi === 'sang';
              return (
                <div
                  key={b.buoi}
                  className={`rounded-2xl border p-3.5 transition-all ${
                    b.isPast
                      ? 'bg-slate-50/60 dark:bg-zinc-800/20 border-slate-200/60 dark:border-zinc-800 opacity-60'
                      : 'bg-slate-50/40 dark:bg-zinc-800/30 border-slate-200/70 dark:border-zinc-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`size-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSang ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600' : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600'
                      }`}>
                        {isSang ? <Sun size={14} /> : <Moon size={14} />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                        CA {b.label.toUpperCase()}
                      </span>
                    </div>

                    {b.isCurrent && (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200/60">
                        <span className="size-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        Đang diễn ra
                      </span>
                    )}
                  </div>

                  <div className={`grid gap-2 ${b.roles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {b.roles.map((r) => (
                      <div
                        key={r.label}
                        className={`rounded-xl p-2 text-xs font-bold border transition-all ${
                          r.over
                            ? 'bg-rose-50/80 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border-rose-200/60'
                            : 'bg-emerald-50/70 dark:bg-emerald-955/20 text-emerald-800 dark:text-emerald-300 border-emerald-200/60'
                        }`}
                      >
                        <div className="uppercase tracking-wider text-[9px] font-black opacity-70 mb-0.5">{r.label}</div>
                        <div className="text-xs font-black">
                          còn <span className="font-mono">{fmtMinutes(r.capacity)}</span> · cần <span className="font-mono">{fmtMinutes(r.demand)}</span>
                        </div>
                        {r.over && <div className="mt-0.5 text-[9.5px] font-extrabold text-rose-600">⚠ Vượt {fmtMinutes(r.demand - r.capacity)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CUSTOM RICH DROPDOWN LỌC THEO CHUYÊN VIÊN CÓ ANH ĐẠI DIỆN AVATAR */}
          {staffFilterOptions && staffFilterOptions.length > 0 && (
            <StaffSelectDropdown
              value={staffFilterId || null}
              options={staffFilterOptions}
              staffList={staffList}
              onChange={(id) => onStaffFilterChange?.(id === null ? null : String(id))}
              roleLabel={activeType === 'kham' ? 'chuyên viên' : 'KTV'}
            />
          )}
        </div>
      </div>



      <ConfirmDialog
        isOpen={!!pendingCheckin}
        title="Xác nhận check-in"
        message={
          pendingCheckin
            ? <>Xác nhận khách <strong>{pendingCheckin.ten_khach_hang || pendingCheckin.ho_ten_khach}</strong> đã có mặt tại quầy và đưa vào hàng đợi?</>
            : ''
        }
        confirmLabel="Check-in"
        cancelLabel="Chưa phải"
        type="info"
        onConfirm={() => {
          if (pendingCheckin) onQuickCheckin(pendingCheckin);
          setPendingCheckin(null);
        }}
        onCancel={() => setPendingCheckin(null)}
      />

      <ConfirmDialog
        isOpen={!!pendingNoShow}
        title="Xác nhận KHÔNG ĐẾN"
        message={
          pendingNoShow
            ? <>Xác nhận <strong>{pendingNoShow.ten_khach_hang || pendingNoShow.ho_ten_khach}</strong> KHÔNG ĐẾN — khách sẽ mất tiền (nếu đã thanh toán) và bị cộng 1 lần no-show. Tiếp tục?</>
            : ''
        }
        confirmLabel="Xác nhận Không đến"
        cancelLabel="Để sau"
        type="danger"
        onConfirm={() => {
          if (pendingNoShow) onMarkNoShow?.(pendingNoShow);
          setPendingNoShow(null);
        }}
        onCancel={() => setPendingNoShow(null)}
      />

      {/* OVERTIME CHECK-IN WARNING MODAL FOR 20:00 CLOSING CUTOFF (B20) */}
      {pendingOvertimeCheckin && (() => {
        const duration = Number((pendingOvertimeCheckin as any).thoi_luong_phut) || 45;
        const now = new Date();
        const finishMinutes = now.getHours() * 60 + now.getMinutes() + duration;
        const finishH = Math.floor(finishMinutes / 60);
        const finishM = finishMinutes % 60;
        const finishTimeStr = `${finishH}:${finishM < 10 ? '0' : ''}${finishM}`;
        const overtimeMins = finishMinutes - 20 * 60;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-amber-200 dark:border-amber-900/60 space-y-5 text-slate-800 dark:text-zinc-100 font-sans">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-955 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 border border-amber-300">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
                    Cảnh báo sát giờ đóng cửa trung tâm
                  </span>
                  <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100 font-jakarta">
                    Check-in ca quá giờ 20:00 tối
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/40 border border-amber-200 dark:border-amber-900/60 text-xs leading-relaxed space-y-2">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  📌 Bệnh nhân: <strong>{pendingOvertimeCheckin.ten_khach_hang || (pendingOvertimeCheckin as any).ho_ten_khach}</strong> (Dịch vụ {duration} phút)
                </p>
                <p className="text-slate-600 dark:text-zinc-300">
                  Trung tâm chính thức đóng cửa lúc <strong>20:00 (8h00 tối)</strong>. Nếu tiếp nhận check-in bây giờ, thời gian hoàn thành dự kiến là <strong className="text-amber-700 dark:text-amber-300 font-black">{finishTimeStr}</strong> (vượt giờ đóng cửa {overtimeMins} phút).
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Hãy trao đổi với khách và chọn hướng xử lý:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const apt = pendingOvertimeCheckin;
                      setPendingOvertimeCheckin(null);
                      setPendingCheckin(apt);
                    }}
                    className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
                  >
                    🔴 Vẫn Check-in (Làm ngoài giờ)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingOvertimeCheckin(null);
                      toast.success('💡 Hãy sử dụng nút "Đổi lịch" trên thẻ ca hẹn để chọn ngày mới cho khách (Khách không bị phạt no-show).');
                    }}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
                  >
                    🟢 Đổi Lịch Sang Buổi Khác (Không tính No-show)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* 2. KHỐI DANH SÁCH CA HẸN: THANH TAB TÍCH HỢP TRÊN ĐẦU BẢNG (GỘP 2 CARD ẢNH 2) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs mt-4">
        {/* THANH TAB CHUYỂN TRẠNG THÁI CA HẸN LINH HOẠT - THIẾT KẾ RÕ RÀNG & NỔI BẬT */}
        <div className="p-2.5 bg-slate-50/70 dark:bg-zinc-850/60 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 px-0.5">
            
            {/* TAB 1: CHƯA ĐẾN */}
            <button
              type="button"
              onClick={() => setActiveTab('chua_den')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'chua_den'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50/60 hover:text-indigo-700 hover:border-indigo-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Users size={15} className={activeTab === 'chua_den' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'} />
              <span>CHƯA ĐẾN</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'chua_den'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
              }`}>
                {groups.chuaDen.length}
              </span>
            </button>

            {/* TAB 2: ĐANG CHỜ GỌI VÀO */}
            <button
              type="button"
              onClick={() => setActiveTab('dang_cho')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'dang_cho'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-amber-50/60 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Clock3 size={15} className={activeTab === 'dang_cho' ? 'text-white' : 'text-amber-600 dark:text-amber-400'} />
              <span>ĐANG CHỜ GỌI VÀO</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'dang_cho'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
              }`}>
                {groups.dangCho.length}
              </span>
            </button>

            {/* TAB 3: ĐANG LÀM */}
            <button
              type="button"
              onClick={() => setActiveTab('dang_lam')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'dang_lam'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/25 ring-2 ring-cyan-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-cyan-50/60 hover:text-cyan-700 hover:border-cyan-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Activity size={15} className={activeTab === 'dang_lam' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'} />
              <span>ĐANG LÀM</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'dang_lam'
                  ? 'bg-white/20 text-white'
                  : 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60'
              }`}>
                {groups.dangLam.length}
              </span>
            </button>

            {/* TAB 4: ĐÃ XONG */}
            <button
              type="button"
              onClick={() => setActiveTab('xong')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'xong'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-emerald-50/60 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-zinc-700'
              }`}
            >
              <CheckCircle2 size={15} className={activeTab === 'xong' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'} />
              <span>ĐÃ XONG</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'xong'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
              }`}>
                {groups.xong.length}
              </span>
              {xongChuaThu > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse ml-1">
                  ⚠ {xongChuaThu} chưa thu
                </span>
              )}
            </button>

            {/* TAB 5: CHỜ TÁI LƯỢNG GIÁ */}
            {activeType === 'kham' && (
              <button
                type="button"
                onClick={() => setActiveTab('cho_tai_luong_gia')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                  activeTab === 'cho_tai_luong_gia'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 ring-2 ring-purple-500/20'
                    : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-purple-50/60 hover:text-purple-700 hover:border-purple-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Sparkles size={15} className={activeTab === 'cho_tai_luong_gia' ? 'text-white' : 'text-purple-600 dark:text-purple-400'} />
                <span>CHỜ TÁI LƯỢNG GIÁ</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                  activeTab === 'cho_tai_luong_gia'
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                }`}>
                  {groups.choTaiLuongGia.length}
                </span>
              </button>
            )}

            {/* TAB 6: NGOẠI LỆ / HỦY */}
            <button
              type="button"
              onClick={() => setActiveTab('ngoai_le')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                activeTab === 'ngoai_le'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 ring-2 ring-rose-500/20'
                  : 'bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:bg-rose-50/60 hover:text-rose-700 hover:border-rose-200 dark:hover:bg-zinc-700'
              }`}
            >
              <AlertCircle size={15} className={activeTab === 'ngoai_le' ? 'text-white' : 'text-rose-600 dark:text-rose-400'} />
              <span>NGOẠI LỆ / HỦY</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black min-w-[22px] text-center ${
                activeTab === 'ngoai_le'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
              }`}>
                {groups.ngoaiLe.length}
              </span>
            </button>
          </div>
        </div>

        {/* NỘI DUNG DANH SÁCH CA HẸN KHỚP VỚI TAB ĐANG CHỌN */}
        {(() => {
          const tabConfig = {
            chua_den: {
              list: groups.chuaDen,
              emptyIcon: Users,
              iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
              emptyText: 'Không có lịch hẹn chưa đến',
              emptySubtitle: 'Tất cả khách hàng đã check-in hoặc chưa có lịch hẹn mới trong ca làm việc.'
            },
            dang_cho: {
              list: groups.dangCho,
              emptyIcon: Clock3,
              iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
              emptyText: 'Hàng đợi đang trống',
              emptySubtitle: 'Không có khách hàng nào đang xếp hàng chờ gọi vào phòng khám / lượng giá.'
            },
            dang_lam: {
              list: groups.dangLam,
              emptyIcon: Activity,
              iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
              emptyText: 'Chưa có ca nào đang thực hiện',
              emptySubtitle: 'Chuyên viên tư vấn và Kỹ thuật viên sẵn sàng tiếp nhận khách hàng tiếp theo.'
            },
            xong: {
              list: groups.xong,
              emptyIcon: CheckCircle2,
              iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
              emptyText: 'Chưa có ca hoàn thành',
              emptySubtitle: 'Các ca lượng giá và trị liệu hoàn thành trong ngày sẽ được tự động chuyển về đây.'
            },
            cho_tai_luong_gia: {
              list: groups.choTaiLuongGia,
              emptyIcon: Sparkles,
              iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
              emptyText: 'Không có ca nào chờ tái lượng giá.',
              emptySubtitle: 'Khách chuyển tuyến ngoài chụp chiếu khi quay lại sẽ xuất hiện tại đây.'
            },
            ngoai_le: {
              list: groups.ngoaiLe,
              emptyIcon: AlertCircle,
              iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
              emptyText: 'Không có ca hẹn ngoại lệ hay bị hủy',
              emptySubtitle: 'Các ca không đến hoặc đã hủy lịch sẽ được lưu trữ tại đây.'
            }
          };

          const currentTab = tabConfig[activeTab] || tabConfig.chua_den;
          const EmptyIcon = currentTab.emptyIcon;

          if (currentTab.list.length === 0) {
            return (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2 select-none bg-slate-50/20 dark:bg-zinc-900/20">
                <div className={`p-3.5 rounded-2xl ${currentTab.iconBg} shadow-2xs mb-1`}>
                  <EmptyIcon size={26} />
                </div>
                <p className="text-sm font-black text-slate-800 dark:text-zinc-200">{currentTab.emptyText}</p>
                <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 max-w-md">{currentTab.emptySubtitle}</p>
              </div>
            );
          }

          return (
            <div>
              <ColumnHeaderRow />
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {currentTab.list.map((apt) => (
                  <AppointmentRow
                    key={apt.id}
                    apt={apt}
                    variant={activeTab === 'cho_tai_luong_gia' ? 'chua_den' : (activeTab as any)}
                    staffList={staffList}
                    allAppointments={searched}
                    onOpenDetailModal={onOpenDetailModal}
                    onQuickCheckin={requestCheckin}
                    onPushBack={onPushBack}
                    onMarkNoShow={activeTab === 'dang_cho' ? setPendingNoShow : onMarkNoShow}
                    onUnassign={onUnassign}
                    focusAppointmentId={focusAppointmentId}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

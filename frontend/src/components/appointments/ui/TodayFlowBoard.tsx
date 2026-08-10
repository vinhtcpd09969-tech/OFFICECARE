import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Phone, User2, Clock3, CheckCircle2, DollarSign, Eye, Users, Activity, Sun, Moon, Check, Volume2, ArrowDownCircle, UserX, AlertCircle, Sparkles } from 'lucide-react';
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
        const matchNhom = isKham ? (apt.loai_lich === 'kham_moi' || (apt as any).loai === 'KHAM') : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don' || (apt as any).loai !== 'KHAM');
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
  onOpenDetailModal,
  onQuickCheckin,
  onPushBack,
  onMarkNoShow,
  focusAppointmentId,
}: {
  apt: Appointment;
  variant: RowVariant;
  staffList: Staff[];
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
  onPushBack?: (apt: Appointment) => void;
  onMarkNoShow?: (apt: Appointment) => void;
  focusAppointmentId?: string;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const billingRoute = user?.vai_tro_id === 2 ? '/receptionist/billing' : '/admin/quick-billing';
  const meta = statusConfig[apt.trang_thai] || { label: apt.trang_thai, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
  const isPackageSession = apt.loai_goi === 'LIEU_TRINH' && !!apt.so_thu_tu_buoi;
  const waitMinutes = apt.thoi_gian_checkin
    ? Math.max(0, Math.round((Date.now() - new Date(apt.thoi_gian_checkin).getTime()) / 60000))
    : null;

  const isCalledIn = !!apt.thoi_gian_goi_vao && apt.trang_thai === 'da_checkin';
  const missedCalls = apt.so_lan_goi_khong_co_mat || 0;
  const isFocused = !!focusAppointmentId && String(apt.id) === String(focusAppointmentId);

  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`appointment-card-${apt.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFocused, apt.id]);

  return (
    <div
      id={`appointment-card-${apt.id}`}
      className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 last:border-b-0 transition-all ${
        isFocused
          ? 'bg-amber-100/90 dark:bg-amber-955/60 border-amber-400 ring-4 ring-amber-400/80 shadow-xl shadow-amber-500/20 rounded-2xl my-1.5'
          : isCalledIn
            ? 'bg-amber-50/90 dark:bg-amber-955/40 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/80 shadow-md'
            : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
      }`}
    >
        {/* Buổi + trạng thái */}
        <div className="w-[110px] shrink-0 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            {apt.buoi ? BUOI_LABEL[apt.buoi] : '—'}
          </span>
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
        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
          {apt.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}
          {((apt as any).is_reassessment || (apt as any).trang_thai_cu === 'cho_tai_luong_gia' || apt.trang_thai === 'cho_tai_luong_gia') && (
            <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-2xs">
              <Sparkles size={11} /> 🔄 TÁI LƯỢNG GIÁ
            </span>
          )}
          {isPackageSession && (
            <span className="ml-1.5 text-[10px] font-black text-[#0d766e] dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-teal-200/50">
              Buổi {apt.so_thu_tu_buoi}/{apt.tong_so_buoi_goi ?? '?'}
            </span>
          )}
        </p>
        {variant === 'dang_cho' && waitMinutes !== null && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
            <Clock3 size={11} /> Chờ {fmtMinutes(waitMinutes)}
          </p>
        )}
        {/* B22 — DỰ BÁO HẠN ĐẾN MUỘN NHẤT THEO THỜI LƯỢNG DỊCH VỤ */}
        {variant === 'chua_den' && (() => {
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
          ) : (apt.loai_lich === 'kham_moi' || (apt as any).loai === 'KHAM') && isPaymentDue(apt) ? (
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
    <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50/80 dark:bg-zinc-800/40 border-b border-slate-200/60 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
      <div className="w-[110px] shrink-0">Buổi/TT</div>
      <div className="w-[180px] shrink-0">Khách hàng</div>
      <div className="flex-1 min-w-0">Dịch vụ / Gói</div>
      <div className="w-[180px] shrink-0">Nhân sự / Phòng</div>
      <div className="w-[100px] shrink-0">Thanh toán</div>
      <div className="w-[230px] shrink-0 text-right pr-4">Thao tác</div>
    </div>
  );
}

function FlowGroup({
  id,
  title,
  badge,
  icon: Icon = Clock3,
  appointments,
  variant,
  staffList,
  defaultOpen,
  emptyText,
  emptySubtitle,
  focusAppointmentId,
  onOpenDetailModal,
  onQuickCheckin,
  onPushBack,
  onMarkNoShow,
}: {
  id: string;
  title: string;
  badge?: React.ReactNode;
  icon?: React.ElementType;
  appointments: Appointment[];
  variant: 'chua_den' | 'dang_cho' | 'dang_lam' | 'xong' | 'ngoai_le';
  staffList: Staff[];
  defaultOpen: boolean;
  emptyText: string;
  emptySubtitle?: string;
  focusAppointmentId?: string;
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
  onPushBack?: (apt: Appointment) => void;
  onMarkNoShow?: (apt: Appointment) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen || (focusAppointmentId && appointments.some((a) => String(a.id) === String(focusAppointmentId)))) {
      setOpen(true);
    }
  }, [defaultOpen, focusAppointmentId, appointments]);

  const variantThemes = {
    chua_den: {
      border: 'border-indigo-200/80 dark:border-indigo-900/60',
      headerBg: 'bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-white dark:from-indigo-955/40 dark:via-zinc-900 dark:to-zinc-900',
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60',
      titleColor: 'text-indigo-950 dark:text-indigo-200',
      countBadge: 'bg-indigo-100/80 dark:bg-indigo-955/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60',
      emptyIcon: Users,
    },
    dang_cho: {
      border: 'border-amber-200/80 dark:border-amber-900/60',
      headerBg: 'bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white dark:from-amber-955/40 dark:via-zinc-900 dark:to-zinc-900',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
      titleColor: 'text-amber-950 dark:text-amber-200',
      countBadge: 'bg-amber-100/80 dark:bg-amber-955/60 text-amber-800 dark:text-amber-300 border border-amber-200/60',
      emptyIcon: Clock3,
    },
    dang_lam: {
      border: 'border-cyan-200/80 dark:border-cyan-900/60',
      headerBg: 'bg-gradient-to-r from-cyan-50/90 via-teal-50/50 to-white dark:from-cyan-955/40 dark:via-zinc-900 dark:to-zinc-900',
      iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/60',
      titleColor: 'text-cyan-950 dark:text-cyan-200',
      countBadge: 'bg-cyan-100/80 dark:bg-cyan-955/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200/60',
      emptyIcon: Activity,
    },
    xong: {
      border: 'border-emerald-200/80 dark:border-emerald-900/60',
      headerBg: 'bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-955/40 dark:via-zinc-900 dark:to-zinc-900',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
      titleColor: 'text-emerald-950 dark:text-emerald-200',
      countBadge: 'bg-emerald-100/80 dark:bg-emerald-955/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60',
      emptyIcon: CheckCircle2,
    },
    ngoai_le: {
      border: 'border-rose-200/80 dark:border-rose-900/60',
      headerBg: 'bg-gradient-to-r from-rose-50/90 via-slate-50/50 to-white dark:from-rose-955/40 dark:via-zinc-900 dark:to-zinc-900',
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
      titleColor: 'text-rose-950 dark:text-rose-200',
      countBadge: 'bg-rose-100/80 dark:bg-rose-955/60 text-rose-800 dark:text-rose-300 border border-rose-200/60',
      emptyIcon: AlertCircle,
    }
  };

  const theme = variantThemes[variant] || variantThemes.chua_den;
  const EmptyIcon = theme.emptyIcon;

  return (
    <div id={id} className={`bg-white dark:bg-zinc-900 border ${theme.border} rounded-3xl overflow-hidden shadow-xs transition-all duration-200 scroll-mt-4`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-3.5 ${theme.headerBg} hover:opacity-95 transition-all cursor-pointer select-none`}
      >
        <span className="flex items-center gap-3">
          <div className={`p-1.5 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={16} />
          </div>
          <span className={`text-xs font-black uppercase tracking-wider ${theme.titleColor}`}>{title}</span>
          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${theme.countBadge}`}>
            {appointments.length} ca
          </span>
        </span>
        <div className="flex items-center gap-3">
          {badge}
          <div className="p-1 rounded-lg bg-slate-200/40 dark:bg-zinc-800 text-slate-500">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </button>
      {open && (
        appointments.length === 0 ? (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-1.5 select-none bg-slate-50/30 dark:bg-zinc-900/30">
            <div className={`p-3 rounded-2xl ${theme.iconBg} shadow-2xs mb-1`}>
              <EmptyIcon size={22} />
            </div>
            <p className="text-xs font-black text-slate-800 dark:text-zinc-200">{emptyText}</p>
            {emptySubtitle && (
              <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 max-w-md">{emptySubtitle}</p>
            )}
          </div>
        ) : (
          <>
            <ColumnHeaderRow />
            <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
              {appointments.map((apt) => (
                <AppointmentRow
                  key={apt.id}
                  apt={apt}
                  variant={variant}
                  staffList={staffList}
                  onOpenDetailModal={onOpenDetailModal}
                  onQuickCheckin={onQuickCheckin}
                  onPushBack={onPushBack}
                  onMarkNoShow={onMarkNoShow}
                  focusAppointmentId={focusAppointmentId}
                />
              ))}
            </div>
          </>
        )
      )}
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
  onOpenWalkInModal: _onOpenWalkInModal,
  focusAppointmentId,
  staffFilterId,
  staffFilterOptions,
  onStaffFilterChange,
  onOpenWorkloadModal,
}: TodayFlowBoardProps) {
  const user = useAuthStore((state) => state.user);
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

  // Sức khỏe ca PHẢI nhìn cả ca (mọi nhân sự), nên nhận `appointments` gốc — lọc theo staff chỉ áp
  // xuống danh sách dòng (typedAppointments) bên dưới.
  const sucKhoeCa = useSucKhoeCa(appointments, staffList, schedulesList, selectedDateStr, activeType);

  const typedAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (focusAppointmentId && String(apt.id) === String(focusAppointmentId)) return true;
      const matchType = activeType === 'kham' ? apt.loai_lich === 'kham_moi' : (apt.loai_lich === 'dieu_tri' || apt.loai_lich === 'dich_vu_don');
      const matchStaff = !staffFilterId || String(apt.bac_si_id) === String(staffFilterId);
      return matchType && matchStaff;
    });
  }, [appointments, activeType, staffFilterId, focusAppointmentId]);

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

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Check-in là thao tác đổi trạng thái tức thời (không giống "Thu tiền" — nút đó chỉ điều hướng
  // sang trang thanh toán, nơi tự có bước xác nhận riêng của chính nó) — bấm nhầm 1 cái là dữ liệu
  // sai ngay, nên bắt buộc phải qua 1 bước xác nhận trước khi gọi API thật.
  const [pendingCheckin, setPendingCheckin] = useState<Appointment | null>(null);
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
    setPendingCheckin(apt);
  };

  // B11 — "Không đến" thủ công của Lễ tân là hành động khó đảo ngược (mất tiền nếu đã thanh toán +
  // cộng no-show) nên luôn qua 1 bước xác nhận, giống mẫu pendingCheckin ở trên. "Đẩy xuống" không
  // cần popup — chỉ đẩy cuối hàng đợi, không đổi trạng thái, không mất gì.
  const [pendingNoShow, setPendingNoShow] = useState<Appointment | null>(null);

  return (
    <div className="space-y-4">
      {/* Sức khỏe ca (B21) & Tải nhân sự gộp thành 1 Card thống nhất */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 md:p-5 shadow-xs space-y-4">
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

      {/* BỘ 4 THẺ THỐNG KÊ VẬN HÀNH SANG TRỌNG VÀ TO RỘNG NHƯ ẢNH MẪU 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ĐANG CHỜ */}
        <button
          type="button"
          onClick={() => jumpTo('flow-dang-cho')}
          className="relative overflow-hidden rounded-3xl p-5 border text-left transition-all duration-300 bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 shadow-md shadow-amber-500/5 hover:scale-[1.015] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl flex items-center justify-center border shadow-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Clock3 size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
              ĐANG CHỜ
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-jakarta font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {String(groups.dangCho.length).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Bệnh nhân
            </span>
          </div>

          <div className="mt-4 w-full h-1.5 bg-slate-200/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${Math.max(groups.dangCho.length * 15, 10)}%` }} />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-zinc-400">
            <span>Đang chờ gọi vào</span>
            <span className="font-mono text-[10px] text-amber-600">{groups.dangCho.length} ca</span>
          </div>
        </button>

        {/* Card 2: ĐANG KHÁM */}
        <button
          type="button"
          onClick={() => jumpTo('flow-dang-lam')}
          className="relative overflow-hidden rounded-3xl p-5 border text-left transition-all duration-300 bg-cyan-500/10 dark:bg-cyan-950/30 border-cyan-500/20 shadow-md shadow-cyan-500/5 hover:scale-[1.015] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl flex items-center justify-center border shadow-xs bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Activity size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
              ĐANG KHÁM
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-jakarta font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {String(groups.dangLam.length).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Bệnh nhân
            </span>
          </div>

          <div className="mt-4 w-full h-1.5 bg-slate-200/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500" style={{ width: `${Math.max(groups.dangLam.length * 20, 10)}%` }} />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-zinc-400">
            <span>Đang gặp chuyên viên</span>
            <span className="font-mono text-[10px] text-cyan-600">{groups.dangLam.length} ca</span>
          </div>
        </button>

        {/* Card 3: ĐÃ XÁC NHẬN */}
        <button
          type="button"
          onClick={() => jumpTo('flow-chua-den')}
          className="relative overflow-hidden rounded-3xl p-5 border text-left transition-all duration-300 bg-indigo-500/10 dark:bg-indigo-950/30 border-indigo-500/20 shadow-md shadow-indigo-500/5 hover:scale-[1.015] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl flex items-center justify-center border shadow-xs bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
              <Users size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
              ĐÃ XÁC NHẬN
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-jakarta font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {String(groups.chuaDen.length).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Lịch hẹn
            </span>
          </div>

          <div className="mt-4 w-full h-1.5 bg-slate-200/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-500" style={{ width: `${Math.max(groups.chuaDen.length * 15, 10)}%` }} />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-zinc-400">
            <span>Đã xác nhận hôm nay</span>
            <span className="font-mono text-[10px] text-indigo-600">{groups.chuaDen.length} ca</span>
          </div>
        </button>

        {/* Card 4: HOÀN THÀNH */}
        <button
          type="button"
          onClick={() => jumpTo('flow-xong')}
          className="relative overflow-hidden rounded-3xl p-5 border text-left transition-all duration-300 bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 shadow-md shadow-emerald-500/5 hover:scale-[1.015] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl flex items-center justify-center border shadow-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
              HOÀN THÀNH
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-jakarta font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {String(groups.xong.length).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Ca khám
            </span>
          </div>

          <div className="mt-4 w-full h-1.5 bg-slate-200/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500" style={{ width: `${Math.max(groups.xong.length * 20, 10)}%` }} />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-zinc-400">
            <span>Đã hoàn thành</span>
            <span className="font-mono text-[10px] text-emerald-600">{groups.xong.length} ca</span>
          </div>
        </button>
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

      <FlowGroup
        id="flow-chua-den"
        title="Chưa đến"
        icon={Users}
        appointments={groups.chuaDen}
        variant="chua_den"
        defaultOpen
        emptyText="Không có lịch hẹn chưa đến"
        emptySubtitle="Tất cả khách hàng đã check-in hoặc chưa có lịch hẹn mới trong ca làm việc."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
        focusAppointmentId={focusAppointmentId}
      />
      <FlowGroup
        id="flow-dang-cho"
        title="Đang chờ"
        icon={Clock3}
        appointments={groups.dangCho}
        variant="dang_cho"
        defaultOpen
        emptyText="Hàng đợi đang trống"
        emptySubtitle="Không có khách hàng nào đang xếp hàng chờ gọi vào phòng khám / lượng giá."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
        onPushBack={onPushBack}
        onMarkNoShow={setPendingNoShow}
        focusAppointmentId={focusAppointmentId}
      />
      <FlowGroup
        id="flow-dang-lam"
        title="Đang làm"
        icon={Activity}
        appointments={groups.dangLam}
        variant="dang_lam"
        defaultOpen
        emptyText="Chưa có ca nào đang thực hiện"
        emptySubtitle="Chuyên viên tư vấn và Kỹ thuật viên sẵn sàng tiếp nhận khách hàng tiếp theo."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
        focusAppointmentId={focusAppointmentId}
      />
      <FlowGroup
        id="flow-xong"
        title="Xong"
        icon={CheckCircle2}
        badge={
          xongChuaThu > 0 ? (
            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-955/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 animate-pulse flex items-center gap-1">
              ⚠ {xongChuaThu} ca chưa thu tiền
            </span>
          ) : undefined
        }
        appointments={groups.xong}
        variant="xong"
        defaultOpen={true}
        emptyText="Chưa có ca hoàn thành"
        emptySubtitle="Các ca lượng giá và trị liệu hoàn thành trong ngày sẽ được tự động chuyển về đây."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
        focusAppointmentId={focusAppointmentId}
      />
      {groups.ngoaiLe.length > 0 && (
        <FlowGroup
          id="flow-ngoai-le"
          title="Ngoại lệ · Đã hủy / Không đến"
          icon={AlertCircle}
          appointments={groups.ngoaiLe}
          variant="ngoai_le"
          defaultOpen={true}
          emptyText="Không có lịch ngoại lệ"
          staffList={staffList}
          onOpenDetailModal={onOpenDetailModal}
          onQuickCheckin={requestCheckin}
          focusAppointmentId={focusAppointmentId}
        />
      )}
      {groups.choTaiLuongGia.length > 0 && (
        <FlowGroup
          id="flow-cho-tai-luong-gia"
          title="Chờ tái lượng giá (Chờ khách quay lại từ chụp chiếu)"
          icon={Sparkles}
          badge={
            <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-955/40 text-amber-800 dark:text-amber-300 border border-amber-200/60">
              🔄 {groups.choTaiLuongGia.length} ca
            </span>
          }
          appointments={groups.choTaiLuongGia}
          variant="chua_den"
          defaultOpen
          emptyText="Không có ca nào chờ tái lượng giá."
          staffList={staffList}
          onOpenDetailModal={onOpenDetailModal}
          onQuickCheckin={requestCheckin}
          focusAppointmentId={focusAppointmentId}
        />
      )}
    </div>
  );
}

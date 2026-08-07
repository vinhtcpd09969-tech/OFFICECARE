import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Phone, User2, Clock3, CheckCircle2, DollarSign, Eye, Users, Activity } from 'lucide-react';
import { Appointment, Staff } from '../types';
import { useNavigate } from 'react-router-dom';
import { statusConfig } from '../../appointmentStatusConfig';
import { isAwaitingPaymentForList, isPaymentDue } from '../../../utils/billing';
import { getSmartSearchScore } from '../../../utils/smartSearch';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { ConfirmDialog } from '../../ConfirmDialog';

const BUOI_LABEL: Record<string, string> = { sang: 'Sáng', chieu: 'Chiều' };
const BUOI_WINDOW: Record<'sang' | 'chieu', { start: number; end: number }> = {
  // Phút trong ngày (0-1439), khớp GIO_NHAN_KHACH backend (7h30-12h00 / 12h00-19h30).
  sang: { start: 7 * 60 + 30, end: 12 * 60 },
  chieu: { start: 12 * 60, end: 19 * 60 + 30 },
};

const TERMINAL_STATUSES = ['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'];

/** Bảng màu cho thẻ chỉ số dạng icon (anchor nav) — khai tĩnh để Tailwind JIT bắt được class, không
 * ghép chuỗi động theo tone. */
const STAT_TONE: Record<'slate' | 'amber' | 'teal' | 'emerald', { bg: string; border: string; icon: string }> = {
  slate: {
    bg: 'bg-slate-50 dark:bg-zinc-800/40',
    border: 'border-slate-150 dark:border-zinc-800',
    icon: 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400',
  },
  amber: {
    bg: 'bg-amber-50/60 dark:bg-amber-955/10',
    border: 'border-amber-150 dark:border-amber-900/30',
    icon: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450',
  },
  teal: {
    bg: 'bg-teal-50/60 dark:bg-teal-955/10',
    border: 'border-teal-150 dark:border-teal-900/30',
    icon: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-450',
  },
  emerald: {
    bg: 'bg-emerald-50/60 dark:bg-emerald-955/10',
    border: 'border-emerald-150 dark:border-emerald-900/30',
    icon: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450',
  },
};

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

    const capacityFor = (vaiTro: string, buoi: 'sang' | 'chieu') => {
      const win = BUOI_WINDOW[buoi];
      let total = 0;
      schedulesList.forEach((sch: any) => {
        if (sch.ngay !== selectedDateStr || sch.trang_thai !== 'hoat_dong') return;
        const staff = staffById.get(String(sch.nguoi_dung_id));
        if (!staff || staff.vai_tro !== vaiTro) return;
        const [sh, sm] = String(sch.gio_bat_dau).split(':').map(Number);
        const [eh, em] = String(sch.gio_ket_thuc).split(':').map(Number);
        const shiftStart = sh * 60 + sm;
        const shiftEnd = eh * 60 + em;
        const from = isToday ? Math.max(nowMins, shiftStart, win.start) : Math.max(shiftStart, win.start);
        const to = Math.min(shiftEnd, win.end);
        total += Math.max(0, to - from);
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
  onOpenDetailModal,
  onQuickCheckin,
}: {
  apt: Appointment;
  variant: RowVariant;
  staffList: Staff[];
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
}) {
  const navigate = useNavigate();
  const meta = statusConfig[apt.trang_thai] || { label: apt.trang_thai, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
  const isPackageSession = apt.loai_goi === 'LIEU_TRINH' && !!apt.so_thu_tu_buoi;
  const waitMinutes = apt.thoi_gian_checkin
    ? Math.max(0, Math.round((Date.now() - new Date(apt.thoi_gian_checkin).getTime()) / 60000))
    : null;

  return (
    <div
      id={`appointment-card-${apt.id}`}
      className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-b-0 hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors"
    >
      {/* Buổi + trạng thái */}
      <div className="w-[112px] shrink-0 flex flex-col gap-1">
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550">
          {apt.buoi ? BUOI_LABEL[apt.buoi] : '—'}
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-1 rounded border w-fit ${meta.color}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* Khách hàng */}
      <div className="w-[160px] shrink-0 min-w-0">
        <p className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate">{apt.ten_khach_hang || apt.ho_ten_khach}</p>
        <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-mono flex items-center gap-1">
          <Phone size={10} />
          {apt.so_dien_thoai}
        </p>
      </div>

      {/* Dịch vụ / gói */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 truncate">
          {apt.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}
          {isPackageSession && (
            <span className="ml-1.5 text-[9px] font-black text-[#0d766e] dark:text-emerald-450 bg-[#0d9488]/10 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
              Buổi {apt.so_thu_tu_buoi}/{apt.tong_so_buoi_goi ?? '?'}
            </span>
          )}
        </p>
        {variant === 'dang_cho' && waitMinutes !== null && (
          <p className="text-[10px] text-amber-600 dark:text-amber-450 font-bold flex items-center gap-1 mt-0.5">
            <Clock3 size={10} /> Chờ {fmtMinutes(waitMinutes)}
          </p>
        )}
      </div>

      {/* Nhân sự — rộng hơn để hiện đủ họ tên đầy đủ (vd "BS. CKI Nguyễn Minh Đức"), không bị cắt "..." */}
      <div className="w-[200px] shrink-0">
        <StaffCell apt={apt} staffList={staffList} />
      </div>

      {/* Thanh toán */}
      <div className="w-[90px] shrink-0">
        {!TERMINAL_STATUSES.includes(apt.trang_thai) && <PaymentBadge apt={apt} />}
      </div>

      {/* Thao tác — nút Thu tiền hiện NGAY tại dòng bất cứ khi nào còn nợ tiền (A8/A10c: thu linh
          hoạt từ check-in tới hoàn thành, không đợi tới lúc xong mới nhắc), không chỉ ở nhóm Xong.
          Căn giữa cụm nút thay vì dồn sát phải, cân đối hơn với các cột còn lại. */}
      <div className="w-[160px] shrink-0 flex items-center justify-center gap-1.5">
        {variant === 'chua_den' && (
          <button
            type="button"
            onClick={() => onQuickCheckin(apt)}
            className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center gap-1"
          >
            <CheckCircle2 size={11} /> Check-in
          </button>
        )}
        {/* Không hiện ở "Chưa đến" — hàng đó đã có Check-in làm nút chính, chật thêm nút thứ 2 chỉ
            gây rối; khách chưa đến vẫn thu được qua "Xem" (DetailModal đã có nút thu linh hoạt). */}
        {variant !== 'chua_den' && !TERMINAL_STATUSES.includes(apt.trang_thai) && isPaymentDue(apt) && (
          <button
            type="button"
            onClick={() => navigate(`/receptionist/billing?lich_dat_id=${apt.id}`)}
            className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1"
          >
            <DollarSign size={11} /> Thu tiền
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenDetailModal(apt)}
          className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-750 text-slate-600 dark:text-zinc-350 hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-400 transition-colors flex items-center gap-1"
        >
          <Eye size={11} /> Xem
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
    <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50/40 dark:bg-zinc-800/25 border-b border-slate-100 dark:border-zinc-800/80 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-550">
      <div className="w-[112px] shrink-0">Buổi/TT</div>
      <div className="w-[160px] shrink-0">Khách hàng</div>
      <div className="flex-1 min-w-0">Dịch vụ / Gói</div>
      <div className="w-[200px] shrink-0">Nhân sự / Phòng</div>
      <div className="w-[90px] shrink-0">Thanh toán</div>
      <div className="w-[160px] shrink-0 text-center">Thao tác</div>
    </div>
  );
}

function FlowGroup({
  id,
  title,
  badge,
  appointments,
  variant,
  staffList,
  defaultOpen,
  emptyText,
  onOpenDetailModal,
  onQuickCheckin,
}: {
  id: string;
  title: string;
  badge?: React.ReactNode;
  appointments: Appointment[];
  variant: 'chua_den' | 'dang_cho' | 'dang_lam' | 'xong' | 'ngoai_le';
  staffList: Staff[];
  defaultOpen: boolean;
  emptyText: string;
  onOpenDetailModal: (apt: Appointment) => void;
  onQuickCheckin: (apt: Appointment) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl overflow-hidden scroll-mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/70 dark:bg-zinc-800/40 hover:bg-slate-100/70 dark:hover:bg-zinc-800/70 transition-colors"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200">{title}</span>
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">({appointments.length})</span>
        </span>
        {badge}
      </button>
      {open && (
        appointments.length === 0 ? (
          <p className="px-4 py-6 text-center text-[11px] text-slate-400 dark:text-zinc-550 font-semibold">{emptyText}</p>
        ) : (
          <>
            <ColumnHeaderRow />
            <div className="max-h-[340px] overflow-y-auto scrollbar-thin">
              {appointments.map((apt) => (
                <AppointmentRow key={apt.id} apt={apt} variant={variant} staffList={staffList} onOpenDetailModal={onOpenDetailModal} onQuickCheckin={onQuickCheckin} />
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
  onOpenWalkInModal,
  focusAppointmentId,
  staffFilterId,
  staffFilterOptions,
  onStaffFilterChange,
}: TodayFlowBoardProps) {
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

    const dangCho = searched
      .filter((a) => a.trang_thai === 'da_checkin')
      .sort((a, b) => new Date(a.thoi_gian_checkin || 0).getTime() - new Date(b.thoi_gian_checkin || 0).getTime());

    const dangLam = searched.filter((a) => ['dang_kham', 'cho_tai_luong_gia'].includes(a.trang_thai));

    const xong = searched
      .filter((a) => a.trang_thai === 'hoan_thanh')
      .sort((a, b) => new Date(b.thoi_gian_tao || 0).getTime() - new Date(a.thoi_gian_tao || 0).getTime());

    const ngoaiLe = searched.filter((a) => TERMINAL_STATUSES.includes(a.trang_thai));

    return { chuaDen, dangCho, dangLam, xong, ngoaiLe };
  }, [searched]);

  const xongChuaThu = groups.xong.filter(isAwaitingPaymentForList).length;

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Check-in là thao tác đổi trạng thái tức thời (không giống "Thu tiền" — nút đó chỉ điều hướng
  // sang trang thanh toán, nơi tự có bước xác nhận riêng của chính nó) — bấm nhầm 1 cái là dữ liệu
  // sai ngay, nên bắt buộc phải qua 1 bước xác nhận trước khi gọi API thật.
  const [pendingCheckin, setPendingCheckin] = useState<Appointment | null>(null);
  const requestCheckin = (apt: Appointment) => setPendingCheckin(apt);

  return (
    <div className="space-y-4">
      {/* Sức khỏe ca (B21) + dropdown lọc nhân sự (chỉ Admin truyền staffFilterOptions) trên cùng 1
          hàng — gộp lại vì cả hai đều là công cụ "nhìn nhanh trước khi làm việc" của ca đang xem. */}
      <div className="flex flex-col lg:flex-row gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {sucKhoeCa.map((b) => (
          <div
            key={b.buoi}
            className={`rounded-2xl border p-3.5 ${
              b.isPast
                ? 'bg-slate-50/60 dark:bg-zinc-800/20 border-slate-150 dark:border-zinc-800 opacity-60'
                : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Sức khỏe ca {b.label} {b.isCurrent && <span className="text-teal-600 dark:text-teal-450">· đang diễn ra</span>}
              </span>
            </div>
            <div className={`grid gap-2 ${b.roles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {b.roles.map((r) => (
                <div
                  key={r.label}
                  className={`rounded-xl px-2.5 py-2 text-[10px] font-bold ${
                    r.over
                      ? 'bg-rose-50 dark:bg-rose-955/15 text-rose-700 dark:text-rose-450'
                      : 'bg-emerald-50/60 dark:bg-emerald-955/10 text-emerald-700 dark:text-emerald-450'
                  }`}
                >
                  <div className="uppercase tracking-wider text-[9px] opacity-70 mb-0.5">{r.label}</div>
                  <div>còn {fmtMinutes(r.capacity)} · cần {fmtMinutes(r.demand)}</div>
                  {r.over && <div className="mt-0.5">⚠ Vượt {fmtMinutes(r.demand - r.capacity)}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {staffFilterOptions && staffFilterOptions.length > 0 && (
        <div className="lg:w-64 shrink-0 rounded-2xl border border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
            Lọc theo {activeType === 'kham' ? 'chuyên viên' : 'KTV'} ({staffFilterOptions.length})
          </label>
          <select
            value={staffFilterId || ''}
            onChange={(e) => onStaffFilterChange?.(e.target.value || null)}
            className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả</option>
            {staffFilterOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      </div>

      {/* Anchor nav nhanh — nâng từ pill trơn lên thẻ có icon (kiểu ô chỉ số app thời tiết: icon
          tròn + số lớn + nhãn caption), vẫn giữ hành vi bấm-để-cuộn-tới-nhóm cũ. */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {[
            { id: 'flow-chua-den', label: 'Chưa đến', count: groups.chuaDen.length, icon: Users, tone: 'slate' as const },
            { id: 'flow-dang-cho', label: 'Đang chờ', count: groups.dangCho.length, icon: Clock3, tone: 'amber' as const },
            { id: 'flow-dang-lam', label: 'Đang làm', count: groups.dangLam.length, icon: Activity, tone: 'teal' as const },
            { id: 'flow-xong', label: 'Xong', count: groups.xong.length, icon: CheckCircle2, tone: 'emerald' as const },
          ].map((chip) => {
            const Icon = chip.icon;
            const tone = STAT_TONE[chip.tone];
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => jumpTo(chip.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border transition-all hover:shadow-sm text-left ${tone.bg} ${tone.border}`}
              >
                <span className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${tone.icon}`}>
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black text-slate-800 dark:text-zinc-100 leading-none font-mono">{chip.count}</span>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-1 truncate">{chip.label}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onOpenWalkInModal}
          className="text-[11px] font-black px-3.5 py-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm shrink-0"
        >
          + Đặt lịch mới
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

      <FlowGroup
        id="flow-chua-den"
        title="Chưa đến"
        appointments={groups.chuaDen}
        variant="chua_den"
        defaultOpen
        emptyText="Không còn khách nào chưa đến."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
      />
      <FlowGroup
        id="flow-dang-cho"
        title="Đang chờ"
        appointments={groups.dangCho}
        variant="dang_cho"
        defaultOpen
        emptyText="Không có khách nào đang chờ trong hàng đợi."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
      />
      <FlowGroup
        id="flow-dang-lam"
        title="Đang làm"
        appointments={groups.dangLam}
        variant="dang_lam"
        defaultOpen
        emptyText="Không có ca nào đang thực hiện."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
      />
      <FlowGroup
        id="flow-xong"
        title="Xong"
        badge={
          xongChuaThu > 0 ? (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-955/25 text-rose-700 dark:text-rose-450">
              ⚠ {xongChuaThu} chưa thu
            </span>
          ) : undefined
        }
        appointments={groups.xong}
        variant="xong"
        defaultOpen={!!focusAppointmentId && groups.xong.some((a) => String(a.id) === focusAppointmentId)}
        emptyText="Chưa có ca nào hoàn thành."
        staffList={staffList}
        onOpenDetailModal={onOpenDetailModal}
        onQuickCheckin={requestCheckin}
      />
      {groups.ngoaiLe.length > 0 && (
        <FlowGroup
          id="flow-ngoai-le"
          title="Ngoại lệ · Đã hủy / Không đến"
          appointments={groups.ngoaiLe}
          variant="ngoai_le"
          defaultOpen={!!focusAppointmentId && groups.ngoaiLe.some((a) => String(a.id) === focusAppointmentId)}
          emptyText=""
          staffList={staffList}
          onOpenDetailModal={onOpenDetailModal}
          onQuickCheckin={requestCheckin}
        />
      )}
    </div>
  );
}

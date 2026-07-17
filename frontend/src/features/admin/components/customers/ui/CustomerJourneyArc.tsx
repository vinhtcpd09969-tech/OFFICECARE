import { Stethoscope, Sparkles, TrendingUp } from 'lucide-react';
import { TIER_META } from '../constants';
import type { CustomerStatusFilter, CustomerTierCounts } from '../types';

interface CustomerJourneyArcProps {
  totalCustomers: number;
  newThisMonth: number;
  tierCounts: CustomerTierCounts;
  khamHoanThanh: number;
  dichVuLeHoanThanh: number;
  totalRevenue: number;
  activeTier: CustomerStatusFilter | 'all';
  onFilterChange: (tier: CustomerStatusFilter | 'all') => void;
}

function fmtVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

interface WaypointDef {
  key: CustomerStatusFilter;
  label: string;
  left: string;
  top: string;
  dotColor: string;
  ringColor: string;
  small?: boolean;
}

// Từ "Tổng khách hàng" tách 1 nhánh rẽ TRÊN-TRÁI cho khách CHƯA dùng liệu trình (chưa có hồ sơ điều
// trị). Trục CHÍNH đi thẳng sang phải, nằm trọn trên 1 đường liền: Tổng liệu trình → chờ kích hoạt →
// đang điều trị → hoàn thành → đã hủy — "đã hủy" giờ là điểm cuối trên chính đường line (không còn
// là nhánh phụ tách rời) vì nó vẫn là 1 kết cục thuộc hành trình liệu trình, chỉ tô màu rust để phân
// biệt đây là kết cục cần chú ý, khác với "hoàn thành" (tích cực).
const LEFT_FORK: WaypointDef[] = [
  { key: 'none', label: TIER_META.none.label, left: '17.3%', top: '34.6%', small: true, dotColor: 'var(--rc-taupe)', ringColor: 'rgba(138,133,120,0.3)' }
];

const MAIN_WAYPOINTS: WaypointDef[] = [
  { key: 'any_plan', label: 'Tổng liệu trình', left: '29.8%', top: '59.6%', dotColor: 'var(--rc-clay)', ringColor: 'rgba(198,93,59,0.22)' },
  { key: 'pending', label: TIER_META.pending.label, left: '46.2%', top: '45.4%', dotColor: 'var(--rc-clay)', ringColor: 'rgba(198,93,59,0.22)' },
  { key: 'progress', label: TIER_META.progress.label, left: '62.5%', top: '28.8%', dotColor: 'var(--rc-clay)', ringColor: 'rgba(198,93,59,0.22)' },
  { key: 'done', label: TIER_META.done.label, left: '77.9%', top: '14.6%', dotColor: 'var(--rc-clay)', ringColor: 'rgba(198,93,59,0.22)' },
  { key: 'cancel', label: TIER_META.cancel.label, left: '95.2%', top: '5.4%', dotColor: 'var(--rc-rust)', ringColor: 'rgba(139,58,46,0.28)' }
];

// "Đường cong Phục hồi" — thay thế card thống kê tĩnh + hàng chip lọc trạng thái cũ. Mỗi trạm trên
// đường cong vừa hiển thị số liệu vừa LÀ nút lọc bảng theo trạng thái đó (bấm lại "Tổng" để bỏ lọc).
export function CustomerJourneyArc({
  totalCustomers, newThisMonth, tierCounts, khamHoanThanh, dichVuLeHoanThanh, totalRevenue,
  activeTier, onFilterChange
}: CustomerJourneyArcProps) {
  const mainD = 'M50,170 C140,166 220,162 310,155 C360,148 420,135 480,118 C530,103 580,90 650,75 C700,64 750,50 810,38 C860,28 920,20 990,14';
  const leftForkD = 'M50,170 C90,138 130,112 180,90';

  const anyPlanCount = tierCounts.pending + tierCounts.progress + tierCounts.done + tierCounts.cancel;
  const countFor = (key: CustomerStatusFilter): number =>
    key === 'any_plan' ? anyPlanCount : (tierCounts[key as keyof CustomerTierCounts] ?? 0);

  // QUAN TRỌNG: chỉ canh giữa theo chiều NGANG (-translate-x-1/2). Nếu canh giữa cả chiều dọc thì
  // nửa trên của khối số+chữ sẽ tràn ngược lên trên điểm — tức đè lên chính đường cong phía trên nó
  // (đây là nguyên nhân thật sự khiến số/chữ "dính" vào line, không phải do thiếu khoảng cách).
  // Để chấm nằm đúng tại điểm trên đường cong, dùng margin-top âm bằng đúng nửa kích thước chấm
  // thay vì dịch chuyển cả khối.
  const renderDot = (wp: WaypointDef) => {
    const isActive = activeTier === wp.key;
    const count = countFor(wp.key);
    const size = wp.small ? 11 : 13;
    return (
      <button
        key={wp.key}
        type="button"
        onClick={() => onFilterChange(isActive ? 'all' : wp.key)}
        className="absolute -translate-x-1/2 text-center bg-transparent border-none cursor-pointer group"
        style={{ left: wp.left, top: wp.top, marginTop: -size / 2 }}
      >
        <span
          className="block mx-auto mb-4 rounded-full transition-all group-hover:scale-110"
          style={{
            width: size, height: size,
            background: isActive ? wp.dotColor : 'var(--rc-moss)',
            border: `2.5px solid ${isActive ? wp.dotColor : 'rgba(245,244,239,0.5)'}`,
            boxShadow: isActive ? `0 0 0 6px ${wp.ringColor}` : 'none',
            transform: isActive ? 'scale(1.2)' : 'scale(1)'
          }}
        />
        <span className="rc-mono block font-semibold leading-none whitespace-nowrap" style={{ fontSize: wp.small ? 19 : 25, color: isActive ? wp.dotColor : (wp.small ? 'rgba(245,244,239,0.85)' : 'var(--rc-fog)') }}>
          {count}
        </span>
        <span className="block mt-1.5 text-[10.5px] uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(245,244,239,0.6)' }}>
          {wp.label}
        </span>
      </button>
    );
  };

  return (
    <div className="recovery-arc-scope rounded-[22px] p-7 pb-5 relative overflow-hidden shadow-sm" style={{ background: 'var(--rc-moss)' }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(520px 260px at 88% -10%, rgba(198,93,59,0.20), transparent 70%)' }}
      />

      <div className="relative w-full" style={{ height: 260 }}>
        <svg viewBox="0 0 1040 260" preserveAspectRatio="none" className="w-full h-full overflow-visible" aria-hidden="true">
          <path d={mainD} fill="none" stroke="rgba(245,244,239,0.24)" strokeWidth={2.5} strokeLinecap="round" />
          <path d={mainD} fill="none" stroke="var(--rc-clay)" strokeWidth={2.5} strokeLinecap="round" className="rc-arc-path-progress" />
          <path d={leftForkD} fill="none" stroke="rgba(138,133,120,0.5)" strokeWidth={2} strokeLinecap="round" strokeDasharray="3 7" />
        </svg>

        {/* Trạm "Tổng khách hàng" — bấm để bỏ lọc, luôn hiện tổng số khách thật (không đổi theo filter) */}
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className="absolute -translate-x-1/2 text-center bg-transparent border-none cursor-pointer"
          style={{ left: '4.8%', top: '65.4%', marginTop: -6.5 }}
        >
          <span
            className="block mx-auto mb-4 rounded-full transition-all"
            style={{
              width: 13, height: 13,
              background: activeTier === 'all' ? 'var(--rc-clay)' : 'var(--rc-fog)',
              border: `2.5px solid ${activeTier === 'all' ? 'var(--rc-clay)' : 'var(--rc-fog)'}`,
              boxShadow: activeTier === 'all' ? '0 0 0 6px rgba(198,93,59,0.22)' : 'none',
              transform: activeTier === 'all' ? 'scale(1.2)' : 'scale(1)'
            }}
          />
          <span className="rc-mono block font-semibold text-[28px] leading-none whitespace-nowrap" style={{ color: activeTier === 'all' ? 'var(--rc-clay)' : 'var(--rc-fog)' }}>
            {totalCustomers}
          </span>
          <span className="block mt-1.5 text-[10.5px] uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(245,244,239,0.6)' }}>
            Tổng khách hàng
          </span>
        </button>

        {LEFT_FORK.map(renderDot)}
        {MAIN_WAYPOINTS.map(renderDot)}
      </div>

      <div className="relative flex flex-wrap gap-6 pt-4 mt-1" style={{ borderTop: '1px solid rgba(245,244,239,0.14)' }}>
        <div className="flex items-center gap-2.5">
          <div className="size-[30px] rounded-[9px] flex items-center justify-center shrink-0" style={{ background: 'rgba(245,244,239,0.1)', color: 'var(--rc-fog)' }}>
            <Stethoscope size={15} />
          </div>
          <div>
            <div className="rc-display font-semibold text-base" style={{ color: 'var(--rc-fog)' }}>{khamHoanThanh} buổi</div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'rgba(245,244,239,0.55)' }}>Khám thành công (toàn hệ thống)</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="size-[30px] rounded-[9px] flex items-center justify-center shrink-0" style={{ background: 'rgba(245,244,239,0.1)', color: 'var(--rc-fog)' }}>
            <Sparkles size={15} />
          </div>
          <div>
            <div className="rc-display font-semibold text-base" style={{ color: 'var(--rc-fog)' }}>{dichVuLeHoanThanh} buổi</div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'rgba(245,244,239,0.55)' }}>Dịch vụ lẻ (toàn hệ thống)</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="size-[30px] rounded-[9px] flex items-center justify-center shrink-0" style={{ background: 'rgba(245,244,239,0.1)', color: 'var(--rc-fog)' }}>
            <TrendingUp size={15} />
          </div>
          <div>
            <div className="rc-mono font-semibold text-base" style={{ color: 'var(--rc-fog)' }}>{fmtVND(totalRevenue)}</div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'rgba(245,244,239,0.55)' }}>Doanh thu ghi nhận</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 ml-auto">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-right" style={{ color: 'rgba(245,244,239,0.55)' }}>Khách mới tháng này</div>
            <div className="rc-display font-semibold text-base text-right" style={{ color: 'var(--rc-clay)' }}>+{newThisMonth}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

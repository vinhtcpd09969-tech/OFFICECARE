import { Search } from 'lucide-react';
import { PLAN_STATUS_META } from '../constants';
import type { TreatmentPlanStatus } from '../types';

interface TreatmentPlanFilterToolbarProps {
  activeStatus: TreatmentPlanStatus | 'all';
  onStatusChange: (status: TreatmentPlanStatus | 'all') => void;
  counts: { dang_dieu_tri: number; qua_han: number; hoan_thanh: number; huy: number; tong: number };
  search: string;
  onSearchChange: (value: string) => void;
}

const CHIP_ORDER: (TreatmentPlanStatus | 'all')[] = ['all', 'dang_dieu_tri', 'qua_han', 'hoan_thanh', 'huy'];

function chipLabel(key: TreatmentPlanStatus | 'all') {
  return key === 'all' ? 'Tất cả' : PLAN_STATUS_META[key].label;
}

// "Tất cả" ở đây là tổng LIỆU TRÌNH THẬT (đã có dòng phac_do_dieu_tri) — không dùng counts.tong vì
// counts.tong còn cộng cả cho_kich_hoat (gói mới kê đơn, CHƯA có dòng phac_do_dieu_tri, không bao
// giờ xuất hiện trong bảng này), cộng vào sẽ ra số lớn hơn số dòng bảng thật sự có thể trả về.
function chipCount(key: TreatmentPlanStatus | 'all', counts: TreatmentPlanFilterToolbarProps['counts']) {
  if (key === 'all') return counts.dang_dieu_tri + counts.qua_han + counts.hoan_thanh + counts.huy;
  return counts[key];
}

// Bộ lọc theo ĐÚNG trạng thái thật của 1 liệu trình (khác CustomerFilterToolbar — lọc theo "trạng
// thái chính" của 1 khách hàng) — mục đích chính là cho phép lọc ra mọi liệu trình hoàn thành/hủy mà
// funnel bên tab "Theo khách hàng" không lọc được (bị tier gần hơn của cùng khách che mất).
export function TreatmentPlanFilterToolbar({ activeStatus, onStatusChange, counts, search, onSearchChange }: TreatmentPlanFilterToolbarProps) {
  return (
    <div className="recovery-arc-scope flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--rc-taupe)' }} />
        <input
          type="text"
          placeholder="Tìm theo tên khách hàng, số điện thoại hoặc tên gói…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2.5 rounded-[9px] text-[13px] outline-none transition-all"
          style={{ background: 'var(--rc-card)', border: '1px solid var(--rc-line)', color: 'var(--rc-ink)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--rc-clay)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--rc-line)'; }}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {CHIP_ORDER.map(key => {
          const isActive = activeStatus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[12px] font-bold transition-all whitespace-nowrap"
              style={
                isActive
                  ? { background: 'var(--rc-clay-soft)', border: '1px solid var(--rc-clay)', color: 'var(--rc-clay)' }
                  : { background: 'var(--rc-card)', border: '1px solid var(--rc-line)', color: 'var(--rc-taupe)' }
              }
            >
              {chipLabel(key)}
              <span
                className="rc-mono text-[10.5px] px-1.5 rounded-full"
                style={{ background: isActive ? 'rgba(198,93,59,0.16)' : 'var(--rc-track)', color: isActive ? 'var(--rc-clay)' : 'var(--rc-taupe)' }}
              >
                {chipCount(key, counts)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

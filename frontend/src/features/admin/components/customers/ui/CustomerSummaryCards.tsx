import { Users, ClipboardX } from 'lucide-react';
import type { CustomerRecordFilter } from '../hooks/useCustomerFilters';

interface CustomerSummaryCardsProps {
  totalCustomers: number;
  customersWithoutRecord: number;
  activeFilter: CustomerRecordFilter;
  onFilterChange: (filter: CustomerRecordFilter) => void;
}

interface SummaryCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  isActive: boolean;
  onClick: () => void;
}

function SummaryCard({ icon, iconBg, iconColor, label, value, isActive, onClick }: SummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 w-full cursor-pointer"
      style={{
        background: 'var(--rc-card)',
        border: `1px solid ${isActive ? 'var(--rc-clay)' : 'var(--rc-line)'}`,
        boxShadow: isActive ? '0 0 0 3px var(--rc-clay-soft)' : 'none'
      }}
    >
      <div
        className="size-11 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[10.5px] uppercase tracking-wider font-bold" style={{ color: 'var(--rc-taupe)' }}>
          {label}
        </div>
        <div className="rc-display text-2xl font-semibold mt-0.5" style={{ color: 'var(--rc-ink)' }}>
          {value}
        </div>
        <div className="text-[9.5px] font-semibold mt-1" style={{ color: isActive ? 'var(--rc-clay)' : 'var(--rc-taupe)' }}>
          {isActive ? 'Đang lọc theo mục này — bấm lại để bỏ lọc' : 'Click để xem chi tiết'}
        </div>
      </div>
    </button>
  );
}

// Thay cho biểu đồ funnel cũ — 2 card bấm được để lọc bảng khách hàng bên dưới (khớp hành vi
// click-to-filter của "Đường cong Phục hồi" trước đây, chỉ rút gọn còn 2 trục: tổng/chưa có hồ sơ).
export function CustomerSummaryCards({ totalCustomers, customersWithoutRecord, activeFilter, onFilterChange }: CustomerSummaryCardsProps) {
  return (
    <div className="recovery-arc-scope grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SummaryCard
        icon={<Users size={19} />}
        iconBg="var(--rc-sage-soft)"
        iconColor="var(--rc-sage)"
        label="Tổng khách hàng"
        value={totalCustomers}
        isActive={activeFilter === 'all'}
        onClick={() => onFilterChange('all')}
      />
      <SummaryCard
        icon={<ClipboardX size={19} />}
        iconBg="var(--rc-clay-soft)"
        iconColor="var(--rc-clay)"
        label="Chưa có hồ sơ điều trị"
        value={customersWithoutRecord}
        isActive={activeFilter === 'no_record'}
        onClick={() => onFilterChange('no_record')}
      />
    </div>
  );
}

import { Users, ClipboardX, X } from 'lucide-react';
import type { CustomerRecordFilter } from '../hooks/useCustomerFilters';

interface CustomerSummaryCardsProps {
  totalCustomers: number;
  customersWithoutRecord: number;
  activeFilter: CustomerRecordFilter;
  onFilterChange: (filter: CustomerRecordFilter) => void;
}

export function CustomerSummaryCards({
  totalCustomers,
  customersWithoutRecord,
  activeFilter,
  onFilterChange,
}: CustomerSummaryCardsProps) {
  const isNoRecordActive = activeFilter === 'no_record';

  return (
    <div className="recovery-arc-scope grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Card Tổng Khách Hàng - Tĩnh, không bấm lọc */}
      <div
        className="flex items-center gap-4 rounded-2xl p-5 text-left w-full select-none"
        style={{
          background: 'var(--rc-card)',
          border: '1px solid var(--rc-line)',
        }}
      >
        <div
          className="size-11 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'var(--rc-sage-soft)', color: 'var(--rc-sage)' }}
        >
          <Users size={19} />
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider font-bold" style={{ color: 'var(--rc-taupe)' }}>
            Tổng khách hàng
          </div>
          <div className="rc-display text-2xl font-semibold mt-0.5" style={{ color: 'var(--rc-ink)' }}>
            {totalCustomers}
          </div>
          <div className="text-[9.5px] font-semibold mt-1" style={{ color: 'var(--rc-taupe)' }}>
            Tất cả hồ sơ trong hệ thống
          </div>
        </div>
      </div>

      {/* 2. Card Chưa Có Hồ Sơ Điều Trị - Bấm lọc & Có nút X ở góc phải để bỏ lọc */}
      <div
        onClick={() => {
          if (!isNoRecordActive) {
            onFilterChange('no_record');
          }
        }}
        className={`relative flex items-center gap-4 rounded-2xl p-5 text-left transition-all w-full ${
          !isNoRecordActive ? 'hover:-translate-y-0.5 cursor-pointer' : ''
        }`}
        style={{
          background: 'var(--rc-card)',
          border: `1px solid ${isNoRecordActive ? 'var(--rc-clay)' : 'var(--rc-line)'}`,
          boxShadow: isNoRecordActive ? '0 0 0 3px var(--rc-clay-soft)' : 'none',
        }}
      >
        {/* Nút X ở góc phải trên cùng khi đang lọc */}
        {isNoRecordActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFilterChange('all');
            }}
            title="Bỏ lọc, quay về tổng khách hàng"
            className="absolute top-3.5 right-3.5 size-7 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-90"
          >
            <X size={14} className="stroke-[2.5]" />
          </button>
        )}

        <div
          className="size-11 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'var(--rc-clay-soft)', color: 'var(--rc-clay)' }}
        >
          <ClipboardX size={19} />
        </div>
        <div className="pr-6">
          <div className="text-[10.5px] uppercase tracking-wider font-bold" style={{ color: 'var(--rc-taupe)' }}>
            Chưa có hồ sơ điều trị
          </div>
          <div className="rc-display text-2xl font-semibold mt-0.5" style={{ color: 'var(--rc-ink)' }}>
            {customersWithoutRecord}
          </div>
          <div className="text-[9.5px] font-semibold mt-1" style={{ color: isNoRecordActive ? 'var(--rc-clay)' : 'var(--rc-taupe)' }}>
            {isNoRecordActive ? 'Đang lọc danh sách — bấm ✖ để bỏ lọc' : 'Click để xem danh sách chi tiết'}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Search, Filter } from 'lucide-react';
import {
  INVOICE_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  INVOICE_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  DATE_FILTER_OPTIONS,
} from '../constants';

interface FinanceFilterBarProps {
  activeTab: 'invoices' | 'payments';
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  itemTypeFilter: string;
  onItemTypeChange: (value: string) => void;
  methodFilter: string;
  onMethodChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
}

// Tách khỏi index.tsx, giữ nguyên logic lọc client-side hiện có — chỉ đổi vị trí control theo
// ngữ cảnh tab đang active (Hóa đơn: loại hóa đơn; Giao dịch: phương thức).
export function FinanceFilterBar({
  activeTab,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  itemTypeFilter,
  onItemTypeChange,
  methodFilter,
  onMethodChange,
  dateFilter,
  onDateChange,
}: FinanceFilterBarProps) {
  const statusOptions = activeTab === 'invoices' ? INVOICE_STATUS_OPTIONS : PAYMENT_TYPE_OPTIONS;
  const statusLabel = activeTab === 'invoices' ? 'Trạng thái' : 'Loại giao dịch';
  const statusPlaceholder = activeTab === 'invoices' ? 'Tất cả trạng thái' : 'Tất cả loại giao dịch';

  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-150 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
        <Filter className="text-primary size-4" />
        <h3 className="font-heading font-black text-secondary text-xs uppercase tracking-wider">Bộ lọc tài chính nâng cao</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Tìm kiếm</label>
          <div className="relative">
            <Search className="size-4.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Mã HĐ, Mã giao dịch, tên khách hàng..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary transition-all text-xs font-semibold text-secondary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">{statusLabel}</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
          >
            <option value="all">{statusPlaceholder}</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {activeTab === 'invoices' ? (
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Loại hóa đơn</label>
            <select
              value={itemTypeFilter}
              onChange={(e) => onItemTypeChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
            >
              <option value="all">Tất cả danh mục</option>
              {INVOICE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Phương thức</label>
            <select
              value={methodFilter}
              onChange={(e) => onMethodChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
            >
              <option value="all">Tất cả phương thức</option>
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Thời gian tạo</label>
          <select
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
          >
            <option value="all">Tất cả thời gian</option>
            {DATE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default FinanceFilterBar;

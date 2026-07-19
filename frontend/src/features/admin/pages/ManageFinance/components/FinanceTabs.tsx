import { Receipt, Landmark } from 'lucide-react';

interface FinanceTabsProps {
  activeTab: 'invoices' | 'payments';
  invoiceCount: number;
  paymentCount: number;
  onChange: (tab: 'invoices' | 'payments') => void;
}

// Segmented control ngang thay cho sidebar dọc 1/4 chỉ để chứa 2 nút — theo đúng pattern pill đã
// dùng ở ViewFeedback/index.tsx, nhường toàn bộ chiều rộng còn lại cho bảng dữ liệu.
export function FinanceTabs({ activeTab, invoiceCount, paymentCount, onChange }: FinanceTabsProps) {
  const tabClass = (tab: 'invoices' | 'payments') =>
    `px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
      activeTab === tab
        ? 'bg-white text-primary shadow-xs border border-zinc-200/20 scale-[1.02]'
        : 'text-zinc-500 hover:text-zinc-700'
    }`;

  return (
    <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-fit shadow-inner">
      <button type="button" onClick={() => onChange('invoices')} className={tabClass('invoices')}>
        <Receipt size={14} />
        Danh sách hóa đơn ({invoiceCount})
      </button>
      <button type="button" onClick={() => onChange('payments')} className={tabClass('payments')}>
        <Landmark size={14} />
        Lịch sử giao dịch ({paymentCount})
      </button>
    </div>
  );
}

export default FinanceTabs;

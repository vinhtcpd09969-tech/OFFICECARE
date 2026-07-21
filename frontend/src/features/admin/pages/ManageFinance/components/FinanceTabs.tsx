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
  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl w-fit shadow-2xs border border-zinc-200/60 dark:border-zinc-800 select-none">
      <button
        type="button"
        onClick={() => onChange('invoices')}
        className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer ${
          activeTab === 'invoices'
            ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm border border-teal-500/20 scale-[1.01]'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
        }`}
      >
        <Receipt size={15} className={activeTab === 'invoices' ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'} />
        <span>Danh sách hóa đơn</span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
          activeTab === 'invoices' 
            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50' 
            : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
        }`}>
          {invoiceCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('payments')}
        className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer ${
          activeTab === 'payments'
            ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-sm border border-teal-500/20 scale-[1.01]'
            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
        }`}
      >
        <Landmark size={15} className={activeTab === 'payments' ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'} />
        <span>Lịch sử giao dịch</span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
          activeTab === 'payments' 
            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/50' 
            : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
        }`}>
          {paymentCount}
        </span>
      </button>
    </div>
  );
}

export default FinanceTabs;

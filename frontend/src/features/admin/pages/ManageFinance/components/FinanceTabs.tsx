import { Receipt, Landmark } from 'lucide-react';

interface FinanceTabsProps {
  activeTab: 'invoices' | 'payments';
  invoiceCount: number;
  paymentCount: number;
  onChange: (tab: 'invoices' | 'payments') => void;
}

export function FinanceTabs({ activeTab, invoiceCount, paymentCount, onChange }: FinanceTabsProps) {
  return (
    <div className="flex bg-slate-100/90 dark:bg-slate-800 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-200/80 dark:border-slate-700 select-none font-jakarta">
      <button
        type="button"
        onClick={() => onChange('invoices')}
        className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer ${
          activeTab === 'invoices'
            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 scale-[1.02]'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Receipt size={16} className={activeTab === 'invoices' ? 'text-white' : 'text-slate-400'} />
        <span>Danh sách hóa đơn</span>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          activeTab === 'invoices' 
            ? 'bg-white/20 text-white border border-white/20' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          {invoiceCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('payments')}
        className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer ${
          activeTab === 'payments'
            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 scale-[1.02]'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Landmark size={16} className={activeTab === 'payments' ? 'text-white' : 'text-slate-400'} />
        <span>Lịch sử giao dịch thanh toán</span>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          activeTab === 'payments' 
            ? 'bg-white/20 text-white border border-white/20' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}>
          {paymentCount}
        </span>
      </button>
    </div>
  );
}

export default FinanceTabs;

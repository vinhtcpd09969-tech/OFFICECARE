import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { useCustomerInvoices } from './hooks/useCustomerInvoices';
import { InvoiceCard } from './components/InvoiceCard';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { TermsOfServiceModal } from '../../../../components/TermsOfServiceModal';

type TypeFilter = 'all' | 'LIEU_TRINH' | 'other';

const FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'LIEU_TRINH', label: 'Gói liệu trình' },
  { key: 'other', label: 'Khám & dịch vụ lẻ' },
];

export default function CustomerInvoices() {
  const { invoices, payments, loading, selectedInvoice, setSelectedInvoice } = useCustomerInvoices();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showPolicy, setShowPolicy] = useState(false);
  const [searchParams] = useSearchParams();
  const [autoOpenRefund, setAutoOpenRefund] = useState(false);

  // Nhảy tới từ nút "Hủy liệu trình" ở trang Hồ sơ trị liệu (?invoice=<hoa_don_id>&refund=1) — tự
  // mở đúng hóa đơn và bung sẵn bảng xem trước hoàn tiền, chỉ áp dụng 1 lần lúc dữ liệu vừa tải xong.
  const deepLinkApplied = useRef(false);
  useEffect(() => {
    if (deepLinkApplied.current || loading || invoices.length === 0) return;
    const invoiceId = searchParams.get('invoice');
    if (!invoiceId) return;
    deepLinkApplied.current = true;
    const match = invoices.find((i) => i.id === invoiceId);
    if (match) {
      setSelectedInvoice(match);
      setAutoOpenRefund(searchParams.get('refund') === '1');
    }
  }, [loading, invoices, searchParams, setSelectedInvoice]);

  const filteredInvoices = useMemo(() => {
    if (typeFilter === 'all') return invoices;
    if (typeFilter === 'LIEU_TRINH') return invoices.filter((i) => i.loai_goi === 'LIEU_TRINH');
    return invoices.filter((i) => i.loai_goi !== 'LIEU_TRINH');
  }, [invoices, typeFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-zinc-500">Đang tải hóa đơn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Receipt size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-secondary">Hóa đơn của tôi</h1>
            <p className="text-xs text-zinc-500 font-semibold">Toàn bộ hóa đơn khám, dịch vụ lẻ và gói liệu trình đã phát sinh</p>
          </div>
        </div>

        <div className="flex gap-1.5 bg-zinc-100 p-1 rounded-2xl">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTypeFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                typeFilter === f.key ? 'bg-white text-primary shadow-sm' : 'text-zinc-500 hover:text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-zinc-200 py-16 text-center text-zinc-400">
          <Receipt size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-xs font-bold uppercase tracking-wide">Chưa có hóa đơn nào phù hợp</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} onOpen={setSelectedInvoice} />
          ))}
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          payments={payments}
          onClose={() => setSelectedInvoice(null)}
          onOpenPolicy={() => setShowPolicy(true)}
          autoOpenRefund={autoOpenRefund}
        />
      )}

      <TermsOfServiceModal open={showPolicy} onClose={() => setShowPolicy(false)} />
    </div>
  );
}

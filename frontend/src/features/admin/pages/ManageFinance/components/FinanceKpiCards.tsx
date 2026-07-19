import { Coins, Clock, RotateCcw, Receipt } from 'lucide-react';
import { StatCard } from '../../../../../components/StatCard';
import { formatCurrency } from '../../../../../shared/utils';

interface FinanceKpis {
  totalCollected: number;
  paidInvoiceCount: number;
  totalPending: number;
  pendingInvoiceCount: number;
  totalRefunded: number;
  refundCount: number;
  totalInvoices: number;
  fullyPaidPercent: number;
}

interface FinanceKpiCardsProps {
  kpis: FinanceKpis;
}

// 4 thẻ KPI đầu trang, dùng chung StatCard với AdminDashboard (promote từ AdminDashboard/StatCard.tsx)
// để đồng bộ hình học/chuyển động thay vì card tự dựng riêng như bản cũ.
export function FinanceKpiCards({ kpis }: FinanceKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="Doanh thu thực tế (Đã thu)"
        value={formatCurrency(kpis.totalCollected)}
        change={`${kpis.paidInvoiceCount} hóa đơn hoàn tất`}
        changeColor="bg-emerald-50 text-emerald-600"
        icon={<Coins size={18} className="text-emerald-600" />}
        color="bg-emerald-50"
        delay="100ms"
      />
      <StatCard
        title="Đang chờ thanh toán"
        value={formatCurrency(kpis.totalPending)}
        change={`${kpis.pendingInvoiceCount} hóa đơn`}
        changeColor="bg-amber-50 text-amber-600"
        icon={<Clock size={18} className="text-amber-600" />}
        color="bg-amber-50"
        delay="150ms"
      />
      <StatCard
        title="Đã hoàn tiền (Hoàn trả)"
        value={formatCurrency(kpis.totalRefunded)}
        change={`${kpis.refundCount} giao dịch`}
        changeColor="bg-rose-50 text-rose-600"
        icon={<RotateCcw size={18} className="text-rose-600" />}
        color="bg-rose-50"
        delay="200ms"
      />
      <StatCard
        title="Tổng số hóa đơn y khoa"
        value={`${kpis.totalInvoices} HĐ`}
        change={`${kpis.fullyPaidPercent}% đã thanh toán đủ`}
        changeColor="bg-zinc-100 text-zinc-600"
        icon={<Receipt size={18} className="text-zinc-500" />}
        color="bg-zinc-100"
        delay="250ms"
      />
    </div>
  );
}

export default FinanceKpiCards;

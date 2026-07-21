import { Coins, Layers, RotateCcw, Receipt } from 'lucide-react';
import { StatCard } from '../../../../../components/StatCard';
import { formatCurrency } from '../../../../../shared/utils';

interface FinanceKpis {
  totalCollected: number;
  paidInvoiceCount: number;
  totalPackageRevenue?: number;
  packageInvoiceCount?: number;
  totalRefunded: number;
  refundCount: number;
  totalInvoices: number;
  fullyPaidPercent: number;
}

interface FinanceKpiCardsProps {
  kpis: FinanceKpis;
}

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
        title="Doanh thu Gói liệu trình"
        value={formatCurrency(kpis.totalPackageRevenue || 0)}
        change={`${kpis.packageInvoiceCount || 0} hóa đơn gói`}
        changeColor="bg-teal-50 text-teal-600"
        icon={<Layers size={18} className="text-teal-600" />}
        color="bg-teal-50"
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
        change={`${kpis.fullyPaidPercent}% hoàn tất đủ`}
        changeColor="bg-zinc-100 text-zinc-600"
        icon={<Receipt size={18} className="text-zinc-500" />}
        color="bg-zinc-100"
        delay="250ms"
      />
    </div>
  );
}

export default FinanceKpiCards;

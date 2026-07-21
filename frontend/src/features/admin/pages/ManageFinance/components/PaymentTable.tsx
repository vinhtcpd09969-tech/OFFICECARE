import { formatCurrency } from '../../../../../shared/utils';
import { TRANSACTION_TYPE_META } from '../constants';
import { Pagination } from '../../../../../components/Pagination';
import { TableSkeleton } from './TableSkeleton';
import type { Payment, Invoice } from '../hooks/useFinanceDashboard';
import { RotateCcw, Landmark, CheckCircle2, MinusCircle } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  allPayments: Payment[];
  invoices: Invoice[];
  loading: boolean;
  isAdminOrManager: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onOpenRefund: (invoice: Invoice) => void;
}

const METHOD_LABEL: Record<string, string> = {
  tien_mat: '💵 Tiền mặt',
  chuyen_khoan: '🏦 Chuyển khoản',
};

const isAlreadyRefunded = (payment: Payment, allPayments: Payment[]) =>
  allPayments.some(
    (other) => other.loai_giao_dich === 'HOAN_TIEN' && other.chi_tiet?.giao_dich_goc === payment.ma_giao_dich
  );

const getRefundEligibility = (payment: Payment, invoices: Invoice[]) => {
  const invoice = invoices.find((inv) => inv.id === payment.hoa_don_id) || null;
  if (!invoice) return { invoice: null, eligible: false };
  const isPackage = !!invoice.phac_do_dieu_tri_id;
  const eligible = isPackage && invoice.loai_goi === 'LIEU_TRINH' && invoice.hinh_thuc_thanh_toan_goi !== 'tung_buoi';
  return { invoice, eligible };
};

export function PaymentTable({ payments, allPayments, invoices, loading, isAdminOrManager, page, pageSize, onPageChange, onOpenRefund }: PaymentTableProps) {
  const total = payments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagePayments = payments.slice((page - 1) * pageSize, page * pageSize);
  const columns = isAdminOrManager ? 7 : 6;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden text-left select-none">
      {loading ? (
        <TableSkeleton columns={columns} />
      ) : total === 0 ? (
        <div className="py-20 text-center text-zinc-400 dark:text-zinc-500 text-xs font-semibold italic flex flex-col items-center gap-2">
          <Landmark size={28} className="text-zinc-300 dark:text-zinc-600 stroke-[1.5]" />
          <span>Chưa ghi nhận giao dịch thanh toán nào khớp bộ lọc.</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Mã GD</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Mã hóa đơn</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Phương thức</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Loại giao dịch</th>
                  {isAdminOrManager && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {pagePayments.map((pay) => {
                  const typeMeta = TRANSACTION_TYPE_META[pay.loai_giao_dich] || { label: pay.loai_giao_dich, badge: 'bg-zinc-50 text-zinc-700 border border-zinc-200' };
                  const { invoice, eligible } = pay.loai_giao_dich === 'THANH_TOAN' ? getRefundEligibility(pay, invoices) : { invoice: null, eligible: false };
                  const canRefundThis = eligible && !isAlreadyRefunded(pay, allPayments);
                  return (
                    <tr key={pay.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors duration-150 group">
                      <td className="px-6 py-4 font-mono text-zinc-400 dark:text-zinc-500 text-xs font-semibold">{pay.ma_giao_dich}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-slate-800 dark:text-zinc-100 text-xs bg-slate-100/80 dark:bg-zinc-800 px-2 py-1 rounded-md border border-slate-200/60 dark:border-zinc-700">
                          {pay.ma_hoa_don}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-extrabold text-slate-800 dark:text-zinc-100">{pay.ten_khach_hang}</td>
                      <td className={`px-6 py-4 font-mono font-black text-xs ${pay.loai_giao_dich === 'HOAN_TIEN' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                        {pay.loai_giao_dich === 'HOAN_TIEN' ? `- ${formatCurrency(pay.so_tien)}` : formatCurrency(pay.so_tien)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 dark:text-zinc-300 font-bold">
                        {METHOD_LABEL[pay.phuong_thuc] || '🏦 Chuyển khoản'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider ${typeMeta.badge}`}>
                          {typeMeta.label}
                        </span>
                      </td>
                      {isAdminOrManager && (
                        <td className="px-6 py-4 text-right">
                          {canRefundThis && invoice ? (
                            <button
                              onClick={() => onOpenRefund(invoice)}
                              title="Mở hóa đơn để hủy gói & hoàn tiền theo đúng công thức đối soát"
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 dark:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-rose-200/80 dark:border-rose-900/60 shadow-2xs cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <RotateCcw size={12} />
                              Hoàn tiền
                            </button>
                          ) : pay.loai_giao_dich === 'HOAN_TIEN' || (eligible && isAlreadyRefunded(pay, allPayments)) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50/50 dark:bg-rose-950/30 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900/40">
                              <CheckCircle2 size={11} /> Đã hoàn trả
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium italic">
                              <MinusCircle size={11} className="text-zinc-300" /> Không áp dụng
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} label="giao dịch" />
          </div>
        </>
      )}
    </div>
  );
}

export default PaymentTable;

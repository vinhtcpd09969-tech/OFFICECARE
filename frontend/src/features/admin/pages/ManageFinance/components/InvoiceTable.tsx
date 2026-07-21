import { formatCurrency } from '../../../../../shared/utils';
import { getStatusBadge } from '../constants';
import { Pagination } from '../../../../../components/Pagination';
import { TableSkeleton } from './TableSkeleton';
import type { Invoice } from '../hooks/useFinanceDashboard';
import { Eye, FileText, User } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export function InvoiceTable({ invoices, loading, page, pageSize, onPageChange, onSelectInvoice }: InvoiceTableProps) {
  const total = invoices.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageInvoices = invoices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden text-left select-none">
      {loading ? (
        <TableSkeleton columns={6} />
      ) : total === 0 ? (
        <div className="py-20 text-center text-zinc-400 dark:text-zinc-500 text-xs font-semibold italic flex flex-col items-center gap-2">
          <FileText size={28} className="text-zinc-300 dark:text-zinc-600 stroke-[1.5]" />
          <span>Không tìm thấy hóa đơn nào khớp với bộ lọc dữ liệu.</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Mã hóa đơn</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Đã đóng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {pageInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-slate-800 dark:text-zinc-100 text-xs bg-slate-100/80 dark:bg-zinc-800 px-2 py-1 rounded-md border border-slate-200/60 dark:border-zinc-700">
                        {inv.ma_hoa_don}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0 text-[10px] font-black border border-slate-200/60">
                          <User size={12} />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 dark:text-zinc-100">{inv.ten_khach_hang}</div>
                          <div className="text-[9.5px] text-zinc-400 font-mono font-semibold mt-0.5">{inv.so_dien_thoai || 'Chưa cập nhật'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-slate-800 dark:text-zinc-100 text-xs">
                      {formatCurrency(inv.tong_tien_thanh_toan)}
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatCurrency(inv.da_thanh_toan)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider ${getStatusBadge(inv.trang_thai)}`}>
                        {(inv.trang_thai || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 transition-all cursor-pointer flex items-center gap-1.5 ml-auto border border-zinc-200/60 dark:border-zinc-700 hover:border-teal-600 shadow-2xs"
                      >
                        <Eye size={12} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} label="hóa đơn" />
          </div>
        </>
      )}
    </div>
  );
}

export default InvoiceTable;

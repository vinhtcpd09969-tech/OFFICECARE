import { formatCurrency } from '../../../../../utils/format';
import { getStatusBadge, INVOICE_STATUS_LABELS } from '../constants';
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
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden text-left select-none font-jakarta">
      {loading ? (
        <TableSkeleton columns={6} />
      ) : total === 0 ? (
        <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-xs font-bold italic flex flex-col items-center gap-2">
          <FileText size={32} className="text-slate-300 dark:text-slate-600 stroke-[1.5]" />
          <span>Không tìm thấy hóa đơn nào khớp với bộ lọc dữ liệu.</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[28%]" />
                <col className="w-[17%]" />
                <col className="w-[17%]" />
                <col className="w-[14%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <th className="p-4">Mã hóa đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">Đã đóng</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-right">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group">
                    <td className="p-4">
                      <span className="font-extrabold text-teal-700 dark:text-teal-400 text-xs bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-200/60 dark:border-teal-800">
                        {inv.ma_hoa_don}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs uppercase shrink-0 shadow-xs">
                          {inv.ten_khach_hang?.charAt(0) || 'K'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                            {inv.ten_khach_hang}
                          </span>
                          <span className="text-[10px] text-slate-400 font-extrabold tracking-wider mt-0.5">
                            {inv.so_dien_thoai || 'Chưa cập nhật'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white text-xs md:text-sm whitespace-nowrap">
                      {formatCurrency(inv.tong_tien_thanh_toan)}
                    </td>
                    <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-xs md:text-sm whitespace-nowrap">
                      {formatCurrency(inv.da_thanh_toan)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusBadge(inv.trang_thai)}`}>
                        {INVOICE_STATUS_LABELS[inv.trang_thai] || (inv.trang_thai || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        title="Xem chi tiết hóa đơn"
                        className="p-2.5 bg-slate-100 hover:bg-teal-600 hover:text-white dark:bg-slate-800 dark:hover:bg-teal-600 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 border border-slate-200/60 dark:border-slate-700"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} />
          </div>
        </>
      )}
    </div>
  );
}

export default InvoiceTable;

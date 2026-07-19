import { formatCurrency } from '../../../../../shared/utils';
import { getStatusBadge } from '../constants';
import { Pagination } from '../../../../../components/Pagination';
import { TableSkeleton } from './TableSkeleton';
import type { Invoice } from '../hooks/useFinanceDashboard';

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

// Tách khỏi bảng dùng chung cũ (đổi cột theo tab) — giờ chỉ render đúng 6 cột của Hóa đơn, có
// phân trang hiển thị thuần (mảng invoices truyền vào đã được lọc sẵn ở hook, không gọi lại API).
export function InvoiceTable({ invoices, loading, page, pageSize, onPageChange, onSelectInvoice }: InvoiceTableProps) {
  const total = invoices.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageInvoices = invoices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-3xl border border-zinc-150 shadow-sm overflow-hidden text-left">
      {loading ? (
        <TableSkeleton columns={6} />
      ) : total === 0 ? (
        <div className="py-20 text-center text-zinc-400 text-xs italic">
          Không tìm thấy hóa đơn nào khớp với bộ lọc.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500">
                <tr>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Mã hóa đơn</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Đã đóng</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/60 hover:scale-[1.002] transition-all duration-150">
                    <td className="px-6 py-4 font-mono font-black text-secondary text-xs">{inv.ma_hoa_don}</td>
                    <td className="px-6 py-4 text-xs font-bold text-secondary">
                      <div>{inv.ten_khach_hang}</div>
                      <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">{inv.so_dien_thoai || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-black text-secondary text-xs">{formatCurrency(inv.tong_tien_thanh_toan)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600 text-xs">{formatCurrency(inv.da_thanh_toan)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusBadge(inv.trang_thai)}`}>
                        {(inv.trang_thai || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="px-3.5 py-1.5 bg-zinc-100 hover:bg-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-zinc-500 transition-all"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-100">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} label="hóa đơn" />
          </div>
        </>
      )}
    </div>
  );
}

export default InvoiceTable;

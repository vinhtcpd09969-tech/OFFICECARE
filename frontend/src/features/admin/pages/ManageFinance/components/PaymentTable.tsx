import { formatCurrency } from '../../../../../shared/utils';
import { TRANSACTION_TYPE_META } from '../constants';
import { Pagination } from '../../../../../components/Pagination';
import { TableSkeleton } from './TableSkeleton';
import type { Payment, Invoice } from '../hooks/useFinanceDashboard';

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

// giao_dich_thanh_toan không có cột trang_thai — 1 khoản THANH_TOAN coi là "đã hoàn tiền" khi
// tồn tại 1 dòng HOAN_TIEN khác trỏ về đúng mã tham chiếu của nó qua chi_tiet.giao_dich_goc
// (xem backend/src/repositories/admin.repository.ts::handleRefund). Phải dò trên TOÀN BỘ mảng
// (không phải mảng đã lọc/phân trang) để không bỏ sót cặp giao dịch nằm khác trang/khác bộ lọc.
const isAlreadyRefunded = (payment: Payment, allPayments: Payment[]) =>
  allPayments.some(
    (other) => other.loai_giao_dich === 'HOAN_TIEN' && other.chi_tiet?.giao_dich_goc === payment.ma_giao_dich
  );

// Hoàn tiền CHỈ áp dụng cho gói liệu trình trả thẳng (100%) hoặc trả góp (50%) — khớp đúng
// công thức `canRefund` trong InvoiceDetailModal.tsx. Khám lẻ/dịch vụ lẻ và liệu trình từng buổi
// KHÔNG có chức năng hoàn tiền (đúng nghiệp vụ, không phải thiếu sót UI).
const getRefundEligibility = (payment: Payment, invoices: Invoice[]) => {
  const invoice = invoices.find((inv) => inv.id === payment.hoa_don_id) || null;
  if (!invoice) return { invoice: null, eligible: false };
  const isPackage = !!invoice.phac_do_dieu_tri_id;
  const eligible = isPackage && invoice.loai_goi === 'LIEU_TRINH' && invoice.hinh_thuc_thanh_toan_goi !== 'tung_buoi';
  return { invoice, eligible };
};

// Tách khỏi bảng dùng chung cũ (đổi cột theo tab) — giờ chỉ render đúng cột của Giao dịch, có
// phân trang hiển thị thuần (mảng payments truyền vào đã được lọc sẵn ở hook, không gọi lại API).
export function PaymentTable({ payments, allPayments, invoices, loading, isAdminOrManager, page, pageSize, onPageChange, onOpenRefund }: PaymentTableProps) {
  const total = payments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagePayments = payments.slice((page - 1) * pageSize, page * pageSize);
  const columns = isAdminOrManager ? 7 : 6;

  return (
    <div className="bg-white rounded-3xl border border-zinc-150 shadow-sm overflow-hidden text-left">
      {loading ? (
        <TableSkeleton columns={columns} />
      ) : total === 0 ? (
        <div className="py-20 text-center text-zinc-400 text-xs italic">
          Chưa ghi nhận giao dịch thanh toán nào khớp bộ lọc.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500">
                <tr>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Mã GD</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Mã hóa đơn</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Phương thức</th>
                  <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Loại giao dịch</th>
                  {isAdminOrManager && <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider text-right">Hành động</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pagePayments.map((pay) => {
                  const typeMeta = TRANSACTION_TYPE_META[pay.loai_giao_dich] || { label: pay.loai_giao_dich, badge: 'bg-zinc-50 text-zinc-700 border border-zinc-200' };
                  const { invoice, eligible } = pay.loai_giao_dich === 'THANH_TOAN' ? getRefundEligibility(pay, invoices) : { invoice: null, eligible: false };
                  const canRefundThis = eligible && !isAlreadyRefunded(pay, allPayments);
                  return (
                    <tr key={pay.id} className="hover:bg-zinc-50/60 hover:scale-[1.002] transition-all duration-150">
                      <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{pay.ma_giao_dich}</td>
                      <td className="px-6 py-4 font-mono font-black text-secondary text-xs">{pay.ma_hoa_don}</td>
                      <td className="px-6 py-4 text-xs font-bold text-secondary">{pay.ten_khach_hang}</td>
                      <td className="px-6 py-4 font-black text-secondary text-xs">{formatCurrency(pay.so_tien)}</td>
                      <td className="px-6 py-4 text-xs text-secondary capitalize font-bold">
                        {METHOD_LABEL[pay.phuong_thuc] || '💳 Thẻ / POS'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${typeMeta.badge}`}>
                          {typeMeta.label}
                        </span>
                      </td>
                      {isAdminOrManager && (
                        <td className="px-6 py-4 text-right">
                          {canRefundThis && invoice ? (
                            <button
                              onClick={() => onOpenRefund(invoice)}
                              title="Mở hóa đơn để hủy gói & hoàn tiền theo đúng công thức đối soát"
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-rose-500 transition-all border border-rose-150/70"
                            >
                              Hoàn tiền
                            </button>
                          ) : pay.loai_giao_dich === 'HOAN_TIEN' || (eligible && isAlreadyRefunded(pay, allPayments)) ? (
                            <span className="text-[10px] text-zinc-400 font-semibold italic">Đã hoàn trả</span>
                          ) : (
                            <span className="text-[10px] text-zinc-350 font-semibold italic">Không áp dụng</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-100">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={onPageChange} label="giao dịch" />
          </div>
        </>
      )}
    </div>
  );
}

export default PaymentTable;

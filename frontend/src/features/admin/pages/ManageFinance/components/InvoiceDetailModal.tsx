import React from 'react';
import { User, Building, Activity, Receipt, RotateCcw, Printer, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils';
import type { Invoice, Payment } from '../hooks/useFinanceDashboard';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  payments: Payment[];
  isAdminOrManager: boolean;
  onClose: () => void;
  onPrint: (invoice: Invoice) => void;
  onOpenFastPay: (invoice: Invoice) => void;
  onRefund: (paymentId: string) => void;
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    da_thanh_toan: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    thanh_cong: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    chua_thanh_toan: 'bg-amber-50 text-amber-700 border border-amber-250/50',
    da_hoan_tien: 'bg-rose-50 text-rose-700 border border-rose-200/50',
    cho_xu_ly: 'bg-zinc-50 text-zinc-700 border border-zinc-200',
  };
  return badges[status] || 'bg-zinc-50 text-zinc-700 border border-zinc-200';
};

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  payments,
  isAdminOrManager,
  onClose,
  onPrint,
  onOpenFastPay,
  onRefund,
}) => {
  if (!invoice) return null;

  const invoicePayments = payments.filter(
    (p) => p.hoa_don_id === invoice.id || p.ma_hoa_don === invoice.ma_hoa_don
  );
  const remainingDebt = Math.max(0, Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan));

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-zinc-150 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
              <Receipt size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-secondary flex items-center gap-2">
                Chi tiết Hóa đơn y khoa {invoice.ma_hoa_don}
              </h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                Khởi tạo ngày: {new Date(invoice.ngay_tao).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Trạng thái thanh toán</span>
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusBadge(
                    invoice.trang_thai
                  )}`}
                >
                  {invoice.trang_thai.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="p-4.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Tổng chi phí</span>
              <p className="text-base font-black text-secondary">{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</p>
            </div>
            <div className="p-4.5 rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Thực tế đã thu</span>
              <p className="text-base font-black text-emerald-600">{formatCurrency(Number(invoice.da_thanh_toan))}</p>
            </div>
          </div>

          {/* Grid info panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer block */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                <User size={13} className="text-primary" />
                Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-xs font-semibold text-zinc-650">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Họ và tên:</span>
                  <span className="text-secondary font-black">{invoice.ten_khach_hang}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Số điện thoại:</span>
                  <span className="text-secondary font-bold">{invoice.so_dien_thoai || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Service block */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                <Building size={13} className="text-primary" />
                Sản phẩm điều trị
              </h3>
              <div className="space-y-2 text-xs font-semibold text-zinc-650">
                <div className="flex justify-between items-start">
                  <span className="text-zinc-400 shrink-0">Chi tiết dịch vụ:</span>
                  <span className="text-secondary font-black text-right max-w-[170px]" title={invoice.ten_dich_vu}>
                    {invoice.ten_dich_vu || 'Phí khám lâm sàng/Buổi lẻ'}
                  </span>
                </div>
                {invoice.hinh_thuc_thanh_toan_goi && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Hình thức thanh toán:</span>
                    <span className="text-primary font-black uppercase tracking-wider text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {invoice.hinh_thuc_thanh_toan_goi.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing calculation breakdown */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-2">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={13} className="text-primary" />
              Chi tiết phân tích tài chính
            </h3>
            <div className="space-y-2 text-xs font-semibold text-zinc-650">
              <div className="flex justify-between">
                <span>Nguyên giá gốc:</span>
                <span className="text-secondary font-bold">{formatCurrency(Number(invoice.tong_tien_goc))}</span>
              </div>
              {Number(invoice.ti_le_giam_gia_goi) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Ưu đãi hình thức đóng ({invoice.ti_le_giam_gia_goi}%):</span>
                  <span>
                    -{formatCurrency(Math.round((Number(invoice.tong_tien_goc) * Number(invoice.ti_le_giam_gia_goi)) / 100))}
                  </span>
                </div>
              )}
              {Number(invoice.so_tien_giam_voucher) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Ưu đãi Voucher giảm giá:</span>
                  <span>-{formatCurrency(Number(invoice.so_tien_giam_voucher))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-secondary">
                <span>Tổng chi phí cần thu:</span>
                <span className="text-secondary font-black">{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</span>
              </div>
              {remainingDebt > 0 && (
                <div className="flex justify-between border-t border-dashed border-zinc-200/60 pt-2 text-amber-600 font-bold">
                  <span>Dư nợ còn lại phải thu:</span>
                  <span className="text-base font-black">{formatCurrency(remainingDebt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          {invoice.ghi_chu && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-amber-800 text-xs font-semibold flex gap-2">
              <span className="shrink-0 text-amber-500">📝</span>
              <p className="leading-relaxed">
                <strong>Ghi chú nội bộ:</strong> {invoice.ghi_chu}
              </p>
            </div>
          )}

          {/* Transaction logs list */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
              <Receipt size={13} className="text-primary" />
              Lịch sử ghi nhận giao dịch thanh toán
            </h3>
            {invoicePayments.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">Chưa ghi nhận giao dịch thanh toán nào cho hóa đơn này.</p>
            ) : (
              <div className="border border-zinc-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-150 text-zinc-500 font-bold">
                    <tr>
                      <th className="px-4 py-3">Mã GD</th>
                      <th className="px-4 py-3">Số tiền thu</th>
                      <th className="px-4 py-3">Phương thức</th>
                      <th className="px-4 py-3">Thời gian ghi nhận</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      {isAdminOrManager && <th className="px-4 py-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-650">
                    {invoicePayments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/40">
                        <td className="px-4 py-2.5 font-mono text-zinc-400">{p.ma_giao_dich}</td>
                        <td className="px-4 py-2.5 font-black text-secondary">{formatCurrency(p.so_tien)}</td>
                        <td className="px-4 py-2.5 capitalize text-[10px]">
                          {p.phuong_thuc === 'tien_mat'
                            ? '💵 Tiền mặt'
                            : p.phuong_thuc === 'chuyen_khoan'
                            ? '🏦 Chuyển khoản'
                            : '💳 Thẻ/POS'}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500">{new Date(p.thoi_gian_giao_dich).toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getStatusBadge(
                              p.trang_thai
                            )}`}
                          >
                            {(p.trang_thai || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        {isAdminOrManager && (
                          <td className="px-4 py-2.5 text-right">
                            {p.trang_thai === 'thanh_cong' ? (
                              <button
                                onClick={() => onRefund(p.id)}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-0.5 justify-end"
                              >
                                <RotateCcw size={10} /> Hoàn tiền
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-450 italic">Đã hoàn trả</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <button
            onClick={() => onPrint(invoice)}
            className="px-4 py-2 bg-zinc-150 hover:bg-zinc-200 text-zinc-650 hover:text-secondary text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Printer size={14} /> In hóa đơn
          </button>

          <div className="flex gap-2">
            {remainingDebt > 0 && (
              <button
                onClick={() => onOpenFastPay(invoice)}
                className="px-5 py-2.5 bg-primary hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CreditCard size={14} /> Thu tiền ngay
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InvoiceDetailModal;

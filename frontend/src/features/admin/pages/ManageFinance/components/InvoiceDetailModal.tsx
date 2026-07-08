import React, { useState } from 'react';
import { User, Building, Activity, Receipt, RotateCcw, Printer, CreditCard, ShieldAlert } from 'lucide-react';
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
  onPackageRefund?: (invoiceId: string, usedSessions: number, penalty: number, reason: string) => Promise<void>;
}



export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  payments,
  isAdminOrManager,
  onClose,
  onPrint,
  onOpenFastPay,
  onRefund,
  onPackageRefund,
}) => {
  if (!invoice) return null;

  const [isRefundPanelOpen, setIsRefundPanelOpen] = useState(false);
  const usedSessions = invoice.so_buoi_da_dung || 0;
  const penaltyPercent = 10;
  const [refundReason, setRefundReason] = useState<string>('Hủy gói theo yêu cầu của bệnh nhân');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const invoicePayments = payments.filter(
    (p) => p.hoa_don_id === invoice.id || p.ma_hoa_don === invoice.ma_hoa_don
  );
  const remainingDebt = Math.max(0, Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan));

  // Dynamic calculations based on DB values (not hardcoded!)
  const isPackage = !!invoice.phac_do_dieu_tri_id;
  const hasExam = !!invoice.cuoc_hen_id;
  const chi_phi_kham = (invoice as any).chi_phi_kham !== undefined ? Number((invoice as any).chi_phi_kham) : (hasExam ? 200000 : 0);
  const tong_tien_goc = Number(invoice.tong_tien_goc);
  const gia_goc_goi = isPackage ? (tong_tien_goc - chi_phi_kham) : tong_tien_goc;
  const ti_le_giam = Number(invoice.ti_le_giam_gia_goi || 0);
  const giam_gia_goi = isPackage ? Math.round((gia_goc_goi * ti_le_giam) / 100) : 0;
  const giam_voucher = Number(invoice.so_tien_giam_voucher || 0);

  // Free clinical exam check: package >= 1M & payment method is tra_thang / tra_gop
  const isExamWaived = isPackage && (gia_goc_goi >= 1000000) && ['tra_thang', 'tra_gop'].includes(invoice.hinh_thuc_thanh_toan_goi || '');
  const mien_phi_kham = isExamWaived ? chi_phi_kham : 0;

  // Refund eligibility check (Only pre-paid packages: LIEU_TRINH and hinh_thuc is tra_thang/tra_gop)
  const canRefund = isPackage && 
                    invoice.loai_goi === 'LIEU_TRINH' && 
                    invoice.hinh_thuc_thanh_toan_goi !== 'tung_buoi';

  // Refund values:
  const totalPaid = Number(invoice.da_thanh_toan);
  const gia_thanh_toan_goi = gia_goc_goi - giam_gia_goi;
  const penaltyAmount = Math.round((gia_thanh_toan_goi * penaltyPercent) / 100);
  const totalSessions = Number(invoice.tong_so_buoi || 10);
  const usedSessionsCost = Math.round((gia_thanh_toan_goi * usedSessions) / totalSessions);
  const examFeeToCharge = mien_phi_kham; // revoke waiver

  const totalDeduction = usedSessionsCost + penaltyAmount + examFeeToCharge;
  const estimatedRefund = Math.max(0, totalPaid - totalDeduction);
  const keptRevenue = totalPaid - estimatedRefund;

  const handleRefundSubmit = async () => {
    if (!onPackageRefund) return;

    const confirmMessage = `Bạn có chắc chắn muốn HỦY GÓI DỊCH VỤ này và HOÀN TIỀN cho khách hàng?\n\n` +
      `- Tổng số tiền đã đóng: ${formatCurrency(totalPaid)}\n` +
      `- Khấu trừ phí khám lâm sàng: ${formatCurrency(examFeeToCharge)}\n` +
      `- Khấu trừ chi phí các buổi đã sử dụng: ${formatCurrency(usedSessionsCost)}\n` +
      `- Khấu trừ phí phạt hủy gói (${penaltyPercent}%): ${formatCurrency(penaltyAmount)}\n` +
      `-------------------------------------------\n` +
      `👉 Thực tế hoàn trả cho khách: ${formatCurrency(estimatedRefund)}\n` +
      `👉 Doanh thu phòng khám giữ lại: ${formatCurrency(keptRevenue)}\n\n` +
      `Hành động này không thể hoàn tác. Xác nhận tiến hành?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSubmittingRefund(true);
    try {
      await onPackageRefund(invoice.id, usedSessions, penaltyPercent, refundReason);
      setIsRefundPanelOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-zinc-150 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-left">
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
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Customer & Service Info + Financial Breakdown */}
            <div className="lg:col-span-5 space-y-5">
              {/* Customer block */}
              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-3">
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
              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-3">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Building size={13} className="text-primary" />
                  Sản phẩm điều trị
                </h3>
                <div className="space-y-2 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between items-start">
                    <span className="text-zinc-400 shrink-0">Chi tiết:</span>
                    <span className="text-secondary font-black text-right max-w-[170px]" title={invoice.ten_dich_vu}>
                      {invoice.ten_dich_vu || 'Phí khám lâm sàng/Buổi lẻ'}
                    </span>
                  </div>
                  {invoice.hinh_thuc_thanh_toan_goi && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Hình thức:</span>
                      <span className="text-primary font-black uppercase tracking-wider text-[9px] bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                        {invoice.hinh_thuc_thanh_toan_goi.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing calculation breakdown */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-3">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-zinc-150">
                  <Activity size={13} className="text-primary" />
                  Chi tiết phân tích tài chính
                </h3>
                <div className="space-y-2 text-xs font-semibold text-zinc-650">
                  {isPackage ? (
                    <>
                      <div className="flex justify-between">
                        <span>Giá gốc gói trị liệu:</span>
                        <span className="text-secondary font-bold">{formatCurrency(gia_goc_goi)}</span>
                      </div>
                      {chi_phi_kham > 0 && (
                        <div className="flex justify-between">
                          <span>Phí khám lâm sàng & Lượng giá:</span>
                          <span className="text-secondary font-bold">{formatCurrency(chi_phi_kham)}</span>
                        </div>
                      )}
                      {giam_gia_goi > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Ưu đãi hình thức ({ti_le_giam}%):</span>
                          <span>-{formatCurrency(giam_gia_goi)}</span>
                        </div>
                      )}
                      {mien_phi_kham > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Miễn phí khám (Ưu đãi mua gói):</span>
                          <span>-{formatCurrency(mien_phi_kham)}</span>
                        </div>
                      )}
                      {giam_voucher > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Ưu đãi Voucher giảm giá:</span>
                          <span>-{formatCurrency(giam_voucher)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Phí khám lâm sàng & Lượng giá:</span>
                        <span className="text-secondary font-bold">{formatCurrency(tong_tien_goc || 200000)}</span>
                      </div>
                      {invoice.trang_thai === 'da_thanh_toan' && Number(invoice.tong_tien_thanh_toan) === 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Khấu trừ/Miễn phí theo hóa đơn gói:</span>
                          <span>-{formatCurrency(tong_tien_goc || 200000)}</span>
                        </div>
                      )}
                      {giam_voucher > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Ưu đãi Voucher giảm giá:</span>
                          <span>-{formatCurrency(giam_voucher)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-secondary">
                    <span>Tổng chi phí cần thu:</span>
                    <span className="text-secondary font-black">{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</span>
                  </div>
                  {remainingDebt > 0 && (
                    <div className="flex justify-between border-t border-dashed border-zinc-200/60 pt-2 text-amber-600 font-bold">
                      <span>Dư nợ còn lại phải thu:</span>
                      <span className="text-sm font-black">{formatCurrency(remainingDebt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Transaction History & Refund Panel */}
            <div className="lg:col-span-7 space-y-5">
              {/* Lịch sử ghi nhận giao dịch thanh toán */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Receipt size={13} className="text-primary" />
                  Lịch sử ghi nhận giao dịch thanh toán
                </h3>
                {invoicePayments.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">Chưa ghi nhận giao dịch thanh toán nào cho hóa đơn này.</p>
                ) : (
                  <div className="border border-zinc-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-zinc-50 border-b border-zinc-150 text-zinc-500 font-bold">
                        <tr>
                          <th className="px-3 py-2.5">Mã GD</th>
                          <th className="px-3 py-2.5">Số tiền thu</th>
                          <th className="px-3 py-2.5">Phương thức</th>
                          <th className="px-3 py-2.5">Thời gian</th>
                          {isAdminOrManager && <th className="px-3 py-2.5 text-right">Thao tác</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-650">
                        {invoicePayments.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-50/40">
                            <td className="px-3 py-2 font-mono text-zinc-400 text-[10px]">{p.ma_giao_dich}</td>
                            <td className="px-3 py-2 font-black text-secondary">{formatCurrency(p.so_tien)}</td>
                            <td className="px-3 py-2 capitalize text-[10px]">
                              {p.phuong_thuc === 'tien_mat'
                                ? '💵 Tiền mặt'
                                : p.phuong_thuc === 'chuyen_khoan'
                                ? '🏦 Chuyển khoản'
                                : '💳 Thẻ/POS'}
                            </td>
                            <td className="px-3 py-2 text-zinc-500 text-[10px]">{new Date(p.thoi_gian_giao_dich).toLocaleString('vi-VN')}</td>
                            {isAdminOrManager && (
                              <td className="px-3 py-2 text-right">
                                {p.loai_giao_dich === 'THANH_TOAN' && invoice.trang_thai !== 'da_hoan_tien' && canRefund ? (
                                  <button
                                    onClick={() => {
                                      if (isPackage) {
                                        setIsRefundPanelOpen(true);
                                      } else {
                                        onRefund(p.id);
                                      }
                                    }}
                                    className="text-[10px] font-black text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-0.5 justify-end"
                                  >
                                    <RotateCcw size={10} /> Hoàn tiền
                                  </button>
                                ) : p.loai_giao_dich === 'HOAN_TIEN' ? (
                                  <span className="text-[10px] text-rose-500 font-bold italic">Đã hoàn trả</span>
                                ) : (
                                  <span className="text-[10px] text-zinc-400 italic">—</span>
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

              {/* Advanced Package Refund Panel (rendered inline inside Right Column when triggered) */}
              {isRefundPanelOpen && isAdminOrManager && isPackage && canRefund && (
                <div className="border border-red-200 bg-red-50/20 rounded-2xl p-4.5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-red-100 pb-2">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                      <ShieldAlert size={16} />
                      <span>Nghiệp vụ Hủy gói & Hoàn tiền chuyên sâu</span>
                    </div>
                    <button
                      onClick={() => setIsRefundPanelOpen(false)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-zinc-650 uppercase tracking-wider"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wide">Số buổi đã sử dụng (Tự động)</label>
                        <input
                          type="number"
                          value={usedSessions}
                          disabled
                          className="w-full px-3 py-1.5 text-xs border border-zinc-200 bg-zinc-50 rounded-lg text-zinc-400 font-bold cursor-not-allowed outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wide">Phí phạt hủy gói (%) (Cố định)</label>
                        <input
                          type="number"
                          value={penaltyPercent}
                          disabled
                          className="w-full px-3 py-1.5 text-xs border border-zinc-200 bg-zinc-50 rounded-lg text-zinc-400 font-bold cursor-not-allowed outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Lý do hủy gói & hoàn tiền</label>
                      <input
                        type="text"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Nhập lý do hoàn trả..."
                        className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none font-semibold"
                      />
                    </div>

                    {/* Calculator Breakdown Live Preview */}
                    <div className="p-3.5 bg-white border border-rose-100 rounded-xl space-y-2 text-xs font-semibold text-zinc-650">
                      <div className="flex justify-between">
                        <span>Tổng tiền khách hàng đã đóng:</span>
                        <span className="text-secondary font-bold">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Khấu trừ phí khám lâm sàng (Thu hồi ưu đãi):</span>
                        <span>+{formatCurrency(examFeeToCharge)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Khấu trừ {usedSessions}/{totalSessions} buổi đã sử dụng:</span>
                        <span>+{formatCurrency(usedSessionsCost)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Khấu trừ phí phạt hủy gói ({penaltyPercent}%):</span>
                        <span>+{formatCurrency(penaltyAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-100 pt-2 text-rose-600 font-bold">
                        <span>Tổng số tiền khấu trừ:</span>
                        <span>{formatCurrency(totalDeduction)}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-150 pt-2 text-emerald-600 font-black text-sm">
                        <span>Số tiền hoàn trả lại cho khách:</span>
                        <span>{formatCurrency(estimatedRefund)}</span>
                      </div>
                      <div className="flex justify-between text-secondary font-black text-xs">
                        <span>Doanh thu phòng khám giữ lại thực tế:</span>
                        <span>{formatCurrency(keptRevenue)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsRefundPanelOpen(false)}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded-xl text-xs font-bold transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleRefundSubmit}
                        disabled={submittingRefund}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
                      >
                        {submittingRefund ? 'Đang xử lý...' : 'Xác nhận hủy & Hoàn tiền'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

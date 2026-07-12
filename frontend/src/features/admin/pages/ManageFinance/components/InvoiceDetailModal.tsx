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
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const invoicePayments = payments.filter(
    (p) => p.hoa_don_id === invoice.id || p.ma_hoa_don === invoice.ma_hoa_don
  );

  const formatLongDate = (dStr: any) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
      return '';
    }
  };

  const formatTimeRange = (startStr: any, endStr: any) => {
    if (!startStr || !endStr) return '';
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
      const startH = String(s.getHours()).padStart(2, '0');
      const startM = String(s.getMinutes()).padStart(2, '0');
      const endH = String(e.getHours()).padStart(2, '0');
      const endM = String(e.getMinutes()).padStart(2, '0');
      return `${startH}:${startM} - ${endH}:${endM}`;
    } catch (err) {
      return '';
    }
  };

  const remainingDebt = invoice.trang_thai === 'da_hoan_tien' || invoice.trang_thai === 'da_huy'
    ? 0
    : Math.max(0, Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan));

  // Dựa trên dữ liệu thật trả về từ backend (admin.repository.ts:getInvoices) — không đoán/hardcode.
  const isPackage = !!invoice.phac_do_dieu_tri_id;

  // chi_phi_kham đã được backend tính động (join cuoc_hen -> goi_dich_vu), trả về 0 khi
  // không có phí khám cần trừ (không liên kết ca khám, hoặc đã thanh toán khám riêng).
  const chi_phi_kham = Number(invoice.chi_phi_kham || 0);

  const tong_tien_goc = Number(invoice.tong_tien_goc);
  // Giá gốc gói LUÔN là tong_tien_goc, bất kể phí khám được xử lý theo cách nào (đã đóng
  // riêng, miễn phí, hay chưa đóng) — khớp đúng calculatePackageCancellationRefund() ở
  // backend/src/domain/billing.ts. Phí khám là khoản tách biệt hoàn toàn, không được phép
  // làm lệch giá gốc/gốc tính phạt.
  const hasPaidSeparateExam = !!invoice.da_thanh_toan_kham_rieng;
  const gia_goc_goi = tong_tien_goc;
  const ti_le_giam = Number(invoice.ti_le_giam_gia_goi || 0);
  const giam_gia_goi = isPackage ? Math.round((gia_goc_goi * ti_le_giam) / 100) : 0;

  // Miễn phí khám: xem docs/BUSINESS_RULES.md mục 5 / backend/src/domain/billing.ts isExamWaived()
  const isExamWaived = isPackage && (gia_goc_goi >= 1000000) && ['tra_thang', 'tra_gop'].includes(invoice.hinh_thuc_thanh_toan_goi || '');
  const mien_phi_kham = isExamWaived ? chi_phi_kham : 0;

  // Refund eligibility check (Only pre-paid packages: LIEU_TRINH and hinh_thuc is tra_thang/tra_gop)
  const canRefund = isPackage &&
                    invoice.loai_goi === 'LIEU_TRINH' &&
                    invoice.hinh_thuc_thanh_toan_goi !== 'tung_buoi';

  // Refund preview — khớp đúng công thức calculatePackageCancellationRefund() ở backend:
  // phạt 10% trên gia_thanh_toan_goi (giá gói đã chốt theo hình thức thanh toán) — CỐ ĐỊNH
  // theo hợp đồng, không đổi theo đã đóng bao nhiêu tiền (khớp commit 581f9fc).
  const totalPaid = Number(invoice.da_thanh_toan);
  const gia_thanh_toan_goi = gia_goc_goi - giam_gia_goi;
  const penaltyAmount = Math.round((gia_thanh_toan_goi * penaltyPercent) / 100);
  const totalSessions = Number(invoice.tong_so_buoi || 10);
  const usedSessionsCost = Math.round((gia_thanh_toan_goi * usedSessions) / totalSessions);
  // Chỉ thu hồi phí khám nếu ca khám CHƯA từng được ghi nhận thanh toán riêng (kể cả 0đ) —
  // khớp đúng examFeeToCharge = hasExam && !hasPaidSeparateExam ? chiPhiKham : 0 ở backend
  // (calculatePackageCancellationRefund). Nếu đã có hóa đơn khám riêng (0đ hay đã đóng),
  // phí khám coi như đã xử lý xong lúc mua, không thu lại lần nữa.
  const hasExam = isPackage && !!invoice.cuoc_hen_id;
  const examFeeToCharge = hasExam && !hasPaidSeparateExam ? chi_phi_kham : 0;

  const totalDeduction = usedSessionsCost + penaltyAmount + examFeeToCharge;
  const estimatedRefund = Math.max(0, totalPaid - totalDeduction);
  const keptRevenue = totalPaid - estimatedRefund;

  const handleRefundSubmit = () => {
    if (!onPackageRefund) return;
    setShowConfirmCancelModal(true);
  };

  const executeRefund = async () => {
    if (!onPackageRefund) return;
    setSubmittingRefund(true);
    try {
      await onPackageRefund(invoice.id, usedSessions, penaltyPercent, refundReason);
      setShowConfirmCancelModal(false);
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
          <div className="space-y-5">
            {/* Top 3 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer block */}
              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <User size={13} className="text-primary" />
                  Thông tin khách hàng
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
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
              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Building size={13} className="text-primary" />
                  Sản phẩm điều trị
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 shrink-0">Chi tiết:</span>
                    <span className="text-secondary font-black text-right leading-snug" title={invoice.ten_dich_vu}>
                      {invoice.ten_dich_vu || 'Phí khám lâm sàng/Buổi lẻ'}
                      {isPackage && ` (${totalSessions} buổi)`}
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

              {/* Financial Status Summary block */}
              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Activity size={13} className="text-primary" />
                  Trạng thái tài chính
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tổng cần thu:</span>
                    <span className="text-secondary font-black">{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Đã thanh toán:</span>
                    <span className="text-emerald-700 font-bold">{formatCurrency(Number(invoice.da_thanh_toan))}</span>
                  </div>
                  {remainingDebt > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Dư nợ còn lại:</span>
                      <span>{formatCurrency(remainingDebt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction History & Refund Panel (Full width) */}
            <div className="space-y-4">
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
                          <tr 
                            key={p.id} 
                            onClick={() => setSelectedTxId(selectedTxId === p.id ? null : p.id)}
                            className={`hover:bg-zinc-50/40 cursor-pointer transition-all ${
                              selectedTxId === p.id ? 'bg-indigo-50/60 font-bold' : ''
                            }`}
                          >
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
                              <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
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

                {invoicePayments.length > 0 && (
                  <div className="mt-3">
                    {(() => {
                      const selectedTx = invoicePayments.find((tx) => tx.id === selectedTxId);
                      if (!selectedTx) {
                        return (
                          <div className="text-[10px] text-zinc-400 italic text-center py-2 bg-zinc-50/30 border border-zinc-150 border-dashed rounded-xl">
                            💡 Click chọn một giao dịch ở trên để xem phân tích chi tiết dòng tiền từng bước.
                          </div>
                        );
                      }

                      if (selectedTx.loai_giao_dich === 'HOAN_TIEN') {
                        const analysis = selectedTx.chi_tiet;

                        if (!analysis) {
                          return (
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150 border-dashed text-zinc-400 text-[11px] italic text-center">
                              Giao dịch trước nâng cấp hệ thống — không có dữ liệu chi tiết.
                            </div>
                          );
                        }

                        const examTrace = analysis.exam_trace as {
                          has_separate_invoice: boolean;
                          invoice_code: string | null;
                          invoice_date: string | null;
                          appointment_date: string | null;
                          appointment_end: string | null;
                        } | null;
                        const examTimeRange = examTrace?.appointment_date && examTrace?.appointment_end
                          ? formatTimeRange(examTrace.appointment_date, examTrace.appointment_end)
                          : '';
                        const totalDeduct = Number(analysis.chi_phi_buoi_dung) + Number(analysis.phi_phat_thuc_te) + Number(analysis.exam_fee_to_charge);

                        return (
                          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-rose-950 text-xs font-semibold space-y-3.5 shadow-sm animate-in fade-in duration-200">
                            <div className="flex justify-between items-center pb-2 border-b border-rose-100/65">
                              <span className="font-black text-rose-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                📊 Phân tích chi tiết giao dịch hoàn tiền ({selectedTx.ma_giao_dich})
                              </span>
                              <span className="text-[9px] bg-rose-200/50 text-rose-800 px-1.5 py-0.5 rounded font-black">REFUND</span>
                            </div>

                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center text-zinc-700 font-bold">
                                <span>1. Số tiền khách đã thực đóng (A):</span>
                                <strong className="text-secondary font-black text-sm">{formatCurrency(analysis.so_tien_da_dong)}</strong>
                              </div>

                              <div className="pl-3 border-l-2 border-rose-200 space-y-1.5 text-[11px] text-zinc-650">
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">2.1. Chi phí số buổi đã sử dụng ({analysis.so_buoi_dung}/{analysis.tong_so_buoi} buổi):</span>
                                  <span>-{formatCurrency(analysis.chi_phi_buoi_dung)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">2.2. Phí phạt hủy gói ({analysis.phi_phat_percent}% trên số tiền đã đóng thực tế):</span>
                                  <span>-{formatCurrency(analysis.phi_phat_thuc_te)}</span>
                                </div>
                                {examTrace && (
                                  <div className="flex justify-between items-start">
                                    <span className="text-zinc-500 text-left max-w-[280px]">
                                      {examTrace.has_separate_invoice ? (
                                        <>2.3. Thu hồi miễn phí khám (Hóa đơn khám <strong className="text-rose-700 font-bold">{examTrace.invoice_code}</strong>{examTrace.invoice_date ? ` ngày ${formatLongDate(examTrace.invoice_date)}` : ''}):</>
                                      ) : (
                                        <>2.3. Thu hồi miễn phí khám{examTrace.appointment_date ? ` (Ca khám ngày ${formatLongDate(examTrace.appointment_date)}${examTimeRange ? ` từ ${examTimeRange.replace(' - ', ' đến ')}` : ''})` : ''}:</>
                                      )}
                                    </span>
                                    <span className="shrink-0">-{formatCurrency(analysis.exam_fee_to_charge)}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-dashed border-rose-200/60 font-bold text-rose-800">
                                <span>3. Tổng số tiền khấu trừ (B = 2.1 + 2.2 + 2.3):</span>
                                <span>-{formatCurrency(totalDeduct)}</span>
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-rose-200 font-black text-rose-950 text-xs">
                                <span>4. Thực tế hoàn trả cho khách (A - B):</span>
                                <span className="text-rose-600 font-black text-sm">-{formatCurrency(analysis.so_tien_hoan_tra)}</span>
                              </div>
                            </div>

                            <div className="text-[10px] leading-relaxed text-zinc-500 bg-white/70 border border-zinc-150 p-2.5 rounded-xl space-y-1 font-normal">
                              <p className="font-bold text-zinc-650 mb-0.5">ℹ️ Ghi nhận dòng tiền thực tế sau khi hoàn trả:</p>
                              {analysis.exam_fee_to_charge > 0 && (
                                <p>• Phí khám lâm sàng <strong className="text-zinc-700 font-bold">{formatCurrency(analysis.exam_fee_to_charge)}</strong> {examTrace?.has_separate_invoice ? `đã thanh toán độc lập ở hóa đơn ${examTrace.invoice_code}` : 'đã được tách và chuyển thành Hóa đơn khám riêng biệt'}{examTrace?.invoice_date ? ` ngày ${formatLongDate(examTrace.invoice_date)}` : examTrace?.appointment_date ? ` ngày ${formatLongDate(examTrace.appointment_date)}` : ''} để đảm bảo ghi nhận doanh thu khám.</p>
                              )}
                              <p>• Phần tiền phạt <strong className="text-zinc-700 font-bold">{formatCurrency(analysis.phi_phat_thuc_te)}</strong> được giữ lại và ghi nhận doanh thu trên hóa đơn gói này.</p>
                            </div>
                          </div>
                        );
                      } else {
                        // THANH_TOAN transaction — đọc thẳng chi_tiet ghi lúc phát sinh giao dịch,
                        // không đoán theo vị trí trong mảng (xem backend/src/domain/billing.ts describePaymentTransaction).
                        const chiTiet = selectedTx.chi_tiet;
                        const txContent = chiTiet?.dien_giai || 'Giao dịch thanh toán (dữ liệu cũ, trước nâng cấp hệ thống)';
                        const percentPaid = chiTiet ? `${chiTiet.ty_le_phan_tram}%` : 'Không rõ (giao dịch cũ)';

                        return (
                          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-250 text-emerald-950 text-xs font-semibold space-y-3 shadow-sm animate-in fade-in duration-200">
                            <div className="flex justify-between items-center pb-2 border-b border-emerald-100/65">
                              <span className="font-black text-emerald-850 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                📊 Chi tiết giao dịch thanh toán ({selectedTx.ma_giao_dich})
                              </span>
                              <span className="text-[9px] bg-emerald-200/50 text-emerald-800 px-1.5 py-0.5 rounded font-black">PAYMENT</span>
                            </div>
                            
                            <div className="space-y-2 text-zinc-700">
                              <div className="flex justify-between items-center font-bold">
                                <span>1. Số tiền thực đóng:</span>
                                <strong className="text-emerald-700 font-black text-sm">+{formatCurrency(selectedTx.so_tien)}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">2. Nội dung giao dịch:</span>
                                <span className="font-semibold text-zinc-800">{txContent}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">3. Tỷ lệ thanh toán đợt này:</span>
                                <span className="font-semibold text-zinc-800">{percentPaid}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">4. Phương thức giao dịch:</span>
                                <span className="font-semibold text-zinc-800 capitalize">
                                  {selectedTx.phuong_thuc === 'tien_mat'
                                    ? 'Tiền mặt'
                                    : selectedTx.phuong_thuc === 'chuyen_khoan'
                                    ? 'Chuyển khoản'
                                    : 'Thẻ / POS'}
                                </span>
                              </div>

                              {/* Billing Calculation Details */}
                              <div className="mt-3 pt-3 border-t border-emerald-100/65 space-y-1.5 text-[11px] text-zinc-650">
                                <div className="font-black text-emerald-850 uppercase tracking-wider text-[9px] mb-1">
                                  🔍 Phân tích chi tiết hóa đơn lúc mua:
                                </div>
                                {isPackage ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Giá gốc gói trị liệu:</span>
                                      <span className="font-semibold">{formatCurrency(gia_goc_goi)}</span>
                                    </div>
                                    {chi_phi_kham > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-zinc-500">Phí khám lâm sàng & Lượng giá:</span>
                                        <span className="font-semibold">{formatCurrency(chi_phi_kham)}</span>
                                      </div>
                                    )}
                                    {giam_gia_goi > 0 && (
                                      <div className="flex justify-between text-emerald-700">
                                        <span>Ưu đãi hình thức ({ti_le_giam}%):</span>
                                        <span className="font-semibold">-{formatCurrency(giam_gia_goi)}</span>
                                      </div>
                                    )}
                                    {mien_phi_kham > 0 && (
                                      <div className="flex justify-between text-emerald-700">
                                        <span>
                                          Miễn phí khám (Ưu đãi mua gói)
                                          {invoice.ngay_kham ? ` (${formatLongDate(invoice.ngay_kham)})` : ''}:
                                        </span>
                                        <span className="font-semibold">-{formatCurrency(mien_phi_kham)}</span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">{invoice.loai_goi === 'LE' ? 'Giá gốc dịch vụ lẻ:' : 'Phí khám lâm sàng & Lượng giá:'}</span>
                                      <span className="font-semibold">{formatCurrency(chi_phi_kham || Number(invoice.tong_tien_thanh_toan))}</span>
                                    </div>
                                    {invoice.trang_thai === 'da_thanh_toan' && Number(invoice.tong_tien_thanh_toan) === 0 && chi_phi_kham > 0 && (
                                      <div className="flex justify-between text-emerald-700">
                                        <span>Khấu trừ/Miễn phí theo hóa đơn gói:</span>
                                        <span className="font-semibold">-{formatCurrency(chi_phi_kham)}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                <div className="flex justify-between border-t border-dashed border-emerald-250/60 pt-1.5 font-bold text-zinc-800">
                                  <span>Tổng chi phí cần thu:</span>
                                  <span>{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              {/* Advanced Package Refund Panel (rendered inline inside Right Column when triggered) */}
              {isRefundPanelOpen && isAdminOrManager && isPackage && canRefund && (
                <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                      <ShieldAlert size={16} className="text-amber-500 stroke-[2.5]" />
                      <span>Nghiệp vụ Hủy gói & Hoàn tiền chuyên sâu</span>
                    </div>
                    <button
                      onClick={() => setIsRefundPanelOpen(false)}
                      className="text-[10px] font-black text-zinc-400 hover:text-zinc-650 uppercase tracking-widest"
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
                          className="w-full px-3.5 py-2 text-xs border border-zinc-200 bg-zinc-50 rounded-lg text-zinc-400 font-bold cursor-not-allowed outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wide">Phí phạt hủy gói (%) (Cố định)</label>
                        <input
                          type="number"
                          value={penaltyPercent}
                          disabled
                          className="w-full px-3.5 py-2 text-xs border border-zinc-200 bg-zinc-50 rounded-lg text-zinc-400 font-bold cursor-not-allowed outline-none"
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
                        className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none font-bold"
                      />
                    </div>

                    {/* Calculator Breakdown Live Preview */}
                    <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-2.5 text-xs font-semibold text-zinc-650">
                      <div className="flex justify-between">
                        <span>Tổng tiền khách hàng đã đóng:</span>
                        <span className="text-secondary font-bold">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>
                          Khấu trừ phí khám lâm sàng (Thu hồi ưu đãi)
                          {examFeeToCharge > 0 && invoice.ngay_kham ? ` (ca khám ngày ${formatLongDate(invoice.ngay_kham)})` : ''}:
                        </span>
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
                      <div className="flex justify-between border-t border-zinc-100 pt-2 text-slate-800 font-bold">
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

                    {estimatedRefund === 0 && (
                      <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                        <span className="text-sm">⚠️</span>
                        <span>Quý khách hàng không còn đủ điều kiện hoàn tiền</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsRefundPanelOpen(false)}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleRefundSubmit}
                        disabled={submittingRefund || estimatedRefund === 0}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

      {showConfirmCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="size-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-black text-secondary text-base">Xác Nhận Hủy Gói & Hoàn Tiền</h3>
              <p className="text-zinc-500 text-xs font-semibold leading-normal">
                Bạn có chắc chắn muốn hủy gói dịch vụ này không? Hành động này sẽ cập nhật trạng thái phác đồ và không thể hoàn tác.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-left text-xs font-semibold space-y-2 text-zinc-650">
              <div className="flex justify-between">
                <span>Số tiền hoàn trả lại cho khách:</span>
                <span className="text-rose-600 font-bold text-sm">{formatCurrency(estimatedRefund)}</span>
              </div>
              <div className="flex justify-between">
                <span>Doanh thu giữ lại thực tế:</span>
                <span className="text-secondary font-bold">{formatCurrency(keptRevenue)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmCancelModal(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200/80 active:scale-[0.98] text-secondary text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-zinc-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeRefund}
                disabled={submittingRefund}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {submittingRefund ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InvoiceDetailModal;

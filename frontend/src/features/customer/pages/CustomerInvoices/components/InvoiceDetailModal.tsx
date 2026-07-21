import { useState } from 'react';
import { User, Building, Activity, Receipt, ChevronDown, Phone, ShieldAlert, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import type { CustomerInvoice, CustomerPayment } from '../../../api/customer.api';

interface InvoiceDetailModalProps {
  invoice: CustomerInvoice;
  payments: CustomerPayment[];
  onClose: () => void;
  onOpenPolicy: () => void;
  /** Mở sẵn bảng xem trước hoàn tiền — dùng khi nhảy tới từ nút "Hủy liệu trình" ở trang Hồ sơ trị liệu. */
  autoOpenRefund?: boolean;
}

/** Chi tiết hóa đơn — CHỈ XEM cho khách hàng, bố cục và số liệu giống y hệt trang Admin
 * (admin/pages/ManageFinance/components/InvoiceDetailModal.tsx), chỉ khác: không có nút thao tác
 * nào (Hoàn tiền / Thu tiền / Xác nhận hủy) — nơi Admin bấm "Hoàn tiền" để xử lý, ở đây bấm để CHỈ
 * XEM trước bảng tính, kèm ghi chú liên hệ phòng khám nếu có nhu cầu hủy thật. */
export function InvoiceDetailModal({ invoice, payments, onClose, onOpenPolicy, autoOpenRefund }: InvoiceDetailModalProps) {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isRefundPanelOpen, setIsRefundPanelOpen] = useState(!!autoOpenRefund);
  const usedSessions = invoice.so_buoi_da_dung || 0;
  const penaltyPercent = 10;

  const invoicePayments = payments.filter(
    (p) => p.hoa_don_id === invoice.id || p.ma_hoa_don === invoice.ma_hoa_don
  );

  const formatLongDate = (dStr: any) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  };

  const formatTimeRange = (startStr: any, endStr: any) => {
    if (!startStr || !endStr) return '';
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const remainingDebt = invoice.trang_thai === 'da_hoan_tien' || invoice.trang_thai === 'da_huy'
    ? 0
    : Math.max(0, Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan));

  // Y hệt công thức admin — xem chú thích đầy đủ ở
  // admin/pages/ManageFinance/components/InvoiceDetailModal.tsx, khớp
  // backend/src/domain/billing.ts::calculatePackageCancellationRefund().
  const isPackage = !!invoice.phac_do_dieu_tri_id;
  const chi_phi_kham = Number(invoice.chi_phi_kham || 0);
  const so_tien_giam_voucher = Number(invoice.so_tien_giam_voucher || 0);
  const tong_tien_goc = Number(invoice.tong_tien_goc);
  const hasPaidSeparateExam = !!invoice.ma_hoa_don_kham_rieng;
  const gia_goc_goi = tong_tien_goc;
  const ti_le_giam = Number(invoice.ti_le_giam_gia_goi || 0);
  const giam_gia_goi = isPackage ? Math.round((gia_goc_goi * ti_le_giam) / 100) : 0;

  const isExamWaived = isPackage && (gia_goc_goi >= 1000000) && ['tra_thang', 'tra_gop'].includes(invoice.hinh_thuc_thanh_toan_goi || '');
  const mien_phi_kham = isExamWaived ? chi_phi_kham : 0;

  const canRefund = isPackage && invoice.loai_goi === 'LIEU_TRINH' && invoice.hinh_thuc_thanh_toan_goi !== 'tung_buoi';
  const alreadySettled = ['da_hoan_tien', 'da_huy'].includes(invoice.trang_thai)
    || ['huy', 'hoan_thanh'].includes(invoice.trang_thai_phac_do || '');

  const totalPaid = Number(invoice.da_thanh_toan);
  const gia_thanh_toan_goi = gia_goc_goi - giam_gia_goi;
  const penaltyAmount = Math.round((gia_thanh_toan_goi * penaltyPercent) / 100);
  const totalSessions = Number(invoice.tong_so_buoi || 10);
  const usedSessionsCost = Math.round((gia_thanh_toan_goi * usedSessions) / totalSessions);
  const hasExam = isPackage && !!invoice.cuoc_hen_id;
  const examFeeToCharge = hasExam && !hasPaidSeparateExam ? chi_phi_kham : 0;
  const totalDeduction = usedSessionsCost + penaltyAmount + examFeeToCharge;
  const estimatedRefund = Math.max(0, totalPaid - totalDeduction);
  const keptRevenue = totalPaid - estimatedRefund;
  const perSessionCost = totalSessions > 0 ? Math.round(gia_thanh_toan_goi / totalSessions) : 0;
  const shortfall = Math.max(0, totalDeduction - totalPaid);

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-zinc-150 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
              <Receipt size={20} />
            </span>
            <div>
              <h2 className="text-base font-black text-secondary">Hóa đơn {invoice.ma_hoa_don}</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                Khởi tạo: {new Date(invoice.ngay_tao).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors text-lg leading-none">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-5">
            {/* Top 3 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <User size={13} className="text-primary" /> Thông tin khách hàng
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

              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Building size={13} className="text-primary" /> Sản phẩm điều trị
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 shrink-0">Chi tiết:</span>
                    <span className="text-secondary font-black text-right leading-snug" title={invoice.ten_dich_vu || ''}>
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

              <div className="p-4 bg-zinc-50/50 border border-zinc-150 rounded-2xl space-y-2.5">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 flex items-center gap-1.5">
                  <Activity size={13} className="text-primary" /> Trạng thái tài chính
                </h3>
                <div className="space-y-1.5 text-xs font-semibold text-zinc-650">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tổng cần thu:</span>
                    <span className="text-secondary font-black">{formatCurrency(invoice.tong_tien_thanh_toan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Đã thanh toán:</span>
                    <span className="text-emerald-700 font-bold">{formatCurrency(invoice.da_thanh_toan)}</span>
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

            {/* Transaction History */}
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="pb-1 border-b border-zinc-100 flex items-center justify-between gap-2">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={13} className="text-primary" /> Lịch sử ghi nhận giao dịch thanh toán
                  </h3>
                  {invoicePayments.length > 0 && (
                    <span className="text-[9px] font-bold text-zinc-350 italic normal-case">Bấm vào 1 dòng để xem chi tiết dòng tiền</span>
                  )}
                </div>
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
                          <th className="px-2 py-2.5 w-6" aria-hidden="true" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-650">
                        {invoicePayments.map((p) => {
                          const isSelected = selectedTxId === p.id;
                          return (
                            <tr
                              key={p.id}
                              onClick={() => setSelectedTxId(isSelected ? null : p.id)}
                              className={`hover:bg-zinc-50/40 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/60 font-bold' : ''}`}
                            >
                              <td className="px-3 py-2 font-mono text-zinc-400 text-[10px]">{p.ma_giao_dich}</td>
                              <td className="px-3 py-2 font-black text-secondary">{formatCurrency(p.so_tien)}</td>
                              <td className="px-3 py-2 capitalize text-[10px]">
                                {p.phuong_thuc === 'tien_mat' ? '💵 Tiền mặt' : p.phuong_thuc === 'chuyen_khoan' ? '🏦 Chuyển khoản' : '💳 Thẻ/POS'}
                              </td>
                              <td className="px-3 py-2 text-zinc-500 text-[10px]">{new Date(p.thoi_gian_giao_dich).toLocaleString('vi-VN')}</td>
                              <td className="px-2 py-2">
                                <ChevronDown size={12} className={`text-zinc-350 transition-transform duration-200 ${isSelected ? 'rotate-180 text-primary' : ''}`} />
                              </td>
                            </tr>
                          );
                        })}
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
                                <p>• Phí khám lâm sàng <strong className="text-zinc-700 font-bold">{formatCurrency(analysis.exam_fee_to_charge)}</strong> {examTrace?.has_separate_invoice ? `được ghi nhận tại hóa đơn khám riêng ${examTrace.invoice_code}` : 'chưa được tách hóa đơn khám riêng (giao dịch cũ, trước khi hệ thống hỗ trợ tự động tách)'}{examTrace?.invoice_date ? ` ngày ${formatLongDate(examTrace.invoice_date)}` : examTrace?.appointment_date ? ` ngày ${formatLongDate(examTrace.appointment_date)}` : ''} để đảm bảo ghi nhận doanh thu khám.</p>
                              )}
                              <p>• Phần tiền phạt <strong className="text-zinc-700 font-bold">{formatCurrency(analysis.phi_phat_thuc_te)}</strong> được giữ lại và ghi nhận doanh thu trên hóa đơn gói này.</p>
                            </div>
                          </div>
                        );
                      }

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
                                {selectedTx.phuong_thuc === 'tien_mat' ? 'Tiền mặt' : selectedTx.phuong_thuc === 'chuyen_khoan' ? 'Chuyển khoản' : 'Thẻ / POS'}
                              </span>
                            </div>

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
                                        {hasPaidSeparateExam ? (
                                          <>
                                            Khấu trừ phí khám đã đóng riêng
                                            {invoice.ngay_thanh_toan_kham_rieng ? ` ngày ${formatLongDate(invoice.ngay_thanh_toan_kham_rieng)}` : ''}
                                            {invoice.ma_hoa_don_kham_rieng ? ` (HĐ ${invoice.ma_hoa_don_kham_rieng})` : ''}:
                                          </>
                                        ) : (
                                          <>
                                            Miễn phí khám (Ưu đãi mua gói)
                                            {invoice.ngay_kham ? ` (${formatLongDate(invoice.ngay_kham)})` : ''}:
                                          </>
                                        )}
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
                              {so_tien_giam_voucher > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>
                                    Mã giảm giá
                                    {invoice.ma_voucher_ap_dung ? <> <strong className="font-bold">{invoice.ma_voucher_ap_dung}</strong></> : ''}
                                    {invoice.ten_voucher_ap_dung ? ` (${invoice.ten_voucher_ap_dung})` : ''}:
                                  </span>
                                  <span className="font-semibold">-{formatCurrency(so_tien_giam_voucher)}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-dashed border-emerald-250/60 pt-1.5 font-bold text-zinc-800">
                                <span>Tổng chi phí cần thu:</span>
                                <span>{formatCurrency(Number(invoice.tong_tien_thanh_toan))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Package refund preview — CHỈ hiện khi bấm nút, giống hành vi "Hoàn tiền" của Admin */}
              {isPackage && canRefund && !alreadySettled && (
                <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                      <ShieldAlert size={16} className="text-amber-500 stroke-[2.5]" />
                      <span>Chính sách Hủy gói & Hoàn tiền</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRefundPanelOpen((o) => !o)}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw size={11} /> {isRefundPanelOpen ? 'Ẩn bảng tính' : 'Xem trước hoàn tiền'}
                    </button>
                  </div>

                  {isRefundPanelOpen && (
                  <div className="space-y-4">
                    {(() => {
                      return (
                        <>
                          <div className="bg-white border border-slate-150 rounded-xl overflow-hidden">
                            {hasPaidSeparateExam && chi_phi_kham > 0 && (
                              <div className="flex justify-between items-center px-4 py-2.5 bg-amber-50/40 border-b border-amber-100/60">
                                <span className="text-[11px] font-bold text-amber-800">Giá gói theo hợp đồng</span>
                                <span className="text-amber-900 font-black text-xs">{formatCurrency(gia_thanh_toan_goi)}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center px-4 py-3 bg-zinc-50/70">
                              <div className="text-left">
                                <span className="text-xs font-bold text-zinc-650 block">Khách đã đóng</span>
                                {hasPaidSeparateExam && chi_phi_kham > 0 && (
                                  <span className="text-[10px] text-zinc-450 font-medium block mt-0.5">
                                    = Giá gói hợp đồng − {formatCurrency(chi_phi_kham)} phí khám đã đóng riêng trước đó
                                  </span>
                                )}
                              </div>
                              <span className="text-secondary font-black text-sm shrink-0">{formatCurrency(totalPaid)}</span>
                            </div>

                            <div className="px-4 py-3 space-y-3 border-t border-slate-100">
                              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                                Trừ đi các khoản sau{hasPaidSeparateExam && chi_phi_kham > 0 ? ' (tính theo giá gói hợp đồng, không theo số khách thực đóng)' : ''}
                              </p>

                              {examFeeToCharge > 0 && (
                                <div className="flex justify-between items-start gap-3">
                                  <div className="text-left">
                                    <p className="text-xs font-bold text-zinc-700">Phí khám lâm sàng</p>
                                    <p className="text-[10px] text-zinc-450 font-medium leading-relaxed">
                                      Thu hồi ưu đãi miễn phí khám khi mua gói
                                      {invoice.ngay_kham ? ` · ca khám ${formatLongDate(invoice.ngay_kham)}` : ''}
                                    </p>
                                  </div>
                                  <span className="text-rose-600 font-black text-xs shrink-0 tabular-nums">
                                    −{formatCurrency(examFeeToCharge)}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between items-start gap-3">
                                <div className="text-left">
                                  <p className="text-xs font-bold text-zinc-700">
                                    {usedSessions}/{totalSessions} buổi khách đã thực hiện
                                  </p>
                                  <p className="text-[10px] text-zinc-450 font-medium leading-relaxed tabular-nums">
                                    {formatCurrency(perSessionCost)} × {usedSessions} buổi
                                  </p>
                                </div>
                                <span className="text-rose-600 font-black text-xs shrink-0 tabular-nums">
                                  −{formatCurrency(usedSessionsCost)}
                                </span>
                              </div>

                              <div className="flex justify-between items-start gap-3">
                                <div className="text-left">
                                  <p className="text-xs font-bold text-zinc-700">Phí phạt hủy gói giữa chừng</p>
                                  <p className="text-[10px] text-zinc-450 font-medium leading-relaxed tabular-nums">
                                    {penaltyPercent}% × giá gói sau giảm ({formatCurrency(gia_thanh_toan_goi)})
                                  </p>
                                </div>
                                <span className="text-rose-600 font-black text-xs shrink-0 tabular-nums">
                                  −{formatCurrency(penaltyAmount)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-zinc-200">
                                <span className="text-xs font-black text-zinc-700">Tổng cộng bị trừ</span>
                                <span className="text-rose-600 font-black text-sm tabular-nums">
                                  {formatCurrency(totalDeduction)}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`flex justify-between items-center px-4 py-3.5 border-t-2 ${
                                estimatedRefund > 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-zinc-100/70 border-zinc-200'
                              }`}
                            >
                              <span className={`text-xs font-black ${estimatedRefund > 0 ? 'text-emerald-800' : 'text-zinc-650'}`}>
                                Hoàn lại cho khách
                              </span>
                              <span className={`font-black text-base tabular-nums ${estimatedRefund > 0 ? 'text-emerald-600' : 'text-zinc-450'}`}>
                                {formatCurrency(estimatedRefund)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-100 bg-white">
                              <span className="text-[11px] font-bold text-zinc-500">Phòng khám giữ lại</span>
                              <span className="text-secondary font-black text-xs tabular-nums">{formatCurrency(keptRevenue)}</span>
                            </div>
                          </div>

                          {estimatedRefund === 0 && (
                            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1 animate-in fade-in duration-200">
                              <p className="text-rose-700 text-xs font-black flex items-center gap-1.5">
                                <span>⚠️</span> Không hoàn tiền
                              </p>
                              <p className="text-[11px] text-rose-800/90 font-semibold leading-relaxed">
                                Các khoản phải trừ ({formatCurrency(totalDeduction)}) đã{' '}
                                {shortfall > 0 ? 'vượt quá' : 'dùng hết'} số tiền khách đóng ({formatCurrency(totalPaid)})
                                {shortfall > 0 ? ` — vượt ${formatCurrency(shortfall)}` : ''}. Khách đã dùng{' '}
                                {usedSessions}/{totalSessions} buổi của gói nên không thể hoàn tiền.
                                {shortfall > 0 && ' Phòng khám KHÔNG truy thu thêm phần vượt này.'}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  )}

                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
                    <Phone size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-secondary leading-relaxed">
                        Vui lòng liên hệ phòng khám để hủy gói liệu trình và hoàn tiền.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenPolicy}
                        className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
                      >
                        Xem chính sách →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isPackage && (!canRefund || alreadySettled) && (
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
                  <Phone size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-secondary leading-relaxed">
                      {alreadySettled
                        ? 'Gói này đã kết thúc (hủy/hoàn tiền) — xem chi tiết trong lịch sử giao dịch phía trên. Mọi thắc mắc vui lòng liên hệ phòng khám.'
                        : 'Gói thanh toán theo hình thức từng buổi không áp dụng hoàn tiền theo lô. Vui lòng liên hệ phòng khám nếu cần hỗ trợ.'}
                    </p>
                    <button
                      type="button"
                      onClick={onOpenPolicy}
                      className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider"
                    >
                      Xem chính sách →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

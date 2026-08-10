import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import {
  ArrowLeft,
  Coins,
  DollarSign,
  Tag
} from 'lucide-react';
import { formatCurrency } from '../../../../utils/format';
import { INVOICE_STATUS_LABELS } from './constants';

// Hooks
import { useCheckout } from './hooks/useCheckout';
import { useFinanceDashboard } from './hooks/useFinanceDashboard';
import type { Invoice, Payment } from './hooks/useFinanceDashboard';

// Components
import FastPaymentModal from './components/FastPaymentModal';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import OverduePackagePanel from './components/OverduePackagePanel';
import { ReceiptBreakdown } from './components/ReceiptBreakdown';
import PaymentSuccessBox from './components/PaymentSuccessBox';
import ConfirmPaymentModal from './components/ConfirmPaymentModal';
import QRWebhookModal from './components/QRWebhookModal';
import VoucherPicker from './components/VoucherPicker';
import FinanceKpiCards from './components/FinanceKpiCards';
import FinanceTabs from './components/FinanceTabs';
import FinanceFilterBar from './components/FinanceFilterBar';
import InvoiceTable from './components/InvoiceTable';
import PaymentTable from './components/PaymentTable';

export default function ManageFinance() {
  const { user } = useAuthStore();
  const isAdminOrManager = Number(user?.vai_tro_id) === 5 || Number(user?.vai_tro_id) === 6;

  const navigate = useNavigate();
  const location = useLocation();
  const baseFinanceRoute = Number(user?.vai_tro_id) === 2 ? '/receptionist/billing' : '/admin/finance';

  // Parse Query Parameters
  const params = new URLSearchParams(location.search);
  const queryLichDatId = params.get('lich_dat_id');
  const queryCustomerId = params.get('customer_id');
  const queryGoiDichVuId = params.get('goi_dich_vu_id');
  const queryHoaDonId = params.get('hoa_don_id');
  const queryDraftWalkin = params.get('draft_walkin');
  const isCheckoutMode = !!queryLichDatId || (!!queryCustomerId && !!queryGoiDichVuId) || queryDraftWalkin === 'true';

  // Hooks
  const checkout = useCheckout(queryLichDatId, isCheckoutMode, queryCustomerId, queryGoiDichVuId);
  const dashboard = useFinanceDashboard(isCheckoutMode);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Deep-link ?hoa_don_id=... — mở thẳng chi tiết hóa đơn (dùng cho nút "Đóng Đợt 2" từ
  // Hồ sơ điều trị / chi tiết lịch hẹn, vì Đợt 2 chỉ thu được trên hóa đơn gói đã tồn tại).
  const openedInvoiceRef = useRef<string | null>(null);
  useEffect(() => {
    if (!queryHoaDonId || dashboard.invoices.length === 0) return;
    if (openedInvoiceRef.current === queryHoaDonId) return;
    const matched = dashboard.invoices.find((inv) => inv.id === queryHoaDonId);
    if (matched) {
      openedInvoiceRef.current = queryHoaDonId;
      dashboard.setSelectedInvoice(matched);
    }
  }, [queryHoaDonId, dashboard.invoices]);

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
    if (checkout.checkoutTab === 'package') {
      checkout.handleThanhToanPackage(dummyEvent);
    } else {
      checkout.handleThanhToanSingle(dummyEvent);
    }
  };

  // Print invoice helper
  const handlePrint = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>In Hóa Đơn - ${inv.ma_hoa_don}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #0d9488; }
            .invoice-title { font-size: 20px; margin-top: 10px; font-weight: bold; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; margin-bottom: 30px; gap: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 14px; }
            .total-section { text-align: right; font-size: 15px; font-weight: bold; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">OFFICECARE - TRUNG TÂM PHỤC HỒI CHỨC NĂNG</div>
            <div class="invoice-title">HÓA ĐƠN DỊCH VỤ TRỊ LIỆU</div>
            <div>Mã số: ${inv.ma_hoa_don}</div>
          </div>
          <div class="meta-grid">
            <div>
              <strong>Khách hàng:</strong> ${inv.ten_khach_hang}<br/>
              <strong>Điện thoại:</strong> ${inv.so_dien_thoai || 'N/A'}<br/>
              <strong>Ngày tạo:</strong> ${new Date(inv.ngay_tao).toLocaleString('vi-VN')}
            </div>
            <div style="text-align: right;">
              <strong>Hình thức thanh toán:</strong> ${inv.hinh_thuc_thanh_toan_goi ? inv.hinh_thuc_thanh_toan_goi.replace(/_/g, ' ').toUpperCase() : 'MẶC ĐỊNH'}<br/>
              <strong>Trạng thái:</strong> ${INVOICE_STATUS_LABELS[inv.trang_thai] || inv.trang_thai.toUpperCase().replace(/_/g, ' ')}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nội dung thanh toán</th>
                <th style="text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${inv.ten_dich_vu || 'Phí khám lâm sàng/Buổi lẻ'}</td>
                <td style="text-align: right;">${formatCurrency(Number(inv.tong_tien_goc))}</td>
              </tr>
              ${Number(inv.ti_le_giam_gia_goi) > 0 ? `
              <tr style="color: #0d9488;">
                <td>Giảm giá ưu đãi (${inv.ti_le_giam_gia_goi}%)</td>
                <td style="text-align: right;">-${formatCurrency(Math.round(Number(inv.tong_tien_goc) * Number(inv.ti_le_giam_gia_goi) / 100))}</td>
              </tr>` : ''}
              ${Number(inv.so_tien_giam_voucher) > 0 ? `
              <tr style="color: #0d9488;">
                <td>Giảm giá voucher</td>
                <td style="text-align: right;">-${formatCurrency(Number(inv.so_tien_giam_voucher))}</td>
              </tr>` : ''}
            </tbody>
          </table>
          <div class="total-section">
            <div>Tổng số tiền phải thanh toán: ${formatCurrency(Number(inv.tong_tien_thanh_toan))}</div>
            <div style="color: #10b981; margin-top: 5px;">Số tiền đã đóng${inv.trang_thai === 'da_hoan_tien' ? ' (giữ lại)' : ''}: ${formatCurrency(Number(inv.da_thanh_toan))}</div>
            ${inv.trang_thai === 'da_hoan_tien'
              ? `<div style="color: #e11d48; margin-top: 5px;">Đã hoàn trả cho khách: ${formatCurrency(Math.max(0, Number(inv.tong_tien_thanh_toan) - Number(inv.da_thanh_toan)))}</div>`
              : `<div style="color: #f59e0b; margin-top: 5px;">Còn nợ lại: ${formatCurrency(Math.max(0, Number(inv.tong_tien_thanh_toan) - Number(inv.da_thanh_toan)))}</div>`
            }
          </div>
          <div class="footer">
            Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ phục hồi chức năng của chúng tôi!<br/>
            <em>Bản in hóa đơn y khoa điện tử hợp lệ</em>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // In biên nhận cho ĐÚNG 1 giao dịch (không phải cả hóa đơn) — cần khi khách chỉ muốn giấy biên
  // nhận cho 1 lần thu/hoàn cụ thể, vd hóa đơn "từng buổi" thu nhiều lần rải rác, hoặc muốn biên
  // nhận riêng cho giao dịch hoàn tiền. handlePrint() ở trên chỉ in được tổng lũy kế cả hóa đơn.
  const handlePrintTransaction = (inv: Invoice, pay: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isRefund = pay.loai_giao_dich === 'HOAN_TIEN';
    const soTien = Math.abs(Number(pay.so_tien));

    printWindow.document.write(`
      <html>
        <head>
          <title>Biên nhận ${pay.ma_giao_dich}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #0d9488; }
            .invoice-title { font-size: 20px; margin-top: 10px; font-weight: bold; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; margin-bottom: 30px; gap: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px; text-align: left; font-size: 14px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 14px; }
            .total-section { text-align: right; font-size: 15px; font-weight: bold; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">OFFICECARE - TRUNG TÂM PHỤC HỒI CHỨC NĂNG</div>
            <div class="invoice-title">${isRefund ? 'BIÊN NHẬN HOÀN TIỀN' : 'BIÊN NHẬN THANH TOÁN'}</div>
            <div>Mã giao dịch: ${pay.ma_giao_dich}</div>
          </div>
          <div class="meta-grid">
            <div>
              <strong>Khách hàng:</strong> ${inv.ten_khach_hang}<br/>
              <strong>Điện thoại:</strong> ${inv.so_dien_thoai || 'N/A'}<br/>
              <strong>Thời gian:</strong> ${new Date(pay.thoi_gian_giao_dich).toLocaleString('vi-VN')}
            </div>
            <div style="text-align: right;">
              <strong>Hóa đơn liên quan:</strong> ${inv.ma_hoa_don}<br/>
              <strong>Phương thức:</strong> ${pay.phuong_thuc === 'tien_mat' ? 'Tiền mặt' : pay.phuong_thuc === 'chuyen_khoan' ? 'Chuyển khoản' : 'Thẻ/POS'}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nội dung</th>
                <th style="text-align: right;">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${inv.ten_dich_vu || 'Phí khám lâm sàng/Buổi lẻ'} — ${isRefund ? 'Hoàn tiền' : 'Thanh toán'}</td>
                <td style="text-align: right; color: ${isRefund ? '#e11d48' : '#0d9488'};">${formatCurrency(soTien)}</td>
              </tr>
            </tbody>
          </table>
          <div class="total-section" style="color: ${isRefund ? '#e11d48' : '#0d9488'};">
            <div>${isRefund ? 'Đã hoàn trả cho khách' : 'Số tiền đã thu'}: ${formatCurrency(soTien)}</div>
          </div>
          <div class="footer">
            Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ phục hồi chức năng của chúng tôi!<br/>
            <em>Bản in biên nhận điện tử hợp lệ</em>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ----------------------------------------------------
  // RENDER CHECKOUT MODE
  // ----------------------------------------------------
  if (isCheckoutMode) {
    if (checkout.paymentSuccessData) {
      return (
        <PaymentSuccessBox
          paymentSuccessData={checkout.paymentSuccessData}
          phuongThuc={checkout.state.phuongThuc}
          user={user}
          navigate={navigate}
          onComplete={() => {
            sessionStorage.removeItem('draft_walkin_checkin');
            checkout.setPaymentSuccessData(null);
            checkout.setFeedbackLyDo('');
            checkout.setSelectedPackage(null);
            checkout.dispatch({ type: 'RESET_HOA_DON' });
            navigate(baseFinanceRoute);
            dashboard.fetchDashboardData();
          }}
        />
      );
    }

    const totalRequired = checkout.checkoutTab === 'package' && checkout.calculatedData
      ? (checkout.dangKyGoi && checkout.loaiThanhToan === 'tung_buoi'
        ? Number(checkout.calculatedData.so_tien_dot_1)
        : Number(checkout.calculatedData.tong_tien_thanh_toan))
      : (checkout.state.hoaDon ? Number(checkout.state.hoaDon.tong_tien_thanh_toan) : 0);

    const received = Number(checkout.state.soTienNhan || 0);
    const isShortage = checkout.state.phuongThuc === 'tien_mat' && totalRequired > 0 && received > 0 && received < totalRequired;
    const changeAmount = checkout.state.phuongThuc === 'tien_mat' && received > totalRequired ? (received - totalRequired) : 0;

    const quickCashOptions = Array.from(new Set([totalRequired, 200000, 500000, 1000000, 2000000, 5000000]))
      .filter(val => val > 0)
      .sort((a, b) => a - b);

    const isTungBuoiWithPaidExam = checkout.dangKyGoi &&
      checkout.loaiThanhToan === 'tung_buoi' &&
      checkout.selectedConsultation?.ngay_thanh_toan_kham;

    const hasLockedTarget = !!checkout.selectedConsultation?.khuyen_nghi_goi_id ||
      !!checkout.selectedConsultation?.goi_dich_vu_id;

    const handleBackNavigation = () => {
      sessionStorage.removeItem('draft_walkin_checkin');
      if (location.state?.from) {
        navigate(location.state.from);
      } else if (Number(user?.vai_tro_id) === 2 || window.location.pathname.startsWith('/receptionist')) {
        navigate('/receptionist/appointments');
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(baseFinanceRoute);
      }
    };

    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 font-jakarta text-left pb-12">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (totalRequired === 0) {
              checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: '0' });
            }
            setShowConfirmModal(true);
          }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT COLUMN: SINGLE UNIFIED POS CONTROL PANEL */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm text-left">
            
            {/* 1. Customer Info Banner Strip with Embedded Back Button */}
            {checkout.selectedConsultation ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackNavigation}
                    title="Quay lại hàng chờ hôm nay"
                    className="p-2.5 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-600 shrink-0 shadow-xs active:scale-95"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="size-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-base flex items-center justify-center shadow-sm shrink-0">
                    {(checkout.selectedConsultation.ten_khach_hang || 'K').trim().split(/\s+/).pop()?.[0] || 'K'}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {checkout.selectedConsultation.ten_khach_hang}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      📞 {checkout.selectedConsultation.sdt_khach_hang || 'N/A'}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 shrink-0">
                  {checkout.selectedConsultation.loai_lich === 'kham_moi' ? 'Lượng giá PHCN' : checkout.selectedConsultation.loai_lich === 'tai_kham' ? 'Lượng giá bổ sung' : 'Trị liệu phác đồ'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  title="Quay lại hàng chờ hôm nay"
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  THU NGÂN & XÁC NHẬN THANH TOÁN
                </span>
              </div>
            )}

            {/* 2. Package & Treatment Plan Configuration (Only when doctor recommended or user selected package) */}
            {(checkout.dangKyGoi || checkout.selectedConsultation?.khuyen_nghi_goi_id) && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                      <Coins size={15} />
                    </span>
                    <span>Cấu hình phác đồ & Lịch thanh toán</span>
                  </div>



                  {checkout.dangKyGoi && !hasLockedTarget && (
                    <div className="space-y-1.5">
                      <label htmlFor="selectedPackage" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {checkout.selectedPackage?.loai_goi === 'LE' ? 'Dịch vụ lẻ được chỉ định *' : 'Gói trị liệu được chỉ định *'}
                      </label>
                      <select
                        id="selectedPackage"
                        value={checkout.selectedPackage?.id || ''}
                        onChange={(e) => {
                          const matched = checkout.packages.find(p => String(p.id) === e.target.value);
                          checkout.setSelectedPackage(matched || null);
                        }}
                        required
                        disabled={hasLockedTarget || isTungBuoiWithPaidExam}
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer disabled:opacity-60 shadow-xs"
                      >
                        <option value="">-- Chọn gói trị liệu --</option>
                        {checkout.packages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.ten_goi} ({formatCurrency(pkg.don_gia)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {checkout.dangKyGoi && checkout.selectedPackage?.loai_goi !== 'LE' && (
                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Hình thức thanh toán gói</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => checkout.setLoaiThanhToan('tra_thang')}
                          className={`py-3 px-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            checkout.loaiThanhToan === 'tra_thang'
                              ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Trả Thẳng (100%)
                        </button>
                        <button
                          type="button"
                          onClick={() => checkout.setLoaiThanhToan('tung_buoi')}
                          className={`py-3 px-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            checkout.loaiThanhToan === 'tung_buoi'
                              ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Trả Từng Buổi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 3. Voucher Selector */}
            {checkout.checkoutTab === 'package' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                    <Tag size={15} />
                  </span>
                  <span>Mã ưu đãi & Voucher</span>
                </div>
                <VoucherPicker
                  appliedVoucher={checkout.appliedVoucher}
                  onApply={checkout.handleApplyVoucher}
                  onRemove={checkout.handleRemoveVoucher}
                  disabled={isTungBuoiWithPaidExam}
                  orderValue={Number(checkout.calculatedData?.gia_goc_goi || checkout.calculatedData?.gia_goc || 0)}
                  loaiThanhToan={checkout.dangKyGoi ? checkout.loaiThanhToan : 'tra_thang'}
                  khachHangId={checkout.selectedConsultation?.khach_hang_id}
                  kenh="tai_quay"
                  loaiGoi={
                    checkout.dangKyGoi && checkout.selectedPackage
                      ? (checkout.selectedPackage.loai_goi === 'LE' ? 'LE' : 'LIEU_TRINH')
                      : 'KHAM'
                  }
                />
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2" />
              </div>
            )}

            {/* 4. Payment Method & Cash Operations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <DollarSign size={15} />
                </span>
                <span>Phương thức thanh toán & Tiền nhận</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: 'chuyen_khoan' })}
                  className={`py-4 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    checkout.state.phuongThuc === 'chuyen_khoan'
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">🏦</span>
                  <span className="text-xs font-extrabold tracking-tight">VIETQR (PayOS Tự Động)</span>
                </button>

                <button
                  type="button"
                  onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: 'tien_mat' })}
                  className={`py-4 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    checkout.state.phuongThuc === 'tien_mat'
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">💵</span>
                  <span className="text-xs font-extrabold tracking-tight">TIỀN MẶT (Cash)</span>
                </button>
              </div>

              {checkout.state.phuongThuc === 'tien_mat' && totalRequired > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="soTienNhan" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Số tiền khách đưa (VND) *</label>
                    <input 
                      id="soTienNhan"
                      type="text" 
                      placeholder="VD: 500.000"
                      value={checkout.state.soTienNhan ? Number(checkout.state.soTienNhan.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: raw });
                      }}
                      required
                      className={`w-full px-4 py-3.5 rounded-2xl text-xs font-black transition-all outline-none ${
                        isShortage 
                          ? 'bg-rose-50/60 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500'
                      }`}
                    />
                    {isShortage && (
                      <p className="text-[11px] text-rose-600 font-extrabold flex items-center gap-1 mt-1">
                        ⚠️ Còn thiếu {formatCurrency(totalRequired - received)} để hoàn thành thanh toán
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {quickCashOptions.map(val => {
                      const isActive = val === received;
                      const isExact = val === totalRequired;

                      return (
                        <button 
                          key={val} 
                          type="button"
                          onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: val.toString() })}
                          className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                              : isExact
                              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-600 hover:text-white'
                          }`}
                        >
                          {formatCurrency(val)}
                          {isExact && !isActive && <span className="text-[9px] font-bold ml-1 opacity-80">(Đúng tiền)</span>}
                        </button>
                      );
                    })}
                  </div>

                  {changeAmount > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-xs font-extrabold flex justify-between items-center shadow-xs">
                      <span>💵 Tiền thừa thối lại khách:</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(changeAmount)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label htmlFor="feedbackLyDo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ghi chú nội bộ phòng khám</label>
                <textarea 
                  id="feedbackLyDo"
                  placeholder="Ghi nhận phản hồi hoặc lưu ý thu ngân..."
                  rows={2}
                  value={checkout.feedbackLyDo}
                  onChange={(e) => checkout.setFeedbackLyDo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 outline-none transition-all resize-none shadow-xs"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Unified Sticky Receipt Ticket Panel & Confirm Button */}
          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-6 shadow-xl text-left">
              <ReceiptBreakdown
                checkoutTab={checkout.checkoutTab}
                hoaDon={checkout.state.hoaDon}
                dangKyGoi={checkout.dangKyGoi}
                selectedPackage={checkout.selectedPackage}
                calculatedData={checkout.calculatedData}
                loaiThanhToan={checkout.loaiThanhToan}
              />

              <button
                type="submit"
                disabled={checkout.state.loading || (checkout.checkoutTab === 'package' ? (checkout.calculating || !checkout.calculatedData) : !checkout.state.hoaDon)}
                className="w-full py-5 px-6 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2.5 border border-teal-400/40"
              >
                {checkout.state.loading
                  ? 'Đang xử lý...'
                  : (checkout.state.phuongThuc === 'chuyen_khoan'
                    ? '📲 TẠO MÃ QR PAYOS TỰ ĐỘNG'
                    : (totalRequired === 0 ? 'Kích hoạt phác đồ & Đặt lịch' : '🟢 XÁC NHẬN THU TIỀN & IN HÓA ĐƠN'))
                }
              </button>
            </div>
          </div>
        </form>

        <ConfirmPaymentModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSubmit}
          patientName={checkout.selectedConsultation?.ten_khach_hang || ''}
          itemName={
            checkout.checkoutTab === 'package'
              ? (checkout.dangKyGoi
                ? (checkout.selectedPackage?.ten_goi || 'Gói trị liệu')
                : (checkout.calculatedData?.ten_item || 'Phí khám'))
              : (checkout.state.hoaDon?.ten_dich_vu || 'Phí khám/Buổi trị liệu')
          }
          totalAmount={totalRequired}
          paymentMethod={checkout.state.phuongThuc}
          receivedAmount={received}
          changeAmount={changeAmount}
          note={checkout.feedbackLyDo}
          loading={checkout.state.loading}
          actionText={totalRequired === 0 ? 'Kích hoạt phác đồ & Đặt lịch' : 'Xác nhận & Thu tiền'}
        />

        {checkout.activePayOSInvoice && (
          <QRWebhookModal
            hoaDonId={checkout.activePayOSInvoice.invoice.id}
            amount={checkout.activePayOSInvoice.amount}
            soThuTuBuoi={checkout.activePayOSInvoice.so_thu_tu_buoi}
            onClose={() => checkout.setActivePayOSInvoice(null)}
            onSuccess={(paidInvoice) => checkout.handlePayOSSuccess(paidInvoice)}
          />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER FINANCE DASHBOARD
  // ----------------------------------------------------
  const filteredInvoices = dashboard.getFilteredInvoices();
  const filteredPayments = dashboard.getFilteredPayments();
  // Gói liệu trình đã quá hạn sử dụng, khách không phản hồi — xem docs/BUSINESS_RULES.md mục
  // "Hủy gói quá hạn sử dụng (không hoàn tiền)". Cả admin lẫn lễ tân đều thấy để dễ liên lạc thử
  // trước, nhưng chỉ Admin thấy/bấm được nút hủy trong InvoiceDetailModal.
  const overdueInvoices = dashboard.invoices.filter((inv) =>
    !!inv.phac_do_dieu_tri_id &&
    !!inv.han_su_dung &&
    new Date(inv.han_su_dung) < new Date() &&
    !['da_hoan_tien', 'da_huy'].includes(inv.trang_thai) &&
    !['huy', 'hoan_thanh'].includes(inv.trang_thai_phac_do || '')
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 text-left font-jakarta">
      {/* HUD Header Banner Đồng Nhất Admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
              PHÂN HỆ KẾ TOÁN LÂM SÀNG
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2.5">
            <DollarSign className="text-teal-600 dark:text-teal-400 size-7" />
            QUẢN LÝ TÀI CHÍNH & HÓA ĐƠN Y KHOA
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
            Theo dõi dòng tiền, hóa đơn khám/gói trị liệu và xử lý các giao dịch hoàn tiền của hệ thống.
          </p>
        </div>

        <button
          onClick={() => navigate(isAdminOrManager ? '/admin/appointments' : '/receptionist/appointments')}
          className="px-5 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-teal-600/25 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Coins size={16} /> Thu Ngân Ngay
        </button>
      </div>

      <OverduePackagePanel invoices={overdueInvoices} onOpenDetail={(inv) => dashboard.setSelectedInvoice(inv)} />

      <FinanceKpiCards kpis={dashboard.kpis} />

      {/* Tabs + Filter + Bảng — bỏ sidebar dọc 1/4 cũ, nhường toàn bộ chiều rộng cho bảng dữ liệu */}
      <div className="space-y-5 text-left">
        <FinanceTabs
          activeTab={dashboard.activeTab}
          invoiceCount={dashboard.invoices.length}
          paymentCount={dashboard.payments.length}
          onChange={(tab) => {
            dashboard.setActiveTab(tab);
            dashboard.setStatusFilter('all');
          }}
        />

        <FinanceFilterBar
          activeTab={dashboard.activeTab}
          searchTerm={dashboard.searchTerm}
          onSearchChange={dashboard.setSearchTerm}
          statusFilter={dashboard.statusFilter}
          onStatusChange={dashboard.setStatusFilter}
          itemTypeFilter={dashboard.itemTypeFilter}
          onItemTypeChange={dashboard.setItemTypeFilter}
          methodFilter={dashboard.methodFilter}
          onMethodChange={dashboard.setMethodFilter}
          dateFilter={dashboard.dateFilter}
          onDateChange={dashboard.setDateFilter}
          startDate={dashboard.startDate}
          onStartDateChange={dashboard.setStartDate}
          endDate={dashboard.endDate}
          onEndDateChange={dashboard.setEndDate}
        />

        {dashboard.activeTab === 'invoices' ? (
          <InvoiceTable
            invoices={filteredInvoices}
            loading={dashboard.dashboardLoading}
            page={dashboard.page}
            pageSize={dashboard.pageSize}
            onPageChange={dashboard.setPage}
            onSelectInvoice={(inv) => dashboard.setSelectedInvoice(inv)}
          />
        ) : (
          <PaymentTable
            payments={filteredPayments}
            allPayments={dashboard.payments}
            invoices={dashboard.invoices}
            loading={dashboard.dashboardLoading}
            isAdminOrManager={isAdminOrManager}
            page={dashboard.page}
            pageSize={dashboard.pageSize}
            onPageChange={dashboard.setPage}
            onOpenRefund={(inv) => dashboard.setSelectedInvoice(inv)}
          />
        )}
      </div>

      {/* Invoice Detail Modal Overlay */}
      {dashboard.selectedInvoice && (
        <InvoiceDetailModal
          invoice={dashboard.selectedInvoice}
          payments={dashboard.payments}
          isAdminOrManager={isAdminOrManager}
          onClose={() => dashboard.setSelectedInvoice(null)}
          onPrint={handlePrint}
          onPrintTransaction={handlePrintTransaction}
          onOpenFastPay={(inv) => dashboard.setFastPayInvoice(inv)}
          onRefund={dashboard.handleRefund}
          onPackageRefund={dashboard.handlePackageRefund}
          onExpireNoRefund={dashboard.handleExpireNoRefund}
        />
      )}

      {/* Fast Payment Sub-Modal Pop-up */}
      {dashboard.fastPayInvoice && (
        <FastPaymentModal
          invoice={dashboard.fastPayInvoice}
          onClose={() => dashboard.setFastPayInvoice(null)}
          onSubmit={dashboard.handleFastPaySubmit}
          method={dashboard.fastPayMethod}
          setMethod={dashboard.setFastPayMethod}
          received={dashboard.fastPayReceived}
          setReceived={dashboard.setFastPayReceived}
          note={dashboard.fastPayNote}
          setNote={dashboard.setFastPayNote}
          loading={dashboard.fastPayLoading}
        />
      )}
      {checkout.activePayOSInvoice && (
        <QRWebhookModal
          hoaDonId={checkout.activePayOSInvoice.invoice.id}
          amount={checkout.activePayOSInvoice.amount}
          onClose={() => checkout.setActivePayOSInvoice(null)}
          onSuccess={(paidInvoice) => checkout.handlePayOSSuccess(paidInvoice)}
        />
      )}
      {dashboard.fastPayQRInvoice && (
        <QRWebhookModal
          hoaDonId={dashboard.fastPayQRInvoice.invoice.id}
          amount={dashboard.fastPayQRInvoice.amount}
          onClose={() => dashboard.setFastPayQRInvoice(null)}
          onSuccess={(paidInvoice) => dashboard.handleFastPayQRSuccess(paidInvoice)}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import {
  ArrowLeft,
  User,
  Coins,
  CalendarDays,
  DollarSign,
  Activity
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
import ReceiptBreakdown from './components/ReceiptBreakdown';
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
  const isCheckoutMode = !!queryLichDatId || (!!queryCustomerId && !!queryGoiDichVuId);

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

  const quickCashOptions = [200000, 500000, 1000000, 2000000, 5000000];

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
            <div class="logo">OFFICE CARE PHYSIOFLOW</div>
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
            <div class="logo">OFFICE CARE PHYSIOFLOW</div>
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

    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 font-jakarta">
        {/* Header Banner HUD Pro Max */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                QUẦY THU NGÂN & TÀI CHÍNH Y KHOA
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2.5">
              <Coins className="text-teal-600 dark:text-teal-400 size-7" />
              THU NGÂN & LẬP HÓA ĐƠN TRỊ LIỆU
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
              Thanh toán phí khám lâm sàng hoặc gói điều trị theo chỉ định chuyên môn của Bác sĩ.
            </p>
          </div>
          
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 z-10"
          >
            <ArrowLeft size={16} /> Quay lại trang trước
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Info & calculations */}
          <div className="lg:col-span-2 space-y-6">
            {checkout.selectedConsultation && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none p-6 space-y-4 text-left">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase">Bệnh nhân đang thanh toán</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Thông tin hồ sơ tiếp nhận tại quầy thu ngân</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs uppercase shrink-0">
                      {checkout.selectedConsultation.ten_khach_hang?.charAt(0) || 'K'}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Họ và tên bệnh nhân</p>
                      <p className="text-slate-900 dark:text-white font-extrabold text-sm truncate">{checkout.selectedConsultation.ten_khach_hang}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-700 dark:text-teal-300 font-black flex items-center justify-center text-xs shrink-0">
                      📞
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại liên hệ</p>
                      <p className="text-slate-900 dark:text-white font-black text-sm">{checkout.selectedConsultation.sdt_khach_hang}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Input controls form */}
            {(() => {
              const totalRequired = checkout.checkoutTab === 'package' && checkout.calculatedData
                ? (checkout.dangKyGoi && (checkout.loaiThanhToan === 'tra_gop' || checkout.loaiThanhToan === 'tung_buoi')
                  ? Number(checkout.calculatedData.so_tien_dot_1)
                  : Number(checkout.calculatedData.tong_tien_thanh_toan))
                : (checkout.state.hoaDon ? Number(checkout.state.hoaDon.tong_tien_thanh_toan) : 0);
              
              const isTungBuoiWithPaidExam = checkout.dangKyGoi &&
                checkout.loaiThanhToan === 'tung_buoi' &&
                checkout.selectedConsultation?.ngay_thanh_toan_kham;

              // Lịch hẹn đã tự mang sẵn dịch vụ/gói cụ thể (chỉ định từ bác sĩ HOẶC dịch vụ lẻ đặt
              // trực tiếp) — khóa dropdown, KHÔNG cho đổi sang gói khác trong lúc đang thanh toán
              // đúng 1 lịch hẹn cụ thể (đổi lung tung sẽ tạo hóa đơn/kích hoạt phác đồ sai lịch hẹn).
              const hasLockedTarget = !!checkout.selectedConsultation?.khuyen_nghi_goi_id ||
                !!checkout.selectedConsultation?.goi_dich_vu_id;

              return (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (totalRequired === 0) {
                      checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: '0' });
                    }
                    setShowConfirmModal(true);
                  }}
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-xl shadow-slate-200/30 dark:shadow-none font-jakarta"
                >
                  <div className="space-y-5 text-left">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                        <Activity size={18} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase">Bước 2: Thông tin giao dịch & Lập hóa đơn</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Lựa chọn hình thức thanh toán & nhận tiền từ bệnh nhân</p>
                      </div>
                    </div>

                    {checkout.selectedConsultation?.loai_lich === 'kham_moi' && checkout.selectedConsultation?.khuyen_nghi_goi_id && (
                      checkout.selectedConsultation.khuyen_nghi_loai_goi === 'LE' ? (
                        <div className="bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 shadow-xs space-y-1 animate-in fade-in duration-200">
                          <span className="text-xs font-extrabold text-sky-950 dark:text-sky-300 flex items-center gap-1.5">
                            <span>💡</span> Chỉ định dịch vụ lẻ tiếp theo
                          </span>
                          <span className="text-[11px] text-sky-800 dark:text-sky-400 font-bold block">
                            Dịch vụ: {checkout.selectedConsultation.khuyen_nghi_ten_goi || 'Dịch vụ lẻ'}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 block">Đăng ký mua gói trị liệu được chỉ định</span>
                            <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-bold block">Chỉ định: {checkout.selectedConsultation.khuyen_nghi_ten_goi || 'Gói trị liệu'}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={checkout.dangKyGoi} 
                              onChange={(e) => {
                                const checked = e.target.checked;
                                checkout.setDangKyGoi(checked);
                                checkout.setCheckoutTab('package');
                              }}
                              disabled={!!checkout.selectedConsultation?.ngay_thanh_toan_kham}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                          </label>
                        </div>
                      )
                    )}

                    {checkout.checkoutTab === 'package' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Select assigned medical package */}
                        {checkout.dangKyGoi && (
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
                              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
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

                        {/* Cảnh báo bất thường */}
                        {checkout.canhBaoLechCauHinh && (
                          <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-3 shadow-xs animate-in fade-in duration-200">
                            <div className="space-y-1">
                              <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                <span>⚠️</span> Gói đã được cấu hình lại sau khi bác sĩ chỉ định
                              </span>
                              <span className="text-[10.5px] text-amber-800 dark:text-amber-400 font-bold block leading-relaxed">
                                Bác sĩ tư vấn cho khách:{' '}
                                <span className="font-black">
                                  {checkout.canhBaoLechCauHinh.tu_van.tong_so_buoi} buổi ·{' '}
                                  {formatCurrency(checkout.canhBaoLechCauHinh.tu_van.don_gia)}
                                </span>
                                {' → '}
                                Cấu hình hiện tại:{' '}
                                <span className="font-black">
                                  {checkout.canhBaoLechCauHinh.hien_tai.tong_so_buoi} buổi ·{' '}
                                  {formatCurrency(checkout.canhBaoLechCauHinh.hien_tai.don_gia)}
                                </span>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                onClick={() => checkout.setGiuTheoTuVan(true)}
                                className={`py-2.5 px-3 rounded-xl border text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  checkout.giuTheoTuVan
                                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                                    : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
                                }`}
                              >
                                Giữ theo tư vấn ({checkout.canhBaoLechCauHinh.tu_van.tong_so_buoi} buổi)
                              </button>
                              <button
                                type="button"
                                onClick={() => checkout.setGiuTheoTuVan(false)}
                                className={`py-2.5 px-3 rounded-xl border text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  !checkout.giuTheoTuVan
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                    : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
                                }`}
                              >
                                Áp cấu hình mới ({checkout.canhBaoLechCauHinh.hien_tai.tong_so_buoi} buổi)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Payment type options */}
                        {checkout.dangKyGoi && checkout.selectedPackage?.loai_goi !== 'LE' && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hình thức thanh toán gói</label>
                              <div className="grid grid-cols-3 gap-3">
                                <button
                                  type="button"
                                  onClick={() => checkout.setLoaiThanhToan('tra_thang')}
                                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    checkout.loaiThanhToan === 'tra_thang'
                                      ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  Trả Thẳng (100%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => checkout.setLoaiThanhToan('tra_gop')}
                                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    checkout.loaiThanhToan === 'tra_gop'
                                      ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  Trả Góp 50%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => checkout.setLoaiThanhToan('tung_buoi')}
                                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    checkout.loaiThanhToan === 'tung_buoi'
                                      ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]'
                                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  Từng Buổi
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vouchers application form */}
                    {checkout.checkoutTab === 'package' && (
                      <VoucherPicker
                        appliedVoucher={checkout.appliedVoucher}
                        onApply={checkout.handleApplyVoucher}
                        onRemove={checkout.handleRemoveVoucher}
                        disabled={isTungBuoiWithPaidExam}
                        orderValue={Number(checkout.calculatedData?.gia_goc_goi || 0)}
                        loaiThanhToan={checkout.dangKyGoi ? checkout.loaiThanhToan : 'tra_thang'}
                        khachHangId={checkout.selectedConsultation?.khach_hang_id}
                      />
                    )}

                    {/* Payment method */}
                    <div className="space-y-1.5">
                      <label htmlFor="phuongThuc" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hình thức nhận tiền</label>
                      <select 
                        id="phuongThuc"
                        value={checkout.state.phuongThuc} 
                        onChange={(e) => checkout.dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: e.target.value })}
                        disabled={isTungBuoiWithPaidExam}
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
                      >
                        <option value="tien_mat">💵 Tiền mặt</option>
                        <option value="chuyen_khoan">🏦 Chuyển khoản ngân hàng (Quét mã VietQR tự động qua PayOS)</option>
                      </select>
                    </div>

                    {/* Cash payment specific fields */}
                    {checkout.state.phuongThuc === 'tien_mat' && totalRequired > 0 && (() => {
                      const received = Number(checkout.state.soTienNhan || 0);
                      const isShortage = received > 0 && received < totalRequired;

                      const currentQuickCashOptions = Array.from(new Set([totalRequired, ...quickCashOptions]))
                        .filter(val => val > 0)
                        .sort((a, b) => a - b);

                      return (
                        <div className="space-y-3 animate-in slide-in-from-top-3 duration-200">
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
                                  ? 'bg-rose-50/40 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                              }`}
                            />
                            {isShortage && (
                              <p className="text-[11px] text-rose-600 font-extrabold flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                                ⚠️ Còn thiếu {formatCurrency(totalRequired - received)} để hoàn thành thanh toán
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {currentQuickCashOptions.map(val => {
                              const isActive = val === received;
                              const isExact = val === totalRequired;
                              
                              let btnStyle = '';
                              if (isActive) {
                                btnStyle = 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20 scale-105';
                              } else if (isExact) {
                                btnStyle = 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white';
                              } else {
                                btnStyle = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-600 hover:text-white';
                              }

                              return (
                                <button 
                                  key={val} 
                                  type="button"
                                  onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: val.toString() })}
                                  className={`px-4 py-2.5 rounded-full text-xs font-black transition-all border cursor-pointer ${btnStyle}`}
                                >
                                  {formatCurrency(val)}
                                  {isExact && !isActive && <span className="text-[9px] font-bold ml-1 opacity-80">(Cần thu)</span>}
                                </button>
                              );
                            })}
                          </div>

                          {received > totalRequired && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-xs font-extrabold flex justify-between items-center shadow-xs">
                              <span>Tiền thừa thối lại khách hàng:</span>
                              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(received - totalRequired)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Friendly message if totalRequired is 0 */}
                    {isTungBuoiWithPaidExam && (
                      <div className="bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4.5 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-2 animate-in fade-in duration-200 border-dashed">
                        <p className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-200 font-black">
                          <span>✓</span> Đã thanh toán khám ngày {(() => {
                            const dateRaw = checkout.selectedConsultation?.ngay_thanh_toan_kham;
                            if (!dateRaw) return '';
                            try {
                              const d = new Date(dateRaw);
                              if (isNaN(d.getTime())) return dateRaw;
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              const hours = String(d.getHours()).padStart(2, '0');
                              const minutes = String(d.getMinutes()).padStart(2, '0');
                              return `${day}/${month}/${year} (${hours}:${minutes})`;
                            } catch (e) {
                              return dateRaw;
                            }
                          })()}
                        </p>
                        <p className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-200 font-black">
                          <span>✓</span> Đã chọn phương thức thanh toán từng buổi.
                        </p>
                        <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed font-semibold">
                          💵 Khách hàng không cần thanh toán thêm tại quầy hôm nay. Phác đồ sẽ được kích hoạt ngay lập tức.
                        </p>
                      </div>
                    )}

                    {/* Reason / Note input */}
                    <div className="space-y-1.5">
                      <label htmlFor="feedbackLyDo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ghi chú nội bộ phòng khám</label>
                      <textarea 
                        id="feedbackLyDo"
                        placeholder="Ghi nhận phản hồi..."
                        rows={2.5}
                        value={checkout.feedbackLyDo}
                        onChange={(e) => checkout.setFeedbackLyDo(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={checkout.state.loading || (checkout.checkoutTab === 'package' ? (checkout.calculating || !checkout.calculatedData) : !checkout.state.hoaDon)}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {checkout.state.loading ? 'Đang xử lý...' : (totalRequired === 0 ? 'Kích hoạt phác đồ & Đặt lịch' : 'Xác Nhận & Thu Tiền')}
                  </button>
                </form>
              );
            })()}
          </div>

          {/* Right panel: Live breakdown receipt */}
          <div className="lg:col-span-1 space-y-6">
            <ReceiptBreakdown
              checkoutTab={checkout.checkoutTab}
              hoaDon={checkout.state.hoaDon}
              dangKyGoi={checkout.dangKyGoi}
              selectedPackage={checkout.selectedPackage}
              calculatedData={checkout.calculatedData}
              loaiThanhToan={checkout.loaiThanhToan}
            />
          </div>
        </div>

        {(() => {
          const totalRequired = checkout.checkoutTab === 'package' && checkout.calculatedData
            ? (checkout.dangKyGoi && (checkout.loaiThanhToan === 'tra_gop' || checkout.loaiThanhToan === 'tung_buoi')
              ? Number(checkout.calculatedData.so_tien_dot_1)
              : Number(checkout.calculatedData.tong_tien_thanh_toan))
            : (checkout.state.hoaDon ? Number(checkout.state.hoaDon.tong_tien_thanh_toan) : 0);

          const received = Number(checkout.state.soTienNhan || 0);

          return (
            <>
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
                changeAmount={received > totalRequired ? (received - totalRequired) : 0}
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
            </>
          );
        })()}
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
    </div>
  );
}

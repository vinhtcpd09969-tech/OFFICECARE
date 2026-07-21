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
import { formatCurrency } from '../../../../shared/utils';

// Hooks
import { useCheckout } from './hooks/useCheckout';
import { useFinanceDashboard } from './hooks/useFinanceDashboard';
import type { Invoice } from './hooks/useFinanceDashboard';

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
              <strong>Trạng thái:</strong> ${inv.trang_thai.toUpperCase().replace(/_/g, ' ')}
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
            <div style="color: #10b981; margin-top: 5px;">Số tiền đã đóng: ${formatCurrency(Number(inv.da_thanh_toan))}</div>
            <div style="color: #f59e0b; margin-top: 5px;">Còn nợ lại: ${formatCurrency(Math.max(0, Number(inv.tong_tien_thanh_toan) - Number(inv.da_thanh_toan)))}</div>
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
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-150/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">
              Quầy Thu Ngân & Tài Chính
            </span>
            <h2 className="text-2xl font-black text-secondary flex items-center gap-2.5">
              <Coins className="text-primary" size={28} />
              Thu Ngân & Lập Hóa Đơn Trị Liệu
            </h2>
            <p className="text-zinc-500 text-xs font-semibold">Thanh toán phí khám lâm sàng hoặc gói điều trị theo chỉ định của Bác sĩ.</p>
          </div>
          
          <button
            onClick={() => navigate(baseFinanceRoute)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-primary transition-all text-xs font-bold uppercase tracking-wider z-10 relative"
          >
            <ArrowLeft size={16} /> Quay lại Tài chính
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Info & calculations */}
          <div className="lg:col-span-2 space-y-6">
            {checkout.selectedConsultation && (
              <div className="bg-white rounded-3xl border border-zinc-150 shadow-sm p-6 space-y-5 text-left">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <User className="text-primary size-5" />
                  <h3 className="font-heading font-black text-secondary text-sm">Bệnh nhân đang thanh toán</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-zinc-650">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Họ và tên</p>
                    <p className="text-secondary font-black text-sm">{checkout.selectedConsultation.ten_khach_hang}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Số điện thoại</p>
                    <p className="text-secondary font-bold text-sm">{checkout.selectedConsultation.sdt_khach_hang}</p>
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
                  className="bg-white rounded-2xl border border-zinc-150 p-6 space-y-6 shadow-sm"
                >
                  <div className="space-y-5 text-left">
                    <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                      <Activity className="text-primary size-5" />
                      <h3 className="font-heading font-black text-secondary text-sm">Bước 2: Thông tin giao dịch & Lập hóa đơn</h3>
                    </div>

                    {checkout.selectedConsultation?.loai_lich === 'kham_moi' && checkout.selectedConsultation?.khuyen_nghi_goi_id && (
                      checkout.selectedConsultation.khuyen_nghi_loai_goi === 'LE' ? (
                        <div className="bg-blue-50/40 border border-blue-200/30 rounded-2xl p-4 shadow-sm space-y-1 animate-in fade-in duration-200">
                          <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                            <span>💡</span> Chỉ định dịch vụ lẻ tiếp theo
                          </span>
                          <span className="text-[10.5px] text-blue-800 font-bold block">
                            Dịch vụ: {checkout.selectedConsultation.khuyen_nghi_ten_goi || 'Dịch vụ lẻ'}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/50 border border-emerald-200/40 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-black text-emerald-950 block">Đăng ký mua gói trị liệu được chỉ định</span>
                            <span className="text-[10px] text-emerald-800 font-bold block">Chỉ định: {checkout.selectedConsultation.khuyen_nghi_ten_goi || 'Gói trị liệu'}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={checkout.dangKyGoi} 
                              onChange={(e) => {
                                const checked = e.target.checked;
                                checkout.setDangKyGoi(checked);
                                // Luôn ở tab 'package' dù có đăng ký gói hay không — tab 'single' là
                                // luồng tạo hóa đơn ngay, không có chỗ áp mã giảm giá.
                                checkout.setCheckoutTab('package');
                              }}
                              // Chỉ khóa khi phí khám ĐÃ thu riêng từ trước (khách về nhà, quay lại
                              // kích hoạt sau — ngay_thanh_toan_kham có giá trị): lúc này không còn
                              // gì để thu nếu tắt gói (0đ), tắt đi sẽ để gói treo "chờ kích hoạt" mãi
                              // mà lễ tân tưởng đã xử lý xong. Nếu phí khám CHƯA thu (đang xử lý
                              // ngay tại quầy cùng lúc với ca khám) thì vẫn cho tắt bình thường —
                              // khách có thể chỉ muốn thanh toán khám, chưa quyết định mua liệu trình.
                              disabled={!!checkout.selectedConsultation?.ngay_thanh_toan_kham}

                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      )
                    )}

                    {checkout.checkoutTab === 'package' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Select assigned medical package (chỉ khi có đăng ký gói — khám thường không chọn gói) */}
                        {checkout.dangKyGoi && (
                          <div className="space-y-1.5">
                            <label htmlFor="selectedPackage" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
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
                              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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

                        {/* Cảnh báo bất thường: admin sửa cấu hình gói SAU khi bác sĩ đã chỉ định.
                            Chỉ hiện khi thực sự lệch — ca bình thường không thấy gì. */}
                        {checkout.canhBaoLechCauHinh && (
                          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in duration-200">
                            <div className="space-y-1">
                              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                                <span>⚠️</span> Gói đã được cấu hình lại sau khi bác sĩ chỉ định
                              </span>
                              <span className="text-[10.5px] text-amber-800 font-bold block leading-relaxed">
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
                                className={`py-2.5 px-3 rounded-xl border text-[10.5px] font-black uppercase tracking-wider transition-all ${
                                  checkout.giuTheoTuVan
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                    : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
                                }`}
                              >
                                Giữ theo tư vấn ({checkout.canhBaoLechCauHinh.tu_van.tong_so_buoi} buổi)
                              </button>
                              <button
                                type="button"
                                onClick={() => checkout.setGiuTheoTuVan(false)}
                                className={`py-2.5 px-3 rounded-xl border text-[10.5px] font-black uppercase tracking-wider transition-all ${
                                  !checkout.giuTheoTuVan
                                    ? 'bg-secondary border-secondary text-white shadow-sm'
                                    : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
                                }`}
                              >
                                Áp cấu hình mới ({checkout.canhBaoLechCauHinh.hien_tai.tong_so_buoi} buổi)
                              </button>
                            </div>

                            <p className="text-[10px] text-amber-800 leading-relaxed font-semibold border-t border-amber-200/70 pt-2">
                              📢 Mặc định giữ đúng liệu trình + giá bác sĩ đã tư vấn cho khách. Chỉ áp cấu hình mới
                              nếu gói cũ bị cấu hình sai — và nhớ trao đổi lại với khách trước khi thu tiền.
                            </p>
                          </div>
                        )}

                        {/* Payment type options (chỉ khi có đăng ký gói) */}
                        {checkout.dangKyGoi && checkout.selectedPackage?.loai_goi !== 'LE' && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hình thức thanh toán gói</label>
                              <div className="grid grid-cols-3 gap-3">
                                <button
                                  type="button"
                                  onClick={() => checkout.setLoaiThanhToan('tra_thang')}
                                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                                    checkout.loaiThanhToan === 'tra_thang'
                                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                      : 'bg-zinc-50/50 border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                                  }`}
                                >
                                  Trả thẳng
                                </button>
                                <button
                                  type="button"
                                  onClick={() => checkout.setLoaiThanhToan('tra_gop')}
                                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                                    checkout.loaiThanhToan === 'tra_gop'
                                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                      : 'bg-zinc-50/50 border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                                  }`}
                                >
                                  Trả góp 50%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => checkout.setLoaiThanhToan('tung_buoi')}
                                  className={`py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                                    checkout.loaiThanhToan === 'tung_buoi'
                                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                      : 'bg-zinc-50/50 border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                                  }`}
                                >
                                  Từng buổi
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
                      <label htmlFor="phuongThuc" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hình thức nhận tiền</label>
                      <select 
                        id="phuongThuc"
                        value={checkout.state.phuongThuc} 
                        onChange={(e) => checkout.dispatch({ type: 'SET_FIELD', field: 'phuongThuc', value: e.target.value })}
                        disabled={isTungBuoiWithPaidExam}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="tien_mat">💵 Tiền mặt</option>
                        <option value="chuyen_khoan">🏦 Chuyển khoản ngân hàng</option>
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
                            <label htmlFor="soTienNhan" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Số tiền khách đưa (VND) *</label>
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
                              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all outline-none ${
                                isShortage 
                                  ? 'bg-rose-50/20 border-rose-350 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                  : 'bg-zinc-50 border-zinc-200 text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'
                              }`}
                            />
                            {isShortage && (
                              <p className="text-[10.5px] text-rose-600 font-extrabold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                ⚠️ Còn thiếu {formatCurrency(totalRequired - received)} để hoàn thành thanh toán
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {currentQuickCashOptions.map(val => {
                              const isActive = val === received;
                              const isExact = val === totalRequired;
                              
                              let btnStyle = '';
                              if (isActive) {
                                btnStyle = 'bg-primary border-primary text-white shadow-sm scale-105';
                              } else if (isExact) {
                                btnStyle = 'bg-primary/5 border-primary/50 text-primary hover:bg-primary hover:text-white';
                              } else {
                                btnStyle = 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-primary hover:text-white';
                              }

                              return (
                                <button 
                                  key={val} 
                                  type="button"
                                  onClick={() => checkout.dispatch({ type: 'SET_FIELD', field: 'soTienNhan', value: val.toString() })}
                                  className={`px-3.5 py-2 rounded-full text-[10px] font-black transition-all border ${btnStyle}`}
                                >
                                  {formatCurrency(val)}
                                  {isExact && !isActive && <span className="text-[8px] font-bold ml-1 opacity-80">(Cần thu)</span>}
                                </button>
                              );
                            })}
                          </div>

                          {received > totalRequired && (
                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/40 rounded-2xl p-4 text-xs font-bold flex justify-between items-center">
                              <span>Tiền thừa thối khách hàng:</span>
                              <span className="text-base font-black">{formatCurrency(received - totalRequired)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Friendly message if totalRequired is 0 (Tung buoi with paid exam) */}
                    {isTungBuoiWithPaidExam && (
                      <div className="bg-emerald-50/65 border border-emerald-200/80 p-4.5 rounded-2xl text-xs font-bold text-emerald-800 space-y-2 animate-in fade-in duration-200 border-dashed">
                        <p className="flex items-center gap-1.5 text-emerald-950 font-black">
                          <span>✓</span> Đã thanh toán khám ngày {checkout.selectedConsultation?.ngay_thanh_toan_kham}
                        </p>
                        <p className="flex items-center gap-1.5 text-emerald-950 font-black">
                          <span>✓</span> Đã chọn phương thức thanh toán từng buổi.
                        </p>
                        <p className="text-emerald-900 leading-relaxed font-semibold">
                          💵 Khách hàng không cần thanh toán thêm tại quầy hôm nay. Phác đồ sẽ được kích hoạt ngay lập tức. Số tiền thanh toán mỗi buổi thực tế sau này là: <span className="text-emerald-950 font-black">{formatCurrency(Number(checkout.calculatedData?.don_gia_theo_buoi || 0))}/buổi</span> (bắt đầu từ buổi số 1).
                        </p>
                      </div>
                    )}

                    {/* Reason / Note input */}
                    <div className="space-y-1.5">
                      <label htmlFor="feedbackLyDo" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ghi chú nội bộ phòng khám</label>
                      <textarea 
                        id="feedbackLyDo"
                        placeholder="Ghi nhận phản hồi..."
                        rows={2.5}
                        value={checkout.feedbackLyDo}
                        onChange={(e) => checkout.setFeedbackLyDo(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={checkout.state.loading || (checkout.checkoutTab === 'package' ? (checkout.calculating || !checkout.calculatedData) : !checkout.state.hoaDon)}
                    className="w-full py-4 bg-primary hover:bg-primary/95 text-white shadow-md hover:shadow-lg font-black text-xs uppercase tracking-wider rounded-2xl transition-all disabled:opacity-45 disabled:pointer-events-none"
                  >
                    {checkout.state.loading ? 'Đang xử lý...' : (totalRequired === 0 ? 'Kích hoạt phác đồ & Đặt lịch' : 'Xác nhận & Thu tiền')}
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-zinc-150/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full pointer-events-none"></div>
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Phân hệ Kế toán lâm sàng
          </span>
          <h1 className="text-2xl font-black text-secondary tracking-tight flex items-center gap-2">
            <DollarSign className="text-primary size-7" />
            Quản Lý Tài Chính & Hóa Đơn Y Khoa
          </h1>
          <p className="text-zinc-500 text-xs font-semibold">
            Theo dõi dòng tiền, hóa đơn khám/gói trị liệu và xử lý các giao dịch hoàn tiền của hệ thống.
          </p>
        </div>

        <button
          onClick={() => navigate(isAdminOrManager ? '/admin/appointments' : '/receptionist/appointments')}
          className="px-5 py-3.5 bg-primary hover:opacity-95 active:scale-[0.98] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <CalendarDays size={16} /> Lập lịch thanh toán
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

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import { 
  Search, 
  ArrowLeft, 
  User, 
  Coins, 
  Receipt, 
  ChevronRight, 
  Filter, 
  RotateCcw, 
  Clock, 
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
import ReceiptBreakdown from './components/ReceiptBreakdown';
import PaymentSuccessBox from './components/PaymentSuccessBox';
import ConfirmPaymentModal from './components/ConfirmPaymentModal';

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
  const isCheckoutMode = !!queryLichDatId || (!!queryCustomerId && !!queryGoiDichVuId);

  // Hooks
  const checkout = useCheckout(queryLichDatId, isCheckoutMode, queryCustomerId, queryGoiDichVuId);
  const dashboard = useFinanceDashboard(isCheckoutMode);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
    if (checkout.dangKyGoi) {
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
              const totalRequired = checkout.dangKyGoi && checkout.calculatedData
                ? (checkout.loaiThanhToan === 'tra_gop' || checkout.loaiThanhToan === 'tung_buoi'
                  ? Number(checkout.calculatedData.so_tien_dot_1)
                  : Number(checkout.calculatedData.tong_tien_thanh_toan))
                : (checkout.state.hoaDon ? Number(checkout.state.hoaDon.tong_tien_thanh_toan) : 0);
              
              const isTungBuoiWithPaidExam = checkout.dangKyGoi && 
                checkout.loaiThanhToan === 'tung_buoi' && 
                checkout.selectedConsultation?.ngay_thanh_toan_kham;

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
                            Dịch vụ: {checkout.selectedConsultation.khuyen_nghi_ten_goi || 'Dịch vụ lẻ'} (Khách hàng sẽ thanh toán sau khi thực hiện dịch vụ)
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
                                checkout.setCheckoutTab(checked ? 'package' : 'single');
                              }}
                              disabled={isTungBuoiWithPaidExam}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      )
                    )}

                    {checkout.checkoutTab === 'package' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Select assigned medical package */}
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
                            disabled={!!checkout.selectedConsultation?.khuyen_nghi_goi_id || isTungBuoiWithPaidExam}
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

                        {/* Payment type options */}
                        {checkout.selectedPackage?.loai_goi !== 'LE' && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hình thức thanh toán gói</label>
                              <div className="grid grid-cols-3 gap-3">
                                <button
                                  type="button"
                                  onClick={() => checkout.setLoaiThanhToan('tra_thang')}
                                  disabled={isTungBuoiWithPaidExam}
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
                                  disabled={isTungBuoiWithPaidExam}
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
                                  disabled={isTungBuoiWithPaidExam}
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

                            {['tra_thang', 'tra_gop'].includes(checkout.loaiThanhToan) && (
                              <div className="space-y-1.5 animate-in fade-in duration-200 text-left">
                                <label htmlFor="durationDays" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                  Hạn sử dụng gói (ngày) *
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    id="durationDays"
                                    min="1"
                                    value={checkout.durationDays}
                                    onChange={(e) => checkout.setDurationDays(Math.max(1, Number(e.target.value)))}
                                    className="w-full pl-4 pr-32 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    required
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                                    ngày kể từ ngày kích hoạt
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vouchers application form */}
                    {checkout.checkoutTab === 'package' && (
                      <div className="space-y-2">
                        <label htmlFor="maVoucher" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mã giảm giá (Voucher)</label>
                        <div className="flex gap-2">
                          <input 
                            id="maVoucher"
                            type="text"
                            placeholder="VD: MAGIAMGIA10"
                            value={checkout.maVoucher}
                            onChange={(e) => checkout.setMaVoucher(e.target.value)}
                            disabled={!!checkout.appliedVoucher || isTungBuoiWithPaidExam}
                            className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:bg-zinc-100 disabled:text-zinc-400"
                          />
                          {checkout.appliedVoucher ? (
                            <button
                              type="button"
                              onClick={checkout.handleRemoveVoucher}
                              disabled={isTungBuoiWithPaidExam}
                              className="px-5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={checkout.handleApplyVoucher}
                              disabled={isTungBuoiWithPaidExam}
                              className="px-5 bg-zinc-150 hover:bg-zinc-200 text-zinc-650 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border border-zinc-200 disabled:opacity-50"
                            >
                              Áp dụng
                            </button>
                          )}
                        </div>
                        {checkout.appliedVoucher && (
                          <p className="text-[10.5px] font-bold text-emerald-600 animate-in fade-in duration-200">
                            ✓ Đã áp dụng Voucher: Giảm {checkout.appliedVoucher.gia_tri_giam}% (Tối đa {formatCurrency(checkout.appliedVoucher.giam_toi_da)})
                          </p>
                        )}
                      </div>
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
                        <option value="the">💳 Quẹt thẻ POS</option>
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
                    disabled={checkout.state.loading || (checkout.dangKyGoi ? checkout.calculating : !checkout.state.hoaDon)}
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
          const totalRequired = checkout.dangKyGoi && checkout.calculatedData
            ? (checkout.loaiThanhToan === 'tra_gop' || checkout.loaiThanhToan === 'tung_buoi'
              ? Number(checkout.calculatedData.so_tien_dot_1)
              : Number(checkout.calculatedData.tong_tien_thanh_toan))
            : (checkout.state.hoaDon ? Number(checkout.state.hoaDon.tong_tien_thanh_toan) : 0);

          const received = Number(checkout.state.soTienNhan || 0);

          return (
            <ConfirmPaymentModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={handleConfirmSubmit}
              patientName={checkout.selectedConsultation?.ten_khach_hang || ''}
              itemName={
                checkout.dangKyGoi
                  ? (checkout.selectedPackage?.ten_goi || 'Gói trị liệu')
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
          );
        })()}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER FINANCE DASHBOARD
  // ----------------------------------------------------
  const filteredInvoices = dashboard.getFilteredInvoices();
  const filteredPayments = dashboard.payments.filter((pay) => {
    const query = dashboard.searchTerm.toLowerCase();
    const matchesSearch =
      (pay.ma_giao_dich?.toLowerCase() || '').includes(query) ||
      (pay.ma_hoa_don?.toLowerCase() || '').includes(query) ||
      (pay.ten_khach_hang?.toLowerCase() || '').includes(query);
    if (!matchesSearch) return false;

    if (dashboard.statusFilter !== 'all' && pay.trang_thai !== dashboard.statusFilter) return false;

    if (dashboard.methodFilter !== 'all' && pay.phuong_thuc !== dashboard.methodFilter) return false;

    if (dashboard.dateFilter !== 'all') {
      const date = new Date(pay.thoi_gian_giao_dich);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dashboard.dateFilter === 'today') {
        if (date < today) return false;
      } else if (dashboard.dateFilter === '7days') {
        const limit = new Date(today);
        limit.setDate(limit.getDate() - 7);
        if (date < limit) return false;
      } else if (dashboard.dateFilter === 'thisMonth') {
        if (date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear()) return false;
      }
    }

    return true;
  });

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

      {/* Stats Cards Workspace */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-zinc-150 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] duration-200 text-left flex items-start gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-inner">
            <Coins size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Doanh thu thực tế (Đã thu)</span>
            <h3 className="text-xl font-black text-secondary mt-1">
              {formatCurrency(dashboard.invoices.reduce((acc, inv) => acc + Number(inv.da_thanh_toan || 0), 0))}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-zinc-150 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] duration-200 text-left flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-inner">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Đang chờ thanh toán</span>
            <h3 className="text-xl font-black text-secondary mt-1">
              {formatCurrency(dashboard.invoices.reduce((acc, inv) => acc + (inv.trang_thai === 'chua_thanh_toan' ? Number(inv.tong_tien_thanh_toan || 0) : 0), 0))}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-zinc-150 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] duration-200 text-left flex items-start gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-inner">
            <RotateCcw size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Đã hoàn tiền (Hoàn trả)</span>
            <h3 className="text-xl font-black text-secondary mt-1">
              {formatCurrency(dashboard.payments.filter(p => p.loai_giao_dich === 'HOAN_TIEN').reduce((acc, p) => acc + Math.abs(Number(p.so_tien || 0)), 0))}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-zinc-150 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] duration-200 text-left flex items-start gap-4">
          <div className="p-3 bg-zinc-100 text-zinc-500 rounded-2xl shadow-inner">
            <Receipt size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Tổng số hóa đơn y khoa</span>
            <h3 className="text-xl font-black text-secondary mt-1">
              {dashboard.invoices.length} HĐ
            </h3>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column: Navigation Tabs */}
        <div className="lg:w-1/4 space-y-6 text-left">
          <div className="bg-white p-2.5 rounded-2xl border border-zinc-150 shadow-sm space-y-1">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider px-3.5 block mb-1">Lựa chọn phân mục</span>
            <button
              onClick={() => {
                dashboard.setActiveTab('invoices');
                dashboard.setStatusFilter('all');
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between ${
                dashboard.activeTab === 'invoices' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              <span>🧾 Danh sách Hóa đơn</span>
              <ChevronRight size={14} className={dashboard.activeTab === 'invoices' ? 'text-primary' : 'text-zinc-350'} />
            </button>
            <button
              onClick={() => {
                dashboard.setActiveTab('payments');
                dashboard.setStatusFilter('all');
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between ${
                dashboard.activeTab === 'payments' ? 'bg-primary/10 text-primary' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              <span>🏦 Lịch sử giao dịch</span>
              <ChevronRight size={14} className={dashboard.activeTab === 'payments' ? 'text-primary' : 'text-zinc-350'} />
            </button>
          </div>
        </div>

        {/* Right column: Filters and Interactive Table */}
        <div className="lg:w-3/4 space-y-6 text-left">
          {/* Advanced Filter Pane */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Filter className="text-primary size-4" />
              <h3 className="font-heading font-black text-secondary text-xs uppercase tracking-wider">Bộ lọc tài chính nâng cao</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Tìm kiếm</label>
                <div className="relative">
                  <Search className="size-4.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Mã HĐ, Mã giao dịch, tên khách hàng..."
                    value={dashboard.searchTerm}
                    onChange={(e) => dashboard.setSearchTerm(e.target.value)}
                    className="pl-9 w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary transition-all text-xs font-semibold text-secondary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Trạng thái</label>
                <select
                  value={dashboard.statusFilter}
                  onChange={(e) => dashboard.setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                >
                  <option value="all">Tất cả trạng thái</option>
                  {dashboard.activeTab === 'invoices' ? (
                    <>
                      <option value="da_thanh_toan">Đã thanh toán</option>
                      <option value="chua_thanh_toan">Chưa thanh toán</option>
                    </>
                  ) : (
                    <>
                      <option value="thanh_cong">Thành công</option>
                      <option value="da_hoan_tien">Đã hoàn tiền</option>
                    </>
                  )}
                </select>
              </div>

              {dashboard.activeTab === 'invoices' ? (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Loại hóa đơn</label>
                  <select
                    value={dashboard.itemTypeFilter}
                    onChange={(e) => dashboard.setItemTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  >
                    <option value="all">Tất cả danh mục</option>
                    <option value="goi">Gói điều trị</option>
                    <option value="kham_lam_sang">Khám lâm sàng</option>
                    <option value="buoi_le">Buổi trị liệu lẻ</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Phương thức</label>
                  <select
                    value={dashboard.methodFilter}
                    onChange={(e) => dashboard.setMethodFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  >
                    <option value="all">Tất cả phương thức</option>
                    <option value="tien_mat">Tiền mặt</option>
                    <option value="chuyen_khoan">Chuyển khoản</option>
                    <option value="the">Thẻ / POS</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Thời gian tạo</label>
                <select
                  value={dashboard.dateFilter}
                  onChange={(e) => dashboard.setDateFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="7days">7 ngày qua</option>
                  <option value="thisMonth">Tháng này</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data List table card */}
          <div className="bg-white rounded-3xl border border-zinc-150 shadow-sm overflow-hidden text-left">
            {dashboard.dashboardLoading ? (
              <div className="py-24 text-center space-y-3">
                <div className="size-10 rounded-full border-4 border-t-primary border-zinc-200 animate-spin mx-auto" />
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Đang tải dữ liệu tài chính...</p>
              </div>
            ) : dashboard.activeTab === 'invoices' ? (
              filteredInvoices.length === 0 ? (
                <div className="py-20 text-center text-zinc-400 text-xs italic">
                  Không tìm thấy hóa đơn nào khớp với bộ lọc.
                </div>
              ) : (
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
                      {filteredInvoices.map((inv) => (
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
                              onClick={() => dashboard.setSelectedInvoice(inv)}
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
              )
            ) : (
              filteredPayments.length === 0 ? (
                <div className="py-20 text-center text-zinc-400 text-xs italic">
                  Chưa ghi nhận giao dịch thanh toán nào khớp bộ lọc.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500">
                      <tr>
                        <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Mã GD</th>
                        <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Mã hóa đơn</th>
                        <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Khách hàng</th>
                        <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Số tiền</th>
                        <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Phương thức</th>
                        <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider">Trạng thái</th>
                        {isAdminOrManager && <th className="px-6 py-4.5 text-[10px] font-black uppercase tracking-wider text-right">Hành động</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-zinc-50/60 hover:scale-[1.002] transition-all duration-150">
                          <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{pay.ma_giao_dich}</td>
                          <td className="px-6 py-4 font-mono font-black text-secondary text-xs">{pay.ma_hoa_don}</td>
                          <td className="px-6 py-4 text-xs font-bold text-secondary">{pay.ten_khach_hang}</td>
                          <td className="px-6 py-4 font-black text-secondary text-xs">{formatCurrency(pay.so_tien)}</td>
                          <td className="px-6 py-4 text-xs text-secondary capitalize font-bold">
                            {pay.phuong_thuc === 'tien_mat' ? '💵 Tiền mặt' : pay.phuong_thuc === 'chuyen_khoan' ? '🏦 Chuyển khoản' : '💳 Thẻ / POS'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusBadge(pay.trang_thai)}`}>
                              {(pay.trang_thai || '').replace(/_/g, ' ')}
                            </span>
                          </td>
                          {isAdminOrManager && (
                            <td className="px-6 py-4 text-right">
                              {pay.trang_thai === 'thanh_cong' ? (
                                <button
                                  onClick={() => dashboard.handleRefund(pay.id)}
                                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-rose-500 transition-all border border-rose-150/70"
                                >
                                  Hoàn tiền
                                </button>
                              ) : (
                                <span className="text-[10px] text-zinc-400 font-semibold italic">Đã hoàn trả</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
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
    </div>
  );
}
export { getStatusBadge };

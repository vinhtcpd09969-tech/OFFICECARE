import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../../stores/authStore';
import {
  ArrowLeft,
  Coins,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../../../../utils/format';
import { generateInvoiceHtml, generateTransactionReceiptHtml } from '../../../../utils/invoicePrinter';

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

    printWindow.document.write(generateInvoiceHtml(inv));
    printWindow.document.close();
  };

  // In biên nhận cho ĐÚNG 1 giao dịch (không phải cả hóa đơn)
  const handlePrintTransaction = (inv: Invoice, pay: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(generateTransactionReceiptHtml(inv, pay));
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

    const fallbackBasePrice = Number((checkout.selectedPackage as any)?.don_gia || checkout.selectedPackage?.gia_ban || checkout.selectedConsultation?.don_gia_dich_vu || 0);

    const totalRequired = checkout.checkoutTab === 'package'
      ? (checkout.calculatedData
        ? (checkout.dangKyGoi && checkout.loaiThanhToan === 'tung_buoi'
          ? Number(checkout.calculatedData.so_tien_dot_1 || 0)
          : Number(checkout.calculatedData.tong_tien_thanh_toan || 0))
        : (checkout.dangKyGoi && checkout.loaiThanhToan === 'tung_buoi'
          ? 0
          : fallbackBasePrice))
      : (checkout.state.hoaDon ? Number(checkout.state.hoaDon.tong_tien_thanh_toan) : fallbackBasePrice);

    const received = Number(checkout.state.soTienNhan || 0);
    const isShortage = checkout.state.phuongThuc === 'tien_mat' && totalRequired > 0 && received > 0 && received < totalRequired;
    const changeAmount = checkout.state.phuongThuc === 'tien_mat' && received > totalRequired ? (received - totalRequired) : 0;

    const quickCashOptions = Array.from(new Set([totalRequired, 200000, 500000, 1000000, 2000000, 5000000]))
      .filter(val => val > 0)
      .sort((a, b) => a - b);

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
                  {(() => {
                    const loaiLich = String(checkout.selectedConsultation.loai_lich || '').toUpperCase();
                    const loaiGoi = String(checkout.selectedConsultation.loai_goi || checkout.selectedPackage?.loai_goi || '').toUpperCase();
                    if (loaiLich === 'KHAM_MOI' || loaiLich === 'KHAM') return 'Lượng giá PHCN';
                    if (loaiLich === 'TAI_KHAM') return 'Lượng giá bổ sung';
                    if (loaiLich.includes('LE') || loaiLich === 'DICH_VU_LE' || loaiLich === 'DICH_VU_DON' || loaiGoi === 'LE') return 'Dịch vụ lẻ';
                    return 'Trị liệu phác đồ';
                  })()}
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
                        disabled={hasLockedTarget}
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
                <VoucherPicker
                  appliedVoucher={checkout.appliedVoucher}
                  onApply={checkout.handleApplyVoucher}
                  onRemove={checkout.handleRemoveVoucher}
                  disabled={false}
                  orderValue={Number(
                    checkout.calculatedData?.gia_goc_goi ||
                    checkout.calculatedData?.gia_goc ||
                    (checkout.selectedPackage as any)?.don_gia ||
                    checkout.selectedPackage?.gia_goi ||
                    checkout.selectedConsultation?.don_gia_dich_vu ||
                    checkout.packages.find((p: any) => p.loai_goi === 'KHAM')?.don_gia ||
                    0
                  )}
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
                <label htmlFor="feedbackLyDo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ghi chú nội bộ</label>
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
                : (checkout.calculatedData?.ten_item || 'Phí lượng giá'))
              : (checkout.state.hoaDon?.ten_dich_vu || 'Phí lượng giá/Buổi trị liệu')
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
      {/* KPI Metrics Strip */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Tổng quan dòng tiền & Doanh thu
            </span>
          </div>

          <button
            onClick={() => navigate(isAdminOrManager ? '/admin/appointments' : '/receptionist/appointments')}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Coins size={15} /> Thu Ngân Ngay
          </button>
        </div>

        <FinanceKpiCards kpis={dashboard.kpis} />
      </div>

      <OverduePackagePanel invoices={overdueInvoices} onOpenDetail={(inv) => dashboard.setSelectedInvoice(inv)} />

      {/* Tabs + Filter + Bảng (Gộp Tabs và Filter vào 1 card duy nhất với tabs full width 50/50) */}
      <div className="space-y-5 text-left">
        <FinanceFilterBar
          activeTab={dashboard.activeTab}
          onTabChange={(tab) => {
            dashboard.setActiveTab(tab);
            dashboard.setStatusFilter('all');
          }}
          invoiceCount={dashboard.invoices.length}
          paymentCount={dashboard.payments.length}
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

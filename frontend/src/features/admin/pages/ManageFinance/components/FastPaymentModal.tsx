import React, { useState } from 'react';
import { Receipt, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils';
import { getInstallmentCutoffSession } from '../../../../../utils/billing';
import { ConfirmDialog } from '../../../../../components/ConfirmDialog';
import type { Invoice } from '../hooks/useFinanceDashboard';

interface FastPaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  method: string;
  setMethod: (method: string) => void;
  received: string;
  setReceived: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  loading: boolean;
}

export const FastPaymentModal: React.FC<FastPaymentModalProps> = ({
  invoice,
  onClose,
  onSubmit,
  method,
  setMethod,
  received,
  setReceived,
  note,
  setNote,
  loading,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  if (!invoice) return null;

  const isRefundedOrCancelled = invoice.trang_thai === 'da_hoan_tien' || invoice.trang_thai === 'da_huy';
  const tongPhaiTra = Number(invoice.tong_tien_thanh_toan || 0);
  const daThanhToan = Number(invoice.da_thanh_toan || 0);
  const requiredAmount = isRefundedOrCancelled ? 0 : tongPhaiTra - daThanhToan;
  const quickCashOptions = [200000, 500000, 1000000, 2000000, 5000000];

  const isPackage = !!invoice.phac_do_dieu_tri_id;
  const hinhThuc = invoice.hinh_thuc_thanh_toan_goi || '';
  const isTraGop = hinhThuc === 'tra_gop';
  // Đợt 2 = lần thu tiếp theo của một gói trả góp đã đóng Đợt 1.
  const isDot2 = isTraGop && daThanhToan > 0 && requiredAmount > 0;

  const giaGocGoi = Number(invoice.tong_tien_goc || 0);
  const tiLeGiam = Number(invoice.ti_le_giam_gia_goi || 0);
  const giamGiaGoi = Math.round((giaGocGoi * tiLeGiam) / 100);
  const giamVoucher = Number(invoice.so_tien_giam_voucher || 0);

  // Suy ra phần phí khám đã cộng/trừ ngay từ chính các con số của hóa đơn, không đoán lại:
  // dương = đã khấu trừ phí khám đóng riêng trước đó; âm = phí khám được cộng thêm vào hóa đơn.
  const giaSauGiam = giaGocGoi - giamGiaGoi - giamVoucher;
  const chenhLechKham = giaSauGiam - tongPhaiTra;
  const khauTruKham = chenhLechKham > 0 ? chenhLechKham : 0;
  const phiKhamCongThem = chenhLechKham < 0 ? -chenhLechKham : 0;

  const tongSoBuoi = Number(invoice.tong_so_buoi || invoice.so_buoi_goi || 0);
  const soBuoiDaDung = Number(invoice.so_buoi_da_dung || 0);
  const buoiDongDot2 = isTraGop && tongSoBuoi > 0 ? getInstallmentCutoffSession(tongSoBuoi) : 0;

  const hinhThucLabel =
    hinhThuc === 'tra_gop' ? 'Trả góp 50%' :
    hinhThuc === 'tra_thang' ? 'Trả thẳng' :
    hinhThuc === 'tung_buoi' ? 'Từng buổi' : null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    setShowConfirmModal(false);
    onSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const cleanReceived = received.replace(/\D/g, '');
  const amountToConfirm = method === 'tien_mat' && cleanReceived ? Number(cleanReceived) : requiredAmount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleFormSubmit}
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-zinc-150 text-left animate-in zoom-in-95 duration-200 my-auto"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="size-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={17} />
            </span>
            <div>
              <h3 className="font-heading font-black text-secondary text-sm">
                {isDot2 ? 'Thu tiền Đợt 2' : 'Ghi nhận thanh toán'} — {invoice.ma_hoa_don}
              </h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                {invoice.ten_khach_hang}
                {invoice.so_dien_thoai ? ` · ${invoice.so_dien_thoai}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* CỘT TRÁI — Biên lai y khoa đầy đủ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5">
              <Receipt className="text-primary size-4" />
              <h4 className="font-heading font-black text-secondary text-xs">Biên lai y khoa</h4>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-4 space-y-1">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                {isPackage ? 'Gói điều trị đã đăng ký' : 'Nội dung thanh toán'}
              </p>
              <p className="text-secondary font-black text-xs leading-normal">
                {invoice.ten_dich_vu || 'Dịch vụ y tế'}
                {isPackage && tongSoBuoi > 0 ? ` (${tongSoBuoi} buổi)` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                {hinhThucLabel && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider rounded-lg">
                    {hinhThucLabel}
                  </span>
                )}
                {isPackage && tongSoBuoi > 0 && (
                  <span className="px-2 py-0.5 bg-zinc-200/60 text-zinc-650 text-[9px] font-black uppercase tracking-wider rounded-lg">
                    Đã dùng {soBuoiDaDung}/{tongSoBuoi} buổi
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold text-zinc-650">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span>{isPackage ? 'Giá gốc gói:' : 'Giá gốc:'}</span>
                <span className="text-secondary font-bold">{formatCurrency(giaGocGoi)}</span>
              </div>

              {giamGiaGoi > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium">
                  <span>Giảm hình thức ({tiLeGiam}%):</span>
                  <span>-{formatCurrency(giamGiaGoi)}</span>
                </div>
              )}

              {giamVoucher > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium">
                  <span>Mã giảm giá (Voucher):</span>
                  <span>-{formatCurrency(giamVoucher)}</span>
                </div>
              )}

              {phiKhamCongThem > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <span>Phí khám lâm sàng (cộng thêm):</span>
                  <span className="text-secondary font-bold">+{formatCurrency(phiKhamCongThem)}</span>
                </div>
              )}

              {khauTruKham > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium">
                  <span>
                    Khấu trừ phí khám đã đóng
                    {invoice.ma_hoa_don_kham_rieng ? ` (HĐ ${invoice.ma_hoa_don_kham_rieng})` : ''}:
                  </span>
                  <span>-{formatCurrency(khauTruKham)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-zinc-100 pb-2 font-bold text-secondary">
                <span>Tổng giá trị hóa đơn:</span>
                <span className="text-secondary font-black">{formatCurrency(tongPhaiTra)}</span>
              </div>

              {daThanhToan > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-700 font-bold">
                  <span>{isTraGop ? 'Đợt 1 đã đóng:' : 'Đã thanh toán:'}</span>
                  <span>-{formatCurrency(daThanhToan)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-secondary bg-primary/5 p-3 rounded-2xl border border-primary/10">
                <span className="text-secondary">{isDot2 ? 'Đợt 2 cần thu:' : 'Cần thu bây giờ:'}</span>
                <span className="text-primary font-black text-sm">{formatCurrency(requiredAmount)}</span>
              </div>
            </div>

            {isDot2 && buoiDongDot2 > 0 && (
              <p className="text-[10px] text-amber-800 leading-relaxed font-semibold bg-amber-50/70 border border-amber-150 rounded-xl p-3">
                📢 Đóng xong Đợt 2 khách mới đặt được buổi số {buoiDongDot2} trở đi.
              </p>
            )}
          </div>

          {/* CỘT PHẢI — Form thu tiền */}
          <div className="space-y-4 md:border-l md:border-zinc-100 md:pl-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5">
              <CreditCard className="text-primary size-4" />
              <h4 className="font-heading font-black text-secondary text-xs">Thông tin giao dịch</h4>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fastPayMethod" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Hình thức thanh toán
              </label>
              <select
                id="fastPayMethod"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="tien_mat">💵 Tiền mặt</option>
                <option value="chuyen_khoan">🏦 Chuyển khoản ngân hàng</option>
              </select>
            </div>

            {method === 'tien_mat' && (() => {
              const receivedNum = Number(received.replace(/\D/g, '') || 0);
              const isShortage = receivedNum > 0 && receivedNum < requiredAmount;
              const currentQuickOptions = Array.from(new Set([requiredAmount, ...quickCashOptions]))
                .filter(val => val > 0)
                .sort((a, b) => a - b);

              return (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <label htmlFor="fastPayReceived" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Số tiền khách đưa (VND) *
                    </label>
                    <input
                      id="fastPayReceived"
                      type="text"
                      value={received ? Number(received.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                      onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))}
                      placeholder="VD: 500.000"
                      required
                      className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all outline-none border ${
                        isShortage
                          ? 'bg-rose-50/20 border-rose-350 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'bg-zinc-50 border-zinc-200 text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                    {isShortage && (
                      <p className="text-[10.5px] text-rose-600 font-extrabold flex items-center gap-1 mt-1">
                        ⚠️ Còn thiếu {formatCurrency(requiredAmount - receivedNum)} để hoàn thành thanh toán
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentQuickOptions.map(val => {
                      const isActive = val === receivedNum;
                      const isExact = val === requiredAmount;

                      let btnStyle = '';
                      if (isActive) {
                        btnStyle = 'bg-primary border-primary text-white scale-105 shadow-sm';
                      } else if (isExact) {
                        btnStyle = 'bg-primary/5 border-primary/50 text-primary hover:bg-primary hover:text-white';
                      } else {
                        btnStyle = 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-primary hover:text-white';
                      }

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReceived(val.toString())}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all border ${btnStyle}`}
                        >
                          {formatCurrency(val)}
                          {isExact && !isActive && <span className="text-[8px] font-bold ml-1 opacity-80">(Cần thu)</span>}
                        </button>
                      );
                    })}
                  </div>

                  {receivedNum > requiredAmount && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/40 rounded-xl p-3 text-[10.5px] font-bold flex justify-between">
                      <span>Tiền thừa thối khách:</span>
                      <span>{formatCurrency(receivedNum - requiredAmount)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-1.5">
              <label htmlFor="fastPayNote" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Ghi chú giao dịch
              </label>
              <textarea
                id="fastPayNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi nhận lưu ý..."
                rows={2}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold text-secondary uppercase tracking-wider transition-all"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-primary hover:bg-primary/95 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận thu'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showConfirmModal}
        title={isDot2 ? 'Xác nhận thu tiền Đợt 2' : 'Xác nhận thu tiền thanh toán'}
        message={`Bạn có chắc chắn muốn xác nhận thu ${formatCurrency(amountToConfirm)} cho bệnh nhân "${invoice.ten_khach_hang}" (Mã HĐ: ${invoice.ma_hoa_don}) qua hình thức ${method === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt'}?`}
        confirmLabel="Đồng ý & Thu tiền"
        cancelLabel="Kiểm tra lại"
        type="success"
        onConfirm={handleFinalConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
export default FastPaymentModal;

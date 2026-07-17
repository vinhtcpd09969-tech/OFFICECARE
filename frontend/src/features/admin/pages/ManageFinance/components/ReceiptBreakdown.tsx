import React from 'react';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils';
import { getInstallmentCutoffSession } from '../../../../../utils/billing';

interface ReceiptBreakdownProps {
  checkoutTab: 'single' | 'package';
  hoaDon: any | null;
  dangKyGoi: boolean;
  selectedPackage: any | null;
  calculatedData: any | null;
  loaiThanhToan: string;
}

export const ReceiptBreakdown: React.FC<ReceiptBreakdownProps> = ({
  checkoutTab,
  hoaDon,
  dangKyGoi,
  selectedPackage,
  calculatedData,
  loaiThanhToan,
}) => {
  const tongSoBuoi = calculatedData?.so_buoi_goi || selectedPackage?.tong_so_buoi || 10;
  // Mốc bắt buộc đóng Đợt 2 — dùng đúng công thức khóa ở backend/src/domain/billing.ts,
  // KHÔNG phải floor(N/2) (hai giá trị này lệch nhau ở gói 12/16 buổi).
  const buoiDongDot2 = getInstallmentCutoffSession(Number(tongSoBuoi));

  return (
    <div className="bg-white rounded-3xl border border-zinc-150 shadow-sm p-6 space-y-6 sticky top-6 text-left">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
        <Receipt className="text-primary size-5" />
        <h3 className="font-heading font-black text-secondary text-sm">Biên lai y khoa tạm tính</h3>
      </div>

      {checkoutTab === 'single' ? (
        // Single layout checkout breakdown
        hoaDon ? (
          <div className="space-y-5">
            <div className="space-y-1 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Nội dung thanh toán</p>
              <p className="text-secondary font-black text-xs leading-normal">{hoaDon.ten_item || 'Phí khám lâm sàng'}</p>
            </div>
            
            <div className="space-y-3.5 text-xs font-semibold text-zinc-650">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span>Giá trị buổi:</span>
                <span className="text-secondary font-bold">{formatCurrency(Number(hoaDon.tong_tien_truoc_giam))}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2 font-bold text-secondary">
                <span>Tổng phải thu:</span>
                <span className="text-primary font-black text-sm">{formatCurrency(Number(hoaDon.tong_tien_thanh_toan))}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-400 text-xs italic">
            Vui lòng chọn khách hàng có lịch khám/điều trị...
          </div>
        )
      ) : !dangKyGoi ? (
        // Khám lẻ / dịch vụ lẻ trong tab 'package' (không đăng ký gói) — vẫn có thể áp voucher
        calculatedData ? (
          <div className="space-y-5">
            <div className="space-y-1 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Nội dung thanh toán</p>
              <p className="text-secondary font-black text-xs leading-normal">{calculatedData.ten_item || 'Khám lâm sàng'}</p>
            </div>

            <div className="space-y-3.5 text-xs font-semibold text-zinc-650">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span>Giá trị buổi:</span>
                <span className="text-secondary font-bold">{formatCurrency(Number(calculatedData.gia_goc || 0))}</span>
              </div>

              {Number(calculatedData.so_tien_giam_voucher || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium">
                  <span>Mã giảm giá (Voucher):</span>
                  <span>-{formatCurrency(Number(calculatedData.so_tien_giam_voucher))}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-zinc-100 pb-2 font-bold text-secondary">
                <span>Tổng phải thu:</span>
                <span className="text-primary font-black text-sm">{formatCurrency(Number(calculatedData.tong_tien_thanh_toan))}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-400 text-xs italic">
            Đang tính toán giá...
          </div>
        )
      ) : (
        // Package layout checkout breakdown
        selectedPackage && calculatedData ? (
          <div className="space-y-5">
            <div className="space-y-1 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                {selectedPackage.loai_goi === 'LE' ? 'Dịch vụ lẻ đăng ký' : 'Gói điều trị đăng ký'}
              </p>
              <p className="text-secondary font-black text-xs leading-normal">
                {selectedPackage.ten_goi}{selectedPackage.loai_goi === 'LE' ? '' : ` (${tongSoBuoi} buổi)`}
              </p>
            </div>

            <div className="space-y-3.5 text-xs font-semibold text-zinc-650">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span>{selectedPackage.loai_goi === 'LE' ? 'Giá gốc dịch vụ:' : 'Giá gốc gói:'}</span>
                <span className="text-secondary font-bold">
                  {formatCurrency(Number(calculatedData.gia_goc_goi || selectedPackage.don_gia || selectedPackage.gia_goi || 0))}
                </span>
              </div>

              {Number(calculatedData.chi_phi_kham || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <span>Phí khám lâm sàng (cộng thêm):</span>
                  <span className="text-secondary font-bold">+{formatCurrency(Number(calculatedData.chi_phi_kham))}</span>
                </div>
              )}

              {Number(calculatedData.so_tien_giam_phuong_thuc || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium">
                  <span>Giảm hình thức ({loaiThanhToan === 'tra_thang' ? 'Trả thẳng 10%' : 'Trả góp 5%'}):</span>
                  <span>-{formatCurrency(Number(calculatedData.so_tien_giam_phuong_thuc))}</span>
                </div>
              )}

              {Number(calculatedData.so_tien_giam_voucher || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium">
                  <span>Mã giảm giá (Voucher):</span>
                  <span>-{formatCurrency(Number(calculatedData.so_tien_giam_voucher))}</span>
                </div>
              )}

              {(Number(calculatedData.so_tien_giam_phuong_thuc || 0) > 0 || Number(calculatedData.so_tien_giam_voucher || 0) > 0) && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-secondary font-semibold">
                  <span>{selectedPackage.loai_goi === 'LE' ? 'Giá dịch vụ sau giảm:' : 'Giá gói trị liệu sau giảm:'}</span>
                  <span className="text-secondary font-bold">
                    {formatCurrency(Number(calculatedData.tong_tien_goi_sau_giam || 0))}
                  </span>
                </div>
              )}

              {Number(calculatedData.giam_tru_kham_truoc_do || 0) > 0 && (
                <>
                  <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium bg-emerald-50/20 p-2 rounded-xl border border-emerald-100/50">
                    <span>
                      Khấu trừ phí khám đã đóng{calculatedData.ngay_thanh_toan_kham ? ` ngày ${calculatedData.ngay_thanh_toan_kham}` : ''}
                      {calculatedData.ma_hoa_don_kham ? ` (HĐ ${calculatedData.ma_hoa_don_kham})` : ''}:
                    </span>
                    <span>-{formatCurrency(Number(calculatedData.giam_tru_kham_truoc_do))}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 pb-2 text-secondary font-semibold">
                    <span>Còn lại sau khấu trừ:</span>
                    <span className="text-secondary font-bold">
                      {formatCurrency(
                        Number(calculatedData.tong_tien_goi_sau_giam || calculatedData.gia_goc_goi || 0) -
                        Number(calculatedData.giam_tru_kham_truoc_do || 0)
                      )}
                    </span>
                  </div>
                </>
              )}

              {Number(calculatedData.mien_phi_kham_chua_dong || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium bg-emerald-50/20 p-2 rounded-xl border border-emerald-100/50">
                  <span>Miễn phí khám (Đơn giá gói ≥ 1 triệu):</span>
                  <span>-{formatCurrency(Number(calculatedData.mien_phi_kham_chua_dong))}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-zinc-100 pb-2 font-bold text-secondary bg-primary/5 p-3 rounded-2xl border border-primary/10">
                <span className="text-secondary">Số tiền cần thanh toán bây giờ:</span>
                <span className="text-primary font-black text-sm">{formatCurrency(Number(calculatedData.so_tien_dot_1))}</span>
              </div>

              {/* Trả góp: số tiền còn lại chính là Đợt 2 — đã nêu trong ô vàng bên dưới, không lặp lại ở đây. */}
              {loaiThanhToan !== 'tra_gop' && Number(calculatedData.so_tien_dot_2 || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-zinc-650 font-bold bg-zinc-50/40 p-2 rounded-xl border border-zinc-150">
                  <span>Số tiền còn lại:</span>
                  <span className="text-secondary font-black">{formatCurrency(Number(calculatedData.so_tien_dot_2))}</span>
                </div>
              )}

              {loaiThanhToan === 'tung_buoi' && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-amber-700 font-bold bg-amber-50/30 p-2.5 rounded-xl border border-amber-150/40">
                  <span>Số tiền mỗi buổi trị liệu ({calculatedData.so_buoi_goi || selectedPackage.tong_so_buoi} buổi):</span>
                  <span>{formatCurrency(Number(calculatedData.don_gia_theo_buoi || 0))}/buổi</span>
                </div>
              )}

              {loaiThanhToan === 'tra_gop' && (
                <div className="space-y-2.5 bg-amber-50/70 p-4 border border-amber-150 rounded-2xl">
                  <div className="flex justify-between items-center text-amber-900 font-black text-xs pb-2 border-b border-amber-150/70">
                    <span>Đợt 2:</span>
                    <span>{formatCurrency(Number(calculatedData.so_tien_dot_2))}</span>
                  </div>

                  <div className="flex justify-between items-center text-amber-800 font-bold text-[10px]">
                    <span>Số buổi được dùng ở Đợt 1:</span>
                    <span className="font-black">{Math.max(1, buoiDongDot2 - 1)} / {tongSoBuoi} buổi</span>
                  </div>

                  <div className="flex justify-between items-center gap-2 text-amber-800 font-bold text-[10px]">
                    <span>Đóng Đợt 2 khi hoàn thành buổi số:</span>
                    <span className="font-black bg-amber-200/60 px-2 py-0.5 rounded-lg shrink-0">
                      Buổi {Math.max(1, buoiDongDot2 - 1)}
                    </span>
                  </div>

                  <p className="text-[10px] text-amber-800 leading-relaxed font-semibold pt-1.5 border-t border-amber-150/70">
                    📢 Vui lòng trao đổi rõ với khách hàng: Đợt 1 đóng 50% khi đăng ký (kèm phí khám nếu có).
                    Khách <span className="font-black">bắt buộc đóng xong Đợt 2 mới đặt được buổi số {buoiDongDot2}</span>.
                  </p>
                </div>
              )}

              {loaiThanhToan === 'tung_buoi' && (
                <div className="bg-amber-50/70 p-4 border border-amber-100 rounded-2xl space-y-2">
                  <div className="flex justify-between text-amber-800 font-bold text-[10px]">
                    <span>Phần còn lại (Đóng theo buổi):</span>
                    <span>{formatCurrency(Number(calculatedData.so_tien_dot_2))}</span>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-normal font-semibold">
                    {calculatedData.ngay_thanh_toan_kham
                      ? `* Đã thanh toán khám ngày ${calculatedData.ngay_thanh_toan_kham}. Đã chọn phương thức thanh toán từng buổi, bạn sẽ thanh toán số tiền ${formatCurrency(Number(calculatedData.don_gia_theo_buoi || 0))} trong từng buổi thực tế.`
                      : '* Hôm nay chỉ thanh toán phí khám lâm sàng. Chi phí gói trị liệu sẽ đóng lẻ từng buổi khi khách đến thực hiện điều trị.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-400 text-xs italic">
            Vui lòng chọn gói hoặc đợi tính toán giá...
          </div>
        )
      )}
    </div>
  );
};
export default ReceiptBreakdown;

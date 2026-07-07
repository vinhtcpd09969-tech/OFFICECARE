import React from 'react';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils';

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
  const buoiDongDot2 = Math.floor(Number(tongSoBuoi) / 2);

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
      ) : (
        // Package layout checkout breakdown
        dangKyGoi && selectedPackage && calculatedData ? (
          <div className="space-y-5">
            <div className="space-y-1 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Gói điều trị đăng ký</p>
              <p className="text-secondary font-black text-xs leading-normal">
                {selectedPackage.ten_goi} ({tongSoBuoi} buổi)
              </p>
            </div>

            <div className="space-y-3.5 text-xs font-semibold text-zinc-650">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span>Giá gốc gói:</span>
                <span className="text-secondary font-bold">
                  {formatCurrency(Number(calculatedData.gia_goc_goi || selectedPackage.don_gia || selectedPackage.gia_goi || 0))}
                </span>
              </div>

              {Number(calculatedData.chi_phi_kham || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <span>Phí khám lâm sàng:</span>
                  <span className="text-secondary font-bold">+{formatCurrency(Number(calculatedData.chi_phi_kham))}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-zinc-100 pb-2 font-bold text-secondary bg-zinc-50/50 p-2 rounded-xl">
                <span>Tổng giá trị gốc (Gói + Khám):</span>
                <span>{formatCurrency(Number(calculatedData.gia_goc))}</span>
              </div>

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

              {Number(calculatedData.giam_tru_kham_truoc_do || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium bg-emerald-50/20 p-2 rounded-xl border border-emerald-100/50">
                  <span>Khấu trừ phí khám đã đóng:</span>
                  <span>-{formatCurrency(Number(calculatedData.giam_tru_kham_truoc_do))}</span>
                </div>
              )}

              {Number(calculatedData.mien_phi_kham_chua_dong || 0) > 0 && (
                <div className="flex justify-between border-b border-zinc-100 pb-2 text-emerald-600 font-medium bg-emerald-50/20 p-2 rounded-xl border border-emerald-100/50">
                  <span>Miễn phí khám (Đơn giá gói ≥ 1 triệu):</span>
                  <span>-{formatCurrency(Number(calculatedData.mien_phi_kham_chua_dong))}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-zinc-100 pb-2 text-secondary font-semibold">
                {Number(calculatedData.so_tien_giam_phuong_thuc || 0) > 0 || Number(calculatedData.so_tien_giam_voucher || 0) > 0 ? (
                  <span>Giá gói trị liệu sau giảm:</span>
                ) : (
                  <span>Giá gói trị liệu:</span>
                )}
                <span className="text-secondary font-bold">
                  {formatCurrency(Number(calculatedData.tong_tien_goi_sau_giam || 0))}
                </span>
              </div>

              <div className="flex justify-between border-b border-zinc-100 pb-2 font-bold text-secondary bg-primary/5 p-3 rounded-2xl border border-primary/10">
                <span className="text-secondary">Số tiền cần thanh toán bây giờ:</span>
                <span className="text-primary font-black text-sm">{formatCurrency(Number(calculatedData.so_tien_dot_1))}</span>
              </div>

              {Number(calculatedData.so_tien_dot_2 || 0) > 0 && (
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

              {(loaiThanhToan === 'tra_gop' || loaiThanhToan === 'tung_buoi') && (
                <div className="space-y-2 bg-amber-50/70 p-4 border border-amber-100 rounded-2xl">
                  {loaiThanhToan === 'tra_gop' ? (
                    <div className="flex justify-between text-amber-800 font-bold text-[10px]">
                      <span>Đợt 2 (Thanh toán ở buổi {buoiDongDot2}):</span>
                      <span>{formatCurrency(Number(calculatedData.so_tien_dot_2))}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-amber-800 font-bold text-[10px]">
                      <span>Phần còn lại (Đóng theo buổi):</span>
                      <span>{formatCurrency(Number(calculatedData.so_tien_dot_2))}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-700 leading-normal font-semibold">
                    {loaiThanhToan === 'tra_gop' 
                      ? `* Đợt 1 đóng 50% khi đăng ký + phí khám (nếu có). Đợt 2 đóng 50% còn lại ở buổi trị liệu số ${buoiDongDot2}.`
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

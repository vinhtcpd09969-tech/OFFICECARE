import React from 'react';
import { Receipt, CheckCircle2, AlertCircle, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import { getInstallmentCutoffSession } from '../../../../../utils/billing';
import type { Invoice, CalculatedCheckoutData, AssignedPackage } from '../hooks/useFinanceDashboard';

interface ReceiptBreakdownProps {
  checkoutTab: 'package' | 'single';
  hoaDon: Invoice | null;
  dangKyGoi: boolean;
  selectedPackage: AssignedPackage | null;
  calculatedData: CalculatedCheckoutData | null;
  loaiThanhToan: 'tra_thang' | 'tra_gop' | 'tung_buoi';
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
  const buoiDongDot2 = getInstallmentCutoffSession(Number(tongSoBuoi));

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 space-y-6 sticky top-6 text-left font-jakarta">
      
      {/* Receipt Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-tight">Biên lai y khoa tạm tính</h3>
            <p className="text-[10px] text-slate-400 font-bold">Chi tiết khoản thu dự kiến tại quầy</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
          <ShieldCheck size={11} /> Chuẩn y tế
        </span>
      </div>

      {checkoutTab === 'single' ? (
        hoaDon ? (
          <div className="space-y-5">
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nội dung thanh toán</p>
              <p className="text-slate-900 dark:text-white font-extrabold text-xs leading-normal">{hoaDon.ten_item || 'Phí khám lâm sàng'}</p>
            </div>
            
            <div className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Giá trị buổi:</span>
                <span className="text-slate-900 dark:text-white font-black">{formatCurrency(Number(hoaDon.tong_tien_truoc_giam))}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-900 dark:text-white font-black">
                <span>Tổng phải thu:</span>
                <span className="text-teal-600 dark:text-teal-400 font-black text-base">{formatCurrency(Number(hoaDon.tong_tien_thanh_toan))}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-bold italic">
            Vui lòng chọn khách hàng có lịch khám/điều trị...
          </div>
        )
      ) : !dangKyGoi ? (
        calculatedData ? (
          <div className="space-y-5">
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nội dung thanh toán</p>
              <p className="text-slate-900 dark:text-white font-extrabold text-xs leading-normal">{calculatedData.ten_item || 'Khám lâm sàng'}</p>
            </div>

            <div className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Giá trị buổi:</span>
                <span className="text-slate-900 dark:text-white font-black">{formatCurrency(Number(calculatedData.gia_goc || 0))}</span>
              </div>

              {Number(calculatedData.so_tien_giam_voucher || 0) > 0 && (
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="flex items-center gap-1"><Tag size={12} /> Voucher giảm giá:</span>
                  <span>-{formatCurrency(Number(calculatedData.so_tien_giam_voucher))}</span>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-slate-900 dark:text-white font-black border-t border-slate-200/80 dark:border-slate-700">
                <span>Tổng phải thu:</span>
                <span className="text-teal-600 dark:text-teal-400 text-lg font-black">{formatCurrency(Number(calculatedData.tong_tien_thanh_toan || 0))}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-bold italic">
            Đang tính toán chi phí...
          </div>
        )
      ) : calculatedData ? (
        <div className="space-y-5">
          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {calculatedData.loai_goi === 'LE' ? 'Dịch vụ lẻ chỉ định' : 'Gói trị liệu được chọn'}
            </p>
            <p className="text-slate-900 dark:text-white font-extrabold text-xs leading-normal">
              {calculatedData.ten_goi} ({calculatedData.so_buoi_goi} buổi)
            </p>
          </div>

          <div className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span>Đơn giá gói niêm yết:</span>
              <span className="text-slate-900 dark:text-white font-black">{formatCurrency(Number(calculatedData.gia_goc_goi))}</span>
            </div>

            {/* 1. Ưu đãi theo hình thức thanh toán (Trả thẳng 10% / Trả góp 5%) */}
            {Number(calculatedData.so_tien_giam_phuong_thuc || 0) > 0 && (
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Ưu đãi thanh toán ({loaiThanhToan === 'tra_thang' ? '10%' : '5%'}):</span>
                <span>-{formatCurrency(Number(calculatedData.so_tien_giam_phuong_thuc))}</span>
              </div>
            )}

            {/* 2. Khấu trừ phí khám lâm sàng đã đóng trước đó */}
            {Number(calculatedData.giam_tru_kham_truoc_do || 0) > 0 && (
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <div>
                  <span>Khấu trừ phí khám đã đóng:</span>
                  {(calculatedData.ma_hoa_don_kham || calculatedData.ngay_thanh_toan_kham) && (
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      (Mã HĐ: <strong className="text-teal-600 dark:text-teal-400 font-mono font-black">{calculatedData.ma_hoa_don_kham}</strong>
                      {calculatedData.ngay_thanh_toan_kham ? `, thanh toán ngày ${calculatedData.ngay_thanh_toan_kham}` : ''})
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs font-black">-{formatCurrency(Number(calculatedData.giam_tru_kham_truoc_do))}</span>
              </div>
            )}

            {/* 3. Miễn phí khám lâm sàng cho ca khám mới */}
            {Number(calculatedData.mien_phi_kham_chua_dong || 0) > 0 && (
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Miễn phí khám lâm sàng:</span>
                <span>0đ (Miễn {formatCurrency(Number(calculatedData.mien_phi_kham_chua_dong))})</span>
              </div>
            )}

            {/* 4. Mã giảm giá Voucher áp dụng */}
            {Number(calculatedData.so_tien_giam_voucher || 0) > 0 && (
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="flex items-center gap-1"><Tag size={12} /> Mã voucher áp dụng:</span>
                <span>-{formatCurrency(Number(calculatedData.so_tien_giam_voucher))}</span>
              </div>
            )}

            {/* Total Savings Highlight Badge */}
            {(() => {
              const totalSavings = Number(calculatedData.so_tien_giam_phuong_thuc || 0) 
                + Number(calculatedData.so_tien_giam_voucher || 0) 
                + Number(calculatedData.giam_tru_kham_truoc_do || 0) 
                + Number(calculatedData.mien_phi_kham_chua_dong || 0);
              if (totalSavings <= 0) return null;
              return (
                <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-300">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 shadow-xs">
                    <Sparkles size={14} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">Ưu Đãi Tiết Kiệm Y Khoa</p>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      Bệnh nhân tiết kiệm được tổng cộng {formatCurrency(totalSavings)}!
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-900 dark:text-white font-black">
              <span>Tổng giá trị sau giảm & khấu trừ:</span>
              <span>{formatCurrency(Number(calculatedData.tong_tien_thanh_toan))}</span>
            </div>

            {/* Tra gop / Tung buoi logic status */}
            {loaiThanhToan === 'tra_gop' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex justify-between items-center text-amber-900 dark:text-amber-300 font-black">
                  <span>Cần thu đợt 1 (50%):</span>
                  <span className="text-base text-amber-600 dark:text-amber-400">{formatCurrency(Number(calculatedData.so_tien_dot_1))}</span>
                </div>
                <div className="text-[10px] text-amber-800 dark:text-amber-400 font-bold">
                  Còn lại đợt 2: {formatCurrency(Number(calculatedData.so_tien_dot_2))} (Đóng ở buổi thứ #{buoiDongDot2})
                </div>
              </div>
            )}

            {loaiThanhToan === 'tung_buoi' && (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 space-y-2">
                <div className="flex justify-between items-center text-teal-900 dark:text-teal-300 font-black">
                  <span>Đơn giá mỗi buổi:</span>
                  <span className="text-base text-teal-600 dark:text-teal-400">{formatCurrency(Number(calculatedData.don_gia_theo_buoi))}/buổi</span>
                </div>
                <div className="text-[10px] text-teal-800 dark:text-teal-400 font-bold">
                  Thanh toán từng buổi khi bệnh nhân đến khám.
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-between items-center text-slate-900 dark:text-white font-black border-t border-slate-200/80 dark:border-slate-700">
              <span className="text-sm">Tổng cần thu ngay:</span>
              <span className="text-teal-600 dark:text-teal-400 text-xl font-black">
                {loaiThanhToan === 'tra_gop'
                  ? formatCurrency(Number(calculatedData.so_tien_dot_1))
                  : loaiThanhToan === 'tung_buoi'
                  ? formatCurrency(0)
                  : formatCurrency(Number(calculatedData.tong_tien_thanh_toan))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400 text-xs font-bold italic">
          Đang tải thông tin tính phí...
        </div>
      )}
    </div>
  );
};

export default ReceiptBreakdown;

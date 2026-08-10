import React from 'react';
import { Receipt, Tag, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../../../../utils/format';
import type { Invoice } from '../hooks/useFinanceDashboard';
import type { CalculatedCheckoutData, AssignedPackage } from '../hooks/useCheckout';

interface ReceiptBreakdownProps {
  checkoutTab: 'package' | 'single';
  hoaDon: Invoice | null;
  dangKyGoi: boolean;
  selectedPackage: AssignedPackage | null;
  calculatedData: CalculatedCheckoutData | null;
  loaiThanhToan: 'tra_thang' | 'tung_buoi';
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

  const totalToPay = checkoutTab === 'single'
    ? Number(hoaDon?.tong_tien_thanh_toan || 0)
    : (!dangKyGoi
      ? Number(calculatedData?.tong_tien_thanh_toan || 0)
      : (loaiThanhToan === 'tung_buoi'
        ? Number(calculatedData?.so_tien_dot_1 || 0)
        : Number(calculatedData?.tong_tien_thanh_toan || 0)));

  return (
    <div className="space-y-5 text-left font-jakarta">
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

      {/* Item summary section */}
      <div className="space-y-4">
        {/* Item Title & Base Price Combined in Single Card */}
        {(() => {
          const itemName = checkoutTab === 'single'
            ? (hoaDon?.ten_dich_vu || 'Buổi Lượng Giá PHCN (Chuyên sâu)')
            : (!dangKyGoi
              ? (calculatedData?.ten_item || 'Buổi Lượng Giá PHCN (Chuyên sâu)')
              : (`${calculatedData?.ten_goi || selectedPackage?.ten_goi || 'Gói trị liệu PHCN'} (${tongSoBuoi} buổi)`));

          const basePrice = checkoutTab === 'single'
            ? Number(hoaDon?.tong_tien_goc || hoaDon?.tong_tien_thanh_toan || 200000)
            : (!dangKyGoi
              ? Number(calculatedData?.gia_goc || 200000)
              : Number(calculatedData?.gia_goc_goi || (selectedPackage as any)?.don_gia || selectedPackage?.gia_ban || 0));

          return (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Khoản thu y tế</p>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                    {itemName}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nguyên giá</p>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {formatCurrency(basePrice)}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Breakdown Calculation Rows (Discounts & Vouchers) */}
        <div className="space-y-3 text-xs font-bold text-slate-600 dark:text-slate-300">
          {calculatedData && Number(calculatedData.so_tien_giam_voucher || 0) > 0 && (
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1"><Tag size={12} /> Voucher giảm giá:</span>
              <span className="font-mono font-black">-{formatCurrency(Number(calculatedData.so_tien_giam_voucher))}</span>
            </div>
          )}

          {/* Total display row - Refined High-Contrast Medical Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/90 to-emerald-50/90 dark:from-teal-950/60 dark:to-emerald-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] font-black uppercase text-teal-800 dark:text-teal-300 tracking-wider block">
                {loaiThanhToan === 'tung_buoi' ? 'TỔNG CẦN THU ĐỢT 1' : 'TỔNG NGUYÊN GIÁ THU NGAY'}
              </span>
              <span className="text-[10px] font-bold text-teal-600/90 dark:text-teal-400">Đã trừ các khoản chiết khấu</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight shrink-0 drop-shadow-xs">
              {formatCurrency(totalToPay)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptBreakdown;

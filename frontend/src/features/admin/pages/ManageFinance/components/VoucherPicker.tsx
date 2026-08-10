import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Ticket, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../../../api/axios';
import { formatCurrency } from '../../../../../utils/format';
import { formatVoucherPaymentMethods } from '../../../../../utils/voucherPaymentMethod';

export interface VoucherOption {
  id: string;
  ma_voucher: string;
  ten_chien_dich?: string;
  loai_giam: string;
  gia_tri_giam: number;
  giam_toi_da: number | null;
  don_hang_toi_thieu: number;
  so_luong_toi_da: number | null;
  ngay_het_han: string | null;
  yeu_cau_thanh_toan: string[];
  tu_dong_ap_dung?: boolean;
  kenh_ap_dung?: string[];
  loai_goi_ap_dung?: string[];
}

interface VoucherPickerProps {
  appliedVoucher: any | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  /** Giá trị đơn hàng hiện tại (gia_goc_goi) — dùng để chỉ hiển thị voucher đủ điều kiện đơn tối thiểu. */
  orderValue?: number;
  /** Hình thức thanh toán đang chọn — dùng để lọc voucher giới hạn theo hình thức. */
  loaiThanhToan?: 'tra_thang' | 'tung_buoi';
  /** Khách hàng đang checkout — dùng để kiểm tra giới hạn lượt dùng theo TỪNG khách. */
  khachHangId?: string;
  kenh?: 'online' | 'tai_quay';
  loaiGoi?: 'KHAM' | 'LE' | 'LIEU_TRINH';
}

const isPercent = (loaiGiam: string) => loaiGiam === 'phan_tram' || loaiGiam === 'percentage';

// Dùng chung cho cả việc lọc danh sách dropdown VÀ kiểm tra voucher đang áp còn hợp lệ hay không
// sau khi đổi hình thức thanh toán — một nơi duy nhất, tránh 2 chỗ lệch điều kiện nhau.
export const isVoucherEligible = (
  v: Partial<VoucherOption>,
  orderValue: number,
  loaiThanhToan?: 'tra_thang' | 'tung_buoi',
  kenh: 'online' | 'tai_quay' = 'tai_quay',
  loaiGoi?: 'KHAM' | 'LE' | 'LIEU_TRINH'
) => {
  if (orderValue < Number(v.don_hang_toi_thieu || 0)) return false;

  const yeuCauThanhToan = Array.isArray(v.yeu_cau_thanh_toan) ? v.yeu_cau_thanh_toan : (v.yeu_cau_thanh_toan ? [v.yeu_cau_thanh_toan] : []);
  if (yeuCauThanhToan.length > 0 && !yeuCauThanhToan.includes('tat_ca')) {
    if (loaiThanhToan && !yeuCauThanhToan.includes(loaiThanhToan)) return false;
  }

  const kenhApDung = Array.isArray(v.kenh_ap_dung) ? v.kenh_ap_dung : (v.kenh_ap_dung ? [v.kenh_ap_dung] : []);
  if (kenhApDung.length > 0 && !kenhApDung.includes('tat_ca')) {
    if (kenh && !kenhApDung.includes(kenh)) return false;
  }

  const loaiGoiApDung = Array.isArray(v.loai_goi_ap_dung) ? v.loai_goi_ap_dung : (v.loai_goi_ap_dung ? [v.loai_goi_ap_dung] : []);
  if (loaiGoiApDung.length > 0 && !loaiGoiApDung.includes('tat_ca')) {
    if (loaiGoi && !loaiGoiApDung.includes(loaiGoi)) return false;
  }

  return true;
};

const formatDiscount = (v: { loai_giam: string; gia_tri_giam: number; giam_toi_da?: number | null }) =>
  isPercent(v.loai_giam)
    ? `Giảm ${v.gia_tri_giam}%${v.giam_toi_da ? ` (tối đa ${formatCurrency(v.giam_toi_da)})` : ''}`
    : `Giảm ${formatCurrency(v.gia_tri_giam)}`;

export default function VoucherPicker({ appliedVoucher, onApply, onRemove, disabled, orderValue = 0, loaiThanhToan, khachHangId, kenh = 'tai_quay', loaiGoi }: VoucherPickerProps) {
  const [open, setOpen] = useState(false);
  const [vouchers, setVouchers] = useState<VoucherOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Chỉ hiển thị voucher đơn hàng hiện tại đủ điều kiện áp dụng
  const eligibleVouchers = vouchers.filter((v) => isVoucherEligible(v, orderValue, loaiThanhToan, kenh, loaiGoi));

  // Reset danh sách đã tải khi đổi khách hàng — giới hạn lượt dùng tính riêng theo từng khách.
  useEffect(() => {
    setLoaded(false);
    setVouchers([]);
  }, [khachHangId]);

  // Voucher đang áp mà đổi hình thức thanh toán/giá trị đơn hàng khiến nó không còn hợp lệ nữa
  // (VD đang áp cho "Trả thẳng 100%" rồi bấm qua "Từng buổi") — tự gỡ ngay để khách chọn lại, thay
  // vì giữ nguyên rồi để bước tính tiền phía sau trả lỗi "Mã giảm giá này chỉ áp dụng cho...".
  useEffect(() => {
    if (appliedVoucher && !isVoucherEligible(appliedVoucher, orderValue, loaiThanhToan)) {
      onRemove();
      toast(`Mã "${appliedVoucher.ma_voucher}" không áp dụng được cho lựa chọn mới, vui lòng chọn lại mã giảm giá.`, { icon: 'ℹ️' });
    }
  }, [appliedVoucher, orderValue, loaiThanhToan]);

  useEffect(() => {
    if (!open || loaded || !khachHangId) return;
    setLoading(true);
    axiosInstance.get('/receptionist/vouchers/active', { params: { khach_hang_id: khachHangId } })
      .then((res) => setVouchers(res.data.vouchers || []))
      .catch(() => setVouchers([]))
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }, [open, loaded, khachHangId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (appliedVoucher) {
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mã giảm giá (Voucher)</label>
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl animate-in fade-in duration-200">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Ticket size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-emerald-800 truncate">{appliedVoucher.ma_voucher}</p>
              <p className="text-[10.5px] font-bold text-emerald-600">{formatDiscount(appliedVoucher)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="p-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-xl transition-all disabled:opacity-50 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 relative" ref={wrapperRef}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mã giảm giá (Voucher)</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-left flex items-center justify-between gap-3 hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-zinc-400">Chọn mã giảm giá đang áp dụng...</span>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full max-h-72 overflow-y-auto bg-white border border-zinc-200 rounded-2xl shadow-xl shadow-zinc-900/5 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {loading ? (
            <p className="text-xs font-semibold text-zinc-400 text-center py-6">Đang tải danh sách mã giảm giá...</p>
          ) : eligibleVouchers.length === 0 ? (
            <p className="text-xs font-semibold text-zinc-400 text-center py-6">
              {vouchers.length === 0
                ? 'Hiện không có mã giảm giá nào khả dụng.'
                : 'Đơn hàng hiện tại chưa đủ điều kiện áp dụng mã giảm giá nào.'}
            </p>
          ) : (
            eligibleVouchers.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onApply(v.ma_voucher);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black text-zinc-800 truncate">{v.ma_voucher}</p>
                  <p className="text-[10px] font-bold text-zinc-450 mt-0.5">
                    {formatDiscount(v)}
                    {Number(v.don_hang_toi_thieu) > 0 ? ` · Đơn tối thiểu ${formatCurrency(v.don_hang_toi_thieu)}` : ''}
                    {formatVoucherPaymentMethods(v.yeu_cau_thanh_toan)
                      ? ` · Chỉ ${formatVoucherPaymentMethods(v.yeu_cau_thanh_toan)}`
                      : ''}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

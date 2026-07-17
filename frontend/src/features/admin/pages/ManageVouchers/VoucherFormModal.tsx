import { useEffect, useState } from 'react';
import { Ticket, X } from 'lucide-react';
import { Voucher } from './VoucherCard';

const PAYMENT_METHOD_OPTIONS: { value: 'tra_thang' | 'tra_gop' | 'tung_buoi'; label: string }[] = [
  { value: 'tra_thang', label: 'Trả thẳng 100%' },
  { value: 'tra_gop', label: 'Trả góp' },
  { value: 'tung_buoi', label: 'Từng buổi (liệu trình)' },
];

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingVoucher: Partial<Voucher> | null;
  loaiGiam: 'phan_tram' | 'so_tien_co_dinh';
  setLoaiGiam: (val: 'phan_tram' | 'so_tien_co_dinh') => void;
  yeuCauThanhToan: string[];
  setYeuCauThanhToan: (val: string[]) => void;
  formatLocalDate: (date: Date) => string;
}

export function VoucherFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingVoucher,
  loaiGiam,
  setLoaiGiam,
  yeuCauThanhToan,
  setYeuCauThanhToan,
  formatLocalDate
}: VoucherFormModalProps) {
  const [giaTriGiam, setGiaTriGiam] = useState('');
  const [giamToiDa, setGiamToiDa] = useState('');
  const [donHangToiThieu, setDonHangToiThieu] = useState('');
  const [soLuongToiDa, setSoLuongToiDa] = useState('');
  const [maVoucher, setMaVoucher] = useState('');
  const [tenChienDich, setTenChienDich] = useState('');
  const [maVoucherTouched, setMaVoucherTouched] = useState(false);
  const [tenChienDichTouched, setTenChienDichTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setGiaTriGiam(editingVoucher?.gia_tri_giam != null ? String(editingVoucher.gia_tri_giam) : '');
    setGiamToiDa(editingVoucher?.giam_toi_da != null ? String(editingVoucher.giam_toi_da) : '');
    setDonHangToiThieu(editingVoucher?.don_hang_toi_thieu != null ? String(editingVoucher.don_hang_toi_thieu) : '0');
    setSoLuongToiDa(editingVoucher?.so_luong_toi_da != null ? String(editingVoucher.so_luong_toi_da) : '');
    setMaVoucher(editingVoucher?.ma_voucher || '');
    setTenChienDich(editingVoucher?.ten_chien_dich || '');
    setMaVoucherTouched(false);
    setTenChienDichTouched(false);
  }, [isOpen, editingVoucher]);

  if (!isOpen) return null;

  const toggleAllPaymentMethods = () => setYeuCauThanhToan(['tat_ca']);
  const togglePaymentMethod = (value: string) => {
    setYeuCauThanhToan(
      yeuCauThanhToan.includes(value)
        ? yeuCauThanhToan.filter((v) => v !== value)
        : [...yeuCauThanhToan.filter((v) => v !== 'tat_ca'), value]
    );
  };

  // Lỗi hiển thị ngay khi nhập, không đợi tới lúc bấm lưu mới báo.
  const giaTriGiamError = (() => {
    if (giaTriGiam === '') return '';
    const n = Number(giaTriGiam);
    if (Number.isNaN(n)) return 'Giá trị không hợp lệ';
    if (loaiGiam === 'phan_tram') {
      if (n < 1) return 'Phải lớn hơn hoặc bằng 1%';
      if (n > 100) return 'Không được vượt quá 100%';
    } else if (n < 1) {
      return 'Phải lớn hơn hoặc bằng 1đ';
    }
    return '';
  })();
  // Validate on-blur cho các ô bắt buộc nhập chữ — chỉ báo đỏ sau khi người dùng đã rời khỏi ô
  // (touched) mà vẫn để trống, tránh báo lỗi ngay khi vừa mở form chưa kịp nhập gì.
  const maVoucherError = maVoucherTouched && !maVoucher.trim() ? 'Vui lòng nhập mã voucher' : '';
  const tenChienDichError = tenChienDichTouched && !tenChienDich.trim() ? 'Vui lòng nhập tên chiến dịch' : '';
  const giamToiDaError = (() => {
    if (giamToiDa === '') return '';
    const n = Number(giamToiDa);
    if (Number.isNaN(n) || n <= 0) return 'Phải lớn hơn 0 (hoặc để trống)';
    return '';
  })();
  const donHangToiThieuError = (() => {
    if (donHangToiThieu === '') return '';
    const n = Number(donHangToiThieu);
    if (Number.isNaN(n) || n < 0) return 'Không được âm';
    return '';
  })();
  const soLuongToiDaError = (() => {
    if (soLuongToiDa === '') return '';
    const n = Number(soLuongToiDa);
    if (Number.isNaN(n) || n < 1 || !Number.isInteger(n)) return 'Phải là số nguyên từ 1 trở lên (hoặc để trống)';
    return '';
  })();
  const hasFieldError = !!(
    giaTriGiamError || giamToiDaError || donHangToiThieuError || soLuongToiDaError ||
    !maVoucher.trim() || !tenChienDich.trim()
  );

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setMaVoucherTouched(true);
    setTenChienDichTouched(true);
    if (hasFieldError) {
      e.preventDefault();
      return;
    }
    onSubmit(e);
  };

  const errorInputClass = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';
  const normalInputClass = 'border-slate-200 focus:border-primary focus:ring-primary/20';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-slate-800">
              {editingVoucher?.id ? 'Chỉnh sửa Ưu đãi / Voucher' : 'Thiết lập chiến dịch mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ma_voucher" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mã Voucher *
              </label>
              <input
                id="ma_voucher"
                name="ma_voucher"
                value={maVoucher}
                onChange={(e) => setMaVoucher(e.target.value)}
                onBlur={() => setMaVoucherTouched(true)}
                required
                placeholder="VD: CHUNGHE2026"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm transition-all bg-slate-50/30 ${maVoucherError ? errorInputClass : normalInputClass}`}
              />
              {maVoucherError && <p className="text-[10px] text-rose-500 font-bold mt-1">{maVoucherError}</p>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="ten_chien_dich" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tên chiến dịch *
              </label>
              <input
                id="ten_chien_dich"
                name="ten_chien_dich"
                value={tenChienDich}
                onChange={(e) => setTenChienDich(e.target.value)}
                onBlur={() => setTenChienDichTouched(true)}
                required
                placeholder="VD: Tri ân khách hàng"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${tenChienDichError ? errorInputClass : normalInputClass}`}
              />
              {tenChienDichError && <p className="text-[10px] text-rose-500 font-bold mt-1">{tenChienDichError}</p>}
            </div>

            <div>
              <label htmlFor="loai_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Loại giảm trừ
              </label>
              <select
                id="loai_giam"
                name="loai_giam"
                value={loaiGiam}
                onChange={(e) => setLoaiGiam(e.target.value as 'phan_tram' | 'so_tien_co_dinh')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white cursor-pointer"
              >
                <option value="phan_tram">Phần trăm (%)</option>
                <option value="so_tien_co_dinh">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label htmlFor="gia_tri_giam" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Giá trị giảm *
              </label>
              <input
                id="gia_tri_giam"
                name="gia_tri_giam"
                type="number"
                value={giaTriGiam}
                onChange={(e) => setGiaTriGiam(e.target.value)}
                required
                min={1}
                max={loaiGiam === 'phan_tram' ? 100 : undefined}
                step={1}
                placeholder={loaiGiam === 'phan_tram' ? 'Ví dụ: 10 (tối đa 100)' : 'Ví dụ: 100000 (đ)'}
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 font-semibold text-secondary transition-colors ${giaTriGiamError ? errorInputClass : normalInputClass}`}
              />
              {giaTriGiamError && <p className="text-[10px] text-rose-500 font-bold mt-1">{giaTriGiamError}</p>}
            </div>

            {loaiGiam === 'phan_tram' && (
              <div>
                <label htmlFor="giam_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Giảm tối đa (VNĐ)
                </label>
                <input
                  id="giam_toi_da"
                  type="text"
                  inputMode="numeric"
                  value={giamToiDa ? Number(giamToiDa).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setGiamToiDa(e.target.value.replace(/\D/g, ''))}
                  placeholder="Để trống nếu không giới hạn"
                  className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${giamToiDaError ? errorInputClass : normalInputClass}`}
                />
                {/* Ô nhập hiển thị định dạng có dấu chấm ngăn cách; giá trị số thô gửi lên qua input ẩn này. */}
                <input type="hidden" name="giam_toi_da" value={giamToiDa} />
                {giamToiDaError && <p className="text-[10px] text-rose-500 font-bold mt-1">{giamToiDaError}</p>}
              </div>
            )}
            <div>
              <label htmlFor="don_hang_toi_thieu" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Đơn tối thiểu (VNĐ)
              </label>
              <input
                id="don_hang_toi_thieu"
                type="text"
                inputMode="numeric"
                value={donHangToiThieu ? Number(donHangToiThieu).toLocaleString('vi-VN') : ''}
                onChange={(e) => setDonHangToiThieu(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 200.000"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${donHangToiThieuError ? errorInputClass : normalInputClass}`}
              />
              <input type="hidden" name="don_hang_toi_thieu" value={donHangToiThieu} />
              {donHangToiThieuError && <p className="text-[10px] text-rose-500 font-bold mt-1">{donHangToiThieuError}</p>}
            </div>

            <div>
              <label htmlFor="so_luong_toi_da" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Số lượt tối đa / 1 khách hàng
              </label>
              <input
                id="so_luong_toi_da"
                name="so_luong_toi_da"
                type="number"
                value={soLuongToiDa}
                onChange={(e) => setSoLuongToiDa(e.target.value)}
                min={1}
                step={1}
                placeholder="Để trống nếu không giới hạn"
                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 outline-none text-sm bg-slate-50/30 transition-colors ${soLuongToiDaError ? errorInputClass : normalInputClass}`}
              />
              {soLuongToiDaError ? (
                <p className="text-[10px] text-rose-500 font-bold mt-1">{soLuongToiDaError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium mt-1">Mỗi khách dùng mã này tối đa bấy nhiêu lần — không giới hạn tổng số khách khác nhau.</p>
              )}
            </div>
            <div>
              <label htmlFor="ngay_bat_dau" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày bắt đầu *
              </label>
              <input
                id="ngay_bat_dau"
                name="ngay_bat_dau"
                type="date"
                defaultValue={editingVoucher?.ngay_bat_dau ? editingVoucher.ngay_bat_dau.split('T')[0] : formatLocalDate(new Date())}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>
            <div>
              <label htmlFor="ngay_het_han" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày hết hạn
              </label>
              <input
                id="ngay_het_han"
                name="ngay_het_han"
                type="date"
                defaultValue={editingVoucher?.ngay_het_han ? editingVoucher.ngay_het_han.split('T')[0] : ''}
                placeholder="Không giới hạn"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-slate-50/30"
              />
            </div>

            {/* Hình thức thanh toán yêu cầu — multi-select: có thể áp dụng cho nhiều hình thức cùng lúc */}
            <div className="col-span-2 border-t border-slate-100 pt-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Yêu cầu Hình thức thanh toán
              </label>
              <div className="flex flex-wrap gap-2">
                <label
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${yeuCauThanhToan.includes('tat_ca')
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={yeuCauThanhToan.includes('tat_ca')}
                    onChange={toggleAllPaymentMethods}
                    className="accent-primary"
                  />
                  Tất cả hình thức
                </label>
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${yeuCauThanhToan.includes(opt.value)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={yeuCauThanhToan.includes(opt.value)}
                      onChange={() => togglePaymentMethod(opt.value)}
                      className="accent-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-650 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/95 shadow-lg shadow-teal-500/20 transition-all text-sm"
            >
              {editingVoucher?.id ? 'Lưu thay đổi' : 'Kích hoạt ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

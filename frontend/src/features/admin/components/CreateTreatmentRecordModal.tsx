import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';

interface CreateTreatmentRecordModalProps {
  selectedAppointment: any;
  roomsList: any[];
  staffList: any[];
  packages: any[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function CreateTreatmentRecordModal({
  selectedAppointment,
  roomsList,
  staffList,
  packages,
  onClose,
  onSubmit
}: CreateTreatmentRecordModalProps) {
  const user = useAuthStore(state => state.user);

  const [bacSiId, setBacSiId] = useState<string>('');
  const [phongKhamId, setPhongKhamId] = useState<string>('');
  const [trieuChung, setTrieuChung] = useState<string>('');
  const [ghiChu, setGhiChu] = useState<string>('');
  const [phuongPhapDieuTri, setPhuongPhapDieuTri] = useState<string>('');
  const [loaiGoi, setLoaiGoi] = useState<'co_dinh' | 'tu_chon'>('co_dinh');
  const [goiDichVuId, setGoiDichVuId] = useState<string>('');
  const [tenGoi, setTenGoi] = useState<string>('');
  const [soLuongBuoi, setSoLuongBuoi] = useState<number>(1);
  const [giaTien, setGiaTien] = useState<number>(0);
  const [chanDoan, setChanDoan] = useState<string>('');
  const [soLuongGoi, setSoLuongGoi] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customBasePackageId, setCustomBasePackageId] = useState<string>('');
  const [customUnitPrice, setCustomUnitPrice] = useState<number>(0);

  // Filter staff list to only show Bác sĩ
  const doctorsList = staffList.filter(s => s.vai_tro === 'Bác sĩ' && s.trang_thai === 'hoat_dong');

  useEffect(() => {
    if (selectedAppointment) {
      setTrieuChung(selectedAppointment.ly_do_kham || '');
      setPhongKhamId(selectedAppointment.phong_id ? String(selectedAppointment.phong_id) : '');
      
      // Auto-select doctor id if logged-in user is a Doctor
      if (user?.vai_tro_id === 4) {
        const matchingDoc = staffList.find(s => s.nguoi_dung_id === user.id);
        if (matchingDoc) {
          setBacSiId(matchingDoc.ky_thuat_vien_id || matchingDoc.id);
        }
      } else if (selectedAppointment.ky_thuat_vien_id) {
        setBacSiId(selectedAppointment.ky_thuat_vien_id);
      }
    }
  }, [selectedAppointment, user, staffList]);

  const handlePackageChange = (id: string) => {
    setGoiDichVuId(id);
    if (!id) {
      setTenGoi('');
      setSoLuongBuoi(1);
      setGiaTien(0);
      return;
    }
    const selected = packages.find(pkg => pkg.id === id);
    if (selected) {
      setTenGoi(selected.ten_goi);
      setSoLuongBuoi(selected.tong_so_buoi);
      setGiaTien(Number(selected.gia_goi));
    }
  };

  const handleCustomBasePackageChange = (id: string) => {
    setCustomBasePackageId(id);
    if (!id) {
      setTenGoi('');
      setSoLuongBuoi(1);
      setGiaTien(0);
      setCustomUnitPrice(0);
      return;
    }
    const selected = packages.find(pkg => pkg.id === id);
    if (selected) {
      setTenGoi(selected.ten_goi);
      setSoLuongBuoi(1);
      const unitPrice = Math.round(Number(selected.gia_goi) / selected.tong_so_buoi);
      setCustomUnitPrice(unitPrice);
      setGiaTien(unitPrice);
    }
  };

  const handleCustomSessionsChange = (val: number) => {
    const sessions = Math.max(1, val);
    setSoLuongBuoi(sessions);
    if (customUnitPrice > 0) {
      setGiaTien(sessions * customUnitPrice);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bacSiId) return;

    try {
      setIsSubmitting(true);
      const payload = {
        lich_dat_id: selectedAppointment.id,
        khach_hang_id: selectedAppointment.khach_hang_id,
        ho_ten_khach: selectedAppointment.ten_khach_hang,
        so_dien_thoai: selectedAppointment.so_dien_thoai,
        trieu_chung: trieuChung,
        bac_si_id: bacSiId,
        phong_kham_id: phongKhamId ? Number(phongKhamId) : null,
        ghi_chu: ghiChu,
        phuong_phap_dieu_tri: phuongPhapDieuTri,
        loai_goi: loaiGoi,
        goi_dich_vu_id: loaiGoi === 'co_dinh' ? (goiDichVuId || null) : null,
        ten_goi: tenGoi,
        so_luong_buoi: soLuongBuoi,
        gia_tien: giaTien,
        chan_doan: chanDoan,
        so_luong_goi: loaiGoi === 'co_dinh' ? soLuongGoi : 1
      };
      await onSubmit(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Lập Hồ Sơ Điều Trị Lâm Sàng
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Chẩn đoán và chỉ định liệu trình cho bệnh nhân</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Patient Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-zinc-200/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bệnh nhân</span>
              <span className="text-sm font-bold text-slate-850 block mt-0.5">{selectedAppointment?.ten_khach_hang}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Số điện thoại</span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">{selectedAppointment?.so_dien_thoai || 'Chưa cung cấp'}</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Mã ca khám gốc</span>
              <span className="text-sm font-mono font-bold text-emerald-600 block mt-0.5">{selectedAppointment?.ma_lich_dat}</span>
            </div>
          </div>

          {/* Clinical Doctor & Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bác sĩ khám lâm sàng *</label>
              <select
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                value={bacSiId}
                onChange={(e) => setBacSiId(e.target.value)}
              >
                <option value="">-- Chọn Bác sĩ khám --</option>
                {doctorsList.map(doc => (
                  <option key={doc.ky_thuat_vien_id || doc.id} value={doc.ky_thuat_vien_id || ''}>
                    {doc.ho_ten}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phòng khám thực hiện</label>
              <select
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                value={phongKhamId}
                onChange={(e) => setPhongKhamId(e.target.value)}
              >
                <option value="">-- Chưa xếp phòng khám --</option>
                {roomsList.map(r => (
                  <option key={r.id} value={r.id}>{r.ten_phong}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Symptoms & Diagnostics */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mô tả triệu chứng / Lý do khám</label>
            <textarea
              readOnly
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-600 min-h-[60px] cursor-not-allowed resize-none italic"
              value={trieuChung ? `"${trieuChung}"` : '"Không mô tả triệu chứng"'}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chẩn đoán y khoa *</label>
            <textarea
              required
              placeholder="Nhập chẩn đoán lâm sàng của bác sĩ..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[70px]"
              value={chanDoan}
              onChange={(e) => setChanDoan(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phương pháp điều trị / Chỉ định y học *</label>
            <input
              required
              type="text"
              placeholder="Ví dụ: Di động cột sống thắt lưng, xung điện trị liệu..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={phuongPhapDieuTri}
              onChange={(e) => setPhuongPhapDieuTri(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ghi chú y khoa thêm</label>
            <textarea
              placeholder="Ví dụ: Bệnh nhân mẫn cảm nhẹ với nhiệt lượng cao, tránh kéo giãn khớp quá độ..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[70px]"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
            />
          </div>

          {/* Service Package Selection */}
          <div className="space-y-4 border-t border-zinc-100 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Gói dịch vụ trị liệu chỉ định</label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => { setLoaiGoi('co_dinh'); handlePackageChange(''); }}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    loaiGoi === 'co_dinh' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Gói Cố Định
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoaiGoi('tu_chon');
                    setGoiDichVuId('');
                    setTenGoi('');
                    setSoLuongBuoi(1);
                    setGiaTien(0);
                    setCustomBasePackageId('');
                    setCustomUnitPrice(0);
                  }}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    loaiGoi === 'tu_chon' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Gói Tự Chọn
                </button>
              </div>
            </div>

            {loaiGoi === 'co_dinh' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chọn gói thiết lập sẵn</span>
                    <select
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                      value={goiDichVuId}
                      onChange={(e) => handlePackageChange(e.target.value)}
                    >
                      <option value="">-- Chọn gói cố định sẵn có --</option>
                      {packages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.ten_goi} ({pkg.tong_so_buoi} buổi - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.gia_goi)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Số lượng gói *</span>
                    <input
                      required={loaiGoi === 'co_dinh'}
                      type="number"
                      min="1"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={soLuongGoi}
                      onChange={(e) => setSoLuongGoi(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>
                {goiDichVuId && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Tổng số buổi:</span>
                      <span className="font-extrabold text-slate-800">{soLuongBuoi * soLuongGoi} buổi (gồm {soLuongGoi} gói)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Tổng chi phí gói:</span>
                      <span className="font-extrabold text-emerald-600 font-mono">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(giaTien * soLuongGoi)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chọn gói dịch vụ gốc (Mẫu thiết lập sẵn)</span>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                    value={customBasePackageId}
                    onChange={(e) => handleCustomBasePackageChange(e.target.value)}
                  >
                    <option value="">-- Tự nhập thủ công (Không chọn mẫu) --</option>
                    {packages.map(pkg => {
                      const unitPrice = Math.round(Number(pkg.gia_goi) / pkg.tong_so_buoi);
                      return (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.ten_goi} (Gốc: {pkg.tong_so_buoi} buổi | Giá 1 buổi: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(unitPrice)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tên gói tự chọn *</span>
                    <input
                      required={loaiGoi === 'tu_chon'}
                      type="text"
                      placeholder="Nhập tên liệu trình..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={tenGoi}
                      onChange={(e) => setTenGoi(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Số lượng buổi *</span>
                    <input
                      required={loaiGoi === 'tu_chon'}
                      type="number"
                      min="1"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={soLuongBuoi}
                      onChange={(e) => handleCustomSessionsChange(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Giá tiền gói (VNĐ) *</span>
                    <input
                      required={loaiGoi === 'tu_chon'}
                      type="number"
                      min="0"
                      placeholder="Nhập tổng số tiền..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={giaTien}
                      onChange={(e) => setGiaTien(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                </div>

                {customUnitPrice > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold">Cách tính giá tự chọn:</span>
                      <span className="font-semibold text-slate-600">
                        {soLuongBuoi} buổi × {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customUnitPrice)}/buổi
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 active:scale-95"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Clipboard, Activity } from 'lucide-react';

interface AssignTreatmentModalProps {
  record: any;
  staffList: any[];
  roomsList: any[];
  onClose: () => void;
  onSubmit: (ktvId: string, roomId: string) => Promise<void>;
}

export default function AssignTreatmentModal({
  record,
  staffList,
  roomsList,
  onClose,
  onSubmit
}: AssignTreatmentModalProps) {
  const [ktvId, setKtvId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter KTV list
  const ktvsList = staffList.filter(
    s => s.vai_tro === 'Kỹ thuật viên' && s.trang_thai === 'hoat_dong'
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktvId || !roomId) return;

    try {
      setIsSubmitting(true);
      await onSubmit(ktvId, roomId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Clipboard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Phân Công & Điều Phối Trị Liệu
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Xác định kỹ thuật viên và phòng trị liệu chuyên biệt</p>
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
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Patient Info Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-zinc-200/50 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bệnh nhân</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{record.ho_ten_khach}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Số điện thoại</span>
                <span className="text-sm font-semibold text-slate-700 mt-0.5 block">{record.so_dien_thoai || 'Chưa cung cấp'}</span>
              </div>
              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-zinc-200/50 pt-2">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Triệu chứng ban đầu</span>
                  <span className="text-xs text-slate-650 mt-0.5 block italic">"{record.trieu_chung || 'Không mô tả triệu chứng'}"</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chẩn đoán từ Bác sĩ</span>
                  <span className="text-xs text-slate-800 mt-0.5 block font-bold">"{record.chan_doan || 'Không có chẩn đoán chi tiết'}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Prescriptions */}
          <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/50 space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} /> Chỉ định lâm sàng từ Bác sĩ
            </h4>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700">
              <div>
                <span className="font-bold">Phương pháp điều trị: </span>
                <span className="font-medium text-slate-800">{record.phuong_phap_dieu_tri}</span>
              </div>
              {record.ghi_chu && (
                <div>
                  <span className="font-bold">Ghi chú y khoa: </span>
                  <span className="font-medium text-slate-600 italic">"{record.ghi_chu}"</span>
                </div>
              )}
              <div className="border-t border-emerald-100/50 pt-2 grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="font-bold block">Gói trị liệu:</span>
                  <span className="text-emerald-700 font-extrabold">
                    {record.ten_goi} {record.so_luong_goi > 1 && `(x${record.so_luong_goi} gói)`}
                  </span>
                </div>
                <div>
                  <span className="font-bold block">Tổng số buổi:</span>
                  <span className="font-extrabold text-slate-800">
                    {(record.so_luong_buoi || 1) * (record.so_luong_goi || 1)} buổi {record.so_luong_goi > 1 && `(gồm ${record.so_luong_goi} gói)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Fields */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-zinc-100 pb-2">
              Lựa chọn Điều phối
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kỹ thuật viên trị liệu *</label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  value={ktvId}
                  onChange={(e) => setKtvId(e.target.value)}
                >
                  <option value="">-- Chọn Kỹ thuật viên --</option>
                  {ktvsList.map(ktv => (
                    <option key={ktv.ky_thuat_vien_id || ktv.id} value={ktv.ky_thuat_vien_id || ktv.id}>
                      {ktv.ho_ten}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phòng trị liệu thực hiện *</label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                >
                  <option value="">-- Chọn Phòng trị liệu --</option>
                  {roomsList.map(r => (
                    <option key={r.id} value={r.id}>{r.ten_phong}</option>
                  ))}
                </select>
              </div>
            </div>
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
              disabled={isSubmitting || !ktvId || !roomId}
              className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 active:scale-95"
            >
              {isSubmitting ? 'Đang điều phối...' : 'Xác nhận điều phối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

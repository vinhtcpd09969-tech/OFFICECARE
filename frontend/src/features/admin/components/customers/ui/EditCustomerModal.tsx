import { Edit3 } from 'lucide-react';
import type { CustomerEditForm } from '../hooks/useCustomerActions';

interface EditCustomerModalProps {
  isOpen: boolean;
  form: CustomerEditForm;
  onChange: (form: CustomerEditForm) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditCustomerModal({ isOpen, form, onChange, onSave, onCancel }: EditCustomerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-scale-up">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <Edit3 size={16} className="text-teal-600" />
            Cập nhật thông tin hành chính
          </h3>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Họ và tên</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              value={form.ho_ten}
              onChange={(e) => onChange({ ...form, ho_ten: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Số điện thoại</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              value={form.so_dien_thoai}
              onChange={(e) => onChange({ ...form, so_dien_thoai: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Giới tính</label>
            <select
              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-teal-500/15 cursor-pointer"
              value={form.gioi_tinh}
              onChange={(e) => onChange({ ...form, gioi_tinh: e.target.value })}
            >
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
              <option value="khac">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Ngày sinh</label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              value={form.ngay_sinh}
              onChange={(e) => onChange({ ...form, ngay_sinh: e.target.value })}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Địa chỉ thường trú</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              value={form.dia_chi}
              onChange={(e) => onChange({ ...form, dia_chi: e.target.value })}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Điểm uy tín (0 – 100)</label>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              value={form.diem_uy_tin}
              onChange={(e) => onChange({ ...form, diem_uy_tin: Math.max(0, Math.min(100, Number(e.target.value))) })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2 text-xs">
          <button
            type="button"
            onClick={onSave}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
          >
            Lưu thay đổi
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all active:scale-95"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}

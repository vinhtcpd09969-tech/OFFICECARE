import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPackage, updatePackage } from '../../../api/admin.api';
import { useState } from 'react';

const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên liệu trình là bắt buộc'),
  ma_goi: z.string().optional(),
  mo_ta: z.string().optional(),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  gia_tien: z.number().min(0, 'Giá tiền không hợp lệ'),
  han_dung_thang: z.number().min(1, 'Hạn dùng phải lớn hơn 0'),
  so_dv_toi_da_moi_buoi: z.number().min(1, 'Số dịch vụ mỗi buổi phải lớn hơn 0').default(5),
  chi_tiet_dich_vu: z.array(z.object({
    dich_vu_id: z.string(),
    so_buoi: z.number().min(1),
    so_lan_toi_da_trong_goi: z.number().min(1),
    bat_buoc: z.boolean().default(true),
    thu_tu_thuc_hien: z.number().min(0).default(0)
  })).default([]),
  hien_thi_website: z.boolean().default(true),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

export type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageModalProps {
  services: any[];
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: any;
}

export default function PackageModal({ services, onClose, onSuccess, editingPackage }: PackageModalProps) {
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<string>('');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: editingPackage ? {
      ten_goi: editingPackage.ten_goi || '',
      ma_goi: editingPackage.ma_goi || '',
      mo_ta: editingPackage.mo_ta || '',
      tong_so_buoi: editingPackage.tong_so_buoi || 10,
      gia_tien: typeof editingPackage.gia_tien === 'string' ? parseInt(editingPackage.gia_tien) : (editingPackage.gia_tien || 0),
      han_dung_thang: editingPackage.han_dung_thang || 6,
      so_dv_toi_da_moi_buoi: editingPackage.so_dv_toi_da_moi_buoi || 5,
      hien_thi_website: editingPackage.hien_thi_website !== undefined ? editingPackage.hien_thi_website : true,
      trang_thai: editingPackage.trang_thai || 'hoat_dong',
      chi_tiet_dich_vu: editingPackage.chi_tiet_dich_vu ? editingPackage.chi_tiet_dich_vu.map((item: any) => ({
        dich_vu_id: String(item.dich_vu_id),
        so_buoi: item.so_buoi || item.so_buoi_trong_goi || editingPackage.tong_so_buoi || 10,
        so_lan_toi_da_trong_goi: item.so_lan_toi_da_trong_goi || item.so_buoi || item.so_buoi_trong_goi || editingPackage.tong_so_buoi || 10,
        bat_buoc: item.bat_buoc !== undefined ? item.bat_buoc : true,
        thu_tu_thuc_hien: item.thu_tu_thuc_hien || 0
      })) : []
    } : {
      trang_thai: 'hoat_dong',
      tong_so_buoi: 10,
      han_dung_thang: 6,
      so_dv_toi_da_moi_buoi: 5,
      gia_tien: 0,
      hien_thi_website: true,
      chi_tiet_dich_vu: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'chi_tiet_dich_vu'
  });

  const watchTongSoBuoi = watch('tong_so_buoi') || 10;
  const watchStatus = watch('trang_thai');

  // Filter out services that are already added
  const availableServicesToAdd = services.filter(
    svc => !fields.some(field => field.dich_vu_id === String(svc.id))
  );

  const handleAddService = () => {
    if (!selectedServiceToAdd) return;
    const svc = services.find(s => String(s.id) === selectedServiceToAdd);
    if (svc) {
      append({
        dich_vu_id: String(svc.id),
        so_buoi: watchTongSoBuoi,
        so_lan_toi_da_trong_goi: watchTongSoBuoi,
        bat_buoc: true,
        thu_tu_thuc_hien: fields.length + 1
      });
      setSelectedServiceToAdd('');
    }
  };

  const onSubmit = async (data: PackageFormValues) => {
    try {
      // Ensure so_buoi matches so_lan_toi_da_trong_goi for sync
      const payload = {
        ...data,
        chi_tiet_dich_vu: data.chi_tiet_dich_vu.map(item => ({
          ...item,
          so_buoi: item.so_lan_toi_da_trong_goi
        }))
      };

      if (editingPackage) {
        await updatePackage(editingPackage.id, payload);
      } else {
        await createPackage(payload);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Có lỗi xảy ra khi lưu cấu hình liệu trình');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] text-white animate-in slide-in-from-bottom-8 duration-300">
        
        {/* HUD Modal Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
            <h3 className="text-md font-bold font-mono tracking-wider uppercase">
              {editingPackage ? `[CẬP NHẬT] LIỆU TRÌNH ĐIỀU TRỊ` : `[THIẾT LẬP] LIỆU TRÌNH ĐIỀU TRỊ`}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white font-mono text-xs border border-slate-800 hover:border-slate-600 px-2 py-1 rounded bg-slate-900 transition-all"
          >
            [ESC]
          </button>
        </div>
        
        {/* Form Body */}
        <form id="packageForm" onSubmit={handleSubmit(onSubmit as any)} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-xs font-mono">
          
          {/* Main Package Details Section */}
          <div className="bg-slate-950/50 p-4 border border-slate-800/80 rounded space-y-4">
            <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest border-b border-slate-850 pb-1.5 mb-3">
              [I] THÔNG TIN ĐỊNH DANH LIỆU TRÌNH
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">TÊN LIỆU TRÌNH ĐIỀU TRỊ *</label>
                <input 
                  {...register('ten_goi')} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-bold text-white placeholder-slate-700"
                  placeholder="VD: Cervical Spine Recovery..."
                />
                {errors.ten_goi && <p className="text-rose-500 text-[10px] mt-1">{errors.ten_goi.message}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">MÃ LIỆU TRÌNH (NHẬN DIỆN)</label>
                <input 
                  {...register('ma_goi')} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-bold text-teal-400 uppercase placeholder-slate-700"
                  placeholder="Hệ thống tự tạo nếu bỏ trống..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">GIÁ BÁN (VNĐ) *</label>
                <input 
                  type="number"
                  {...register('gia_tien', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 outline-none transition-all font-bold text-white text-right"
                  placeholder="0"
                />
                {errors.gia_tien && <p className="text-rose-500 text-[10px] mt-1">{errors.gia_tien.message}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">TỔNG SỐ BUỔI *</label>
                <input 
                  type="number"
                  {...register('tong_so_buoi', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 outline-none transition-all font-bold text-white text-center"
                  placeholder="10"
                />
                {errors.tong_so_buoi && <p className="text-rose-500 text-[10px] mt-1">{errors.tong_so_buoi.message}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">HẠN DÙNG (THÁNG) *</label>
                <input 
                  type="number"
                  {...register('han_dung_thang', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 outline-none transition-all font-bold text-white text-center"
                  placeholder="6"
                />
                {errors.han_dung_thang && <p className="text-rose-500 text-[10px] mt-1">{errors.han_dung_thang.message}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">SL DỊCH VỤ/BUỔI TỐI ĐA *</label>
                <input 
                  type="number"
                  {...register('so_dv_toi_da_moi_buoi', { valueAsNumber: true })} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 outline-none transition-all font-bold text-white text-center"
                  placeholder="5"
                />
                {errors.so_dv_toi_da_moi_buoi && <p className="text-rose-500 text-[10px] mt-1">{errors.so_dv_toi_da_moi_buoi.message}</p>}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">MÔ TẢ ĐỊNH HƯỚNG ĐIỀU TRỊ</label>
              <textarea 
                {...register('mo_ta')} 
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-white placeholder-slate-700 resize-none font-medium text-xs"
                placeholder="Mô tả tóm tắt phác đồ điều trị của liệu trình..."
              />
            </div>
          </div>

          {/* Dynamic Service Configuration Table */}
          <div className="bg-slate-950/50 p-4 border border-slate-800 rounded space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-2">
              <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                [II] CẤU HÌNH DỊCH VỤ CHI TIẾT TRONG GÓI
              </h4>
              
              {/* Service Adder Dropdown & Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedServiceToAdd}
                  onChange={(e) => setSelectedServiceToAdd(e.target.value)}
                  className="px-2 py-1 bg-slate-950 border border-slate-850 rounded text-slate-300 focus:border-teal-500 outline-none text-[11px] font-bold"
                >
                  <option value="">-- CHỌN DỊCH VỤ TRỊ LIỆU --</option>
                  {availableServicesToAdd.map(s => (
                    <option key={s.id} value={String(s.id)}>
                      {s.ten_dich_vu.toUpperCase()} ({s.loai_dich_vu === 'bo_sung' ? 'BỔ TRỢ' : 'LINH ĐỘNG'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddService}
                  disabled={!selectedServiceToAdd}
                  className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white font-mono text-[11px] font-bold tracking-wider px-3 py-1 rounded transition-all flex-shrink-0"
                >
                  [+ THÊM]
                </button>
              </div>
            </div>

            {/* List of Configured Services */}
            {fields.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-850 rounded font-mono text-[11px]">
                CHƯA CÓ DỊCH VỤ NÀO ĐƯỢC CẤU HÌNH TRONG LIỆU TRÌNH. VUI LÒNG THÊM DỊCH VỤ PHÍA TRÊN.
              </div>
            ) : (
              <div className="border border-slate-850 rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-850">
                      <th className="p-2.5 font-bold">#</th>
                      <th className="p-2.5 font-bold">Dịch vụ trị liệu</th>
                      <th className="p-2.5 font-bold text-center">Bắt buộc</th>
                      <th className="p-2.5 font-bold text-center">Hạn mức/Gói (Lần)</th>
                      <th className="p-2.5 font-bold text-center">Thứ tự</th>
                      <th className="p-2.5 font-bold text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {fields.map((field, idx) => {
                      const svc = services.find(s => s.id === field.dich_vu_id);
                      return (
                        <tr key={field.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-white">
                            <span className="block">{svc ? svc.ten_dich_vu : 'Không xác định'}</span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {svc?.loai_dich_vu === 'bo_sung' ? '[Bổ trợ]' : '[Linh động]'} • {svc?.thoi_gian_uoc_tinh} Phút
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <Controller
                              name={`chi_tiet_dich_vu.${idx}.bat_buoc`}
                              control={control}
                              render={({ field: batBuocField }) => (
                                <button
                                  type="button"
                                  onClick={() => batBuocField.onChange(!batBuocField.value)}
                                  className={`w-14 py-1 text-[9px] font-bold rounded border tracking-wider transition-colors ${
                                    batBuocField.value
                                      ? 'bg-teal-950 border-teal-800 text-teal-400'
                                      : 'bg-slate-950 border-slate-850 text-slate-500'
                                  }`}
                                >
                                  {batBuocField.value ? '[YES]' : '[NO]'}
                                </button>
                              )}
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              max={watchTongSoBuoi}
                              {...register(`chi_tiet_dich_vu.${idx}.so_lan_toi_da_trong_goi` as const, { valueAsNumber: true })}
                              className="w-16 px-1.5 py-1 bg-slate-950 border border-slate-800 rounded focus:border-teal-500 outline-none text-center font-bold font-mono text-white"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              {...register(`chi_tiet_dich_vu.${idx}.thu_tu_thuc_hien` as const, { valueAsNumber: true })}
                              className="w-12 px-1.5 py-1 bg-slate-950 border border-slate-800 rounded focus:border-teal-500 outline-none text-center font-bold font-mono text-white"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => remove(idx)}
                              className="text-rose-500 hover:text-rose-400 font-mono tracking-wider hover:underline"
                            >
                              [XÓA]
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Website visibility and status controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 p-4 border border-slate-800 rounded flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-300">HIỂN THỊ TRÊN WEBSITE</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Bệnh nhân có thể tra cứu trực tuyến</p>
              </div>
              <Controller
                name="hien_thi_website"
                control={control}
                render={({ field }) => (
                  <button 
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-colors ${field.value ? 'bg-teal-600 justify-end' : 'bg-slate-800 justify-start'}`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow transform transition-transform"></div>
                  </button>
                )}
              />
            </div>

            <div className="bg-slate-950/50 p-4 border border-slate-800 rounded flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-300">TRẠNG THÁI HOẠT ĐỘNG</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Đang điều trị lâm sàng tại clinic</p>
              </div>
              <div 
                className="px-3 py-1 bg-slate-950 border border-slate-850 rounded flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setValue('trang_thai', watchStatus === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong')}
              >
                <span className={`font-bold font-mono text-[10px] ${watchStatus === 'hoat_dong' ? 'text-teal-400' : 'text-slate-500'}`}>
                  {watchStatus === 'hoat_dong' ? 'ACTIVE' : 'OFFLINE'}
                </span>
                <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${watchStatus === 'hoat_dong' ? 'bg-teal-600' : 'bg-slate-800'}`}>
                  <div className={`bg-white w-3 h-3 rounded-full shadow transform transition-transform ${watchStatus === 'hoat_dong' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>
          </div>

        </form>
        
        {/* Pinned Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 shrink-0 flex gap-3 font-mono text-xs">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-650 hover:bg-slate-850 text-slate-400 font-bold rounded transition-colors active:scale-95 text-center"
          >
            [ HỦY BỎ ]
          </button>
          <button 
            form="packageForm"
            type="submit"
            className="flex-1 px-4 py-2.5 bg-teal-600 border border-teal-500 hover:bg-teal-500 text-white font-bold rounded transition-colors active:scale-95 shadow-md text-center"
          >
            [ LƯU CẤU HÌNH ]
          </button>
        </div>
      </div>
    </div>
  );
}

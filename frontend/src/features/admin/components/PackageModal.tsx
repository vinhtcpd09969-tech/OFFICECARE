import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPackage, updatePackage, getCategories } from '../../../api/admin.api';
import { useEffect, useState } from 'react';

const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên gói dịch vụ là bắt buộc'),
  ma_goi: z.string().optional(),
  mo_ta: z.string().optional(),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  thoi_luong_buoi_phut: z.number().min(1, 'Thời lượng buổi phải lớn hơn 0').default(60),
  gia_tien: z.number().min(0, 'Giá bán không hợp lệ'),
  gia_goc: z.number().min(0, 'Giá gốc không hợp lệ').optional().nullable(),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu']),
  danh_muc_id: z.number().min(1, 'Vui lòng chọn danh mục chuyên khoa').optional().nullable(),
});

export type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: any;
  existingPackages: any[];
}

export default function PackageModal({ onClose, onSuccess, editingPackage, existingPackages }: PackageModalProps) {
  const [categories, setCategories] = useState<any[]>([]);

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: editingPackage ? {
      ten_goi: editingPackage.ten_goi || '',
      ma_goi: editingPackage.ma_goi || '',
      mo_ta: editingPackage.mo_ta || '',
      tong_so_buoi: editingPackage.tong_so_buoi || 10,
      thoi_luong_buoi_phut: editingPackage.thoi_luong_buoi_phut || 60,
      gia_tien: typeof editingPackage.gia_tien === 'string' ? parseInt(editingPackage.gia_tien) : (editingPackage.gia_tien || 0),
      gia_goc: editingPackage.gia_goc !== undefined && editingPackage.gia_goc !== null ? (typeof editingPackage.gia_goc === 'string' ? parseInt(editingPackage.gia_goc) : editingPackage.gia_goc) : undefined,
      trang_thai: editingPackage.trang_thai || 'hoat_dong',
      danh_muc_id: editingPackage.danh_muc_id ? Number(editingPackage.danh_muc_id) : undefined,
    } : {
      trang_thai: 'hoat_dong',
      tong_so_buoi: 12,
      thoi_luong_buoi_phut: 60,
      gia_tien: 0,
      gia_goc: undefined,
      danh_muc_id: undefined,
    }
  });

  const watchStatus = watch('trang_thai');

  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await getCategories();
        setCategories((res.data || []).filter((c: any) => c.an_hien !== false && c.loai_danh_muc === 'goi'));
      } catch (e) {
        console.error('Lỗi khi tải danh mục trong PackageModal:', e);
      }
    };
    loadCats();
  }, []);

  const onSubmit = async (data: PackageFormValues) => {
    try {
      const isEdit = !!(editingPackage && editingPackage.id);

      // Validate unique name
      const inputName = data.ten_goi.trim().toLowerCase();
      const isDuplicate = existingPackages.some((pkg: any) => {
        if (isEdit && pkg.id === editingPackage.id) return false;
        return pkg.ten_goi.trim().toLowerCase() === inputName;
      });

      if (isDuplicate) {
        setError('ten_goi', {
          type: 'manual',
          message: `Tên gói "${data.ten_goi}" đã tồn tại trên hệ thống. Vui lòng nhập tên khác!`
        });
        return;
      }

      const payload = {
        ...data,
        han_dung_thang: editingPackage?.han_dung_thang || 12,
        chi_tiet_dich_vu: editingPackage ? (editingPackage.chi_tiet_dich_vu || []).map((item: any) => ({
          dich_vu_id: String(item.dich_vu_id),
          thu_tu_thuc_hien: item.thu_tu_thuc_hien || 0
        })) : []
      };

      if (isEdit) {
        await updatePackage(editingPackage.id, payload);
      } else {
        await createPackage(payload);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving package:', error);
      alert(editingPackage && editingPackage.id ? 'Có lỗi xảy ra khi cập nhật gói' : 'Có lỗi xảy ra khi tạo gói');
    }
  };

  return (
    <div className="fixed inset-0 bg-secondary/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 text-secondary">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <h3 className="text-sm font-bold font-heading tracking-wide uppercase">
              {editingPackage && editingPackage.id ? `[CHỈNH SỬA] GÓI DỊCH VỤ` : `[TẠO MỚI] GÓI DỊCH VỤ`}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-zinc-400 hover:text-secondary text-xs border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-xl bg-white shadow-sm transition-all"
          >
            [ ĐÓNG ]
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-xs">
            
            {/* HỘP I: ĐỊNH DANH GÓI DỊCH VỤ */}
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">Hộp I: Định danh gói dịch vụ</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tên gói dịch vụ / Gói trị liệu *</label>
                  <input 
                    {...register('ten_goi')} 
                    placeholder="Nhập tên gói dịch vụ..."
                    className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                  />
                  {errors.ten_goi && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_goi.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Mã gói dịch vụ (Tùy chọn)</label>
                  <input 
                    {...register('ma_goi')} 
                    placeholder="Mã tự động sinh..."
                    className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                  />
                </div>
              </div>

              {/* CHUYÊN KHOA PHỤ TRÁCH */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Danh mục chuyên khoa gói *</label>
                  <select 
                    {...register('danh_muc_id', { valueAsNumber: true })}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                  >
                    <option value="">-- CHỌN DANH MỤC CHUYÊN KHOA --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.ten_danh_muc.toUpperCase()}</option>
                    ))}
                  </select>
                  {errors.danh_muc_id && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.danh_muc_id.message}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Mô tả phác đồ & Định hướng gói</label>
                <textarea 
                  {...register('mo_ta')} 
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-355 resize-none font-medium text-xs shadow-sm"
                  placeholder="Mô tả định hướng điều trị hoặc phân tích y khoa cho gói..."
                ></textarea>
              </div>
            </div>

            {/* HỘP II: THÔNG SỐ VẬN HÀNH & KINH TẾ */}
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-5">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">Hộp II: Thông số vận hành & Kinh tế</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tổng số buổi điều trị *</label>
                  <input 
                    type="number"
                    {...register('tong_so_buoi', { valueAsNumber: true })} 
                    placeholder="12"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                  />
                  {errors.tong_so_buoi && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.tong_so_buoi.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Thời lượng mỗi buổi (Phút) *</label>
                  <input 
                    type="number"
                    {...register('thoi_luong_buoi_phut', { valueAsNumber: true })} 
                    placeholder="60"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                  />
                  {errors.thoi_luong_buoi_phut && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.thoi_luong_buoi_phut.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Giá bán trọn gói (VND) *</label>
                  <input 
                    type="number"
                    {...register('gia_tien', { valueAsNumber: true })} 
                    placeholder="6000000"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                  />
                  {errors.gia_tien && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.gia_tien.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Giá gốc (VND) (Tùy chọn)</label>
                  <input 
                    type="number"
                    {...register('gia_goc', { valueAsNumber: true })} 
                    placeholder="7000000"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary shadow-sm text-sm"
                  />
                  {errors.gia_goc && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.gia_goc.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* TRẠNG THÁI HOẠT ĐỘNG */}
            <div 
              className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 flex items-center justify-between cursor-pointer shadow-sm hover:border-zinc-300 transition-all"
              onClick={() => setValue('trang_thai', watchStatus === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong')}
            >
              <div>
                <h5 className="font-bold text-secondary text-xs uppercase tracking-wider">Trạng thái gói</h5>
                <p className="text-[10px] text-zinc-400 mt-0.5">Quyết định hiển thị và khả năng sử dụng gói trên toàn hệ thống</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  watchStatus === 'hoat_dong' ? 'text-primary' : 'text-zinc-400'
                }`}>
                  {watchStatus === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}
                </span>
                <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors duration-200 ${watchStatus === 'hoat_dong' ? 'bg-primary' : 'bg-zinc-200'}`}>
                  <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition-transform duration-200 ${watchStatus === 'hoat_dong' ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-secondary font-bold rounded-xl shadow-sm transition-all text-center"
            >
              HỦY BỎ
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm hover:shadow-soft-button transition-all text-center"
            >
              {editingPackage && editingPackage.id ? 'CẬP NHẬT CẤU HÌNH' : 'TẠO GÓI MỚI'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getEquipment, createEquipment } from '../../api/admin.api';
import { format } from 'date-fns';

const equipmentSchema = z.object({
  ten_thiet_bi: z.string().min(1, 'Tên thiết bị là bắt buộc'),
  loai_thiet_bi: z.string().optional(),
  ngay_mua: z.string().optional(),
  ngay_bao_tri_tiep_theo: z.string().optional(),
  trang_thai: z.enum(['san_sang', 'dang_su_dung', 'dang_bao_tri', 'hong']),
  phong_id_hien_tai: z.number().optional(),
  ghi_chu: z.string().optional()
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export default function ManageEquipment() {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      trang_thai: 'san_sang'
    }
  });

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await getEquipment();
      setEquipmentList(res.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const onSubmit = async (data: EquipmentFormValues) => {
    try {
      await createEquipment(data);
      setIsModalOpen(false);
      reset();
      fetchEquipment();
    } catch (error: any) {
      console.error('Error creating equipment:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thiết bị');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Thiết bị Y tế</h2>
          <p className="text-slate-500 mt-1">Danh sách máy móc, thiết bị và lịch bảo trì.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> Thêm Thiết bị
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Mã Máy</th>
                <th className="p-4 font-semibold">Tên thiết bị</th>
                <th className="p-4 font-semibold">Loại máy</th>
                <th className="p-4 font-semibold">Ngày bảo trì tới</th>
                <th className="p-4 font-semibold">Phòng đặt máy</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Chưa có thiết bị nào.</td>
                </tr>
              ) : (
                equipmentList.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-500 text-sm">{eq.ma_thiet_bi}</td>
                    <td className="p-4 font-medium text-slate-800">{eq.ten_thiet_bi}</td>
                    <td className="p-4 text-slate-600 text-sm">{eq.loai_thiet_bi || '-'}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {eq.ngay_bao_tri_tiep_theo ? format(new Date(eq.ngay_bao_tri_tiep_theo), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-4 text-slate-600 text-sm font-medium">{eq.ten_phong || 'Chưa xếp phòng'}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        eq.trang_thai === 'san_sang' ? 'bg-emerald-100 text-emerald-800' :
                        eq.trang_thai === 'dang_bao_tri' ? 'bg-amber-100 text-amber-800' :
                        eq.trang_thai === 'hong' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {eq.trang_thai === 'san_sang' ? 'Sẵn sàng' : 
                         eq.trang_thai === 'dang_bao_tri' ? 'Đang bảo trì' : 
                         eq.trang_thai === 'hong' ? 'Báo hỏng' : 'Đang sử dụng'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-teal-600 hover:text-teal-800 text-sm font-medium mr-3">Sửa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Thêm Thiết bị</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên thiết bị *</label>
                  <input 
                    {...register('ten_thiet_bi')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  {errors.ten_thiet_bi && <p className="text-red-500 text-xs mt-1">{errors.ten_thiet_bi.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại máy</label>
                    <input 
                      {...register('loai_thiet_bi')} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày mua</label>
                    <input 
                      type="date"
                      {...register('ngay_mua')} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                    <select 
                      {...register('trang_thai')} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="san_sang">Sẵn sàng</option>
                      <option value="dang_su_dung">Đang sử dụng</option>
                      <option value="dang_bao_tri">Đang bảo trì</option>
                      <option value="hong">Hỏng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bảo trì tiếp theo</label>
                    <input 
                      type="date"
                      {...register('ngay_bao_tri_tiep_theo')} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-medium">Lưu Thiết bị</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

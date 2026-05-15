import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getServices, createService, getCategories } from '../../api/admin.api';

const serviceSchema = z.object({
  danh_muc_id: z.number().min(1, 'Vui lòng chọn danh mục'),
  ten_dich_vu: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  mo_ta: z.string().optional(),
  thoi_gian_uoc_tinh: z.number().min(1, 'Thời gian phải lớn hơn 0'),
  thiet_bi_yeu_cau: z.string().optional(),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ManageServices() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      trang_thai: 'hoat_dong',
      thoi_gian_uoc_tinh: 30
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [svcRes, catRes] = await Promise.all([getServices(), getCategories()]);
      setServices(svcRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      await createService(data);
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Có lỗi xảy ra khi tạo dịch vụ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Dịch vụ & Phòng</h2>
          <p className="text-slate-500 mt-1">Danh mục các dịch vụ vật lý trị liệu cung cấp tại phòng khám.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> Thêm Dịch vụ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Tên Dịch vụ</th>
                <th className="p-4 font-semibold">Danh mục</th>
                <th className="p-4 font-semibold text-center">Thời gian (phút)</th>
                <th className="p-4 font-semibold">Thiết bị yêu cầu</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Chưa có dữ liệu.</td>
                </tr>
              ) : (
                services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{svc.ten_dich_vu}</td>
                    <td className="p-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                        {svc.ten_danh_muc}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-800">{svc.thoi_gian_uoc_tinh}</td>
                    <td className="p-4 text-slate-600 text-sm">{svc.thiet_bi_yeu_cau || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        svc.trang_thai === 'hoat_dong' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {svc.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Vô hiệu'}
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
              <h3 className="text-lg font-bold text-slate-800">Thêm Dịch vụ Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục *</label>
                  <select 
                    {...register('danh_muc_id', { valueAsNumber: true })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value={0}>-- Chọn danh mục --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.ten_danh_muc}</option>
                    ))}
                  </select>
                  {errors.danh_muc_id && <p className="text-red-500 text-xs mt-1">{errors.danh_muc_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên dịch vụ *</label>
                  <input 
                    {...register('ten_dich_vu')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  {errors.ten_dich_vu && <p className="text-red-500 text-xs mt-1">{errors.ten_dich_vu.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian (phút) *</label>
                    <input 
                      type="number"
                      {...register('thoi_gian_uoc_tinh', { valueAsNumber: true })} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    {errors.thoi_gian_uoc_tinh && <p className="text-red-500 text-xs mt-1">{errors.thoi_gian_uoc_tinh.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                    <select 
                      {...register('trang_thai')} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="hoat_dong">Hoạt động</option>
                      <option value="vo_hieu">Vô hiệu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thiết bị yêu cầu</label>
                  <input 
                    {...register('thiet_bi_yeu_cau')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="VD: Máy siêu âm, Đèn hồng ngoại..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-medium">Lưu Dịch vụ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

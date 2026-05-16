import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getSchedules, createSchedule, getStaff } from '../../../api/admin.api';

const scheduleSchema = z.object({
  ky_thuat_vien_id: z.string().min(1, 'Vui lòng chọn KTV'),
  thu_trong_tuan: z.enum(['thu_2', 'thu_3', 'thu_4', 'thu_5', 'thu_6', 'thu_7', 'chu_nhat']),
  gio_bat_dau: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  gio_ket_thuc: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ không hợp lệ'),
  trang_thai: z.enum(['hoat_dong', 'tam_nghi'])
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const DOW_LABELS: Record<string, string> = {
  thu_2: 'Thứ 2',
  thu_3: 'Thứ 3',
  thu_4: 'Thứ 4',
  thu_5: 'Thứ 5',
  thu_6: 'Thứ 6',
  thu_7: 'Thứ 7',
  chu_nhat: 'Chủ Nhật'
};

export default function ManageSchedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      trang_thai: 'hoat_dong',
      gio_bat_dau: '08:00',
      gio_ket_thuc: '17:00'
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, staffRes] = await Promise.all([
        getSchedules(),
        getStaff()
      ]);
      setSchedules(schedRes.data);
      // Filter only KTV/Doctors
      setStaff(staffRes.data.filter((s: any) => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'Bác sĩ'));
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: ScheduleFormValues) => {
    try {
      await createSchedule(data);
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Ca làm việc</h2>
          <p className="text-slate-500 mt-1">Sắp xếp lịch trực cho Kỹ thuật viên & Bác sĩ.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> Xếp lịch trực
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Tên Nhân sự</th>
                <th className="p-4 font-semibold">Thứ trong tuần</th>
                <th className="p-4 font-semibold">Khung giờ</th>
                <th className="p-4 font-semibold text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có lịch trực nào được xếp.</td>
                </tr>
              ) : (
                schedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{sched.ten_ky_thuat_vien}</td>
                    <td className="p-4 text-slate-600 text-sm font-medium">
                      {DOW_LABELS[sched.thu_trong_tuan]}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-sm">
                      {sched.gio_bat_dau.slice(0, 5)} - {sched.gio_ket_thuc.slice(0, 5)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sched.trang_thai === 'hoat_dong' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sched.trang_thai === 'hoat_dong' ? 'Có mặt' : 'Tạm nghỉ'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium mr-3">Xóa</button>
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
              <h3 className="text-lg font-bold text-slate-800">Xếp lịch trực</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhân sự *</label>
                  <select 
                    {...register('ky_thuat_vien_id')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.ho_ten} ({s.vai_tro})</option>
                    ))}
                  </select>
                  {errors.ky_thuat_vien_id && <p className="text-red-500 text-xs mt-1">{errors.ky_thuat_vien_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thứ *</label>
                  <select 
                    {...register('thu_trong_tuan')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="thu_2">Thứ 2</option>
                    <option value="thu_3">Thứ 3</option>
                    <option value="thu_4">Thứ 4</option>
                    <option value="thu_5">Thứ 5</option>
                    <option value="thu_6">Thứ 6</option>
                    <option value="thu_7">Thứ 7</option>
                    <option value="chu_nhat">Chủ Nhật</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giờ bắt đầu</label>
                    <input 
                      type="time"
                      {...register('gio_bat_dau')} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giờ kết thúc</label>
                    <input 
                      type="time"
                      {...register('gio_ket_thuc')} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Hủy</button>
                <button type="submit" className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-medium">Lưu Lịch trực</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

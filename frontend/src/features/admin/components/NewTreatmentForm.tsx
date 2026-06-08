import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, FileText, Sparkles, Layers, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../api/axios';
import { useAuthStore } from '../../../stores/authStore';

const schema = z.object({
  bookingMode: z.enum(['existing', 'walk_in']),
  khach_hang_id: z.string().optional(),
  ho_ten_khach: z.string().optional(),
  so_dien_thoai: z.string().optional(),
  gioi_tinh_khach: z.string().optional(),
  email: z.string().optional(),

  treatmentType: z.enum(['single', 'package']),
  dich_vu_id: z.string().optional(),
  dang_ky_goi_id: z.string().optional(),

  ky_thuat_vien_id: z.string().optional(),
  phong_id: z.string().optional(),
  ngay_bat_dau: z.string().min(1, 'Vui lòng chọn ngày'),
  gio_bat_dau: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
  gio_ket_thuc: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
  ghi_chu_dat_lich: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.bookingMode === 'existing' && !data.khach_hang_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng chọn khách hàng',
      path: ['khach_hang_id'],
    });
  }
  if (data.bookingMode === 'walk_in') {
    if (!data.ho_ten_khach) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập họ tên', path: ['ho_ten_khach'] });
    }
    if (!data.so_dien_thoai) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập số điện thoại', path: ['so_dien_thoai'] });
    }
    if (!data.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập email để đăng ký tài khoản', path: ['email'] });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email không đúng định dạng', path: ['email'] });
    }
  }
  if (data.treatmentType === 'single' && !data.dich_vu_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng chọn dịch vụ lẻ',
      path: ['dich_vu_id'],
    });
  }
  if (data.treatmentType === 'package' && !data.dang_ky_goi_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng chọn gói liệu trình',
      path: ['dang_ky_goi_id'],
    });
  }
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTreatmentForm({ isOpen, onClose, onSuccess }: Props) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const isReceptionist = Number(user?.vai_tro_id) === 2;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bookingMode: 'existing',
      treatmentType: 'single',
      gioi_tinh_khach: 'nam',
      gio_bat_dau: '09:00',
      gio_ket_thuc: '10:00'
    }
  });

  const bookingMode = watch('bookingMode');
  const treatmentType = watch('treatmentType');
  const watchedGioBatDau = watch('gio_bat_dau');
  const watchedDichVuId = watch('dich_vu_id');
  const watchedDangKyGoiId = watch('dang_ky_goi_id');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!watchedGioBatDau) return;
    
    let durationMin = 60; // default
    if (treatmentType === 'single') {
      const service = allServices.find(s => String(s.id) === String(watchedDichVuId));
      if (service) {
        durationMin = Number(service.thoi_luong_phut) || 60;
      }
    } else {
      const pkg = packages.find(p => String(p.id) === String(watchedDangKyGoiId));
      if (pkg && pkg.chi_tiet_dich_vu) {
        let items: any[] = [];
        try {
          items = typeof pkg.chi_tiet_dich_vu === 'string'
            ? JSON.parse(pkg.chi_tiet_dich_vu)
            : pkg.chi_tiet_dich_vu;
        } catch (e) {
          console.error('Lỗi parse chi_tiet_dich_vu:', e);
        }
        if (Array.isArray(items)) {
          let sum = 0;
          items.forEach(item => {
            const svc = allServices.find(s => String(s.id) === String(item.dich_vu_id));
            if (svc) {
              sum += Number(svc.thoi_luong_phut) || 0;
            }
          });
          if (sum > 0) {
            durationMin = sum;
          }
        }
      }
    }

    try {
      const [h, m] = watchedGioBatDau.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + durationMin;
      const endH = Math.floor(endMinutes / 60) % 24;
      const endM = endMinutes % 60;
      
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      setValue('gio_ket_thuc', endStr);
    } catch (e) {
      console.error('Lỗi tính toán giờ kết thúc:', e);
    }
  }, [treatmentType, watchedGioBatDau, watchedDichVuId, watchedDangKyGoiId, allServices, packages]);

  const fetchData = async () => {
    try {
      const [custRes, servRes, pkgRes, staffRes, roomRes] = await Promise.all([
        axiosInstance.get('/admin/customers'),
        axiosInstance.get('/admin/services'),
        axiosInstance.get('/admin/packages'),
        axiosInstance.get('/admin/staff'),
        axiosInstance.get('/admin/rooms').catch(() => ({ data: [] }))
      ]);
      setCustomers(custRes.data);
      setAllServices(servRes.data);
      // Lọc các dịch vụ trị liệu chuyên sâu (bỏ qua khám lâm sàng nếu muốn, hoặc lấy tất cả trừ danh mục khám)
      setServices(servRes.data.filter((s: any) => String(s.danh_muc_id) !== '10' && String(s.danh_muc_id) !== '21'));
      setPackages(pkgRes.data);
      // Lấy danh sách kỹ thuật viên/bác sĩ làm trị liệu
      setStaff(staffRes.data.filter((s: any) => s.vai_tro === 'Chuyên gia y tế' || s.vai_tro === 'Kỹ thuật viên'));
      setRooms(roomRes.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu cho form điều trị:', error);
      toast.error('Không thể tải danh sách dữ liệu danh mục');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const payload: any = {
        loai_lich: 'dieu_tri',
        ngay_gio_bat_dau: new Date(`${data.ngay_bat_dau}T${data.gio_bat_dau}:00`).toISOString(),
        ngay_gio_ket_thuc: new Date(`${data.ngay_bat_dau}T${data.gio_ket_thuc}:00`).toISOString(),
        ghi_chu_dat_lich: data.ghi_chu_dat_lich,
        ma_lich_dat: `TR${Math.floor(1000 + Math.random() * 9000)}`
      };

      // Quyền của lễ tân: Không được gán KTV và phòng
      if (!isReceptionist) {
        payload.ky_thuat_vien_id = data.ky_thuat_vien_id || undefined;
        payload.phong_id = data.phong_id || undefined;
      }

      // Khách hàng
      if (data.bookingMode === 'existing') {
        payload.khach_hang_id = data.khach_hang_id;
      } else {
        payload.ho_ten_khach = data.ho_ten_khach;
        payload.so_dien_thoai = data.so_dien_thoai;
        payload.gioi_tinh_khach = data.gioi_tinh_khach;
        payload.email = data.email;
      }

      // Dịch vụ / Liệu trình
      if (data.treatmentType === 'single') {
        payload.dich_vu_id = data.dich_vu_id;
      } else {
        payload.dang_ky_goi_id = data.dang_ky_goi_id;
      }

      await axiosInstance.post('/admin/appointments', payload);
      toast.success(
        isReceptionist 
          ? 'Đã tạo yêu cầu điều trị! Vui lòng chờ Quản lý gán KTV và Phòng.' 
          : 'Tạo lịch điều trị thành công!'
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Lỗi lưu lịch điều trị:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu lịch điều trị.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={20} />
              Tạo Lịch Điều Trị Mới
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Lập phác đồ hoặc buổi trực tiếp cho khách hàng</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="treatmentForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Mode Selection */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${bookingMode === 'existing' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setValue('bookingMode', 'existing')}
              >
                Khách đã có tài khoản
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${bookingMode === 'walk_in' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setValue('bookingMode', 'walk_in')}
              >
                Đăng ký khách mới
              </button>
            </div>

            {/* Customer Info Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <User size={16} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông tin bệnh nhân</h3>
              </div>

              {bookingMode === 'existing' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn Khách hàng *</label>
                  <select
                    {...register('khach_hang_id')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors text-sm rounded-xl"
                  >
                    <option value="">-- Lựa chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.khach_hang_id} value={c.khach_hang_id}>
                        {c.ho_ten} - {c.so_dien_thoai}
                      </option>
                    ))}
                  </select>
                  {errors.khach_hang_id && <p className="text-red-500 text-xs mt-1">{errors.khach_hang_id.message}</p>}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ tên *</label>
                    <input
                      type="text"
                      {...register('ho_ten_khach')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors text-sm rounded-xl"
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.ho_ten_khach && <p className="text-red-500 text-xs mt-1">{errors.ho_ten_khach.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại *</label>
                      <input
                        type="tel"
                        {...register('so_dien_thoai')}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors text-sm rounded-xl"
                        placeholder="09..."
                      />
                      {errors.so_dien_thoai && <p className="text-red-500 text-xs mt-1">{errors.so_dien_thoai.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giới tính</label>
                      <select
                        {...register('gioi_tinh_khach')}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors text-sm rounded-xl"
                      >
                        <option value="nam">Nam</option>
                        <option value="nu">Nữ</option>
                        <option value="khac">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email liên hệ *</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors text-sm rounded-xl"
                      placeholder="email@example.com"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Email này sẽ được tự động đăng ký tài khoản cho khách.</p>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>
              )}
            </section>

            {/* Treatment Type & Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Layers size={16} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hình thức dịch vụ</h3>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Loại điều trị</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button type="button" onClick={() => setValue('treatmentType', 'single')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${treatmentType === 'single' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Dịch vụ lẻ</button>
                  <button type="button" onClick={() => setValue('treatmentType', 'package')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${treatmentType === 'package' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Theo liệu trình (Gói)</button>
                </div>
              </div>

              {treatmentType === 'single' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn Dịch vụ lẻ *</label>
                  <select
                    {...register('dich_vu_id')}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl"
                  >
                    <option value="">-- Lựa chọn dịch vụ --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.ten_dich_vu} ({Number(s.don_gia).toLocaleString('vi-VN')}đ)</option>
                    ))}
                  </select>
                  {errors.dich_vu_id && <p className="text-red-500 text-xs mt-1">{errors.dich_vu_id.message}</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chọn Gói trị liệu *</label>
                  <select
                    {...register('dang_ky_goi_id')}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl"
                  >
                    <option value="">-- Lựa chọn gói --</option>
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.ten_goi} ({p.tong_so_buoi} buổi - {Number(p.gia_goi).toLocaleString('vi-VN')}đ)</option>
                    ))}
                  </select>
                  {errors.dang_ky_goi_id && <p className="text-red-500 text-xs mt-1">{errors.dang_ky_goi_id.message}</p>}
                </div>
              )}
            </section>

            {/* Personnel & Room (Depends on Role) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <MapPin size={16} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Bố trí trực lâm sàng</h3>
              </div>

              {isReceptionist ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed font-semibold">
                  ⚠️ Tài khoản Lễ tân: Bạn không có quyền phân công Kỹ thuật viên và Phòng điều trị. Lịch này sẽ được lưu ở trạng thái "Chờ xác nhận" để Quản lý chỉ định KTV & Phòng sau.
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kỹ thuật viên / Chuyên gia trị liệu</label>
                    <select
                      {...register('ky_thuat_vien_id')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl"
                    >
                      <option value="">-- Tự động gán / Chọn sau --</option>
                      {staff.map(s => (
                        <option key={s.ky_thuat_vien_id || s.id} value={s.ky_thuat_vien_id || ''}>{s.ho_ten}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phòng lâm sàng</label>
                    <select
                      {...register('phong_id')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl"
                    >
                      <option value="">-- Tự động xếp phòng / Chọn sau --</option>
                      {rooms
                        .filter(r => r.loai_phong === 'tri_lieu' || r.loai_phong === 'phong_tri_lieu_chuan')
                        .map(r => (
                          <option key={r.id} value={r.id}>{r.ten_phong}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </section>

            {/* Time Slots */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thời gian thực hiện</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày *</label>
                  <input
                    type="date"
                    {...register('ngay_bat_dau')}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl"
                  />
                  {errors.ngay_bat_dau && <p className="text-red-500 text-xs mt-1">{errors.ngay_bat_dau.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Giờ BĐ *</label>
                  <input
                    type="time"
                    {...register('gio_bat_dau')}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Giờ KT *</label>
                  <input
                    type="time"
                    {...register('gio_ket_thuc')}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl"
                  />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileText size={16} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông tin thêm</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú lâm sàng</label>
                <textarea
                  {...register('ghi_chu_dat_lich')}
                  rows={3}
                  placeholder="Yêu cầu đặc biệt, tình trạng bệnh lý..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm rounded-xl resize-none"
                />
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="treatmentForm"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Đang tạo...' : 'Xác nhận tạo lịch'}
          </button>
        </div>
      </div>
    </>
  );
}

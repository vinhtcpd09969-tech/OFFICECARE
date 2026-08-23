import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

const staffSchema = z.object({
  ho_ten: z.string().min(1, 'Vui lòng không để trống họ và tên'),
  email: z.string().min(1, 'Vui lòng không để trống email đăng nhập').email('Email không đúng định dạng y khoa (vd: ten@officecare.vn)'),
  mat_khau: z.string().min(1, 'Vui lòng không để trống mật khẩu').min(6, 'Mật khẩu khởi tạo phải từ 6 ký tự trở lên'),
  vai_tro_id: z.number().min(2, 'Vui lòng chọn vai trò làm việc'),
  so_dien_thoai: z.string().optional().refine((val) => !val || /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(val), {
    message: 'Số điện thoại không đúng định dạng (vd: 0912345678)'
  }),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

export type StaffFormValues = z.infer<typeof staffSchema>;

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormValues) => Promise<void>;
}

export function CreateStaffModal({ isOpen, onClose, onSubmit }: CreateStaffModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      ho_ten: '',
      email: '',
      mat_khau: '',
      vai_tro_id: 0,
      so_dien_thoai: '',
      trang_thai: 'hoat_dong'
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-150/60 dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-zinc-50 to-slate-50 dark:from-zinc-950 dark:to-zinc-900">
          <div>
            <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-wider">Tạo tài khoản Nhân sự</h3>
            <p className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">Tạo tài khoản làm việc y khoa mới</p>
          </div>
          <button 
            onClick={onClose} 
            className="size-8 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-400 hover:text-zinc-650 cursor-pointer shadow-xs transition-transform hover:rotate-90"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="ho_ten" className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Họ Tên *</label>
            <input
              id="ho_ten"
              placeholder="Nhập họ và tên nhân viên..."
              {...register('ho_ten')}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-secondary font-bold outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.ho_ten && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.ho_ten.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Email đăng nhập *</label>
            <input
              id="email"
              type="email"
              placeholder="vi_du@officecare.vn"
              {...register('email')}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-secondary font-bold outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.email && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="mat_khau" className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Mật khẩu ban đầu *</label>
            <input
              id="mat_khau"
              type="password"
              placeholder="Tối thiểu 6 ký tự..."
              {...register('mat_khau')}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-secondary font-bold outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.mat_khau && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.mat_khau.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="vai_tro_id" className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Vai trò *</label>
              <select
                id="vai_tro_id"
                {...register('vai_tro_id', { valueAsNumber: true })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-secondary font-bold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value={0}>Chọn...</option>
                <option value={2}>Lễ tân</option>
                <option value={3}>Kỹ thuật viên</option>
                <option value={4}>Chuyên viên Vật lý trị liệu</option>
                <option value={5}>Admin</option>
                <option value={6}>Quản lý</option>
              </select>
              {errors.vai_tro_id && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.vai_tro_id.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="so_dien_thoai" className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Số điện thoại</label>
              <input
                id="so_dien_thoai"
                placeholder="Số di động liên hệ..."
                {...register('so_dien_thoai')}
                className={`w-full bg-zinc-50 dark:bg-zinc-950 border ${errors.so_dien_thoai ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100' : 'border-zinc-200 dark:border-zinc-850 focus:border-primary'} rounded-xl px-4 py-2.5 text-xs text-secondary font-bold outline-none focus:ring-2 focus:ring-primary/20`}
              />
              {errors.so_dien_thoai && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.so_dien_thoai.message}</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 text-zinc-600 bg-zinc-50 border border-zinc-200/50 hover:bg-zinc-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 text-white bg-primary hover:bg-primary/95 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

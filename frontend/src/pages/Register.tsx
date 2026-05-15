import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../api/axios';
import { useAuthStore } from '../stores/authStore';

// Validation Schema using Zod
const registerSchema = z.object({
  ho_ten: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError(null);
      const response = await axiosInstance.post('/auth/register', {
        ho_ten: data.ho_ten,
        email: data.email,
        password: data.password,
      });

      // API returns: message
      const { message } = response.data;
      
      // Redirect to verify email
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, { replace: true });
    } catch (error: any) {
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="min-h-screen flex w-full font-body bg-[#F8FAFC]">
      {/* Left Panel - Graphic (Dark Theme with Rule of Thirds) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 bg-[#0F172A]">
        {/* Soft abstract shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Logo at Top Left */}
        <div className="absolute top-12 left-12 font-heading font-bold text-4xl text-white flex items-center gap-2 z-20">
          <span className="text-primary">P</span> physio<span className="font-light">waves</span>
        </div>

        {/* Content Container (Bottom Third) */}
        <div className="relative w-full h-full flex flex-col justify-end items-start z-20 pb-8 pl-8">
          
          {/* Mini Stats Card - Glassmorphism */}
          <div className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] p-6 w-full max-w-[400px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Hành trình phục hồi</h3>
                <p className="text-gray-400 text-sm">Theo dõi sát sao từng thay đổi</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Mức độ đau hiện tại</span>
                <span className="text-white font-bold bg-red-500/20 px-2 py-1 rounded">3.2 / 10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
              <p className="text-primary text-xs font-medium">✨ Cổ vai gáy cải thiện 30% so với tuần trước</p>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="w-full max-w-[480px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <div className="text-primary text-5xl font-serif leading-none mb-[-10px] opacity-80">"</div>
            <p className="text-gray-300 text-[16px] leading-[1.6] font-medium mb-6 relative z-10">
              "Trước đây việc đăng ký trị liệu rất thủ công. Với PhysioFlow, tôi có thể theo dõi biểu đồ phục hồi của chính mình và biết rõ mục tiêu tiếp theo."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-600 rounded-full overflow-hidden border border-gray-500">
                <img src="https://i.pravatar.cc/150?img=12" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Hoàng Nam</h4>
                <p className="text-xs text-gray-400 font-medium">Nhân viên văn phòng</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 relative">
        <div className="w-full max-w-[480px]">
          
          {/* Mobile Logo */}
          <div className="lg:hidden font-heading font-bold text-3xl text-secondary mb-8 flex items-center gap-2">
            <span className="text-primary">P</span> physio<span className="font-light">waves</span>
          </div>

          <div className="mb-10">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-secondary mb-3">
              Tạo tài khoản mới
            </h1>
            <p className="text-gray-500 text-[16px]">
              Bắt đầu hành trình phục hồi sức khỏe của bạn cùng PhysioFlow.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-[16px] text-sm font-medium">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Họ và Tên */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-secondary block">
                Họ và Tên
              </label>
              <input
                {...register('ho_ten')}
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                className={`w-full px-4 py-3 rounded-[16px] border ${
                  errors.ho_ten ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
              />
              {errors.ho_ten && (
                <p className="text-red-500 text-xs font-medium">{errors.ho_ten.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-secondary block">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className={`w-full px-4 py-3 rounded-[16px] border ${
                  errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-secondary block">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full px-4 py-3 rounded-[16px] border ${
                    errors.password ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-secondary block">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full px-4 py-3 rounded-[16px] border ${
                    errors.confirmPassword ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    {...register('agreeTerms')}
                    type="checkbox"
                    className="w-5 h-5 border-2 border-gray-300 rounded-[6px] appearance-none checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                  />
                  <CheckCircle2 size={14} className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100" style={{ opacity: 0 }} />
                  {/* Note: since standard input[type="checkbox"] doesn't support an internal icon easily via standard tailwind peer-checked state without a bit of tricky setup, I will use a simple checkbox, but wait, the SVG is absolute. It works if the SVG is just layered over. */}
                  {/* Using standard check styling with tailwind forms plugin is better, but here we can just use simple styling */}
                </div>
                <span className="text-sm text-gray-600">
                  Tôi đồng ý với <a href="#" className="text-primary font-semibold hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-primary font-semibold hover:underline">Chính sách bảo mật</a> của PhysioFlow.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-red-500 text-xs font-medium mt-1">{errors.agreeTerms.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-[#25A89C] text-white font-semibold py-3.5 px-4 rounded-[16px] shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

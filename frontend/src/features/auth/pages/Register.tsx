import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Info, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';
import AuthVisualPanel from '../components/AuthVisualPanel';

const registerSchema = z.object({
  ho_ten: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ho_ten: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const handleNextStep = async () => {
    setServerError(null);
    if (step === 1) {
      const isNameValid = await trigger('ho_ten');
      if (isNameValid) {
        setStep(2);
      }
    } else if (step === 2) {
      const isEmailValid = await trigger('email');
      if (!isEmailValid) return;

      const emailVal = getValues('email');
      setCheckingEmail(true);
      try {
        const response = await api.post('/auth/check-email', { email: emailVal });
        if (response.data.exists) {
          setServerError('Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.');
        } else {
          setStep(3);
        }
      } catch (error: any) {
        setServerError(error.response?.data?.message || 'Lỗi kết nối máy chủ, vui lòng thử lại');
      } finally {
        setCheckingEmail(false);
      }
    } else if (step === 3) {
      const isPasswordValid = await trigger('password');
      if (isPasswordValid) {
        setStep(4);
      }
    }
  };

  const handlePrevStep = () => {
    setServerError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) setStep(3);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError(null);
      await api.post('/auth/register', {
        ho_ten: data.ho_ten,
        email: data.email,
        password: data.password,
      });

      toast.success('Đăng ký tài khoản thành công! Một mã OTP đã được gửi đến email của bạn.');
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, { state: location.state, replace: true });
    } catch (error: any) {
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      handlePrevStep();
    } else {
      navigate(-1);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex bg-[#F8FAFC] text-[#0F172A] relative overflow-hidden font-jakarta"
    >
      {/* HUD High-tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-80"></div>

      {/* Radial soft backlights for clean ambient gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[900px] h-[900px] bg-[#10B981]/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-7000"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[900px] h-[900px] bg-[#0D9488]/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000"></div>

      {/* Floating dynamic particles */}
      <div className="absolute top-[20%] left-[15%] size-1.5 bg-[#10B981]/25 rounded-full animate-float"></div>
      <div className="absolute bottom-[30%] left-[25%] size-2 bg-[#0D9488]/15 rounded-full animate-float stagger-delay-3"></div>
      <div className="absolute top-[55%] left-[45%] size-1 bg-[#10B981]/30 rounded-full animate-float stagger-delay-6"></div>

      {/* 65% Left Immersive Visual Section */}
      <AuthVisualPanel onBack={handleBack} showBack={true} />

      {/* 35% Right Floating Authentication Card Viewport */}
      <div className="w-full lg:w-[35%] h-screen flex items-center justify-center p-6 sm:p-10 z-20 relative bg-zinc-100/30 lg:border-l lg:border-zinc-200/50">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-6 left-6 flex flex-col gap-2 z-30">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#0F172A] font-semibold transition-colors focus:outline-none w-fit"
          >
            <ArrowLeft size={13} />
            <span>Trở về trang trước</span>
          </button>
          
          <div className="font-heading font-extrabold text-2xl text-[#0F172A] flex items-center gap-2.5 tracking-tight">
            <div className="size-4.5 rounded-full border-2 border-[#10B981] flex items-center justify-center bg-[#10B981]/5">
              <div className="size-1 bg-[#10B981]"></div>
            </div>
            <span>office<span className="text-zinc-455 font-light">care</span></span>
          </div>
        </div>

        {/* Floating Glassmorphic Authentication Card */}
        <div className="w-full max-w-[390px] bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 md:p-9 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.06)] hover:border-zinc-200/50 transition-all duration-500 animate-card-reveal">
          
          <div className="mb-5 flex gap-6 border-b border-zinc-100 w-full">
            <Link to="/login" state={location.state} className="pb-2.5 text-zinc-400 font-semibold text-sm cursor-pointer hover:text-zinc-650 transition-colors">Đăng nhập</Link>
            <span className="pb-2.5 border-b-2 border-[#10B981] text-[#10B981] font-bold text-sm select-none">Đăng ký</span>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="w-full bg-zinc-100 h-1 rounded-full mb-6 overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-[#10B981] to-[#0D9488] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>

          {location.state?.from === '/booking' && step === 1 && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <Info className="shrink-0 mt-0.5 text-[#10B981]" size={16} />
              <div>
                <p className="font-bold text-[#0F172A] font-sans">Tạo tài khoản trị liệu</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed font-sans">
                  Thiết lập tài khoản để đồng bộ hóa hồ sơ bệnh án và lưu trữ bệnh án lâu dài nhé!
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-2xl text-xs font-semibold leading-relaxed font-sans animate-in fade-in duration-200">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Step 1: Họ tên */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-bold text-[#0F172A] tracking-tight">Tên của bạn là gì?</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-4 font-sans">Vui lòng điền họ và tên thật để lưu giữ hồ sơ bệnh án.</p>
                  
                  <label htmlFor="ho_ten" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Họ và tên</label>
                  <input
                    {...register('ho_ten')}
                    id="ho_ten"
                    type="text"
                    autoComplete="name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    className="w-full bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-zinc-900 text-sm font-sans"
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.ho_ten && <p className="text-red-500 text-xs font-semibold font-sans">{errors.ho_ten.message}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 px-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px] hover:shadow-[0_12px_24px_rgba(16,185,129,0.15)]"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Email */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-650 font-semibold mb-2 transition-colors focus:outline-none font-sans"
                >
                  <ArrowLeft size={12} />
                  <span>Quay lại</span>
                </button>

                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-bold text-[#0F172A] tracking-tight">Địa chỉ Email của bạn?</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-4 font-sans">Email dùng để nhận mã xác thực OTP kích hoạt tài khoản.</p>
                  
                  <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Địa chỉ Email</label>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    className="w-full bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-zinc-900 text-sm font-sans"
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs font-semibold font-sans">{errors.email.message}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={checkingEmail}
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 px-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px] hover:shadow-[0_12px_24px_rgba(16,185,129,0.15)]"
                >
                  {checkingEmail ? (
                    <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
                  ) : (
                    <>
                      <span>Tiếp tục</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Mật khẩu */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-655 font-semibold mb-2 transition-colors focus:outline-none font-sans"
                >
                  <ArrowLeft size={12} />
                  <span>Quay lại</span>
                </button>

                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-bold text-[#0F172A] tracking-tight">Thiết lập mật khẩu</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-4 font-sans">Nhập mật khẩu cho tài khoản OffiCare của bạn.</p>

                  <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Mật khẩu</label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNextStep();
                        }
                      }}
                      className="w-full bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-zinc-900 text-sm pr-12 font-sans"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs font-semibold font-sans">{errors.password.message}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 px-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px] hover:shadow-[0_12px_24px_rgba(16,185,129,0.15)]"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 4: Xác nhận mật khẩu */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-655 font-semibold mb-2 transition-colors focus:outline-none font-sans"
                >
                  <ArrowLeft size={12} />
                  <span>Quay lại</span>
                </button>

                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-bold text-[#0F172A] tracking-tight">Xác nhận mật khẩu</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-4 font-sans">Vui lòng nhập lại chính xác mật khẩu của bạn.</p>

                  <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="w-full bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-zinc-900 text-sm pr-12 font-sans"
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs font-semibold font-sans">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 px-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px] hover:shadow-[0_12px_24px_rgba(16,185,129,0.15)]"
                >
                  {isSubmitting ? (
                    <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
                  ) : (
                    <span>Tạo tài khoản</span>
                  )}
                </button>
              </div>
            )}

            {/* Back registration footer */}
            <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
              <p className="text-xs text-zinc-400 font-sans">
                Đã có tài khoản?{' '}
                <Link to="/login" state={location.state} className="text-[#10B981] font-bold hover:underline transition-all">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}

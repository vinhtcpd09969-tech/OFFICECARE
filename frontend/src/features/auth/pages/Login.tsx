import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Info, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../stores/authStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthVisualPanel from '../components/AuthVisualPanel';
import ForgotPasswordFlow from '../components/ForgotPasswordFlow';


const loginSchema = z.object({
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const WelcomeToast = ({ t, user }: { t: any; user: any }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setActive(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!t.visible) {
      setActive(false);
    }
  }, [t.visible]);

  return (
    <div
      style={{
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className={`max-w-md w-full bg-white rounded-[24px] pointer-events-auto flex ring-1 ring-black/5 p-5 border border-[#10B981]/20 bg-gradient-to-r from-white to-[#F0FDF4]
        transition-all duration-700 transform font-jakarta
        ${active ? 'translate-y-0 opacity-100 scale-100 shadow-[0_20px_50px_rgba(15,23,42,0.08)]' : '-translate-y-12 opacity-0 scale-90'}`}
    >
      <div className="flex-1 w-0 p-1">
        <div className="flex items-center">
          <div className="flex-shrink-0 pt-0.5">
            <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#0D9488] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
              {user.ho_ten.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-bold text-[#0F172A]">
              Chào mừng bạn trở lại, {user.ho_ten}! ✨
            </p>
            <p className="mt-1 text-xs text-zinc-500 font-medium leading-relaxed font-sans">
              Chúc bạn có một ngày trị liệu hiệu quả và hồi phục nhanh chóng cùng OffiCare!
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-zinc-100 pl-3 ml-3 items-center">
        <button
          onClick={() => {
            setActive(false);
            setTimeout(() => toast.dismiss(t.id), 500);
          }}
          className="border border-transparent rounded-xl px-2 py-1 flex items-center justify-center text-xs font-bold text-[#10B981] hover:bg-emerald-500/5 focus:outline-none transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default function Login() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');

  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, trigger, getValues, setValue, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const handleNextStep = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;

    const emailVal = getValues('email');
    setTypedEmail(emailVal);
    setCheckingEmail(true);
    setServerError('');

    try {
      const response = await api.post('/auth/check-email', { email: emailVal });
      if (response.data.exists) {
        setStep(2);
      } else {
        setServerError('Email này chưa được đăng ký trong hệ thống. Vui lòng tạo tài khoản mới.');
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Lỗi kết nối máy chủ, vui lòng thử lại');
    } finally {
      setCheckingEmail(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError('');
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);

      // Custom Premium Welcome Toast
      toast.custom((t) => <WelcomeToast t={t} user={user} />, { duration: 5000 });

      const from = (location.state as any)?.from || '/dashboard';
      const roleId = Number(user.vai_tro_id);
      
      if (roleId === 5) {
        navigate(from === '/dashboard' ? '/admin' : from);
      } else if (roleId === 2) {
        navigate(from === '/dashboard' ? '/receptionist' : from);
      } else if (roleId === 3) {
        navigate(from === '/dashboard' ? '/technician/workspace' : from);
      } else if (roleId === 4) {
        navigate(from === '/dashboard' ? '/doctor' : from);
      } else {
        navigate(from);
      }
    } catch (error: any) {
      if (error.response?.data?.requiresVerification) {
        navigate(`/verify-email?email=${data.email}`, { state: location.state });
      } else {
        setServerError(error.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
      }
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(1);
      setServerError('');
    } else if (step === 2) {
      setStep(1);
      setServerError('');
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
            <span>office<span className="text-zinc-450 font-light">care</span></span>
          </div>
        </div>

        {/* Floating Glassmorphic Authentication Card */}
        <div className="w-full max-w-[390px] bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 md:p-9 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.06)] hover:border-zinc-200/50 transition-all duration-500 animate-card-reveal">
          
          {step <= 2 ? (
            <div className="mb-6 flex gap-6 border-b border-zinc-100 w-full">
              <span className="pb-2.5 border-b-2 border-[#10B981] text-[#10B981] font-bold text-sm select-none">Đăng nhập</span>
              <Link to="/register" state={location.state} className="pb-2.5 text-zinc-400 font-semibold text-sm cursor-pointer hover:text-zinc-650 transition-colors">Đăng ký</Link>
            </div>
          ) : (
            <div className="mb-6 flex gap-6 border-b border-zinc-100 w-full">
              <span className="pb-2.5 border-b-2 border-[#10B981] text-[#10B981] font-bold text-sm select-none font-jakarta">Khôi phục mật khẩu</span>
            </div>
          )}

          {location.state?.from === '/booking' && step <= 2 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <Info className="shrink-0 mt-0.5 text-[#10B981]" size={16} />
              <div>
                <p className="font-bold text-[#0F172A] font-sans">Đồng bộ lịch khám y khoa</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed font-sans">
                  Đăng nhập để đồng bộ lịch hẹn và hồ sơ bệnh án cá nhân của bạn nhé!
                </p>
              </div>
            </div>
          )}

          {/* Form Header Info */}
          {step <= 2 && (
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight font-jakarta">
                {step === 1 ? 'Chào mừng quay lại' : 'Nhập mật khẩu'}
              </h2>
              <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed font-sans">
                {step === 1 ? 'Điền địa chỉ email của bạn để tiếp tục.' : `Mật khẩu cho tài khoản: ${typedEmail}`}
              </p>
            </div>
          )}

          {step <= 2 ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Step 1: Progressive Email Box */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
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

                  {serverError && (
                    <div className="p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-2xl text-xs font-semibold leading-relaxed font-sans">
                      {serverError}
                    </div>
                  )}

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

              {/* Step 2: Progressive Password Box */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-650 font-semibold mb-2 transition-colors focus:outline-none font-sans"
                  >
                    <ArrowLeft size={12} />
                    <span>Thay đổi email</span>
                  </button>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">Mật khẩu</label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep(3);
                          setServerError('');
                        }}
                        className="text-[10px] font-bold text-[#10B981] hover:opacity-85 font-sans focus:outline-none"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        {...register('password')}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="w-full bg-slate-50/50 border border-zinc-200 hover:border-zinc-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-zinc-900 text-sm pr-12 font-sans"
                        placeholder="Nhập mật khẩu"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-660 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs font-semibold font-sans">{errors.password.message}</p>}
                  </div>

                  {serverError && (
                    <div className="p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-2xl text-xs font-semibold leading-relaxed font-sans">
                      {serverError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:opacity-95 active:scale-[0.97] text-white font-bold rounded-2xl py-4 px-4 shadow-lg shadow-emerald-500/10 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm hover:translate-y-[-2px] hover:shadow-[0_12px_24px_rgba(16,185,129,0.15)]"
                  >
                    {isSubmitting ? (
                      <span className="inline-block border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin"></span>
                    ) : (
                      <span>Đăng nhập</span>
                    )}
                  </button>
                </div>
              )}

              {/* Back registration footer */}
              <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
                <p className="text-xs text-zinc-400 font-sans">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" state={location.state} className="text-[#10B981] font-bold hover:underline transition-all">
                    Đăng ký thành viên
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <ForgotPasswordFlow
              initialEmail={getValues('email') || ''}
              onCancel={() => {
                setStep(1);
                setServerError('');
              }}
              onSuccess={(email) => {
                setTypedEmail(email);
                setValue('email', email);
                setStep(1);
                setServerError('');
              }}
            />
          )}
        </div>

      </div>
    </div>
  );
}

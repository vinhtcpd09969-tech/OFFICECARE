import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import axiosInstance from '../../../api/axios';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'react-hot-toast';

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
      className={`max-w-md w-full bg-white rounded-[24px] pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border border-teal-150/50 bg-gradient-to-r from-white to-teal-50/30
        transition-all duration-700 transform
        ${active ? 'translate-y-0 opacity-100 scale-100 shadow-[0_20px_50px_rgba(46,196,182,0.15)]' : '-translate-y-12 opacity-0 scale-90'}`}
    >
      <div className="flex-1 w-0 p-1">
        <div className="flex items-center">
          <div className="flex-shrink-0 pt-0.5">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-primary/20">
              {user.ho_ten.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-bold text-secondary">
              Xác thực tài khoản thành công! Chào mừng {user.ho_ten} ✨
            </p>
            <p className="mt-1 text-xs text-gray-500 font-medium">
              Tài khoản của bạn đã được kích hoạt thành công. Hãy bắt đầu đặt lịch ngay nhé!
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-100 pl-3 ml-3 items-center">
        <button
          onClick={() => {
            setActive(false);
            setTimeout(() => toast.dismiss(t.id), 500);
          }}
          className="border border-transparent rounded-xl px-2 py-1 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/5 focus:outline-none transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value !== '') {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && otp[index] === '' && e.currentTarget.previousSibling) {
      (e.currentTarget.previousSibling as HTMLInputElement).focus();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await axiosInstance.post('/auth/verify-email', {
        email,
        otp: otpValue
      });

      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);

      // Custom Premium Welcome Toast
      toast.custom((t) => <WelcomeToast t={t} user={user} />, { duration: 6000 });
      
      const from = (location.state as any)?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setError(null);
    
    try {
      await axiosInstance.post('/auth/resend-otp', { email });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-body">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-primary" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-secondary mb-2">Xác thực Email</h2>
          <p className="text-gray-500 text-sm">
            Vui lòng nhập mã OTP 6 số đã được gửi đến email <br />
            <span className="font-semibold text-secondary">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-[16px] text-sm font-medium text-center">
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-[16px] text-sm font-medium text-center">
            Đã gửi lại mã OTP thành công!
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="flex justify-center gap-2 mb-8">
            {otp.map((data, index) => {
              return (
                <input
                  className="w-12 h-14 text-center text-xl font-semibold border border-gray-200 rounded-[12px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  type="text"
                  name="otp"
                  maxLength={1}
                  key={index}
                  value={data}
                  onChange={e => handleChange(e.target, index)}
                  onFocus={e => e.target.select()}
                  onKeyDown={e => handleKeyDown(e, index)}
                />
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-[#25A89C] text-white font-semibold py-3.5 px-4 rounded-[16px] shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mb-6"
          >
            {isSubmitting ? 'Đang xác thực...' : 'Xác thực ngay'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Chưa nhận được mã?</p>
          <button 
            onClick={handleResend}
            disabled={isResending}
            className="text-primary font-semibold hover:underline disabled:opacity-50"
          >
            {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}

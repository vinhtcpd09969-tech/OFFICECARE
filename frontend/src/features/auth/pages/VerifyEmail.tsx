import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import axiosInstance from '../../../api/axios';
import { useAuthStore } from '../../../stores/authStore';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const navigate = useNavigate();
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
      
      navigate('/dashboard', { replace: true });
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
    // In a real app, you would call an API here to generate and send a new OTP
    setIsResending(true);
    setResendSuccess(false);
    setError(null);
    
    setTimeout(() => {
      setIsResending(false);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }, 1000);
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

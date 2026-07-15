import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';

export const registerSchema = z.object({
  ho_ten: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  gioi_tinh: z.enum(['nam', 'nu', 'khac'], { message: 'Vui lòng chọn giới tính' }),
  ngay_sinh: z.string().min(1, 'Vui lòng chọn ngày sinh').refine((val) => new Date(val) <= new Date(), {
    message: 'Ngày sinh không hợp lệ'
  }),
  dia_chi: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  dong_y_dieu_khoan: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục'
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export interface UseRegisterStateReturn {
  form: UseFormReturn<RegisterFormValues>;
  isSuccess: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  serverError: string | null;
  setServerError: (error: string | null) => void;
  onSubmit: (data: RegisterFormValues) => Promise<void>;
  isSubmitting: boolean;
  registeredEmail: string;
}

export function useRegisterState(): UseRegisterStateReturn {
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ho_ten: '',
      email: '',
      gioi_tinh: undefined,
      ngay_sinh: '',
      dia_chi: '',
      password: '',
      confirmPassword: '',
      dong_y_dieu_khoan: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError(null);

      const emailCheck = await api.post('/auth/check-email', { email: data.email });
      if (emailCheck.data.exists) {
        setServerError('Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.');
        return;
      }

      await api.post('/auth/register', {
        ho_ten: data.ho_ten,
        email: data.email,
        gioi_tinh: data.gioi_tinh,
        ngay_sinh: data.ngay_sinh,
        dia_chi: data.dia_chi || undefined,
        password: data.password,
        dong_y_dieu_khoan: data.dong_y_dieu_khoan,
      });

      setRegisteredEmail(data.email);
      toast.success('Đăng ký tài khoản thành công! Một mã OTP đã được gửi đến email của bạn.');
      setIsSuccess(true);
    } catch (error: any) {
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    }
  };

  return {
    form,
    isSuccess,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    serverError,
    setServerError,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    registeredEmail,
  };
}

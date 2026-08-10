import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Star,
  User,
  Loader2,
  Activity,
  Lock,
  Calendar,
  CreditCard,
  QrCode,
  Sparkles,
  CheckCircle2,
  Tag,
  Upload,
  X,
  Info,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAuthActions } from '../../../stores/authStore';
import { agreeTerms } from '../../customer/api/customer.api';
import { TERMS_OF_SERVICE } from '../../legal/termsContent';
import { toast } from 'react-hot-toast';
import { useBookingState } from '../components/booking/hooks/useBookingState';
import {
  BUOI_INFO,
  formatFullDate,
  isBuoiDaQua
} from '../components/booking/constants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Booking() {
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { updateUser } = useAuthActions();

  // Terms acceptance modal gate for accounts missing timestamp
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [agreeingLoading, setAgreeingLoading] = useState(false);

  // Modal Terms popup state for online payment terms agreement
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [modalTermsChecked, setModalTermsChecked] = useState(false);

  // Initialize booking type & selected service
  const [bookingType, setBookingType] = useState<'kham' | 'dich_vu'>('kham');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [specialists, setSpecialists] = useState<any[]>([]);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'tai_quay' | 'payos'>('tai_quay');
  const [payTermsAccepted, setPayTermsAccepted] = useState(false);

  // Official PayOS SDK response data & polling timer states
  const [payosData, setPayosData] = useState<any | null>(null);
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosTimeLeft, setPayosTimeLeft] = useState(600); // 10 minutes (600s)
  const pollingTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const isCreatingBookingRef = useRef(false);
  const userTouchedVoucherRef = useRef(false);

  // Vouchers state for Online payment
  const [activeVouchers, setActiveVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);

  const {
    state,
    buoiAvailability,
    hasExistingClinicalExam,
    isPhoneTakenByOther,
    setDateField,
    setBuoiField,
    setFormField,
    setSubmitting
  } = useBookingState(user, bookingType, selectedServiceId, services);

  const { selectedDate, selectedBuoi, isSubmitting, formData } = state;

  const selectedService = services.find(s => s.id === selectedServiceId);
  const serviceDuration = Number(selectedService?.thoi_luong_phut) || 30;

  // Nhân sự hiển thị PHẢI lọc theo buổi đang chọn + còn đủ phút cho đúng dịch vụ (điều kiện #7,
  // "Danh sách đầy đủ điều kiện chặn đặt lịch") — nếu không lọc, khách chọn được người đã hết chỗ
  // ở buổi này, chỉ bị từ chối khi submit thay vì thấy ngay tại đây.
  const staffList = useMemo(() => {
    if (buoiAvailability.nhanSu.length === 0) return specialists;
    if (!selectedBuoi) return [];
    return buoiAvailability.nhanSu.filter((ns: any) => {
      const conLai = selectedBuoi === 'sang' ? ns.conLaiSang : ns.conLaiChieu;
      return conLai >= serviceDuration;
    });
  }, [buoiAvailability.nhanSu, selectedBuoi, serviceDuration, specialists]);
  const selectedStaffObj = staffList.find(s => String(s.id) === selectedStaffId);

  // Buổi đổi thì nhân sự đã chọn có thể không còn đủ chỗ ở buổi mới — reset để tránh giữ lựa chọn
  // đã hết hiệu lực (loại riêng khỏi effect reset theo dịch vụ/loại lịch bên dưới).
  useEffect(() => {
    setSelectedStaffId('');
  }, [selectedBuoi]);

  // Intercept Route: Ensure user authentication & client role
  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated() && user) {
      const roleId = Number(user.vai_tro_id);
      if (roleId !== 1 && roleId !== 0) {
        toast.error('Tài khoản nhân sự không thể sử dụng chức năng đặt lịch của Khách hàng. Vui lòng đăng ký tài khoản khách hàng riêng.');
        const defaultRoute = roleId === 5 || roleId === 6 ? '/admin' : roleId === 2 ? '/receptionist' : roleId === 4 ? '/doctor' : '/technician/appointments';
        navigate(defaultRoute, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Enforce PayOS Online payment if customer has >= 2 no-shows
  useEffect(() => {
    if (buoiAvailability?.buoc_thanh_toan_online && paymentMethod !== 'payos') {
      setPaymentMethod('payos');
    }
  }, [buoiAvailability?.buoc_thanh_toan_online, paymentMethod]);

  // Fetch list of services & staff
  useEffect(() => {
    setServicesLoading(true);
    fetch(`${BASE_URL}/client/services`)
      .then(res => res.json())
      .then(data => setServices(data || []))
      .catch(err => console.error('Lỗi tải danh sách dịch vụ:', err))
      .finally(() => setServicesLoading(false));

    fetch(`${BASE_URL}/client/specialists`)
      .then(res => res.json())
      .then(data => setSpecialists(data || []))
      .catch(err => console.error('Lỗi tải danh sách nhân sự:', err));
  }, []);

  // Auto select default service and reset staff when bookingType or services list changes
  useEffect(() => {
    if (services.length === 0) return;
    if (bookingType === 'kham') {
      const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
      if (examService && selectedServiceId !== examService.id) {
        setSelectedServiceId(examService.id);
      }
    } else {
      const regularService = services.find(s => s.loai_goi !== 'KHAM' && s.loai_dich_vu !== 'KHAM');
      if (regularService && selectedServiceId !== regularService.id) {
        setSelectedServiceId(regularService.id);
      }
    }
    setSelectedStaffId('');
  }, [bookingType, services]);

  // Fetch active vouchers for Client Online booking
  useEffect(() => {
    fetch(`${BASE_URL}/client/vouchers/active`)
      .then(res => res.json())
      .then(data => {
        const list = data.vouchers || [];
        setActiveVouchers(list);
      })
      .catch(err => console.error('Lỗi tải voucher client:', err));
  }, []);

  // Price calculations
  const rawPrice = selectedService ? Number(selectedService.don_gia) : (bookingType === 'kham' ? 200000 : 0);

  // AUTO-APPLY ENGINE: Auto-select best eligible voucher ONLY ONCE when switching to PayOS
  useEffect(() => {
    if (paymentMethod === 'tai_quay') {
      setSelectedVoucher(null);
      userTouchedVoucherRef.current = false;
      return;
    }

    // Respect user's manual dropdown selection (including "No voucher")
    if (userTouchedVoucherRef.current) {
      return;
    }

    if (activeVouchers.length === 0) {
      setSelectedVoucher(null);
      return;
    }

    const currentLoaiGoi = bookingType === 'kham' ? 'KHAM' : 'LE';

    const eligible = activeVouchers.filter((v: any) => {
      const kenhList = Array.isArray(v.kenh_ap_dung)
        ? v.kenh_ap_dung.map((k: any) => String(k).toLowerCase().trim())
        : [String(v.kenh_ap_dung || '').toLowerCase().trim()];

      const goiList = Array.isArray(v.loai_goi_ap_dung)
        ? v.loai_goi_ap_dung.map((g: any) => String(g).toLowerCase().trim())
        : [String(v.loai_goi_ap_dung || '').toLowerCase().trim()];

      const isOnlineOnly = kenhList.some((k: string) => k === 'online' || k === 'web_online' || k === 'web online');
      const isTatCaKenh = kenhList.length === 0 || kenhList.some((k: string) => !k || k === 'tat_ca' || k === 'all');
      const matchKenh = isOnlineOnly || isTatCaKenh;

      const matchGoi = goiList.length === 0 || goiList.some((g: string) => !g || g === currentLoaiGoi.toLowerCase() || g === 'tat_ca' || g === 'all' || g === 'toan_bo');
      const matchMin = rawPrice >= (Number(v.don_hang_toi_thieu) || 0);
      return matchKenh && matchGoi && matchMin;
    });

    const autoVoucher = eligible.find((v: any) => v.tu_dong_ap_dung === true || v.tu_dong_ap_dung === 'true') || eligible[0];
    if (autoVoucher) {
      setSelectedVoucher(autoVoucher);
    }
  }, [paymentMethod, bookingType, rawPrice, activeVouchers]);

  const calculateDiscount = (v: any, price: number) => {
    if (!v) return 0;
    if (v.loai_giam === 'phan_tram' || v.loai_giam === 'percentage') {
      const disc = Math.round(price * (Number(v.gia_tri_giam) / 100));
      return v.giam_toi_da ? Math.min(disc, Number(v.giam_toi_da)) : disc;
    }
    return Number(v.gia_tri_giam || 0);
  };
  const discountAmount = selectedVoucher ? calculateDiscount(selectedVoucher, rawPrice) : 0;
  const finalPrice = Math.max(0, rawPrice - discountAmount);

  // Trigger PayOS Link creation via official PayOS SDK backend endpoint
  useEffect(() => {
    if (paymentMethod === 'payos' && payTermsAccepted && finalPrice > 0) {
      setPayosLoading(true);
      fetch(`${BASE_URL}/client/payment/create-payos-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          phone: formData.so_dien_thoai || user?.so_dien_thoai || '0987654321',
          description: `DAT LICH ${formData.so_dien_thoai || 'OFFICECARE'}`
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.qrCode || data.checkoutUrl) {
            setPayosData(data);
          } else {
            toast.error(data.message || 'Không thể khởi tạo mã QR PayOS');
          }
        })
        .catch(err => {
          console.error('Lỗi khởi tạo PayOS link:', err);
          toast.error('Lỗi kết nối khởi tạo mã QR PayOS');
        })
        .finally(() => setPayosLoading(false));
    } else {
      setPayosData(null);
    }
  }, [paymentMethod, payTermsAccepted, finalPrice, formData.so_dien_thoai, user]);

  // Reset terms agreement when switching back to Cash at Counter
  useEffect(() => {
    if (paymentMethod === 'tai_quay') {
      setPayTermsAccepted(false);
      setPayosData(null);
    }
  }, [paymentMethod]);

  // Real-time PayOS Webhook Polling & 10-minute Countdown Timer
  useEffect(() => {
    if (!payosData || !payosData.orderCode) {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setPayosTimeLeft(600);
      return;
    }

    setPayosTimeLeft(600);
    isCreatingBookingRef.current = false;

    // Start 10-minute countdown
    countdownTimerRef.current = setInterval(() => {
      setPayosTimeLeft((prev) => {
        if (prev <= 1) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          toast.error('Mã thanh toán QR PayOS đã hết hạn (quá 10 phút)! Vui lòng thử lại.');
          setPayosData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling payment status every 3s
    pollingTimerRef.current = setInterval(async () => {
      if (isCreatingBookingRef.current) return;
      try {
        const res = await fetch(`${BASE_URL}/client/payment/status/${payosData.orderCode}`);
        const data = await res.json();
        if (data && (data.paid || data.status === 'PAID' || data.status === 'PAID_SUCCESS')) {
          isCreatingBookingRef.current = true;
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          toast.success('🎉 Hệ thống đã nhận tiền chuyển khoản PayOS thành công!');
          await executeBookingCreation('payos');
        }
      } catch (err) {
        console.error('Lỗi kiểm tra thanh toán PayOS:', err);
      }
    }, 3000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [payosData]);

  // Reset session and staff when service or booking type changes
  useEffect(() => {
    setBuoiField('');
    setSelectedStaffId('');
  }, [selectedServiceId, bookingType, setBuoiField]);

  const validateFormFields = (): boolean => {
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày!');
      return false;
    }
    if (!selectedBuoi) {
      toast.error('Vui lòng chọn buổi (Sáng hoặc Chiều)!');
      return false;
    }
    const nameTrimmed = (formData.ho_ten_khach || user?.ho_ten || '').trim();
    const phoneTrimmed = (formData.so_dien_thoai || user?.so_dien_thoai || '').trim();
    const symptomTrimmed = formData.trieu_chung.trim();

    if (!nameTrimmed) {
      toast.error('Thông tin họ tên tài khoản không hợp lệ!');
      return false;
    }

    if (!phoneTrimmed) {
      toast.error('Thông tin số điện thoại tài khoản không hợp lệ!');
      return false;
    }

    if (bookingType === 'kham') {
      if (!symptomTrimmed) {
        toast.error('Vui lòng nhập lý do khám / triệu chứng!');
        return false;
      }
    }

    // Chặn TRƯỚC KHI cho sang PayOS — quan trọng hơn cả chặn ở handleSubmit, vì nhánh PayOS tạo
    // lịch NGAY SAU khi webhook báo đã nhận tiền (executeBookingCreation gọi từ effect polling,
    // không đi qua handleSubmit). Không chặn ở đây thì khách có thể trả tiền thành công cho một
    // lượt khám sẽ bị backend từ chối tạo — tiền đã đi, lịch thì không.
    if (hasExistingClinicalExam && bookingType === 'kham') {
      toast.error('Bạn đã có một buổi Lượng giá trong ngày này — vui lòng chọn ngày khác trước khi thanh toán.');
      return false;
    }
    if (isPhoneTakenByOther) {
      toast.error('Số điện thoại tài khoản đã thuộc về hồ sơ khách hàng khác — vui lòng cập nhật lại trước khi thanh toán.');
      return false;
    }
    return true;
  };

  const handleAgreeTermsModalGate = async () => {
    if (!acceptedTerms) return;
    setAgreeingLoading(true);
    try {
      await agreeTerms();
      updateUser({ ngay_dong_y_dieu_khoan: new Date().toISOString() });
      toast.success('Xác nhận đồng ý điều khoản dịch vụ thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi ghi nhận đồng ý điều khoản. Vui lòng thử lại.');
    } finally {
      setAgreeingLoading(false);
    }
  };

  const handleConfirmModalTerms = () => {
    if (!validateFormFields()) return;
    if (!modalTermsChecked) {
      toast.error('Vui lòng tích chọn đồng ý với tất cả điều khoản dịch vụ & thanh toán!');
      return;
    }
    setPayTermsAccepted(true);
    setIsTermsModalOpen(false);
    toast.success('Đã xác nhận đồng ý điều khoản! Đang khởi tạo mã QR PayOS...');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormField(e.target.name, e.target.value);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận tệp hình ảnh (.jpg, .png, .webp)!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormField('anh_dinh_kem_url', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormField('anh_dinh_kem_url', '');
  };

  // Helper function to create appointment in database
  const executeBookingCreation = async (method: 'payos' | 'tai_quay') => {
    if (isSubmitting) return;
    const toastId = toast.loading(method === 'payos' ? 'Đang tự động kích hoạt lượt khám...' : 'Đang gửi đăng ký lượt khám...');
    setSubmitting(true);

    try {
      const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
      const targetDichVuId = bookingType === 'dich_vu' ? selectedServiceId : (examService?.id || services[0]?.id);
      const payNow = method === 'payos';

      const response = await fetch(`${BASE_URL}/client/appointments/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ho_ten_khach: user?.ho_ten || formData.ho_ten_khach,
          so_dien_thoai: user?.so_dien_thoai || formData.so_dien_thoai,
          ngay: selectedDate,
          buoi: selectedBuoi,
          khach_hang_id: user?.id,
          nhan_su_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
          goi_dich_vu_id: targetDichVuId,
          trieu_chung: bookingType === 'dich_vu' ? `Đặt lịch gói lẻ: ${selectedService?.ten_dich_vu || 'Dịch vụ lẻ PHCN'}` : formData.trieu_chung,
          ly_do_kham: bookingType === 'dich_vu' ? `Trị liệu lẻ: ${selectedService?.ten_dich_vu || 'Không rõ'}` : (formData.ly_do_kham || 'Khám lượng giá ban đầu'),
          trang_thai: 'da_xac_nhan',
          trang_thai_thanh_toan: payNow ? 'da_thanh_toan' : 'chua_thanh_toan',
          hinh_thuc_thanh_toan: method,
          ma_voucher: selectedVoucher ? selectedVoucher.ma_voucher : null
        }),
      });

      if (response.ok) {
        if (user && user.ngay_dong_y_dieu_khoan === null) {
          await agreeTerms().catch(() => {});
          updateUser({ ngay_dong_y_dieu_khoan: new Date().toISOString() });
        }

        const appt = await response.json();
        toast.success(payNow ? '🎉 Thanh toán PayOS thành công & Lượt khám đã được xác nhận!' : 'Đăng ký lượt khám thành công!', { id: toastId });

        if (user) {
          navigate('/appointments');
        } else {
          navigate(`/booking/success/${appt.id}`);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể đăng ký lịch hẹn. Hãy thử lại.', { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ trị liệu!', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày!');
      return;
    }
    if (!selectedBuoi) {
      toast.error('Vui lòng chọn buổi (Sáng hoặc Chiều)!');
      return;
    }
    if (hasExistingClinicalExam && bookingType === 'kham') {
      toast.error('Bạn đã có một buổi Lượng giá trong ngày này — vui lòng chọn ngày khác.');
      return;
    }
    if (isPhoneTakenByOther) {
      toast.error('Số điện thoại tài khoản đã thuộc về hồ sơ khách hàng khác — vui lòng cập nhật lại trước khi đặt lịch.');
      return;
    }
    const nameTrimmed = (formData.ho_ten_khach || user?.ho_ten || '').trim();
    const phoneTrimmed = (formData.so_dien_thoai || user?.so_dien_thoai || '').trim();
    const symptomTrimmed = formData.trieu_chung.trim();

    if (!nameTrimmed) {
      toast.error('Thông tin họ tên tài khoản không hợp lệ!');
      return;
    }

    if (!phoneTrimmed) {
      toast.error('Thông tin số điện thoại tài khoản không hợp lệ!');
      return;
    }

    if (bookingType === 'kham') {
      if (!symptomTrimmed) {
        toast.error('Vui lòng nhập lý do khám / triệu chứng!');
        return;
      }
    }

    if (paymentMethod === 'payos' && !payTermsAccepted) {
      toast.error('Bạn vui lòng tích xem & đồng ý Điều khoản thanh toán để tiếp tục!');
      return;
    }

    await executeBookingCreation(paymentMethod);
  };

  // Prevent flashing component structure if unauthenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="relative max-w-[540px] w-full bg-white rounded-[32px] sm:rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-2xl z-10 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-[#2EC4B6]/10 text-[#2EC4B6] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <User size={36} strokeWidth={2.2} />
          </div>
          <h3 className="font-heading font-black text-2xl sm:text-[28px] text-slate-900 text-center mb-4 tracking-tight leading-snug">
            Yêu cầu đăng nhập
          </h3>
          <p className="text-slate-500 font-semibold text-sm leading-relaxed text-center mb-10 px-2 max-w-[420px] mx-auto">
            Quý khách vui lòng đăng nhập tài khoản để tiến hành đặt lịch khám lượng giá và trị liệu tại trung tâm OfficeCare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[13px] tracking-wide py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-md cursor-pointer"
            >
              HỦY
            </button>
            <button
              onClick={() => navigate('/login', { state: { from: '/booking' } })}
              className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-extrabold text-[13px] tracking-wide py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-md cursor-pointer"
            >
              ĐẮNG NHẬP NGAY
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Official VietQR URL for official PayOS payload
  const payosQrImgUrl = payosData
    ? `https://img.vietqr.io/image/${payosData.bin || 'MB'}-${payosData.accountNumber || '0358966332'}-compact2.png?amount=${payosData.amount}&addInfo=${encodeURIComponent(payosData.description)}&accountName=${encodeURIComponent(payosData.accountName || 'PHONG KHAM PHCN OFFICECARE')}`
    : '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-6 pb-20 px-4 sm:px-6 lg:px-8 font-jakarta">
      {/* Terms and Conditions Consent Modal Gate for New Account */}
      {user && user.ngay_dong_y_dieu_khoan === null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-2xl w-full bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 md:p-10 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="text-center pb-5 border-b border-slate-100 shrink-0">
              <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
                📜 Cam kết chất lượng
              </span>
              <h2 className="font-heading font-black text-xl md:text-2xl text-slate-900 tracking-tight leading-tight mb-2">
                Điều khoản dịch vụ &amp; Quy định
              </h2>
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">
                Áp dụng cho mọi hoạt động trị liệu tại OfficeCare
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-6 pr-2 my-4 border-b border-slate-100 space-y-6 text-left text-xs">
              <p className="text-slate-650 leading-relaxed font-semibold">
                Chào mừng quý khách đến với trung tâm Vật lý trị liệu và Phục hồi chức năng <strong>OfficeCare</strong>. Xin vui lòng đọc kỹ các quy định dưới đây:
              </p>
              {TERMS_OF_SERVICE.map((section) => (
                <div key={section.heading} className="space-y-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="size-1.5 bg-[#0D9488] rounded-full shrink-0" />
                    {section.heading}
                  </h3>
                  <div className="space-y-2.5 pl-3.5">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 shrink-0 space-y-4 text-left">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 size-4 text-teal-600 border-slate-200 rounded focus:ring-teal-500/20 cursor-pointer"
                />
                <span className="text-[11px] text-slate-600 font-bold leading-relaxed select-none">
                  Tôi đã đọc, hiểu rõ và đồng ý với tất cả Điều khoản dịch vụ &amp; Quy chế uy tín của OfficeCare.
                </span>
              </label>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                  className="py-3.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center flex-1"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={!acceptedTerms || agreeingLoading}
                  onClick={handleAgreeTermsModalGate}
                  className="py-3.5 px-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-[2] cursor-pointer shadow-md"
                >
                  {agreeingLoading ? <Loader2 className="animate-spin" size={14} /> : 'Đồng ý & Tiếp tục đặt lịch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: ĐIỀU KHOẢN THANH TOÁN ONLINE */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-2xl w-full bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 md:p-10 flex flex-col max-h-[90vh] overflow-hidden text-left">
            <div className="text-center pb-5 border-b border-slate-100 shrink-0">
              <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
                📋 Quy định &amp; Điều khoản thanh toán
              </span>
              <h2 className="font-heading font-black text-xl md:text-2xl text-slate-900 tracking-tight leading-tight mb-1">
                Điều khoản thanh toán &amp; Nhận số đăng ký Online
              </h2>
              <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">
                Vui lòng đọc và tích đồng ý điều khoản để kích hoạt sinh mã QR PayOS
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-6 pr-2 my-4 border-b border-slate-100 space-y-6 text-xs">
              <p className="text-slate-650 leading-relaxed font-semibold">
                Khi sử dụng hình thức <strong>Thanh toán Online (PayOS)</strong> để hoàn tất đăng ký lượt khám tại OfficeCare, bạn đồng ý tuân thủ các quy định sau:
              </p>
              {TERMS_OF_SERVICE.map((section) => (
                <div key={section.heading} className="space-y-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="size-1.5 bg-[#0D9488] rounded-full shrink-0" />
                    {section.heading}
                  </h3>
                  <div className="space-y-2.5 pl-3.5">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 shrink-0 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100">
                <input
                  type="checkbox"
                  checked={modalTermsChecked}
                  onChange={(e) => setModalTermsChecked(e.target.checked)}
                  className="mt-0.5 size-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500/20 cursor-pointer"
                />
                <span className="text-xs text-slate-800 font-extrabold leading-relaxed select-none">
                  Tôi đã đọc, hiểu rõ và đồng ý với tất cả Điều khoản dịch vụ &amp; Quy định thanh toán online tại OfficeCare.
                </span>
              </label>

              <div className="flex gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="py-3.5 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center flex-1"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!modalTermsChecked}
                  onClick={handleConfirmModalTerms}
                  className="py-3.5 px-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black rounded-2xl text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-[2] cursor-pointer shadow-md"
                >
                  <FileCheck size={16} /> Xác nhận đồng ý điều khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* HERO BANNER SECTION WITH GUIDANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/60 px-3.5 py-1.5 rounded-full select-none">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
              </span>
              <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">OfficeCare Single-Page Booking</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Đặt lịch khám &amp; Trị liệu <span className="text-teal-600">PHCN Chuyên sâu</span>
            </h1>
            <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl space-y-1 max-w-2xl">
              <p className="text-xs font-black text-teal-900 uppercase tracking-wider">💡 Hướng dẫn đăng ký lượt khám:</p>
              <p className="text-slate-650 font-medium text-xs leading-relaxed">
                Hệ thống vận hành theo mô hình Lấy số – Chờ gọi theo buổi. Quý khách vui lòng chọn loại dịch vụ, ngày và buổi khám mong muốn để đăng ký lượt phục vụ.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center justify-start lg:justify-end gap-3 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <span>4.9/5 Chuyên nghiệp</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <ShieldCheck size={16} className="text-teal-600" />
              <span>Chuẩn Y khoa</span>
            </div>
          </div>
        </div>

        {/* MAIN UNIFIED BOOKING FORM & SUMMARY (1-STEP EXPERIENCE) */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 8-COLS: MAIN FORM CONTROL PANEL */}
          <div className="lg:col-span-8 space-y-6">

            {/* KHỐI 1: CHỌN LOẠI DỊCH VỤ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">1. Chọn loại gói dịch vụ</h3>
                  <p className="text-xs text-slate-400 font-medium">Chọn tư vấn lượng giá phục hồi chức năng hoặc làm dịch vụ đơn lẻ</p>
                </div>
              </div>

              {/* Segmented Track Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setBookingType('kham');
                    const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
                    if (examService) setSelectedServiceId(examService.id);
                    setSelectedStaffId('');
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    bookingType === 'kham'
                      ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {bookingType === 'kham' && (
                    <span className="absolute top-3 right-3 text-teal-600">
                      <CheckCircle2 size={18} />
                    </span>
                  )}
                  <div className="flex items-center gap-2.5 text-teal-700 font-black text-xs uppercase tracking-wider mb-2">
                    <Activity size={16} />
                    <span>Buổi Lượng Giá Chức Năng</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mb-1">Lượng giá PHCN &amp; Đánh giá ROM/VAS/MMT</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Dành cho khách hàng mới hoặc đau mạn tính — Chuyên viên đánh giá chức năng, lập kế hoạch trị liệu và chỉ định gói phù hợp.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBookingType('dich_vu');
                    const leServices = services.filter(s => s.loai_goi === 'LE' || s.loai_dich_vu === 'DICH_VU_LE' || s.loai_goi !== 'KHAM');
                    if (leServices.length > 0) setSelectedServiceId(leServices[0].id);
                    setSelectedStaffId('');
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    bookingType === 'dich_vu'
                      ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {bookingType === 'dich_vu' && (
                    <span className="absolute top-3 right-3 text-teal-600">
                      <CheckCircle2 size={18} />
                    </span>
                  )}
                  <div className="flex items-center gap-2.5 text-teal-700 font-black text-xs uppercase tracking-wider mb-2">
                    <Sparkles size={16} />
                    <span>Gói Lẻ (Dịch Vụ Đơn Lẻ)</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mb-1">Đặt dịch vụ lẻ trực tiếp siêu tốc</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Siêu âm, Điện xung, Kéo giãn, Nắn chỉnh... Đặt trực tiếp không cần gõ lý do khám hay up ảnh.
                  </p>
                </button>
              </div>

              {/* Service Cards Picker (When dich_vu is chosen) */}
              {bookingType === 'dich_vu' && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Danh sách dịch vụ đơn lẻ PHCN *
                  </label>
                  {servicesLoading ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 py-4">
                      <Loader2 className="animate-spin" size={16} /> Đang tải danh sách dịch vụ lẻ...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.filter(s => s.loai_goi === 'LE' || s.loai_dich_vu === 'DICH_VU_LE' || s.loai_goi !== 'KHAM').map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedServiceId(s.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            selectedServiceId === s.id
                              ? 'border-teal-500 bg-teal-500/5 text-slate-900 ring-2 ring-teal-500/20 font-bold'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-black leading-snug">{s.ten_dich_vu}</span>
                            <span className="text-[11px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full shrink-0 border border-teal-100">
                              {Number(s.don_gia).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">Thời lượng: {s.thoi_luong_phut} phút</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* KHỐI 2: CHỌN NGÀY & BUỔI (GIAO DIỆN CHỌN NHÂN SỰ CÓ AVATAR NÂNG CAO) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">2. Chọn ngày &amp; Buổi</h3>
                  <p className="text-xs text-slate-400 font-medium">Đơn vị đặt lịch là Buổi Sáng hoặc Buổi Chiều</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Date Input */}
                <div className="space-y-2">
                  <label htmlFor="selectedDateInput" className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Ngày *
                  </label>
                  <input
                    id="selectedDateInput"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setDateField(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition-all cursor-pointer"
                  />
                  {selectedDate && (
                    <p className="text-[11px] font-bold text-teal-600 capitalize">
                      📅 {formatFullDate(selectedDate)}
                    </p>
                  )}
                </div>

                {/* Session Radios (Sáng vs Chiều) */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Chọn Buổi *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const sangDaQua = isBuoiDaQua(selectedDate, 'sang');
                      const sangChoPhep = buoiAvailability.sang.choPhep && !sangDaQua;
                      const chieuDaQua = isBuoiDaQua(selectedDate, 'chieu');
                      const chieuChoPhep = buoiAvailability.chieu.choPhep && !chieuDaQua;

                      return (
                        <>
                          <button
                            type="button"
                            disabled={!sangChoPhep}
                            onClick={() => setBuoiField('sang')}
                            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                              selectedBuoi === 'sang' && sangChoPhep
                                ? 'border-teal-500 bg-teal-50 text-teal-900 font-black ring-2 ring-teal-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className="text-xs font-black">🌅 Buổi Sáng</div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">07:30 – 12:00</div>
                            <div className={`text-[9px] font-bold mt-1 ${sangDaQua ? 'text-rose-500' : sangChoPhep ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {sangDaQua ? 'Đã qua giờ nhận khách' : (!buoiAvailability.sang.choPhep ? 'Hết chỗ' : `Còn ${buoiAvailability.sang.conLaiChung} phút`)}
                            </div>
                          </button>

                          <button
                            type="button"
                            disabled={!chieuChoPhep}
                            onClick={() => setBuoiField('chieu')}
                            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                              selectedBuoi === 'chieu' && chieuChoPhep
                                ? 'border-teal-500 bg-teal-50 text-teal-900 font-black ring-2 ring-teal-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className="text-xs font-black">🌆 Buổi Chiều</div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">12:00 – 19:30</div>
                            <div className={`text-[9px] font-bold mt-1 ${chieuDaQua ? 'text-rose-500' : chieuChoPhep ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {chieuDaQua ? 'Đã qua giờ nhận khách' : (!buoiAvailability.chieu.choPhep ? 'Hết chỗ' : `Còn ${buoiAvailability.chieu.conLaiChung} phút`)}
                            </div>
                          </button>
                        </>
                      );
                    })()}
                  </div>

                  {/* PHASE 1: GỢI Ý KHUNG GIỜ ĐẾN THEO THỜI LƯỢNG DỊCH VỤ */}
                  {selectedBuoi && (
                    <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs flex items-center gap-2.5 text-teal-950 leading-relaxed font-medium animate-in fade-in duration-200 mt-2.5">
                      <Info size={16} className="text-teal-600 shrink-0" />
                      <div>
                        Dịch vụ bạn chọn có thời lượng <strong className="text-teal-700 font-extrabold">{serviceDuration} phút</strong>. Quý khách vui lòng đến trong khung giờ từ <strong className="text-slate-900 font-extrabold">{selectedBuoi === 'sang' ? '7h30' : '12h00'}</strong> đến trước <strong className="text-emerald-700 font-black">{selectedBuoi === 'sang' ? `${Math.floor((12 * 60 - serviceDuration) / 60)}h${(12 * 60 - serviceDuration) % 60 < 10 ? '0' : ''}${(12 * 60 - serviceDuration) % 60}` : `${Math.floor((19 * 60 + 30 - serviceDuration) / 60)}h${(19 * 60 + 30 - serviceDuration) % 60 < 10 ? '0' : ''}${(19 * 60 + 30 - serviceDuration) % 60}`}</strong> để được hỗ trợ phục vụ tốt nhất.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CẢNH BÁO MỀM: khách đã có 1 lịch ĐÚNG dịch vụ này trong buổi đang chọn (vd đặt
                  massage toàn thân 10h rồi đặt tiếp cùng dịch vụ lúc 11h cùng buổi) — chỉ thông
                  báo, KHÔNG chặn submit, khác hẳn 2 cảnh báo chặn cứng bên dưới. Quyết định
                  09/08/2026: dịch vụ lẻ trùng có thể là ý định thật của khách (không giống 2 buổi
                  Lượng giá cùng ngày), nhưng vẫn cần báo trước để bắt lỗi bấm nhầm/double-click. */}
              {bookingType === 'dich_vu' && selectedBuoi && buoiAvailability[selectedBuoi].trungDichVu && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-amber-800 text-[10px]">Bạn đã đặt dịch vụ này trong buổi rồi</p>
                    <p className="mt-0.5 font-bold text-amber-700">
                      Bạn đang có 1 lịch <span className="font-extrabold text-amber-900">{selectedService?.ten_dich_vu || 'dịch vụ này'}</span> trong {BUOI_INFO[selectedBuoi].label.toLowerCase()} ngày {selectedDate ? formatFullDate(selectedDate) : ''}. Vẫn có thể đặt thêm nếu bạn chắc chắn muốn đặt 2 lượt.
                    </p>
                  </div>
                </div>
              )}

              {/* CẢNH BÁO TỨC THÌ: đã có buổi Lượng giá trong ngày này — hiện ngay khi ngày/loại
                  dịch vụ khiến trạng thái này đúng, không chờ khách bấm nút xác nhận nào */}
              {hasExistingClinicalExam && bookingType === 'kham' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold">
                  <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-rose-800 text-[10px]">Trùng buổi Lượng giá trong ngày</p>
                    <p className="mt-0.5 font-bold text-rose-700">
                      Bạn đã có một buổi Lượng giá vào ngày <span className="font-extrabold text-rose-900">{selectedDate ? formatFullDate(selectedDate) : ''}</span>. Mỗi ngày chỉ đặt được 1 buổi Lượng giá — vui lòng chọn ngày khác hoặc gọi hotline <span className="font-extrabold text-slate-900">0398 655 332</span> nếu cần hỗ trợ.
                    </p>
                  </div>
                </div>
              )}

              {/* REDESIGNED STAFF SELECTOR CARDS WITH AVATAR */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    {bookingType === 'kham' ? 'Chọn Chuyên viên VLTL Lượng giá' : 'Chọn Kỹ thuật viên thực hiện'} (Tùy chọn)
                  </label>
                  <span className="text-[10px] text-teal-600 font-bold">⭐ Bất kỳ = Tự động gán người rảnh sớm nhất</span>
                </div>

                {!selectedBuoi ? (
                  <p className="text-[11px] text-slate-400 font-bold py-2">Vui lòng chọn Buổi Sáng/Chiều ở trên trước để xem nhân sự còn chỗ.</p>
                ) : staffList.length === 0 ? (
                  <p className="text-[11px] text-amber-600 font-bold py-2">Không còn nhân sự nào đủ chỗ cho dịch vụ này ở buổi đã chọn — vui lòng đổi buổi.</p>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Any Staff Card Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedStaffId('')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedStaffId === ''
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm shrink-0">
                      ✨
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">Bất kỳ nhân sự</div>
                      <div className="text-[10px] text-teal-600 font-bold">Hệ thống rải tải rảnh nhất</div>
                    </div>
                  </button>

                  {/* Staff List Cards */}
                  {staffList.map((ns: any) => (
                    <button
                      key={ns.id}
                      type="button"
                      onClick={() => setSelectedStaffId(String(ns.id))}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selectedStaffId === String(ns.id)
                          ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {ns.anh_dai_dien ? (
                          <img src={ns.anh_dai_dien} alt={ns.ho_ten} className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">{ns.ho_ten}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">
                          {ns.caTruc === 'ca_1' ? 'Ca Sáng (7h-16h)' : ns.caTruc === 'ca_2' ? 'Ca Chiều (11h-20h)' : (ns.chuyen_mon || 'Chuyên viên PHCN')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* KHỐI 3: THÔNG TIN KHÁCH HÀNG (DISABLE HỌ TÊN + SĐT, XÓA GIỚI TÍNH) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">3. Thông tin người thăm khám</h3>
                  <p className="text-xs text-slate-400 font-medium">Hồ sơ y tế cố định gắn với tài khoản cá nhân đã đăng nhập</p>
                </div>
              </div>

              {/* CẢNH BÁO TỨC THÌ: SĐT tài khoản trùng với tài khoản khác trong hệ thống — hiện
                  ngay khi phát hiện, không chờ khách bấm submit */}
              {isPhoneTakenByOther && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold">
                  <Phone size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-amber-800 text-[10px]">Số điện thoại đã được sử dụng</p>
                    <p className="mt-0.5 font-bold text-amber-700">
                      Số điện thoại của tài khoản này đã thuộc về một hồ sơ khách hàng khác trong hệ thống. Vui lòng vào trang cá nhân cập nhật lại số điện thoại chính xác trước khi đặt lịch.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Disabled Full Name Input */}
                <div className="space-y-1.5">
                  <label htmlFor="hoTenInputDisabled" className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                    Họ và tên tài khoản
                  </label>
                  <input
                    id="hoTenInputDisabled"
                    type="text"
                    value={user?.ho_ten || formData.ho_ten_khach || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 cursor-not-allowed opacity-85"
                  />
                </div>

                {/* Disabled Phone Input + Helper Note */}
                <div className="space-y-1.5">
                  <label htmlFor="sdtInputDisabled" className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                    Số điện thoại tài khoản
                  </label>
                  <input
                    id="sdtInputDisabled"
                    type="tel"
                    value={user?.so_dien_thoai || formData.so_dien_thoai || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 cursor-not-allowed opacity-85"
                  />
                </div>

                {/* User Phone Number Note */}
                <div className="sm:col-span-2 p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-teal-800 text-[11px] font-bold flex items-center gap-2">
                  <Info size={15} className="text-teal-600 shrink-0" />
                  <span>Quý khách có nhu cầu đổi số điện thoại vui lòng vào trang cá nhân để cập nhật số mới nhất.</span>
                </div>
              </div>

              {/* CONDITIONAL CLINICAL FIELDS: ONLY SHOWN FOR GÓI TƯ VẤN (KHÁM) */}
              {bookingType === 'kham' ? (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label htmlFor="trieuChungArea" className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Mô tả triệu chứng &amp; Vị trí đau *
                    </label>
                    <textarea
                      id="trieuChungArea"
                      name="trieu_chung"
                      rows={3}
                      value={formData.trieu_chung}
                      onChange={handleChange}
                      placeholder="VD: Đau mỏi vùng cổ vai gáy lan xuống tay phải khi ngồi làm việc máy tính >4 tiếng, xoay cổ bị hạn chế..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition-all leading-relaxed"
                    />
                  </div>

                  {/* Upload Image Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Tải ảnh chẩn đoán / Phim X-quang, MRI (Tùy chọn)
                    </label>
                    {formData.anh_dinh_kem_url ? (
                      <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-teal-200 group shadow-xs">
                        <img src={formData.anh_dinh_kem_url} alt="Symptom preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-all cursor-pointer shadow-md"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/20 rounded-2xl cursor-pointer transition-all">
                        <Upload size={24} className="text-teal-600 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Tải ảnh triệu chứng hoặc phim chụp</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">Chấp nhận JPG, PNG, WEBP (Tối đa 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* KHỐI 4: PHƯƠNG THỨC THANH TOÁN & KHỐI MÃ QR PAYOS CHUẨN SDK */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs text-left">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">4. Phương thức thanh toán</h3>
                  <p className="text-xs text-slate-400 font-medium">Chọn thanh toán tại quầy hoặc Thanh toán Online mã QR PayOS</p>
                </div>
              </div>

              {/* Payment Option Radios (FIRST) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Chọn phương thức thanh toán *
                </label>

                {buoiAvailability?.buoc_thanh_toan_online && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold mb-3">
                    <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black uppercase tracking-wider text-rose-800 text-[10px]">Yêu cầu thanh toán Online (No-show Enforcement)</p>
                      <p className="mt-0.5 font-bold text-rose-700">
                        Tài khoản của bạn có từ 2 lần vắng mặt (no-show) trong 60 ngày qua. Quý khách vui lòng chọn <span className="font-extrabold text-rose-900 underline">Thanh toán Online PayOS</span> để hoàn tất đặt lịch.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled={!!buoiAvailability?.buoc_thanh_toan_online}
                    onClick={() => setPaymentMethod('tai_quay')}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      paymentMethod === 'tai_quay'
                        ? 'border-teal-500 bg-teal-50/40 text-slate-900 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                  >
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 font-black">🏪</div>
                    <div>
                      <div className="text-xs font-black">Thanh toán tại quầy</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {buoiAvailability?.buoc_thanh_toan_online ? 'Khóa do dính 2 lần No-show' : 'Thanh toán khi tới phòng khám (Chưa thanh toán)'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (paymentMethod !== 'payos') {
                        if (!validateFormFields()) return;
                        setPaymentMethod('payos');
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      paymentMethod === 'payos'
                        ? 'border-teal-500 bg-teal-50/40 text-slate-900 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 font-black">💳</div>
                    <div>
                      <div className="text-xs font-black">Thanh toán Online (PayOS QR)</div>
                      <div className="text-[10px] text-slate-500 font-medium">Quét QR nhận đăng ký ngay (Đã thanh toán)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ONLINE PAYMENT SPECIFIC SECTION: VOUCHER APPLIER + TERMS GATE + PAYOS SDK QR DISPLAY */}
              {paymentMethod === 'payos' && (
                <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                  {/* Voucher Picker & Auto-Apply Badge Section (ONLY SHOWN FOR PAYOS ONLINE) */}
                  <div className="space-y-2.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                    <label htmlFor="clientVoucherSelect" className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag size={15} className="text-teal-600" />
                        Mã ưu đãi &amp; Voucher (Thanh toán Online)
                      </span>
                    </label>

                    {activeVouchers.length > 0 ? (
                      <select
                        id="clientVoucherSelect"
                        value={selectedVoucher?.id || ''}
                        onChange={(e) => {
                          userTouchedVoucherRef.current = true;
                          const matched = activeVouchers.find(v => String(v.id) === e.target.value);
                          setSelectedVoucher(matched || null);
                        }}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-teal-500 outline-none transition-all cursor-pointer"
                      >
                        <option value="">-- Không sử dụng voucher --</option>
                        {activeVouchers.map(v => (
                          <option key={v.id} value={v.id}>
                            🎟️ {v.ma_voucher} ({v.loai_giam === 'phan_tram' ? `Giảm ${v.gia_tri_giam}%` : `Giảm ${Number(v.gia_tri_giam).toLocaleString()}đ`}) {v.tu_dong_ap_dung ? '[Tự động]' : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium">Không tìm thấy voucher khả dụng cho dịch vụ này.</p>
                    )}

                    {selectedVoucher && (
                      <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-emerald-600" />
                          <span>Đã áp dụng mã: <strong className="text-emerald-700">{selectedVoucher.ma_voucher}</strong> ({selectedVoucher.ten_khuyen_mai || 'Ưu đãi'})</span>
                        </div>
                        <span className="text-emerald-700 font-black text-sm">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                  </div>

                  {/* Compulsory Terms Acceptance Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex items-start gap-3 cursor-pointer group flex-1">
                        <input
                          type="checkbox"
                          checked={payTermsAccepted}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (!validateFormFields()) return;
                              setIsTermsModalOpen(true);
                            } else {
                              setPayTermsAccepted(false);
                            }
                          }}
                          className="mt-0.5 size-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500/20 cursor-pointer"
                        />
                        <span className="text-xs text-slate-700 font-extrabold group-hover:text-teal-700 transition-colors leading-relaxed select-none">
                          Tôi đã xem, hiểu rõ và đồng ý với tất cả Điều khoản thanh toán &amp; Quy định đăng ký tại OfficeCare.
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          if (!validateFormFields()) return;
                          setIsTermsModalOpen(true);
                        }}
                        className="text-[11px] font-black text-teal-600 hover:text-teal-800 underline underline-offset-2 shrink-0 cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>

                  {/* OFFICIAL PAYOS SDK QR DISPLAY BOX */}
                  {payTermsAccepted ? (
                    payosLoading ? (
                      <div className="p-8 bg-teal-50/40 rounded-3xl border border-teal-200 text-center space-y-3">
                        <Loader2 className="animate-spin text-teal-600 mx-auto" size={28} />
                        <p className="text-xs font-black text-teal-900">Đang khởi tạo mã QR PayOS SDK chính thức từ máy chủ...</p>
                      </div>
                    ) : payosData ? (
                      <div className="rounded-3xl border border-teal-200 overflow-hidden bg-white shadow-md space-y-0 animate-in zoom-in-95 duration-300">
                        {/* Header bar matching Receptionist PayOS Modal */}
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <QrCode size={20} className="text-teal-200 animate-pulse shrink-0" />
                            <div className="text-left">
                              <h4 className="text-xs font-black uppercase tracking-wider leading-none">CỔNG THANH TOÁN VIETQR PAYOS</h4>
                              <p className="text-[10px] text-teal-100 font-bold mt-0.5">Tự động nhận tiền &amp; xác nhận lượt khám y tế tức thì</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-teal-500/30 text-teal-100 px-2.5 py-0.5 rounded-full border border-teal-400/40">
                              ⚡ WEBHOOK REAL-TIME
                            </span>
                            <span className="text-xs font-black bg-emerald-950/60 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-400/40 font-mono tracking-wider">
                              ⏱ Giữ mã: {String(Math.floor(payosTimeLeft / 60)).padStart(2, '0')}:{String(payosTimeLeft % 60).padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-4 text-left">
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* QR Image generated via PayOS payload */}
                            <div className="size-48 bg-white p-2 rounded-2xl border border-slate-200 shadow-md shrink-0 flex items-center justify-center relative group">
                              <img src={payosQrImgUrl} alt="PayOS QR Transfer" className="w-full h-full object-contain rounded-xl" />
                            </div>

                            {/* PayOS Transfer Details */}
                            <div className="space-y-2 text-xs font-jakarta text-left min-w-0 flex-1">
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Ngân hàng nhận</span>
                                <p className="font-black text-slate-900">MB BANK (Ngân hàng Quân Đội)</p>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Số tài khoản</span>
                                <p className="font-black text-teal-700 text-sm tracking-wider">{payosData.accountNumber || '0358966332'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Tên tài khoản</span>
                                <p className="font-black text-slate-900 uppercase">{payosData.accountName || 'PHONG KHAM PHCN OFFICECARE'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Số tiền cần thanh toán</span>
                                <p className="font-black text-emerald-600 text-base">{Number(payosData.amount || finalPrice).toLocaleString('vi-VN')}đ</p>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Nội dung chuyển khoản chuẩn PayOS</span>
                                <p className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block font-mono text-[11px] select-all">
                                  {payosData.description}
                                </p>
                              </div>

                              {payosData.checkoutUrl && (
                                <div className="pt-1">
                                  <a
                                    href={payosData.checkoutUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[11px] font-black text-teal-700 hover:text-teal-900 underline"
                                  >
                                    Mở cổng PayOS web <ExternalLink size={12} />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-800 text-xs font-bold flex items-center gap-2">
                      <Lock size={16} className="text-amber-600 shrink-0" />
                      <span>Vui lòng xem &amp; tích chọn đồng ý điều khoản ở trên để hiển thị Mã QR chuyển tiền PayOS SDK chuẩn.</span>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* SUBMIT CTA BUTTON (ONLY SHOWN FOR CASH AT COUNTER PAYMENT) */}
            {paymentMethod === 'tai_quay' && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || (hasExistingClinicalExam && bookingType === 'kham') || isPhoneTakenByOther}
                  className="w-full bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-jakarta font-black text-sm uppercase tracking-widest rounded-2xl h-16 shadow-lg shadow-[#2EC4B6]/25 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} /> Đang xử lý đăng ký...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Xác nhận đăng ký lượt khám (Thanh toán tại quầy)
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* RIGHT 4-COLS: STICKY BOOKING SUMMARY CARD */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-5 text-left">
              <div className="space-y-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  bookingType === 'dich_vu' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  {bookingType === 'dich_vu' ? 'Trị liệu dịch vụ đơn lẻ' : 'Gói tư vấn chẩn đoán'}
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {selectedService?.ten_dich_vu || (bookingType === 'dich_vu' ? 'Chọn dịch vụ đơn lẻ' : 'Lượng giá PHCN & Đánh giá ROM/VAS/MMT')}
                </h3>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-3.5 text-xs font-jakarta">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ngày</span>
                  <span className="text-slate-900 font-black capitalize">
                    {selectedDate && isClient ? formatFullDate(selectedDate).split(',').slice(0, 2).join(',') : 'Chưa chọn'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Buổi nhận ca</span>
                  <span className="text-slate-900 font-black">
                    {selectedBuoi ? `${BUOI_INFO[selectedBuoi].label} (${BUOI_INFO[selectedBuoi].khung})` : 'Chưa chọn'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nhân sự</span>
                  <span className="text-teal-700 font-black">
                    {selectedStaffObj ? selectedStaffObj.ho_ten : 'Bất kỳ (Tự rải tải)'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hình thức trả</span>
                  <span className="text-slate-900 font-black">
                    {paymentMethod === 'payos' ? '💳 PayOS Online' : '🏪 Tại quầy'}
                  </span>
                </div>

                {selectedVoucher && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span className="uppercase tracking-wider text-[10px]">Mã giảm giá ({selectedVoucher.ma_voucher})</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-700 font-black uppercase tracking-wider text-xs">Tổng chi phí</span>
                  <span className="text-teal-600 bg-teal-50 border-teal-100 font-black px-3 py-1 rounded-full border text-sm">
                    {finalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* REVISED BENEFITS LIST ACCORDING TO USER'S QUEUE-BASED MODEL */}
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quyền lợi đăng ký</p>
                <ul className="space-y-2 text-xs font-bold text-slate-650">
                  <li className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span>
                    <span>Lấy số thứ tự &amp; Phục vụ theo thứ tự check-in</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span>
                    <span>Đánh giá tầm vận động (ROM) &amp; Cơ lực (MMT)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span>
                    <span>Bảo mật tuyệt đối dữ liệu y tế cá nhân</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

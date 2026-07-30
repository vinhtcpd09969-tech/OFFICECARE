import { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useAuthActions } from '../../stores/authStore';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  updateProfile,
  changePassword,
  getMe,
  getMyReviews,
  updateServiceReview,
  updateStaffReview,
  rateAppointment
} from '../../features/customer/api/customer.api';
import toast from 'react-hot-toast';
import { censorText } from '../../utils/profanity';
import { 
  Settings,
  User,
  Lock,
  ShieldAlert,
  Save,
  Check,
  Loader2,
  Camera,
  Award,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  FileText,
  BadgeCheck,
  Upload,
  Trash2,
  Tag,
  Star,
  MessageSquare,
  Edit2,
  PlusCircle
} from 'lucide-react';

function ReviewCard({
  id,
  title,
  rating,
  comment,
  reply,
  date,
  type,
  onUpdated
}: {
  id: string;
  title: string;
  rating: number;
  comment: string;
  reply?: string | null;
  date: string;
  type: 'service' | 'staff';
  onUpdated: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftRating, setDraftRating] = useState(rating);
  const [draftComment, setDraftComment] = useState(comment);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDraftRating(rating);
    setDraftComment(comment);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { rating: draftRating, comment: draftComment };
      if (type === 'service') {
        await updateServiceReview(id, payload);
      } else {
        await updateStaffReview(id, payload);
      }
      toast.success('Đã cập nhật đánh giá thành công!');
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-[24px] border p-5 shadow-sm space-y-3 transition-all ${
        isEditing
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-zinc-150/60 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-xs text-secondary dark:text-zinc-200 leading-tight">
            {title}
          </h4>
          <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">
            Cập nhật: {new Date(date).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            isEditing ? (
              <button
                key={i}
                type="button"
                onClick={() => setDraftRating(i + 1)}
                className="p-0.5 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <Star
                  size={14}
                  className={i < draftRating ? 'fill-amber-400 text-amber-400 stroke-none' : 'text-zinc-250 fill-zinc-200 stroke-none'}
                />
              </button>
            ) : (
              <Star
                key={i}
                size={11}
                className={i < rating ? 'fill-amber-400 text-amber-400 stroke-none' : 'text-zinc-200 fill-zinc-250 stroke-none'}
              />
            )
          ))}
        </div>
      </div>

      {isEditing ? (
        <textarea
          rows={3}
          value={draftComment}
          onChange={(e) => setDraftComment(e.target.value)}
          placeholder="Bạn có hài lòng về quy trình của gói dịch vụ, thái độ phục vụ của nhân sự hay cơ sở vật chất không? Đóng góp ý kiến tại đây..."
          autoFocus
          className="w-full bg-primary/5 border border-primary/40 focus:border-primary p-3 rounded-xl text-xs font-semibold resize-none outline-none text-slate-700 transition-colors"
        />
      ) : (
        <p className="text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
          "{censorText(comment) || 'Không có nhận xét bằng chữ.'}"
        </p>
      )}

      {!isEditing && reply && (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border-l-2 border-[#0D9488] rounded-xl p-3.5 mt-2.5 text-[11px] space-y-1">
          <p className="font-extrabold text-slate-800 dark:text-zinc-200">
            Phản hồi từ OfficeCare:
          </p>
          <p className="text-slate-655 dark:text-zinc-350 italic">"{reply}"</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
            >
              {saving ? <Loader2 className="animate-spin" size={10} /> : 'Lưu thay đổi'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
          >
            <Edit2 size={10} /> Chỉnh sửa
          </button>
        )}
      </div>
    </div>
  );
}

function PendingReviewCard({
  title,
  cuocHenId,
  type,
  onSubmitted
}: {
  title: string;
  cuocHenId: string;
  type: 'service' | 'staff';
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = type === 'service'
        ? { rating_dich_vu: rating, comment_dich_vu: comment }
        : { rating_ktv: rating, comment_ktv: comment };
      await rateAppointment(cuocHenId, payload);
      toast.success('Đã gửi đánh giá thành công!');
      onSubmitted();
    } catch (err) {
      console.error(err);
      toast.error('Không thể gửi đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-[24px] border border-dashed border-amber-300/70 p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-xs text-amber-800 dark:text-amber-300 leading-tight">
            {title}
          </h4>
          <p className="text-[9px] text-amber-600/80 font-bold uppercase mt-1">
            Đã hoàn thành — chưa đánh giá
          </p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              className="p-0.5 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <Star
                size={14}
                className={i < rating ? 'fill-amber-400 text-amber-400 stroke-none' : 'text-zinc-250 fill-zinc-200 stroke-none'}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Bạn có hài lòng về nhân sự khi làm không? Quy trình của gói, cơ sở vật chất thế nào? Chia sẻ nhận xét tại đây..."
        className="w-full bg-white border border-amber-200/70 focus:border-amber-400 p-3 rounded-xl text-xs font-semibold resize-none outline-none text-slate-700 transition-colors"
      />

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {saving ? <Loader2 className="animate-spin" size={11} /> : <PlusCircle size={11} />}
          Lưu đánh giá
        </button>
      </div>
    </div>
  );
}

export default function CustomerSettings() {
  const { user } = useAuthStore();
  const { updateUser } = useAuthActions();
  const [activeSection, setActiveSection] = useState<'general' | 'reviews'>('general');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Specialist slide-in panel state
  const [showExpertForm, setShowExpertForm] = useState(false);

  const isExpert = [3, 4].includes(Number(user?.vai_tro_id));
  const isStaff = [2, 3, 4, 6].includes(Number(user?.vai_tro_id));
  const isCustomer = user?.vai_tro_id === 1 || user?.vai_tro_id === 0 || !user?.vai_tro_id; // Default to true if user role is not loaded yet to prevent flashing
  const [hoTen, setHoTen] = useState(user?.ho_ten || '');
  const email = user?.email || '';
  const [soDienThoai, setSoDienThoai] = useState(user?.so_dien_thoai || '');
  const [gioiTinh, setGioiTinh] = useState(user?.gioi_tinh || 'nam');
  const [diaChi, setDiaChi] = useState(user?.dia_chi || '');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [anhDaiDien, setAnhDaiDien] = useState(user?.anh_dai_dien || '');
  const [soNamKinhNghiem, setSoNamKinhNghiem] = useState(user?.ho_so_chuyen_gia?.so_nam_kinh_nghiem || 0);
  const [bangCapChungChi, setBangCapChungChi] = useState('');
  const [anhChungChiList, setAnhChungChiList] = useState<string[]>([]);
  const [moTa, setMoTa] = useState(user?.ho_so_chuyen_gia?.mo_ta || '');
  const [moTaTab, setMoTaTab] = useState<'edit' | 'preview'>('edit');
  const [theManh, setTheManh] = useState<string[]>(user?.ho_so_chuyen_gia?.the_manh || []);
  const [theManhInput, setTheManhInput] = useState('');
  const [ngaySinh, setNgaySinh] = useState('');

  // Reviews states
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [serviceReviews, setServiceReviews] = useState<any[]>([]);
  const [staffReviews, setStaffReviews] = useState<any[]>([]);
  const [pendingServiceReviews, setPendingServiceReviews] = useState<any[]>([]);
  const [pendingStaffReviews, setPendingStaffReviews] = useState<any[]>([]);

  const loadMyReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await getMyReviews();
      setServiceReviews(res.data.serviceReviews || []);
      setStaffReviews(res.data.staffReviews || []);
      setPendingServiceReviews(res.data.pendingServiceReviews || []);
      setPendingStaffReviews(res.data.pendingStaffReviews || []);
    } catch (err) {
      console.error('Lỗi nạp đánh giá:', err);
      toast.error('Không thể tải danh sách đánh giá.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'reviews' && isCustomer) {
      loadMyReviews();
    }
  }, [activeSection, isCustomer]);

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Fetch latest database profile on mount
  useEffect(() => {
    async function loadLatestProfile() {
      try {
        const res = await getMe();
        updateUser(res.data);
      } catch (err) {
        console.error('Lỗi khi nạp thông tin tài khoản:', err);
      }
    }
    loadLatestProfile();
  }, []);

  // Update local states when store user changes
  useEffect(() => {
    if (user) {
      setHoTen(user.ho_ten);
      setSoDienThoai(user.so_dien_thoai || '');
      setGioiTinh(user.gioi_tinh || 'nam');
      setDiaChi(user.dia_chi || '');
      setAnhDaiDien(user.anh_dai_dien || '');
      setSoNamKinhNghiem(user.ho_so_chuyen_gia?.so_nam_kinh_nghiem || 0);
      setMoTa(user.ho_so_chuyen_gia?.mo_ta || '');
      setTheManh(user.ho_so_chuyen_gia?.the_manh || []);

      if (user.ngay_sinh) {
        const d = new Date(user.ngay_sinh);
        if (!isNaN(d.getTime())) {
          setNgaySinh(d.toISOString().split('T')[0]);
        } else {
          setNgaySinh('');
        }
      } else {
        setNgaySinh('');
      }

      // Định dạng chuẩn: chuỗi JSON { text: string, images: string[] } (đã chuẩn hóa toàn bộ dữ liệu DB).
      // Vẫn giữ try/catch phòng hờ dữ liệu chỉnh sửa tay không đúng định dạng.
      const rawCert = user.ho_so_chuyen_gia?.bang_cap_chung_chi || '';
      if (rawCert) {
        try {
          const parsed = JSON.parse(rawCert);
          setBangCapChungChi(parsed.text || '');
          setAnhChungChiList(Array.isArray(parsed.images) ? parsed.images : []);
        } catch {
          setBangCapChungChi(rawCert);
          setAnhChungChiList([]);
        }
      } else {
        setBangCapChungChi('');
        setAnhChungChiList([]);
      }
    }
  }, [user]);

  // Handle avatar upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnhDaiDien(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle certificate image upload
  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Kích thước tệp chứng chỉ không được vượt quá 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnhChungChiList(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCertImage = (index: number) => {
    setAnhChungChiList(prev => prev.filter((_, idx) => idx !== index));
  };

  const addTheManh = () => {
    const value = theManhInput.trim();
    if (!value) return;
    if (theManh.length >= 6) {
      toast.error('Chỉ được thêm tối đa 6 thế mạnh chuyên sâu');
      return;
    }
    if (theManh.includes(value)) {
      toast.error('Thế mạnh này đã được thêm rồi');
      return;
    }
    setTheManh(prev => [...prev, value]);
    setTheManhInput('');
  };

  const removeTheManh = (index: number) => {
    setTheManh(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dynamic Avatar preview
  const avatarSrc = useMemo(() => {
    if (anhDaiDien) return anhDaiDien;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hoTen || 'Staff')}&backgroundType=gradientLinear&fontSize=45`;
  }, [anhDaiDien, hoTen]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }
    if (!soDienThoai.trim()) {
      toast.error('Số điện thoại không được để trống');
      return;
    }
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    if (!phoneRegex.test(soDienThoai.trim())) {
      toast.error('Số điện thoại không hợp lệ (Ví dụ: 0987654321 hoặc +84987654321)');
      return;
    }

    setShowConfirmDialog(true);
  };

  const executeSaveGeneral = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      // 1. Nếu có điền thay đổi mật khẩu
      if (oldPassword || newPassword || confirmPassword) {
        if (!oldPassword || !newPassword || !confirmPassword) {
          toast.error('Vui lòng điền đầy đủ mật khẩu cũ và mới để thực hiện đổi mật khẩu.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error('Mật khẩu xác nhận không trùng khớp.');
          setLoading(false);
          return;
        }
        
        await changePassword({ oldPassword, newPassword });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        updateUser({ isDefaultPassword: false });
        toast.success('Đã đổi mật khẩu bảo mật thành công!');
      }

      // 2. Gộp bằng cấp & danh sách ảnh chứng chỉ thành chuỗi JSON
      const certValue = isExpert ? JSON.stringify({
        text: bangCapChungChi,
        images: anhChungChiList
      }) : '';

      // 3. Cập nhật hồ sơ thông tin cá nhân
      const payload: any = {
        ho_ten: hoTen,
        so_dien_thoai: soDienThoai,
        anh_dai_dien: anhDaiDien || null,
        gioi_tinh: gioiTinh,
        dia_chi: diaChi,
        ngay_sinh: ngaySinh || null
      };

      if (isExpert) {
        payload.so_nam_kinh_nghiem = soNamKinhNghiem;
        payload.bang_cap_chung_chi = certValue;
        payload.mo_ta = moTa;
        payload.the_manh = theManh;
      }

      await updateProfile(payload);
      
      // Cập nhật client state
      updateUser({
        ho_ten: hoTen,
        so_dien_thoai: soDienThoai,
        anh_dai_dien: anhDaiDien || null,
        gioi_tinh: gioiTinh,
        dia_chi: diaChi,
        ngay_sinh: ngaySinh || null,
        ho_so_chuyen_gia: isExpert ? {
          so_nam_kinh_nghiem: soNamKinhNghiem,
          bang_cap_chung_chi: certValue,
          mo_ta: moTa,
          the_manh: theManh
        } : null
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      toast.success('Cập nhật cài đặt tài khoản thành công!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roleId?: number) => {
    if (roleId === 4) return 'Bác sĩ chuyên khoa';
    if (roleId === 3) return 'Kỹ thuật viên Phục hồi';
    if (roleId === 2) return 'Lễ tân phòng khám';
    if (roleId === 6) return 'Quản lý phòng khám';
    if (roleId === 5) return 'Quản trị viên hệ thống';
    return 'Khách hàng thành viên';
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Settings className="text-primary" size={24} />
            Cài đặt tài khoản
          </h1>
          <p className="text-zinc-400 dark:text-zinc-550 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
            Quản lý bảo mật thông tin & thiết lập cá nhân của bạn
          </p>
        </div>

        {/* Modern Segmented Control Tab Navigation (FULL WIDTH UX) */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-fit self-start sm:self-center shadow-inner">
          <button
            onClick={() => {
              setActiveSection('general');
              setShowExpertForm(false);
            }}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeSection === 'general'
                ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm scale-102 font-bold border border-zinc-200/20'
                : 'text-zinc-450 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <User size={14} />
            Tài khoản & Bảo mật
          </button>
          {isCustomer && (
            <button
              onClick={() => setActiveSection('reviews')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 ${
                activeSection === 'reviews'
                  ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm scale-102 font-bold border border-zinc-200/20'
                  : 'text-zinc-450 dark:text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <MessageSquare size={14} />
              Đánh giá của tôi
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace - 100% FULL WIDTH CARD */}
      <div className="w-full">
        
        {savedSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-650 dark:text-emerald-450 text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in duration-300 shadow-sm mb-6">
            <Check size={14} className="shrink-0" />
            Đã ghi nhận toàn bộ các thiết lập thay đổi của bạn thành công!
          </div>
        )}

        {activeSection === 'general' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-150/60 dark:border-zinc-800 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
            
            {/* TOP HEADER PROFILE BANNER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-6">
              <div className="flex items-center gap-5">
                <div className="relative group size-20 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary transition-all duration-300 shrink-0 shadow-sm">
                  <img 
                    src={avatarSrc} 
                    alt="Avatar" 
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={16} />
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <h3 className="text-base font-black text-secondary dark:text-zinc-100 tracking-tight">{hoTen || 'Chưa cập nhật'}</h3>
                  <p className="text-zinc-450 dark:text-zinc-500 text-xs font-semibold">{email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider">
                      {getRoleBadge(user?.vai_tro_id)}
                    </span>
                    {(Number(user?.vai_tro_id) === 1 || Number(user?.vai_tro_id) === 0) && (
                      <span className="text-[9px] font-extrabold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border border-teal-250 dark:border-teal-900/40 px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider">
                        ★ Điểm uy tín: {user?.diem_uy_tin ?? 100}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Manage Specialist Profile Button (Only for Doctor/KTV) */}
              {isExpert && !showExpertForm && (
                <button
                  type="button"
                  onClick={() => setShowExpertForm(true)}
                  className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-103 shadow-inner cursor-pointer"
                >
                  <Sparkles size={14} className="text-primary animate-pulse" />
                  Hồ sơ chuyên môn
                </button>
              )}
            </div>

            {/* ANIMATED SLIDING PANELS WORKSPACE */}
            <div className="relative overflow-hidden w-full">
              
              {/* PANEL A: Basic Info & Security Form */}
              <form 
                onSubmit={handleSaveGeneral} 
                className={`space-y-6 transition-all duration-500 ease-in-out ${
                  showExpertForm 
                    ? '-translate-x-full opacity-0 pointer-events-none absolute w-full top-0' 
                    : 'translate-x-0 opacity-100'
                }`}
              >
                {/* Basic Info Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <User size={15} className="text-primary" />
                    Thông tin cơ bản
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Họ và tên</label>
                      <input 
                        type="text" 
                        value={hoTen}
                        onChange={(e) => setHoTen(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Số điện thoại</label>
                      <input 
                        type="text" 
                        value={soDienThoai}
                        onChange={(e) => setSoDienThoai(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  {isCustomer && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Giới tính</label>
                          <select
                            value={gioiTinh}
                            onChange={(e) => setGioiTinh(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="nam">Nam</option>
                            <option value="nu">Nữ</option>
                            <option value="khac">Khác</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Ngày sinh</label>
                          <input 
                            type="date" 
                            value={ngaySinh}
                            onChange={(e) => setNgaySinh(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Địa chỉ</label>
                        <input 
                          type="text" 
                          value={diaChi}
                          onChange={(e) => setDiaChi(e.target.value)}
                          placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                          className="w-full bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Địa chỉ email</label>
                      <input 
                        type="email" 
                        value={email}
                        disabled
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 font-bold outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Vai trò hệ thống</label>
                      <input 
                        type="text" 
                        value={getRoleBadge(user?.vai_tro_id)}
                        disabled
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 font-bold outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Security Block */}
                {!isStaff && (
                  <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div>
                      <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                        <Lock size={15} className="text-primary" />
                        Mật khẩu & Bảo mật
                      </h3>
                      <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5">Để trống nếu không muốn đổi mật khẩu mới</p>
                    </div>

                    <div className="space-y-4">
                      {/* Old Password */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Mật khẩu hiện tại</label>
                        <div className="relative">
                          <input 
                            type={showOldPass ? "text" : "password"} 
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Nhập mật khẩu cũ đang dùng"
                            className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none pr-10 focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPass(!showOldPass)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300 outline-none"
                          >
                            {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* New Password */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Mật khẩu mới</label>
                          <div className="relative">
                            <input 
                              type={showNewPass ? "text" : "password"} 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Tối thiểu 6 ký tự"
                              className="w-full bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none pr-10 focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300 outline-none"
                            >
                              {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Xác nhận mật khẩu</label>
                          <div className="relative">
                            <input 
                              type={showConfirmPass ? "text" : "password"} 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Nhập lại mật khẩu mới"
                              className="w-full bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-4 py-3 text-xs text-secondary dark:text-zinc-200 font-bold outline-none pr-10 focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300 outline-none"
                            >
                              {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FFF9E6] dark:bg-amber-955/10 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-400">
                      <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-amber-500 animate-bounce" />
                      <div>
                        <p className="font-extrabold uppercase text-[9px] tracking-wider">Khuyến nghị mật khẩu bảo mật</p>
                        <p className="font-medium text-zinc-650 dark:text-zinc-455 mt-1 leading-relaxed text-[11px]">Không đặt các mật khẩu đơn giản, trùng ngày sinh hoặc tên gọi của bạn. Đổi mật khẩu định kỳ 3-6 tháng để bảo vệ hồ sơ bệnh án.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.005] transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Lưu toàn bộ cài đặt thay đổi
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* PANEL B: Specialist Profile Form (Sliding in from Right) */}
              {isExpert && (
                <form 
                  onSubmit={handleSaveGeneral} 
                  className={`space-y-6 transition-all duration-500 ease-in-out ${
                    showExpertForm 
                      ? 'translate-x-0 opacity-100' 
                      : 'translate-x-full opacity-0 pointer-events-none absolute w-full top-0'
                  }`}
                >
                  {/* Header back button inside Panel B */}
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <button
                      type="button"
                      onClick={() => setShowExpertForm(false)}
                      className="flex items-center gap-1.5 text-xs font-black uppercase text-zinc-550 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      Quay lại thông tin cơ bản
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <Sparkles size={13} className="text-primary animate-pulse" />
                      <span className="text-[10px] font-black text-secondary dark:text-zinc-200 uppercase tracking-wider">Hồ sơ Chuyên khoa</span>
                    </div>
                  </div>

                  {/* Redesigned spacious, logical layout */}
                  <div className="space-y-6">
                    
                    {/* Row 1: Experience Years */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                        Số năm kinh nghiệm làm việc thực tế
                      </label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={soNamKinhNghiem}
                          onChange={(e) => setSoNamKinhNghiem(Math.max(0, parseInt(e.target.value) || 0))}
                          min="0"
                          className="w-24 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-secondary dark:text-zinc-200 font-bold outline-none text-center focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-xs text-zinc-555 dark:text-zinc-400 font-semibold">năm hoạt động lâm sàng</span>
                      </div>
                    </div>

                    {/* Row 2: Description (Large input block with Tabs & Live Preview) */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                          <BadgeCheck size={13} className="text-primary" />
                          Mô tả tóm tắt hồ sơ năng lực chuyên môn (Đầy đủ và Chi tiết)
                        </label>
                        
                        {/* Selector Tabs */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 w-fit select-none">
                          <button
                            type="button"
                            onClick={() => setMoTaTab('edit')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              moTaTab === 'edit'
                                ? 'bg-white dark:bg-zinc-900 text-secondary dark:text-zinc-100 shadow-xs'
                                : 'text-zinc-450 dark:text-zinc-500 hover:text-secondary'
                            }`}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setMoTaTab('preview')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              moTaTab === 'preview'
                                ? 'bg-white dark:bg-zinc-900 text-[#14B8A6] shadow-xs'
                                : 'text-zinc-455 dark:text-zinc-500 hover:text-secondary'
                            }`}
                          >
                            Xem trước
                          </button>
                        </div>
                      </div>

                      {moTaTab === 'edit' ? (
                        <textarea 
                          value={moTa}
                          onChange={(e) => setMoTa(e.target.value)}
                          placeholder="Hãy viết giới thiệu đầy đủ về bản thân, kinh nghiệm điều trị và thế mạnh của bạn (Ví dụ: Chuyên sâu phục hồi chức năng cột sống, trị liệu chấn thương thể thao)..."
                          rows={10}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-2xl px-4 py-3.5 text-xs text-secondary dark:text-zinc-200 font-semibold outline-none resize-y leading-relaxed focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <div className="w-full bg-zinc-50/20 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-6 min-h-[220px] transition-all">
                          <h2 className="text-xs font-black uppercase tracking-widest text-[#14B8A6] mb-4">
                            🔬 HỒ SƠ CHUYÊN MÔN
                          </h2>
                          <p className="text-slate-700 dark:text-zinc-300 text-sm md:text-[14.5px] font-medium leading-relaxed whitespace-pre-line text-left">
                            {moTa.trim() || 'Chưa nhập thông tin hồ sơ chuyên môn...'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Row 2.5: Thế mạnh chuyên sâu (tag list) */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                        <Tag size={13} className="text-primary" />
                        Thế mạnh chuyên sâu (tối đa 6 thẻ, hiển thị công khai trên hồ sơ)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {theManh.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-3 py-1.5 rounded-xl text-xs font-bold"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTheManh(idx)}
                              className="text-primary/60 hover:text-rose-600 transition-colors"
                              title="Xóa thế mạnh này"
                            >
                              <Trash2 size={11} />
                            </button>
                          </span>
                        ))}
                        {theManh.length === 0 && (
                          <span className="text-[10px] text-zinc-400 font-semibold">Chưa có thế mạnh nào được thêm.</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={theManhInput}
                          onChange={(e) => setTheManhInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTheManh();
                            }
                          }}
                          placeholder="Ví dụ: Trị liệu bằng tay (Manual Therapy)..."
                          className="flex-1 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-secondary dark:text-zinc-200 font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={addTheManh}
                          className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>

                    {/* Row 3: Credentials & Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Cert description text */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                          <Award size={13} className="text-primary" />
                          Văn bằng / Chứng chỉ y khoa (Dạng văn bản)
                        </label>
                        <textarea 
                          value={bangCapChungChi}
                          onChange={(e) => setBangCapChungChi(e.target.value)}
                          placeholder="Ví dụ: Cử nhân Phục hồi chức năng - Đại học Y Dược TP.HCM..."
                          rows={5}
                          className="w-full bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-2xl px-4 py-3.5 text-xs text-secondary dark:text-zinc-200 font-semibold outline-none resize-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Right: Cert image lists */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                          <FileText size={13} className="text-primary" />
                          Tệp ảnh Chứng chỉ đính kèm (Có thể thêm nhiều ảnh)
                        </label>
                        
                        {/* Dynamic Grid list of uploaded base64 / path images */}
                        <div className="grid grid-cols-2 gap-3 min-h-[110px] items-start">
                          {anhChungChiList.map((certSrc, idx) => (
                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-950 group/cert shadow-sm">
                              <img src={certSrc} alt={`Cert ${idx + 1}`} className="size-full object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => removeCertImage(idx)}
                                className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full size-5 flex items-center justify-center transition-transform hover:scale-105"
                                title="Xóa ảnh chứng chỉ này"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}

                          {/* Upload Box */}
                          <label className="border-2 border-dashed border-zinc-250 dark:border-zinc-800 hover:border-primary/45 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-primary/5 transition-all text-center aspect-video shadow-inner">
                            <Upload size={16} className="text-primary" />
                            <span className="text-[8px] font-black uppercase text-secondary dark:text-zinc-350">Tải tệp ảnh mới</span>
                            <input type="file" accept="image/*" onChange={handleCertFileChange} className="hidden" />
                          </label>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Save Button for specialist profile */}
                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.005] transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Lưu hồ sơ chuyên môn
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        )}


        {activeSection === 'reviews' && isCustomer && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Description */}
            <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-150/60 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
              <h2 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-primary" />
                Quản lý các đánh giá của tôi
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                Mỗi dịch vụ trị liệu hoặc kỹ thuật viên chỉ được phép đánh giá một lần duy nhất. Bạn có thể thay đổi hoặc cập nhật nhận xét tại đây bất cứ lúc nào.
              </p>
            </div>

            {reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px]">
                <Loader2 className="animate-spin text-primary mb-3" size={24} />
                <p className="text-xs font-bold text-slate-400">Đang tải danh sách đánh giá...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Service Reviews */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider px-2">
                    📦 Đánh giá dịch vụ & khám lẻ ({serviceReviews.length})
                  </h3>

                  {pendingServiceReviews.length > 0 && (
                    <div className="space-y-3">
                      {pendingServiceReviews.map((p) => (
                        <PendingReviewCard
                          key={p.goi_dich_vu_id}
                          title={p.service_name}
                          cuocHenId={p.cuoc_hen_id}
                          type="service"
                          onSubmitted={loadMyReviews}
                        />
                      ))}
                    </div>
                  )}

                  {serviceReviews.length === 0 && pendingServiceReviews.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] text-xs font-semibold text-slate-450 italic">
                      Bạn chưa gửi đánh giá chất lượng dịch vụ nào.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {serviceReviews.map((rev) => (
                        <ReviewCard
                          key={rev.id}
                          id={rev.id}
                          title={rev.service_name}
                          rating={rev.rating}
                          comment={rev.comment || ''}
                          reply={rev.reply}
                          date={rev.date}
                          type="service"
                          onUpdated={loadMyReviews}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Staff Reviews */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider px-2">
                    🩺 Đánh giá kỹ thuật viên & Bác sĩ ({staffReviews.length})
                  </h3>

                  {pendingStaffReviews.length > 0 && (
                    <div className="space-y-3">
                      {pendingStaffReviews.map((p) => (
                        <PendingReviewCard
                          key={p.nhan_su_id}
                          title={p.staff_name}
                          cuocHenId={p.cuoc_hen_id}
                          type="staff"
                          onSubmitted={loadMyReviews}
                        />
                      ))}
                    </div>
                  )}

                  {staffReviews.length === 0 && pendingStaffReviews.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] text-xs font-semibold text-slate-450 italic">
                      Bạn chưa gửi đánh giá nhân viên trị liệu nào.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {staffReviews.map((rev) => (
                        <ReviewCard
                          key={rev.id}
                          id={rev.id}
                          title={rev.staff_name}
                          rating={rev.rating}
                          comment={rev.comment || ''}
                          reply={rev.reply}
                          date={rev.date}
                          type="staff"
                          onUpdated={loadMyReviews}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Save Settings Confirm Modal */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Lưu thay đổi cài đặt?"
        message="Bạn có chắc chắn muốn lưu lại toàn bộ thay đổi đối với cài đặt tài khoản này không?"
        confirmLabel="Lưu thay đổi"
        cancelLabel="Hủy bỏ"
        type="warning"
        onConfirm={executeSaveGeneral}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}

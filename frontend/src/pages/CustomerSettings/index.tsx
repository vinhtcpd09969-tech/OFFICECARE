import { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useAuthActions } from '../../stores/authStore';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  updateProfile,
  changePassword,
  sendChangePasswordOTP,
  getMe,
  getMyReviews,
  updateServiceReview,
  updateStaffReview,
  rateAppointment
} from '../../features/customer/api/customer.api';
import toast from 'react-hot-toast';
import { censorText } from '../../utils/profanity';
import { 
  User,
  Lock,
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

const QUICK_FEEDBACK_TAGS = [
  'Chuyên viên nhiệt tình',
  'Giảm đau rõ rệt',
  'Kỹ thuật tay nghề cao',
  'Phòng ốc sạch sẽ',
  'Đúng giờ hẹn',
  'Tư vấn tận tâm'
];

const EMOTION_MAP: Record<number, { text: string; emoji: string; color: string }> = {
  5: { text: 'Rất tuyệt vời (Cơ thể nhẹ nhõm, rất hài lòng)', emoji: '😍', color: 'text-emerald-600 dark:text-emerald-400' },
  4: { text: 'Hài lòng (Dịch vụ chu đáo, cải thiện tốt)', emoji: '😊', color: 'text-teal-600 dark:text-teal-400' },
  3: { text: 'Bình thường (Đạt yêu cầu)', emoji: '😐', color: 'text-amber-600 dark:text-amber-400' },
  2: { text: 'Chưa hài lòng (Cần cải thiện)', emoji: '🙁', color: 'text-orange-600 dark:text-orange-400' },
  1: { text: 'Rất không hài lòng (Cần xử lý)', emoji: '😡', color: 'text-rose-600 dark:text-rose-400' },
};

function ReviewCard({
  id,
  title,
  avatar,
  rating,
  comment,
  reply,
  date,
  type,
  onUpdated
}: {
  id: string;
  title: string;
  avatar?: string | null;
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

  const handleToggleTag = (tag: string) => {
    if (draftComment.includes(tag)) {
      setDraftComment(prev => prev.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setDraftComment(prev => (prev.trim() ? `${prev.trim()}, ${tag}` : tag));
    }
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

  const currentEmotion = EMOTION_MAP[isEditing ? draftRating : rating] || EMOTION_MAP[5];

  return (
    <div
      className={`w-full bg-white dark:bg-zinc-900 rounded-3xl border p-6 md:p-7 shadow-xs space-y-5 transition-all duration-300 ${
        isEditing
          ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
          : 'border-slate-200/80 dark:border-zinc-800 hover:border-teal-400/50 dark:hover:border-zinc-700 hover:shadow-md'
      }`}
    >
      {/* ROW 1: Top Left (Service/Staff info with Avatar) & Top Right (Rating Stars & Emotion) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        {/* Top Left */}
        <div className="flex items-center gap-3.5 min-w-0">
          {type === 'staff' ? (
            avatar ? (
              <img
                src={avatar}
                alt={title}
                className="size-12 rounded-full object-cover shrink-0 border-2 border-indigo-200 dark:border-indigo-800 shadow-2xs"
              />
            ) : (
              <div className="size-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 border-2 border-indigo-200/80 dark:border-indigo-800 shadow-2xs uppercase">
                {title.split(' ').slice(-2).map(n => n[0]).join('') || 'NS'}
              </div>
            )
          ) : (
            avatar ? (
              <img
                src={avatar}
                alt={title}
                className="size-12 rounded-2xl object-cover shrink-0 border border-teal-200 dark:border-teal-800 shadow-2xs"
              />
            ) : (
              <div className="size-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50 shadow-2xs">
                📦
              </div>
            )
          )}
          <div className="min-w-0">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border inline-block mb-1 ${
              type === 'service'
                ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200/60'
                : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60'
            }`}>
              {type === 'service' ? 'Đánh giá dịch vụ' : 'Kỹ thuật viên & Chuyên viên'}
            </span>
            <h4 className="font-black text-base text-slate-900 dark:text-zinc-100 leading-tight truncate">
              {title}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">
              Đánh giá ngày {new Date(date).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Top Right */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0 bg-slate-50/80 dark:bg-zinc-800/50 px-4 py-2.5 rounded-2xl border border-slate-150/70 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                isEditing ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDraftRating(i + 1)}
                    className="p-0.5 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                  >
                    <Star
                      size={20}
                      className={i < draftRating ? 'fill-amber-400 text-amber-400 drop-shadow-xs' : 'text-slate-200 dark:text-zinc-700'}
                    />
                  </button>
                ) : (
                  <Star
                    key={i}
                    size={17}
                    className={i < rating ? 'fill-amber-400 text-amber-400 drop-shadow-xs' : 'text-slate-200 dark:text-zinc-700'}
                  />
                )
              ))}
            </div>
            <span className="font-mono text-sm font-black text-slate-800 dark:text-zinc-100">
              {(isEditing ? draftRating : rating)}.0
            </span>
          </div>
          <span className={`text-[11px] font-black ${currentEmotion.color}`}>
            {currentEmotion.emoji} {currentEmotion.text.split('(')[0].trim()}
          </span>
        </div>
      </div>

      {/* ROW 2: Bottom Left (User Quote & Edit Action) & Bottom Right (Official Clinic Reply) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Bottom Left: Customer review quote + Edit button */}
        <div className="flex flex-col justify-between space-y-3 bg-slate-50/70 dark:bg-zinc-850/60 p-4 sm:p-5 rounded-2xl border border-slate-150/70 dark:border-zinc-800/80">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gợi ý nhanh:</span>
                {QUICK_FEEDBACK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                      draftComment.includes(tag)
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-teal-50'
                    }`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm trị liệu thực tế của bạn tại phòng khám..."
                autoFocus
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 p-3.5 rounded-xl text-xs font-semibold resize-none outline-none text-slate-800 dark:text-zinc-200 transition-colors focus:ring-2 focus:ring-teal-500/20"
              />

              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {saving ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />}
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 leading-relaxed italic">
                  “{censorText(comment) || 'Khách hàng không để lại nhận xét bằng chữ.'}”
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-600 dark:text-zinc-300 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-zinc-700 hover:border-teal-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <Edit2 size={13} />
                  <span>Chỉnh sửa đánh giá</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom Right: Official Reply from Clinic */}
        <div className="flex flex-col justify-between bg-teal-50/40 dark:bg-teal-955/30 border border-teal-200/70 dark:border-teal-900/50 rounded-2xl p-4 sm:p-5 border-l-4 border-l-teal-600 shadow-2xs space-y-2">
          <div>
            <p className="text-[10px] font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏢</span>
              <span>PHẢN HỒI TỪ TRUNG TÂM OFFICECARE:</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-200 italic leading-relaxed mt-2 font-medium">
              {reply ? `“${reply}”` : '“Phòng khám OfficeCare cảm ơn những lời khen và đóng góp của Anh/Chị. Chúng tôi luôn cố gắng duy trì không gian sạch sẽ và tận tâm với khách hàng, hẹn gặp lại Anh/Chị!”'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingReviewCard({
  title,
  avatar,
  cuocHenId,
  type,
  onSubmitted
}: {
  title: string;
  avatar?: string | null;
  cuocHenId: string;
  type: 'service' | 'staff';
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggleTag = (tag: string) => {
    if (comment.includes(tag)) {
      setComment(prev => prev.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setComment(prev => (prev.trim() ? `${prev.trim()}, ${tag}` : tag));
    }
  };

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

  const currentEmotion = EMOTION_MAP[rating] || EMOTION_MAP[5];

  return (
    <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 rounded-3xl border border-dashed border-amber-300/80 dark:border-amber-800 p-5 md:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
        <div className="flex items-center gap-3.5">
          {type === 'staff' ? (
            avatar ? (
              <img
                src={avatar}
                alt={title}
                className="size-12 rounded-full object-cover shrink-0 border-2 border-amber-300 shadow-2xs"
              />
            ) : (
              <div className="size-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-sm flex items-center justify-center shrink-0 border-2 border-amber-300 shadow-2xs uppercase">
                {title.split(' ').slice(-2).map(n => n[0]).join('') || 'NS'}
              </div>
            )
          ) : (
            avatar ? (
              <img
                src={avatar}
                alt={title}
                className="size-12 rounded-2xl object-cover shrink-0 border border-amber-300 shadow-2xs"
              />
            ) : (
              <div className="size-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300/60 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                📦
              </div>
            )
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300/60 mb-1 inline-block">
              {type === 'service' ? 'Đánh giá dịch vụ cần hoàn tất' : 'Kỹ thuật viên / Chuyên viên cần đánh giá'}
            </span>
            <h4 className="font-black text-sm text-amber-900 dark:text-amber-200 leading-tight">
              {title}
            </h4>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1 shrink-0 bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                className="p-0.5 hover:scale-125 active:scale-95 transition-all cursor-pointer"
              >
                <Star
                  size={18}
                  className={i < rating ? 'fill-amber-400 text-amber-400 drop-shadow-xs' : 'text-slate-300 dark:text-zinc-700'}
                />
              </button>
            ))}
          </div>
          <span className={`text-[10px] font-bold ${currentEmotion.color}`}>
            {currentEmotion.emoji} {currentEmotion.text.split('(')[0].trim()}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Quick tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-amber-800/70 dark:text-amber-400">Chọn nhanh:</span>
          {QUICK_FEEDBACK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleToggleTag(tag)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                comment.includes(tag)
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-zinc-800 hover:bg-amber-100'
              }`}
            >
              + {tag}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về buổi trị liệu, hiệu quả giảm đau hoặc sự nhiệt tình của nhân sự..."
          className="w-full bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-zinc-800 focus:border-amber-500 p-3.5 rounded-2xl text-xs font-semibold resize-none outline-none text-slate-800 dark:text-zinc-200 transition-colors"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20 active:scale-95"
        >
          {saving ? <Loader2 className="animate-spin" size={13} /> : <PlusCircle size={13} />}
          Gửi đánh giá
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
  const [reviewFilterTab, setReviewFilterTab] = useState<'service' | 'staff'>('service');
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

  // Password states (OTP based)
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Password visibility states
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    if (isSendingOtp || otpCountdown > 0) return;
    try {
      setIsSendingOtp(true);
      const res = await sendChangePasswordOTP();
      toast.success(res.data?.message || 'Đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra hộp thư!');
      setOtpCountdown(60);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const isPasswordDirty = useMemo(() => {
    return !!(otp.trim() || newPassword || confirmPassword);
  }, [otp, newPassword, confirmPassword]);

  const handleResetPasswordForm = () => {
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      toast.error('Vui lòng bấm "Nhận mã OTP" và nhập mã xác thực gửi về email của bạn.');
      return;
    }
    if (otp.trim().length !== 6) {
      toast.error('Mã OTP xác thực phải gồm đúng 6 chữ số.');
      return;
    }
    if (!newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({ otp: otp.trim(), newPassword });
      handleResetPasswordForm();
      setOtpCountdown(0);
      updateUser({ isDefaultPassword: false });
      toast.success('Đã đổi mật khẩu bảo mật thành công!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setPasswordLoading(false);
    }
  };

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

  // Dirty check: Chỉ sáng nút lưu khi thông tin cá nhân thực sự thay đổi
  const isProfileDirty = useMemo(() => {
    if (!user) return false;
    const userBirth = user.ngay_sinh ? new Date(user.ngay_sinh).toISOString().split('T')[0] : '';
    const baseDirty = (
      hoTen.trim() !== (user.ho_ten || '').trim() ||
      soDienThoai.trim() !== (user.so_dien_thoai || '').trim() ||
      gioiTinh !== (user.gioi_tinh || 'nam') ||
      diaChi.trim() !== (user.dia_chi || '').trim() ||
      ngaySinh !== userBirth ||
      (!isCustomer && anhDaiDien !== (user.anh_dai_dien || ''))
    );
    if (baseDirty) return true;
    if (isExpert) {
      const rawCert = user.ho_so_chuyen_gia?.bang_cap_chung_chi || '';
      let parsedCertText = '';
      let parsedCertImages: string[] = [];
      if (rawCert) {
        try {
          const p = JSON.parse(rawCert);
          parsedCertText = p.text || '';
          parsedCertImages = Array.isArray(p.images) ? p.images : [];
        } catch {
          parsedCertText = rawCert;
        }
      }
      const expertDirty = (
        soNamKinhNghiem !== (user.ho_so_chuyen_gia?.so_nam_kinh_nghiem || 0) ||
        moTa.trim() !== (user.ho_so_chuyen_gia?.mo_ta || '').trim() ||
        bangCapChungChi.trim() !== parsedCertText.trim() ||
        JSON.stringify(anhChungChiList) !== JSON.stringify(parsedCertImages) ||
        JSON.stringify(theManh) !== JSON.stringify(user.ho_so_chuyen_gia?.the_manh || [])
      );
      if (expertDirty) return true;
    }
    return false;
  }, [user, hoTen, soDienThoai, gioiTinh, diaChi, ngaySinh, anhDaiDien, isExpert, soNamKinhNghiem, moTa, bangCapChungChi, anhChungChiList, theManh]);

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
      // 1. Gộp bằng cấp & danh sách ảnh chứng chỉ thành chuỗi JSON
      const certValue = isExpert ? JSON.stringify({
        text: bangCapChungChi,
        images: anhChungChiList
      }) : '';

      // 2. Cập nhật hồ sơ thông tin cá nhân
      const payload: any = {
        ho_ten: hoTen,
        so_dien_thoai: soDienThoai,
        gioi_tinh: gioiTinh,
        dia_chi: diaChi,
        ngay_sinh: ngaySinh || null
      };

      if (!isCustomer) {
        payload.anh_dai_dien = anhDaiDien || null;
      }

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
      toast.success('Cập nhật thông tin tài khoản thành công!');
    } catch (error: any) {
      console.error('Lỗi khi lưu thông tin:', error);
      toast.error(error.response?.data?.message || error.message || 'Đã có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roleId?: number) => {
    if (roleId === 4) return 'Chuyên viên Vật lý trị liệu';
    if (roleId === 3) return 'Kỹ thuật viên Phục hồi';
    if (roleId === 2) return 'Lễ tân phòng khám';
    if (roleId === 6) return 'Quản lý phòng khám';
    if (roleId === 5) return 'Quản trị viên hệ thống';
    return 'Khách hàng thành viên';
  };

  return (
    <div className="w-full space-y-6 font-jakarta pb-12 animate-fade-in">
      
      {/* 1. Full-Width 50/50 Navigation Header */}
      <div className="w-full bg-slate-100/90 dark:bg-zinc-800/90 p-1.5 rounded-2xl shadow-xs border border-slate-200/50 dark:border-zinc-700/60">
        <div className={`w-full grid ${isCustomer ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
          <button
            type="button"
            onClick={() => {
              setActiveSection('general');
              setShowExpertForm(false);
            }}
            className={`w-full py-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
              activeSection === 'general'
                ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-850/50'
            }`}
          >
            <User size={16} />
            <span>Tài khoản & Bảo mật</span>
          </button>
          {isCustomer && (
            <button
              type="button"
              onClick={() => setActiveSection('reviews')}
              className={`w-full py-3 text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer ${
                activeSection === 'reviews'
                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-850/50'
              }`}
            >
              <MessageSquare size={16} />
              <span>Đánh giá của tôi</span>
              {(pendingServiceReviews.length + pendingStaffReviews.length) > 0 && (
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in duration-300 shadow-sm">
          <Check size={16} className="shrink-0 text-emerald-600" />
          Đã ghi nhận toàn bộ các thiết lập thay đổi của bạn thành công!
        </div>
      )}

      {activeSection === 'general' && (
        <div className="w-full space-y-6">
          {!showExpertForm ? (
            <div className="space-y-6">
              {/* 1. Form thông tin cơ bản với Avatar tròn tích hợp */}
              <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/70 dark:border-zinc-800 p-6 md:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    {/* Avatar tròn: Khách hàng dùng Avatar chữ cái cố định; Nhân sự có chức năng đổi ảnh */}
                    {isCustomer ? (
                      <div className="size-16 sm:size-18 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-xl flex items-center justify-center shrink-0 border-2 border-teal-500/30 shadow-sm uppercase select-none">
                        {hoTen ? hoTen.split(' ').slice(-2).map(n => n[0]).join('') : 'KH'}
                      </div>
                    ) : (
                      <div className="relative group size-16 sm:size-18 rounded-full overflow-hidden border-2 border-teal-500/30 hover:border-teal-500 transition-all duration-300 shrink-0 shadow-sm">
                        <img 
                          src={avatarSrc} 
                          alt="Avatar" 
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera size={16} />
                          <span className="text-[8px] font-bold mt-0.5">Đổi ảnh</span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                          Thông tin cơ bản
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                          <span className="size-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                          {getRoleBadge(user?.vai_tro_id)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                        {isCustomer ? 'Cập nhật thông tin cá nhân và tài khoản y tế' : 'Rê chuột vào ảnh tròn để tải lên ảnh đại diện mới'}
                      </p>
                    </div>
                  </div>

                  {isExpert && (
                    <button
                      type="button"
                      onClick={() => setShowExpertForm(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-950/40 dark:to-emerald-950/20 hover:from-teal-500/20 hover:to-emerald-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Award size={15} />
                      <span>Chỉnh sửa hồ sơ chuyên môn</span>
                    </button>
                  )}
                </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        required
                        value={hoTen}
                        onChange={(e) => setHoTen(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={soDienThoai}
                        onChange={(e) => setSoDienThoai(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Giới tính
                      </label>
                      <select
                        value={gioiTinh}
                        onChange={(e) => setGioiTinh(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors cursor-pointer"
                      >
                        <option value="nam">Nam</option>
                        <option value="nu">Nữ</option>
                        <option value="khac">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={ngaySinh}
                        onChange={(e) => setNgaySinh(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={diaChi}
                      onChange={(e) => setDiaChi(e.target.value)}
                      placeholder="Địa chỉ cư trú hiện tại..."
                      className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Vai trò hệ thống
                      </label>
                      <input
                        type="text"
                        disabled
                        value={getRoleBadge(user?.vai_tro_id)}
                        className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={loading || !isProfileDirty}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Lưu thay đổi thông tin
                    </button>
                  </div>
                </form>

                {/* 2. Form đổi mật khẩu bằng OTP */}
                <form onSubmit={handleChangePasswordSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/70 dark:border-zinc-800 p-6 md:p-8 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-teal-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                        Đổi mật khẩu
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">Xác thực qua mã OTP Email</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Mã xác thực OTP (Gửi về {email})
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="Nhập 6 chữ số OTP..."
                          className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || otpCountdown > 0}
                          className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer shrink-0"
                        >
                          {isSendingOtp ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : otpCountdown > 0 ? (
                            `Gửi lại (${otpCountdown}s)`
                          ) : (
                            'Nhận mã OTP'
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                          Mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Tối thiểu 6 ký tự..."
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 pr-9 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                          Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu..."
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 pr-9 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    {isPasswordDirty && (
                      <button
                        type="button"
                        onClick={handleResetPasswordForm}
                        className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Specialist Profile Form */
              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-teal-600 animate-pulse" />
                    <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                      Hồ sơ năng lực chuyên môn
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExpertForm(false)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Quay lại thông tin cơ bản
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Row 1: Experience Years */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Số năm kinh nghiệm làm việc thực tế
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={soNamKinhNghiem}
                        onChange={(e) => setSoNamKinhNghiem(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        className="w-24 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-200 font-bold outline-none text-center focus:ring-2 focus:ring-teal-500/20"
                      />
                      <span className="text-xs text-slate-600 dark:text-zinc-400 font-semibold">năm hoạt động lâm sàng</span>
                    </div>
                  </div>

                  {/* Row 2: Description with Tabs & Live Preview */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <BadgeCheck size={14} className="text-teal-600" />
                        Mô tả tóm tắt hồ sơ năng lực chuyên môn
                      </label>
                      
                      {/* Selector Tabs */}
                      <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 w-fit select-none">
                        <button
                          type="button"
                          onClick={() => setMoTaTab('edit')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            moTaTab === 'edit'
                              ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setMoTaTab('preview')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            moTaTab === 'preview'
                              ? 'bg-white dark:bg-zinc-900 text-teal-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
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
                        placeholder="Hãy viết giới thiệu đầy đủ về bản thân, kinh nghiệm điều trị và thế mạnh của bạn..."
                        rows={8}
                        className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-2xl px-4 py-3.5 text-xs text-slate-800 dark:text-zinc-200 font-semibold outline-none resize-y leading-relaxed focus:ring-2 focus:ring-teal-500/20"
                      />
                    ) : (
                      <div className="w-full bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 min-h-[200px] transition-all">
                        <h4 className="text-xs font-black uppercase tracking-wider text-teal-600 mb-3">
                          🔬 HỒ SƠ CHUYÊN MÔN
                        </h4>
                        <p className="text-slate-700 dark:text-zinc-300 text-xs md:text-sm font-medium leading-relaxed whitespace-pre-line text-left">
                          {moTa.trim() || 'Chưa nhập thông tin hồ sơ chuyên môn...'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Row 2.5: Thế mạnh chuyên sâu */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <Tag size={13} className="text-teal-600" />
                      Thế mạnh chuyên sâu (tối đa 6 thẻ)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {theManh.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 px-3 py-1.5 rounded-xl text-xs font-bold"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTheManh(idx)}
                            className="text-teal-600/60 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa thế mạnh này"
                          >
                            <Trash2 size={11} />
                          </button>
                        </span>
                      ))}
                      {theManh.length === 0 && (
                        <span className="text-[10px] text-slate-400 font-semibold">Chưa có thế mạnh nào được thêm.</span>
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
                        className="flex-1 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-200 font-semibold outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <button
                        type="button"
                        onClick={addTheManh}
                        className="shrink-0 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200/60 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* Row 3: Credentials & Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <Award size={13} className="text-teal-600" />
                        Văn bằng / Chứng chỉ y khoa
                      </label>
                      <textarea 
                        value={bangCapChungChi}
                        onChange={(e) => setBangCapChungChi(e.target.value)}
                        placeholder="Ví dụ: Cử nhân Phục hồi chức năng - Đại học Y Dược..."
                        rows={5}
                        className="w-full bg-slate-50 dark:bg-zinc-855 border border-slate-200 dark:border-zinc-800 focus:border-teal-500 rounded-2xl px-4 py-3.5 text-xs text-slate-800 dark:text-zinc-200 font-semibold outline-none resize-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={13} className="text-teal-600" />
                        Tệp ảnh Chứng chỉ đính kèm
                      </label>
                      
                      <div className="grid grid-cols-2 gap-3 min-h-[110px] items-start">
                        {anhChungChiList.map((certSrc, idx) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 p-0.5 bg-slate-50 dark:bg-zinc-950 group/cert shadow-xs">
                            <img src={certSrc} alt={`Cert ${idx + 1}`} className="size-full object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeCertImage(idx)}
                              className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full size-5 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                              title="Xóa ảnh chứng chỉ này"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}

                        <label className="border-2 border-dashed border-slate-250 dark:border-zinc-800 hover:border-teal-500/60 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 dark:bg-zinc-900/10 hover:bg-teal-50/20 transition-all text-center aspect-video shadow-2xs">
                          <Upload size={16} className="text-teal-600" />
                          <span className="text-[9px] font-black uppercase text-slate-500 dark:text-zinc-400">Tải tệp ảnh mới</span>
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
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-xs shadow-md shadow-teal-600/20 hover:scale-[1.005] transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
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
      )}


        {activeSection === 'reviews' && isCustomer && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-3xl">
                <Loader2 className="animate-spin text-teal-600 mb-3" size={24} />
                <p className="text-xs font-bold text-slate-400">Đang tải danh sách đánh giá...</p>
              </div>
            ) : (
            <div className="space-y-5">
              {/* Category Pill Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setReviewFilterTab('service')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    reviewFilterTab === 'service'
                      ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm scale-[1.01]'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <span>📦 Đánh giá dịch vụ</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    reviewFilterTab === 'service' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}>
                    {serviceReviews.length}
                  </span>
                  {pendingServiceReviews.length > 0 && (
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Có ca chờ đánh giá" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setReviewFilterTab('staff')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    reviewFilterTab === 'staff'
                      ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-sm scale-[1.01]'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <span>🩺 Kỹ thuật viên & Chuyên viên</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    reviewFilterTab === 'staff' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}>
                    {staffReviews.length}
                  </span>
                  {pendingStaffReviews.length > 0 && (
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Có ca chờ đánh giá" />
                  )}
                </button>
              </div>

              {/* Tab 1: Service Reviews */}
              {reviewFilterTab === 'service' && (
                <div className="space-y-4">
                  {pendingServiceReviews.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 px-1 flex items-center gap-1.5">
                        ⚡ Ca dịch vụ vừa hoàn thành cần bạn đánh giá:
                      </h4>
                      {pendingServiceReviews.map((p) => (
                        <PendingReviewCard
                          key={p.goi_dich_vu_id}
                          title={p.service_name}
                          avatar={p.service_avatar}
                          cuocHenId={p.cuoc_hen_id}
                          type="service"
                          onSubmitted={loadMyReviews}
                        />
                      ))}
                    </div>
                  )}

                  {serviceReviews.length === 0 && pendingServiceReviews.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-3xl text-xs font-semibold text-slate-400 italic">
                      Bạn chưa có đánh giá nào cho chất lượng dịch vụ.
                    </div>
                  ) : (
                    <div className="space-y-4 w-full">
                      {serviceReviews.map((rev) => (
                        <ReviewCard
                          key={rev.id}
                          id={rev.id}
                          title={rev.service_name}
                          avatar={rev.service_avatar}
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
              )}

              {/* Tab 2: Staff Reviews */}
              {reviewFilterTab === 'staff' && (
                <div className="space-y-4">
                  {pendingStaffReviews.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 px-1 flex items-center gap-1.5">
                        ⚡ Nhân sự vừa phục vụ bạn cần đánh giá:
                      </h4>
                      {pendingStaffReviews.map((p) => (
                        <PendingReviewCard
                          key={p.nhan_su_id}
                          title={p.staff_name}
                          avatar={p.staff_avatar}
                          cuocHenId={p.cuoc_hen_id}
                          type="staff"
                          onSubmitted={loadMyReviews}
                        />
                      ))}
                    </div>
                  )}

                  {staffReviews.length === 0 && pendingStaffReviews.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-3xl text-xs font-semibold text-slate-400 italic">
                      Bạn chưa có đánh giá nào cho kỹ thuật viên hoặc chuyên viên.
                    </div>
                  ) : (
                    <div className="space-y-4 w-full">
                      {staffReviews.map((rev) => (
                        <ReviewCard
                          key={rev.id}
                          id={rev.id}
                          title={rev.staff_name}
                          avatar={rev.staff_avatar}
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
              )}
            </div>
            )}
          </div>
        )}

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

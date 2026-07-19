import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { 
  getStaff, 
  createStaff, 
  updateStaff,
  updateStaffStatus, 
  updateStaffPassword,
  uploadImage
} from '../../api/admin.api';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { 
  Eye, 
  EyeOff,
  Lock, 
  Unlock, 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Shield, 
  Key, 
  Sparkles, 
  X, 
  Check, 
  Loader2,
  ArrowLeft,
  Upload
} from 'lucide-react';

const staffSchema = z.object({
  ho_ten: z.string().min(1, 'Họ tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  mat_khau: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  vai_tro_id: z.number().min(2, 'Vui lòng chọn vai trò'),
  so_dien_thoai: z.string().optional(),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu'])
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function ManageStaff() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | '2' | '3' | '4' | '5' | '6'>('all');
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit / Details Screen State (replacing table)
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTab, setEditTab] = useState<'basic' | 'specialist'>('basic');
  const [saveLoading, setSaveLoading] = useState(false);

  // Password Edit State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Edit Form Fields
  const [editHoTen, setEditHoTen] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSoDienThoai, setEditSoDienThoai] = useState('');
  const [editVaiTroId, setEditVaiTroId] = useState(2);
  const [editExperience, setEditExperience] = useState(0);
  const [editCert, setEditCert] = useState('');
  const [editCertImages, setEditCertImages] = useState<string[]>([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editTheManh, setEditTheManh] = useState<string[]>([]);
  const [theManhInput, setTheManhInput] = useState('');

  // Confirmation dialogs state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
    onConfirm: () => void;
  } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      trang_thai: 'hoat_dong'
    }
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await getStaff();
      setStaffList(res.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Không thể tải danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = (staff: any) => {
    const isLocking = staff.trang_thai === 'hoat_dong';
    const actionText = isLocking ? 'khóa tài khoản' : 'mở khóa hoạt động';
    setConfirmConfig({
      isOpen: true,
      title: isLocking ? 'Khóa Tài khoản Nhân sự' : 'Mở khóa Nhân sự',
      message: `Bạn có chắc chắn muốn ${actionText} của nhân sự "${staff.ho_ten}" không?`,
      type: isLocking ? 'danger' : 'success',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          const nextStatus = isLocking ? 'vo_hieu' : 'hoat_dong';
          await updateStaffStatus(staff.id, nextStatus);
          toast.success(`Đã ${isLocking ? 'khóa' : 'kích hoạt'} tài khoản nhân sự thành công!`);
          fetchStaff();
          // Update selectedStaff status in real time if open
          if (selectedStaff && selectedStaff.id === staff.id) {
            setSelectedStaff((prev: any) => ({ ...prev, trang_thai: nextStatus }));
          }
        } catch (error: any) {
          console.error('Error updating staff status:', error);
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        }
      }
    });
  };

  const handleUpdatePassword = async (staff: any) => {
    const isTargetAdmin = Number(staff.vai_tro_id) === 5;

    if (isTargetAdmin) {
      if (!oldPassword) {
        toast.error('Vui lòng nhập mật khẩu hiện tại.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Mật khẩu xác nhận không trùng khớp.');
        return;
      }
    } else {
      if (!newPassword || newPassword.length < 6) {
        toast.error('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
        return;
      }
    }

    setConfirmConfig({
      isOpen: true,
      title: isTargetAdmin ? 'Đổi Mật khẩu Admin' : 'Cập nhật Mật khẩu Nhân sự',
      message: `Bạn có chắc chắn muốn thay đổi mật khẩu của nhân sự "${staff.ho_ten}" không?`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          setIsUpdatingPassword(true);
          await updateStaffPassword(staff.id, { 
            password: newPassword, 
            oldPassword: isTargetAdmin ? oldPassword : undefined 
          });
          toast.success(`Đã cập nhật mật khẩu cho nhân sự "${staff.ho_ten}" thành công!`);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowOldPassword(false);
          setShowPassword(false);
          setShowConfirmPassword(false);
        } catch (error: any) {
          console.error('Error updating password:', error);
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu.');
        } finally {
          setIsUpdatingPassword(false);
        }
      }
    });
  };

  const handleResetAdminPassword = async (staff: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Khôi phục Mật khẩu Admin',
      message: `Bạn có chắc chắn muốn đặt lại mật khẩu của Admin "${staff.ho_ten}" về mặc định (123456) không?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          setIsUpdatingPassword(true);
          await updateStaffPassword(staff.id, { isReset: true });
          toast.success(`Đã đặt lại mật khẩu cho Admin về "123456" thành công!`);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowOldPassword(false);
          setShowPassword(false);
          setShowConfirmPassword(false);
        } catch (error: any) {
          console.error('Error resetting admin password:', error);
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi khôi phục mật khẩu.');
        } finally {
          setIsUpdatingPassword(false);
        }
      }
    });
  };

  const handleOpenDetails = (staff: any) => {
    setSelectedStaff(staff);
    setEditHoTen(staff.ho_ten);
    setEditEmail(staff.email || '');
    setEditSoDienThoai(staff.so_dien_thoai || '');
    setEditVaiTroId(Number(staff.vai_tro_id));
    setEditExperience(Number(staff.so_nam_kinh_nghiem) || 0);
    setEditDescription(staff.mo_ta || '');
    setEditTheManh(Array.isArray(staff.the_manh) ? staff.the_manh : []);
    
    // Parse certification JSON
    const rawCert = staff.bang_cap_chung_chi || '';
    if (rawCert) {
      try {
        const parsed = JSON.parse(rawCert);
        setEditCert(parsed.text || '');
        setEditCertImages(Array.isArray(parsed.images) ? parsed.images : []);
      } catch {
        setEditCert(rawCert);
        setEditCertImages([]);
      }
    }
    
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsEditMode(false);
    setEditTab('basic');
  };

  const handleAddTheManh = () => {
    const value = theManhInput.trim();
    if (!value) return;
    if (editTheManh.includes(value)) {
      toast.error('Thế mạnh này đã được thêm rồi');
      return;
    }
    setEditTheManh(prev => [...prev, value]);
    setTheManhInput('');
  };

  const handleRemoveTheManh = (indexToRemove: number) => {
    setEditTheManh(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCertFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }
    try {
      setUploadingCert(true);
      const res = await uploadImage(file, 'specialist');
      const url = res.data.url;
      setEditCertImages(prev => [...prev, url]);
      toast.success('Tải ảnh chứng chỉ thành công!');
    } catch (error) {
      console.error('Error uploading cert image:', error);
      toast.error('Không thể tải ảnh chứng chỉ lên.');
    } finally {
      setUploadingCert(false);
    }
  };

  const removeCertImage = (indexToRemove: number) => {
    setEditCertImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStaff) return;
    try {
      setSaveLoading(true);
      
      const certValue = [3, 4].includes(editVaiTroId) ? JSON.stringify({
        text: editCert,
        images: editCertImages
      }) : '';

      const payload = {
        ho_ten: editHoTen,
        email: editEmail,
        so_dien_thoai: editSoDienThoai,
        vai_tro_id: editVaiTroId,
        so_nam_kinh_nghiem: [3, 4].includes(editVaiTroId) ? editExperience : undefined,
        bang_cap_chung_chi: [3, 4].includes(editVaiTroId) ? certValue : undefined,
        mo_ta: [3, 4].includes(editVaiTroId) ? editDescription : undefined,
        the_manh: [3, 4].includes(editVaiTroId) ? editTheManh : undefined,
      };

      await updateStaff(selectedStaff.id, payload);
      toast.success('Cập nhật thông tin nhân sự thành công!');
      setIsEditMode(false);
      
      // Reload list and update local selectedStaff state
      const res = await getStaff();
      setStaffList(res.data);
      const updated = res.data.find((s: any) => s.id === selectedStaff.id);
      if (updated) {
        setSelectedStaff(updated);
      }
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhân sự.');
    } finally {
      setSaveLoading(false);
    }
  };

  const onCreateSubmit = async (data: StaffFormValues) => {
    try {
      await createStaff(data);
      toast.success('Tạo tài khoản nhân sự thành công!');
      setIsCreateOpen(false);
      reset();
      fetchStaff();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhân sự');
    }
  };

  // Filter and search logic
  const filteredStaffList = useMemo(() => {
    return staffList.filter((staff: any) => {
      const nameMatch = staff.ho_ten.toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = staff.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      const matchesRole = selectedRoleFilter === 'all' || String(staff.vai_tro_id) === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, selectedRoleFilter]);

  const getRoleLabel = (roleId: number) => {
    switch (roleId) {
      case 2: return 'Lễ tân';
      case 3: return 'Kỹ thuật viên';
      case 4: return 'Bác sĩ';
      case 5: return 'Admin';
      case 6: return 'Quản lý';
      default: return 'Khác';
    }
  };

  const getRoleStyle = (roleId: number) => {
    switch (roleId) {
      case 5: return 'bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-955/15 dark:text-purple-400 dark:border-purple-900/40';
      case 6: return 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-955/15 dark:text-indigo-400 dark:border-indigo-900/40';
      case 4: return 'bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-955/15 dark:text-sky-400 dark:border-sky-900/40';
      case 3: return 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-955/15 dark:text-amber-400 dark:border-amber-900/40';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200/50 dark:bg-zinc-800/15 dark:text-zinc-400 dark:border-zinc-700/40';
    }
  };

  // If viewing details of a staff member, render the full-screen slide-in details component
  if (selectedStaff) {
    const avatarUrl = selectedStaff.anh_dai_dien || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedStaff.ho_ten)}&backgroundType=gradientLinear&fontSize=45`;
    
    return (
      <div className="space-y-4 pb-8 text-zinc-800 dark:text-zinc-250 font-sans text-sm min-h-[600px] animate-in fade-in slide-in-from-right duration-300">
        
        {/* COMPACT UNIFIED HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedStaff(null);
                setIsEditMode(false);
              }}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-zinc-500 hover:text-primary shrink-0"
              title="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
            
            {/* Divider */}
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>

            {/* Staff profile summary */}
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt={selectedStaff.ho_ten}
                className="size-10 rounded-full object-cover border border-primary/20 shadow-xs shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-secondary dark:text-zinc-200 leading-none">{selectedStaff.ho_ten}</span>
                  <span className={`px-2 py-0.5 border rounded-lg text-[8.5px] font-extrabold uppercase tracking-widest ${getRoleStyle(selectedStaff.vai_tro_id)}`}>
                    {getRoleLabel(selectedStaff.vai_tro_id)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wide ${
                    selectedStaff.trang_thai === 'hoat_dong'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400'
                  }`}>
                    {selectedStaff.trang_thai === 'hoat_dong' ? 'Hoạt động' : 'Khóa'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold block mt-1">{selectedStaff.email}</span>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex gap-2">
            {Number(selectedStaff.vai_tro_id) !== 5 && (
              <button
                onClick={() => handleToggleStatus(selectedStaff)}
                className={`px-3.5 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  selectedStaff.trang_thai === 'hoat_dong'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200/50 dark:bg-rose-955/15 dark:text-rose-400'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200/50 dark:bg-emerald-955/15 dark:text-emerald-400'
                }`}
              >
                {selectedStaff.trang_thai === 'hoat_dong' ? <><Lock size={12} /> Khóa tài khoản</> : <><Unlock size={12} /> Mở khóa hoạt động</>}
              </button>
            )}

            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                Bật chỉnh sửa
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMode(false);
                    handleOpenDetails(selectedStaff); // reset
                  }}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all animate-in fade-in"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={handleSaveDetails}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 animate-in fade-in"
                >
                  {saveLoading ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                  Lưu lại
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SINGLE COMBINED WORKSPACE CARD */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
          
          {/* Internal Tab Controller if Specialist */}
          {[3, 4].includes(editVaiTroId) && (
            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setEditTab('basic')}
                className={`px-4 py-2 text-[9.5px] font-black tracking-wider rounded-lg uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                  editTab === 'basic'
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20'
                    : 'text-zinc-450 hover:text-zinc-700'
                }`}
              >
                <User size={12} /> Thông tin cá nhân
              </button>
              <button
                type="button"
                onClick={() => setEditTab('specialist')}
                className={`px-4 py-2 text-[9.5px] font-black tracking-wider rounded-lg uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                  editTab === 'specialist'
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20'
                    : 'text-zinc-450 hover:text-zinc-700'
                }`}
              >
                <Sparkles size={12} className="text-primary animate-pulse" /> Hồ sơ chuyên môn
              </button>
            </div>
          )}

          {/* Form contents */}
          {editTab === 'basic' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">Địa chỉ email (Tên tài khoản)</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-zinc-450 size-4" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      disabled={!isEditMode}
                      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ${
                        isEditMode 
                          ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800' 
                          : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-850'
                      }`}
                    />
                  </div>
                  <span className="text-[8px] text-zinc-400 block italic leading-normal">
                    {isEditMode ? '* Có thể cập nhật địa chỉ email đăng nhập.' : '* Địa chỉ email đăng nhập do Admin quản lý.'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">Họ và tên nhân sự</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-zinc-450 size-4" />
                    <input
                      type="text"
                      value={editHoTen}
                      onChange={(e) => setEditHoTen(e.target.value)}
                      disabled={!isEditMode}
                      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ${
                        isEditMode 
                          ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800' 
                          : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-950/20 dark:border-zinc-850'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-455 dark:text-zinc-550 uppercase tracking-wider block">Số điện thoại liên hệ</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 text-zinc-455 size-4" />
                    <input
                      type="text"
                      value={editSoDienThoai}
                      onChange={(e) => setEditSoDienThoai(e.target.value)}
                      disabled={!isEditMode}
                      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none ${
                        isEditMode 
                          ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800' 
                          : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-850'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-455 dark:text-zinc-550 uppercase tracking-wider block">Vai trò làm việc</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-3.5 text-zinc-455 size-4" />
                    <select
                      value={editVaiTroId}
                      onChange={(e) => setEditVaiTroId(Number(e.target.value))}
                      disabled={!isEditMode}
                      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none cursor-pointer ${
                        isEditMode 
                          ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800' 
                          : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-850'
                      }`}
                    >
                      <option value={2}>Lễ tân</option>
                      <option value={3}>Kỹ thuật viên</option>
                      <option value={4}>Bác sĩ</option>
                      <option value={5}>Admin</option>
                      <option value={6}>Quản lý</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Password Input and Update Section */}
              <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl space-y-4 mt-6">
                <div>
                  <h5 className="text-[10px] font-extrabold text-secondary dark:text-zinc-250 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Key size={14} className="text-primary" /> Mật khẩu đăng nhập
                  </h5>
                  <p className="text-[9px] text-zinc-450 dark:text-zinc-500 mt-1 leading-normal font-medium">
                    {Number(selectedStaff.vai_tro_id) === 5 
                      ? 'Để thay đổi mật khẩu Admin, vui lòng điền đầy đủ thông tin xác thực bên dưới.' 
                      : 'Nhập mật khẩu mới bên dưới để thay đổi mật khẩu đăng nhập của nhân sự này.'}
                  </p>
                </div>

                {Number(selectedStaff.vai_tro_id) === 5 ? (
                  // Admin Password Fields
                  <div className="space-y-3">
                    {/* Old Password */}
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Mật khẩu hiện tại (Mật khẩu cũ)"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(prev => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                      >
                        {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* New Password */}
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary animate-in fade-in"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {/* Confirm Password */}
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Xác nhận mật khẩu mới"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary animate-in fade-in"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(prev => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleUpdatePassword(selectedStaff)}
                        disabled={isUpdatingPassword || !oldPassword || !newPassword || !confirmPassword || newPassword.length < 6}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600 font-black text-[10px] rounded-xl tracking-wider transition-all cursor-pointer select-none uppercase shadow-xs flex items-center justify-center gap-1.5 h-[38px]"
                      >
                        {isUpdatingPassword ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Check size={12} />}
                        Đổi mật khẩu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetAdminPassword(selectedStaff)}
                        disabled={isUpdatingPassword}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-250 disabled:text-slate-400 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600 font-black text-[10px] rounded-xl tracking-wider transition-all cursor-pointer select-none uppercase shadow-xs flex items-center justify-center gap-1.5 h-[38px]"
                      >
                        Khôi phục mật khẩu (Reset)
                      </button>
                    </div>
                  </div>
                ) : (
                  // General Staff Password Fields (Simple Input)
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="relative flex-1 w-full">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••• (Nhập mật khẩu mới từ 6 ký tự)"
                        className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdatePassword(selectedStaff)}
                      disabled={isUpdatingPassword || !newPassword || newPassword.length < 6}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600 font-black text-[10px] rounded-xl tracking-wider transition-all cursor-pointer select-none uppercase shadow-xs shrink-0 w-full sm:w-auto h-[38px] flex items-center justify-center"
                    >
                      {isUpdatingPassword ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Row 1: Experience Years */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
                  Số năm kinh nghiệm làm việc thực tế
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={editExperience}
                    onChange={(e) => setEditExperience(Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    disabled={!isEditMode}
                    className={`w-24 border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-center ${
                      isEditMode
                        ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800'
                        : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-855'
                    }`}
                  />
                  <span className="text-xs text-zinc-555 dark:text-zinc-400 font-semibold">năm hoạt động lâm sàng</span>
                </div>
              </div>

              {/* Row 2: Description (Large input block) */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">
                  Mô tả tóm tắt hồ sơ năng lực chuyên môn (Đầy đủ và Chi tiết)
                </label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={!isEditMode}
                  placeholder="Hãy viết giới thiệu đầy đủ về bản thân, kinh nghiệm điều trị và thế mạnh của bạn..."
                  rows={8}
                  className={`w-full border rounded-2xl px-4 py-3.5 text-xs font-semibold outline-none resize-y leading-relaxed ${
                    isEditMode
                      ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800'
                      : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-855'
                  }`}
                />
              </div>

              {/* Row 2.5: Thế mạnh chuyên sâu (tag list) */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-wider block">
                  Thế mạnh chuyên sâu (tối đa 6 thẻ, hiển thị công khai trên hồ sơ)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editTheManh.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-3 py-1.5 rounded-xl text-xs font-bold"
                    >
                      {tag}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTheManh(idx)}
                          className="text-primary/60 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Xóa thế mạnh này"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </span>
                  ))}
                  {editTheManh.length === 0 && (
                    <span className="text-[10px] text-zinc-400 font-semibold">Chưa có thế mạnh nào được thêm.</span>
                  )}
                </div>
                {isEditMode && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={theManhInput}
                      onChange={(e) => setTheManhInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTheManh();
                        }
                      }}
                      placeholder="Ví dụ: Trị liệu bằng tay (Manual Therapy)..."
                      className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-secondary dark:text-zinc-200 font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddTheManh}
                      className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Thêm
                    </button>
                  </div>
                )}
              </div>

              {/* Row 3: Credentials & Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {/* Left: Cert description text */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">
                    Văn bằng / Chứng chỉ y khoa (Dạng văn bản)
                  </label>
                  <textarea 
                    value={editCert}
                    onChange={(e) => setEditCert(e.target.value)}
                    disabled={!isEditMode}
                    placeholder="Ví dụ: Cử nhân Phục hồi chức năng - Đại học Y Dược TP.HCM..."
                    rows={6}
                    className={`w-full border rounded-2xl px-4 py-3.5 text-xs font-semibold outline-none resize-none leading-relaxed ${
                      isEditMode
                        ? 'bg-white border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary dark:bg-zinc-950 dark:border-zinc-800'
                        : 'bg-zinc-50/50 border-zinc-250/50 text-zinc-500 cursor-not-allowed dark:bg-zinc-955/20 dark:border-zinc-855'
                    }`}
                  />
                </div>

                {/* Right: Cert image lists */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-455 dark:text-zinc-555 uppercase tracking-wider block">
                    Tệp ảnh Chứng chỉ đính kèm (Có thể thêm nhiều ảnh)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3 min-h-[110px] items-start">
                    {editCertImages.map((certSrc, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-950 group shadow-sm">
                        <img src={certSrc} alt={`Cert ${idx + 1}`} className="size-full object-cover rounded-lg" />
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => removeCertImage(idx)}
                            className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full size-5 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-sm"
                            title="Xóa ảnh chứng chỉ này"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}

                    {isEditMode && (
                      <label className="border-2 border-dashed border-zinc-250 dark:border-zinc-800 hover:border-primary/45 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-primary/5 transition-all text-center aspect-video shadow-inner">
                        {uploadingCert ? (
                          <Loader2 className="animate-spin text-primary size-5" />
                        ) : (
                          <Upload className="text-primary size-5" />
                        )}
                        <span className="text-[8px] font-black uppercase text-secondary dark:text-zinc-350">
                          {uploadingCert ? 'Đang tải...' : 'Tải tệp ảnh'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleCertFileChange} className="hidden" disabled={uploadingCert} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* CONFIRMATION DIALOGS */}
        <ConfirmDialog
          isOpen={!!confirmConfig?.isOpen}
          title={confirmConfig?.title || ''}
          message={confirmConfig?.message || ''}
          type={confirmConfig?.type}
          onConfirm={confirmConfig?.onConfirm || (() => {})}
          onCancel={() => setConfirmConfig(null)}
        />
      </div>
    );
  }

  // ELSE: Render the normal Staff List Table View
  return (
    <div className="space-y-6 pb-8 text-zinc-800 font-sans text-sm min-h-[600px] animate-in fade-in duration-300">
      
      {/* HUD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-heading tracking-wider text-primary uppercase font-bold">Quản trị hệ thống</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-secondary dark:text-zinc-150 tracking-tight">HỒ SƠ NHÂN SỰ</h2>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">Thiết lập tài khoản, vai trò làm việc và hồ sơ chuyên môn cho đội ngũ nhân sự y khoa</p>
        </div>
        
        <button
          onClick={() => {
            reset();
            setIsCreateOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 hover:shadow-soft-button active:scale-95 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> THÊM NHÂN SỰ MỚI
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4 transition-all hover:shadow-md duration-300">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-3.5 text-zinc-400 size-4" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân sự bằng họ tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-secondary font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'TẤT CẢ' },
              { id: '4', label: 'BÁC SĨ' },
              { id: '3', label: 'KỸ THUẬT VIÊN' },
              { id: '2', label: 'LỄ TÂN' },
              { id: '6', label: 'QUẢN LÝ' },
              { id: '5', label: 'ADMIN' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id as any)}
                className={`flex-1 lg:flex-initial px-4 py-2 text-[10px] font-black tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedRoleFilter === tab.id
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm font-bold border border-zinc-200/20'
                    : 'text-zinc-400 hover:text-zinc-650'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STAFF LIST TABLE */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-zinc-50 via-slate-50 to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-secondary dark:text-zinc-400 font-black uppercase tracking-widest text-[9.5px]">
                <th className="p-5 flex items-center gap-2">Nhân sự</th>
                <th className="p-5">Email liên hệ</th>
                <th className="p-5">Số điện thoại</th>
                <th className="p-5">Vai trò làm việc</th>
                <th className="p-5 text-center">Trạng thái</th>
                <th className="p-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-zinc-400 font-bold">
                    <Loader2 className="animate-spin text-primary size-8 mx-auto mb-2" />
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : filteredStaffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-zinc-400 font-semibold italic">
                    Không tìm thấy nhân sự phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStaffList.map((staff) => {
                  const avatarUrl = staff.anh_dai_dien || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staff.ho_ten)}&backgroundType=gradientLinear&fontSize=45`;
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={avatarUrl} 
                            alt={staff.ho_ten}
                            className="size-9 rounded-full object-cover border border-zinc-150 shadow-xs shrink-0"
                          />
                          <div>
                            <span className="font-extrabold text-xs text-secondary dark:text-zinc-200 block leading-tight">{staff.ho_ten}</span>
                            <span className="text-[9px] font-semibold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide block mt-1">Mã NV: #{staff.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-xs text-slate-600 dark:text-zinc-300 font-semibold">{staff.email}</td>
                      <td className="p-5 text-xs text-slate-600 dark:text-zinc-300 font-semibold">{staff.so_dien_thoai || '-'}</td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-2.5 py-1 border rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${getRoleStyle(staff.vai_tro_id)}`}>
                          {getRoleLabel(staff.vai_tro_id)}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                          staff.trang_thai === 'hoat_dong'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400'
                        }`}>
                          {staff.trang_thai === 'hoat_dong' ? 'Đang hoạt động' : 'Khóa'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenDetails(staff)}
                            title="Xem chi tiết & Cập nhật"
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200/40 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-zinc-300 active:scale-95"
                          >
                            <Eye size={15} />
                          </button>
                          {Number(staff.vai_tro_id) !== 5 && (
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              title={staff.trang_thai === 'hoat_dong' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              className={`p-2 border rounded-xl transition-all cursor-pointer active:scale-95 ${
                                staff.trang_thai === 'hoat_dong'
                                  ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/15 dark:hover:bg-rose-900/30 text-rose-600 border-rose-200/50'
                                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-955/15 dark:hover:bg-emerald-900/30 text-emerald-600 border-emerald-200/50'
                              }`}
                            >
                              {staff.trang_thai === 'hoat_dong' ? <Lock size={15} /> : <Unlock size={15} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-150/60 dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-gradient-to-r from-zinc-50 to-slate-50 dark:from-zinc-950 dark:to-zinc-900">
              <div>
                <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-wider">Tạo tài khoản Nhân sự</h3>
                <p className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">Tạo tài khoản làm việc y khoa mới</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="size-8 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-400 hover:text-zinc-650 cursor-pointer shadow-xs transition-transform hover:rotate-90"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreateSubmit)} className="p-6 space-y-4">
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
                    <option value={4}>Bác sĩ</option>
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
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 focus:border-primary rounded-xl px-4 py-2.5 text-xs text-secondary font-bold outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)} 
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
      )}

      {/* CONFIRMATION DIALOGS */}
      <ConfirmDialog
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        type={confirmConfig?.type}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
      />
      
    </div>
  );
}

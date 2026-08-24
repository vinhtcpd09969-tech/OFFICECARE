import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPackage, updatePackage } from '../../api/admin.api';
import { X, Sparkles, Coins, Layers, Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { ImageUploadZone } from '../upload/ImageUploadZone';
import { GalleryUploadZone } from '../upload/GalleryUploadZone';

const packageSchema = z.object({
  ten_goi: z.string().min(1, 'Tên gói dịch vụ là bắt buộc'),
  loai_goi: z.enum(['KHAM', 'LE', 'LIEU_TRINH'], { message: 'Vui lòng chọn loại gói' }),
  quy_trinh: z.string().min(1, 'Quy trình trị liệu là bắt buộc'),
  muc_tieu: z.string().min(1, 'Mục tiêu trị liệu là bắt buộc'),
  tong_so_buoi: z.number().min(1, 'Số buổi phải lớn hơn 0'),
  thoi_luong_phut: z.number().min(1, 'Thời lượng buổi phải lớn hơn 0').default(60),
  don_gia: z.number().min(1, 'Giá bán phải lớn hơn 0'),
  don_gia_theo_buoi: z.number().min(0, 'Giá từng buổi không hợp lệ').optional().nullable(),
  han_su_dung_mac_dinh_ngay: z.number().min(1, 'Hạn sử dụng phải lớn hơn 0 ngày').optional().nullable(),
  anh_goi: z.string().optional().nullable(),
  anh_gallery: z.array(z.string()).optional().default([]),
  trang_thai: z.enum(['hoat_dong', 'tam_ngung']).default('hoat_dong'),
}).refine(data => {
  if (data.loai_goi === 'LIEU_TRINH') {
    return data.tong_so_buoi >= 6;
  }
  return true;
}, {
  message: "Gói liệu trình phải có ít nhất 6 buổi trở lên!",
  path: ["tong_so_buoi"]
}).refine(data => {
  if (data.loai_goi === 'LIEU_TRINH') {
    return data.han_su_dung_mac_dinh_ngay != null && data.han_su_dung_mac_dinh_ngay > 0;
  }
  return true;
}, {
  message: "Vui lòng nhập hạn sử dụng cho gói liệu trình!",
  path: ["han_su_dung_mac_dinh_ngay"]
}).refine(data => {
  if (data.loai_goi === 'LIEU_TRINH' && data.don_gia_theo_buoi) {
    const average = data.don_gia / data.tong_so_buoi;
    return data.don_gia_theo_buoi >= average;
  }
  return true;
}, {
  message: "Giá đóng lẻ từng buổi phải lớn hơn hoặc bằng đơn giá trung bình của trọn gói!",
  path: ["don_gia_theo_buoi"]
});

export type PackageFormValues = z.infer<typeof packageSchema>;

const formatNumberWithCommas = (val: any): string => {
  if (val === undefined || val === null || val === '') return '';
  const num = String(val).replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('vi-VN');
};

interface PackageModalProps {
  onClose: () => void;
  onSuccess: (newOrUpdatedId?: string) => void;
  editingPackage?: any;
  existingPackages: any[];
}

export default function PackageModal({ onClose, onSuccess, editingPackage, existingPackages }: PackageModalProps) {
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [quyTrinhSteps, setQuyTrinhSteps] = useState<string[]>(['']);
  const [mucTieuSteps, setMucTieuSteps] = useState<string[]>(['']);

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: editingPackage ? {
      ten_goi: editingPackage.ten_goi || '',
      loai_goi: editingPackage.loai_goi || 'LIEU_TRINH',
      quy_trinh: editingPackage.quy_trinh || '',
      muc_tieu: editingPackage.muc_tieu || '',
      tong_so_buoi: editingPackage.tong_so_buoi || 10,
      thoi_luong_phut: editingPackage.thoi_luong_phut || editingPackage.thoi_luong_buoi_phut || 60,
      don_gia: typeof editingPackage.don_gia === 'string' ? parseInt(editingPackage.don_gia) : (editingPackage.don_gia || Number(editingPackage.gia_tien) || 0),
      don_gia_theo_buoi: editingPackage.don_gia_theo_buoi ? (typeof editingPackage.don_gia_theo_buoi === 'string' ? parseInt(editingPackage.don_gia_theo_buoi) : editingPackage.don_gia_theo_buoi) : undefined,
      han_su_dung_mac_dinh_ngay: editingPackage.han_su_dung_mac_dinh_ngay ?? undefined,
      anh_goi: editingPackage.anh_goi || null,
      anh_gallery: editingPackage.anh_gallery || [],
      trang_thai: editingPackage.trang_thai || 'hoat_dong',
    } : {
      trang_thai: 'hoat_dong',
      loai_goi: undefined as any,
      quy_trinh: '',
      muc_tieu: '',
      tong_so_buoi: 12,
      thoi_luong_phut: 60,
      don_gia: 0,
      don_gia_theo_buoi: undefined,
      han_su_dung_mac_dinh_ngay: undefined,
      anh_goi: null,
      anh_gallery: [],
    }
  });

  const watchLoaiGoi = watch('loai_goi');
  const watchDonGia = watch('don_gia') || 0;
  const watchTongSoBuoi = watch('tong_so_buoi') || 1;
  const isTypeSelected = !!watchLoaiGoi;

  // Calculate average session cost for Lieu Trinh display helpers
  const averageCost = watchLoaiGoi === 'LIEU_TRINH' && watchDonGia > 0 && watchTongSoBuoi > 0
    ? Math.round(watchDonGia / watchTongSoBuoi)
    : 0;

  // `don_gia` (giá trọn gói) và `tong_so_buoi` là hai trường độc lập: đổi số buổi KHÔNG tự tính lại
  // giá, nên đơn giá thực mỗi buổi âm thầm nhảy. So với cấu hình gốc để cảnh báo ngay lúc gõ.
  const originalPerSession = (() => {
    const goc = Number(editingPackage?.don_gia) || 0;
    const buoi = Number(editingPackage?.tong_so_buoi) || 0;
    return goc > 0 && buoi > 0 ? Math.round(goc / buoi) : 0;
  })();
  const perSessionShifted =
    watchLoaiGoi === 'LIEU_TRINH' && originalPerSession > 0 && averageCost > 0 && averageCost !== originalPerSession;

  // Register don_gia and don_gia_theo_buoi fields manually for custom text inputs
  useEffect(() => {
    register('don_gia');
    register('don_gia_theo_buoi');
  }, [register]);

  // Enforce session count defaults when package type changes
  useEffect(() => {
    if (watchLoaiGoi === 'KHAM' || watchLoaiGoi === 'LE') {
      setValue('tong_so_buoi', 1);
      setValue('don_gia_theo_buoi', null);
    } else if (watchLoaiGoi === 'LIEU_TRINH') {
      const currentBuoi = watch('tong_so_buoi');
      if (!currentBuoi || currentBuoi <= 1) {
        setValue('tong_so_buoi', 12);
      }
    }
  }, [watchLoaiGoi, setValue, watch]);

  // Sync don_gia_theo_buoi automatically for Lieu Trinh
  useEffect(() => {
    if (watchLoaiGoi === 'LIEU_TRINH') {
      if (watchDonGia > 0 && watchTongSoBuoi > 0) {
        setValue('don_gia_theo_buoi', Math.round(watchDonGia / watchTongSoBuoi));
      } else {
        setValue('don_gia_theo_buoi', 0);
      }
    }
  }, [watchLoaiGoi, watchDonGia, watchTongSoBuoi, setValue]);

  // Khởi tạo các bước từ dữ liệu cũ nếu chỉnh sửa
  useEffect(() => {
    if (editingPackage) {
      setQuyTrinhSteps(editingPackage.quy_trinh ? editingPackage.quy_trinh.split('\n') : ['']);
      setMucTieuSteps(editingPackage.muc_tieu ? editingPackage.muc_tieu.split('\n') : ['']);
      setValue('quy_trinh', editingPackage.quy_trinh || '');
      setValue('muc_tieu', editingPackage.muc_tieu || '');
    } else {
      setQuyTrinhSteps(['']);
      setMucTieuSteps(['']);
      setValue('quy_trinh', '');
      setValue('muc_tieu', '');
    }
  }, [editingPackage, setValue]);

  const executeSave = async (data: PackageFormValues) => {
    try {
      const isEdit = !!(editingPackage && editingPackage.id);
      const don_gia_theo_buoi = data.loai_goi === 'LIEU_TRINH'
        ? (data.don_gia_theo_buoi || averageCost)
        : data.don_gia;

      const payload = {
        ten_goi: data.ten_goi,
        loai_goi: data.loai_goi,
        tong_so_buoi: data.tong_so_buoi,
        thoi_luong_phut: data.thoi_luong_phut,
        don_gia: data.don_gia,
        don_gia_theo_buoi,
        han_su_dung_mac_dinh_ngay: data.loai_goi === 'LIEU_TRINH' ? data.han_su_dung_mac_dinh_ngay : null,
        anh_goi: data.anh_goi || null,
        anh_gallery: data.anh_gallery || [],
        quy_trinh: data.quy_trinh || '',
        muc_tieu: data.muc_tieu || '',
        trang_thai: 'hoat_dong',
      };

      let savedId = editingPackage?.id;
      if (isEdit) {
        await updatePackage(editingPackage.id, payload);
        toast.success(`Cập nhật gói dịch vụ "${data.ten_goi}" thành công!`);
      } else {
        const res = await createPackage(payload);
        savedId = res.data?.id;
        toast.success(`Tạo mới gói dịch vụ "${data.ten_goi}" thành công!`);
      }
      onSuccess(savedId);
    } catch (error: any) {
      console.error('Error saving package:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu gói dịch vụ.';
      toast.error(msg);
    }
  };

  const onSubmit = async (data: PackageFormValues) => {
    const isEdit = !!(editingPackage && editingPackage.id);

    // Validate unique name
    const inputName = data.ten_goi.trim().toLowerCase();
    const isDuplicate = existingPackages.some((pkg: any) => {
      if (isEdit && pkg.id === editingPackage.id) return false;
      return pkg.ten_goi.trim().toLowerCase() === inputName;
    });

    if (isDuplicate) {
      setError('ten_goi', {
        type: 'manual',
        message: `Tên gói "${data.ten_goi}" đã tồn tại trên hệ thống. Vui lòng nhập tên khác!`
      });
      return;
    }

    // Determine smart confirmation message
    const confirmMsg = isEdit
      ? `Bạn có chắc chắn muốn lưu các thay đổi cho gói dịch vụ "${data.ten_goi}" không?`
      : `Bạn có chắc chắn muốn tạo mới gói dịch vụ "${data.ten_goi}" không?`;

    setConfirmConfig({
      isOpen: true,
      title: isEdit ? 'Cập nhật Gói dịch vụ' : 'Tạo mới Gói dịch vụ',
      message: confirmMsg,
      onConfirm: () => {
        setConfirmConfig(null);
        executeSave(data);
      }
    });
  };

  // Helper colors for badges
  const typeLabels = {
    KHAM: { text: 'Gói Lượng Giá Chức Năng', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-100/50' },
    LE: { text: 'Gói Lẻ Trị Liệu', color: 'bg-teal-50 border-teal-200 text-teal-700 shadow-teal-100/50' },
    LIEU_TRINH: { text: 'Gói Liệu Trình Chuyên Sâu', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100/50' }
  };

  return (
    <div className="w-full space-y-6 font-jakarta pb-12 animate-fade-in">
        
        {/* Form Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3.5">
            <button 
              type="button"
              onClick={onClose} 
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
              title="Quay lại danh sách gói"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="size-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  {editingPackage && editingPackage.id ? 'Chỉnh sửa cấu hình gói' : 'Thiết kế gói mới'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 font-jakarta tracking-tight">
                {editingPackage && editingPackage.id ? `CẤU HÌNH GÓI: ${editingPackage.ten_goi}` : 'TẠO GÓI DỊCH VỤ MỚI'}
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
                Bảng cấu hình gói chuyên khoa phục hồi chức năng & phân tích tài chính
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-xs cursor-pointer transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={!isTypeSelected}
              className={`px-5 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                !isTypeSelected
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-teal-600/20 active:scale-95'
              }`}
            >
              <Sparkles className="w-4 h-4" /> {editingPackage && editingPackage.id ? 'CẬP NHẬT CẤU HÌNH' : 'LƯU GÓI DỊCH VỤ'}
            </button>
          </div>
        </div>

        {/* Form Body - Two-Column Layout (Full Width Grid) */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PANEL (4 cols) - Interactive Image Upload & Dynamic Guide */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-slate-50/70 dark:bg-zinc-900/60 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-6">
                <ImageUploadZone
                  value={watch('anh_goi') || null}
                  onChange={(url) => setValue('anh_goi', url)}
                  uploadType="package"
                  aspectClass="aspect-[4/3]"
                  label="Ảnh Đại Diện Gói *"
                />

                <GalleryUploadZone
                  value={watch('anh_gallery') || []}
                  onChange={(urls) => setValue('anh_gallery', urls)}
                  uploadType="package"
                  label="Thư viện ảnh thực tế"
                />

                {/* Badge Type Indicator */}
                {isTypeSelected && (
                  <div className={`p-4 border rounded-2xl shadow-sm transition-all duration-300 animate-fade-in ${typeLabels[watchLoaiGoi].color}`}>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 shrink-0" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider font-bold opacity-60">Phân Phối Nghiệp Vụ</p>
                        <p className="text-xs font-black">{typeLabels[watchLoaiGoi].text}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic pricing/operational guide in place of active switch */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 p-4 rounded-2xl flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1.5 shrink-0 animate-ping"></span>
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    {watchLoaiGoi === 'KHAM' 
                      ? 'Hướng dẫn Lượng Giá Chức Năng' 
                      : watchLoaiGoi === 'LE' 
                        ? 'Hướng dẫn Gói Lẻ' 
                        : watchLoaiGoi === 'LIEU_TRINH'
                          ? 'Chiến lược Giá Liệu Trình'
                          : 'Cấu hình y khoa'}
                  </p>
                  <p className="text-[9px] text-emerald-700 dark:text-emerald-300/90 font-semibold mt-0.5 leading-relaxed">
                    {watchLoaiGoi === 'KHAM' && (
                      'Dành riêng cho Chuyên viên thực hiện kiểm tra tầm vận động, đánh giá chức năng ban đầu và lập kế hoạch trị liệu cho khách hàng.'
                    )}
                    {watchLoaiGoi === 'LE' && (
                      'Áp dụng cho các dịch vụ đơn lẻ vãng lai. Khách hàng sử dụng buổi nào sẽ thực hiện thanh toán buổi đó.'
                    )}
                    {watchLoaiGoi === 'LIEU_TRINH' && (
                      watchDonGia > 0 && watch('don_gia_theo_buoi') && Number(watch('don_gia_theo_buoi')) > averageCost
                        ? `Mua trọn gói tiết kiệm ${(Number(watch('don_gia_theo_buoi')) - averageCost).toLocaleString()}đ mỗi buổi (Tổng tiết kiệm ${((Number(watch('don_gia_theo_buoi')) - averageCost) * watchTongSoBuoi).toLocaleString()}đ cho cả liệu trình) so với đóng lẻ từng buổi.`
                        : 'Cung cấp mức giá ưu đãi khi mua trọn gói dài hạn so với hình thức thanh toán lẻ từng buổi.'
                    )}
                    {!watchLoaiGoi && 'Vui lòng chọn loại gói dịch vụ ở cột bên phải để xem thông số và định vị nghiệp vụ tương ứng.'}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL (8 cols) - Core Fields & Intelligent Pricing */}
            <div className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-6">
              
              <div className="space-y-6 text-xs">
                
                {/* Hộp I: Phân loại gói - LOẠI GÓI CHỌN ĐẦU TIÊN (Luôn tương tác được) */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Hộp I: Định vị phân loại gói
                  </h4>
                  
                  <div>
                    <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Loại gói dịch vụ *</label>
                    <select 
                      {...register('loai_goi')}
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all text-secondary dark:text-zinc-100 font-semibold text-xs shadow-sm cursor-pointer relative z-30 font-heading"
                    >
                      <option value="">-- CHỌN LOẠI GÓI DỊCH VỤ --</option>
                      <option value="KHAM">Gói Lượng Giá Chức Năng (Chuyên viên đánh giá chức năng)</option>
                      <option value="LE">Gói Lẻ (Trị liệu đơn buổi nhanh gọn)</option>
                      <option value="LIEU_TRINH">Gói Liệu Trình (Phương án điều trị dài hạn)</option>
                    </select>
                    {errors.loai_goi && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.loai_goi.message}</span>
                    )}
                  </div>
                </div>

                {/* PHẦN CÁC TRƯỜNG DỮ LIỆU CÒN LẠI - BỊ PHỦ KÍNH NẾU CHƯA CHỌN LOẠI GÓI */}
                <div className="relative">
                  {!isTypeSelected && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center select-none rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-150 dark:border-indigo-800 flex items-center justify-center mb-2 shadow-md shadow-indigo-100 dark:shadow-none">
                        <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Thông số chi tiết đang khóa</h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium max-w-xs mt-1">
                        Vui lòng chọn loại gói dịch vụ ở trên để nhập thông tin chi tiết phác đồ và tài chính.
                      </p>
                    </div>
                  )}

                  <div className={`space-y-6 transition-all duration-300 ${!isTypeSelected ? 'opacity-25 pointer-events-none' : ''}`}>
                    {/* Hộp I (phần còn lại): Tên gói, Danh mục và Mô tả */}
                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Tên gói dịch vụ *</label>
                        <input
                          {...register('ten_goi')}
                          placeholder="Nhập tên gói dịch vụ..."
                          className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 text-sm placeholder-zinc-300 dark:placeholder-zinc-500 shadow-sm"
                        />
                        {errors.ten_goi && (
                          <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_goi.message}</span>
                        )}
                      </div>

                      <style>{`
                        .package-scroll::-webkit-scrollbar { width: 5px; }
                        .package-scroll::-webkit-scrollbar-track { background: transparent; }
                        .package-scroll::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 99px; }
                        .dark .package-scroll::-webkit-scrollbar-thumb { background: #27272a; }
                      `}</style>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* BỘ DỰNG QUY TRÌNH DẠNG LIST */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1">
                            <label className="block font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">Quy trình các bước trị liệu *</label>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...quyTrinhSteps, ''];
                                setQuyTrinhSteps(next);
                                setValue('quy_trinh', next.filter(s => s.trim() !== '').join('\n'), { shouldValidate: true });
                              }}
                              className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-all cursor-pointer"
                            >
                              + Thêm bước
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1.5 package-scroll">
                            {quyTrinhSteps.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-2 animate-fade-in">
                                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-400 w-5 text-right shrink-0">{idx + 1}.</span>
                                <input
                                  type="text"
                                  value={step}
                                  onChange={(e) => {
                                    const next = [...quyTrinhSteps];
                                    next[idx] = e.target.value;
                                    setQuyTrinhSteps(next);
                                    setValue('quy_trinh', next.filter(s => s.trim() !== '').join('\n'), { shouldValidate: true });
                                  }}
                                  placeholder={`Nhập nội dung bước ${idx + 1}...`}
                                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 text-xs shadow-xs"
                                />
                                {quyTrinhSteps.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = quyTrinhSteps.filter((_, i) => i !== idx);
                                      setQuyTrinhSteps(next);
                                      setValue('quy_trinh', next.filter(s => s.trim() !== '').join('\n'), { shouldValidate: true });
                                    }}
                                    className="p-1.5 border border-zinc-150 hover:border-rose-250 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50/20 transition-all shrink-0 cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {errors.quy_trinh && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.quy_trinh.message}</span>
                          )}
                        </div>

                        {/* BỘ DỰNG MỤC TIÊU DẠNG LIST */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1">
                            <label className="block font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">Mục tiêu trị liệu *</label>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...mucTieuSteps, ''];
                                setMucTieuSteps(next);
                                setValue('muc_tieu', next.filter(s => s.trim() !== '').join('\n'), { shouldValidate: true });
                              }}
                              className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-all cursor-pointer"
                            >
                              + Thêm mục tiêu
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1.5 package-scroll">
                            {mucTieuSteps.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-2 animate-fade-in">
                                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-400 w-5 text-right shrink-0">•</span>
                                <input
                                  type="text"
                                  value={step}
                                  onChange={(e) => {
                                    const next = [...mucTieuSteps];
                                    next[idx] = e.target.value;
                                    setMucTieuSteps(next);
                                    setValue('muc_tieu', next.filter(s => s.trim() !== '').join('\n'), { shouldValidate: true });
                                  }}
                                  placeholder={`Nhập nội dung mục tiêu...`}
                                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 text-xs shadow-xs"
                                />
                                {mucTieuSteps.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = mucTieuSteps.filter((_, i) => i !== idx);
                                      setMucTieuSteps(next);
                                      setValue('muc_tieu', next.filter(s => s.trim() !== '').join('\n'), { shouldValidate: true });
                                    }}
                                    className="p-1.5 border border-zinc-150 dark:border-zinc-700 hover:border-rose-250 text-zinc-400 dark:text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50/20 transition-all shrink-0 cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {errors.muc_tieu && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.muc_tieu.message}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hộp II: Vận hành & Tài chính */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" /> Hộp II: Cấu hình vận hành & Kinh tế học
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Tổng số buổi *</label>
                          <div className="relative">
                            <input 
                              type="number"
                              {...register('tong_so_buoi', { valueAsNumber: true })} 
                              placeholder="12"
                              readOnly={watchLoaiGoi === 'KHAM' || watchLoaiGoi === 'LE'}
                              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all font-semibold text-sm shadow-sm ${
                                watchLoaiGoi === 'KHAM' || watchLoaiGoi === 'LE'
                                  ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-secondary dark:text-zinc-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                              }`}
                            />
                            {watchLoaiGoi === 'LIEU_TRINH' && (
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 dark:text-zinc-400">Buổi</span>
                            )}
                          </div>
                          {errors.tong_so_buoi && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.tong_so_buoi.message}</span>
                          )}

                          {watchLoaiGoi === 'LIEU_TRINH' && averageCost > 0 && !errors.tong_so_buoi && (
                            <p className="text-[10px] text-slate-400 dark:text-zinc-400 mt-1 font-medium">
                              Đơn giá thực tế:{' '}
                              <span className={`font-bold ${perSessionShifted ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {averageCost.toLocaleString()}đ / buổi
                              </span>
                            </p>
                          )}

                          {perSessionShifted && (
                            <div className="mt-2 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-2.5 space-y-1 animate-slide-down">
                              <span className="text-[10px] font-black text-amber-900 dark:text-amber-200 block">
                                ⚠️ Đơn giá mỗi buổi đổi: {originalPerSession.toLocaleString()}đ → {averageCost.toLocaleString()}đ
                              </span>
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold block leading-relaxed">
                                Giá bán trọn gói giữ nguyên nên khách vẫn trả cùng số tiền cho số buổi khác đi. Sửa lại
                                “Giá bán trọn gói” nếu muốn giữ đơn giá {originalPerSession.toLocaleString()}đ/buổi
                                (= {(originalPerSession * watchTongSoBuoi).toLocaleString()}đ).
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Thời lượng mỗi buổi (Phút) *</label>
                          <div className="relative">
                            <input 
                              type="number"
                              {...register('thoi_luong_phut', { valueAsNumber: true })} 
                              placeholder="60"
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 shadow-sm text-sm"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 dark:text-zinc-400">Phút</span>
                          </div>
                          {errors.thoi_luong_phut ? (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.thoi_luong_phut.message}</span>
                          ) : (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium leading-relaxed flex items-center gap-1">
                              <span>ℹ️ Vui lòng chủ động thêm thời gian cho nhân sự chuẩn bị</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                            {watchLoaiGoi === 'LIEU_TRINH' ? 'Giá bán trọn gói (VND) *' : 'Giá bán dịch vụ (VND) *'}
                          </label>
                          <div className="relative">
                            <input 
                              type="text"
                              value={formatNumberWithCommas(watchDonGia)}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setValue('don_gia', val ? parseInt(val) : 0, { shouldValidate: true });
                              }}
                              placeholder="6.000.000"
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 shadow-sm text-sm pr-12"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 dark:text-zinc-400">VND</span>
                          </div>
                          {errors.don_gia && (
                            <span className="text-rose-500 text-[10px] mt-1 block">{errors.don_gia.message}</span>
                          )}
                        </div>

                        {/* DYNAMIC FIELD: Display ONLY for LIEU_TRINH */}
                        {watchLoaiGoi === 'LIEU_TRINH' && (
                          <div className="animate-slide-down">
                            <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Giá thanh toán lẻ từng buổi (VND) *</label>
                            <div className="relative">
                              <input 
                                type="text"
                                readOnly
                                value={formatNumberWithCommas(watch('don_gia_theo_buoi'))}
                                placeholder={averageCost ? formatNumberWithCommas(averageCost) : "60.000"}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none font-semibold text-secondary dark:text-zinc-100 shadow-sm text-sm pr-12 cursor-not-allowed"
                              />
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 dark:text-zinc-400">VND</span>
                            </div>
                            {errors.don_gia_theo_buoi ? (
                              <span className="text-rose-500 text-[10px] mt-1 block">{errors.don_gia_theo_buoi.message}</span>
                            ) : (
                              averageCost > 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-zinc-400 mt-1 font-medium">
                                  Đơn giá trung bình trọn gói: <span className="font-bold text-emerald-600 dark:text-emerald-400">{averageCost.toLocaleString()}đ / buổi</span>.
                                </p>
                              )
                            )}
                          </div>
                        )}

                        {/* DYNAMIC FIELD: Display ONLY for LIEU_TRINH */}
                        {watchLoaiGoi === 'LIEU_TRINH' && (
                          <div className="animate-slide-down">
                            <label className="block font-bold text-slate-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Hạn sử dụng *</label>
                            <div className="relative">
                              <input
                                type="number"
                                {...register('han_su_dung_mac_dinh_ngay', { valueAsNumber: true })}
                                placeholder="Nhập số ngày"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 shadow-sm text-sm pr-14"
                              />
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 dark:text-zinc-400">Ngày</span>
                            </div>
                            {errors.han_su_dung_mac_dinh_ngay ? (
                              <span className="text-rose-500 text-[10px] mt-1 block">{errors.han_su_dung_mac_dinh_ngay.message}</span>
                            ) : (
                              <p className="text-[10px] text-slate-400 dark:text-zinc-400 mt-1 font-medium">
                                Tính từ ngày kích hoạt gói — tự điền khi lễ tân lập hóa đơn, có thể sửa tay từng ca nếu cần.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons inside content panel */}
              <div className="pt-8 flex gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-5 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-355 text-slate-500 dark:text-zinc-300 hover:text-slate-800 font-bold rounded-xl shadow-sm transition-all text-xs cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit" 
                  disabled={!isTypeSelected}
                  className={`flex-1 px-5 py-3 font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 ${
                    !isTypeSelected
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> {editingPackage && editingPackage.id ? 'CẬP NHẬT CẤU HÌNH GÓI' : 'TẠO GÓI MỚI NGAY'}
                </button>
              </div>

            </div>

          </div>
        </form>

        <ConfirmDialog
          isOpen={!!confirmConfig?.isOpen}
          title={confirmConfig?.title || ''}
          message={confirmConfig?.message || ''}
          onConfirm={confirmConfig?.onConfirm || (() => {})}
          onCancel={() => setConfirmConfig(null)}
        />
      </div>
  );
}

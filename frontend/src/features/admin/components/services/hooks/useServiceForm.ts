import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';
import { serviceSchema, ServiceFormValues, Service, Category } from '../types';
import { HINT_KEYWORDS, normalizeText, getServiceBenefits } from '../constants';
import { createService, updateService } from '../../../../../api/admin.api';

interface UseServiceFormProps {
  selectedType: 'chinh' | 'bo_sung';
  categories: Category[];
  services: Service[];
  editingService: Service | null;
  onSuccess: () => void;
}

export function useServiceForm({
  selectedType,
  categories,
  services,
  editingService,
  onSuccess
}: UseServiceFormProps) {
  const { register, handleSubmit, reset, setError, setValue, watch, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: { 
      trang_thai: 'hoat_dong', 
      thoi_gian_uoc_tinh: 45, 
      don_gia: 150000,
      loai_dich_vu: 'chinh',
      hien_thi_website: false,
      thiet_bi_yeu_cau: 'không có'
    }
  });

  const watchedThietBiYeuCau = watch('thiet_bi_yeu_cau');
  const watchedTenDichVu = watch('ten_dich_vu');

  const selectedDevices = useMemo(() => {
    if (!watchedThietBiYeuCau) return [];
    return watchedThietBiYeuCau.split(',').map((item: string) => item.trim()).filter(Boolean);
  }, [watchedThietBiYeuCau]);

  const handleDeviceCheckboxChange = useCallback((deviceValue: string) => {
    if (deviceValue === 'không có') {
      setValue('thiet_bi_yeu_cau', 'không có');
    } else {
      let current = [...selectedDevices].filter(d => d !== 'không có');
      if (current.includes(deviceValue)) {
        current = current.filter(d => d !== deviceValue);
      } else {
        current.push(deviceValue);
      }
      if (current.length === 0) {
        setValue('thiet_bi_yeu_cau', 'không có');
      } else {
        setValue('thiet_bi_yeu_cau', current.join(', '));
      }
    }
  }, [selectedDevices, setValue]);

  const suggestions = useMemo(() => {
    if (!watchedTenDichVu) return [];
    const normalized = normalizeText(watchedTenDichVu);
    const result: string[] = [];
    for (const hint of HINT_KEYWORDS) {
      if (hint.keywords.some(kw => normalized.includes(kw))) {
        if (!result.includes(hint.device)) {
          result.push(hint.device);
        }
      }
    }
    return result;
  }, [watchedTenDichVu]);

  const handleAddSuggestedDevice = useCallback((deviceValue: string) => {
    if (deviceValue === 'không có') {
      setValue('thiet_bi_yeu_cau', 'không có');
    } else {
      const current = selectedDevices.filter(d => d !== 'không có');
      if (!current.includes(deviceValue)) {
        current.push(deviceValue);
        setValue('thiet_bi_yeu_cau', current.join(', '));
      }
    }
  }, [selectedDevices, setValue]);

  // Load editing values when editingService is set
  useEffect(() => {
    if (editingService) {
      // Format array benefits back to multiline text for frontend textarea
      let benefitsStr = '';
      if (editingService.loai_dich_vu_ho_tro) {
        let parsed = editingService.loai_dich_vu_ho_tro;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch(e) {}
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          benefitsStr = parsed.join('\n');
        }
      }

      // UX Improvement: If benefits are empty in DB, load the default fallback benefits
      if (!benefitsStr) {
        benefitsStr = getServiceBenefits(editingService).join('\n');
      }

      // UX Improvement: If mo_ta_chi_tiet is empty, load the short description as default
      const defaultMoTaChiTiet = editingService.mo_ta_chi_tiet || editingService.mo_ta_ngan || editingService.mo_ta || '';

      reset({
        danh_muc_id: editingService.danh_muc_id ? Number(editingService.danh_muc_id) : (categories[0]?.id ? Number(categories[0].id) : 1),
        ten_dich_vu: editingService.ten_dich_vu,
        mo_ta: editingService.mo_ta_ngan || editingService.mo_ta || '',
        thoi_gian_uoc_tinh: Number(editingService.thoi_gian_uoc_tinh || 45),
        don_gia: Number(editingService.don_gia || 0),
        thiet_bi_yeu_cau: editingService.thiet_bi_yeu_cau || '',
        trang_thai: editingService.trang_thai === 'hoat_dong' ? 'hoat_dong' : 'vo_hieu',
        loai_dich_vu: selectedType,
        hien_thi_website: false,
        mo_ta_chi_tiet: defaultMoTaChiTiet,
        loai_dich_vu_ho_tro_str: benefitsStr
      });
    }
  }, [editingService, categories, selectedType, reset]);

  const onSubmit = async (data: any) => {
    try {
      // Kiểm tra trùng tên dịch vụ/kỹ thuật (không phân biệt hoa thường, khoảng trắng)
      const inputNameTrimmed = data.ten_dich_vu.trim().toLowerCase();
      const isDuplicate = services.some((svc: any) => {
        // Nếu đang sửa đổi, bỏ qua bản ghi hiện tại
        if (editingService && String(svc.id) === String(editingService.id)) {
          return false;
        }
        return svc.ten_dich_vu.trim().toLowerCase() === inputNameTrimmed;
      });

      if (isDuplicate) {
        const typeLabel = selectedType === 'chinh' ? 'Kỹ thuật nội bộ' : 'Dịch vụ lẻ bổ trợ';
        setError('ten_dich_vu', {
          type: 'manual',
          message: `Tên ${typeLabel.toLowerCase()} này đã tồn tại trên hệ thống. Vui lòng nhập tên khác!`
        });
        return;
      }

      // Split multiline string into array of strings for backend
      const benefits = data.loai_dich_vu_ho_tro_str
        ? data.loai_dich_vu_ho_tro_str.split('\n').map((line: string) => line.trim()).filter(Boolean)
        : [];

      const payload = {
        danh_muc_id: selectedType === 'chinh' 
          ? (categories[0]?.id ? Number(categories[0].id) : 1) 
          : Number(data.danh_muc_id),
        ten_dich_vu: data.ten_dich_vu,
        mo_ta: data.mo_ta,
        thoi_gian_uoc_tinh: selectedType === 'chinh' 
          ? 45 
          : Number(data.thoi_gian_uoc_tinh),
        don_gia: selectedType === 'chinh' 
          ? 0 
          : Number(data.don_gia),
        thiet_bi_yeu_cau: data.thiet_bi_yeu_cau,
        trang_thai: data.trang_thai,
        loai_dich_vu: selectedType, // Automatically set
        hien_thi_website: false, // Hidden from website for both as requested
        mo_ta_chi_tiet: data.mo_ta_chi_tiet || '',
        loai_dich_vu_ho_tro: benefits
      };

      if (editingService) {
        await updateService(String(editingService.id), payload);
        alert('Cập nhật dịch vụ thành công!');
      } else {
        await createService(payload);
        alert('Tạo dịch vụ thành công!');
      }
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      alert(editingService ? 'Có lỗi xảy ra khi cập nhật dịch vụ' : 'Có lỗi xảy ra khi tạo dịch vụ');
    }
  };

  return {
    register,
    handleSubmit,
    reset,
    setValue,
    errors,
    watchedThietBiYeuCau,
    watchedTenDichVu,
    selectedDevices,
    suggestions,
    handleDeviceCheckboxChange,
    handleAddSuggestedDevice,
    onSubmit
  };
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { serviceSchema, ServiceFormValues, Service, Category } from '../types';
import { createService, updateService } from '../../../../../api/admin.api';

interface UseServiceFormProps {
  categories: Category[];
  services: Service[];
  editingService: Service | null;
  onSuccess: () => void;
}

export function useServiceForm({
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
      hien_thi_website: false,
      loai_phong_yeu_cau: 'phong_tri_lieu'
    }
  });

  const watchedLoaiPhongYeuCau = watch('loai_phong_yeu_cau');

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
        const matchingSvc = services.find((s: any) => s.ten_dich_vu === editingService.ten_dich_vu);
        const benefitsArray = matchingSvc?.loai_dich_vu_ho_tro;
        if (Array.isArray(benefitsArray)) {
          benefitsStr = benefitsArray.join('\n');
        }
      }

      // UX Improvement: If mo_ta_chi_tiet is empty, load the short description as default
      const defaultMoTaChiTiet = editingService.mo_ta_chi_tiet || editingService.mo_ta_ngan || editingService.mo_ta || '';

      reset({
        danh_muc_id: editingService.danh_muc_id ? Number(editingService.danh_muc_id) : (categories[0]?.id ? Number(categories[0].id) : 1),
        ten_dich_vu: editingService.ten_dich_vu,
        mo_ta: editingService.mo_ta_ngan || editingService.mo_ta || '',
        thoi_gian_uoc_tinh: Number(editingService.thoi_gian_uoc_tinh || 45),
        don_gia: Number(editingService.don_gia || 0),
        loai_phong_yeu_cau: (editingService.loai_phong_yeu_cau as any) || 'phong_tri_lieu',
        trang_thai: editingService.trang_thai || 'hoat_dong',
        hien_thi_website: editingService.hien_thi_website || false,
        mo_ta_chi_tiet: defaultMoTaChiTiet,
        loai_dich_vu_ho_tro_str: benefitsStr
      });
    } else {
      reset({
        danh_muc_id: categories[0]?.id ? Number(categories[0].id) : 1,
        ten_dich_vu: '',
        mo_ta: '',
        thoi_gian_uoc_tinh: 45,
        don_gia: 150000,
        loai_phong_yeu_cau: 'phong_tri_lieu',
        trang_thai: 'hoat_dong',
        hien_thi_website: false,
        mo_ta_chi_tiet: '',
        loai_dich_vu_ho_tro_str: ''
      });
    }
  }, [editingService, categories, reset, services]);

  const onSubmit = async (data: any) => {
    try {
      // Kiểm tra trùng tên dịch vụ (không phân biệt hoa thường, khoảng trắng)
      const inputNameTrimmed = data.ten_dich_vu.trim().toLowerCase();
      const isDuplicate = services.some((svc: any) => {
        // Nếu đang sửa đổi, bỏ qua bản ghi hiện tại
        if (editingService && String(svc.id) === String(editingService.id)) {
          return false;
        }
        return svc.ten_dich_vu.trim().toLowerCase() === inputNameTrimmed;
      });

      if (isDuplicate) {
        setError('ten_dich_vu', {
          type: 'manual',
          message: `Tên dịch vụ này đã tồn tại trên hệ thống. Vui lòng nhập tên khác!`
        });
        return;
      }

      // Split multiline string into array of strings for backend
      const benefits = data.loai_dich_vu_ho_tro_str
        ? data.loai_dich_vu_ho_tro_str.split('\n').map((line: string) => line.trim()).filter(Boolean)
        : [];

      const payload = {
        danh_muc_id: Number(data.danh_muc_id),
        ten_dich_vu: data.ten_dich_vu,
        mo_ta: data.mo_ta,
        thoi_gian_uoc_tinh: Number(data.thoi_gian_uoc_tinh),
        don_gia: Number(data.don_gia),
        loai_phong_yeu_cau: data.loai_phong_yeu_cau || 'phong_tri_lieu',
        trang_thai: data.trang_thai || 'hoat_dong',
        hien_thi_website: Boolean(data.hien_thi_website),
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
    watchedLoaiPhongYeuCau,
    onSubmit
  };
}

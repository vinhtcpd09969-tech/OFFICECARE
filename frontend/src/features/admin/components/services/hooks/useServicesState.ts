import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getServices, deleteService, getCategories, getPackages, updateService } from '../../../../../api/admin.api';
import { Service, Category, Package } from '../types';

export function useServicesState() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'ky_thuat' | 'don_le'>('ky_thuat');
  const [expandedServiceIds, setExpandedServiceIds] = useState<Record<string, boolean>>({});

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const toggleExpandService = useCallback((id: string | number) => {
    setExpandedServiceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const clearExpandedServices = useCallback(() => {
    setExpandedServiceIds({});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [svcRes, catRes, pkgsRes] = await Promise.all([
        getServices(),
        getCategories(),
        getPackages()
      ]);
      setServices(svcRes.data || []);
      setCategories(
        (catRes.data || []).filter(
          (c: any) => c.loai_danh_muc === 'dich_vu' && c.an_hien !== false
        )
      );
      setPackages(pkgsRes.data || []);
    } catch (error) {
      console.error('Error fetching services data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map service ID to a list of unique base package names using it
  const serviceUsageNamesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    packages.forEach((pkg: any) => {
      if (pkg.chi_tiet_dich_vu && Array.isArray(pkg.chi_tiet_dich_vu)) {
        pkg.chi_tiet_dich_vu.forEach((item: any) => {
          const serviceId = item.dich_vu_id;
          if (serviceId) {
            // Lấy tên gốc bằng cách cắt bỏ phần phân khúc - BASIC/STANDARD/INTENSIVE
            const baseName = pkg.ten_goi.replace(/\s*-\s*(BASIC|STANDARD|INTENSIVE)\s*$/i, '').trim();
            if (!map[serviceId]) {
              map[serviceId] = [];
            }
            if (!map[serviceId].includes(baseName)) {
              map[serviceId].push(baseName);
            }
          }
        });
      }
    });
    return map;
  }, [packages]);

  // Map service ID to the number of unique packages using it
  const packageCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    Object.keys(serviceUsageNamesMap).forEach((serviceId) => {
      map[serviceId] = serviceUsageNamesMap[serviceId].length;
    });
    return map;
  }, [serviceUsageNamesMap]);

  const handleDelete = useCallback(async (svc: Service) => {
    const confirmMsg = `Bạn có chắc chắn muốn xóa dịch vụ "${svc.ten_dich_vu}" không?\nHành động này không thể hoàn tác và có thể ảnh hưởng đến các gói đang sử dụng dịch vụ này.`;
    if (window.confirm(confirmMsg)) {
      try {
        await deleteService(String(svc.id));
        await fetchData();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Không thể xóa dịch vụ này. Vui lòng kiểm tra lại liên kết gói hoặc liệu trình.');
      }
    }
  }, [fetchData]);

  const handleToggleStatus = useCallback(async (svc: Service) => {
    const nextStatus = svc.trang_thai === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong';
    try {
      await updateService(String(svc.id), {
        danh_muc_id: svc.danh_muc_id ? Number(svc.danh_muc_id) : (categories[0]?.id ? Number(categories[0].id) : 1),
        ten_dich_vu: svc.ten_dich_vu,
        mo_ta: svc.mo_ta_ngan || svc.mo_ta || '',
        thoi_gian_uoc_tinh: Number(svc.thoi_gian_uoc_tinh || 45),
        don_gia: Number(svc.don_gia || 0),
        thiet_bi_yeu_cau: svc.thiet_bi_yeu_cau || '',
        trang_thai: nextStatus,
        loai_dich_vu: svc.loai_dich_vu || 'ky_thuat',
        hien_thi_website: false
      });
      await fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Không thể cập nhật trạng thái dịch vụ');
    }
  }, [categories, fetchData]);

  const filteredServices = useMemo(() => {
    let result = services;

    // Filter by selected layout tab type
    result = result.filter(svc => svc.loai_dich_vu === selectedType);

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(svc => 
        svc.ten_dich_vu.toLowerCase().includes(q) ||
        (svc.ten_danh_muc && svc.ten_danh_muc.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [services, selectedType, searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchParams(value ? { q: value } : {});
  }, [setSearchParams]);

  return {
    services,
    categories,
    loading,
    selectedType,
    setSelectedType,
    expandedServiceIds,
    toggleExpandService,
    clearExpandedServices,
    searchQuery,
    handleSearchChange,
    serviceUsageNamesMap,
    packageCountMap,
    filteredServices,
    handleDelete,
    handleToggleStatus,
    fetchData
  };
}

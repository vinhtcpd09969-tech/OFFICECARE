import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getServices, createService, updateService, deleteService, getCategories, getPackages } from '../../../api/admin.api';
import { useSearchParams } from 'react-router-dom';

const serviceSchema = z.object({
  danh_muc_id: z.number().min(1, 'Vui lòng chọn danh mục'),
  ten_dich_vu: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  mo_ta: z.string().optional().nullable(),
  thoi_gian_uoc_tinh: z.number().min(1, 'Thời gian phải lớn hơn 0'),
  don_gia: z.number().min(0, 'Đơn giá phải từ 0đ'),
  thiet_bi_yeu_cau: z.string().optional().nullable(),
  trang_thai: z.enum(['hoat_dong', 'vo_hieu']),
  loai_dich_vu: z.enum(['chinh', 'bo_sung'])
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
const currencyFormatter = new Intl.NumberFormat('vi-VN');

const getServiceImage = (id: string | number) => {
  const isEven = String(id).charCodeAt(0) % 2 === 0;
  return `https://images.unsplash.com/photo-${isEven ? '1576091160550-21080f0c7324' : '1544367567-0f2fcb009e0b'}?q=80&w=200&auto=format&fit=crop`;
};

// Check if a service is part of the 13 Shared Library services
const isSharedLibraryService = (svc: any) => {
  const name = svc.ten_dich_vu.toLowerCase();
  return (
    name.includes('deep tissue') ||
    name.includes('muscle release') ||
    name.includes('electrotherapy') ||
    name.includes('heat therapy') ||
    name.includes('cervical stretching') ||
    name.includes('spinal stretching') ||
    name.includes('stretching therapy') ||
    name.includes('shoulder mobility') ||
    name.includes('wrist mobility') ||
    name.includes('tendon release') ||
    name.includes('joint mobility') ||
    name.includes('piriformis release') ||
    name.includes('exercise guidance') ||
    (svc.mo_ta_ngan && svc.mo_ta_ngan.includes('SVC-'))
  );
};

export default function ManageServices() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'chinh' | 'bo_sung'>('all');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { 
      trang_thai: 'hoat_dong', 
      thoi_gian_uoc_tinh: 45, 
      don_gia: 0,
      loai_dich_vu: 'chinh'
    }
  });

  const watchStatus = watch('trang_thai');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [svcRes, catRes, pkgsRes] = await Promise.all([
        getServices(), 
        getCategories(),
        getPackages()
      ]);
      setServices(svcRes.data);
      setCategories(catRes.data);
      setPackages(pkgsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // Map service ID to the number of packages using it
  const packageCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    packages.forEach((pkg: any) => {
      if (pkg.chi_tiet_dich_vu && Array.isArray(pkg.chi_tiet_dich_vu)) {
        pkg.chi_tiet_dich_vu.forEach((item: any) => {
          const serviceId = item.dich_vu_id;
          if (serviceId) {
            map[serviceId] = (map[serviceId] || 0) + 1;
          }
        });
      }
    });
    return map;
  }, [packages]);

  // Map service ID to a list of package names using it
  const serviceUsageNamesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    packages.forEach((pkg: any) => {
      if (pkg.chi_tiet_dich_vu && Array.isArray(pkg.chi_tiet_dich_vu)) {
        pkg.chi_tiet_dich_vu.forEach((item: any) => {
          const serviceId = item.dich_vu_id;
          if (serviceId) {
            if (!map[serviceId]) map[serviceId] = [];
            map[serviceId].push(pkg.ten_goi);
          }
        });
      }
    });
    return map;
  }, [packages]);

  const onSubmit = async (data: any) => {
    try {
      if (editingService) {
        await updateService(editingService.id, data);
      } else {
        await createService(data);
      }
      setIsModalOpen(false);
      setEditingService(null);
      reset();
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      alert(editingService ? 'Có lỗi xảy ra khi cập nhật dịch vụ' : 'Có lỗi xảy ra khi tạo dịch vụ');
    }
  };

  const handleEdit = (svc: any) => {
    setEditingService(svc);
    reset({
      danh_muc_id: Number(svc.danh_muc_id),
      ten_dich_vu: svc.ten_dich_vu,
      mo_ta: svc.mo_ta_ngan || svc.mo_ta || '',
      thoi_gian_uoc_tinh: Number(svc.thoi_gian_uoc_tinh),
      don_gia: Number(svc.don_gia),
      thiet_bi_yeu_cau: svc.thiet_bi_yeu_cau || '',
      trang_thai: svc.trang_thai === 'hoat_dong' ? 'hoat_dong' : 'vo_hieu',
      loai_dich_vu: svc.loai_dich_vu === 'bo_sung' ? 'bo_sung' : 'chinh'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (svc: any) => {
    const confirmMsg = `Bạn có chắc chắn muốn xóa dịch vụ "${svc.ten_dich_vu}" không?\nHành động này không thể hoàn tác và có thể ảnh hưởng đến các gói đang sử dụng dịch vụ này.`;
    if (window.confirm(confirmMsg)) {
      try {
        await deleteService(svc.id);
        fetchData();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Không thể xóa dịch vụ này. Vui lòng kiểm tra lại liên kết gói hoặc liệu trình.');
      }
    }
  };

  const handleToggleStatus = async (svc: any) => {
    const nextStatus = svc.trang_thai === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong';
    try {
      await updateService(svc.id, {
        danh_muc_id: Number(svc.danh_muc_id),
        ten_dich_vu: svc.ten_dich_vu,
        mo_ta: svc.mo_ta_ngan || svc.mo_ta || '',
        thoi_gian_uoc_tinh: Number(svc.thoi_gian_uoc_tinh),
        don_gia: Number(svc.don_gia),
        thiet_bi_yeu_cau: svc.thiet_bi_yeu_cau || '',
        trang_thai: nextStatus,
        loai_dich_vu: svc.loai_dich_vu || 'chinh'
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Không thể cập nhật trạng thái dịch vụ');
    }
  };

  const filteredServices = useMemo(() => {
    let result = services;
    
    // Filter by Tab
    if (activeTab !== 'all') {
      result = result.filter(svc => svc.loai_dich_vu === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(svc => 
        svc.ten_dich_vu.toLowerCase().includes(q) ||
        (svc.ten_danh_muc && svc.ten_danh_muc.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [services, activeTab, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white min-h-screen bg-slate-950 font-mono text-xs">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-lg border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-xs font-mono tracking-widest text-teal-400 uppercase font-bold">Clinical Workspace</span>
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight uppercase">CẤU HÌNH DANH MỤC DỊCH VỤ</h2>
          <p className="text-slate-400 text-sm mt-1">Cấu hình thời lượng trị liệu, đơn giá và quản lý định danh dịch vụ linh động/bổ trợ</p>
        </div>
        <button 
          onClick={() => { 
            setEditingService(null);
            reset({ 
              trang_thai: 'hoat_dong', 
              thoi_gian_uoc_tinh: 45, 
              don_gia: 0,
              loai_dich_vu: 'chinh',
              ten_dich_vu: '',
              mo_ta: '',
              thiet_bi_yeu_cau: '',
              danh_muc_id: categories[0]?.id ? Number(categories[0].id) : undefined
            }); 
            setIsModalOpen(true); 
          }}
          className="bg-teal-600 hover:bg-teal-500 active:scale-95 text-white px-5 py-2.5 rounded-md font-mono text-xs font-bold tracking-wider transition-all shadow-md flex items-center gap-2 border border-teal-400/20"
        >
          [+] THÊM DỊCH VỤ
        </button>
      </div>

      {/* KPI HUD Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">TỔNG SỐ DỊCH VỤ</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">{services.length}</h3>
            <span className="text-xs text-slate-400 font-mono bg-slate-850 px-2 py-0.5 border border-slate-800 rounded">Mục</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">DỊCH VỤ LINH ĐỘNG</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-teal-400">
              {services.filter(s => s.loai_dich_vu !== 'bo_sung').length}
            </h3>
            <span className="text-xs text-teal-400 font-mono font-bold bg-teal-950/50 px-2 py-0.5 border border-teal-900 rounded">Linh động</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">DỊCH VỤ BỔ TRỢ</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-300">
              {services.filter(s => s.loai_dich_vu === 'bo_sung').length}
            </h3>
            <span className="text-xs text-slate-300 font-mono font-bold bg-slate-800 px-2 py-0.5 border border-slate-700 rounded">Bổ trợ</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">ĐANG TẠM NGƯNG</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-500">
              {services.filter(s => s.trang_thai !== 'hoat_dong').length}
            </h3>
            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-850 px-2 py-0.5 border border-slate-800 rounded">Vô hiệu</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Section */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-sm">
        
        {/* Workspace Controls / Tabs & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* HUD Tabs */}
          <div className="flex bg-slate-900 p-1 rounded border border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-xs font-mono font-bold tracking-wider rounded transition-all ${
                activeTab === 'all' 
                  ? 'bg-slate-850 text-teal-400 shadow-sm border border-slate-800' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              [ TẤT CẢ ]
            </button>
            <button
              onClick={() => setActiveTab('chinh')}
              className={`px-4 py-1.5 text-xs font-mono font-bold tracking-wider rounded transition-all ${
                activeTab === 'chinh' 
                  ? 'bg-teal-950/80 text-teal-400 shadow-sm border border-teal-900' 
                  : 'text-slate-400 hover:text-teal-400'
              }`}
            >
              [ DỊCH VỤ LINH ĐỘNG ]
            </button>
            <button
              onClick={() => setActiveTab('bo_sung')}
              className={`px-4 py-1.5 text-xs font-mono font-bold tracking-wider rounded transition-all ${
                activeTab === 'bo_sung' 
                  ? 'bg-slate-800 text-slate-200 shadow-sm border border-slate-750' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              [ DỊCH VỤ BỔ TRỢ ]
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm dịch vụ, danh mục..." 
              value={searchQuery}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              className="pl-9 pr-4 py-2 w-full border border-slate-800 rounded bg-slate-950 text-xs outline-none focus:border-slate-700 text-white placeholder-slate-700" 
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[10px] font-bold font-mono uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">Dịch vụ</th>
                <th className="p-4">Phân loại</th>
                <th className="p-4">Dùng trong gói</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4 text-right">Thời lượng</th>
                <th className="p-4 text-right">Đơn giá</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 font-mono text-xs">
                    <div className="animate-spin w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    ĐANG TRUY VẤN CƠ SỞ DỮ LIỆU...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 font-mono text-xs">
                    KHÔNG TÌM THẤY KẾT QUẢ PHÙ HỢP
                  </td>
                </tr>
              ) : (
                filteredServices.map((svc) => {
                  const shared = isSharedLibraryService(svc);
                  const pkgCount = packageCountMap[svc.id] || 0;
                  const usageNames = serviceUsageNamesMap[svc.id] || [];

                  return (
                    <tr key={svc.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={getServiceImage(svc.id)} alt={svc.ten_dich_vu} className="w-10 h-10 rounded border border-slate-800 object-cover shadow-sm shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-sm">{svc.ten_dich_vu}</p>
                              {shared && (
                                <span className="text-[9px] font-mono font-bold bg-teal-950 border border-teal-800 text-teal-400 px-1.5 py-0.2 rounded shrink-0">
                                  DÙNG CHUNG
                                </span>
                              )}
                            </div>
                            {svc.thiet_bi_yeu_cau && (
                              <span className="text-[9px] font-mono text-slate-400 mt-0.5 inline-block">
                                REQ: {svc.thiet_bi_yeu_cau.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {svc.loai_dich_vu === 'bo_sung' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 text-[10px] font-bold font-mono uppercase">
                            Bổ trợ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-teal-900 bg-teal-950/50 text-teal-400 text-[10px] font-bold font-mono uppercase">
                            Linh động
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {pkgCount > 0 ? (
                          <div className="relative group inline-block">
                            <span className="cursor-help inline-flex items-center px-2 py-0.5 rounded border border-slate-750 bg-slate-850 text-teal-300 text-[10px] font-bold font-mono uppercase">
                              {pkgCount} GÓI
                            </span>
                            
                            {/* Simple tooltip to show which packages use it */}
                            <div className="pointer-events-none absolute left-0 bottom-full mb-1 w-64 p-2 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 space-y-1">
                              <p className="font-bold text-teal-400 uppercase tracking-widest mb-1 border-b border-slate-800 pb-0.5">Xuất hiện trong các gói:</p>
                              {usageNames.map((name, index) => (
                                <p key={index} className="truncate">• {name}</p>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-850 bg-slate-900 text-slate-600 text-[10px] font-bold font-mono uppercase">
                            CHƯA DÙNG
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-xs font-bold uppercase">
                          {svc.ten_danh_muc || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-300 text-xs">
                        {svc.thoi_gian_uoc_tinh} PHÚT
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-teal-400 text-sm">
                        {currencyFormatter.format(svc.don_gia)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleToggleStatus(svc)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                              svc.trang_thai === 'hoat_dong' ? 'bg-teal-600' : 'bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                svc.trang_thai === 'hoat_dong' ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                            svc.trang_thai === 'hoat_dong' ? 'text-teal-400' : 'text-slate-600'
                          }`}>
                            {svc.trang_thai === 'hoat_dong' ? 'ACTIVE' : 'OFFLINE'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEdit(svc)}
                            className="w-7 h-7 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-800 hover:bg-teal-950/30 transition-all active:scale-90 bg-slate-900"
                            title="Chỉnh sửa dịch vụ"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(svc)}
                            className="w-7 h-7 rounded border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-950 hover:bg-rose-950/30 transition-all active:scale-90 bg-slate-900"
                            title="Xóa dịch vụ"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950 font-mono text-xs">
          <p className="text-slate-500 font-medium">
            Hiển thị <span className="font-bold text-slate-300">1 - {filteredServices.length}</span> trong tổng số <span className="font-bold text-slate-300">{filteredServices.length}</span> danh mục
          </p>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded border border-slate-800 hover:bg-slate-900 text-slate-500 active:scale-95 font-bold transition-all">PREV</button>
            <button className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 text-white font-bold transition-all shadow-sm">1</button>
            <button className="px-2 py-1 rounded border border-slate-800 hover:bg-slate-900 text-slate-500 active:scale-95 font-bold transition-all">NEXT</button>
          </div>
        </div>
      </div>

      {/* HUD Pro Max Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] text-white animate-in slide-in-from-bottom-8 duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800 bg-slate-950 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                <h3 className="text-md font-bold font-mono tracking-wider uppercase">
                  {editingService ? `[CHỈNH SỬA] DỊCH VỤ` : `[THÊM MỚI] DỊCH VỤ`}
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingService(null); }} 
                className="text-slate-400 hover:text-white font-mono text-xs border border-slate-800 hover:border-slate-650 px-2 py-1 rounded bg-slate-900 transition-all"
              >
                [ESC]
              </button>
            </div>
            
            {/* Form Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar font-mono text-xs">
                
                {/* Image & Type Selection Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">PHÂN LOẠI DỊCH VỤ</label>
                    <select
                      {...register('loai_dich_vu')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-bold text-teal-400"
                    >
                      <option value="chinh">DỊCH VỤ LINH ĐỘNG (FLEXIBLE)</option>
                      <option value="bo_sung">DỊCH VỤ BỔ TRỢ (ADD-ON)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">HÌNH ẢNH MẪU</label>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] text-slate-500">Tự động chọn theo định danh</span>
                    </div>
                  </div>
                </div>

                {/* Name of Service */}
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">TÊN DỊCH VỤ KỸ THUẬT *</label>
                  <input 
                    {...register('ten_dich_vu')} 
                    placeholder="Nhập tên dịch vụ y tế..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-bold text-white placeholder-slate-700"
                  />
                  {errors.ten_dich_vu && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_dich_vu.message}</span>
                  )}
                </div>

                {/* Category & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">DANH MỤC CHUYÊN KHOA</label>
                    <select 
                      {...register('danh_muc_id', { valueAsNumber: true })} 
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-white font-bold"
                    >
                      <option value="">-- CHỌN DANH MỤC --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900">{c.ten_danh_muc.toUpperCase()}</option>
                      ))}
                    </select>
                    {errors.danh_muc_id && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.danh_muc_id.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">ĐƠN GIÁ (VNĐ) *</label>
                    <input 
                      type="number"
                      {...register('don_gia', { valueAsNumber: true })} 
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-bold text-white font-mono text-right"
                    />
                    {errors.don_gia && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.don_gia.message}</span>
                    )}
                  </div>
                </div>

                {/* Duration & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">THỜI LƯỢNG ĐỊNH MỨC</label>
                    <select 
                      {...register('thoi_gian_uoc_tinh', { valueAsNumber: true })} 
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-white font-bold"
                    >
                      <option value={10}>10 PHÚT</option>
                      <option value={12}>12 PHÚT</option>
                      <option value={15}>15 PHÚT</option>
                      <option value={20}>20 PHÚT</option>
                      <option value={25}>25 PHÚT</option>
                      <option value={30}>30 PHÚT</option>
                      <option value={40}>40 PHÚT</option>
                      <option value={45}>45 PHÚT</option>
                      <option value={50}>50 PHÚT</option>
                      <option value={60}>60 PHÚT</option>
                      <option value={75}>75 PHÚT</option>
                      <option value={90}>90 PHÚT</option>
                      <option value={105}>105 PHÚT</option>
                      <option value={120}>120 PHÚT</option>
                    </select>
                    {errors.thoi_gian_uoc_tinh && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.thoi_gian_uoc_tinh.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">TRẠNG THÁI HOẠT ĐỘNG</label>
                    <div 
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between cursor-pointer"
                      onClick={() => setValue('trang_thai', watchStatus === 'hoat_dong' ? 'vo_hieu' : 'hoat_dong')}
                    >
                      <span className={`font-bold ${watchStatus === 'hoat_dong' ? 'text-teal-400' : 'text-slate-500'}`}>
                        {watchStatus === 'hoat_dong' ? 'ĐANG HOẠT ĐỘNG' : 'TẠM VÔ HIỆU'}
                      </span>
                      <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${watchStatus === 'hoat_dong' ? 'bg-teal-600' : 'bg-slate-800'}`}>
                        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition-transform ${watchStatus === 'hoat_dong' ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">MÔ TẢ CHI TIẾT DỊCH VỤ</label>
                  <textarea 
                    {...register('mo_ta')} 
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-white placeholder-slate-700 resize-none font-medium text-xs"
                    placeholder="Mô tả công dụng y khoa hoặc liệu pháp..."
                  ></textarea>
                </div>

                {/* Required Equipment */}
                <div>
                  <label className="block font-bold text-slate-400 mb-1.5 uppercase tracking-wider">THIẾT BỊ YÊU CẦU</label>
                  <input 
                    {...register('thiet_bi_yeu_cau')} 
                    placeholder="Ví dụ: Máy điện xung, Máy siêu âm..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-bold text-white placeholder-slate-700"
                  />
                </div>

              </div>
              
              {/* Pinned Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 shrink-0 flex gap-3 font-mono text-xs">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingService(null); }} 
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-650 hover:bg-slate-850 text-slate-400 font-bold rounded transition-colors active:scale-95 text-center"
                >
                  [ HỦY BỎ ]
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-teal-600 border border-teal-500 hover:bg-teal-500 text-white font-bold rounded transition-colors active:scale-95 shadow-md text-center"
                >
                  {editingService ? '[ CẬP NHẬT ]' : '[ TẠO MỚI ]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

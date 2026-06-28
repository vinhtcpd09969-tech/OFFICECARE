import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPackages, deletePackage, getCategories } from '../../../api/admin.api';
import PackageModal from '../components/PackageModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg: any) => {
      const matchesSearch = pkg.ten_goi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.ma_goi && pkg.ma_goi.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || String(pkg.danh_muc_id) === String(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [packages, searchQuery, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, catsRes] = await Promise.all([
        getPackages(),
        getCategories()
      ]);
      setPackages(pkgsRes.data || []);
      setCategories((catsRes.data || []).filter((c: any) => c.loai_danh_muc === 'goi' && c.an_hien !== false));
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (pkg: any) => {
    const confirmName = pkg.ten_goi;
    if (window.confirm(`Bạn có chắc chắn muốn ngưng sử dụng gói dịch vụ "${confirmName}" không?`)) {
      try {
        await deletePackage(pkg.id);
        fetchData();
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Không thể ngưng sử dụng gói dịch vụ này. Rất có thể gói này đang được liên kết trong lịch đặt hoặc hóa đơn của khách hàng.');
      }
    }
  };

  const activeCount = useMemo(() => {
    return packages.filter((p: any) => p.trang_thai === 'hoat_dong').length;
  }, [packages]);

  const totalCount = useMemo(() => {
    return packages.length;
  }, [packages]);

  return (
    <div className="space-y-6 pb-8 animate-fade-in text-zinc-800 font-sans text-sm">

      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-heading tracking-wider text-primary uppercase font-bold">Không gian làm việc</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight">CẤU HÌNH GÓI DỊCH VỤ</h2>
          <p className="text-zinc-550 text-xs mt-1">Quản lý định giá, phân loại và cấu trúc phác đồ điều trị của các gói dịch vụ</p>
        </div>
        <button
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 hover:shadow-soft-button active:scale-95 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
        >
          [+] TẠO GÓI DỊCH VỤ MỚI
        </button>
      </div>

      {/* KPI HUD Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">GÓI ĐANG HOẠT ĐỘNG</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-primary">{activeCount}</h3>
            <span className="text-[10px] text-primary font-bold bg-primary-container px-2 py-0.5 border border-primary/20 rounded-lg">Kích hoạt</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">TỔNG SỐ LƯỢNG THIẾT LẬP</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-secondary">{totalCount}</h3>
            <span className="text-[10px] text-zinc-555 font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-200 rounded-lg">Hệ thống</span>
          </div>
        </div>
      </div>

      {/* Table Header Toolbar */}
      <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between transition-all hover:shadow-md duration-300">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-secondary font-heading flex-shrink-0">Danh sách gói dịch vụ y khoa ({filteredPackages.length})</h3>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Bộ lọc Danh mục Chuyên khoa */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary font-bold shadow-sm transition-all cursor-pointer hover:border-zinc-300"
          >
            <option value="all">📂 TẤT CẢ CHUYÊN KHOA</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                🏷️ {cat.ten_danh_muc.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã gói, tên gói..."
              value={searchQuery}
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              className="pl-9 pr-4 py-2 w-full border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary placeholder-zinc-350 shadow-inner transition-all font-semibold animate-fade-in"
            />
          </div>
        </div>
      </div>

      {/* Float Card list wrapper */}
      <div className="space-y-5">
        {loading ? (
          <div className="px-6 py-16 text-center text-zinc-450 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <span className="font-heading text-xs font-bold uppercase tracking-wider">Đang tải danh sách gói dịch vụ...</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-400 bg-white border border-zinc-200 rounded-2xl shadow-sm animate-fade-in">
            <svg className="w-12 h-12 text-zinc-300 mx-auto mb-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-secondary">Không tìm thấy gói dịch vụ nào phù hợp</span>
            <p className="text-[10px] text-zinc-450 mt-1 font-semibold">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          </div>
        ) : (
          <>
            {/* Header Column Labels Bar */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3.5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl text-zinc-500 font-bold uppercase tracking-wider text-[10px] select-none mb-3 shadow-2xs backdrop-blur-md">
              <div className="col-span-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Thông tin gói y khoa</span>
              </div>
              <div className="col-span-2 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Số buổi & Thời lượng</span>
              </div>
              <div className="col-span-2 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Đơn giá trọn gói</span>
              </div>
              <div className="col-span-1 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Trạng thái</span>
              </div>
              <div className="col-span-2 text-right flex items-center justify-end gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                <span>Thao tác</span>
              </div>
            </div>

            {filteredPackages.map((pkg) => {
              const isInactive = pkg.trang_thai !== 'hoat_dong';

              return (
                <div 
                  key={pkg.id} 
                  className={`group relative bg-gradient-to-b from-white to-zinc-50/30 border border-zinc-200/90 rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-emerald-250 hover:shadow-[0_20px_50px_rgba(16,185,129,0.05)] hover:-translate-y-1.5 active:scale-[0.995] cursor-pointer ${
                    isInactive ? 'opacity-70' : ''
                  }`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('select') || target.closest('a') || window.getSelection()?.toString()) {
                      return;
                    }
                    navigate(`/admin/packages/${pkg.id}/services`);
                  }}
                >
                  {/* Left accent bar on hover */}
                  <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-2xl scale-y-50 group-hover:scale-y-100 opacity-0 group-hover:opacity-100 transition-all duration-300 origin-center shadow-sm bg-primary shadow-emerald-400/50"></div>

                  <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-6 lg:gap-4">
                    
                    {/* 1. THÔNG TIN GÓI */}
                    <div className="col-span-12 lg:col-span-5 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[9px] text-teal-850 font-black bg-gradient-to-r from-teal-500/5 to-emerald-500/5 border border-teal-150/60 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs">
                          <svg className="w-3.5 h-3.5 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2 2v12m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{pkg.ten_danh_muc || 'Không phân loại'}</span>
                        </span>

                        <span className="text-[9px] text-zinc-550 font-semibold bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 shadow-2xs">
                          Mã: {pkg.ma_goi}
                        </span>
                      </div>
                      
                      <h4 className="font-heading font-black text-[15px] text-secondary tracking-tight hover:text-primary transition-colors mt-1 duration-200 leading-snug">
                        {pkg.ten_goi}
                      </h4>
                      {pkg.mo_ta && (
                        <p className="text-[11px] text-zinc-450 mt-1 font-medium line-clamp-1">{pkg.mo_ta}</p>
                      )}
                    </div>

                    {/* 2. SỐ BUỔI & THỜI LƯỢNG */}
                    <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center gap-1">
                      <span className="text-sm font-black text-secondary">{pkg.tong_so_buoi} buổi</span>
                      <span className="text-[10px] text-zinc-400 font-bold bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-md">
                        ⏱️ {pkg.thoi_luong_buoi_phut || 60} phút/buổi
                      </span>
                    </div>

                    {/* 3. ĐƠN GIÁ TRỌN GÓI */}
                    <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center">
                      <span className="font-black text-primary text-sm select-all">
                        {currencyFormatter.format(pkg.gia_tien || pkg.gia_goi)}đ
                      </span>
                      {pkg.gia_goc && Number(pkg.gia_goc) > Number(pkg.gia_tien || pkg.gia_goi) && (
                        <span className="text-[10px] text-zinc-400 font-bold line-through">
                          {currencyFormatter.format(pkg.gia_goc)}đ
                        </span>
                      )}
                    </div>

                    {/* 4. TRẠNG THÁI */}
                    <div className="col-span-12 lg:col-span-1 shrink-0 flex lg:justify-center">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl border shadow-2xs ${
                        pkg.trang_thai === 'hoat_dong'
                          ? 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20 shadow-inner'
                          : 'bg-zinc-100 text-zinc-400 border-zinc-200 shadow-inner'
                      }`}>
                        <span className="relative flex h-2 w-2">
                          {pkg.trang_thai === 'hoat_dong' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${pkg.trang_thai === 'hoat_dong' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                        </span>
                        <span>{pkg.trang_thai === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}</span>
                      </span>
                    </div>

                    {/* 5. THAO TÁC QUẢN TRỊ */}
                    <div className="col-span-12 lg:col-span-2 shrink-0 flex items-center lg:justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingPackage(pkg);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-2 border border-zinc-200 hover:border-primary/30 hover:bg-primary-container text-zinc-650 hover:text-primary rounded-xl transition-all duration-200 active:scale-95 bg-white shadow-2xs font-bold text-[9.5px]"
                      >
                        SỬA ĐỔI
                      </button>

                      <button
                        onClick={() => handleDelete(pkg)}
                        className="p-2 border border-zinc-200 hover:border-amber-300 hover:bg-amber-50/50 text-zinc-400 hover:text-amber-500 rounded-xl transition-all duration-200 active:scale-95 bg-white shadow-2xs"
                        title="Ngưng sử dụng gói"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Render Component Modal */}
      {isModalOpen && (
        <PackageModal
          editingPackage={editingPackage}
          existingPackages={packages}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPackage(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingPackage(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

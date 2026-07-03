import { useState, useEffect, useMemo } from 'react';
import { 
  getPackages, 
  deletePackage, 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../../api/admin.api';
import PackageModal from '../components/PackageModal';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Category Manager Local Modal state variables
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatType, setNewCatType] = useState<'KHAM' | 'LE' | 'LIEU_TRINH'>('LIEU_TRINH');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatDesc, setEditingCatDesc] = useState('');
  const [editingCatType, setEditingCatType] = useState<'KHAM' | 'LE' | 'LIEU_TRINH'>('LIEU_TRINH');

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
    onConfirm: () => void;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'KHAM' | 'LE' | 'LIEU_TRINH'>('all');

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accent marks
      .replace(/đ/g, 'd')
      .trim();
  };

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg: any) => {
      const normName = normalizeString(pkg.ten_goi);
      const normQuery = normalizeString(searchQuery);
      const matchesSearch = normName.includes(normQuery);
      
      const matchesCategory = selectedCategory === 'all' || String(pkg.danh_muc_id) === String(selectedCategory);
      const matchesType = selectedTypeFilter === 'all' || pkg.loai_goi === selectedTypeFilter;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [packages, searchQuery, selectedCategory, selectedTypeFilter]);

  const visibleCategories = useMemo(() => {
    if (selectedTypeFilter === 'all') return categories;
    return categories.filter((cat: any) => cat.loai_goi_ap_dung === selectedTypeFilter);
  }, [categories, selectedTypeFilter]);

  // Reset selected category filter if it's not compatible with the active package type tab
  useEffect(() => {
    if (selectedCategory !== 'all' && selectedTypeFilter !== 'all') {
      const activeCat = categories.find(c => String(c.id) === String(selectedCategory));
      if (activeCat && activeCat.loai_goi_ap_dung !== selectedTypeFilter) {
        setSelectedCategory('all');
      }
    }
  }, [selectedTypeFilter, selectedCategory, categories]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, catsRes] = await Promise.all([
        getPackages(),
        getCategories()
      ]);
      setPackages(pkgsRes.data || []);
      // Map categories and filter out soft-hidden ones
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

  const handleDelete = (pkg: any) => {
    const confirmName = pkg.ten_goi;
    setConfirmConfig({
      isOpen: true,
      title: 'Ngưng sử dụng Gói dịch vụ',
      message: `Bạn có chắc chắn muốn ngưng sử dụng gói dịch vụ "${confirmName}" không?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await deletePackage(pkg.id);
          toast.success(`Đã ngừng kích hoạt gói dịch vụ "${confirmName}" thành công!`);
          fetchData();
        } catch (error) {
          console.error('Error deleting package:', error);
          toast.error('Không thể ngưng sử dụng gói dịch vụ này. Rất có thể gói này đang được liên kết trong lịch đặt hoặc hóa đơn.');
        }
      }
    });
  };

  // Category CRUD Handlers
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Vui lòng nhập tên danh mục!');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Tạo danh mục mới',
      message: `Bạn có chắc chắn muốn tạo mới danh mục "${newCatName.trim()}" không?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await createCategory({
            ten_danh_muc: newCatName.trim(),
            mo_ta: newCatDesc.trim(),
            loai_goi_ap_dung: newCatType
          });
          toast.success(`Tạo danh mục "${newCatName.trim()}" thành công!`);
          setNewCatName('');
          setNewCatDesc('');
          fetchData();
        } catch (error) {
          console.error('Error creating category:', error);
          toast.error('Có lỗi xảy ra khi tạo danh mục mới.');
        }
      }
    });
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) {
      toast.error('Tên danh mục không được để trống!');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Cập nhật danh mục',
      message: `Bạn có chắc chắn muốn lưu các thay đổi cho danh mục này không?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await updateCategory(id, {
            ten_danh_muc: editingCatName.trim(),
            mo_ta: editingCatDesc.trim(),
            loai_goi_ap_dung: editingCatType
          });
          toast.success('Cập nhật danh mục thành công!');
          setEditingCatId(null);
          fetchData();
        } catch (error) {
          console.error('Error updating category:', error);
          toast.error('Có lỗi xảy ra khi cập nhật danh mục.');
        }
      }
    });
  };

  const handleDeleteCategory = async (cat: any) => {
    const isUsed = packages.some((pkg: any) => String(pkg.danh_muc_id) === String(cat.id));
    if (isUsed) {
      toast.error(`Không thể xóa danh mục "${cat.ten_danh_muc}" vì hiện tại có gói dịch vụ đang sử dụng danh mục này!`);
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa danh mục',
      message: `Bạn có chắc chắn muốn xóa danh mục chuyên khoa "${cat.ten_danh_muc}" không?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await deleteCategory(cat.id);
          toast.success(`Xóa danh mục "${cat.ten_danh_muc}" thành công!`);
          fetchData();
        } catch (error) {
          console.error('Error deleting category:', error);
          toast.error('Có lỗi xảy ra khi xóa danh mục.');
        }
      }
    });
  };

  const activeCount = useMemo(() => {
    return packages.filter((p: any) => p.trang_thai === 'hoat_dong').length;
  }, [packages]);

  const totalCount = useMemo(() => {
    return packages.length;
  }, [packages]);

  const khamCount = useMemo(() => {
    return packages.filter((p: any) => p.loai_goi === 'KHAM').length;
  }, [packages]);

  const leCount = useMemo(() => {
    return packages.filter((p: any) => p.loai_goi === 'LE').length;
  }, [packages]);

  const lieuTrinhCount = useMemo(() => {
    return packages.filter((p: any) => p.loai_goi === 'LIEU_TRINH').length;
  }, [packages]);

  const avgSessions = useMemo(() => {
    const lieuTrinhPkgs = packages.filter((p: any) => p.loai_goi === 'LIEU_TRINH');
    return lieuTrinhPkgs.length 
      ? Math.round(lieuTrinhPkgs.reduce((acc: number, p: any) => acc + p.tong_so_buoi, 0) / lieuTrinhPkgs.length)
      : 0;
  }, [packages]);

  return (
    <div className="space-y-6 pb-8 text-zinc-800 font-sans text-sm min-h-[600px]">
      <AnimatePresence mode="wait">
        {!isModalOpen ? (
          <motion.div
            key="packages-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6"
          >
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
              
              <div className="flex items-center gap-3">
                {/* NÚT QUẢN LÝ DANH MỤC */}
                <button
                  onClick={() => setIsCategoryOpen(true)}
                  className="bg-white hover:bg-slate-50 border border-zinc-250 active:scale-95 text-slate-700 px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2"
                >
                  📂 QUẢN LÝ DANH MỤC
                </button>

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
            </div>

            {/* KPI HUD Panel - Premium 5-Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-white to-teal-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TỔNG THIẾT LẬP</p>
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 text-[10px] font-bold">Gói</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-secondary">{totalCount}</h3>
                  <span className="text-[9px] text-teal-705 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-150">Đang chạy: {activeCount}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-indigo-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-indigo-200/50 hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KHÁM & TƯ VẤN</p>
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-650 border border-indigo-100 text-[10px] font-bold">Kham</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-secondary">{khamCount}</h3>
                  <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">Dịch vụ</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-teal-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-teal-300/50 hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GÓI LẺ TRỊ LIỆU</p>
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold">Le</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-secondary">{leCount}</h3>
                  <span className="text-[9px] text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-150">Đơn buổi</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-emerald-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-emerald-300/50 hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LIỆU TRÌNH CHUYÊN SÂU</p>
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">Regimen</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-secondary">{lieuTrinhCount}</h3>
                  <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">Đa buổi</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-white to-amber-50/10 p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between transition-all hover:border-amber-300/50 hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SỐ BUỔI TRUNG BÌNH</p>
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">Session</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-secondary">{avgSessions}</h3>
                  <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-150">Buổi / Gói</span>
                </div>
              </div>
            </div>

            {/* Premium Horizontal Filter & Search Panel */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-4 transition-all hover:shadow-md duration-300">
              {/* Row 1: Header and Search controls */}
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="font-black text-sm tracking-tight text-secondary font-heading flex-shrink-0">
                    BỘ LỌC DỊCH VỤ Y KHOA ({filteredPackages.length})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lọc nhanh theo phân loại và tìm kiếm không dấu tiện lợi</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {/* Bộ lọc Danh mục Chuyên khoa */}
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2.5 border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary font-bold shadow-sm transition-all cursor-pointer hover:border-zinc-300"
                    >
                      <option value="all">📂 TẤT CẢ CHUYÊN KHOA</option>
                      {visibleCategories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.ten_danh_muc.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ô tìm kiếm */}
                  <div className="relative w-full sm:w-64">
                    <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Tìm kiếm tên gói (ví dụ: gia)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary font-bold placeholder-zinc-400 shadow-sm transition-all hover:border-zinc-300"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Premium Horizontal Tabs for Package Types */}
              <div className="flex border-t border-slate-100 pt-4 items-center gap-2 overflow-x-auto pb-1 shrink-0">
                <button
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'all'
                      ? 'bg-secondary border-secondary text-white shadow-sm'
                      : 'bg-slate-50 border-zinc-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  TẤT CẢ PHÂN LOẠI ({packages.length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('KHAM')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'KHAM'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 border-zinc-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  KHÁM LÂM SÀNG ({packages.filter(p => p.loai_goi === 'KHAM').length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('LE')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'LE'
                      ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                      : 'bg-slate-50 border-zinc-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  GÓI LẺ TRỊ LIỆU ({packages.filter(p => p.loai_goi === 'LE').length})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('LIEU_TRINH')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                    selectedTypeFilter === 'LIEU_TRINH'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 border-zinc-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  LIỆU TRÌNH CHUYÊN SÂU ({packages.filter(p => p.loai_goi === 'LIEU_TRINH').length})
                </button>
              </div>
            </div>

            {/* List container */}
            <div className="space-y-4">
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
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-zinc-50 via-slate-50 to-zinc-50 border border-zinc-200 rounded-xl text-secondary font-black uppercase tracking-widest text-[9.5px] select-none mb-3 shadow-xs">
                    <div className="col-span-5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Thông tin gói y khoa</span>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-teal-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Số buổi & Thời lượng</span>
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Đơn giá trọn gói</span>
                    </div>
                    <div className="col-span-1 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-indigo-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Trạng thái</span>
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end gap-2">
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>Thao tác</span>
                    </div>
                  </div>

                  {filteredPackages.map((pkg) => {
                    const isInactive = pkg.trang_thai !== 'hoat_dong';

                    // Get category name dynamically
                    const catObj = categories.find(c => String(c.id) === String(pkg.danh_muc_id));
                    const catName = catObj ? catObj.ten_danh_muc : 'Không phân loại';

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
                          setEditingPackage(pkg);
                          setIsModalOpen(true);
                        }}
                      >
                        {/* Left accent bar on hover */}
                        <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-2xl scale-y-50 group-hover:scale-y-100 opacity-0 group-hover:opacity-100 transition-all duration-300 origin-center shadow-sm bg-primary shadow-emerald-400/50"></div>

                        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-6 lg:gap-4">
                          
                          {/* 1. THÔNG TIN GÓI (Redesigned with thumbnail image) */}
                          <div className="col-span-12 lg:col-span-5 min-w-0 flex gap-4">
                            {/* Thumbnail Image */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-150 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center relative shadow-sm">
                              <img 
                                src={pkg.anh_goi || '/goi/images/kham_sang_loc.png'} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 ease-out" 
                                alt={pkg.ten_goi} 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/goi/images/kham_sang_loc.png';
                                }}
                              />
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[9px] text-teal-850 font-black bg-teal-50 border border-teal-150/60 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs">
                                  <svg className="w-3.5 h-3.5 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2 2v12m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span>{catName}</span>
                                </span>
                              </div>
                              
                              <h4 className="font-heading font-black text-[13.5px] sm:text-[14px] text-secondary tracking-tight hover:text-primary transition-colors mt-0.5 duration-200 leading-snug">
                                {pkg.ten_goi}
                              </h4>
                              {(pkg.quy_trinh || pkg.muc_tieu) && (
                                <p className="text-[11px] text-zinc-450 mt-1 font-medium line-clamp-1">{pkg.quy_trinh || pkg.muc_tieu}</p>
                              )}
                            </div>
                          </div>

                          {/* 2. SỐ BUỔI & THỜI LƯỢNG */}
                          <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center gap-1">
                            <span className="text-sm font-black text-secondary">{pkg.tong_so_buoi} buổi</span>
                            <span className="text-[10px] text-zinc-400 font-bold bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-md">
                              ⏱️ {pkg.thoi_luong_buoi_phut || pkg.thoi_luong_phut || 60} phút/buổi
                            </span>
                          </div>

                          {/* 3. ĐƠN GIÁ TRỌN GÓI */}
                          <div className="col-span-12 lg:col-span-2 shrink-0 flex flex-col items-start lg:items-center">
                            <span className="font-black text-primary text-sm select-all">
                              {currencyFormatter.format(pkg.gia_tien || pkg.gia_goi || pkg.don_gia)}đ
                            </span>
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
          </motion.div>
        ) : (
          <motion.div
            key="packages-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL QUẢN LÝ DANH MỤC GÓI (LOCAL OVERLAY) ─── */}
      {isCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-zinc-150 rounded-3xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col text-xs text-secondary">
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="font-heading font-black text-sm uppercase text-slate-800">QUẢN LÝ DANH MỤC GÓI Y KHOA</h3>
              </div>
              <button 
                onClick={() => {
                  setIsCategoryOpen(false);
                  setEditingCatId(null);
                }}
                className="text-zinc-500 hover:text-slate-700 font-bold border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-xl bg-white shadow-sm transition-all"
              >
                [ ĐÓNG ]
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* FORM THÊM MỚI DANH MỤC */}
              <div className="p-4 border border-zinc-150 rounded-2xl bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-[10px] text-teal-700 uppercase tracking-wider">Tạo mới Danh mục Chuyên khoa</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Tên danh mục..." 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:border-teal-600 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Mô tả ngắn..." 
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:border-teal-600 text-xs"
                    />
                  </div>
                  <div>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:border-teal-600 font-semibold text-xs cursor-pointer"
                    >
                      <option value="KHAM">Áp dụng: Khám</option>
                      <option value="LE">Áp dụng: Lẻ</option>
                      <option value="LIEU_TRINH">Áp dụng: Liệu trình</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateCategory}
                    className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 text-center text-xs"
                  >
                    THÊM MỚI
                  </button>
                </div>
              </div>

              {/* DANH SÁCH DANH MỤC HIỆN TẠI */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Danh sách hiện tại ({categories.length})</h4>
                
                <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="py-3.5 flex items-center justify-between gap-4">
                      {editingCatId === cat.id ? (
                        /* Edit Mode Row */
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <input 
                            type="text" 
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="px-2 py-1 bg-white border border-teal-600 rounded-lg outline-none font-bold text-xs"
                          />
                          <input 
                            type="text" 
                            value={editingCatDesc}
                            onChange={(e) => setEditingCatDesc(e.target.value)}
                            className="px-2 py-1 bg-white border border-teal-600 rounded-lg outline-none text-xs"
                          />
                          <select
                            value={editingCatType}
                            onChange={(e) => setEditingCatType(e.target.value as any)}
                            className="px-2 py-1 bg-white border border-teal-600 rounded-lg outline-none text-xs cursor-pointer"
                          >
                            <option value="KHAM">Khám</option>
                            <option value="LE">Lẻ</option>
                            <option value="LIEU_TRINH">Liệu trình</option>
                          </select>
                        </div>
                      ) : (
                        /* Read Mode Row */
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-xs uppercase">{cat.ten_danh_muc}</p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                              cat.loai_goi_ap_dung === 'KHAM'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                : cat.loai_goi_ap_dung === 'LE'
                                  ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                            }`}>
                              {cat.loai_goi_ap_dung === 'KHAM' ? 'KHÁM' : cat.loai_goi_ap_dung === 'LE' ? 'LẺ' : 'LIỆU TRÌNH'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-0.5">{cat.mo_ta || 'Không có mô tả.'}</p>
                        </div>
                      )}

                      {/* CRUD Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {editingCatId === cat.id ? (
                          <>
                            <button 
                              onClick={() => handleUpdateCategory(cat.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition-all hover:bg-emerald-700"
                            >
                              LƯU
                            </button>
                            <button 
                              onClick={() => setEditingCatId(null)}
                              className="px-2.5 py-1.5 bg-zinc-100 text-slate-500 font-bold rounded-lg text-[10px] transition-all hover:bg-zinc-200"
                            >
                              HỦY
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.ten_danh_muc);
                                setEditingCatDesc(cat.mo_ta || '');
                                setEditingCatType(cat.loai_goi_ap_dung || 'LIEU_TRINH');
                              }}
                              className="px-2.5 py-1.5 border border-zinc-200 hover:border-teal-350 hover:bg-teal-50 text-slate-650 hover:text-teal-700 font-bold rounded-lg text-[10px] transition-all"
                            >
                              SỬA
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat)}
                              className="px-2.5 py-1.5 border border-zinc-200 hover:border-rose-350 hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold rounded-lg text-[10px] transition-all"
                            >
                              XÓA
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

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

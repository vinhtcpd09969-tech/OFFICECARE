import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPackages, getServices, deletePackage } from '../../../api/admin.api';
import PackageModal from '../components/PackageModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg: any) => 
      pkg.ten_goi.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (pkg.ma_goi && pkg.ma_goi.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [packages, searchQuery]);

  const selectedPackage = useMemo(() => {
    return packages.find(p => String(p.id) === selectedPackageId) || filteredPackages[0] || null;
  }, [packages, selectedPackageId, filteredPackages]);

  useEffect(() => {
    if (filteredPackages.length === 0) {
      setSelectedPackageId(null);
      return;
    }

    if (!selectedPackageId || !filteredPackages.some(pkg => String(pkg.id) === selectedPackageId)) {
      setSelectedPackageId(String(filteredPackages[0].id));
    }
  }, [filteredPackages, selectedPackageId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, svcsRes] = await Promise.all([
        getPackages(),
        getServices()
      ]);
      setPackages(pkgsRes.data);
      setServices(svcsRes.data.filter((s: any) => s.trang_thai === 'hoat_dong'));
      
      // Auto select first package if none selected
      if (pkgsRes.data.length > 0 && !selectedPackageId) {
        setSelectedPackageId(String(pkgsRes.data[0].id));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (pkg: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa liệu trình điều trị "${pkg.ten_goi}" không?\nHành động này không thể hoàn tác.`)) {
      try {
        await deletePackage(pkg.id);
        if (selectedPackageId === String(pkg.id)) {
          setSelectedPackageId(null);
        }
        fetchData();
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Không thể xóa liệu trình điều trị này. Rất có thể liệu trình này đang được liên kết trong lịch đặt hoặc hóa đơn của khách hàng.');
      }
    }
  };

  const handleDuplicate = (pkg: any) => {
    const duplicatedPkg = {
      ...pkg,
      ten_goi: `${pkg.ten_goi} (Copy)`,
      ma_goi: '', // Let backend auto-generate a new code
    };
    setEditingPackage(duplicatedPkg);
    setIsModalOpen(true);
  };

  // Calculate package pricing stats
  const getPackageStats = (pkg: any) => {
    if (!pkg || !pkg.chi_tiet_dich_vu || !Array.isArray(pkg.chi_tiet_dich_vu)) {
      return { totalRetailPrice: 0, savings: 0, savingsPercent: 0 };
    }

    let totalRetailPrice = 0;
    pkg.chi_tiet_dich_vu.forEach((item: any) => {
      const svc = services.find(s => s.id === item.dich_vu_id);
      if (svc) {
        const price = typeof svc.don_gia === 'string' ? parseInt(svc.don_gia) : (svc.don_gia || 0);
        const qty = item.so_lan_toi_da_trong_goi || item.so_buoi || item.so_buoi_trong_goi || 0;
        totalRetailPrice += price * qty;
      }
    });

    const pkgPrice = typeof pkg.gia_tien === 'string' ? parseInt(pkg.gia_tien) : (pkg.gia_tien || 0);
    const savings = totalRetailPrice - pkgPrice;
    const savingsPercent = totalRetailPrice > 0 ? Math.round((savings / totalRetailPrice) * 100) : 0;

    return { totalRetailPrice, savings, savingsPercent };
  };

  const selectedStats = useMemo(() => {
    return selectedPackage ? getPackageStats(selectedPackage) : null;
  }, [selectedPackage, services]);

  // Overall Statistics for KPI panels
  const overallStats = useMemo(() => {
    const activeCount = packages.filter(p => p.trang_thai === 'hoat_dong').length;
    const totalCount = packages.length;
    const avgPrice = totalCount > 0 
      ? packages.reduce((acc, p) => acc + (typeof p.gia_tien === 'string' ? parseInt(p.gia_tien) : (p.gia_tien || 0)), 0) / totalCount 
      : 0;
    const shortExpiryCount = packages.filter(p => p.han_dung_thang <= 3).length;

    return { activeCount, totalCount, avgPrice, shortExpiryCount };
  }, [packages]);

  return (
    <div className="space-y-6 pb-10 animate-fade-in text-white min-h-screen bg-slate-950 font-mono text-xs">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-lg border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-xs font-mono tracking-widest text-teal-400 uppercase font-bold">Clinical Workspace</span>
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight uppercase">CẤU HÌNH LIỆU TRÌNH ĐIỀU TRỊ</h2>
          <p className="text-slate-400 text-sm mt-1">Hệ thống phân tích cấu trúc, định giá và tối ưu hóa liệu trình hồi phục chuyên khoa</p>
        </div>
        <button 
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="bg-teal-600 hover:bg-teal-500 active:scale-95 text-white px-5 py-2.5 rounded-md font-mono text-xs font-bold tracking-wider transition-all shadow-md flex items-center gap-2 border border-teal-400/20"
        >
          [+] TẠO LIỆU TRÌNH MỚI
        </button>
      </div>

      {/* KPI HUD Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">GIÁ TRỊ TRUNG BÌNH THẺ</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              {currencyFormatter.format(Math.round(overallStats.avgPrice))}đ
            </h3>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">LIỆU TRÌNH ĐANG KÍCH HOẠT</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-teal-400">{overallStats.activeCount}</h3>
            <span className="text-xs text-teal-400 font-mono font-bold bg-teal-950/50 px-2 py-0.5 border border-teal-900 rounded">Active</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">TỔNG SỐ LƯỢNG THIẾT LẬP</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">{overallStats.totalCount}</h3>
            <span className="text-xs text-slate-400 font-mono bg-slate-850 px-2 py-0.5 border border-slate-800 rounded">Gói</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">LIỆU TRÌNH CÓ HẠN NGẮN (≤3T)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-amber-500">{overallStats.shortExpiryCount}</h3>
            <span className="text-xs text-amber-500 font-mono font-bold bg-amber-950/50 px-2 py-0.5 border border-amber-900 rounded">Hạn ngắn</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Split-Pane HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Pane: Packages Directory (Width: 5/12) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm min-h-[500px]">
          
          {/* Search Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono flex-shrink-0">Danh mục Liệu trình điều trị</h3>
            <div className="relative w-full sm:w-60">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Mã liệu trình, tên liệu trình..." 
                value={searchQuery}
                onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
                className="pl-9 pr-4 py-1.5 w-full border border-slate-800 rounded bg-slate-950 text-xs outline-none focus:border-slate-700 text-white placeholder-slate-700" 
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-850 pr-0.5 custom-scrollbar bg-slate-900/50">
            {loading ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">CƠ SỞ DỮ LIỆU ĐANG TẢI...</div>
            ) : filteredPackages.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs">KHÔNG TÌM THẤY KẾT QUẢ PHÙ HỢP</div>
            ) : (
              filteredPackages.map((pkg) => {
                const isActive = selectedPackage && selectedPackage.id === pkg.id;
                const isInactive = pkg.trang_thai !== 'hoat_dong';
                
                return (
                  <div 
                    key={pkg.id} 
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-4 transition-all duration-150 cursor-pointer flex justify-between items-start gap-4 border-l-4 ${
                      isActive 
                        ? 'border-l-teal-500 bg-teal-950/20 border-r border-r-teal-500/10 border-y border-y-slate-800' 
                        : 'border-l-transparent hover:bg-slate-850/50'
                    } ${isInactive ? 'opacity-50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[9px] font-bold text-slate-500 uppercase block mb-1">
                        {pkg.ma_goi}
                      </span>
                      <h4 className="font-bold text-sm text-white leading-snug truncate">
                        {pkg.ten_goi}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-medium font-mono">
                        {pkg.tong_so_buoi} BUỔI • {pkg.chi_tiet_dich_vu ? pkg.chi_tiet_dich_vu.length : 0} DỊCH VỤ • TỐI ĐA {pkg.so_dv_toi_da_moi_buoi || 5} DV/BUỔI
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold font-mono text-teal-400 block">
                        {currencyFormatter.format(pkg.gia_tien)}đ
                      </span>
                      <span className={`inline-block mt-2 text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                        pkg.trang_thai === 'hoat_dong' 
                          ? 'bg-teal-950/40 text-teal-400 border-teal-900' 
                          : 'bg-slate-950/40 text-slate-500 border-slate-800'
                      }`}>
                        {pkg.trang_thai === 'hoat_dong' ? 'ACTIVE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Interactive Detail Console (Width: 7/12) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm min-h-[500px]">
          {selectedPackage ? (
            <div className="flex-1 flex flex-col bg-slate-900/20">
              
              {/* Detail Header & Actions */}
              <div className="p-5 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-teal-400 uppercase bg-slate-850 border border-slate-800 px-2 py-0.5 rounded">
                      {selectedPackage.ma_goi}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      selectedPackage.trang_thai === 'hoat_dong' 
                        ? 'bg-teal-950/50 text-teal-400 border-teal-800' 
                        : 'bg-slate-950/50 text-slate-500 border-slate-800'
                    }`}>
                      {selectedPackage.trang_thai === 'hoat_dong' ? 'ĐANG HOẠT ĐỘNG' : 'TẠM VÔ HIỆU'}
                    </span>
                  </div>
                  <h3 className="text-md font-bold text-white truncate uppercase font-mono tracking-wider">
                    {selectedPackage.ten_goi}
                  </h3>
                </div>

                {/* Operations Toolbar */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 text-[11px] font-bold font-mono">
                  <button 
                    onClick={() => handleDuplicate(selectedPackage)}
                    title="Nhân bản cấu hình"
                    className="px-3 py-1.5 border border-slate-800 hover:border-slate-600 hover:bg-slate-850 text-slate-300 rounded transition-colors active:scale-95 bg-slate-950 shadow-sm flex items-center gap-1.5"
                  >
                    <span>[ NHÂN BẢN ]</span>
                  </button>
                  <button 
                    onClick={() => {
                      setEditingPackage(selectedPackage);
                      setIsModalOpen(true);
                    }}
                    title="Chỉnh sửa thông tin"
                    className="px-3 py-1.5 border border-slate-800 hover:border-teal-800 hover:bg-teal-950/40 text-slate-300 hover:text-teal-400 rounded transition-colors active:scale-95 bg-slate-950 shadow-sm flex items-center gap-1.5"
                  >
                    <span>[ SỬA ĐỔI ]</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedPackage)}
                    title="Xóa liệu trình điều trị"
                    className="p-1.5 border border-slate-800 hover:border-rose-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded transition-colors active:scale-95 bg-slate-950 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Console Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[520px] custom-scrollbar">
                
                {/* Stats Matrix Grid */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">[I] THÔNG SỐ VẬN HÀNH LÂM SÀNG</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-slate-950/60 p-4 border border-slate-800 rounded">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Thời hạn dùng</p>
                      <p className="text-sm font-bold text-white mt-0.5">{selectedPackage.han_dung_thang} tháng</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Tổng số buổi</p>
                      <p className="text-sm font-bold text-white mt-0.5">{selectedPackage.tong_so_buoi} buổi</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Hạn mức buổi</p>
                      <p className="text-sm font-bold text-teal-400 mt-0.5">Tối đa {selectedPackage.so_dv_toi_da_moi_buoi || 5} DV</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Website</p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {selectedPackage.hien_thi_website ? 'HIỂN THỊ' : 'ẨN BỎ'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-mono">Danh mục</p>
                      <p className="text-sm font-bold text-slate-300 mt-0.5 truncate" title={selectedPackage.ten_danh_muc || 'Mặc định'}>
                        {selectedPackage.ten_danh_muc || 'Không phân loại'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedPackage.mo_ta && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">[II] ĐỊNH HƯỚNG LIỆU TRÌNH</h4>
                    <p className="text-xs text-slate-300 bg-slate-950/40 p-4 border border-slate-850 rounded italic leading-relaxed">
                      "{selectedPackage.mo_ta}"
                    </p>
                  </div>
                )}

                {/* Technical Service breakdown */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">[III] CƠ CẤU DỊCH VỤ KỸ THUẬT CHI TIẾT</h4>
                  <div className="bg-slate-950/40 border border-slate-800 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                          <th className="p-3 font-bold">Tên dịch vụ kỹ thuật</th>
                          <th className="p-3 font-bold text-center">Bắt buộc</th>
                          <th className="p-3 font-bold text-center">Hạn mức/Gói</th>
                          <th className="p-3 font-bold text-center">Thứ tự</th>
                          <th className="p-3 font-bold text-right">Đơn giá lẻ</th>
                          <th className="p-3 font-bold text-right">Thành tiền lẻ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {selectedPackage.chi_tiet_dich_vu && selectedPackage.chi_tiet_dich_vu.length > 0 ? (
                          selectedPackage.chi_tiet_dich_vu.map((item: any, idx: number) => {
                            const svc = services.find(s => s.id === item.dich_vu_id);
                            const unitPrice = svc ? (typeof svc.don_gia === 'string' ? parseInt(svc.don_gia) : (svc.don_gia || 0)) : 0;
                            const qty = item.so_lan_toi_da_trong_goi || item.so_buoi || item.so_buoi_trong_goi || selectedPackage.tong_so_buoi || 10;
                            const subtotal = unitPrice * qty;

                            return (
                              <tr key={idx} className="hover:bg-slate-900/30">
                                <td className="p-3">
                                  <p className="font-bold text-white">{svc ? svc.ten_dich_vu : 'Dịch vụ đã dừng hoạt động'}</p>
                                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">{svc ? svc.ten_danh_muc : 'Không xác định'}</p>
                                </td>
                                <td className="p-3 text-center">
                                  {item.bat_buoc !== false ? (
                                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-teal-950 border border-teal-900 text-teal-400 rounded font-mono">YES</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-800 text-slate-500 rounded font-mono">NO</span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-slate-300 font-mono">{qty} LẦN</td>
                                <td className="p-3 text-center font-bold text-slate-400 font-mono bg-slate-950/20">{item.thu_tu_thuc_hien || 0}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{currencyFormatter.format(unitPrice)}đ</td>
                                <td className="p-3 text-right font-bold font-mono text-teal-400">{currencyFormatter.format(subtotal)}đ</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500 font-mono">KHÔNG CÓ DỊCH VỤ ĐƯỢC CHỈ ĐỊNH TRONG LIỆU TRÌNH</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Diagnostics report */}
                {selectedStats && selectedStats.totalRetailPrice > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">[IV] PHÂN TÍCH CHÊNH LỆCH ĐỊNH GIÁ</h4>
                    <div className="bg-teal-950/40 text-teal-300 p-4 border border-teal-900/60 rounded font-mono text-xs space-y-2 relative overflow-hidden">
                      <div className="absolute right-3 top-3 bg-teal-900/60 border border-teal-700 text-teal-400 font-bold px-2 py-1 rounded text-lg">
                        -{selectedStats.savingsPercent}%
                      </div>
                      <div className="flex justify-between items-center pr-20">
                        <span>TỔNG GIÁ RETAIL KHÁCH DÙNG LẺ:</span>
                        <span className="font-bold text-slate-300">{currencyFormatter.format(selectedStats.totalRetailPrice)}đ</span>
                      </div>
                      <div className="flex justify-between items-center text-teal-200">
                        <span>GIÁ ĐÓNG BÁN THẺ TRỌN GÓI:</span>
                        <span className="font-bold text-sm text-white">{currencyFormatter.format(selectedPackage.gia_tien)}đ</span>
                      </div>
                      <div className="border-t border-teal-900 my-2 pt-2 flex justify-between items-center text-emerald-400">
                        <span>TIẾT KIỆM TỐI ĐA CHO KHÁCH HÀNG:</span>
                        <span className="font-bold text-sm text-emerald-300">{currencyFormatter.format(selectedStats.savings)}đ</span>
                      </div>
                      <div className="text-[9px] text-teal-500/80 pt-1">
                        * Tỷ lệ chiết khấu được tính toán dựa trên tổng hạn mức số lần sử dụng tối đa của từng dịch vụ nhân với đơn giá lẻ lâm sàng.
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/40 text-slate-500 font-mono text-xs">
              <svg className="w-12 h-12 text-slate-750 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>VUI LÒNG CHỌN LIỆU TRÌNH TRÊN THƯ MỤC ĐỂ HIỂN THỊ PHÂN TÍCH</span>
            </div>
          )}
        </div>

      </div>

      {/* Render Component Modal */}
      {isModalOpen && (
        <PackageModal 
          services={services} 
          editingPackage={editingPackage}
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

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  getRooms, 
  createRoom 
} from '../../../api/admin.api';

// --- Types ---
interface Room {
  id: string | number;
  ten_phong: string;
  ma_phong: string;
  loai_phong: string;
  trang_thai: string;
  mo_ta?: string;
  suc_chua?: number;
}

const renderRoomIconSVG = (type: string) => {
  if (type === 'phong_tri_lieu' || type === 'phong_tri_lieu_chuan' || type === 'tri_lieu' || type === 'phong_dac_biet') {
    return (
      <svg className="w-10 h-10 text-teal-800/20 group-hover:text-teal-800/40 group-hover:scale-110 transition-all duration-500" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="32" cy="32" r="28" strokeDasharray="4 4" />
        <circle cx="32" cy="32" r="16" />
        <path d="M12 32h40M32 12v40" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="32" cy="32" r="4" fill="currentColor" className="animate-pulse" />
      </svg>
    );
  }
  if (type === 'phong_kham' || type === 'kham_benh') {
    return (
      <svg className="w-10 h-10 text-emerald-700/20 group-hover:text-emerald-600/40 group-hover:scale-110 transition-all duration-500" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="12" width="52" height="40" rx="2" />
        <path d="M6 32h16l4-12 5 24 4-15 3 6h20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'phong_tap' || type === 'phong_tap_phcn' || type === 'phuc_hoi') {
    return (
      <svg className="w-10 h-10 text-teal-700/20 group-hover:text-teal-600/40 group-hover:scale-110 transition-all duration-500" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 52c10-5 18-28 28-28s12 18 20 12" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 52h48M8 12v40" strokeWidth="1" />
        <circle cx="36" cy="24" r="3" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="w-10 h-10 text-slate-400/20 group-hover:text-slate-500/40 group-hover:scale-110 transition-all duration-500" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="32" cy="32" r="24" />
      <path d="M32 12v40M12 32h40" />
    </svg>
  );
};

const ALL_ROOM_TYPES = [
  { value: 'phong_tri_lieu', label: 'Phòng trị liệu' },
  { value: 'phong_kham', label: 'Phòng khám' },
  { value: 'phong_tap', label: 'Phòng tập' }
];

export default function ManageRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [statFilter, setStatFilter] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  
  // Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [roomFormData, setRoomFormData] = useState<{
    ten_phong: string;
    ma_phong: string;
    loai_phong: string;
    trang_thai: string;
    mo_ta: string;
    suc_chua: number | '';
  }>({
    ten_phong: '',
    ma_phong: '',
    loai_phong: 'phong_tri_lieu',
    trang_thai: 'san_sang',
    mo_ta: '',
    suc_chua: 1
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch all rooms & equipment
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getRooms();
      setRooms(res.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu hạ tầng:', error);
      showToast('Không thể kết nối API. Đang dùng dữ liệu mô phỏng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalPhysicalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.trang_thai === 'san_sang' || r.trang_thai === 'trong').length;
    const occupiedRooms = rooms.filter(r => r.trang_thai === 'dang_dung' || r.trang_thai === 'dang_co_khach').length;
    const maintenanceRooms = rooms.filter(r => r.trang_thai === 'bao_tri').length;

    return {
      totalPhysicalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms
    };
  }, [rooms]);

  // Filtering Logic
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      
      // 2. Type Filter
      if (selectedType !== 'all' && room.loai_phong !== selectedType) return false;

      // 3. Search Filter
      const query = searchQuery.toLowerCase();
      const matchSearch = room.ten_phong.toLowerCase().includes(query) || 
                          room.ma_phong.toLowerCase().includes(query) ||
                          (room.mo_ta && room.mo_ta.toLowerCase().includes(query));
      if (!matchSearch) return false;

      // 4. Quick Stat Filter
      if (statFilter) {
        if (statFilter === 'available' && !(room.trang_thai === 'san_sang' || room.trang_thai === 'trong')) return false;
        if (statFilter === 'occupied' && !(room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach')) return false;
        if (statFilter === 'maintenance' && room.trang_thai !== 'bao_tri') return false;
        if (statFilter === 'inactive' && room.trang_thai !== 'ngung_hoat_dong') return false;
      }

      // 5. Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'san_sang' && !(room.trang_thai === 'san_sang' || room.trang_thai === 'trong')) return false;
        if (selectedStatus === 'dang_dung' && !(room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach')) return false;
        if (selectedStatus === 'bao_tri' && room.trang_thai !== 'bao_tri') return false;
      }

      return true;
    }).sort((a, b) => a.ma_phong.localeCompare(b.ma_phong));
  }, [rooms, selectedType, selectedStatus, searchQuery, statFilter]);

  // Handle Room CRUD
  const handleOpenRoomModal = () => {
    setRoomFormData({
      ten_phong: '',
      ma_phong: '',
      loai_phong: 'phong_tri_lieu',
      trang_thai: 'san_sang',
      mo_ta: '',
      suc_chua: 1
    });
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...roomFormData,
        suc_chua: Number(roomFormData.suc_chua) || 1
      };
      await createRoom(payload);
      showToast('Tạo phòng mới thành công!');
      setIsRoomModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi lưu thông tin phòng.', 'error');
    }
  };





  const translateType = (type: string) => {
    if (type === 'phong_kham' || type === 'kham_benh') return 'Phòng khám';
    if (type === 'phong_tri_lieu' || type === 'phong_tri_lieu_chuan' || type === 'tri_lieu' || type === 'phong_dac_biet') return 'Phòng trị liệu';
    if (type === 'phong_tap' || type === 'phong_tap_phcn' || type === 'phuc_hoi') return 'Phòng tập';
    if (type === 'kho_thiet_bi') return 'Phòng thiết bị chung';
    return type;
  };

  return (
    <div className="space-y-6 pb-12 relative animate-[fadeIn_0.4s_ease-out] font-sans text-slate-800">
      
      {/* HUD-Style Custom Toast System */}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`border px-5 py-3.5 rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4 w-96 backdrop-blur-md transition-all duration-300 translate-x-0 border-l-[3px] ${
              t.type === 'success' 
                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 border-l-emerald-500' 
                : t.type === 'error' 
                  ? 'bg-rose-50/90 border-rose-500 text-rose-950 border-l-rose-500' 
                  : 'bg-teal-50/90 border-teal-500 text-teal-950 border-l-teal-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest uppercase">
                {t.type === 'success' ? 'SUCCESS' : t.type === 'error' ? 'ERROR' : 'INFO'}
              </span>
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-600 transition-colors">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-teal-950 tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            QUẢN LÝ PHÒNG TRỊ LIỆU
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium tracking-wide uppercase">Danh sách cabin điều trị y khoa & cơ sở vật chất vật lý trị liệu</p>
        </div>
        
        <div>
          <button 
            onClick={() => handleOpenRoomModal()}
            className="bg-teal-800 hover:bg-teal-900 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-95 shadow-sm"
          >
            + THÊM PHÒNG MỚI
          </button>
        </div>
      </div>

      {/* QUICK STATS HEADER PANEL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatFilter(null)}
          className={`border p-5 cursor-pointer transition-all duration-300 rounded-none hover:shadow-md ${!statFilter ? 'bg-teal-950/5 border-teal-800 shadow-[0_0_12px_rgba(15,118,110,0.06)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tổng Số Phòng</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalPhysicalRooms}</span>
            <span className="text-xs text-slate-400">phòng khám & điều trị</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('available')}
          className={`border p-5 cursor-pointer transition-all duration-300 rounded-none hover:shadow-md ${statFilter === 'available' ? 'bg-emerald-50/50 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.06)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Phòng Đang Trống</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">{stats.availableRooms}</span>
            <span className="text-xs text-slate-400">sẵn sàng tiếp nhận khách</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('occupied')}
          className={`border p-5 cursor-pointer transition-all duration-300 rounded-none hover:shadow-md ${statFilter === 'occupied' ? 'bg-cyan-50/50 border-cyan-600 shadow-[0_0_12px_rgba(8,145,178,0.06)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Đang Có Khách</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-700 tracking-tight">{stats.occupiedRooms}</span>
            <span className="text-xs text-slate-400">ktv đang điều trị</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('maintenance')}
          className={`border p-5 cursor-pointer transition-all duration-300 rounded-none hover:shadow-md ${statFilter === 'maintenance' ? 'bg-amber-50/50 border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.06)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Đang Bảo Trì</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 tracking-tight">{stats.maintenanceRooms}</span>
            <span className="text-xs text-slate-400">dọn dẹp hoặc sửa hạ tầng</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-none grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search */}
        <div className="relative md:col-span-3">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Tìm kiếm mã phòng, tên phòng, ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white text-sm font-semibold rounded-none focus:outline-none focus:border-teal-800 placeholder-slate-400"
          />
        </div>

          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-2 px-3 border border-slate-200 bg-white text-sm font-bold rounded-none focus:outline-none focus:border-teal-800"
          >
            <option value="all">TẤT CẢ CÁC LOẠI PHÒNG</option>
            <option value="phong_tri_lieu">PHÒNG TRỊ LIỆU</option>
            <option value="phong_kham">PHÒNG KHÁM</option>
            <option value="phong_tap">PHÒNG TẬP</option>
          </select>
      </div>

      {/* Active filters display */}
      {(statFilter || selectedType !== 'all' || selectedStatus !== 'all' || searchQuery) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang lọc theo:</span>
          {searchQuery && (
            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5">
              Từ khóa: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </span>
          )}

          {selectedType !== 'all' && (
            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5">
              Loại: {translateType(selectedType)}
              <button onClick={() => setSelectedType('all')} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </span>
          )}
          {statFilter && (
            <span className="bg-teal-50 border border-teal-200 text-teal-950 px-2.5 py-1 text-xs font-black rounded-none flex items-center gap-1.5 uppercase tracking-wider">
              {statFilter === 'available' ? 'Phòng trống' : statFilter === 'occupied' ? 'Phòng có khách' : statFilter === 'maintenance' ? 'Đang bảo trì' : statFilter === 'inactive' ? 'Ngừng hoạt động' : 'Lọc nhanh chỉ số'}
              <button onClick={() => setStatFilter(null)} className="text-teal-600 hover:text-teal-900 font-bold">✕</button>
            </span>
          )}
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedStatus('all');
              setStatFilter(null);
            }} 
            className="text-xs font-bold text-teal-800 hover:underline hover:text-teal-900 uppercase tracking-widest ml-auto"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-teal-800">
          <div className="w-12 h-12 border-2 border-teal-800 border-t-transparent animate-spin rounded-none mb-4"></div>
          <p className="font-bold text-xs tracking-widest uppercase text-slate-500">Đang truy vấn dữ liệu vận hành phòng khám...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-[fadeIn_0.3s_ease-out]">
          {filteredRooms.map(room => {
            const isUnderMaintenance = room.trang_thai === 'bao_tri';
            const isAvailable = room.trang_thai === 'san_sang' || room.trang_thai === 'trong';
            const isOccupied = room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach';

            return (
              <Link 
                key={room.id} 
                to={`/admin/rooms/${room.id}`}
                className={`border p-6 rounded-none transition-all duration-300 bg-white relative flex flex-col justify-between group overflow-hidden ${
                  isUnderMaintenance 
                    ? 'border-amber-400 hover:border-teal-800 hover:shadow-[0_16px_35px_rgba(15,118,110,0.12)]' 
                    : 'border-slate-200 hover:border-teal-800 hover:shadow-[0_16px_35px_rgba(15,118,110,0.12)]'
                } hover:-translate-y-1`}
              >
                {/* Tech dashed grid background pattern */}
                <div className="absolute inset-0 opacity-[0.015] group-hover:opacity-[0.035] transition-opacity pointer-events-none select-none">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id={`grid-${room.id}`} width="14" height="14" patternUnits="userSpaceOnUse">
                        <path d="M 14 0 L 0 0 0 14" fill="none" stroke="currentColor" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${room.id})`} />
                  </svg>
                </div>

                {/* Header Room Info */}
                <div className="z-10 relative w-full">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="bg-slate-900 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider rounded-none">
                          {room.ma_phong}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-teal-950 mt-2 tracking-tight group-hover:text-teal-900 transition-colors">
                        {room.ten_phong}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block">
                        {renderRoomIconSVG(room.loai_phong)}
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none border ${
                          isAvailable 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : isOccupied 
                              ? 'bg-teal-50 text-teal-700 border-teal-200' 
                              : room.trang_thai === 'ngung_hoat_dong'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isAvailable 
                              ? 'bg-emerald-500 animate-[pulse_1.5s_infinite]' 
                              : isOccupied
                                ? 'bg-teal-500 animate-[pulse_2s_infinite]'
                                : room.trang_thai === 'ngung_hoat_dong'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                          }`}></span>
                          {isAvailable ? 'TRỐNG' : isOccupied ? 'ĐANG DÙNG' : room.trang_thai === 'ngung_hoat_dong' ? 'NGỪNG DÙNG' : 'BẢO TRÌ'}
                        </span>
                        <span className="block text-[8px] font-bold text-slate-450 uppercase tracking-widest">
                          {translateType(room.loai_phong)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Room Description */}
                  {room.mo_ta && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                        {room.mo_ta}
                      </p>
                    </div>
                  )}


                </div>

                {/* Card Footer indicator */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto z-10 relative">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {room.loai_phong === 'phong_tri_lieu' || room.loai_phong === 'phong_tri_lieu_chuan' || room.loai_phong === 'tri_lieu' || room.loai_phong === 'phong_dac_biet' ? (
                      `Sức chứa: ${room.suc_chua || 1} giường`
                    ) : room.loai_phong === 'phong_kham' || room.loai_phong === 'kham_benh' ? (
                      `Sức chứa: 1 khách`
                    ) : room.loai_phong === 'phong_tap' || room.loai_phong === 'phong_tap_phcn' || room.loai_phong === 'phuc_hoi' ? (
                      `Sức chứa: ${room.suc_chua || 1} slot tập`
                    ) : (
                      `Sức chứa: ${room.suc_chua || 1} người`
                    )}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-teal-800 transition-colors flex items-center gap-1">
                    Chi tiết phòng <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE NEW ROOM */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border-2 border-slate-950 shadow-[0_24px_60px_rgba(0,0,0,0.18)] max-w-lg w-full overflow-hidden rounded-none flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="border-b-2 border-slate-950 bg-slate-950 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block mb-0.5">Hạ tầng y tế</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Đăng ký phòng điều trị mới
                </h3>
              </div>
              <button 
                onClick={() => setIsRoomModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleRoomSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tên Phòng</label>
                <input 
                  type="text" 
                  required
                  placeholder="Phòng trị liệu, Phòng VIP, Phòng Laser..."
                  value={roomFormData.ten_phong}
                  onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
                  className="w-full border-2 border-slate-200 bg-slate-50 hover:bg-white focus:bg-white p-3 text-sm font-bold rounded-none focus:outline-none focus:border-slate-950 focus:ring-0 transition-all placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Loại Phòng</label>
                <select 
                  value={roomFormData.loai_phong}
                  onChange={(e) => setRoomFormData({ ...roomFormData, loai_phong: e.target.value })}
                  className="w-full border-2 border-slate-200 bg-slate-50 hover:bg-white focus:bg-white p-3 text-sm font-bold rounded-none focus:outline-none focus:border-slate-950 focus:ring-0 transition-all"
                >
                  {ALL_ROOM_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {(roomFormData.loai_phong === 'phong_tri_lieu' || roomFormData.loai_phong === 'phong_tri_lieu_chuan' || roomFormData.loai_phong === 'tri_lieu' || roomFormData.loai_phong === 'phong_tap') && (
                <div className="p-4 bg-slate-50 border-2 border-slate-150 space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {roomFormData.loai_phong === 'phong_tap' ? 'Sức chứa tối đa (Slot tập)' : 'Sức chứa tối đa (Giường/Bàn trị liệu)'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={roomFormData.suc_chua}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRoomFormData({ 
                           ...roomFormData, 
                           suc_chua: val === '' ? '' : Math.max(1, parseInt(val) || 1)
                        });
                      }}
                      className="w-full border-2 border-slate-200 bg-white p-3 text-sm font-bold rounded-none focus:outline-none focus:border-slate-950 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      {roomFormData.loai_phong === 'phong_tap' ? 'SLOT TẬP' : 'GIƯỜNG'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    {roomFormData.loai_phong === 'phong_tap' 
                      ? 'Dùng để kiểm soát sức chứa tối đa khi xếp lịch tập phục hồi chức năng đồng thời.'
                      : 'Dùng để kiểm soát sức chứa tối đa khi xếp lịch điều trị cho bệnh nhân.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mô tả chi tiết / Ghi chú</label>
                <textarea 
                  value={roomFormData.mo_ta}
                  onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
                  placeholder="Ghi chú vệ sinh, dọn dẹp phòng, chỉ định kỹ thuật viên phụ trách..."
                  rows={3}
                  className="w-full border-2 border-slate-200 bg-slate-50 hover:bg-white focus:bg-white p-3 text-sm font-semibold rounded-none focus:outline-none focus:border-slate-950 focus:ring-0 transition-all placeholder-slate-400"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-5 py-2.5 border-2 border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-widest rounded-none transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-slate-950 hover:bg-teal-900 text-white text-xs font-black uppercase tracking-widest rounded-none transition-all shadow-md active:scale-[0.98]"
                >
                  Tạo phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

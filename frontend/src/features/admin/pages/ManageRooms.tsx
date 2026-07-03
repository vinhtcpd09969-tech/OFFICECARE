import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  getRooms, 
  createRoom 
} from '../../../api/admin.api';
import { DoorOpen, Users, Compass, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

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

const renderRoomIcon = (type: string) => {
  if (type === 'phong_tri_lieu' || type === 'phong_tri_lieu_chuan' || type === 'tri_lieu' || type === 'phong_dac_biet') {
    return (
      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-850 shadow-inner group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v12M6 12h12" />
        </svg>
      </div>
    );
  }
  if (type === 'phong_kham' || type === 'kham_benh') {
    return (
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-inner group-hover:bg-slate-600 group-hover:text-white transition-all duration-300">
      <DoorOpen className="w-6 h-6" />
    </div>
  );
};

const ALL_ROOM_TYPES = [
  { value: 'phong_tri_lieu', label: 'Phòng trị liệu' },
  { value: 'phong_kham', label: 'Phòng khám' }
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

  // Fetch all rooms
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getRooms();
      setRooms(res.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu hạ tầng:', error);
      showToast('Không thể kết nối dữ liệu máy chủ.', 'error');
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
      
      // Type Filter
      if (selectedType !== 'all' && room.loai_phong !== selectedType) return false;

      // Search Filter
      const query = searchQuery.toLowerCase();
      const matchSearch = room.ten_phong.toLowerCase().includes(query) || 
                          (room.ma_phong || '').toLowerCase().includes(query) ||
                          (room.mo_ta && room.mo_ta.toLowerCase().includes(query));
      if (!matchSearch) return false;

      // Quick Stat Filter
      if (statFilter) {
        if (statFilter === 'available' && !(room.trang_thai === 'san_sang' || room.trang_thai === 'trong')) return false;
        if (statFilter === 'occupied' && !(room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach')) return false;
        if (statFilter === 'maintenance' && room.trang_thai !== 'bao_tri') return false;
        if (statFilter === 'inactive' && room.trang_thai !== 'ngung_hoat_dong') return false;
      }

      // Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'san_sang' && !(room.trang_thai === 'san_sang' || room.trang_thai === 'trong')) return false;
        if (selectedStatus === 'dang_dung' && !(room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach')) return false;
        if (selectedStatus === 'bao_tri' && room.trang_thai !== 'bao_tri') return false;
      }

      return true;
    }).sort((a, b) => (a.ma_phong || '').localeCompare(b.ma_phong || ''));
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
      showToast('Đăng ký phòng trực thành công!');
      setIsRoomModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Có lỗi xảy ra khi tạo phòng mới.', 'error');
    }
  };

  const translateType = (type: string) => {
    if (type === 'phong_kham' || type === 'kham_benh') return 'Phòng khám';
    if (type === 'phong_tri_lieu' || type === 'phong_tri_lieu_chuan' || type === 'tri_lieu' || type === 'phong_dac_biet') return 'Phòng trị liệu';
    return type;
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-700 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Toast Notifier */}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`px-5 py-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 w-96 backdrop-blur-lg border transition-all duration-300 transform translate-y-0 ${
              t.type === 'success' 
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' 
                : t.type === 'error' 
                  ? 'bg-rose-50/95 border-rose-200 text-rose-900' 
                  : 'bg-teal-50/95 border-teal-200 text-teal-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : t.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <Info className="w-5 h-5 text-teal-800" />}
              <p className="text-sm font-semibold leading-relaxed">{t.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-teal-50 text-teal-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">Hạ tầng y khoa</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-3">
            Hệ Thống Phòng Khám & Điều Trị
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Quản lý sơ đồ phòng khám lâm sàng, cabin trị liệu và thiết lập sức chứa vận hành</p>
        </div>
        
        <div>
          <button 
            onClick={() => handleOpenRoomModal()}
            className="bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-250"
          >
            + Khai báo phòng trực mới
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => setStatFilter(null)}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${!statFilter ? 'bg-teal-900/5 border-teal-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">TỔNG SỐ PHÒNG</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalPhysicalRooms}</span>
            <span className="text-xs text-slate-400 font-medium">cabin vận hành</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('available')}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${statFilter === 'available' ? 'bg-emerald-50/50 border-emerald-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ĐANG TRỐNG</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600 tracking-tight">{stats.availableRooms}</span>
            <span className="text-xs text-slate-400 font-medium">Sẵn sàng nhận khách</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('occupied')}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${statFilter === 'occupied' ? 'bg-cyan-50/50 border-cyan-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ĐANG BẬN</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-cyan-600 tracking-tight">{stats.occupiedRooms}</span>
            <span className="text-xs text-slate-400 font-medium">Đang điều trị</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('maintenance')}
          className={`border p-6 cursor-pointer transition-all duration-300 rounded-2xl hover:shadow-lg ${statFilter === 'maintenance' ? 'bg-amber-50/50 border-amber-500/50 shadow-md' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ĐANG BẢO TRÌ</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-600 tracking-tight">{stats.maintenanceRooms}</span>
            <span className="text-xs text-slate-400 font-medium">Bảo dưỡng hạ tầng</span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-slate-50/80 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search */}
        <div className="relative md:col-span-3">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
            <Compass className="w-5 h-5" />
          </span>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã phòng, tên phòng hoặc ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200/80 bg-white text-sm font-semibold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
          />
        </div>

        {/* Room Type Filter */}
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full py-3 px-4 border border-slate-200/80 bg-white text-sm font-bold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all"
        >
          <option value="all">TẤT CẢ LOẠI PHÒNG</option>
          <option value="phong_tri_lieu">PHÒNG TRỊ LIỆU</option>
          <option value="phong_kham">PHÒNG KHÁM</option>
        </select>
      </div>

      {/* Active filters display */}
      {(statFilter || selectedType !== 'all' || selectedStatus !== 'all' || searchQuery) && (
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang lọc theo:</span>
          {searchQuery && (
            <span className="bg-slate-100 border border-slate-200/60 px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2">
              Từ khóa: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </span>
          )}

          {selectedType !== 'all' && (
            <span className="bg-slate-100 border border-slate-200/60 px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2">
              Loại: {translateType(selectedType)}
              <button onClick={() => setSelectedType('all')} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </span>
          )}
          {statFilter && (
            <span className="bg-teal-50 border border-teal-200 text-teal-900 px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 uppercase tracking-wider">
              {statFilter === 'available' ? 'Phòng trống' : statFilter === 'occupied' ? 'Phòng có khách' : statFilter === 'maintenance' ? 'Đang bảo trì' : 'Chỉ số thống kê'}
              <button onClick={() => setStatFilter(null)} className="text-teal-600 hover:text-teal-950 font-bold">✕</button>
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
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Grid of rooms */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-teal-800">
          <div className="w-12 h-12 border-4 border-teal-800 border-t-transparent animate-spin rounded-full mb-4"></div>
          <p className="font-bold text-xs tracking-widest uppercase text-slate-400">Đang đồng bộ dữ liệu phòng điều trị...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => {
            const isUnderMaintenance = room.trang_thai === 'bao_tri';
            const isAvailable = room.trang_thai === 'san_sang' || room.trang_thai === 'trong';
            const isOccupied = room.trang_thai === 'dang_dung' || room.trang_thai === 'dang_co_khach';

            return (
              <Link 
                key={room.id} 
                to={`/admin/rooms/${room.id}`}
                className={`border bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative flex flex-col justify-between group overflow-hidden ${
                  isUnderMaintenance 
                    ? 'border-amber-200/80 hover:border-amber-400' 
                    : isOccupied 
                      ? 'border-cyan-200/80 hover:border-cyan-400'
                      : 'border-slate-200/60 hover:border-teal-500'
                }`}
              >
                {/* Visual patterns */}
                <div className="absolute inset-0 opacity-[0.01] group-hover:opacity-[0.03] transition-opacity pointer-events-none select-none">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern id={`grid-${room.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill={`url(#grid-${room.id})`} />
                  </svg>
                </div>

                <div className="z-10 w-full">
                  <div className="flex justify-between items-start border-b border-slate-100/80 pb-4 mb-4">
                    <div className="space-y-1">
                      <span className="bg-slate-900 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {room.ma_phong || 'Chưa có mã'}
                      </span>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight mt-2.5 group-hover:text-teal-900 transition-colors">
                        {room.ten_phong}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {renderRoomIcon(room.loai_phong)}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      isAvailable 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : isOccupied 
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
                          : room.trang_thai === 'ngung_hoat_dong'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isAvailable 
                          ? 'bg-emerald-500 animate-pulse' 
                          : isOccupied
                            ? 'bg-cyan-500 animate-pulse'
                            : room.trang_thai === 'ngung_hoat_dong'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                      }`}></span>
                      {isAvailable ? 'Sẵn sàng' : isOccupied ? 'Đang hoạt động' : room.trang_thai === 'ngung_hoat_dong' ? 'Ngừng dùng' : 'Bảo trì'}
                    </span>
                  </div>

                  {room.mo_ta && (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                      {room.mo_ta}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100/80 pt-4 mt-4 z-10">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {room.loai_phong === 'phong_tri_lieu' || room.loai_phong === 'tri_lieu'
                        ? `Giường tối đa: ${room.suc_chua || 1}` 
                        : `Sức chứa: ${room.suc_chua || 1} bác sĩ`}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-teal-800 transition-colors flex items-center gap-1">
                    Cấu hình phòng <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CREATE NEW ROOM MODAL */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-teal-900 text-white px-6 py-5 flex justify-between items-center flex-shrink-0">
              <div>
                <span className="text-[9px] font-black text-teal-350 uppercase tracking-widest block mb-0.5">THIẾT LẬP VẬN HÀNH</span>
                <h3 className="font-extrabold text-base uppercase tracking-wider">
                  Khai báo phòng mới
                </h3>
              </div>
              <button 
                onClick={() => setIsRoomModalOpen(false)} 
                className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleRoomSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tên phòng khám / điều trị *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Phòng trị liệu Laser, Phòng khám số 3..."
                  value={roomFormData.ten_phong}
                  onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
                  className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-semibold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mã phòng y tế *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: PK-01, TL-05..."
                  value={roomFormData.ma_phong}
                  onChange={(e) => setRoomFormData({ ...roomFormData, ma_phong: e.target.value.toUpperCase().trim() })}
                  className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-mono font-bold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phân loại phòng chức năng</label>
                <select 
                  value={roomFormData.loai_phong}
                  onChange={(e) => setRoomFormData({ ...roomFormData, loai_phong: e.target.value })}
                  className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-bold rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all"
                >
                  {ALL_ROOM_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50 space-y-2">
                <label className="block text-[10px] font-bold text-teal-800 uppercase tracking-widest">
                  {roomFormData.loai_phong === 'phong_tri_lieu' ? 'SỨC CHỨA TỐI ĐA (GIƯỜNG TRỊ LIỆU) *' : 'SỨC CHỨA TỐI ĐA (BÁC SĨ TRỰC CA) *'}
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
                    className="w-full border border-slate-200 bg-white p-3 text-sm font-bold rounded-xl focus:outline-none focus:border-teal-800 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 pointer-events-none uppercase">
                    {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Giường' : 'Nhân sự'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  {roomFormData.loai_phong === 'phong_tri_lieu' 
                    ? 'Dùng để gán đồng thời nhiều kỹ thuật viên trực tiếp phục vụ trong ca trực.' 
                    : 'Dùng để giới hạn số lượng bác sĩ khám bệnh đồng thời trong một ca trực.'}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mô tả / Ghi chú trang thiết bị</label>
                <textarea 
                  value={roomFormData.mo_ta}
                  onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
                  placeholder="Ghi chú thiết bị có sẵn (ví dụ: máy laser, giường điện kéo giãn...) hoặc vệ sinh phòng trực..."
                  rows={3}
                  className="w-full border border-slate-200/80 bg-slate-50/50 focus:bg-white p-3.5 text-sm font-medium rounded-xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-100 transition-all placeholder-slate-400"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 flex-shrink-0 font-bold">
                <button 
                  type="button" 
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-505 hover:bg-slate-50 text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRooms, 
  getEquipment,
  updateRoom
} from '../../../api/admin.api';

// --- Types ---
interface Room {
  id: string | number;
  ten_phong: string;
  ma_phong: string;
  loai_phong: string;
  tang: string;
  trang_thai: string;
  mo_ta?: string;
}

interface Equipment {
  id: string | number;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  loai_thiet_bi?: string;
  trang_thai: string;
  phong_id_hien_tai?: string | number | null;
  ghi_chu?: string;
  co_the_di_chuyen?: boolean;
  so_lan_su_dung?: number;
  nguong_canh_bao?: number | null;
  nguong_bat_buoc_bao_tri?: number | null;
}

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Forms for Editing Room Info
  const [roomFormData, setRoomFormData] = useState({
    ten_phong: '',
    ma_phong: '',
    loai_phong: 'phong_tri_lieu_chuan',
    tang: 'Tang 1',
    trang_thai: 'san_sang',
    mo_ta: '',
    so_luong_giuong: 1
  });
  
  // Toasts
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsRes, eqRes] = await Promise.all([getRooms(), getEquipment()]);
      setRooms(roomsRes.data || []);
      setEquipment(eqRes.data || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chi tiết phòng:', error);
      showToast('Không thể kết nối API. Vui lòng tải lại trang.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Find current room
  const currentRoom = useMemo(() => {
    return rooms.find(r => r.id.toString() === id);
  }, [rooms, id]);

  // Sync form data with database state when currentRoom loads
  useEffect(() => {
    if (currentRoom) {
      setRoomFormData({
        ten_phong: currentRoom.ten_phong,
        ma_phong: currentRoom.ma_phong,
        loai_phong: currentRoom.loai_phong,
        tang: currentRoom.tang,
        trang_thai: currentRoom.trang_thai,
        mo_ta: currentRoom.mo_ta || '',
        so_luong_giuong: 1
      });
    }
  }, [currentRoom]);

  const handleResetForm = () => {
    if (!currentRoom) return;
    setRoomFormData({
      ten_phong: currentRoom.ten_phong,
      ma_phong: currentRoom.ma_phong,
      loai_phong: currentRoom.loai_phong,
      tang: currentRoom.tang,
      trang_thai: currentRoom.trang_thai,
      mo_ta: currentRoom.mo_ta || '',
      so_luong_giuong: 1
    });
    showToast('Đã khôi phục thông tin ban đầu.', 'info');
  };

  // Equipment in this room
  const roomEquipment = useMemo(() => {
    if (!currentRoom) return [];
    return equipment.filter(e => e.phong_id_hien_tai?.toString() === currentRoom.id.toString());
  }, [equipment, currentRoom]);

  // Filtered equipment based on local search
  const filteredRoomEquipment = useMemo(() => {
    return roomEquipment.filter(e => {
      const query = searchQuery.toLowerCase();
      return e.ten_thiet_bi.toLowerCase().includes(query) || 
             e.ma_thiet_bi.toLowerCase().includes(query) ||
             (e.ghi_chu && e.ghi_chu.toLowerCase().includes(query));
    });
  }, [roomEquipment, searchQuery]);

  // Telemetry counts
  const telemetry = useMemo(() => {
    const total = roomEquipment.length;
    const ok = roomEquipment.filter(e => e.trang_thai === 'san_sang' || e.trang_thai === 'dang_su_dung').length;
    const error = roomEquipment.filter(e => e.trang_thai === 'dang_bao_tri' || e.trang_thai === 'hong').length;
    const warning = roomEquipment.filter(e => {
      return e.so_lan_su_dung !== undefined && e.nguong_canh_bao && e.so_lan_su_dung >= e.nguong_canh_bao && e.trang_thai === 'san_sang';
    }).length;

    return { total, ok, error, warning };
  }, [roomEquipment]);

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;
    try {
      await updateRoom(currentRoom.id.toString(), roomFormData);
      showToast('Cập nhật thông tin phòng thành công!');
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi lưu thông tin phòng.', 'error');
    }
  };






  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-teal-800 font-sans">
        <div className="w-12 h-12 border-2 border-teal-850 border-t-transparent animate-spin rounded-none mb-4"></div>
        <p className="font-bold text-xs tracking-widest uppercase text-slate-500">Đang đồng bộ dữ liệu hạ tầng y tế...</p>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="py-20 text-center font-sans">
        <h3 className="text-xl font-bold text-rose-900 uppercase">Không tìm thấy thông tin phòng!</h3>
        <p className="text-slate-550 mt-2">Phòng điều trị không tồn tại hoặc đã bị gỡ khỏi hệ thống.</p>
        <button 
          onClick={() => navigate('/admin/rooms')}
          className="mt-6 px-6 py-2 bg-teal-800 text-white text-xs font-bold uppercase tracking-wider rounded-none hover:bg-teal-900 transition-all active:scale-95"
        >
          Quay lại danh sách phòng
        </button>
      </div>
    );
  }

  const isCurrentlyOccupied = currentRoom.trang_thai === 'dang_dung' || currentRoom.trang_thai === 'dang_co_khach';
  const statusVal = roomFormData.trang_thai;
  const isAvailableActive = statusVal === 'san_sang' || statusVal === 'trong';
  const isOccupiedActive = statusVal === 'dang_co_khach' || statusVal === 'dang_dung';
  const isMaintenanceActive = statusVal === 'bao_tri';
  const isInactiveActive = statusVal === 'ngung_hoat_dong';

  return (
    <div className="space-y-6 pb-12 animate-[fadeIn_0.4s_ease-out] font-sans text-slate-800">
      
      {/* HUD Toasts */}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`border px-5 py-3.5 rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4 w-96 backdrop-blur-md transition-all duration-300 border-l-[3px] ${
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

      {/* Back navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <button 
          onClick={() => navigate('/admin/rooms')}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-850 hover:text-teal-950 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách phòng
        </button>
      </div>

      {/* ROOM MAIN SPECIFICATIONS PANEL */}
      <div className="border border-slate-200 bg-white p-6 rounded-none shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleRoomSubmit} className="lg:col-span-2 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-xs uppercase tracking-widest text-teal-950 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              CẤU HÌNH CHI TIẾT HẠ TẦNG PHÒNG
            </h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Lưu thay đổi trực tiếp tại đây
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Tên phòng điều trị</label>
              <input 
                type="text" 
                required
                value={roomFormData.ten_phong}
                onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
                className="w-full border border-slate-200 bg-white p-2.5 text-xs font-semibold rounded-none focus:outline-none focus:border-teal-800 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Mã phòng (Cố định)</label>
              <input 
                type="text" 
                disabled
                value={roomFormData.ma_phong}
                className="w-full border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono font-bold cursor-not-allowed text-slate-450 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vị trí Tầng (Cố định)</label>
              <select 
                disabled
                value={roomFormData.tang}
                className="w-full border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold rounded-none cursor-not-allowed text-slate-450 focus:outline-none"
              >
                <option value="Tang 1">Tầng 1</option>
                <option value="Tang 2">Tầng 2</option>
                <option value="Tang 3">Tầng 3</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Loại Phòng (Cố định)</label>
              <select 
                disabled
                value={roomFormData.loai_phong}
                className="w-full border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold rounded-none cursor-not-allowed text-slate-450 focus:outline-none"
              >
                <option value="phong_tri_lieu_chuan">Phòng trị liệu</option>
                <option value="kho_thiet_bi">Phòng thiết bị chung</option>
                <option value="phong_may_co_dinh">Phòng có thiết bị cố định</option>
                <option value="kham_benh">Phòng khám</option>
                <option value="phong_tap_phcn">Phòng tập</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Trạng thái vận hành</label>
              <div className="flex border border-slate-200 rounded-none overflow-hidden shadow-sm select-none">
                {/* SẴN SÀNG */}
                <button
                  type="button"
                  disabled={isCurrentlyOccupied}
                  onClick={() => setRoomFormData({ ...roomFormData, trang_thai: 'san_sang' })}
                  className={`flex-1 py-2 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border-r border-slate-200 transition-all duration-150 ${
                    isAvailableActive
                      ? 'bg-emerald-600 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
                      : isCurrentlyOccupied
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100/80'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvailableActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                  SẴN SÀNG
                </button>

                {/* ĐANG CÓ KHÁCH */}
                <button
                  type="button"
                  disabled={true}
                  className={`flex-1 py-2 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border-r border-slate-200 transition-all duration-150 ${
                    isOccupiedActive
                      ? 'bg-cyan-600 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] font-black'
                      : 'bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOccupiedActive ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></span>
                  CÓ KHÁCH
                </button>

                {/* BẢO TRÌ */}
                <button
                  type="button"
                  disabled={isCurrentlyOccupied}
                  onClick={() => setRoomFormData({ ...roomFormData, trang_thai: 'bao_tri' })}
                  className={`flex-1 py-2 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border-r border-slate-200 transition-all duration-150 ${
                    isMaintenanceActive
                      ? 'bg-amber-500 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
                      : isCurrentlyOccupied
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100/80'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isMaintenanceActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                  BẢO TRÌ
                </button>

                {/* NGỪNG DÙNG */}
                <button
                  type="button"
                  disabled={isCurrentlyOccupied}
                  onClick={() => setRoomFormData({ ...roomFormData, trang_thai: 'ngung_hoat_dong' })}
                  className={`flex-1 py-2 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-150 ${
                    isInactiveActive
                      ? 'bg-rose-700 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
                      : isCurrentlyOccupied
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100/80'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isInactiveActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                  NGỪNG DÙNG
                </button>
              </div>

              {isCurrentlyOccupied ? (
                <p className="text-[8px] text-rose-600 mt-1.5 font-bold animate-pulse flex items-center gap-1">
                  <span>⚠️</span> Phòng đang có khách trị liệu. Các tùy chọn trạng thái khác tạm thời bị khóa cho đến khi ca điều trị hoàn thành.
                </p>
              ) : (
                <p className="text-[8px] text-slate-450 mt-1.5 font-semibold leading-normal">
                  * Trạng thái "Có khách" được kích hoạt tự động qua lịch khám. Bạn có thể thủ công chuyển đổi giữa Sẵn sàng, Bảo trì, Ngừng dùng khi phòng trống.
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Sức chứa khách hàng (Cố định)</label>
              <input 
                type="text"
                disabled
                value="1 khách hàng"
                className="w-full border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold rounded-none cursor-not-allowed text-slate-450 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Mô tả chi tiết / Ghi chú</label>
            <textarea 
              value={roomFormData.mo_ta}
              onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
              placeholder="Ghi chú vệ sinh, dọn dẹp phòng, chỉ định kỹ thuật viên phụ trách..."
              rows={2}
              className="w-full border border-slate-200 bg-white p-2.5 text-xs font-semibold rounded-none focus:outline-none focus:border-teal-800 transition-colors"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">

            <button 
              type="button" 
              onClick={handleResetForm}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-none hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-950 text-white text-[10px] font-black uppercase tracking-wider transition-all rounded-none active:scale-95 shadow-sm"
            >
              Lưu cập nhật
            </button>
          </div>
        </form>

        {/* Room Status Widget */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-150 pt-6 lg:pt-0 lg:pl-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-1">Thông số thiết bị y tế tại phòng:</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 bg-slate-50 border border-slate-150">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Tổng máy</span>
                <span className="text-xl font-extrabold text-teal-950 mt-1 block">{telemetry.total}</span>
              </div>
              <div className="text-center p-2.5 bg-slate-50 border border-slate-150">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Bình thường</span>
                <span className="text-xl font-extrabold text-emerald-600 mt-1 block">{telemetry.ok}</span>
              </div>
              <div className="text-center p-2.5 bg-slate-50 border border-slate-150">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cần sửa</span>
                <span className={`text-xl font-extrabold mt-1 block ${telemetry.error > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{telemetry.error}</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-4 mt-6 leading-relaxed">
            💡 Giao diện cấu hình trực quan: Điều chỉnh trạng thái và thông tin hạ tầng trực tiếp trên biểu mẫu bên trái. Hệ thống sẽ tự động đồng bộ hóa sang danh sách tổng quan.
          </div>
        </div>
      </div>

      {/* EQUIPMENT LIST IN ROOM CONTAINER */}
      <div className="border border-slate-200 bg-white overflow-hidden rounded-none shadow-sm">
        
        {/* Table Header Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h4 className="font-extrabold text-teal-950 text-sm tracking-tight uppercase">Bảng điều phối thiết bị y tế tại phòng</h4>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">Danh sách máy móc y khoa đang được lưu trữ hoặc gán tạm thời</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm thiết bị trong phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 border border-slate-200 bg-white text-xs font-semibold rounded-none focus:outline-none focus:border-teal-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Equipment Table */}
        {filteredRoomEquipment.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/20 border-b border-slate-100 text-slate-450 text-[9px] font-black uppercase tracking-widest">
                  <th className="p-3 pl-6 w-32">Mã thiết bị</th>
                  <th className="p-3">Tên thiết bị</th>
                  <th className="p-3 text-center w-36">Trạng thái kỹ thuật</th>
                  <th className="p-3 w-40">Chế độ cơ động</th>
                  <th className="p-3 pr-6 text-right w-64">Điều động vận hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRoomEquipment.map(eq => {
                  const hasWarning = eq.so_lan_su_dung !== undefined && eq.nguong_canh_bao && eq.so_lan_su_dung >= eq.nguong_canh_bao && eq.trang_thai === 'san_sang';
                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 pl-6 font-mono font-bold text-slate-400">{eq.ma_thiet_bi}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{eq.ten_thiet_bi}</span>
                          {hasWarning && (
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-black border border-amber-200 uppercase tracking-wider">
                              ⚠️ Cần bảo trì
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                          <span>Phân loại: {eq.loai_thiet_bi}</span>
                          {eq.so_lan_su_dung !== undefined && (
                            <span className="border-l border-slate-200 pl-2">
                              Đã dùng: <strong className="text-slate-600 font-bold">{eq.so_lan_su_dung}</strong>
                              {eq.nguong_bat_buoc_bao_tri ? ` / ${eq.nguong_bat_buoc_bao_tri}` : ''} lần
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                          eq.trang_thai === 'san_sang' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : eq.trang_thai === 'dang_su_dung'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : eq.trang_thai === 'dang_bao_tri'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {eq.trang_thai === 'san_sang' ? 'Hoạt động' : eq.trang_thai === 'dang_su_dung' ? 'Đang chạy' : eq.trang_thai === 'dang_bao_tri' ? 'Bảo trì' : 'Hỏng/Sự cố'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">
                        {eq.co_the_di_chuyen === false ? (
                          <span className="text-rose-700">🔒 Cố định phòng</span>
                        ) : (
                          <span className="text-emerald-700">🟢 Di động</span>
                        )}
                      </td>
                      <td className="p-3 pr-6 text-right">
                        {eq.co_the_di_chuyen === false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-550 uppercase tracking-wider rounded-none">
                            🔒 Cố định tại cabin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 border border-teal-200 text-[10px] font-black text-teal-800 uppercase tracking-wider rounded-none animate-pulse">
                            ⚡ Tự động phân bổ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400 italic">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Chưa có thiết bị y khoa nào đóng đô tại phòng này.
          </div>
        )}
      </div>




    </div>
  );
}

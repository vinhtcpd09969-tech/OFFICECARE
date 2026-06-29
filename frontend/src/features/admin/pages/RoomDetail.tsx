import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRooms, 
  updateRoom
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

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms for Editing Room Info
  const [roomFormData, setRoomFormData] = useState({
    ten_phong: '',
    ma_phong: '',
    loai_phong: 'phong_tri_lieu_chuan',
    trang_thai: 'san_sang',
    mo_ta: '',
    suc_chua: 1
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
      const res = await getRooms();
      setRooms(res.data || []);
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
        trang_thai: currentRoom.trang_thai,
        mo_ta: currentRoom.mo_ta || '',
        suc_chua: currentRoom.suc_chua || 1
      });
    }
  }, [currentRoom]);

  const handleResetForm = () => {
    if (!currentRoom) return;
    setRoomFormData({
      ten_phong: currentRoom.ten_phong,
      ma_phong: currentRoom.ma_phong,
      loai_phong: currentRoom.loai_phong,
      trang_thai: currentRoom.trang_thai,
      mo_ta: currentRoom.mo_ta || '',
      suc_chua: currentRoom.suc_chua || 1
    });
    showToast('Đã khôi phục thông tin ban đầu.', 'info');
  };

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
      <div className="border border-slate-200 bg-white p-6 rounded-none shadow-sm max-w-3xl">
        <form onSubmit={handleRoomSubmit} className="space-y-4">
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
            <div className={roomFormData.loai_phong === 'kho_thiet_bi' ? 'col-span-2' : ''}>
              <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Trạng thái vận hành</label>
              <div className="flex border border-slate-200 rounded-none overflow-hidden shadow-sm select-none">
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
            </div>
            {roomFormData.loai_phong !== 'kho_thiet_bi' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Sức chứa</label>
                <input 
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={roomFormData.suc_chua}
                  onChange={(e) => setRoomFormData({ ...roomFormData, suc_chua: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full border border-slate-200 bg-white p-2.5 text-xs font-semibold rounded-none focus:outline-none focus:border-teal-800 transition-colors"
                />
              </div>
            )}
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
      </div>
    </div>
  );
}

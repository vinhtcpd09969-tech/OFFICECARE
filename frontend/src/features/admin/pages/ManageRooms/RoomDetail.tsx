import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRooms, 
  updateRoom
} from '../../api/admin.api';
import { Sparkles, CheckCircle2, AlertTriangle, Info, X, ArrowLeft, Save, RotateCcw, Cpu } from 'lucide-react';
import api from '../../../../api/axios';

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
      showToast('Không thể tải thông tin từ máy chủ.', 'error');
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

  const [roomEquipment, setRoomEquipment] = useState<any[]>([]);

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

      api.get('/admin/equipment')
        .then(res => {
          const list = (res.data || []).filter((e: any) => String(e.phong_id) === String(currentRoom.id));
          setRoomEquipment(list);
        })
        .catch(() => {});
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
      showToast('Có lỗi xảy ra khi lưu thông tin phòng.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-teal-800 font-sans">
        <div className="w-12 h-12 border-4 border-teal-800 border-t-transparent animate-spin rounded-full mb-4"></div>
        <p className="font-bold text-xs tracking-widest uppercase text-slate-400">Đang tải thông tin hạ tầng y tế...</p>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="py-24 text-center font-sans max-w-md mx-auto">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 uppercase">Không tìm thấy phòng!</h3>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">Phòng trực y tế này có thể không tồn tại hoặc đã được gỡ bỏ khỏi cơ sở dữ liệu.</p>
        <button 
          onClick={() => navigate('/admin/rooms')}
          className="mt-6 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
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
    <div className="space-y-8 pb-16 font-sans text-slate-700 max-w-4xl mx-auto px-4">
      
      {/* Toast Alert Systems */}
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

      {/* Navigation and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <button 
            onClick={() => navigate('/admin/rooms')}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 hover:text-teal-950 transition-colors group mb-3"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Quay lại sơ đồ phòng trực
          </button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Cấu hình: {currentRoom.ten_phong}
          </h2>
        </div>
        <div>
          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
            isCurrentlyOccupied 
              ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
              : isAvailableActive 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isMaintenanceActive
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            {isCurrentlyOccupied ? 'Đang hoạt động' : isAvailableActive ? 'Sẵn sàng' : isMaintenanceActive ? 'Bảo trì' : 'Ngừng hoạt động'}
          </span>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-200" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider font-jakarta">Thông tin chi tiết hạ tầng</h3>
          </div>
          <span className="text-[9px] font-black text-teal-100 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-md">
            Thay đổi được áp dụng ngay lập tức
          </span>
        </div>

        <form onSubmit={handleRoomSubmit} className="p-6 space-y-6 text-slate-800 dark:text-zinc-200 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Tên phòng khám / điều trị *</label>
              <input 
                type="text" 
                required
                value={roomFormData.ten_phong}
                onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
                className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-slate-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Mã phòng *</label>
              <input 
                type="text" 
                required
                value={roomFormData.ma_phong}
                onChange={(e) => setRoomFormData({ ...roomFormData, ma_phong: e.target.value.toUpperCase().trim() })}
                className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-mono font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-slate-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-2">Trạng thái hoạt động</label>
              <div className="flex border border-slate-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-xs select-none bg-slate-50 dark:bg-zinc-800 p-1 gap-1">
                <button
                  type="button"
                  disabled={isCurrentlyOccupied}
                  onClick={() => setRoomFormData({ ...roomFormData, trang_thai: 'san_sang' })}
                  className={`flex-1 py-2.5 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 rounded-xl transition-all duration-200 cursor-pointer ${
                    isAvailableActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isCurrentlyOccupied
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-transparent text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  SẮN SÀNG
                </button>

                <button
                  type="button"
                  disabled={true}
                  className={`flex-1 py-2.5 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 rounded-xl transition-all duration-200 ${
                    isOccupiedActive
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-transparent text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  CÓ KHÁCH
                </button>

                <button
                  type="button"
                  disabled={isCurrentlyOccupied}
                  onClick={() => setRoomFormData({ ...roomFormData, trang_thai: 'bao_tri' })}
                  className={`flex-1 py-2.5 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 rounded-xl transition-all duration-200 cursor-pointer ${
                    isMaintenanceActive
                      ? 'bg-amber-500 text-white shadow-md'
                      : isCurrentlyOccupied
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-transparent text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  BẢO TRÌ
                </button>

                <button
                  type="button"
                  disabled={isCurrentlyOccupied}
                  onClick={() => setRoomFormData({ ...roomFormData, trang_thai: 'ngung_hoat_dong' })}
                  className={`flex-1 py-2.5 px-1 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 rounded-xl transition-all duration-200 cursor-pointer ${
                    isInactiveActive
                      ? 'bg-rose-700 text-white shadow-md'
                      : isCurrentlyOccupied
                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-transparent text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  NGỪNG DÙNG
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Sức chứa (Số giường trị liệu)' : 'Sức chứa (Số bác sĩ trực ca)'} *
              </label>
              <input 
                type="number"
                min={1}
                max={20}
                required
                value={roomFormData.suc_chua}
                onChange={(e) => setRoomFormData({ ...roomFormData, suc_chua: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-slate-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Mô tả chi tiết trang thiết bị / Ghi chú</label>
            <textarea 
              value={roomFormData.mo_ta}
              onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
              placeholder="Ghi chú vệ sinh phòng trực, mô tả chi tiết máy móc thiết bị có sẵn phục vụ trị liệu..."
              rows={3}
              className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-slate-800 dark:text-zinc-100 leading-relaxed resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-zinc-800 font-bold">
            <button 
              type="button" 
              onClick={handleResetForm}
              className="px-5 py-3 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Khôi phục ban đầu
            </button>
            <button 
              type="submit" 
              className="px-7 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* DANH SÁCH THIẾT BỊ Y TẾ ĐƯỢC GÁN VÀO PHÒNG NÀY */}
      {currentRoom?.loai_phong === 'phong_tri_lieu' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <Cpu size={20} />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Danh Sách Thiết Bị Y Tế Tại Phòng ({roomEquipment.length} thiết bị)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/equipment')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>⚡ Quản lý gán thiết bị</span>
              <span>→</span>
            </button>
          </div>

          {roomEquipment.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roomEquipment.map((tb: any) => (
                <div key={tb.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">{tb.ma_thiet_bi}</span>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100">{tb.ten_thiet_bi}</h4>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    tb.trang_thai === 'dang_bao_tri'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/40 dark:text-amber-300'
                      : tb.trang_thai === 'dang_su_dung'
                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-955/40 dark:text-cyan-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-955/40 dark:text-emerald-300'
                  }`}>
                    {tb.trang_thai === 'dang_bao_tri' ? 'Bảo trì' : tb.trang_thai === 'dang_su_dung' ? 'Đang dùng' : 'Sẵn sàng'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 font-medium border border-dashed rounded-2xl">
              Chưa có thiết bị y tế nào được gán vào phòng trị liệu này. Bấm "Quản lý gán thiết bị" để chọn phòng cho máy.
            </div>
          )}
        </div>
      )}

    </div>
  );
}

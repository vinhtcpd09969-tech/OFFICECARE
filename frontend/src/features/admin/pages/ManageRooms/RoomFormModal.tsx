import { X, Building2, Plus, Minus } from 'lucide-react';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomFormData: {
    ten_phong: string;
    ma_phong: string;
    loai_phong: string;
    trang_thai: string;
    mo_ta: string;
    suc_chua: number | '';
  };
  setRoomFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  allRoomTypes: { value: string; label: string; }[];
}

export function RoomFormModal({
  isOpen,
  onClose,
  roomFormData,
  setRoomFormData,
  onSubmit,
  allRoomTypes
}: RoomFormModalProps) {
  if (!isOpen) return null;

  const currentCapacity = typeof roomFormData.suc_chua === 'number' ? roomFormData.suc_chua : 1;

  const handleStepCapacity = (delta: number) => {
    const nextVal = Math.max(1, Math.min(20, currentCapacity + delta));
    setRoomFormData({ ...roomFormData, suc_chua: nextVal });
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/80 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 text-white px-6 py-5 flex justify-between items-center flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-[9px] font-black text-teal-100 uppercase tracking-widest block mb-0.5">THIẾT LẬP VẬN HÀNH</span>
              <h3 className="font-extrabold text-base uppercase tracking-wider font-jakarta">
                Khai báo phòng trực mới
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/15 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 dark:text-zinc-200 text-xs">
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
              Tên phòng lượng giá / trị liệu *
            </label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: Phòng Trị Liệu Laser, Phòng Lượng Giá số 1..."
              value={roomFormData.ten_phong}
              onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
              className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
              Mã phòng y tế *
            </label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: PK-01, TL-05..."
              value={roomFormData.ma_phong}
              onChange={(e) => setRoomFormData({ ...roomFormData, ma_phong: e.target.value.toUpperCase().trim() })}
              className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-mono font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
              Phân loại phòng chức năng
            </label>
            <select 
              value={roomFormData.loai_phong}
              onChange={(e) => setRoomFormData({ ...roomFormData, loai_phong: e.target.value })}
              className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all text-slate-800 dark:text-zinc-100 cursor-pointer"
            >
              {allRoomTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-teal-50/70 dark:bg-teal-955/30 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 space-y-2.5">
            <label className="block text-[10px] font-black text-teal-800 dark:text-teal-300 uppercase tracking-widest">
              {roomFormData.loai_phong === 'phong_tri_lieu' ? 'SỨC CHỨA TỐI ĐA (GIƯỜNG TRỊ LIỆU) *' : 'SỨC CHỨA TỐI ĐA (CHUYÊN VIÊN TRỰC CA) *'}
            </label>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStepCapacity(-1)}
                className="size-10 rounded-xl bg-white dark:bg-zinc-800 border border-teal-200 dark:border-zinc-700 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center hover:bg-teal-50 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Minus size={16} />
              </button>
              
              <div className="relative flex-1">
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
                  className="w-full border border-teal-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-center text-sm font-black rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-900 dark:text-zinc-100"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-zinc-500 pointer-events-none uppercase">
                  {roomFormData.loai_phong === 'phong_tri_lieu' ? 'Giường' : 'Chuyên viên'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleStepCapacity(1)}
                className="size-10 rounded-xl bg-white dark:bg-zinc-800 border border-teal-200 dark:border-zinc-700 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center hover:bg-teal-50 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Plus size={16} />
              </button>
            </div>

            <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 font-medium">
              {roomFormData.loai_phong === 'phong_tri_lieu' 
                ? 'Dùng để gán đồng thời nhiều kỹ thuật viên trực tiếp phục vụ trong ca trực.' 
                : 'Dùng để giới hạn số lượng chuyên viên tư vấn làm việc đồng thời trong một ca trực.'}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
              Mô tả / Ghi chú trang thiết bị
            </label>
            <textarea 
              value={roomFormData.mo_ta}
              onChange={(e) => setRoomFormData({ ...roomFormData, mo_ta: e.target.value })}
              placeholder="Ghi chú thiết bị có sẵn (ví dụ: máy laser, giường điện kéo giãn...) hoặc vệ sinh phòng trực..."
              rows={3}
              className="w-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3.5 text-xs font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-100 leading-relaxed resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-zinc-800 flex-shrink-0 font-bold">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-7 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95 cursor-pointer"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

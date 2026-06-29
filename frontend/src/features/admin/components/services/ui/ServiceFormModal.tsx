import { Service, Category } from '../types';
import { useServiceForm } from '../hooks/useServiceForm';

interface ServiceFormModalProps {
  isOpen: boolean;
  selectedType?: 'ky_thuat' | 'don_le';
  categories: Category[];
  services: Service[];
  editingService: Service | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceFormModal({
  isOpen,
  selectedType = 'don_le',
  categories,
  services,
  editingService,
  onClose,
  onSuccess
}: ServiceFormModalProps) {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit
  } = useServiceForm({
    categories,
    services,
    editingService,
    onSuccess
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-secondary/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-250 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] text-secondary animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Modal Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <h3 className="text-sm font-bold font-heading tracking-wide uppercase">
              {editingService ? `[CHỈNH SỬA] ${selectedType === 'ky_thuat' ? 'KỸ THUẬT' : 'DỊCH VỤ ĐƠN LẺ'}` : `[THÊM MỚI] ${selectedType === 'ky_thuat' ? 'KỸ THUẬT' : 'DỊCH VỤ ĐƠN LẺ'}`}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-zinc-400 hover:text-secondary text-xs border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-xl bg-white shadow-sm transition-all"
          >
            [ ĐÓNG ]
          </button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs">
            
            {/* HỘP 1: THÔNG TIN CƠ BẢN */}
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 1: THÔNG TIN CƠ BẢN</h4>
              
              <div>
                <label className="block font-bold text-zinc-550 mb-1.5 uppercase tracking-wider">
                  {selectedType === 'ky_thuat' ? 'TÊN KỸ THUẬT *' : 'TÊN DỊCH VỤ ĐƠN LẺ *'}
                </label>
                <input 
                  {...register('ten_dich_vu')} 
                  placeholder={selectedType === 'ky_thuat' ? "Nhập tên kỹ thuật (Ví dụ: Giải cơ sâu vùng vai)..." : "Nhập tên dịch vụ đơn lẻ (Ví dụ: Khám lượng giá cột sống)..."}
                  className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                />
                {errors.ten_dich_vu && (
                  <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_dich_vu.message}</span>
                )}
              </div>

              {selectedType === 'don_le' && (
                <div>
                  <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">DANH MỤC CHUYÊN KHOA *</label>
                  <select 
                    {...register('danh_muc_id', { valueAsNumber: true })} 
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                  >
                    <option value="">-- CHỌN DANH MỤC --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-white">{c.ten_danh_muc.toUpperCase()}</option>
                    ))}
                  </select>
                  {errors.danh_muc_id && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.danh_muc_id.message}</span>
                  )}
                </div>
              )}
            </div>

            {/* HỘP 2: CẤU HÌNH LÂM SÀNG & CHI PHÍ */}
            {selectedType === 'don_le' && (
              <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 2: CẤU HÌNH LÂM SÀNG & CHI PHÍ</h4>
                
                <div>
                  <label className="block font-bold text-zinc-550 mb-1.5 uppercase tracking-wider text-[10px]">Phòng đặt lịch yêu cầu (Sức chứa) *</label>
                  <select
                    {...register('loai_phong_yeu_cau')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                  >
                    <option value="kham_benh">🩺 Phòng Khám & Lượng giá (Không chiếm giường trị liệu)</option>
                    <option value="phong_tap">🏃 Phòng/Khu tập vận động PHCN (Chiếm 1 slot tập chung)</option>
                    <option value="phong_tri_lieu">💆 Phòng Trị liệu thường (Chiếm 1 giường trị liệu thường)</option>
                    <option value="phong_dac_biet">⚡ Phòng Đặc biệt (Giường kéo giãn/máy cố định)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">THỜI LƯỢNG ĐỊNH MỨC</label>
                    <select 
                      {...register('thoi_gian_uoc_tinh', { valueAsNumber: true })} 
                      className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                    >
                      <option value={10}>10 PHÚT</option>
                      <option value={15}>15 PHÚT</option>
                      <option value={20}>20 PHÚT</option>
                      <option value={30}>30 PHÚT</option>
                      <option value={45}>45 PHÚT</option>
                      <option value={60}>60 PHÚT</option>
                      <option value={90}>90 PHÚT</option>
                      <option value={120}>120 PHÚT</option>
                    </select>
                    {errors.thoi_gian_uoc_tinh && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.thoi_gian_uoc_tinh.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">ĐƠN GIÁ BÁN LẺ (VNĐ) *</label>
                    <input 
                      type="number"
                      {...register('don_gia', { valueAsNumber: true })} 
                      placeholder="0"
                      className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-secondary text-right shadow-sm text-sm"
                    />
                    {errors.don_gia && (
                      <span className="text-rose-500 text-[10px] mt-1 block">{errors.don_gia.message}</span>
                    )}
                  </div>
                </div>


              </div>
            )}

            {/* HỘP 2 FOR CLINICAL TECHNIQUE (Only shows device, hides price & duration) */}
            {selectedType === 'ky_thuat' && (
              <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 2: CÔNG CỤ TRỊ LIỆU</h4>

                <div>
                  <label className="block font-bold text-zinc-550 mb-1.5 uppercase tracking-wider text-[10px]">Phòng đặt lịch yêu cầu (Sức chứa) *</label>
                  <select
                    {...register('loai_phong_yeu_cau')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-semibold text-xs shadow-sm"
                  >
                    <option value="kham_benh">🩺 Phòng Khám & Lượng giá (Không chiếm giường trị liệu)</option>
                    <option value="phong_tap">🏃 Phòng/Khu tập vận động PHCN (Chiếm 1 slot tập chung)</option>
                    <option value="phong_tri_lieu">💆 Phòng Trị liệu thường (Chiếm 1 giường trị liệu thường)</option>
                    <option value="phong_dac_biet">⚡ Phòng Đặc biệt (Giường kéo giãn/máy cố định)</option>
                  </select>
                </div>


              </div>
            )}

            {/* HỘP 3: MÔ TẢ TRỊ LIỆU & QUY TRÌNH LÂM SÀNG */}
            <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 3: QUY TRÌNH LÂM SÀNG CHUYÊN MÔN</h4>
              
              <div>
                <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">MÔ TẢ KHÁI QUÁT SƠ BỘ</label>
                <textarea 
                  {...register('mo_ta')} 
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-semibold text-xs shadow-sm"
                  placeholder="Mô tả công dụng y khoa sơ bộ của kỹ thuật..."
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">QUY TRÌNH THỰC HIỆN CỦA KỸ THUẬT VIÊN (KTV LÀM GÌ)</label>
                <textarea 
                  {...register('mo_ta_chi_tiet')} 
                  rows={3}
                  className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-semibold text-xs shadow-sm"
                  placeholder="Mô tả chi tiết từng bước Kỹ thuật viên sẽ thao tác y khoa trên khách hàng..."
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">LỢI ÍCH TRỊ LIỆU ĐEM LẠI (MỖI LỢI ÍCH NẰM TRÊN 1 DÒNG)</label>
                <textarea 
                  {...register('loai_dich_vu_ho_tro_str')} 
                  rows={3}
                  className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-semibold text-xs shadow-sm"
                  placeholder="Nhập từng lợi ích trị liệu thực tế trên 1 dòng..."
                ></textarea>
              </div>
            </div>

          </div>
          
          {/* Pinned Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/50 shrink-0 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-secondary font-bold rounded-xl shadow-sm transition-all text-center"
            >
              HỦY BỎ
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm hover:shadow-soft-button transition-all text-center"
            >
              {editingService ? 'CẬP NHẬT' : 'TẠO MỚI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ServiceFormModal;

import { Service, Category } from '../types';
import { useServiceForm } from '../hooks/useServiceForm';
import { ALL_DEVICES } from '../constants';

interface ServiceFormModalProps {
  isOpen: boolean;
  selectedType: 'chinh' | 'bo_sung';
  categories: Category[];
  services: Service[];
  editingService: Service | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceFormModal({
  isOpen,
  selectedType,
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
    selectedDevices,
    suggestions,
    handleDeviceCheckboxChange,
    handleAddSuggestedDevice,
    onSubmit
  } = useServiceForm({
    selectedType,
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
              {editingService ? `[CHỈNH SỬA] ${selectedType === 'chinh' ? 'KỸ THUẬT NỘI BỘ' : 'DỊCH VỤ ĐƠN LẺ'}` : `[THÊM MỚI] ${selectedType === 'chinh' ? 'KỸ THUẬT NỘI BỘ' : 'DỊCH VỤ ĐƠN LẺ'}`}
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
                  {selectedType === 'chinh' ? 'TÊN KỸ THUẬT Y KHOA NỘI BỘ *' : 'TÊN DỊCH VỤ LẺ BỔ TRỢ *'}
                </label>
                <input 
                  {...register('ten_dich_vu')} 
                  placeholder={selectedType === 'chinh' ? "Nhập tên kỹ thuật nội bộ (Ví dụ: Giải cơ sâu vùng vai)..." : "Nhập tên dịch vụ lẻ (Ví dụ: Khám lượng giá cột sống)..."}
                  className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-secondary text-sm placeholder-zinc-300 shadow-sm"
                />
                {errors.ten_dich_vu && (
                  <span className="text-rose-500 text-[10px] mt-1 block">{errors.ten_dich_vu.message}</span>
                )}

                {/* Smart Soft Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 items-center bg-zinc-50 border border-dashed border-zinc-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                      💡 GỢI Ý THIẾT BỊ PHÙ HỢP:
                    </span>
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSuggestedDevice(s)}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1 shrink-0"
                      >
                        + Thêm {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedType === 'bo_sung' && (
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
            {selectedType === 'bo_sung' && (
              <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 2: CẤU HÌNH LÂM SÀNG & CHI PHÍ</h4>
                
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

                {/* THIẾT BỊ YÊU CẦU - Checkbox List */}
                <div>
                  <label className="block font-bold text-zinc-550 mb-2 uppercase tracking-wider">THIẾT BỊ YÊU CẦU</label>
                  <input type="hidden" {...register('thiet_bi_yeu_cau')} />
                  <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Option: Không cần thiết bị */}
                    <label className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors border-b border-zinc-100 last:border-b-0 ${
                      selectedDevices.includes('không có') ? 'bg-primary/5' : 'hover:bg-zinc-50'
                    }`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-300 text-primary accent-primary cursor-pointer"
                        checked={selectedDevices.includes('không có')}
                        onChange={() => handleDeviceCheckboxChange('không có')}
                      />
                      <span className="text-xs font-bold text-zinc-600">👐 Không cần thiết bị (Trị liệu bằng tay)</span>
                    </label>
                    {/* Danh sách các thiết bị */}
                    {ALL_DEVICES.filter(d => d.type !== 'hand').map(d => (
                      <label key={d.value} className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors border-b border-zinc-100 last:border-b-0 ${
                        selectedDevices.includes(d.value) ? 'bg-primary/5' : 'hover:bg-zinc-50'
                      }`}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-zinc-300 text-primary accent-primary cursor-pointer"
                          checked={selectedDevices.includes(d.value)}
                          onChange={() => handleDeviceCheckboxChange(d.value)}
                        />
                        <span className="text-xs font-semibold text-zinc-700">{d.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.thiet_bi_yeu_cau && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.thiet_bi_yeu_cau.message}</span>
                  )}
                  {/* Selected summary */}
                  {selectedDevices.length > 0 && !selectedDevices.includes('không có') && (
                    <p className="text-[10px] text-primary font-bold mt-2 px-1">
                      ✓ Đã chọn: {selectedDevices.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* HỘP 2 FOR CLINICAL TECHNIQUE (Only shows device, hides price & duration) */}
            {selectedType === 'chinh' && (
              <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/30 space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-zinc-150 pb-2">HỘP 2: CÔNG CỤ TRỊ LIỆU</h4>

                {/* THIẾT BỊ YÊU CẦU - Checkbox List */}
                <div>
                  <label className="block font-bold text-zinc-550 mb-2 uppercase tracking-wider">THIẾT BỊ Y KHOA YÊU CẦU</label>
                  <input type="hidden" {...register('thiet_bi_yeu_cau')} />
                  <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Option: Không cần thiết bị */}
                    <label className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors border-b border-zinc-100 last:border-b-0 ${
                      selectedDevices.includes('không có') ? 'bg-primary/5' : 'hover:bg-zinc-50'
                    }`}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-300 text-primary accent-primary cursor-pointer"
                        checked={selectedDevices.includes('không có')}
                        onChange={() => handleDeviceCheckboxChange('không có')}
                      />
                      <span className="text-xs font-bold text-zinc-600">👐 Không cần thiết bị (Trị liệu bằng tay)</span>
                    </label>
                    {/* Danh sách các thiết bị */}
                    {ALL_DEVICES.filter(d => d.type !== 'hand').map(d => (
                      <label key={d.value} className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors border-b border-zinc-100 last:border-b-0 ${
                        selectedDevices.includes(d.value) ? 'bg-primary/5' : 'hover:bg-zinc-50'
                      }`}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-zinc-300 text-primary accent-primary cursor-pointer"
                          checked={selectedDevices.includes(d.value)}
                          onChange={() => handleDeviceCheckboxChange(d.value)}
                        />
                        <span className="text-xs font-semibold text-zinc-700">{d.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.thiet_bi_yeu_cau && (
                    <span className="text-rose-500 text-[10px] mt-1 block">{errors.thiet_bi_yeu_cau.message}</span>
                  )}
                  {/* Selected summary */}
                  {selectedDevices.length > 0 && !selectedDevices.includes('không có') && (
                    <p className="text-[10px] text-primary font-bold mt-2 px-1">
                      ✓ Đã chọn: {selectedDevices.join(', ')}
                    </p>
                  )}
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

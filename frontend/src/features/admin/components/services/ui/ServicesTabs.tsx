import { Service } from '../types';

interface ServicesTabsProps {
  selectedType: 'ky_thuat' | 'don_le';
  onSelectType: (type: 'ky_thuat' | 'don_le') => void;
  services: Service[];
}

export function ServicesTabs({ selectedType, onSelectType, services }: ServicesTabsProps) {
  const countKyThuat = services.filter(s => s.loai_danh_muc === 'ky_thuat').length;
  const countDonLe = services.filter(s => s.loai_danh_muc === 'dich_vu').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1: Kỹ thuật */}
      <div 
        onClick={() => onSelectType('ky_thuat')}
        className={`cursor-pointer relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between group select-none min-h-[145px] ${
          selectedType === 'ky_thuat'
            ? 'bg-gradient-to-br from-zinc-700 to-slate-900 border-zinc-700 text-white shadow-lg shadow-zinc-700/10 scale-[1.01]'
            : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400 hover:shadow-md hover:scale-[1.005]'
        }`}
      >
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
              selectedType === 'ky_thuat' 
                ? 'bg-white/20 text-white' 
                : 'bg-teal-50 text-teal-600 border border-teal-200'
            }`}>
              KỸ THUẬT LÂM SÀNG
            </span>
            <h3 className={`text-base font-black tracking-tight mt-2.5 ${
              selectedType === 'ky_thuat' ? 'text-white' : 'text-secondary'
            }`}>
              KỸ THUẬT
            </h3>
            <p className={`text-[11px] leading-normal font-semibold mt-1.5 max-w-[85%] ${
              selectedType === 'ky_thuat' ? 'text-slate-200/90' : 'text-zinc-500'
            }`}>
              Chứa danh mục các kỹ thuật lâm sàng chuyên biệt dùng để thiết lập phác đồ điều trị trị liệu trọn gói, được cấu hình trực tiếp vào gói.
            </p>
          </div>
          
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
            selectedType === 'ky_thuat'
              ? 'bg-white/20 text-white border border-white/25'
              : 'bg-teal-50 text-teal-600 border border-teal-200'
          }`}>
            🩺
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-current/15">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{countKyThuat}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">kỹ thuật</span>
          </div>
          {selectedType === 'ky_thuat' && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-white text-zinc-700 px-3 py-1 rounded-lg shadow-sm border border-zinc-200">
              ĐANG CHỌN
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Đơn lẻ */}
      <div 
        onClick={() => onSelectType('don_le')}
        className={`cursor-pointer relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between group select-none min-h-[145px] ${
          selectedType === 'don_le'
            ? 'bg-gradient-to-br from-zinc-700 to-slate-900 border-zinc-700 text-white shadow-lg shadow-zinc-700/10 scale-[1.01]'
            : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400 hover:shadow-md hover:scale-[1.005]'
        }`}
      >
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
              selectedType === 'don_le' 
                ? 'bg-white/20 text-white' 
                : 'bg-amber-50 text-amber-600 border border-amber-250'
            }`}>
              DỊCH VỤ ĐƠN LẺ
            </span>
            <h3 className={`text-base font-black tracking-tight mt-2.5 ${
              selectedType === 'don_le' ? 'text-white' : 'text-secondary'
            }`}>
              ĐƠN LẺ
            </h3>
            <p className={`text-[11px] leading-normal font-semibold mt-1.5 max-w-[85%] ${
              selectedType === 'don_le' ? 'text-slate-200/90' : 'text-zinc-500'
            }`}>
              Chứa các phân nhóm dịch vụ lượng giá ban đầu, các phương pháp lẻ chuyên sâu hay dịch vụ add-on bổ sung cho khách hàng đặt lịch hẹn lẻ.
            </p>
          </div>
          
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
            selectedType === 'don_le'
              ? 'bg-white/20 text-white border border-white/25'
              : 'bg-amber-50 text-amber-600 border border-amber-250'
          }`}>
            ✨
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-current/15">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{countDonLe}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">dịch vụ đơn lẻ</span>
          </div>
          {selectedType === 'don_le' && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-white text-zinc-700 px-3 py-1 rounded-lg shadow-sm border border-zinc-200">
              ĐANG CHỌN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServicesTabs;

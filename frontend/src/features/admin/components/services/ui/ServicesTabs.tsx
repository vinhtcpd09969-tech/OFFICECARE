import { Service } from '../types';

interface ServicesTabsProps {
  selectedType: 'chinh' | 'bo_sung';
  onSelectType: (type: 'chinh' | 'bo_sung') => void;
  services: Service[];
}

export function ServicesTabs({ selectedType, onSelectType, services }: ServicesTabsProps) {
  const countChinh = services.filter(s => s.loai_dich_vu === 'chinh').length;
  const countBoSung = services.filter(s => s.loai_dich_vu === 'bo_sung').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1: Kỹ thuật lâm sàng nội bộ */}
      <div 
        onClick={() => onSelectType('chinh')}
        className={`cursor-pointer relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between group select-none min-h-[145px] ${
          selectedType === 'chinh'
            ? 'bg-gradient-to-br from-zinc-700 to-slate-900 border-zinc-700 text-white shadow-lg shadow-zinc-700/10 scale-[1.01]'
            : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400 hover:shadow-md hover:scale-[1.005]'
        }`}
      >
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
              selectedType === 'chinh' 
                ? 'bg-white/20 text-white' 
                : 'bg-teal-50 text-teal-600 border border-teal-200'
            }`}>
              Nội bộ (Phác đồ gói)
            </span>
            <h3 className={`text-base font-black tracking-tight mt-2.5 ${
              selectedType === 'chinh' ? 'text-white' : 'text-secondary'
            }`}>
              KỸ THUẬT LÂM SÀNG NỘI BỘ
            </h3>
            <p className={`text-[11px] leading-normal font-semibold mt-1.5 max-w-[85%] ${
              selectedType === 'chinh' ? 'text-slate-200/90' : 'text-zinc-500'
            }`}>
              Chứa danh mục các kỹ thuật lâm sàng chuyên biệt dùng để thiết lập phác đồ điều trị trị liệu trọn gói, được cấu hình trực tiếp vào gói.
            </p>
          </div>
          
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
            selectedType === 'chinh'
              ? 'bg-white/20 text-white border border-white/25'
              : 'bg-teal-50 text-teal-600 border border-teal-200'
          }`}>
            🩺
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-current/15">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{countChinh}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">kỹ thuật nội bộ</span>
          </div>
          {selectedType === 'chinh' && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-white text-zinc-700 px-3 py-1 rounded-lg shadow-sm border border-zinc-200">
              ĐANG CHỌN
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Dịch vụ đơn lẻ bổ trợ */}
      <div 
        onClick={() => onSelectType('bo_sung')}
        className={`cursor-pointer relative overflow-hidden rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between group select-none min-h-[145px] ${
          selectedType === 'bo_sung'
            ? 'bg-gradient-to-br from-zinc-700 to-slate-900 border-zinc-700 text-white shadow-lg shadow-zinc-700/10 scale-[1.01]'
            : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400 hover:shadow-md hover:scale-[1.005]'
        }`}
      >
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
              selectedType === 'bo_sung' 
                ? 'bg-white/20 text-white' 
                : 'bg-amber-50 text-amber-600 border border-amber-250'
            }`}>
              Dịch vụ lẻ bổ trợ
            </span>
            <h3 className={`text-base font-black tracking-tight mt-2.5 ${
              selectedType === 'bo_sung' ? 'text-white' : 'text-secondary'
            }`}>
              DỊCH VỤ ĐƠN LẺ BỔ TRỢ
            </h3>
            <p className={`text-[11px] leading-normal font-semibold mt-1.5 max-w-[85%] ${
              selectedType === 'bo_sung' ? 'text-slate-200/90' : 'text-zinc-500'
            }`}>
              Chứa các phân nhóm dịch vụ lượng giá ban đầu, các phương pháp lẻ chuyên sâu hay dịch vụ add-on bổ sung cho khách hàng đặt lịch hẹn lẻ.
            </p>
          </div>
          
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm ${
            selectedType === 'bo_sung'
              ? 'bg-white/20 text-white border border-white/25'
              : 'bg-amber-50 text-amber-600 border border-amber-250'
          }`}>
            ✨
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-current/15">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{countBoSung}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">dịch vụ đơn lẻ</span>
          </div>
          {selectedType === 'bo_sung' && (
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

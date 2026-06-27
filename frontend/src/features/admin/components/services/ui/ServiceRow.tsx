import { Service } from '../types';
import { getServiceImage, isSharedLibraryService, currencyFormatter } from '../constants';

interface ServiceRowProps {
  svc: Service;
  selectedType: 'chinh' | 'bo_sung';
  pkgCount: number;
  usageNames: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceRow({
  svc,
  selectedType,
  pkgCount,
  usageNames,
  isExpanded,
  onToggleExpand,
  onToggleStatus,
  onEdit,
  onDelete
}: ServiceRowProps) {
  const shared = isSharedLibraryService(svc);

  return (
    <tr className={`hover:bg-zinc-50/80 transition-colors ${svc.trang_thai === 'vo_hieu' ? 'bg-zinc-50/30 opacity-70' : ''}`}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <img src={getServiceImage(svc.id)} alt={svc.ten_dich_vu} className="w-10 h-10 rounded-xl border border-zinc-200 object-cover shadow-sm shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-extrabold text-secondary text-sm">{svc.ten_dich_vu}</p>
              {selectedType === 'bo_sung' && (
                <span className="text-[9px] text-primary font-bold bg-primary-container border border-primary/20 px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0">
                  {svc.ten_danh_muc || 'Không phân loại'}
                </span>
              )}
              {shared && (
                <span className="text-[9px] font-heading font-bold bg-zinc-100 border border-zinc-200 text-zinc-650 px-1.5 py-0.5 rounded shrink-0">
                  DÙNG CHUNG
                </span>
              )}
            </div>
            {svc.thiet_bi_yeu_cau && (
              <span className="text-[9px] text-zinc-400 mt-0.5 inline-block">
                THIẾT BỊ: {svc.thiet_bi_yeu_cau.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Expand details button */}
          <button
            type="button"
            onClick={onToggleExpand}
            className={`p-1.5 rounded-lg border flex items-center justify-center transition-all shrink-0 hover:bg-zinc-50 ${
              isExpanded 
                ? 'bg-primary-container border-primary/30 text-primary shadow-sm' 
                : 'bg-white border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:border-zinc-300'
            }`}
            title="Xem mô tả quy trình & lợi ích"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.024 10.024 0 014.507-5.323m3.36-.262A2.97 2.97 0 0012 6.5a3 3 0 00-3 3 2.97 2.97 0 00.263 1.255m7.86 4.93A10.007 10.007 0 0121.542 12c-1.274 4.057-5.064 7-9.542 7-1.106 0-2.17-.18-3.155-.515M12 9a3 3 0 100 6 3 3 0 000-6zm0 0v6" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
              )}
            </svg>
          </button>
        </div>
      </td>

      {selectedType === 'chinh' ? (
        <td className="p-4">
          {pkgCount > 0 ? (
            <div className="relative group inline-block">
              <span className="cursor-help inline-flex items-center px-2 py-0.5 rounded-lg border border-zinc-200 bg-zinc-100 text-primary text-[10px] font-bold uppercase hover:bg-primary-container transition-colors font-heading">
                {pkgCount} GÓI
              </span>
              
              <div className="pointer-events-none absolute left-0 bottom-full mb-1 w-64 p-3 bg-secondary text-[11px] text-zinc-350 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 space-y-1.5 border border-zinc-800 leading-normal">
                <p className="font-bold text-primary uppercase tracking-wider mb-1 border-b border-zinc-800 pb-1 text-[10px]">Xuất hiện trong các gói:</p>
                {usageNames.map((name, index) => (
                  <p key={index} className="truncate">• {name}</p>
                ))}
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-zinc-150 bg-zinc-50 text-zinc-400 text-[10px] font-bold uppercase font-heading">
              CHƯA DÙNG
            </span>
          )}
        </td>
      ) : (
        <>
          <td className="p-4">
            <span className="font-bold text-secondary text-xs uppercase">
              {svc.ten_danh_muc || 'CHƯA CÓ'}
            </span>
          </td>
          <td className="p-4 text-right font-bold text-zinc-650 text-xs">
            {svc.thoi_gian_uoc_tinh} PHÚT
          </td>
          <td className="p-4 text-right font-bold text-emerald-600 text-sm">
            {currencyFormatter.format(svc.don_gia)}đ
          </td>
        </>
      )}

      <td className="p-4">
        <div className="flex justify-center items-center gap-2">
          <button 
            onClick={onToggleStatus}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              svc.trang_thai === 'hoat_dong' ? 'bg-primary' : 'bg-zinc-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                svc.trang_thai === 'hoat_dong' ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-[9px] font-bold uppercase tracking-wider font-heading ${
            svc.trang_thai === 'hoat_dong' ? 'text-primary' : 'text-zinc-400'
          }`}>
            {svc.trang_thai === 'hoat_dong' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}
          </span>
        </div>
      </td>
      
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={onEdit}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary hover:bg-primary-container transition-all active:scale-90 bg-white shadow-sm"
            title="Chỉnh sửa dịch vụ"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button 
            onClick={onDelete}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-90 bg-white shadow-sm"
            title="Xóa dịch vụ"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
export default ServiceRow;

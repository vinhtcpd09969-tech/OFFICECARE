import { Service } from '../types';
import { getServiceBenefits } from '../constants';

interface ServiceDetailRowProps {
  svc: Service;
  selectedType: 'chinh' | 'bo_sung';
}

export function ServiceDetailRow({ svc, selectedType }: ServiceDetailRowProps) {
  const benefits = getServiceBenefits(svc);

  return (
    <tr className="bg-primary/5 select-none animate-in fade-in duration-200">
      <td colSpan={selectedType === 'chinh' ? 4 : 6} className="p-4 border-b border-zinc-200">
        <div className="bg-white border border-primary/20 rounded-xl p-5 space-y-4 shadow-inner">
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>👨‍⚕️ CHI TIẾT THỰC HIỆN CỦA KỸ THUẬT VIÊN:</span>
            </p>
            <p className="text-xs text-secondary mt-1.5 font-semibold leading-relaxed">
              {svc.mo_ta_chi_tiet || svc.mo_ta_ngan || svc.mo_ta || "Chưa có mô tả quy trình thực hiện cụ thể cho kỹ thuật này."}
            </p>
          </div>
          <div className="border-t border-zinc-150 pt-3">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯 LỢI ÍCH ĐIỀU TRỊ MANG LẠI CHO KHÁCH HÀNG:</span>
            </p>
            <ul className="list-disc pl-4 text-xs text-zinc-650 mt-1.5 space-y-1">
              {benefits.map((benefit, bIdx) => (
                <li key={bIdx} className="font-semibold leading-normal">{benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      </td>
    </tr>
  );
}
export default ServiceDetailRow;

import React from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import { PatientVisit } from '../../../api/doctor.api';

interface VisitColumnProps {
  visits: PatientVisit[];
  onOpenVisit: (id: string) => void;
}

const VISIT_STATUS_META: Record<string, { label: string; badge: string }> = {
  hoan_thanh: { label: 'Hoàn thành', badge: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border-emerald-150/40 dark:border-emerald-900/30' },
  da_huy: { label: 'Đã hủy', badge: 'bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-150/40 dark:border-rose-900/30' },
  da_huy_phat: { label: 'Đã hủy', badge: 'bg-rose-50 dark:bg-rose-950/15 text-rose-600 dark:text-rose-400 border-rose-150/40 dark:border-rose-900/30' },
  khong_den: { label: 'Không đến', badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200/50' },
  khach_khong_den: { label: 'Không đến', badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200/50' },
  khach_khong_den_phat: { label: 'Không đến', badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200/50' },
};
const getVisitStatusMeta = (t: string) => VISIT_STATUS_META[t] || { label: t, badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200/50' };

const formatDateTime = (d?: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return 'N/A'; }
};

/** Cột phải "Khám & Dịch vụ lẻ" — mirror đúng bảng phải của Admin: khám lâm sàng + dịch vụ lẻ độc lập
 * gộp chung 1 danh sách theo ngày, KHÔNG lẫn vào cột Phác đồ điều trị bên trái. */
export const VisitColumn: React.FC<VisitColumnProps> = ({ visits, onOpenVisit }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
        <FileText size={12} /> Khám &amp; Dịch vụ lẻ ({visits.length})
      </h3>
      {visits.length === 0 ? (
        <div className="bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold px-4">
          Bệnh nhân chưa có lịch sử ca khám hoặc dịch vụ lẻ nào.
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => {
            const statusMeta = getVisitStatusMeta(v.trang_thai);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onOpenVisit(v.id)}
                className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${v.loai === 'KHAM' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                      {v.loai === 'KHAM' ? 'Khám lâm sàng' : 'Dịch vụ lẻ'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${statusMeta.badge}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-secondary dark:text-zinc-100 mt-1.5 truncate">
                    {v.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : (v.ten_dich_vu || 'Trị liệu dịch vụ lẻ')}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 truncate">
                    {formatDateTime(v.thoi_gian)} • Thực hiện: {v.ten_nhan_su || 'Chưa phân công'}
                  </p>
                </div>
                <span className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-primary text-white dark:text-zinc-950 rounded-lg text-[10px] font-black">
                  Chi tiết <ChevronRight size={12} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

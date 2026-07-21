import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, Phone, Mail, Bell, CalendarPlus, ClipboardList, History } from 'lucide-react';
import { statusConfig } from '../../../../../components/appointmentStatusConfig';
import { ReputationScore } from './ReputationScore';
import type { CustomerHistoryDetail } from '../types';

interface CustomerHistoryViewProps {
  customer: CustomerHistoryDetail;
  staleDays: number;
  onBack: () => void;
}

const PLAN_STATUS_META: Record<string, { label: string; cls: string }> = {
  cho_kich_hoat: { label: 'Chờ kích hoạt', cls: 'bg-amber-50 text-amber-700 border-amber-150' },
  dang_dieu_tri: { label: 'Đang điều trị', cls: 'bg-teal-50 text-teal-700 border-teal-150' },
  hoan_thanh: { label: 'Hoàn thành', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  huy: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 border-rose-150' },
};

function loaiLabel(loai: string) {
  if (loai === 'KHAM' || loai === 'KHAM_MOI') return 'Khám';
  if (loai === 'DIEU_TRI') return 'Trị liệu';
  return 'Dịch vụ lẻ';
}

export function CustomerHistoryView({ customer, staleDays, onBack }: CustomerHistoryViewProps) {
  const navigate = useNavigate();
  const activePlan = customer.plans.find((p) => p.trang_thai === 'dang_dieu_tri');

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="size-12 rounded-full bg-teal-50 border border-teal-100/60 text-teal-700 font-black flex items-center justify-center text-lg uppercase shrink-0">
            {customer.ho_ten?.charAt(0) || 'K'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900">{customer.ho_ten}</h2>
              <span className="text-[9px] text-slate-400 font-extrabold font-mono">{customer.ma_khach_hang}</span>
              <ReputationScore score={customer.diem_uy_tin} />
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                <Phone size={12} className="text-teal-600" /> {customer.so_dien_thoai || 'Chưa có SĐT'}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-450">
                  <Mail size={12} /> {customer.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {activePlan && (
          <button
            type="button"
            onClick={() => navigate(`/receptionist/appointments?khach_hang_id=${customer.id}&goi_dich_vu_id=${activePlan.goi_dich_vu_id}`)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
          >
            <CalendarPlus size={14} />
            Đặt lịch hẹn tiếp theo cho khách
          </button>
        )}
      </div>

      {/* Banner cần liên hệ lại */}
      {customer.can_lien_he && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-150 rounded-2xl">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
            <Bell size={16} />
          </div>
          <div>
            <p className="text-xs font-black text-rose-800 uppercase tracking-wide">Cần liên hệ lại (đã {staleDays}+ ngày)</p>
            <p className="text-[11px] text-rose-700 font-semibold mt-0.5 leading-relaxed">
              Khách đang điều trị gói &quot;{activePlan?.ten_goi}&quot; nhưng đã lâu chưa quay lại và chưa đặt lịch hẹn mới. Vui lòng gọi khách để nhắc lịch.
            </p>
          </div>
        </div>
      )}

      {/* Gói liệu trình */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList size={14} className="text-teal-600" /> Gói liệu trình ({customer.plans.length})
        </h3>
        {customer.plans.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold italic px-1">Khách hàng chưa có gói liệu trình nào.</p>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3 font-black">Tên gói</th>
                  <th className="p-3 font-black">Trạng thái</th>
                  <th className="p-3 font-black">Tiến độ</th>
                  <th className="p-3 font-black">Ngày kích hoạt</th>
                  <th className="p-3 font-black">Hạn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.plans.map((p) => {
                  const meta = PLAN_STATUS_META[p.trang_thai] || { label: p.trang_thai, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                  const hanDate = p.trang_thai === 'cho_kich_hoat' ? p.han_kich_hoat : p.han_su_dung;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{p.ten_goi}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{p.so_buoi_da_dung} / {p.tong_so_buoi}</td>
                      <td className="p-3 font-semibold text-slate-500">
                        {p.ngay_kich_hoat ? format(new Date(p.ngay_kich_hoat), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="p-3 font-semibold text-slate-500">
                        {hanDate ? format(new Date(hanDate), 'dd/MM/yyyy') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lịch sử cuộc hẹn */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <History size={14} className="text-teal-600" /> Lịch sử cuộc hẹn ({customer.appointments.length})
        </h3>
        {customer.appointments.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold italic px-1">Khách hàng chưa có lịch hẹn nào.</p>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3 font-black">Ngày giờ</th>
                  <th className="p-3 font-black">Loại</th>
                  <th className="p-3 font-black">Dịch vụ</th>
                  <th className="p-3 font-black">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.appointments.map((a) => {
                  const meta = statusConfig[a.trang_thai] || { label: a.trang_thai, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: null };
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-700">
                        {format(new Date(a.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                          {loaiLabel(a.loai)}
                          {a.so_thu_tu_buoi ? ` #${a.so_thu_tu_buoi}` : ''}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{a.ten_dich_vu || 'Khám lâm sàng'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

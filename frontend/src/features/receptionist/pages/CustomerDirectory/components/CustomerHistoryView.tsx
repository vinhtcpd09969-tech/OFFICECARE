import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, Phone, Mail, Bell, CalendarPlus, Calendar, CreditCard, ClipboardList, History } from 'lucide-react';
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
                  <th className="p-3 font-black">Lịch hẹn tiếp theo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.plans.map((p) => {
                  const meta = PLAN_STATUS_META[p.trang_thai] || { label: p.trang_thai, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                  const hanDate = p.trang_thai === 'cho_kich_hoat' ? p.han_kich_hoat : p.han_su_dung;

                  // Lọc lịch hẹn tiếp theo đang chờ diễn ra cho gói này (Chỉ tính các ca CHƯA hoàn thành/hủy)
                  const upcomingAppts = customer.appointments.filter((a) => {
                    const isSamePlan = a.phac_do_dieu_tri_id
                      ? String(a.phac_do_dieu_tri_id) === String(p.id)
                      : String(a.goi_dich_vu_id) === String(p.goi_dich_vu_id) && p.trang_thai === 'dang_dieu_tri';
                    
                    const isPendingOrActive = ['cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'dang_kham'].includes(a.trang_thai);
                    return isSamePlan && isPendingOrActive;
                  }).sort((a, b) => new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime());

                  const nextAppt = upcomingAppts[0];
                  const isPlanCompleted = p.trang_thai === 'hoan_thanh' || (p.so_buoi_da_dung || 0) >= (p.tong_so_buoi || 0);

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
                      <td className="p-3">
                        {nextAppt ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Calendar size={13} className="text-teal-600 shrink-0" />
                              <span>{format(new Date(nextAppt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}</span>
                              {nextAppt.so_thu_tu_buoi && (
                                <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                                  Buổi #{nextAppt.so_thu_tu_buoi}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`inline-flex px-1.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                                statusConfig[nextAppt.trang_thai]?.color || 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {statusConfig[nextAppt.trang_thai]?.label || nextAppt.trang_thai}
                              </span>
                            </div>
                          </div>
                        ) : p.trang_thai === 'cho_kich_hoat' || p.trang_thai === 'khuyen_nghi' ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/receptionist/billing?customer_id=${customer.id}&goi_dich_vu_id=${p.goi_dich_vu_id}&phac_do_id=${p.id}`)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95 shrink-0 cursor-pointer"
                          >
                            <CreditCard size={13} />
                            Thanh toán & Kích hoạt
                          </button>
                        ) : p.trang_thai === 'dang_dieu_tri' && !isPlanCompleted ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/receptionist/appointments?khach_hang_id=${customer.id}&goi_dich_vu_id=${p.goi_dich_vu_id}&phac_do_id=${p.id}&buoi=${(p.so_buoi_da_dung || 0) + 1}`)}
                            className="px-3 py-1.5 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95 shrink-0 cursor-pointer"
                          >
                            <CalendarPlus size={13} />
                            Đặt lịch buổi {(p.so_buoi_da_dung || 0) + 1}
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 italic">Đã hoàn thành</span>
                        )}
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

import { AlertTriangle, PlusCircle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ActiveTreatmentPlansSectionProps {
  activeTreatmentPlans: any[];
  appointments: any[];
  user: any;
  setBookNextSessionPlan: (plan: any) => void;
}

export function ActiveTreatmentPlansSection({
  activeTreatmentPlans,
  appointments,
  user,
  setBookNextSessionPlan
}: ActiveTreatmentPlansSectionProps) {
  if (!activeTreatmentPlans || activeTreatmentPlans.length === 0) return null;

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[28px] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Gói Liệu Trình Đang Điều Trị
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Bạn có thể dễ dàng đặt trước lịch cho các buổi tiếp theo trong phác đồ của mình.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {activeTreatmentPlans.map((plan: any) => {
          const validSessions = appointments.filter((a: any) =>
            a.phac_do_dieu_tri_id === plan.id && a.trang_thai !== 'da_huy'
          );
          const used = Math.max(Number(plan.so_buoi_da_dung || 0), validSessions.length);
          const total = Number(plan.tong_so_buoi || 10);
          const isFinished = used >= total;
          const progressPercent = Math.min(100, Math.round((used / total) * 100));

          const activeSessionAppt = appointments.find((a: any) =>
            a.phac_do_dieu_tri_id === plan.id && ['da_xac_nhan', 'da_checkin', 'dang_kham'].includes(a.trang_thai)
          );

          return (
            <div
              key={plan.id}
              className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-slate-800 transition-all shadow-2xs hover:border-emerald-300"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                  <span>{used}/{total}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 block">
                    Phác đồ trị liệu y khoa
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    {plan.ten_goi_dich_vu || plan.ten_goi}
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right space-y-1">
                  <span className="text-xs font-black text-teal-700">
                    {used} / {total} buổi
                  </span>
                  <div className="w-28 h-2 bg-teal-200/80 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {!isFinished && (
                  activeSessionAppt ? (
                    <button
                      type="button"
                      onClick={() => toast.error(`⚠️ Gói này đang có 1 ca hẹn (Buổi #${activeSessionAppt.so_thu_tu_buoi || used}) ở trạng thái chờ/thực hiện. Vui lòng hoàn thành buổi này trước khi đặt buổi tiếp theo!`)}
                      className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Đã có ca hẹn chưa hoàn thành"
                    >
                      <AlertTriangle size={15} className="text-amber-600" />
                      <span>📅 Đã có lịch Buổi #{activeSessionAppt.so_thu_tu_buoi || used}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBookNextSessionPlan({
                        phac_do_id: plan.id,
                        ten_goi: plan.ten_goi_dich_vu || plan.ten_goi,
                        goi_dich_vu_id: plan.goi_dich_vu_id,
                        thoi_luong_phut: plan.thoi_luong_phut || 45,
                        tong_so_buoi: total,
                        so_buoi_da_dung: used,
                        khach_hang_id: user?.id || ''
                      })}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PlusCircle size={15} />
                      <span>📅 Đặt lịch buổi tiếp</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

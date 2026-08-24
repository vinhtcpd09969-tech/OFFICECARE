import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle2, DollarSign, CalendarPlus } from 'lucide-react';
import { updateAppointmentStatus as updateAppointmentStatusAdmin } from '../../../../features/admin/api/admin.api';
import { isPlanCancelled, isSessionPaymentSatisfied } from '../../../../utils/billing';

/** Gom dữ liệu hóa đơn gói từ 1 lịch hẹn về đúng shape mà utils/billing mong đợi. */
function toPlanShape(apt: any) {
  return {
    loai_goi: apt.loai_goi,
    hinh_thuc_thanh_toan_goi: apt.hinh_thuc_thanh_toan_goi,
    tong_tien_phai_tra: apt.tong_tien_phai_tra_goi,
    so_tien_da_tra: apt.so_tien_da_tra_goi,
    tong_so_buoi: apt.tong_so_buoi_goi,
    tong_tien_goc: apt.tong_tien_goc_goi,
    so_tien_giam_voucher: apt.so_tien_giam_voucher_goi,
    trang_thai_hoa_don_goi: apt.trang_thai_hoa_don_goi,
  };
}

interface DetailFooterProps {
  selectedAppointment: any;
  isReceptionist: boolean;
  isReceptionistLocked?: boolean;
  hideBilling: boolean;
  isAssigning: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assignStaffId: string;
  assignRoomId: string;
  localGhiChuNoiBo: string;
  appointments?: any[];
}

export function DetailFooter({
  selectedAppointment,
  isReceptionist,
  isReceptionistLocked = false,
  hideBilling,
  isAssigning,
  onClose,
  onSuccess,
  assignStaffId,
  assignRoomId,
  localGhiChuNoiBo,
  appointments = []
}: DetailFooterProps) {
  const navigate = useNavigate();
  const isCompleted = selectedAppointment.trang_thai === 'hoan_thanh';

  return (
    <div className="px-6 py-4 bg-slate-50/70 dark:bg-zinc-850/80 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
      {!hideBilling && ['dieu_tri', 'DIEU_TRI'].includes(selectedAppointment.loai_lich) && isCompleted ? (
        <div className="flex items-center gap-2 flex-1">
          {(() => {
            const isRetail = selectedAppointment.loai_goi === 'LE';
            const isPayPerSession = selectedAppointment.hinh_thuc_thanh_toan_goi === 'tung_buoi';
            const currentSessionNum = Number(selectedAppointment.so_thu_tu_buoi || 1);

            let isSessionPaid = false;
            if (isRetail) {
              isSessionPaid = selectedAppointment.trang_thai_thanh_toan === 'da_thanh_toan';
            } else if (isPayPerSession) {
              isSessionPaid =
                !!selectedAppointment.hoa_don_goi_id &&
                isSessionPaymentSatisfied(toPlanShape(selectedAppointment), currentSessionNum);
            } else {
              isSessionPaid =
                selectedAppointment.trang_thai_thanh_toan === 'da_thanh_toan' ||
                selectedAppointment.trang_thai_hoa_don_goi === 'da_thanh_toan' ||
                (!!selectedAppointment.hoa_don_goi_id &&
                  isSessionPaymentSatisfied(toPlanShape(selectedAppointment), currentSessionNum));
            }

            if (isSessionPaid) {
              const nextSessionNum = currentSessionNum + 1;
              const hasMoreSessions = nextSessionNum <= Number(selectedAppointment.tong_so_buoi_goi || 10);
              const nextSessionAlreadyBooked = appointments.some((apt) =>
                apt.phac_do_dieu_tri_id &&
                selectedAppointment.phac_do_dieu_tri_id &&
                apt.phac_do_dieu_tri_id === selectedAppointment.phac_do_dieu_tri_id &&
                Number(apt.so_thu_tu_buoi) === nextSessionNum &&
                apt.trang_thai !== 'da_huy'
              );
              const showNextSessionAction = !isRetail && hasMoreSessions && !nextSessionAlreadyBooked;
              const isCancelledPlan = isPlanCancelled(toPlanShape(selectedAppointment));
              const needsInstallment2 =
                showNextSessionAction &&
                !isCancelledPlan &&
                !isSessionPaymentSatisfied(toPlanShape(selectedAppointment), nextSessionNum);

              return (
                <div className="flex items-center gap-2 flex-wrap">
                  {!needsInstallment2 && (
                    <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-xl flex items-center gap-1.5 select-none uppercase tracking-wider">
                      <CheckCircle2 size={15} />
                      <span>
                        {isRetail
                          ? 'Đã thanh toán dịch vụ lẻ'
                          : isPayPerSession
                            ? `Đã thanh toán buổi ${currentSessionNum}`
                            : 'Đã thanh toán liệu trình'}
                      </span>
                    </div>
                  )}

                  {needsInstallment2 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAppointment.hinh_thuc_thanh_toan_goi === 'tung_buoi') {
                          const checkoutDest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                          navigate(`${checkoutDest}?customer_id=${selectedAppointment.khach_hang_id}&goi_dich_vu_id=${selectedAppointment.pd_goi_dich_vu_id || selectedAppointment.goi_dich_vu_id}`);
                        } else {
                          const dest = isReceptionist ? '/receptionist/billing' : '/admin/finance';
                          navigate(`${dest}?hoa_don_id=${selectedAppointment.hoa_don_goi_id}`);
                        }
                        onClose();
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      <DollarSign size={15} />
                      <span>Thanh toán</span>
                    </button>
                  )}

                  {showNextSessionAction && !needsInstallment2 && !isCancelledPlan && (
                    <button
                      type="button"
                      onClick={() => {
                        const calendarPath = isReceptionist ? '/receptionist/appointments' : '/admin/appointments';
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        navigate(`${calendarPath}?khach_hang_id=${selectedAppointment.khach_hang_id}&goi_dich_vu_id=${selectedAppointment.pd_goi_dich_vu_id || selectedAppointment.goi_dich_vu_id}&startDate=${todayStr}&endDate=${todayStr}&view=timeline`);
                        onClose();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <CalendarPlus size={15} />
                      <span>Đặt lịch buổi {nextSessionNum} tiếp theo</span>
                    </button>
                  )}
                </div>
              );
            } else {
              const paymentLabel = isPayPerSession
                ? `Thanh toán buổi ${currentSessionNum}`
                : (isRetail ? 'Thanh toán ngay' : 'Thanh toán liệu trình');

              return (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (!isReceptionist) {
                        await updateAppointmentStatusAdmin(selectedAppointment.id, {
                          trang_thai: 'hoan_thanh',
                          bac_si_id: assignStaffId || null,
                          chuyen_gia_id: assignStaffId || null,
                          ky_thuat_vien_id: assignStaffId || null,
                          phong_id: assignRoomId || null,
                          ghi_chu_noi_bo: localGhiChuNoiBo || null
                        });
                      }
                      const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                      navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                      onClose();
                      onSuccess?.();
                    } catch (err: any) {
                      console.error(err);
                      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái hẹn trước khi thanh toán');
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <DollarSign size={15} />
                  <span>{paymentLabel}</span>
                </button>
              );
            }
          })()}
        </div>
      ) : (
        <div />
      )}

      {/* KHỐI PHẢI: NÚT THAO TÁC / ĐÓNG MODAL */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Đóng
        </button>

        {!isCompleted && !isReceptionistLocked && (
          <button
            type="submit"
            disabled={isAssigning}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isAssigning ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
        )}
      </div>
    </div>
  );
}

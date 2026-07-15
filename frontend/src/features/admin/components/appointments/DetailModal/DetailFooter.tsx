import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateAppointmentStatus as updateAppointmentStatusAdmin } from '../../../api/admin.api';
import { updateAppointmentStatus as updateAppointmentStatusRec } from '../../../../receptionist/api/receptionist.api';
import { isPlanCancelled, isSessionPaymentSatisfied } from '../../../../../utils/billing';

/** Gom dữ liệu hóa đơn gói từ 1 lịch hẹn về đúng shape mà utils/billing mong đợi. */
function toPlanShape(apt: any) {
  return {
    loai_goi: apt.loai_goi,
    hinh_thuc_thanh_toan_goi: apt.hinh_thuc_thanh_toan_goi,
    tong_tien_phai_tra: apt.tong_tien_phai_tra_goi,
    so_tien_da_tra: apt.so_tien_da_tra_goi,
    tong_so_buoi: apt.tong_so_buoi_goi,
    tong_tien_goc: apt.tong_tien_goc_goi,
    ti_le_giam_gia_goi: apt.ti_le_giam_gia_goi,
    so_tien_giam_voucher: apt.so_tien_giam_voucher_goi,
    // Cần cho isPlanCancelled: gói đã hoàn tiền thì không đòi tiền, không mời đặt buổi tiếp.
    trang_thai_hoa_don_goi: apt.trang_thai_hoa_don_goi,
  };
}

interface DetailFooterProps {
  selectedAppointment: any;
  isReceptionist: boolean;
  hideBilling: boolean;
  isAssigning: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assignStaffId: string;
  assignRoomId: string;
  localGhiChuNoiBo: string;
  isUnconfirmedState: boolean;
  setAssignStatus: (status: string) => void;
  setCancelReason?: (reason: string) => void;
  setShowConfirmType?: (val: 'save' | 'cancel' | 'receptionist_confirm' | null) => void;
  appointments?: any[];
}



export function DetailFooter({
  selectedAppointment,
  isReceptionist,
  hideBilling,
  isAssigning,
  onClose,
  onSuccess,
  assignStaffId,
  assignRoomId,
  localGhiChuNoiBo,
  setAssignStatus,
  appointments = []
}: DetailFooterProps) {
  const navigate = useNavigate();

  return (
    <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
      {['kham_moi', 'dich_vu_don', 'KHAM', 'DICH_VU_LE'].includes(selectedAppointment.loai_lich) && selectedAppointment.trang_thai === 'hoan_thanh' ? (
        <div className="flex gap-2">
          {selectedAppointment.trang_thai_thanh_toan === 'da_thanh_toan' || 
           (!!selectedAppointment.hoa_don_goi_id && 
            ['tra_thang', 'tra_gop'].includes(selectedAppointment.hinh_thuc_thanh_toan_goi)) ? (
            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-250 text-emerald-600 text-xs font-black rounded-xl flex items-center gap-1.5 select-none uppercase tracking-wider">
              🟢 {['kham_moi', 'KHAM'].includes(selectedAppointment.loai_lich) ? 'Đã thanh toán khám' : 'Đã thanh toán dịch vụ lẻ'}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                onClose();
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all"
            >
              {selectedAppointment.hoa_don_goi_id ? '💵 Chờ thanh toán' : '💵 Thanh toán ngay'}
            </button>
          )}
        </div>
      ) : !hideBilling && ['dieu_tri', 'DIEU_TRI'].includes(selectedAppointment.loai_lich) && selectedAppointment.trang_thai === 'hoan_thanh' ? (
        <div className="flex gap-2">
          {(() => {
            const isRetail = selectedAppointment.loai_goi === 'LE';
            const isPayPerSession = selectedAppointment.hinh_thuc_thanh_toan_goi === 'tung_buoi';
            
            const currentSessionNum = Number(selectedAppointment.so_thu_tu_buoi || 1);

            let isSessionPaid = false;
            if (isRetail) {
              isSessionPaid = selectedAppointment.trang_thai_thanh_toan === 'da_thanh_toan';
            } else if (isPayPerSession) {
              // Buổi HIỆN TẠI (đã hoàn thành) coi là đã trả xong khi số đã đóng đủ cho các buổi
              // 1..N — tức ngưỡng "trước buổi N+1" của getMinPaymentRequired (nguồn chung, đã net
              // hóa voucher). Không dùng đơn giá/buổi tĩnh của gói mẫu (pd_don_gia_theo_buoi) —
              // giá đó bỏ qua voucher đã áp cho hóa đơn này.
              isSessionPaid =
                !!selectedAppointment.hoa_don_goi_id &&
                isSessionPaymentSatisfied(toPlanShape(selectedAppointment), currentSessionNum + 1);
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
              // Buổi tiếp theo đã được đặt (bất kỳ trạng thái nào ngoài đã hủy) thì không cho đặt trùng nữa.
              const nextSessionAlreadyBooked = appointments.some((apt) =>
                apt.phac_do_dieu_tri_id &&
                selectedAppointment.phac_do_dieu_tri_id &&
                apt.phac_do_dieu_tri_id === selectedAppointment.phac_do_dieu_tri_id &&
                Number(apt.so_thu_tu_buoi) === nextSessionNum &&
                apt.trang_thai !== 'da_huy'
              );
              const showNextSessionAction = !isRetail && hasMoreSessions && !nextSessionAlreadyBooked;

              // Buổi hiện tại đã trả đủ KHÔNG có nghĩa buổi kế tiếp được phép đặt: gói trả góp
              // phải đóng xong Đợt 2 trước mốc quy định (docs/BUSINESS_RULES.md mục 3). Nếu chưa
              // đủ, backend sẽ chặn ở createAppointment — nên ở đây phải mời đóng Đợt 2 thay vì
              // mời đặt lịch rồi mới báo lỗi.
              const isCancelledPlan = isPlanCancelled(toPlanShape(selectedAppointment));
              const needsInstallment2 =
                showNextSessionAction &&
                !isCancelledPlan &&
                !isSessionPaymentSatisfied(toPlanShape(selectedAppointment), nextSessionNum);

              return (
                <div className="flex items-center gap-2">
                  {/* Khi đã phải đòi Đợt 2 thì ẩn nhãn "đã thanh toán" đi cho gọn — hai thứ cạnh nhau gây rối. */}
                  {!needsInstallment2 && (
                    <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-250 text-emerald-600 text-xs font-black rounded-xl flex items-center gap-1.5 select-none uppercase tracking-wider">
                      🟢 {isRetail ? 'Đã thanh toán dịch vụ lẻ' : 'Đã thanh toán liệu trình'}
                    </div>
                  )}

                  {needsInstallment2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const dest = isReceptionist ? '/receptionist/billing' : '/admin/finance';
                        navigate(`${dest}?hoa_don_id=${selectedAppointment.hoa_don_goi_id}`);
                        onClose();
                      }}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      💵 {selectedAppointment.hinh_thuc_thanh_toan_goi === 'tra_gop' ? 'Thanh toán Đợt 2' : 'Thanh toán gói'}
                    </button>
                  )}

                  {showNextSessionAction && !needsInstallment2 && !isCancelledPlan && (
                    <button
                      type="button"
                      onClick={() => {
                        const calendarPath = isReceptionist ? '/receptionist/appointments' : '/admin/appointments';
                        navigate(`${calendarPath}?khach_hang_id=${selectedAppointment.khach_hang_id}&goi_dich_vu_id=${selectedAppointment.pd_goi_dich_vu_id || selectedAppointment.goi_dich_vu_id}`);
                        onClose();
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      📅 + Đặt lịch buổi {nextSessionNum} tiếp theo
                    </button>
                  )}
                </div>
              );
            } else {
              return (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const updateFn = isReceptionist ? updateAppointmentStatusRec : updateAppointmentStatusAdmin;
                      await updateFn(selectedAppointment.id, {
                        trang_thai: 'hoan_thanh',
                        bac_si_id: assignStaffId || null,
                        chuyen_gia_id: assignStaffId || null,
                        ky_thuat_vien_id: assignStaffId || null,
                        phong_id: assignRoomId || null,
                        ghi_chu_noi_bo: localGhiChuNoiBo || null
                      });
                      
                      const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                      navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                      onClose();
                      if (onSuccess) {
                        onSuccess();
                      }
                    } catch (err: any) {
                      console.error(err);
                      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái hẹn trước khi thanh toán');
                    }
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-black rounded-xl flex items-center gap-2 transition-all"
                >
                  💵 {isRetail ? 'Thanh toán ngay' : 'Vui lòng thanh toán liệu trình'}
                </button>
              );
            }
          })()}
        </div>
      ) : (
        <div />
      )}

      {/* Right actions */}
      <div className="flex gap-2 ml-auto">
        {selectedAppointment.trang_thai === 'da_xac_nhan' && (['kham_moi', 'KHAM', 'dich_vu_don', 'DICH_VU_LE'].includes(selectedAppointment.loai_lich) || !isReceptionist) && (
          <button
            type="submit"
            onClick={() => setAssignStatus('da_checkin')}
            disabled={isAssigning}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 animate-pulse"
          >
            🛎️ Check-in Khách
          </button>
        )}
        
        <button
          type="submit"
          disabled={isAssigning || selectedAppointment.trang_thai === 'hoan_thanh'}
          className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAssigning ? 'Đang lưu...' : 'Lưu cập nhật'}
        </button>
      </div>
    </div>
  );
}

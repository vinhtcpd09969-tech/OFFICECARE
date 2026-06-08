
import { X, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import axiosInstance from '../../../api/axios';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

interface AppointmentDetailModalProps {
  selectedAppointment: any;
  roomsList: any[];
  staffList: any[];
  activeRole: string;
  assignRoomId: string;
  setAssignRoomId: (val: string) => void;
  assignStaffId: string;
  setAssignStaffId: (val: string) => void;
  assignStatus: string;
  setAssignStatus: (val: string) => void;
  isAssigning: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onOpenTreatment: (type?: 'single' | 'package', recId?: string) => void;
  appointments?: any[];
  onSuccess?: () => void;
  hideBilling?: boolean;
}

export default function AppointmentDetailModal({
  selectedAppointment,
  roomsList,
  staffList,
  activeRole,
  assignRoomId,
  setAssignRoomId,
  assignStaffId,
  setAssignStaffId,
  assignStatus,
  setAssignStatus,
  isAssigning,
  onClose,
  onSave,
  onOpenTreatment,
  appointments = [],
  onSuccess,
  hideBilling = false
}: AppointmentDetailModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isReceptionist = Number(user?.vai_tro_id) === 2;

  if (!selectedAppointment) return null;

  // Logic kiểm tra phòng trống & bác sĩ rảnh dựa vào khung giờ hẹn
  const isOverlapping = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && e1 > s2;
  };

  const currentStart = selectedAppointment.ngay_gio_bat_dau;
  const currentEnd = selectedAppointment.ngay_gio_ket_thuc;

  const overlappingApts = appointments.filter(apt => 
    apt.id !== selectedAppointment.id && 
    apt.trang_thai !== 'da_huy' &&
    apt.trang_thai !== 'khong_den' &&
    isOverlapping(currentStart, currentEnd, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
  );

  const occupiedStaffIds = overlappingApts.map(apt => apt.ky_thuat_vien_id).filter(Boolean);
  const occupiedRoomIds = overlappingApts.map(apt => String(apt.phong_id)).filter(Boolean);

  const availableRooms = roomsList.filter(room => 
    !occupiedRoomIds.includes(String(room.id)) || String(room.id) === String(selectedAppointment.phong_id)
  );
  
  const availableStaff = staffList.filter(staff => 
    !occupiedStaffIds.includes(staff.ky_thuat_vien_id || staff.id) || (staff.ky_thuat_vien_id || staff.id) === selectedAppointment.ky_thuat_vien_id
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Lịch hẹn <span className="text-emerald-600">#{selectedAppointment.ma_lich_dat}</span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">Thông tin chi tiết và điều phối phòng khám</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Khách hàng</label>
              <span className="text-base font-bold text-slate-800 block mt-1">{selectedAppointment.ten_khach_hang}</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Số điện thoại</label>
              <span className="text-base font-medium text-slate-800 block mt-1">{selectedAppointment.so_dien_thoai}</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Thời gian</label>
              {(() => {
                const dateObj = new Date(selectedAppointment.ngay_gio_bat_dau);
                const isValidDate = isValid(dateObj);
                const timeStr = isValidDate ? format(dateObj, 'HH:mm') : '';
                const dateStr = isValidDate ? format(dateObj, 'dd/MM/yyyy') : '';
                return (
                  <>
                    <span className="text-base font-bold text-emerald-600 block mt-1 font-mono">
                      {timeStr || selectedAppointment.ngay_gio_bat_dau}
                    </span>
                    {dateStr && (
                      <span className="text-xs text-slate-500 block font-mono mt-0.5">
                        {dateStr}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Triệu chứng khách hàng điền khi đặt lịch */}
          <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50 space-y-2">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              📝 Triệu chứng khách hàng điền
            </h4>
            <div className="grid grid-cols-1 gap-2.5 text-sm">
              <p className="text-slate-850 bg-white p-3 rounded-lg border border-slate-200/60 text-xs font-semibold italic text-slate-700">
                "{selectedAppointment.ly_do_kham || 'Không mô tả triệu chứng'}"
              </p>
            </div>
          </div>


          {/* Cảnh báo yêu cầu hủy */}
          {selectedAppointment.trang_thai === 'cho_huy' && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 border-l-4 border-l-rose-600 space-y-2 animate-in fade-in">
              <p className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                <AlertCircle size={16} className="text-rose-600 animate-bounce" /> Khách hàng yêu cầu hủy lịch này
              </p>
              <p className="text-sm text-slate-800 font-semibold">
                Lý do khách đưa ra: <span className="font-normal italic text-slate-600">"{selectedAppointment.ly_do_huy || 'Không có lý do chi tiết'}"</span>
              </p>
              <div className="text-xs text-rose-700 font-medium leading-relaxed bg-white/60 p-2.5 rounded border border-rose-100">
                ⚠️ <strong>Quy trình xử lý của Lễ tân:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Gọi điện thoại đến số <strong>{selectedAppointment.so_dien_thoai}</strong> để xác minh lý do hủy.</li>
                  <li>Nếu đồng ý hủy lịch, chọn trạng thái <strong>Đã hủy</strong> bên dưới và bấm <strong>Lưu cập nhật</strong>.</li>
                  <li>Nếu khách muốn giữ lịch hoặc đổi giờ, hỗ trợ khách và cập nhật thông tin tương ứng.</li>
                </ol>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Điều phối & Trạng thái</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Phòng thực hiện</label>
                <select
                  value={assignRoomId}
                  onChange={(e) => setAssignRoomId(e.target.value)}
                  disabled={isReceptionist || selectedAppointment.trang_thai === 'hoan_thanh'}
                  className={`w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${(isReceptionist || selectedAppointment.trang_thai === 'hoan_thanh') ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                >
                  <option value="">-- Chưa xếp phòng --</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.ten_phong}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Nhân sự phụ trách</label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  disabled={isReceptionist || selectedAppointment.trang_thai === 'hoan_thanh'}
                  className={`w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${(isReceptionist || selectedAppointment.trang_thai === 'hoan_thanh') ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                >
                  <option value="">-- Chưa phân công --</option>
                  {availableStaff.filter(s => s.vai_tro === activeRole).map(s => (
                    <option key={s.ky_thuat_vien_id || s.id} value={s.ky_thuat_vien_id || ''}>
                      {s.ho_ten}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Trạng thái ca trực</label>
                <select
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value)}
                  disabled={isReceptionist || selectedAppointment.trang_thai === 'hoan_thanh'}
                  className={`w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium ${(isReceptionist || selectedAppointment.trang_thai === 'hoan_thanh') ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                >
                  <option value="chua_xac_nhan">Chưa xác nhận</option>
                  <option value="cho_xac_nhan">Chờ xác nhận</option>
                  <option value="cho_phan_phong">Chờ phân phòng & bác sĩ y tế (Quản lý)</option>
                  <option value="da_xac_nhan">Đã xác nhận</option>
                  <option value="da_checkin">Đã Check-in</option>
                  <option value="hoan_thanh">Hoàn thành</option>
                  <option value="cho_huy">Chờ hủy (Khách yêu cầu)</option>
                  <option value="da_huy">Đã hủy</option>
                  <option value="khong_den">Không đến</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            {selectedAppointment.loai_lich === 'kham_moi' && selectedAppointment.trang_thai === 'hoan_thanh' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTreatment('single')}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 flex items-center gap-2 transition-all"
                >
                  <Activity size={16} /> Đặt Lịch
                </button>
                {(selectedAppointment.khuyen_nghi_dich_vu_id || selectedAppointment.khuyen_nghi_goi_id) && (
                  <button
                    type="button"
                    onClick={() => onOpenTreatment(selectedAppointment.khuyen_nghi_dich_vu_id ? 'single' : 'package', selectedAppointment.khuyen_nghi_dich_vu_id || selectedAppointment.khuyen_nghi_goi_id)}
                    className="px-4 py-2.5 bg-teal-600 text-white shadow-sm text-sm font-bold rounded-xl hover:bg-teal-700 flex items-center gap-2 transition-all animate-pulse"
                  >
                    🚀 Đặt theo Khuyến nghị
                  </button>
                )}
              </div>
            ) : !hideBilling && selectedAppointment.loai_lich === 'dieu_tri' && Number(selectedAppointment.so_thu_tu_buoi) === 1 && selectedAppointment.trang_thai === 'hoan_thanh' ? (
              <button
                type="button"
                onClick={() => {
                  const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                  navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                  onClose();
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-sm font-black rounded-xl flex items-center gap-2 transition-all animate-pulse"
              >
                💵 Thanh toán Gói trị liệu
              </button>
            ) : selectedAppointment.loai_lich === 'dieu_tri' && selectedAppointment.trang_thai === 'da_xac_nhan' && isReceptionist ? (
              <button
                type="button"
                disabled={isAssigning}
                onClick={async () => {
                  const toastId = toast.loading('Đang xác thực lịch trực và gửi thông báo...');
                  try {
                     await axiosInstance.patch(`/admin/appointments/${selectedAppointment.id}/status`, {
                       trang_thai: 'da_checkin',
                       ky_thuat_vien_id: assignStaffId || null,
                       phong_id: assignRoomId || null
                     });
                     toast.success('Xác thực lịch và gửi thông báo thành công!', { id: toastId });
                     onClose();
                     if (onSuccess) onSuccess();
                  } catch (error: any) {
                     console.error(error);
                     toast.error(error.response?.data?.message || 'Lỗi xác thực lịch trực', { id: toastId });
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-sm font-black rounded-xl flex items-center gap-2 transition-all animate-pulse"
              >
                💵 Xác thực & Gửi thông báo
              </button>
            ) : <div></div>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
              >
                Đóng
              </button>
              {!isReceptionist && (
                <>
                  {selectedAppointment.trang_thai === 'da_xac_nhan' && (
                    <button
                      type="submit"
                      onClick={() => setAssignStatus('da_checkin')}
                      disabled={isAssigning}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                      🛎️ Check-in Khách
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isAssigning || selectedAppointment.trang_thai === 'hoan_thanh'}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? 'Đang lưu...' : 'Lưu cập nhật'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

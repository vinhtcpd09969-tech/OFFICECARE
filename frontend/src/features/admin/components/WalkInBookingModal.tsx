import { useState, useEffect } from 'react';
import { X, Clock, MapPin, User, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { convertToVietnamUtcIso } from '../../../utils/date';

interface WalkInBookingModalProps {
  roomsList: any[];
  staffList: any[];
  appointments: any[];
  schedulesList: any[];
  servicesList?: any[];
  onClose: () => void;
  onSubmitApi: (payload: any) => Promise<void>;
  bookingLoading: boolean;
  initialTime?: string;
}

// Giờ làm việc: Ca 1 (07:00-16:00, nghỉ 12:00-13:00); Ca 2 (11:00-20:00, nghỉ 16:00-17:00)
const BREAK_SLOTS = new Set<string>();

const timeSlots = [
  '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export default function WalkInBookingModal({
  roomsList,
  staffList,
  appointments,
  schedulesList,
  servicesList = [],
  onClose,
  onSubmitApi,
  bookingLoading,
  initialTime = ''
}: WalkInBookingModalProps) {
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [gioiTinh, setGioiTinh] = useState('nam');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isTimeLocked, setIsTimeLocked] = useState(!!initialTime);

  const examServices = servicesList?.filter((s: any) => String(s.danh_muc_id) === '1') || [];

  useEffect(() => {
    if (examServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(examServices[0].id);
    }
  }, [examServices, selectedServiceId]);

  useEffect(() => {
    setSelectedTime(initialTime);
    setIsTimeLocked(!!initialTime);
  }, [initialTime]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter available doctors and rooms for the chosen time slot
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedTime) {
      setAvailableDoctors([]);
      setAvailableRooms([]);
      setSelectedDoctorId('');
      setSelectedRoomId('');
      return;
    }

    // 1. Calculate appointment overlap boundaries
    const aptStartLocal = new Date(`${todayStr}T${selectedTime}:00`);
    const aptEndLocal = new Date(aptStartLocal.getTime() + 30 * 60000);

    const isOverlapping = (start1: Date, end1: Date, start2Str: string, end2Str: string) => {
      const s2 = new Date(start2Str).getTime();
      const e2 = new Date(end2Str).getTime();
      return start1.getTime() < e2 && end1.getTime() > s2;
    };

    // Find all overlapping appointments in this specific slot
    const overlappingApts = appointments.filter(apt => 
      apt.trang_thai !== 'da_huy' &&
      apt.trang_thai !== 'khong_den' &&
      isOverlapping(aptStartLocal, aptEndLocal, apt.ngay_gio_bat_dau, apt.ngay_gio_ket_thuc)
    );

    const occupiedDoctorIds = overlappingApts.map(apt => apt.bac_si_id || apt.chuyen_gia_id).filter(Boolean);


    // 2. Filter Doctors (Bác sĩ) based on schedule duty and overlap
    const doctors = staffList.filter(s => s.vai_tro === 'Bác sĩ');
    const filteredDocs = doctors.map(doc => {
      // Find duty schedule for today
      const docSchedules = schedulesList.filter(s => 
        String(s.nguoi_dung_id) === String(doc.id) && 
        s.ngay === todayStr
      );

      if (docSchedules.length === 0) {
        return { ...doc, available: false, reason: 'Không trực hôm nay' };
      }

      const activeSchedule = docSchedules.find(s => s.trang_thai === 'hoat_dong');
      if (!activeSchedule) {
        return { ...doc, available: false, reason: 'Nghỉ phép cả ngày' };
      }

      const dutyStart = activeSchedule.gio_bat_dau.substring(0, 5);
      const dutyEnd = activeSchedule.gio_ket_thuc.substring(0, 5);

      // Check if selected time slot is covered by doctor shift
      const isCovered = dutyStart <= selectedTime && dutyEnd > selectedTime; // dutyEnd is exclusive
      if (!isCovered) {
        return { ...doc, available: false, reason: `Trực ca ${dutyStart}-${dutyEnd}` };
      }



      // Check if doctor has overlap appointment
      const hasOverlap = occupiedDoctorIds.includes(doc.chuyen_gia_id);
      if (hasOverlap) {
        return { ...doc, available: false, reason: 'Trùng lịch khám khác' };
      }

      return { ...doc, available: true, reason: `Trực ca ${dutyStart}-${dutyEnd}` };
    });

    // 3. Filter Rooms based on overlap
    const filteredRooms = roomsList
      .filter(room => room.loai_phong === 'kham_benh')
      .map(room => {
        const roomOverlaps = overlappingApts.filter(apt => String(apt.phong_id) === String(room.id));
        const occupiedSlots = roomOverlaps.length;
        const capacity = room.suc_chua || 1;
        const isOccupied = occupiedSlots >= capacity;
        return {
          ...room,
          available: !isOccupied,
          occupiedSlots,
          capacity
        };
      });

    setAvailableDoctors(filteredDocs);
    setAvailableRooms(filteredRooms);
    
    // Clear selection if previously selected resource is no longer available
    if (selectedDoctorId && !filteredDocs.find(d => d.chuyen_gia_id === selectedDoctorId && d.available)) {
      setSelectedDoctorId('');
    }
    if (selectedRoomId && !filteredRooms.find(r => String(r.id) === selectedRoomId && r.available)) {
      setSelectedRoomId('');
    }
  }, [selectedTime, appointments, schedulesList, staffList, roomsList, todayStr]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      alert('Vui lòng chọn khung giờ khám!');
      return;
    }
    if (!selectedServiceId) {
      alert('Vui lòng chọn dịch vụ khám!');
      return;
    }
    if (!selectedDoctorId) {
      alert('Vui lòng chọn bác sĩ khám!');
      return;
    }
    if (!selectedRoomId) {
      alert('Vui lòng chọn phòng khám!');
      return;
    }

    // Chuyển đổi giờ cục bộ (VN UTC+7) sang UTC đúng chuẩn độc lập với múi giờ trình duyệt
    const startUtcIso = convertToVietnamUtcIso(todayStr, selectedTime);

    const [h, m] = selectedTime.split(':').map(Number);
    const endMin = (m + 30) % 60;
    const endHour = h + Math.floor((m + 30) / 60);
    const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    const endUtcIso = convertToVietnamUtcIso(todayStr, endTimeStr);

    const payload = {
      ho_ten_khach: hoTen,
      so_dien_thoai: sdt,
      gioi_tinh_khach: gioiTinh,
      ly_do_kham: lyDo || 'Khám lượng giá',
      dich_vu_id: selectedServiceId,
      ngay_gio_bat_dau: startUtcIso,
      ngay_gio_ket_thuc: endUtcIso,
      bac_si_id: selectedDoctorId,
      chuyen_gia_id: selectedDoctorId,
      phong_id: selectedRoomId,
      loai_lich: 'kham_moi',
      trang_thai: 'da_checkin',
      ghi_chu_dat_lich: 'Khách vãng lai đăng ký tại quầy'
    };

    await onSubmitApi(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Stethoscope className="text-emerald-600" size={22} />
              Đăng ký ca Khám Vãng Lai (Walk-in)
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">Đăng ký khám nhanh tại quầy lễ tân - Tự động Check-in</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-thin">
          
          {/* Thông tin hành chính */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Thông tin hành chính bệnh nhân
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Họ tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={hoTen}
                  onChange={e => setHoTen(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10,11}"
                  placeholder="0987654321"
                  value={sdt}
                  onChange={e => setSdt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Giới tính</label>
                <select
                  value={gioiTinh}
                  onChange={e => setGioiTinh(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Dịch vụ khám *</label>
                <select
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                >
                  <option value="">-- Chọn dịch vụ khám --</option>
                  {examServices.map((svc: any) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.ten_dich_vu} ({Number(svc.don_gia).toLocaleString()}đ)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Triệu chứng lâm sàng / Lý do khám</label>
              <textarea
                rows={2}
                placeholder="Đau mỏi vai gáy cấp tính sau khi ngủ dậy..."
                value={lyDo}
                onChange={e => setLyDo(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Chọn khung giờ */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              Chọn khung giờ khám (Hôm nay: {format(new Date(), 'dd/MM/yyyy')})
            </h4>
            {isTimeLocked ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Giờ đăng ký khám</span>
                    <span className="text-base font-black text-emerald-800 font-mono block mt-0.5">{selectedTime}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimeLocked(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-black rounded-lg transition-all"
                >
                  Thay đổi giờ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map(time => {
                  const isSelected = selectedTime === time;
                  const isBreak = BREAK_SLOTS.has(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isBreak}
                      onClick={() => setSelectedTime(time)}
                      title={isBreak ? 'Giờ nghỉ trưa – không đặt lịch' : undefined}
                      className={`py-2 text-xs font-bold rounded-lg border font-mono transition-all ${
                        isBreak
                          ? 'bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed opacity-70'
                          : isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm scale-95'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      {isBreak ? '🌙' : time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedTime && (
            <>
              {/* Chọn Bác Sĩ Trực Khả Dụng */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  Chọn Bác Sĩ khám
                </h4>
                {availableDoctors.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">Không tìm thấy thông tin bác sĩ.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableDoctors.map(doc => {
                      const isSelected = selectedDoctorId === doc.chuyen_gia_id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => doc.available && setSelectedDoctorId(doc.chuyen_gia_id)}
                          className={`p-3.5 border rounded-2xl flex items-center gap-3 transition-all ${
                            doc.available 
                              ? isSelected
                                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10 cursor-pointer'
                                : 'border-slate-150 bg-white hover:border-emerald-300 hover:shadow-sm cursor-pointer'
                              : 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            doc.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                            BS
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{doc.ho_ten}</p>
                            <p className="text-[10px] font-semibold text-slate-450 mt-0.5">{doc.reason}</p>
                          </div>
                          {doc.available && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isSelected ? 'Đã chọn' : 'Sẵn sàng'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chọn Phòng khám khả dụng */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  Chọn phòng khám chuyên khoa
                </h4>
                {availableRooms.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">Không có phòng khám trống.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableRooms.map(room => {
                      const isSelected = selectedRoomId === String(room.id);
                      return (
                        <div
                          key={room.id}
                          onClick={() => room.available && setSelectedRoomId(String(room.id))}
                          className={`p-3 border rounded-2xl text-center transition-all ${
                            room.available
                              ? isSelected
                                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10 cursor-pointer'
                                : 'border-slate-150 bg-white hover:border-emerald-300 hover:shadow-sm cursor-pointer'
                              : 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <p className="text-xs font-black text-slate-800">{room.ten_phong}</p>
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                            room.available 
                              ? isSelected 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-emerald-100 text-emerald-700' 
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {room.available ? (isSelected ? 'Đã chọn' : `Còn: ${room.capacity - room.occupiedSlots}/${room.capacity}`) : 'Bận'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={bookingLoading || !selectedTime || !selectedDoctorId || !selectedRoomId}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {bookingLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang ghi nhận...
                </>
              ) : (
                'Xác nhận check-in ngay'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

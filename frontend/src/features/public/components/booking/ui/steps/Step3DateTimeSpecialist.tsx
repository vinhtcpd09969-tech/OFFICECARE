import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Clock, AlertTriangle, Sparkles, CheckCircle2, User, Award } from 'lucide-react';
import { formatFullDate, isSlotInPast, isSlotUrgent } from '../../constants';
import { convertToVietnamUtcIso } from '../../../../../../utils/date';
import { resolveImageUrl } from '../../../../../../utils/imageUrl';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Step3DateTimeSpecialistProps {
  selectedDate: string;
  selectedTime: string;
  setTimeField: (time: string) => void;
  bookingType: 'kham' | 'dich_vu';
  bookedSlots: string[];
  specialists: any[];
  slotAvailability: Record<string, number[]>;
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
  hasExistingClinicalExam: boolean;
  duration: number;
  setActiveStep: (step: number) => void;
  tempHoldId: string;
  services: any[];
  selectedServiceId: string;
  user: any;
}

export function Step3DateTimeSpecialist({
  selectedDate,
  selectedTime,
  setTimeField,
  bookingType,
  bookedSlots,
  specialists,
  slotAvailability,
  selectedStaffId,
  setSelectedStaffId,
  hasExistingClinicalExam,
  duration,
  setActiveStep,
  tempHoldId,
  services,
  selectedServiceId,
  user
}: Step3DateTimeSpecialistProps) {
  const location = useLocation();
  const interval = duration;

  const handleNextStep = async () => {
    if (selectedDate && selectedTime) {
      const slotStart = selectedTime.split(' - ')[0];
      const ngay_gio_bat_dau = convertToVietnamUtcIso(selectedDate, slotStart);
      try {
        const examService = services.find(s => s.loai_goi === 'KHAM' || s.loai_dich_vu === 'KHAM');
        const targetDichVuId = bookingType === 'dich_vu' ? selectedServiceId : (examService?.id || null);

        await fetch(`${BASE_URL}/client/appointments/hold`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: tempHoldId,
            ngay_gio_bat_dau,
            goi_dich_vu_id: targetDichVuId,
            nhan_su_id: selectedStaffId ? parseInt(selectedStaffId, 10) : null,
            khach_hang_id: user?.id || null,
            so_dien_thoai: user?.so_dien_thoai || null
          })
        });
      } catch (err) {
        console.error('Failed to create temporary hold:', err);
      }
    }
    setActiveStep(4);
  };

  const { morningSlots, afternoonSlots, eveningSlots } = useMemo(() => {
    if (!selectedDate) {
      return { morningSlots: [], afternoonSlots: [], eveningSlots: [] };
    }

    const generateSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const slots: string[] = [];
      let current = new Date();
      current.setHours(startHour, startMinute, 0, 0);

      const end = new Date();
      end.setHours(endHour, endMinute, 0, 0);

      while (true) {
        const slotStart = new Date(current);
        const slotNextStart = new Date(current.getTime() + interval * 60000);

        if (slotNextStart.getTime() > end.getTime()) {
          break;
        }

        const formatTime = (d: Date) => {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}`;
        };

        const slotEnd = new Date(slotStart.getTime() + duration * 60000);
        slots.push(`${formatTime(slotStart)} - ${formatTime(slotEnd)}`);
        current = slotNextStart;
      }
      return slots;
    };

    return {
      morningSlots: generateSlots(8, 0, 12, 0),
      afternoonSlots: generateSlots(12, 0, 18, 0),
      eveningSlots: generateSlots(18, 0, 20, 0)
    };
  }, [selectedDate, interval]);

  const availableSpecialists = useMemo(() => {
    if (!selectedTime) {
      return specialists;
    }
    const slotStartKey = selectedTime.split(' - ')[0];
    const availableIds = slotAvailability[slotStartKey] || [];
    return specialists.filter(spec => availableIds.includes(spec.id));
  }, [specialists, slotAvailability, selectedTime]);

  const checkIsSlotDisabled = (time: string) => {
    const slotStartKey = time.split(' - ')[0];
    const isBooked = bookedSlots.includes(slotStartKey);
    const isPast = isSlotInPast(slotStartKey, selectedDate);

    // Vô hiệu hóa khung giờ nếu hệ thống đã tải xong dữ liệu trực ca nhưng không có bất kỳ chuyên gia/KTV nào sẵn sàng
    const hasSlotData = Object.keys(slotAvailability || {}).length > 0;
    const availableIds = slotAvailability?.[slotStartKey] || [];
    const hasAvailableStaff = availableIds.some((id: number) =>
      specialists.some((spec: any) => Number(spec.id) === Number(id))
    );
    const isNoStaff = hasSlotData && !hasAvailableStaff;

    return isBooked || isPast || isNoStaff;
  };

  return (
    <motion.div
      key="time-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
          <Clock className="text-[#2EC4B6]" size={20} />
          {bookingType === 'kham' ? 'Chọn giờ khám lâm sàng' : 'Chọn giờ trị liệu'}
        </h3>
        <p className="text-xs font-medium text-slate-400">
          Khung giờ trống cho ngày {formatFullDate(selectedDate)}
        </p>
      </div>

      {hasExistingClinicalExam && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold animate-fade-in">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold uppercase tracking-wider text-rose-800 text-[10px]">Cảnh báo: Đạt giới hạn đặt lịch</p>
            <p className="mt-0.5 font-medium text-rose-700">
              Bạn đã đạt giới hạn đặt tối đa 3 dịch vụ ngày <span className="font-extrabold text-rose-900">{formatFullDate(selectedDate)}</span>. Vui lòng chọn ngày khác hoặc liên hệ hotline <span className="font-extrabold text-slate-900">0398 655 332</span> để được hỗ trợ sắp xếp.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6 pt-2">
        {/* Morning slots */}
        {morningSlots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Buổi sáng (08:00 - 12:00)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {morningSlots.map((time) => {
                const isDisabled = checkIsSlotDisabled(time);
                const isSelected = selectedTime === time;

                return (
                  <button
                    type="button"
                    key={time}
                    disabled={isDisabled}
                    onClick={() => setTimeField(time)}
                    className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                      ${isDisabled
                        ? 'bg-slate-50/50 border-slate-105 text-slate-300/80 cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                      }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Afternoon slots */}
        {afternoonSlots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Buổi chiều (12:00 - 18:00)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {afternoonSlots.map((time) => {
                const isDisabled = checkIsSlotDisabled(time);
                const isSelected = selectedTime === time;

                return (
                  <button
                    type="button"
                    key={time}
                    disabled={isDisabled}
                    onClick={() => setTimeField(time)}
                    className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                      ${isDisabled
                        ? 'bg-slate-50/50 border-slate-105 text-slate-300/80 cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                      }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Evening slots */}
        {eveningSlots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-750" /> Buổi tối (18:00 - 20:00)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {eveningSlots.map((time) => {
                const isDisabled = checkIsSlotDisabled(time);
                const isSelected = selectedTime === time;

                return (
                  <button
                    type="button"
                    key={time}
                    disabled={isDisabled}
                    onClick={() => setTimeField(time)}
                    className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                      ${isDisabled
                        ? 'bg-slate-50/50 border-slate-105 text-slate-300/80 cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/20 font-black scale-[1.02]'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-[#2EC4B6]/5 hover:text-[#2EC4B6]'
                      }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Giao diện Thẻ chọn nhân sự (Bác sĩ/KTV) có Avatar & Font chữ cao cấp */}
      <div className="bg-slate-50/80 border border-slate-200/80 p-5 sm:p-6 rounded-[24px] mt-6 space-y-4 font-jakarta shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              {bookingType === 'kham' ? (
                <>
                  <span className="p-1 rounded-lg bg-teal-50 text-[#2EC4B6]">👨‍⚕️</span>
                  <span>Bác sĩ thực hiện lượng giá</span>
                </>
              ) : (
                <>
                  <span className="p-1 rounded-lg bg-teal-50 text-[#2EC4B6]">💆</span>
                  <span>Kỹ thuật viên trị liệu</span>
                </>
              )}
            </label>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {selectedTime
                ? 'Chọn chuyên gia phụ trách hoặc để hệ thống tự động gán ca'
                : 'Vui lòng chọn khung giờ ở trên để xem danh sách chuyên gia'}
            </p>
          </div>

          {selectedTime && availableSpecialists.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#2EC4B6] bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-full">
              <Sparkles size={12} /> {availableSpecialists.length} chuyên gia sẵn sàng
            </span>
          )}
        </div>

        {!selectedTime ? (
          <div className="bg-white border border-dashed border-slate-200 p-5 rounded-2xl text-center space-y-1.5">
            <User size={22} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-400">
              Vui lòng chọn khung giờ khám để xem danh sách chuyên gia có mặt
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tùy chọn 0: Không chọn chuyên gia */}
            <div
              onClick={() => setSelectedStaffId('')}
              className={`p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-3.5 select-none relative ${
                !selectedStaffId
                  ? 'bg-white border-[#2EC4B6] shadow-md shadow-[#2EC4B6]/10 ring-2 ring-[#2EC4B6]/10'
                  : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                !selectedStaffId ? 'bg-[#2EC4B6] text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <User size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-black text-slate-900 truncate">Không chọn</h5>
                <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                  Chưa chỉ định chuyên gia cụ thể
                </p>
              </div>

              {!selectedStaffId && (
                <div className="shrink-0 text-[#2EC4B6]">
                  <CheckCircle2 size={18} className="fill-[#2EC4B6] text-white" />
                </div>
              )}
            </div>

            {/* Các thẻ Chuyên gia có Avatar */}
            {availableSpecialists.map((spec) => {
              const isSelected = String(selectedStaffId) === String(spec.id);
              const rawAvatar = spec.anh_dai_dien || spec.avatar_url;
              const avatarSrc = rawAvatar
                ? resolveImageUrl(rawAvatar)
                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(spec.ho_ten)}`;
              const isPreSelected = spec.id === Number(location.state?.selectedDoctorId);
              const roleTitle = spec.chuc_danh || spec.chuyen_khoa || (bookingType === 'kham' ? 'Bác sĩ Chuyên khoa' : 'Kỹ thuật viên Trị liệu');

              return (
                <div
                  key={spec.id}
                  onClick={() => setSelectedStaffId(String(spec.id))}
                  className={`p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-3.5 select-none relative ${
                    isSelected
                      ? 'bg-white border-[#2EC4B6] shadow-md shadow-[#2EC4B6]/10 ring-2 ring-[#2EC4B6]/10'
                      : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={avatarSrc}
                      alt={spec.ho_ten}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-150 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(spec.ho_ten)}`;
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="text-xs font-black text-slate-900 truncate">{spec.ho_ten}</h5>
                      {isPreSelected && (
                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Đã chọn trước</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5 flex items-center gap-1">
                      <Award size={10} className="text-[#2EC4B6] shrink-0" />
                      <span>{roleTitle}</span>
                    </p>
                  </div>

                  {isSelected && (
                    <div className="shrink-0 text-[#2EC4B6]">
                      <CheckCircle2 size={18} className="fill-[#2EC4B6] text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedTime && (
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pt-1">
            {availableSpecialists.length > 0
              ? `💡 Khung giờ ${selectedTime} có ${availableSpecialists.length} chuyên gia phù hợp ca trực và chưa bận lịch.`
              : 'Không có chuyên gia nào phù hợp cho khung giờ này. Vui lòng chọn khung giờ khác hoặc liên hệ hotline.'}
          </p>
        )}
      </div>

      {selectedTime && isSlotUrgent(selectedTime.split(' - ')[0], selectedDate) && (
        <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold animate-fade-in mt-4">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold uppercase tracking-wider text-amber-800 text-[10px]">Cảnh báo: Lịch hẹn cận giờ (Dưới 2 tiếng)</p>
            <p className="mt-0.5 font-medium text-amber-700">
              Khung giờ bạn chọn bắt đầu rất gần thời điểm hiện tại. Vui lòng di chuyển sớm để có mặt trước 10 phút. Hotline hỗ trợ gấp: <span className="font-extrabold text-slate-900">0398 655 332</span>.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={!selectedTime || (hasExistingClinicalExam && bookingType === 'kham')}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Điền Thông Tin
        </button>
      </div>
    </motion.div>
  );
}

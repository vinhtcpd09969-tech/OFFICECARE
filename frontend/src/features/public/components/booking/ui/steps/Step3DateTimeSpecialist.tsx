import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Clock, Sparkles, CheckCircle2, User, Award, Sun, Moon } from 'lucide-react';
import { BUOI_INFO, Buoi, formatFullDate, isBuoiDaQua } from '../../constants';
import { BuoiAvailability } from '../../hooks/useBookingState';
import { resolveImageUrl } from '../../../../../../utils/imageUrl';

interface Step3DateTimeSpecialistProps {
  selectedDate: string;
  selectedBuoi: Buoi | '';
  setBuoiField: (buoi: Buoi | '') => void;
  bookingType: 'kham' | 'dich_vu';
  buoiAvailability: BuoiAvailability;
  selectedStaffId: string;
  setSelectedStaffId: (id: string) => void;
  duration: number;
  setActiveStep: (step: number) => void;
}

/** Mức độ đông chỉ hiển thị dạng khoảng cho khách (B9) — không lộ số phút chính xác. */
function mucDoDong(conLaiChung: number, duration: number): { label: string; className: string } {
  if (conLaiChung < duration) return { label: 'Không còn đủ chỗ', className: 'text-rose-500' };
  if (conLaiChung >= duration * 4) return { label: 'Còn nhiều chỗ', className: 'text-emerald-600' };
  if (conLaiChung >= duration * 2) return { label: 'Còn chỗ', className: 'text-amber-600' };
  return { label: 'Sắp đầy', className: 'text-orange-600' };
}

export function Step3DateTimeSpecialist({
  selectedDate,
  selectedBuoi,
  setBuoiField,
  bookingType,
  buoiAvailability,
  selectedStaffId,
  setSelectedStaffId,
  duration,
  setActiveStep
}: Step3DateTimeSpecialistProps) {
  const location = useLocation();

  const handleNextStep = () => {
    if (!selectedBuoi) return;
    setActiveStep(4);
  };

  const buoiOptions = useMemo(() => (['sang', 'chieu'] as Buoi[]).map((key) => {
    const info = buoiAvailability[key];
    const daQua = isBuoiDaQua(selectedDate, key);
    const disabled = daQua || !info.choPhep;
    return { key, info, daQua, disabled };
  }), [buoiAvailability, selectedDate]);

  const availableSpecialists = useMemo(() => {
    if (!selectedBuoi) return [];
    return buoiAvailability.nhanSu.filter(spec => {
      const conLai = selectedBuoi === 'sang' ? spec.conLaiSang : spec.conLaiChieu;
      return conLai >= duration;
    });
  }, [buoiAvailability, selectedBuoi, duration]);

  return (
    <motion.div
      key="buoi-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
          <Clock className="text-[#2EC4B6]" size={20} />
          {bookingType === 'kham' ? 'Chọn buổi lượng giá' : 'Chọn buổi trị liệu'}
        </h3>
        <p className="text-xs font-medium text-slate-400">
          Buổi còn nhận khách cho ngày {formatFullDate(selectedDate)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buoiOptions.map(({ key, info, daQua, disabled }) => {
          const isSelected = selectedBuoi === key;
          const muc = mucDoDong(info.conLaiChung, duration);
          const Icon = key === 'sang' ? Sun : Moon;

          return (
            <button
              type="button"
              key={key}
              disabled={disabled}
              onClick={() => setBuoiField(key)}
              className={`text-left p-5 rounded-[24px] border-2 transition-all duration-200 relative
                ${disabled
                  ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                  : isSelected
                    ? 'bg-white border-[#2EC4B6] shadow-lg shadow-[#2EC4B6]/10 ring-2 ring-[#2EC4B6]/10'
                    : 'bg-white border-slate-200/80 hover:border-[#2EC4B6] hover:shadow-md'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  disabled ? 'bg-slate-100 text-slate-300' : isSelected ? 'bg-[#2EC4B6] text-white' : 'bg-teal-50 text-[#2EC4B6]'
                }`}>
                  <Icon size={20} />
                </div>
                {isSelected && (
                  <CheckCircle2 size={20} className="text-[#2EC4B6] fill-[#2EC4B6]" />
                )}
              </div>
              <h4 className="text-sm font-jakarta font-black text-slate-900">{BUOI_INFO[key].label}</h4>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{BUOI_INFO[key].khung}</p>
              <p className={`text-[11px] font-black mt-2 ${disabled ? 'text-slate-300' : muc.className}`}>
                {daQua ? 'Đã qua giờ nhận khách' : !info.choPhep ? 'Buổi này đã hết chỗ' : muc.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Giao diện Thẻ chọn nhân sự (Bác sĩ/KTV) có Avatar & Font chữ cao cấp */}
      <div className="bg-slate-50/80 border border-slate-200/80 p-5 sm:p-6 rounded-[24px] mt-6 space-y-4 font-jakarta shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              {bookingType === 'kham' ? (
                <>
                  <span className="p-1 rounded-lg bg-teal-50 text-[#2EC4B6]">👨‍⚕️</span>
                  <span>Chuyên viên thực hiện lượng giá</span>
                </>
              ) : (
                <>
                  <span className="p-1 rounded-lg bg-teal-50 text-[#2EC4B6]">💆</span>
                  <span>Kỹ thuật viên trị liệu</span>
                </>
              )}
            </label>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {selectedBuoi
                ? 'Chọn chuyên gia phụ trách hoặc để hệ thống tự động gán khi bạn đến'
                : 'Vui lòng chọn buổi ở trên để xem danh sách chuyên gia'}
            </p>
          </div>

          {selectedBuoi && availableSpecialists.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#2EC4B6] bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-full">
              <Sparkles size={12} /> {availableSpecialists.length} chuyên gia sẵn sàng
            </span>
          )}
        </div>

        {!selectedBuoi ? (
          <div className="bg-white border border-dashed border-slate-200 p-5 rounded-2xl text-center space-y-1.5">
            <User size={22} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-400">
              Vui lòng chọn buổi để xem danh sách chuyên gia có mặt
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tùy chọn 0: Không chọn chuyên gia (Bất kỳ — mô hình kéo) */}
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
                <h5 className="text-xs font-black text-slate-900 truncate">Bất kỳ</h5>
                <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                  Hệ thống gán người phù hợp nhất khi bạn đến
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
              const avatarSrc = spec.anh_dai_dien
                ? resolveImageUrl(spec.anh_dai_dien)
                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(spec.ho_ten)}`;
              const isPreSelected = spec.id === Number(location.state?.selectedDoctorId);

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
                      <span>Trực {spec.caTruc}</span>
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

        {selectedBuoi && (
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pt-1">
            {availableSpecialists.length > 0
              ? `💡 ${BUOI_INFO[selectedBuoi].label} có ${availableSpecialists.length} chuyên gia phù hợp ca trực và còn đủ chỗ cho dịch vụ này.`
              : 'Không có chuyên gia nào còn đủ chỗ riêng cho dịch vụ này — chọn "Bất kỳ" để hệ thống xếp vào hàng chờ chung.'}
          </p>
        )}
      </div>

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
          disabled={!selectedBuoi}
          className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Điền Thông Tin
        </button>
      </div>
    </motion.div>
  );
}

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  Award,
  ShieldCheck,
  User,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  ArrowRight,
  Phone
} from 'lucide-react';
import { BookingState } from '../types';
import {
  formatLocalDate,
  getMockAvailableSlots,
  getVietnameseDay,
  isSlotInPast,
  isSlotUrgent,
  formatFullDate
} from '../constants';

interface BookingStepCardProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  bookingType: 'kham' | 'dich_vu';
  setBookingType: (type: 'kham' | 'dich_vu') => void;
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  services: any[];
  servicesLoading: boolean;
  state: BookingState;
  bookedSlots: string[];
  hasExistingClinicalExam: boolean;
  onViewAppointments: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleGenderChange: (gender: string) => void;
  handleFile: (file: File) => void;
  removeImage: () => void;
  setDateField: (date: string) => void;
  setTimeField: (time: string) => void;
  isSubmitting: boolean;
  user: any;
}

export function BookingStepCard({
  activeStep,
  setActiveStep,
  bookingType,
  setBookingType,
  selectedServiceId,
  setSelectedServiceId,
  services,
  servicesLoading,
  state,
  bookedSlots,
  hasExistingClinicalExam,
  onViewAppointments,
  onChange,
  handleGenderChange,
  handleFile,
  removeImage,
  setDateField,
  setTimeField,
  isSubmitting,
  user
}: BookingStepCardProps) {
  const { selectedDate, selectedTime, formData } = state;
  const dateContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showBlockWarning, setShowBlockWarning] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    ho_ten_khach?: string;
    so_dien_thoai?: string;
    trieu_chung?: string;
  }>({});

  // Ẩn thông báo chặn khi người dùng thay đổi ngày đã chọn
  React.useEffect(() => {
    setShowBlockWarning(false);
  }, [selectedDate]);

  const validateField = (name: string, value: string) => {
    let error = '';
    const trimmed = value.trim();

    if (name === 'ho_ten_khach') {
      if (!trimmed) {
        error = 'Vui lòng nhập Họ và tên!';
      } else {
        const nameRegex = /^[\p{L}\s']{2,}$/u;
        if (!nameRegex.test(trimmed)) {
          error = 'Họ và tên phải có ít nhất 2 ký tự và chỉ chứa chữ cái!';
        }
      }
    } else if (name === 'so_dien_thoai') {
      if (!trimmed) {
        error = 'Vui lòng nhập Số điện thoại!';
      } else {
        const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
        if (!phoneRegex.test(trimmed)) {
          error = 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09!';
        }
      }
    } else if (name === 'trieu_chung') {
      if (!trimmed) {
        error = 'Vui lòng nhập Mô tả triệu chứng!';
      } else if (trimmed.length < 10) {
        error = 'Mô tả triệu chứng phải có ít nhất 10 ký tự!';
      }
    }
    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(e);
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      dateContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Generate available date list for the next 14 days
  const datesList = (() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      dates.push(nextDate);
    }
    return dates;
  })();

  const morningSlots = state.selectedDate ? ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] : [];
  const afternoonSlots = state.selectedDate ? ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'] : [];
  const eveningSlots = state.selectedDate ? ['18:00', '18:30', '19:00', '19:30'] : [];

  return (
    <>
      {/* Dynamic Overlay Modal with premium spring animation, glassmorphism, and branded elements */}
      <AnimatePresence>
        {showBlockWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with high-end glass blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlockWarning(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
              transition={{ duration: 0.3 }}
            />

            {/* Backdrop glow shapes behind modal for rich aesthetics */}
            <div className="absolute w-[300px] h-[300px] bg-[#2EC4B6]/10 rounded-full blur-[80px] -translate-x-12 -translate-y-12 pointer-events-none z-0 animate-pulse" />
            <div className="absolute w-[250px] h-[250px] bg-rose-500/5 rounded-full blur-[60px] translate-x-12 translate-y-12 pointer-events-none z-0" />

            {/* Modal Container Card - Premium Shadow & Scale Spring Entry */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 360 }}
              className="relative max-w-[500px] w-full bg-white/95 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border border-slate-100/80 shadow-[0_40px_90px_-15px_rgba(15,23,42,0.28)] z-10 text-center"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowBlockWarning(false)}
                className="absolute top-7 right-7 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-300 z-20"
              >
                <X size={18} />
              </button>

              {/* Office Care Branding Header */}
              <div className="flex justify-center items-center gap-3 mb-8 select-none">
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#2EC4B6]/10 border border-[#2EC4B6]/25 text-[#2EC4B6] font-jakarta font-black text-2xl shadow-inner shadow-[#2EC4B6]/5 transition-transform hover:scale-105 duration-300">
                  O
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-jakarta font-black text-base text-slate-800 tracking-tight leading-none uppercase">
                    Office Care
                  </span>
                  <span className="text-[9px] text-[#2EC4B6] font-jakarta font-extrabold uppercase tracking-widest leading-none mt-1">
                    Premium Rehab
                  </span>
                </div>
              </div>

              {/* Title with Gradient Text */}
              <h3 className="font-jakarta font-black text-xl sm:text-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-700 bg-clip-text text-transparent mb-5 tracking-tight leading-snug">
                Lịch Hẹn Đã Đạt Giới Hạn
              </h3>

              {/* Warning Card Container */}
              <div className="bg-rose-50/40 border border-rose-100/50 rounded-[24px] p-5 text-left mb-6 shadow-[inset_0_1px_2px_rgba(244,63,94,0.02)]">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100/70 border border-rose-200/50 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle size={18} strokeWidth={2.3} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-jakarta font-extrabold uppercase tracking-wider text-rose-800 text-[9px]">
                      Đạt giới hạn đặt lịch
                    </p>
                    <p className="text-slate-600 font-jakarta font-semibold text-xs sm:text-[13px] leading-relaxed">
                      Bạn đã đạt tối đa lượt khám của ngày <span className="text-rose-600 font-extrabold">{selectedDate ? selectedDate.split('-').reverse().slice(0, 2).join('/') : ''}</span>. Vui lòng liên hệ hotline để được hỗ trợ sắp xếp lịch khám phù hợp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hotline Action Row */}
              <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center border border-[#2EC4B6]/15">
                    <Phone size={16} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Hotline Hỗ Trợ 24/7</p>
                    <p className="text-sm font-jakarta font-black text-slate-800 mt-1 leading-none">0398 655 332</p>
                  </div>
                </div>
                <a 
                  href="tel:0398655332"
                  className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-jakarta font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-sm"
                >
                  Gọi ngay
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowBlockWarning(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-jakarta font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl flex-1 text-center transition-all active:scale-[0.98]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockWarning(false);
                    onViewAppointments();
                  }}
                  className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-jakarta font-extrabold text-xs uppercase tracking-wider py-4 px-6 rounded-2xl flex-1 text-center transition-all shadow-[0_4px_14px_rgba(46,196,182,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-[0_6px_20px_rgba(46,196,182,0.35)]"
                >
                  Lịch khám của tôi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STEP 1: BOOKING TYPE SELECTION */}
      {activeStep === 1 && (
        <motion.div
          key="type-step"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 text-left"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
              <CalendarIcon className="text-[#2EC4B6]" size={20} />
              Chọn hình thức đặt lịch hẹn
            </h3>
            <p className="text-xs font-medium text-slate-400">
              OfficeCare cung cấp dịch vụ khám lâm sàng và các gói chăm sóc trị liệu nhanh phù hợp với từng nhu cầu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Option A: Lịch Khám */}
            <div
              onClick={() => {
                setBookingType('kham');
                setSelectedServiceId('');
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                bookingType === 'kham'
                  ? 'bg-emerald-50/20 border-[#2EC4B6] ring-2 ring-[#2EC4B6]/10'
                  : 'bg-white border-slate-200 hover:border-slate-350'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center">
                    <Stethoscope size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-800">Lịch Khám Lâm Sàng</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Dành cho khách hàng có nhu cầu trị liệu bệnh lý (đau mỏi vai gáy, lưng, khớp...) cần được Bác sĩ kiểm tra trực tiếp và lên phác đồ trước.
                </p>
              </div>
              <div className="flex gap-1.5 mt-4">
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">Có Bác sĩ</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">30 phút</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">Miễn phí</span>
              </div>
            </div>

            {/* Option B: Dịch vụ lẻ */}
            <div
              onClick={() => setBookingType('dich_vu')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                bookingType === 'dich_vu'
                  ? 'bg-emerald-50/20 border-[#2EC4B6] ring-2 ring-[#2EC4B6]/10'
                  : 'bg-white border-slate-200 hover:border-slate-350'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#2EC4B6]/10 text-[#2EC4B6] flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-800">Dịch Vụ Lẻ / Trị Liệu Nhanh</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  Dành cho khách hàng chỉ muốn sử dụng các dịch vụ chăm sóc sức khỏe làm nhanh, thư giãn cơ, siêu âm trị liệu... không cần Bác sĩ khám trước.
                </p>
              </div>
              <div className="flex gap-1.5 mt-4">
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-105 text-amber-700 uppercase tracking-wider">Không cần khám</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">45-60 phút</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">Bảng giá lẻ</span>
              </div>
            </div>
          </div>

          {/* Service grid if bookingType === 'dich_vu' */}
          {bookingType === 'dich_vu' && (
            <div className="space-y-3 pt-4 border-t border-slate-150 animate-fade-in">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Chọn Dịch vụ lẻ mong muốn *
              </h4>
              {servicesLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  Đang tải danh sách dịch vụ lẻ...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {services
                    .filter(srv => String(srv.danh_muc_id) !== '1')
                    .map((srv) => {
                      const isSelected = selectedServiceId === srv.id;
                      return (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedServiceId(srv.id)}
                          className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between select-none cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/40 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                              : 'bg-white border-slate-150 hover:border-slate-350'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-black text-slate-800 leading-tight block truncate pr-2">{srv.ten_dich_vu}</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500">
                              {srv.thoi_luong_phut} phút
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2.5">
                            <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[130px]">{srv.mo_ta_ngan || 'Trị liệu phục hồi chức năng'}</span>
                            <span className="text-xs font-black text-emerald-600 font-jakarta">
                              {Number(srv.don_gia).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              disabled={bookingType === 'dich_vu' && !selectedServiceId}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Chọn Ngày Hẹn
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: DATE SELECTION */}
      {activeStep === 2 && (
        <motion.div
          key="date-step"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 text-left"
        >
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
                <CalendarIcon className="text-[#2EC4B6]" size={20} />
                Chọn ngày lượng giá
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Xem danh sách các ngày còn chỗ trống dưới đây.
              </p>
            </div>
            
            {/* Scrolling controls for desktop */}
            <div className="hidden sm:flex gap-1">
              <button
                type="button"
                onClick={() => scrollDates('left')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollDates('right')}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-slate-500 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Date Cards Horizontal Container */}
          <div
            ref={dateContainerRef}
            className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-2 px-2 hide-scrollbar snap-x"
          >
            {datesList.map((dateItem) => {
              const dateStr = formatLocalDate(dateItem);
              const spots = getMockAvailableSlots(dateStr);
              const isSelected = selectedDate === dateStr;
              const isClosed = spots === 0;

              return (
                <button
                  type="button"
                  key={dateStr}
                  disabled={isClosed}
                  onClick={() => setDateField(dateStr)}
                  className={`flex-shrink-0 w-24 h-24 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 relative snap-start outline-none
                    ${isClosed
                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-lg shadow-[#2EC4B6]/25 scale-[1.04] z-10'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:border-[#2EC4B6] hover:bg-slate-50/50 hover:scale-[1.02]'
                    }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {dateStr === formatLocalDate(new Date()) ? 'Hôm nay' : getVietnameseDay(dateItem)}
                  </span>
                  <span className="text-2xl font-jakarta font-black mt-1">
                    {dateItem.getDate()}
                  </span>
                  
                  {isClosed && (
                    <span className="text-[9px] font-extrabold mt-1.5 px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-400">
                      Nghỉ
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => {
                if (hasExistingClinicalExam && bookingType === 'kham') {
                  setShowBlockWarning(true);
                } else {
                  setActiveStep(3);
                }
              }}
              disabled={!selectedDate}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Chọn Khung Giờ
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: TIME SELECTION */}
      {activeStep === 3 && (
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
              Chọn giờ khám lâm sàng
            </h3>
            <p className="text-xs font-medium text-slate-400">
              Khung giờ trống cho ngày {formatFullDate(selectedDate)}
            </p>
          </div>

          {hasExistingClinicalExam && bookingType === 'kham' && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold animate-fade-in">
              <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-wider text-rose-800 text-[10px]">Cảnh báo: Trùng lịch hẹn</p>
                <p className="mt-0.5 font-medium text-rose-700">
                  Bạn đang có lịch hẹn ngày <span className="font-extrabold text-rose-900">{formatFullDate(selectedDate)}</span>. Vui lòng liên hệ hotline <span className="font-extrabold text-slate-900">0398 655 332</span> nếu muốn đặt tiếp 1 lịch khác.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6 pt-2">
            {/* Morning slots */}
            {morningSlots.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Buổi sáng (08:00 - 11:30)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {morningSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isPast = isSlotInPast(time, selectedDate);
                    const isDisabled = isBooked || isPast;
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        type="button"
                        key={time}
                        disabled={isDisabled}
                        onClick={() => setTimeField(time)}
                        className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                          ${isDisabled
                            ? 'bg-slate-50/50 border-slate-100 text-slate-300/80 cursor-not-allowed opacity-50'
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
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Buổi chiều (13:30 - 17:30)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {afternoonSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isPast = isSlotInPast(time, selectedDate);
                    const isDisabled = isBooked || isPast;
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        type="button"
                        key={time}
                        disabled={isDisabled}
                        onClick={() => setTimeField(time)}
                        className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                          ${isDisabled
                            ? 'bg-slate-50/50 border-slate-100 text-slate-300/80 cursor-not-allowed opacity-50'
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
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-750" /> Buổi tối (18:00 - 19:00)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {eveningSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isPast = isSlotInPast(time, selectedDate);
                    const isDisabled = isBooked || isPast;
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        type="button"
                        key={time}
                        disabled={isDisabled}
                        onClick={() => setTimeField(time)}
                        className={`py-3 text-xs font-black rounded-full border transition-all duration-200 text-center active:scale-95
                          ${isDisabled
                            ? 'bg-slate-50/50 border-slate-100 text-slate-300/80 cursor-not-allowed opacity-50'
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

          {selectedTime && isSlotUrgent(selectedTime, selectedDate) && (
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
              onClick={() => setActiveStep(4)}
              disabled={!selectedTime || (hasExistingClinicalExam && bookingType === 'kham')}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Điền Thông Tin
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: PATIENT INFORMATION */}
      {activeStep === 4 && (
        <motion.div
          key="info-step"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 text-left"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
              <User className="text-[#2EC4B6]" size={20} />
              Thông tin bệnh nhân liên hệ
            </h3>
            <p className="text-xs font-medium text-slate-400">
              Vui lòng nhập thông tin liên hệ và mô tả sơ bộ tình trạng đau nhức.
            </p>
          </div>

          {hasExistingClinicalExam && bookingType === 'kham' && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold animate-fade-in">
              <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-wider text-rose-800 text-[10px]">Cảnh báo: Trùng lịch hẹn</p>
                <p className="mt-0.5 font-medium text-rose-700">
                  Bạn đang có lịch hẹn ngày <span className="font-extrabold text-rose-900">{formatFullDate(selectedDate)}</span>. Vui lòng liên hệ hotline <span className="font-extrabold text-slate-900">0398 655 332</span> nếu muốn đặt tiếp 1 lịch khác.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
             {/* Name input (Floating label) */}
            <div className="relative">
              <input
                id="ho_ten_khach"
                type="text"
                name="ho_ten_khach"
                required
                placeholder=" "
                className={`peer block w-full rounded-xl border bg-white px-4 pt-6 pb-2 text-sm font-bold focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm
                  ${errors.ho_ten_khach
                    ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                    : 'border-slate-200 focus:border-[#2EC4B6] text-slate-800'
                  }`}
                value={formData.ho_ten_khach}
                onChange={handleInputChange}
              />
              <label
                htmlFor="ho_ten_khach"
                className={`absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px]
                  ${errors.ho_ten_khach
                    ? 'text-rose-400 peer-focus:text-rose-500'
                    : 'text-slate-400 peer-focus:text-[#2EC4B6]'
                  }`}
              >
                Họ và tên *
              </label>
              {user?.ho_ten && (
                <span className="absolute right-3 top-1 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full select-none">
                  Tài khoản
                </span>
              )}
              {errors.ho_ten_khach && (
                <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
                  {errors.ho_ten_khach}
                </span>
              )}
            </div>

            {/* Phone input (Floating label) */}
            <div className="relative">
              <input
                id="so_dien_thoai"
                type="tel"
                name="so_dien_thoai"
                required
                placeholder=" "
                className={`peer block w-full rounded-xl border bg-white px-4 pt-6 pb-2 text-sm font-bold focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm
                  ${errors.so_dien_thoai
                    ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                    : 'border-slate-200 focus:border-[#2EC4B6] text-slate-800'
                  }`}
                value={formData.so_dien_thoai}
                onChange={handleInputChange}
              />
              <label
                htmlFor="so_dien_thoai"
                className={`absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px]
                  ${errors.so_dien_thoai
                    ? 'text-rose-400 peer-focus:text-rose-500'
                    : 'text-slate-400 peer-focus:text-[#2EC4B6]'
                  }`}
              >
                Số điện thoại *
              </label>
              {errors.so_dien_thoai && (
                <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
                  {errors.so_dien_thoai}
                </span>
              )}
            </div>

            {/* Gender Custom Segments */}
            <div className="sm:col-span-2 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Giới tính
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleGenderChange('nam')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border duration-200 active:scale-98
                    ${formData.gioi_tinh_khach === 'nam'
                      ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/10 font-extrabold'
                      : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                    }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange('nu')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border duration-200 active:scale-98
                    ${formData.gioi_tinh_khach === 'nu'
                      ? 'bg-[#2EC4B6] border-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/10 font-extrabold'
                      : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                    }`}
                >
                  Nữ
                </button>
              </div>
            </div>

            {/* Symptom Textarea (Floating label) */}
            <div className="sm:col-span-2 relative">
              <textarea
                id="trieu_chung"
                name="trieu_chung"
                required
                rows={4}
                placeholder=" "
                className={`peer block w-full rounded-xl border bg-white px-4 pt-6 pb-2 text-sm font-medium focus:ring-0 outline-none transition-all placeholder-transparent shadow-sm resize-none
                  ${errors.trieu_chung
                    ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                    : 'border-slate-200 focus:border-[#2EC4B6] text-slate-700'
                  }`}
                value={formData.trieu_chung}
                onChange={handleInputChange}
              />
              <label
                htmlFor="trieu_chung"
                className={`absolute left-4 top-2 text-[10px] font-black uppercase tracking-widest transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px]
                  ${errors.trieu_chung
                    ? 'text-rose-400 peer-focus:text-rose-500'
                    : 'text-slate-400 peer-focus:text-[#2EC4B6]'
                  }`}
              >
                Mô tả triệu chứng, vùng đau nhức (VD: đau mỏi cổ vai gáy...) *
              </label>
              {errors.trieu_chung && (
                <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
                  {errors.trieu_chung}
                </span>
              )}
            </div>

            {/* Symptom image upload (Optional) */}
            <div className="sm:col-span-2 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Ảnh đính kèm triệu chứng (nếu có - tối đa 5MB)
              </span>
              
              {!formData.anh_dinh_kem_url ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 bg-slate-50/50 hover:bg-slate-50
                    ${dragActive 
                      ? 'border-[#2EC4B6] bg-[#2EC4B6]/5 scale-[1.01]' 
                      : 'border-slate-200 hover:border-[#2EC4B6]'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInputChange}
                  />
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/60 transition-colors">
                    <Upload size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">Kéo thả ảnh hoặc click để tải lên</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Chấp nhận JPG, PNG, WEBP tối đa 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 border border-slate-200 bg-slate-50/30 rounded-2xl relative group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative bg-white">
                    <img src={formData.anh_dinh_kem_url} alt="Uploaded symptom" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 truncate font-jakarta">Ảnh triệu chứng đã tải lên</p>
                    <p className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 font-jakarta">
                      <CheckCircle2 size={12} /> Sẵn sàng đính kèm
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 flex items-center justify-center transition-all border border-slate-200/60"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
            >
              Quay lại
            </button>
            <button
              type="button"
              disabled={hasExistingClinicalExam && bookingType === 'kham'}
              onClick={() => {
                const nameTrimmed = formData.ho_ten_khach.trim();
                const phoneTrimmed = formData.so_dien_thoai.trim();
                const symptomTrimmed = formData.trieu_chung.trim();

                const nameError = validateField('ho_ten_khach', nameTrimmed);
                const phoneError = validateField('so_dien_thoai', phoneTrimmed);
                const symptomError = validateField('trieu_chung', symptomTrimmed);

                if (nameError || phoneError || symptomError) {
                  setErrors({
                    ho_ten_khach: nameError,
                    so_dien_thoai: phoneError,
                    trieu_chung: symptomError
                  });
                  return;
                }

                setActiveStep(5);
              }}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-jakarta font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 5: CONFIRMATION */}
      {activeStep === 5 && (
        <motion.div
          key="confirm-step"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 text-left"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-jakarta font-black text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="text-[#2EC4B6]" size={20} />
              Xác nhận thông tin đặt lịch
            </h3>
            <p className="text-xs font-medium text-slate-400">
              Vui lòng kiểm tra lại thông tin cuộc hẹn trước khi xác nhận giữ chỗ.
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Họ và tên</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm">{formData.ho_ten_khach}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Số điện thoại</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm">{formData.so_dien_thoai}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Giới tính</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm capitalize">{formData.gioi_tinh_khach === 'nam' ? 'Nam' : 'Nữ'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider">Dịch vụ</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm">
                  {bookingType === 'dich_vu' ? (services.find(s => s.id === selectedServiceId)?.ten_dich_vu || 'Trị liệu dịch vụ lẻ') : 'Khám Lượng Giá Chuyên Sâu'}
                </p>
              </div>
              <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Thời gian khám</p>
                <p className="text-[#0F172A] font-extrabold mt-1 text-sm capitalize">
                  {selectedTime} — {formatFullDate(selectedDate)}
                </p>
              </div>
              <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Mô tả triệu chứng</p>
                <p className="text-slate-700 font-medium mt-1 text-sm leading-relaxed whitespace-pre-wrap">{formData.trieu_chung}</p>
              </div>
              {formData.anh_dinh_kem_url && (
                <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
                  <p className="text-slate-400 font-bold uppercase tracking-wider">Ảnh đính kèm triệu chứng</p>
                  <div className="mt-2 relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 bg-white">
                    <img src={formData.anh_dinh_kem_url} alt="Symptom preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Urgent Warning Banner */}
          {selectedTime && isSlotUrgent(selectedTime, selectedDate) && (
            <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold mb-1">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-extrabold uppercase tracking-wider text-amber-800 text-[10px]">Cảnh báo đặt lịch sát giờ</p>
                <p className="mt-1 font-medium text-amber-700">
                  Bạn đang đặt lịch khám bắt đầu trong vòng chưa đầy 2 giờ. Vui lòng di chuyển sớm để có mặt trước 10 phút. Hotline hỗ trợ gấp: <span className="font-extrabold text-amber-900">0398 655 332</span>.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 bg-teal-50/50 border border-[#2EC4B6]/15 p-4 rounded-xl text-[11px] leading-relaxed text-slate-500">
            <Lock size={16} className="text-[#2EC4B6] shrink-0 mt-0.5" />
            <p>
              Bằng cách bấm xác nhận giữ chỗ, bạn đồng ý cung cấp thông tin y khoa này phục vụ riêng cho việc thăm khám chẩn đoán tại OfficeCare. Dữ liệu được bảo mật tuyệt mật.
            </p>
          </div>

          {/* LARGE SUBMIT BUTTON (CTA SECTION) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#2EC4B6] hover:bg-[#25A89C] text-white font-jakarta font-extrabold text-xs uppercase tracking-widest rounded-[18px] h-16 shadow-lg shadow-[#2EC4B6]/25 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
                  Đang xử lý giữ chỗ...
                </span>
              ) : (
                <>
                  Xác nhận giữ chỗ <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-jakarta font-extrabold py-3 px-5 rounded-xl text-xs uppercase tracking-widest transition-all"
            >
              Sửa thông tin
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}

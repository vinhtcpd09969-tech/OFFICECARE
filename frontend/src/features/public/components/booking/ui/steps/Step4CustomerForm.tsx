import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Upload, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatFullDate } from '../../constants';

interface Step4CustomerFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleGenderChange: (gender: string) => void;
  handleFile: (file: File) => void;
  removeImage: () => void;
  selectedDate: string;
  bookingType: 'kham' | 'dich_vu';
  hasExistingClinicalExam: boolean;
  isPhoneTakenByOther?: boolean;
  user: any;
  setActiveStep: (step: number) => void;
}

export function Step4CustomerForm({
  formData,
  onChange,
  handleFile,
  removeImage,
  selectedDate,
  bookingType,
  hasExistingClinicalExam,
  isPhoneTakenByOther,
  user,
  setActiveStep
}: Step4CustomerFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [errors, setErrors] = useState<{
    ho_ten_khach?: string;
    so_dien_thoai?: string;
    trieu_chung?: string;
  }>({});

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

  const handleNextStep = () => {
    const nameTrimmed = formData.ho_ten_khach.trim();
    const phoneTrimmed = formData.so_dien_thoai.trim();
    const symptomTrimmed = formData.trieu_chung.trim();

    const nameError = validateField('ho_ten_khach', nameTrimmed);
    const phoneError = validateField('so_dien_thoai', phoneTrimmed);
    const symptomError = bookingType === 'kham' ? validateField('trieu_chung', symptomTrimmed) : '';

    if (nameError || phoneError || symptomError) {
      setErrors({
        ho_ten_khach: nameError,
        so_dien_thoai: phoneError,
        trieu_chung: symptomError
      });
      return;
    }

    if (isPhoneTakenByOther) {
      toast.error('Số điện thoại này đã thuộc về một tài khoản khách hàng khác trong hệ thống.');
      return;
    }

    setActiveStep(5);
  };

  const handleBack = () => {
    setActiveStep(3);
  };

  return (
    <motion.div
      key="info-step"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left font-jakarta"
    >
      {/* Header section */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#2EC4B6] border border-teal-100 dark:border-teal-800/60 flex items-center justify-center shrink-0 shadow-xs">
          <UserIcon size={20} />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Thông tin bệnh nhân liên hệ
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Thông tin liên hệ của bạn và mô tả sơ bộ tình trạng đau nhức để bác sĩ chuẩn bị chu đáo nhất.
          </p>
        </div>
      </div>

      {isPhoneTakenByOther && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs flex items-start gap-3 text-amber-900 leading-relaxed font-semibold animate-fade-in">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black uppercase tracking-wider text-amber-800 text-[10px]">Cảnh báo: Số điện thoại đã được sử dụng</p>
            <p className="mt-0.5 font-bold text-amber-700">
              Số điện thoại này đã thuộc về một tài khoản khách hàng khác trong hệ thống. Vui lòng kiểm tra lại chính xác số điện thoại của bạn.
            </p>
          </div>
        </div>
      )}

      {hasExistingClinicalExam && bookingType === 'kham' && !isPhoneTakenByOther && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs flex items-start gap-3 text-rose-900 leading-relaxed font-semibold animate-fade-in">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black uppercase tracking-wider text-rose-800 text-[10px]">Cảnh báo: Trùng lịch hẹn</p>
            <p className="mt-0.5 font-bold text-rose-700">
              Bạn đang có lịch hẹn ngày <span className="font-extrabold text-rose-900">{formatFullDate(selectedDate)}</span>. Vui lòng liên hệ hotline <span className="font-extrabold text-slate-900">0398 655 332</span> nếu muốn đặt tiếp 1 lịch khác.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
        {/* Name input */}
        <div className="relative">
          <input
            id="ho_ten_khach"
            type="text"
            name="ho_ten_khach"
            required
            placeholder=" "
            disabled={!!user}
            className={`peer block w-full rounded-2xl border bg-white dark:bg-slate-900 px-4 pt-6 pb-2 text-sm font-extrabold focus:ring-2 focus:ring-[#2EC4B6]/15 outline-none transition-all placeholder-transparent shadow-xs disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed
              ${errors.ho_ten_khach
                ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                : 'border-slate-200 dark:border-slate-700 focus:border-[#2EC4B6] text-slate-900 dark:text-white'
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
            <span className="absolute right-3 top-4 text-[10px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 px-2.5 py-0.5 rounded-full select-none">
              Tài khoản
            </span>
          )}
          {errors.ho_ten_khach && (
            <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
              {errors.ho_ten_khach}
            </span>
          )}
        </div>

        {/* Phone input */}
        <div className="relative">
          <input
            id="so_dien_thoai"
            type="tel"
            name="so_dien_thoai"
            required
            placeholder=" "
            disabled={!!user && !isEditingPhone}
            className={`peer block w-full rounded-2xl border bg-white dark:bg-slate-900 px-4 pt-6 pb-2 text-sm font-extrabold focus:ring-2 focus:ring-[#2EC4B6]/15 outline-none transition-all placeholder-transparent shadow-xs disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed
              ${errors.so_dien_thoai
                ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                : 'border-slate-200 dark:border-slate-700 focus:border-[#2EC4B6] text-slate-900 dark:text-white'
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
          {user?.so_dien_thoai && !isEditingPhone && (
            <button
              type="button"
              onClick={() => setIsEditingPhone(true)}
              className="absolute right-3 top-4 text-[10px] font-black text-[#2EC4B6] bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full transition-all border border-teal-100 dark:border-teal-800 cursor-pointer"
            >
              Đổi số liên hệ
            </button>
          )}
          {user?.so_dien_thoai && isEditingPhone && (
            <button
              type="button"
              onClick={() => {
                setIsEditingPhone(false);
                const event = {
                  target: {
                    name: 'so_dien_thoai',
                    value: user.so_dien_thoai
                  }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
                setErrors(prev => ({ ...prev, so_dien_thoai: '' }));
              }}
              className="absolute right-3 top-4 text-[10px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full transition-all cursor-pointer"
            >
              Mặc định
            </button>
          )}
          {errors.so_dien_thoai && (
            <span className="text-[10px] font-extrabold text-rose-500 mt-1 block pl-1">
              {errors.so_dien_thoai}
            </span>
          )}
        </div>

        {/* Symptom Textarea & Image upload (for Kham) */}
        {bookingType === 'kham' && (
          <>
            <div className="sm:col-span-2 space-y-1.5">
              <div className="relative">
                <textarea
                  id="trieu_chung"
                  name="trieu_chung"
                  required
                  rows={3}
                  placeholder=" "
                  className={`peer block w-full rounded-2xl border bg-white dark:bg-slate-900 px-4 pt-6 pb-3 text-xs md:text-sm font-semibold focus:ring-2 focus:ring-[#2EC4B6]/15 outline-none transition-all placeholder-transparent shadow-xs resize-none leading-relaxed
                    ${errors.trieu_chung
                      ? 'border-rose-300 focus:border-rose-500 text-rose-600'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#2EC4B6] text-slate-800 dark:text-slate-100'
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
              </div>
              {errors.trieu_chung ? (
                <span className="text-[10px] font-extrabold text-rose-500 block pl-1">
                  {errors.trieu_chung}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 block pl-1">
                  💡 Nhập ngắn gọn tình trạng bạn gặp phải (ví dụ: đau mỏi lưng, tê tay, thoát vị đĩa đệm...) để bác sĩ nắm rõ trước buổi khám.
                </span>
              )}
            </div>

            {/* Symptom image upload */}
            <div className="sm:col-span-2 space-y-2 pt-1">
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
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800
                    ${dragActive
                      ? 'border-[#2EC4B6] bg-[#2EC4B6]/5 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-[#2EC4B6]'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInputChange}
                  />
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-[#2EC4B6] flex items-center justify-center border border-teal-100 dark:border-teal-800/60 shadow-xs">
                    <Upload size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Kéo thả ảnh hoặc click để tải lên</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Chấp nhận JPG, PNG, WEBP tối đa 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl relative group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative bg-white">
                    <img src={formData.anh_dinh_kem_url} alt="Uploaded symptom" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate">Ảnh triệu chứng đã tải lên</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-black flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sẵn sàng đính kèm ca khám
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleBack}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700"
        >
          Quay lại
        </button>
        <button
          type="button"
          disabled={(hasExistingClinicalExam && bookingType === 'kham') || isPhoneTakenByOther}
          onClick={handleNextStep}
          className="bg-[#0F172A] hover:bg-[#1E293B] dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Xác nhận
        </button>
      </div>
    </motion.div>
  );
}

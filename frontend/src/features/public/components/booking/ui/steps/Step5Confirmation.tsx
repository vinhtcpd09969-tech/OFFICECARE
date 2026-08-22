import { motion } from 'framer-motion';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { BUOI_INFO, Buoi, formatFullDate } from '../../constants';

interface Step5ConfirmationProps {
  bookingType: 'kham' | 'dich_vu';
  selectedServiceId: string;
  services: any[];
  selectedDate: string;
  selectedBuoi: Buoi | '';
  selectedStaffId: string;
  specialists: any[];
  formData: any;
  setActiveStep: (step: number) => void;
  isSubmitting: boolean;
}

export function Step5Confirmation({
  bookingType,
  selectedServiceId,
  services,
  selectedDate,
  selectedBuoi,
  selectedStaffId,
  specialists,
  formData,
  setActiveStep,
  isSubmitting
}: Step5ConfirmationProps) {
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedStaffName = specialists.find(s => String(s.id) === selectedStaffId)?.ho_ten || 'Bất kỳ (hệ thống tự gán)';

  return (
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
            <p className="text-[#0F172A] font-extrabold mt-1 text-sm">{selectedService?.ten_dich_vu || 'Trị liệu dịch vụ lẻ'}</p>
          </div>
          
          <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
            <p className="text-slate-400 font-bold uppercase tracking-wider">
              {bookingType === 'kham' ? 'Chuyên viên lượng giá' : 'Kỹ thuật viên thực hiện'}
            </p>
            <p className="text-[#2EC4B6] font-extrabold mt-1 text-sm">{selectedStaffName}</p>
          </div>

          <div className="sm:col-span-2 border-t border-slate-200/60 pt-3">
            <p className="text-slate-400 font-bold uppercase tracking-wider">Thời gian lượng giá &amp; trị liệu</p>
            <p className="text-[#0F172A] font-extrabold mt-1 text-sm capitalize">
              {selectedBuoi ? BUOI_INFO[selectedBuoi].label : ''} ({selectedBuoi ? BUOI_INFO[selectedBuoi].khung : ''}) — {formatFullDate(selectedDate)}
            </p>
          </div>
          {bookingType === 'kham' && (
            <>
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
            </>
          )}
        </div>
      </div>

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
  );
}

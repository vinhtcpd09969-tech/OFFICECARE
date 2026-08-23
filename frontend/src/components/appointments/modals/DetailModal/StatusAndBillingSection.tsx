import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check, Clock, Undo2, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';
import { isPaymentDue } from '../../../../utils/billing';
import { statusConfig } from '../../appointmentStatusConfig';

interface StatusAndBillingSectionProps {
  selectedAppointment: any;
  assignStatus: string;
  isEditingStatus: boolean;
  setIsEditingStatus: (val: boolean) => void;
  handleStatusChange: (val: string) => void;
  handleUndoStatusChange: () => void;
  setIsStatusHistoryOpen: (val: boolean) => void;
  isReceptionist: boolean;
  isReceptionistLocked: boolean;
  receptionistActionOptions: { value: string; label: string }[];
  onClose: () => void;
}

export const StatusAndBillingSection: React.FC<StatusAndBillingSectionProps> = ({
  selectedAppointment,
  assignStatus,
  isEditingStatus,
  setIsEditingStatus,
  handleStatusChange,
  handleUndoStatusChange,
  setIsStatusHistoryOpen,
  isReceptionist,
  isReceptionistLocked,
  receptionistActionOptions,
  onClose
}) => {
  const navigate = useNavigate();

  const currentStatusInfo = statusConfig[assignStatus] || statusConfig[selectedAppointment?.trang_thai] || {
    label: assignStatus || selectedAppointment?.trang_thai || 'Chưa xác định',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null
  };

  const hasPendingStatusChange = !!assignStatus && assignStatus !== selectedAppointment?.trang_thai;

  return (
    <div className="space-y-4">
      {/* 1. Khối Trạng thái ca hẹn & Thanh toán */}
      <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80">
        <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
          {isReceptionist ? 'Trạng thái lịch hẹn' : 'Trạng thái lịch hẹn (Quản lý)'}
        </label>
        {!isEditingStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1.5 sm:pr-3 sm:border-r sm:border-slate-200 dark:sm:border-zinc-750">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                Trạng thái lâm sàng
              </span>
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${currentStatusInfo.color} ${hasPendingStatusChange ? 'border-dashed' : ''}`}>
                  {currentStatusInfo.icon}
                  <span>{currentStatusInfo.label}</span>
                  {hasPendingStatusChange && <span className="font-semibold opacity-70 normal-case">(chưa lưu)</span>}
                </span>

                <div className="flex items-center gap-1.5">
                  {hasPendingStatusChange && (
                    <button
                      type="button"
                      onClick={handleUndoStatusChange}
                      className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-600 hover:text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-amber-200/60 dark:border-amber-800/50 shadow-2xs"
                    >
                      <Undo2 size={12} />
                      <span>Hoàn tác</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsStatusHistoryOpen(true)}
                    className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-zinc-700/50 shadow-2xs"
                    title="Lịch sử trạng thái"
                  >
                    <Clock size={12} />
                  </button>
                  {(!isReceptionist || !isReceptionistLocked) && (
                    <button
                      type="button"
                      onClick={() => setIsEditingStatus(true)}
                      className="flex items-center gap-1.5 text-[11px] font-extrabold text-teal-600 hover:text-teal-700 dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-teal-200/60 dark:border-teal-800/50 shadow-2xs"
                      title="Đổi trạng thái"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(selectedAppointment.trang_thai) && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                  Trạng thái thanh toán
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedAppointment.trang_thai_thanh_toan === 'dang_cho_thanh_toan' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border-amber-150 dark:border-amber-900/30">
                      ⏳ Đang xác nhận thanh toán…
                    </span>
                  ) : isPaymentDue(selectedAppointment) ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border-rose-150 dark:border-rose-900/30">
                        ⚠ Chưa thu
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                          navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-extrabold text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <DollarSign size={12} />
                        <span>Thu tiền</span>
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450 border-emerald-150 dark:border-emerald-900/30">
                      ✓ Đã thu
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-1 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Chọn trạng thái mới
              </span>
              <button
                type="button"
                onClick={() => setIsEditingStatus(false)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:underline cursor-pointer"
              >
                Thu gọn
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(isReceptionist
                ? receptionistActionOptions.map(opt => ({ value: opt.value, label: opt.label }))
                : [
                    { value: 'da_xac_nhan', label: 'Đã xác nhận' },
                    { value: 'da_checkin', label: 'Đã check-in' },
                    { value: 'dang_kham', label: 'Đang thực hiện' },
                    { value: 'hoan_thanh', label: 'Hoàn thành' },
                    { value: 'da_huy', label: 'Đã hủy' },
                    { value: 'khong_den', label: 'Không đến' }
                  ]
              ).map((st) => {
                const meta = statusConfig[st.value] || { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: null };
                const isSelected = assignStatus === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => {
                      handleStatusChange(st.value);
                      setIsEditingStatus(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${meta.color} ${
                      isSelected ? 'ring-2 ring-teal-500/50 font-black shadow-xs scale-[1.02]' : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    {meta.icon}
                    <span>{st.label}</span>
                    {isSelected && <Check size={12} className="text-teal-600 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Thẻ chỉ định gói liệu trình */}
      {['kham_moi', 'KHAM'].includes(selectedAppointment.loai_lich) && selectedAppointment.khuyen_nghi_goi_id && (
        <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-teal-50/30 dark:from-teal-950/40 dark:via-zinc-900 dark:to-teal-950/20 p-4.5 rounded-2xl border border-teal-200/80 dark:border-teal-900/50 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-xl bg-teal-600/10 dark:bg-teal-400/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                <Sparkles size={15} />
              </div>
              <span className="text-[11px] font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                Gói liệu trình được chỉ định
              </span>
            </div>
            {selectedAppointment.khuyen_nghi_phac_do_id && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300/60 dark:border-emerald-800">
                <CheckCircle2 size={13} />
                <span>Đã mua & kích hoạt</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap bg-white/90 dark:bg-zinc-800/90 p-3.5 rounded-xl border border-teal-100 dark:border-teal-900/40 shadow-2xs">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100">
                {selectedAppointment.khuyen_nghi_ten_goi}
              </h4>
              <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {selectedAppointment.khuyen_nghi_phac_do_id
                  ? 'Khách hàng đã đăng ký mua gói và mở phác đồ điều trị thành công.'
                  : 'Gói trị liệu được chuyên viên chỉ định sau khi lượng giá chức năng.'}
              </p>
            </div>

            {!selectedAppointment.khuyen_nghi_phac_do_id && (
              <button
                type="button"
                onClick={() => {
                  const dest = isReceptionist ? '/receptionist/billing' : '/admin/quick-billing';
                  navigate(`${dest}?lich_dat_id=${selectedAppointment.id}`);
                  onClose();
                }}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-98"
              >
                <DollarSign size={14} />
                <span>Thanh toán ngay</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

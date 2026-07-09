import React from 'react';
import { ShieldAlert, Coins, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils';

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
  itemName: string;
  totalAmount: number;
  paymentMethod: string;
  receivedAmount: number;
  changeAmount: number;
  note: string;
  loading: boolean;
  actionText?: string;
}

export const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  itemName,
  totalAmount,
  paymentMethod,
  receivedAmount,
  changeAmount,
  note,
  loading,
  actionText = 'Xác nhận & Thu tiền',
}) => {
  if (!isOpen) return null;

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'tien_mat':
        return '💵 Tiền mặt';
      case 'chuyen_khoan':
        return '🏦 Chuyển khoản ngân hàng';
      case 'the':
        return '💳 Quẹt thẻ (POS)';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-zinc-150 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left">
        {/* Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-primary/80 to-primary text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            <span className="p-2.5 bg-white/15 rounded-xl">
              <ShieldAlert size={22} className="text-white" />
            </span>
            <div>
              <h3 className="font-heading font-black text-sm uppercase tracking-wider">Xác nhận thu tiền y khoa</h3>
              <p className="text-[10px] text-white/80 font-semibold mt-0.5">Kiểm tra thông tin giao dịch tài chính trước khi ghi nhận.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Patient and Service info */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-2.5 text-xs font-semibold text-zinc-650">
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-400">Bệnh nhân:</span>
              <span className="text-secondary font-black text-sm">{patientName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-400">Nội dung thu:</span>
              <span className="text-secondary font-bold text-right max-w-[220px]" title={itemName}>{itemName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Hình thức thu:</span>
              <span className="text-secondary font-bold">{getMethodLabel(paymentMethod)}</span>
            </div>
          </div>

          {/* Cash detailed breakdown */}
          <div className="bg-primary/[0.02] border border-primary/10 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-600">
              <span>Tổng số tiền cần thu:</span>
              <span className="text-primary font-black text-base">{formatCurrency(totalAmount)}</span>
            </div>

            {paymentMethod === 'tien_mat' && totalAmount > 0 && (
              <div className="border-t border-zinc-100 pt-3 space-y-2.5 text-xs font-semibold text-zinc-650">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Số tiền khách đưa:</span>
                  <span className="text-secondary font-bold">{formatCurrency(receivedAmount)}</span>
                </div>
                {changeAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-extrabold bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                    <span>Tiền thừa trả khách:</span>
                    <span>{formatCurrency(changeAmount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes summary */}
          {note.trim() && (
            <div className="space-y-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Ghi chú giao dịch</span>
              <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-[11px] font-medium text-zinc-500 italic">
                "{note}"
              </div>
            </div>
          )}

          {/* Warning banner */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-2.5">
            <Coins className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] text-amber-850 leading-relaxed font-semibold">
              Giao dịch sau khi xác nhận sẽ được lưu vào hệ thống, tạo giao dịch thanh toán y khoa tương ứng và không thể tự ý sửa đổi. Vui lòng kiểm tra kỹ số tiền thực tế nhận được.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-white hover:bg-zinc-100 active:scale-[0.98] border border-zinc-200 text-xs font-bold text-secondary uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-primary hover:bg-primary/95 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{loading ? 'Đang xử lý...' : actionText}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPaymentModal;

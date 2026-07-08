import React from 'react';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '../../../../../shared/utils';
import type { Invoice } from '../hooks/useFinanceDashboard';

interface FastPaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  method: string;
  setMethod: (method: string) => void;
  received: string;
  setReceived: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  loading: boolean;
}

export const FastPaymentModal: React.FC<FastPaymentModalProps> = ({
  invoice,
  onClose,
  onSubmit,
  method,
  setMethod,
  received,
  setReceived,
  note,
  setNote,
  loading,
}) => {
  if (!invoice) return null;

  const requiredAmount = Number(invoice.tong_tien_thanh_toan) - Number(invoice.da_thanh_toan);
  const quickCashOptions = [200000, 500000, 1000000, 2000000, 5000000];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form 
        onSubmit={onSubmit} 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-zinc-150 p-6 space-y-6 text-left animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="text-primary size-5" />
            <h3 className="font-heading font-black text-secondary text-sm">Ghi nhận thanh toán nhanh</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-650"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2.5 text-xs font-semibold text-zinc-650">
            <div className="flex justify-between">
              <span>Hóa đơn:</span>
              <span className="text-secondary font-black font-mono">{invoice.ma_hoa_don}</span>
            </div>
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span className="text-secondary font-bold">{invoice.ten_khach_hang}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200/60 pt-2 font-bold text-secondary">
              <span>Còn nợ cần thu:</span>
              <span className="text-primary font-black text-sm">
                {formatCurrency(requiredAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hình thức thanh toán</label>
            <select 
              value={method} 
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="tien_mat">💵 Tiền mặt</option>
              <option value="chuyen_khoan">🏦 Chuyển khoản ngân hàng</option>
              <option value="the">💳 Quẹt thẻ</option>
            </select>
          </div>

          {/* Received cash only if cash payment */}
          {method === 'tien_mat' && (
            <div className="space-y-2.5">
            {(() => {
              const receivedNum = Number(received.replace(/\D/g, '') || 0);
              const isShortage = receivedNum > 0 && receivedNum < requiredAmount;
              const currentQuickOptions = Array.from(new Set([requiredAmount, ...quickCashOptions]))
                .filter(val => val > 0)
                .sort((a, b) => a - b);

              return (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <label htmlFor="fastPayReceived" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Số tiền khách đưa (VND) *</label>
                    <input 
                      id="fastPayReceived"
                      type="text" 
                      value={received ? Number(received.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                      onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))}
                      placeholder="VD: 500.000"
                      required
                      className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all outline-none ${
                        isShortage 
                          ? 'bg-rose-50/20 border-rose-350 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                          : 'bg-zinc-50 border-zinc-200 text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                    {isShortage && (
                      <p className="text-[10.5px] text-rose-600 font-extrabold flex items-center gap-1 mt-1">
                        ⚠️ Còn thiếu {formatCurrency(requiredAmount - receivedNum)} để hoàn thành thanh toán
                      </p>
                    )}
                  </div>

                  {/* Quick options for received money */}
                  <div className="flex flex-wrap gap-2">
                    {currentQuickOptions.map(val => {
                      const isActive = val === receivedNum;
                      const isExact = val === requiredAmount;
                      
                      let btnStyle = '';
                      if (isActive) {
                        btnStyle = 'bg-primary border-primary text-white scale-105 shadow-sm';
                      } else if (isExact) {
                        btnStyle = 'bg-primary/5 border-primary/50 text-primary hover:bg-primary hover:text-white';
                      } else {
                        btnStyle = 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-primary hover:text-white';
                      }

                      return (
                        <button 
                          key={val} 
                          type="button"
                          onClick={() => setReceived(val.toString())}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all border ${btnStyle}`}
                        >
                          {formatCurrency(val)}
                          {isExact && !isActive && <span className="text-[8px] font-bold ml-1 opacity-80">(Cần thu)</span>}
                        </button>
                      );
                    })}
                  </div>

                  {receivedNum > requiredAmount && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/40 rounded-xl p-3 text-[10.5px] font-bold flex justify-between">
                      <span>Tiền thừa thối khách:</span>
                      <span>{formatCurrency(receivedNum - requiredAmount)}</span>
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
          )}

          {/* Transaction notes */}
          <div className="space-y-1.5">
            <label htmlFor="fastPayNote" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ghi chú giao dịch</label>
            <textarea 
              id="fastPayNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi nhận lưu ý..."
              rows={2}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold text-secondary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold text-secondary uppercase tracking-wider transition-all"
          >
            Đóng
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận thu'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default FastPaymentModal;

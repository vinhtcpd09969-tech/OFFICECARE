import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Clock, ArrowUpRight, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../../../../api/axios';
import { formatCurrency } from '../../../../../shared/utils';

interface QRWebhookModalProps {
  hoaDonId: string;
  amount: number;
  soThuTuBuoi?: number;
  onClose: () => void;
  onSuccess: (paidInvoice: any) => void;
}

export const QRWebhookModal: React.FC<QRWebhookModalProps> = ({
  hoaDonId,
  amount,
  soThuTuBuoi,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [payosLinkData, setPayosLinkData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  const [cancelling, setCancelling] = useState(false);
  const pollingTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);

  // 1. Create PayOS Payment Link on mount
  useEffect(() => {
    const createLink = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.post('/receptionist/payment/create-payos-link', {
          hoa_don_id: hoaDonId,
          so_thu_tu_buoi: soThuTuBuoi,
        });
        setPayosLinkData(res.data);
        setLoading(false);
      } catch (error: any) {
        console.error('Lỗi khi tạo link PayOS:', error);
        toast.error(error.response?.data?.message || 'Không thể kết nối với cổng thanh toán PayOS');
        onClose();
      }
    };

    createLink();

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [hoaDonId]);

  // 2. Start countdown & polling when payosLinkData is loaded
  useEffect(() => {
    if (!payosLinkData) return;

    // Start countdown
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          clearInterval(pollingTimerRef.current!);
          toast.error('Mã thanh toán QR đã hết hạn!');
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling status
    pollingTimerRef.current = setInterval(async () => {
      try {
        const orderCodeParam = payosLinkData?.orderCode ? `?orderCode=${payosLinkData.orderCode}` : '';
        const res = await axiosInstance.get(`/receptionist/payment/status/${hoaDonId}${orderCodeParam}`);
        const { trang_thai } = res.data;
        if (trang_thai === 'da_thanh_toan' || trang_thai === 'dang_tra_gop') {
          clearInterval(pollingTimerRef.current!);
          clearInterval(countdownTimerRef.current!);
          onSuccess(res.data);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
      }
    }, 3000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [payosLinkData, hoaDonId]);

  // 3. Handle cancel payment
  const handleCancel = async () => {
    try {
      setCancelling(true);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      await axiosInstance.post('/receptionist/payment/cancel-payos-link', {
        hoa_don_id: hoaDonId,
        orderCode: payosLinkData?.orderCode,
        order_code: payosLinkData?.orderCode
      });

      toast.success('Đã hủy giao dịch thanh toán QR');
      onClose();
    } catch (error) {
      console.error('Lỗi khi hủy link PayOS:', error);
      toast.error('Có lỗi xảy ra khi hủy link thanh toán');
      onClose();
    } finally {
      setCancelling(false);
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate VietQR image URL using PayOS metadata or direct fallback
  // PayOS test bin: 970415 (Vietinbank test account)
  // Let's check: if payosLinkData.bin and payosLinkData.accountNumber are returned, use them.
  // Otherwise, use fallback template.
  const getQRImageUrl = () => {
    if (!payosLinkData) return '';
    
    // Some developer keys in test mode use Kienlongbank or Vietinbank. 
    // PayOS returns details inside the link creation or we can just render using standard VietQR.
    // PayOS sandbox returns `bin: "970415"` and `accountNumber: "113366668888"` for test accounts.
    const bin = payosLinkData.bin || '970415';
    const accountNumber = payosLinkData.accountNumber || '113366668888';
    const accountName = payosLinkData.accountName || 'PAYOS TEST';
    const desc = payosLinkData.description || `TTHD${hoaDonId.replace(/-/g, '').substring(0, 8).toUpperCase()}`;
    
    return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact.png?amount=${amount}&addInfo=${desc}&accountName=${encodeURIComponent(accountName)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-zinc-150 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-primary/80 to-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-white/15 rounded-xl">
              <QrCode size={20} className="text-white" />
            </span>
            <div>
              <h3 className="font-heading font-black text-sm uppercase tracking-wider">Thanh toán VietQR qua PayOS</h3>
              <p className="text-[10px] text-white/80 font-semibold mt-0.5">Quét mã để ghi nhận giao dịch tự động</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleCancel}
            disabled={cancelling}
            className="p-1.5 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-primary size-10" />
              <p className="text-xs font-bold text-zinc-500">Đang khởi tạo mã thanh toán...</p>
            </div>
          ) : (
            <>
              {/* Expire countdown */}
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 text-amber-700 px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
                <Clock size={14} />
                <span>Thời gian giữ mã: {formatTime(timeLeft)}</span>
              </div>

              {/* QR Image Frame */}
              <div className="relative p-3.5 bg-white border-2 border-zinc-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 group">
                <img 
                  src={getQRImageUrl()} 
                  alt="Mã VietQR Thanh toán" 
                  className="w-56 h-56 object-contain"
                />
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-3xl">
                  <a 
                    href={payosLinkData.checkoutUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm"
                  >
                    <span>Mở trang PayOS</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>

              {/* Payment details summary */}
              <div className="w-full bg-zinc-50 border border-zinc-150 rounded-2xl p-4 space-y-2 text-xs text-zinc-500 font-semibold">
                <div className="flex justify-between">
                  <span>Số tiền cần thu:</span>
                  <span className="text-secondary font-black text-sm">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nội dung chuyển khoản:</span>
                  <span className="text-primary font-black font-mono select-all bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                    {payosLinkData.description}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200/60 pt-2 text-[10px] text-zinc-400">
                  <span>Tài khoản nhận:</span>
                  <span className="text-right">
                    {payosLinkData.accountName} <br />
                    {payosLinkData.accountNumber} ({payosLinkData.bin === '970415' ? 'VietinBank' : 'MBBank'})
                  </span>
                </div>
              </div>

              {/* Status polling loader */}
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
                <Loader2 className="animate-spin text-zinc-400 size-4" />
                <span>Hệ thống đang chờ bạn quét mã chuyển tiền...</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 py-3 bg-white hover:bg-zinc-100 active:scale-[0.98] border border-zinc-200 text-xs font-bold text-secondary uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
          >
            {cancelling ? 'Đang hủy...' : 'Hủy thanh toán'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default QRWebhookModal;

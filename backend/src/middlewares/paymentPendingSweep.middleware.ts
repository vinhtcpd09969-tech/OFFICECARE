import { Request, Response, NextFunction } from 'express';
import receptionistRepository from '../repositories/receptionist.repository';

/**
 * A15 — quét "lười" các cuoc_hen còn kẹt ở `dang_cho_thanh_toan` quá 15 phút kể từ lúc tạo link
 * PayOS mà chưa có webhook xác nhận, tự đảo về `chua_thanh_toan` — chạy tối đa 1 lần mỗi
 * SWEEP_INTERVAL_MS trên request đầu tiên chạm tới sau chu kỳ đó, không cần cron/scheduler riêng.
 * Cùng mẫu với `packageExpirySweep.middleware.ts`/`noShowSweep.middleware.ts`. Hiệu ứng thật nằm ở
 * ReceptionistRepository::sweepPendingPaymentTimeouts().
 */
const SWEEP_INTERVAL_MS = 60_000;
let lastSweepAt = 0;
let sweepInFlight = false;

export function paymentPendingSweep(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  if (!sweepInFlight && now - lastSweepAt > SWEEP_INTERVAL_MS) {
    lastSweepAt = now;
    sweepInFlight = true;
    receptionistRepository.sweepPendingPaymentTimeouts()
      .then((count) => {
        if (count > 0) console.log(`⏱ Đã tự đảo ${count} lịch hẹn kẹt "đang chờ thanh toán" quá 15 phút về "chưa thanh toán".`);
      })
      .catch((err) => console.error('Lỗi khi quét thanh toán treo quá hạn:', err))
      .finally(() => { sweepInFlight = false; });
  }
  next();
}

import { Request, Response, NextFunction } from 'express';
import adminRepository from '../repositories/admin.repository';

/**
 * Quét "lười" các gói liệu trình đã quá hạn sử dụng — chạy tối đa 1 lần mỗi
 * SWEEP_INTERVAL_MS trên request đầu tiên chạm tới sau chu kỳ đó, không cần cron/scheduler
 * riêng. Độ trễ tối đa giữa lúc gói thực sự hết hạn và lúc trạng thái được cập nhật = khoảng
 * throttle này (chấp nhận được — đây là quyết định đã chốt, không cần đúng ngay 00:00 ngày hết
 * hạn). Hiệu ứng thật nằm ở AdminRepository::sweepExpiredPackages().
 */
const SWEEP_INTERVAL_MS = 60_000;
let lastSweepAt = 0;
let sweepInFlight = false;

export function packageExpirySweep(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  if (!sweepInFlight && now - lastSweepAt > SWEEP_INTERVAL_MS) {
    lastSweepAt = now;
    sweepInFlight = true;
    adminRepository.sweepExpiredPackages()
      .then((count) => {
        if (count > 0) console.log(`⏱ Đã tự động hủy ${count} gói liệu trình quá hạn sử dụng (không hoàn tiền).`);
      })
      .catch((err) => console.error('Lỗi khi quét gói liệu trình quá hạn:', err))
      .finally(() => { sweepInFlight = false; });
  }
  next();
}

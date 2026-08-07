import { Request, Response, NextFunction } from 'express';
import receptionistRepository from '../repositories/receptionist.repository';

/**
 * B10 — quét "lười" các lịch đã xác nhận nhưng chưa check-in mà buổi đã kết thúc quá giờ đệm,
 * tự động chuyển "không đến" — chạy tối đa 1 lần mỗi SWEEP_INTERVAL_MS trên request đầu tiên
 * chạm tới sau chu kỳ đó, không cần cron/scheduler riêng. Cùng mẫu với
 * `packageExpirySweep.middleware.ts`. Hiệu ứng thật nằm ở
 * ReceptionistRepository::sweepNoShowAppointments().
 */
const SWEEP_INTERVAL_MS = 60_000;
let lastSweepAt = 0;
let sweepInFlight = false;

export function noShowSweep(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  if (!sweepInFlight && now - lastSweepAt > SWEEP_INTERVAL_MS) {
    lastSweepAt = now;
    sweepInFlight = true;
    receptionistRepository.sweepNoShowAppointments()
      .then((count) => {
        if (count > 0) console.log(`⏱ Đã tự động đánh dấu "không đến" cho ${count} lịch hẹn quá giờ nhận khách.`);
      })
      .catch((err) => console.error('Lỗi khi quét lịch hẹn không đến:', err))
      .finally(() => { sweepInFlight = false; });
  }
  next();
}

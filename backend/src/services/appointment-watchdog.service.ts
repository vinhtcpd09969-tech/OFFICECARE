import prisma from '../config/prisma';
import notificationService from './notification.service';

class AppointmentWatchdogService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) return;

    // Run immediately on start
    this.runWatchdog().catch(err => {
      console.error('Lỗi khi chạy Watchdog lần đầu:', err);
    });

    // Run every 2 minutes (120000 ms)
    this.intervalId = setInterval(() => {
      this.runWatchdog().catch(err => {
        console.error('Lỗi khi chạy định kỳ Watchdog:', err);
      });
    }, 2 * 60 * 1000);

    console.log('Watchdog service đã được khởi chạy (chu kỳ 2 phút).');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Watchdog service đã dừng.');
    }
  }

  async runWatchdog() {
    const now = new Date();

    // Query các lịch đặt chưa xác nhận/chờ gán đã quá giờ hẹn bắt đầu
    const expiredAppointments = await prisma.lich_dat.findMany({
      where: {
        trang_thai: { in: ['cho_xac_nhan', 'chua_xac_nhan'] },
        ngay_gio_bat_dau: { lt: now }
      },
      include: {
        khach_hang: {
          include: {
            nguoi_dung: true
          }
        }
      }
    });

    if (expiredAppointments.length === 0) return;

    console.log(`[Watchdog] Phát hiện ${expiredAppointments.length} lịch đặt quá hạn xác nhận/phân bổ.`);

    for (const appt of expiredAppointments) {
      const tenKhach = appt.khach_hang?.nguoi_dung?.ho_ten || appt.ho_ten_khach || 'Khách hàng';
      const sdt = appt.khach_hang?.nguoi_dung?.so_dien_thoai || appt.so_dien_thoai || 'Chưa cập nhật';
      const isPastStart = new Date(appt.ngay_gio_bat_dau) < now;
      const ly_do_huy = isPastStart 
        ? 'Hệ thống tự hủy: Quá thời gian bắt đầu hẹn mà chưa được xác nhận'
        : 'Hệ thống tự hủy: Quản lý chưa phân bổ nhân sự trong hạn xác nhận';

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Cập nhật trạng thái lịch sang 'da_huy'
          await tx.lich_dat.update({
            where: { id: appt.id },
            data: {
              trang_thai: 'da_huy',
              ly_do_huy,
              thoi_gian_huy: now
            }
          });

          // 2. Gửi thông báo đến Admin (role 5), Quản lý (role 6) và Lễ tân (role 2)
          const message = `Lịch khám ${appt.ma_lich_dat} của bệnh nhân ${tenKhach} (SĐT: ${sdt}) đã bị hệ thống tự động hủy do quá hạn xác nhận/phân bổ.`;
          await notificationService.notifyRole(5, 'Tự động hủy lịch quá hạn', message, 'he_thong');
          await notificationService.notifyRole(6, 'Tự động hủy lịch quá hạn', message, 'he_thong');
          await notificationService.notifyRole(2, 'Tự động hủy lịch quá hạn', message, 'he_thong');

          // 3. Gửi thông báo đến tài khoản khách hàng nếu có
          if (appt.khach_hang?.nguoi_dung_id) {
            await notificationService.createNotification(
              appt.khach_hang.nguoi_dung_id,
              'Lịch khám đã bị hủy',
              `Lịch khám ${appt.ma_lich_dat} lúc ${new Date(appt.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} của bạn đã bị hủy do phòng khám không kịp sắp xếp nhân sự. Chúng tôi chân thành xin lỗi và sẽ liên hệ sớm nhất để sắp xếp lại lịch cho bạn.`,
              'lich_hen'
            );
          }
        });

        console.log(`[Watchdog] Tự động hủy thành công lịch hẹn ${appt.ma_lich_dat}.`);
      } catch (err) {
        console.error(`[Watchdog] Lỗi khi xử lý hủy tự động lịch ${appt.ma_lich_dat}:`, err);
      }
    }
  }
}

export default new AppointmentWatchdogService();

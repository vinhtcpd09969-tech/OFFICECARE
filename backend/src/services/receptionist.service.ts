import receptionistRepository from '../repositories/receptionist.repository';

class ReceptionistService {
  async getTodayAppointments() {
    const rows = await receptionistRepository.getTodayAppointments();
    return {
      cho_xac_nhan: rows.filter(r => r.trang_thai === 'cho_xac_nhan'),
      da_xac_nhan: rows.filter(r => r.trang_thai === 'da_xac_nhan'),
      da_checkin: rows.filter(r => r.trang_thai === 'da_checkin'),
      hoan_thanh: rows.filter(r => r.trang_thai === 'hoan_thanh'),
    };
  }

  async updateAppointmentStatus(id: string, trang_thai: string) {
    const appointment = await receptionistRepository.updateAppointmentStatus(id, trang_thai);
    if (!appointment) throw new Error('Không tìm thấy lịch hẹn');
    return appointment;
  }

  async getReceptionistStats() {
    const stats = await receptionistRepository.getReceptionistStats();
    return {
      checkin: parseInt(stats.checkin_count),
      waiting: parseInt(stats.waiting_count),
      total: parseInt(stats.total_today)
    };
  }

  async handleWalkInBooking(data: any) {
    const { sdt, ho_ten, gioi_tinh, ngay_sinh, dich_vu_id, ky_thuat_vien_id, gio_bat_dau } = data;

    let khachHangId;
    const existCust = await receptionistRepository.findCustomerByPhone(sdt);
    
    if (existCust) {
      khachHangId = existCust.khach_hang_id;
    } else {
      khachHangId = await receptionistRepository.createWalkInCustomer(ho_ten, sdt, gioi_tinh, ngay_sinh);
    }

    const duration = await receptionistRepository.getServiceDuration(dich_vu_id);
    const startTime = new Date(gio_bat_dau);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const maLichDat = `LD${Math.floor(100000 + Math.random() * 900000)}`;

    const lich_dat_id = await receptionistRepository.createAppointment(maLichDat, khachHangId, dich_vu_id, ky_thuat_vien_id, startTime, endTime);
    return { lich_dat_id };
  }

  async createBillingFromAppointment(lich_dat_id: string) {
    const lich = await receptionistRepository.getAppointmentForBilling(lich_dat_id);
    if (!lich) throw new Error('Lịch hẹn không hợp lệ hoặc chưa hoàn thành');

    const maHoaDon = `HD${Math.floor(100000 + Math.random() * 900000)}`;
    const hoa_don = await receptionistRepository.createBilling(maHoaDon, lich.khach_hang_id, lich_dat_id, lich.don_gia, lich.dich_vu_id);
    return hoa_don;
  }

  async processPayment(data: any) {
    const { hoa_don_id, phuong_thuc, so_tien_nhan } = data;
    const hd = await receptionistRepository.getInvoiceById(hoa_don_id);
    if (!hd) throw new Error('Không tìm thấy hóa đơn');

    const tong_tien = Number(hd.tong_tien_thanh_toan);
    const tien_nhan = Number(so_tien_nhan);

    if (tien_nhan < tong_tien) throw new Error('Số tiền nhận không đủ');

    const maGiaoDich = `GD${Math.floor(10000000 + Math.random() * 90000000)}`;
    await receptionistRepository.processPayment(hoa_don_id, maGiaoDich, tong_tien, phuong_thuc);
    return { success: true };
  }
}

export default new ReceptionistService();

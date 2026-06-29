import appointmentRepository from '../repositories/appointment.repository';
import notificationService from './notification.service';
import prisma from '../config/prisma';
import appointmentWatchdog from './appointment-watchdog.service';

class AppointmentService {
  async getAllAppointments() {
    return appointmentRepository.getAllAppointments();
  }

  async createAppointment(data: any) {
    const ma_lich_dat = 'LD-' + Math.floor(10000 + Math.random() * 90000);
    return appointmentRepository.createAppointment(ma_lich_dat, data);
  }

  async createPublicAppointment(data: any) {
    const ma_lich_dat = 'LD-' + Math.floor(10000 + Math.random() * 90000);
    // Mặc định thời lượng khám là 30 phút
    const ngay_gio_ket_thuc = new Date(new Date(data.ngay_gio_bat_dau).getTime() + 30 * 60000).toISOString();
    const appointment = await appointmentRepository.createPublicAppointment(ma_lich_dat, { ...data, ngay_gio_ket_thuc, trang_thai: 'chua_xac_nhan' });
    
    // Gửi email xác nhận bất đồng bộ
    this.resendConfirmationEmail(appointment.id).catch(err => {
      console.error('Lỗi gửi email xác nhận tự động:', err);
    });

    return appointment;
  }

  async updateAppointmentStatus(id: string, data: { trang_thai: string; ky_thuat_vien_id?: string | null; phong_id?: string | number | null; ly_do_huy?: string | null }) {
    const appointment = await appointmentRepository.updateAppointmentStatus(id, data);
    if (!appointment) {
      throw new Error('Không tìm thấy lịch hẹn');
    }
    
    // Kích hoạt thông báo bất đồng bộ cho khách hàng
    notificationService.triggerAppointmentNotification(id, data.trang_thai).catch(err => {
      console.error('Lỗi khi trigger thông báo từ service:', err);
    });

    return appointment;
  }

  async updateMedicalRecord(id: string, data: { chan_doan?: string, chong_chi_dinh?: string, khuyen_nghi_dich_vu_id?: string | null, khuyen_nghi_goi_id?: string | null }) {
    return appointmentRepository.updateMedicalRecord(id, data);
  }

  async getCustomerAppointments(nguoi_dung_id: string) {
    return appointmentRepository.getCustomerAppointments(nguoi_dung_id);
  }

  async cancelCustomerAppointment(id: string, nguoi_dung_id: string, ly_do_huy: string) {
    const appointment = await appointmentRepository.cancelCustomerAppointment(id, nguoi_dung_id, ly_do_huy);
    if (!appointment) {
      throw new Error('Lịch hẹn không tồn tại hoặc không thể hủy.');
    }
    return appointment;
  }

  async cancelBreakTimeAppointments() {
    return appointmentRepository.cancelBreakTimeAppointments();
  }

  async getBookedSlots(dateStr: string, userId?: string, phone?: string, duration: number = 30, dichVuId?: string) {
    return appointmentRepository.getBookedSlots(dateStr, userId, phone, duration, dichVuId);
  }

  async checkCustomerHasClinicalExamOnDate(userId?: string, phone?: string, dateStr?: string) {
    if (!dateStr) return false;
    return appointmentRepository.checkCustomerHasClinicalExamOnDateByUserId(
      userId || null,
      phone || null,
      dateStr
    );
  }

  async getActiveDoctorDates() {
    return appointmentRepository.getActiveDoctorDates();
  }

  async getPublicServices() {
    return appointmentRepository.getPublicServices();
  }

  async getPublicAppointmentById(id: string) {
    return appointmentRepository.getPublicAppointmentById(id);
  }

  async getCustomerMedicalRecord(nguoi_dung_id: string) {
    return appointmentRepository.getCustomerMedicalRecord(nguoi_dung_id);
  }

  async getCustomerTreatmentSessions(nguoi_dung_id: string) {
    return appointmentRepository.getCustomerTreatmentSessions(nguoi_dung_id);
  }

  async getWatchdogStatus() {
    const now = new Date();
    const expiredCount = await prisma.lich_dat.count({
      where: {
        trang_thai: { in: ['cho_xac_nhan', 'chua_xac_nhan'] },
        bac_si_id: null,
        han_xac_nhan: { lt: now }
      }
    });
    const pendingCount = await prisma.lich_dat.count({
      where: {
        trang_thai: { in: ['cho_xac_nhan', 'chua_xac_nhan'] },
        bac_si_id: null
      }
    });
    return { expiredCount, pendingCount };
  }

  async runWatchdogManually() {
    await appointmentWatchdog.runWatchdog();
    return { success: true };
  }

  async keepAliveAppointment(id: string) {
    const appt = await prisma.lich_dat.findUnique({
      where: { id }
    });

    if (!appt) {
      throw new Error('Lịch hẹn không tồn tại');
    }

    return appt;
  }

  async confirmEmailAppointment(id: string) {
    const appt = await prisma.lich_dat.findUnique({
      where: { id }
    });

    if (!appt) {
      throw new Error('Lịch hẹn không tồn tại');
    }

    if (appt.trang_thai === 'chua_xac_nhan') {
      const updated = await prisma.lich_dat.update({
        where: { id },
        data: {
          trang_thai: 'cho_xac_nhan'
        }
      });
      return updated;
    }

    return appt;
  }

  async resendConfirmationEmail(id: string) {
    const appt = await prisma.lich_dat.findUnique({
      where: { id },
      include: {
        khach_hang: true
      }
    });

    if (!appt) {
      throw new Error('Lịch hẹn không tồn tại');
    }

    let targetEmail = appt.khach_hang?.email;
    let targetName = appt.khach_hang?.ho_ten || appt.ho_ten_khach || 'Khách hàng';

    if (!targetEmail && appt.so_dien_thoai) {
      const customerRes = await prisma.khach_hang.findFirst({
        where: { so_dien_thoai: appt.so_dien_thoai }
      });
      if (customerRes?.email) {
        targetEmail = customerRes.email;
        targetName = customerRes.ho_ten;
      }
    }

    if (!targetEmail) {
      // Fallback: If no account email, construct from phone number
      const sdt = appt.khach_hang?.so_dien_thoai || appt.so_dien_thoai || '0901234567';
      targetEmail = `${sdt}@officecare.placeholder`;
    }

    let serviceName = 'Khám Lượng Giá Lâm Sàng';
    if (appt.dich_vu_id) {
      const srv = await prisma.dich_vu.findUnique({
        where: { id: appt.dich_vu_id }
      });
      if (srv) {
        serviceName = srv.ten_dich_vu;
      }
    }

    const startDate = new Date(appt.ngay_gio_bat_dau);
    const timeStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
    const dateStr = startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

    const { sendBookingConfirmationEmail } = require('../utils/mailer');
    await sendBookingConfirmationEmail(targetEmail, targetName, appt.id, dateStr, timeStr, serviceName);
  }
}

export default new AppointmentService();

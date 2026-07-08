import { Request, Response } from 'express';
import receptionistService from '../services/receptionist.service';

// GET /api/receptionist/today-appointments
export const getTodayAppointments = async (req: Request, res: Response) => {
  try {
    const kanbanData = await receptionistService.getTodayAppointments();
    res.json(kanbanData);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn hôm nay:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/dashboard
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const data = await receptionistService.getDashboardData();
    res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dashboard lễ tân:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PATCH /api/receptionist/appointments/:id/status
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { trang_thai, ly_do_huy, ghi_chu_noi_bo } = req.body;
    const finalNote = ghi_chu_noi_bo !== undefined ? ghi_chu_noi_bo : ly_do_huy;
    if (['da_huy', 'da_huy_phat', 'khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(trang_thai)) {
      if (!finalNote || !finalNote.trim()) {
        return res.status(400).json({ message: 'Ghi chú nội bộ (Lý do hủy/vắng mặt) là bắt buộc.' });
      }
    }
    const appointment = await receptionistService.updateAppointmentStatus(id, trang_thai, finalNote);
    res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi cập nhật trạng thái:', error);
    if (error.message === 'Không tìm thấy lịch hẹn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'ROOM_UNAVAILABLE') {
      return res.status(400).json({ message: 'Không có phòng trống cho dịch vụ này tại thời điểm hiện tại.' });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/stats
export const getReceptionistStats = async (req: Request, res: Response) => {
  try {
    const stats = await receptionistService.getReceptionistStats();
    res.json(stats);
  } catch (error) {
    console.error('Lỗi thống kê:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/walk-in
export const handleWalkInBooking = async (req: Request, res: Response) => {
  try {
    const result = await receptionistService.handleWalkInBooking(req.body);
    res.json({ message: 'Tạo lịch thành công', ...result });
  } catch (error: any) {
    console.error('Lỗi Walk-in booking:', error);
    if (error.message === 'ROOM_UNAVAILABLE') {
      return res.status(400).json({ message: 'Không có phòng trống cho dịch vụ này tại thời điểm hiện tại.' });
    }
    res.status(500).json({ message: 'Lỗi server khi tạo lịch' });
  }
};

// POST /api/receptionist/billing
export const createBillingFromAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { lich_dat_id } = req.body;
    const result = await receptionistService.createBillingFromAppointment(lich_dat_id);
    res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
  } catch (error: any) {
    console.error('Lỗi khi tạo hóa đơn:', error);
    if (error.message === 'Lịch hẹn không hợp lệ hoặc chưa hoàn thành') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/payment
export const processPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.processPayment(req.body);
    res.json({ message: 'Thanh toán thành công', ...result });
  } catch (error: any) {
    console.error('Lỗi thanh toán:', error);
    if (error.message === 'Không tìm thấy hóa đơn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Số tiền nhận không đủ')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/billing/calculate
export const calculateBilling = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.calculateBilling(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi tính hóa đơn:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/receptionist/billing/create
export const createBillingDirect = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.createBillingDirect(req.body);
    res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
  } catch (error: any) {
    console.error('Lỗi tạo hóa đơn direct:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/receptionist/treatment-plans/confirm
export const confirmTreatmentPlan = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.confirmTreatmentPlan(req.body);
    res.json({ message: 'Chốt gói trị liệu thành công', lich_dieu_tri: result });
  } catch (error: any) {
    console.error('Lỗi chốt gói trị liệu:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/receptionist/sessions/:id/services
export const updateSessionServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { services } = req.body;
    const result = await receptionistService.updateSessionServices(id, services);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi cập nhật dịch vụ buổi trị liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/sessions/:id/services
export const getSessionServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const result = await receptionistService.getSessionServices(id);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy dịch vụ buổi trị liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/packages
export const getPackagesForReceptionist = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.getActivePackages();
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách gói trị liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/completed-consultations
export const getCompletedConsultations = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.getCompletedAppointments();
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách khám hoàn thành:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/auto-vouchers
export const getAutoVouchers = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.getAutoVouchers();
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách voucher tự động:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/search
export const searchCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    const result = await receptionistService.searchCustomers(q);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi tìm kiếm khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/treatment-plans
export const getCustomerTreatmentPlans = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const result = await receptionistService.getCustomerTreatmentPlans(id);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách phác đồ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/appointments/:id/billing-info
export const getAppointmentBillingInfo = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const result = await receptionistService.getAppointmentBillingInfo(id);
    if (!result) {
      return res.status(444).json({ message: 'Không tìm thấy lịch hẹn hoặc hóa đơn liên quan' });
    }
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy thông tin thanh toán lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/check-limit
export const checkCustomerLimit = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số date (YYYY-MM-DD)' });
    }
    
    const appointmentRepository = require('../repositories/appointment.repository').default;
    const limitReached = await appointmentRepository.checkCustomerHasClinicalExamOnDate(id, null, date);
    
    return res.json({ limitReached });
  } catch (error: any) {
    console.error('Lỗi khi kiểm tra giới hạn đặt lịch của khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/check-package-payment
export const checkPackagePayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: customerId } = req.params;
    const { package_id: packageId } = req.query;
    if (!packageId || typeof packageId !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số package_id' });
    }

    const { pool } = require('../config/db');
    const { rows } = await pool.query(`
      SELECT hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.hinh_thuc_thanh_toan_goi, hd.trang_thai
      FROM phac_do_dieu_tri pd
      JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1 AND pd.goi_dich_vu_id = $2
      ORDER BY hd.ngay_tao DESC LIMIT 1
    `, [customerId, packageId]);

    if (rows.length === 0) {
      return res.json({ paid: false, message: 'Chưa thanh toán/đăng ký gói trị liệu này.' });
    }

    const invoiceObj = rows[0];
    const tongTien = Number(invoiceObj.tong_tien_phai_tra || 0);
    const daThanhToan = Number(invoiceObj.so_tien_da_tra || 0);
    const hinhThuc = invoiceObj.hinh_thuc_thanh_toan_goi || 'tra_thang';

    if (hinhThuc === 'tra_thang') {
      if (daThanhToan < tongTien) {
        return res.json({ paid: false, message: 'Gói trị liệu yêu cầu hoàn tất thanh toán 100% trước khi đặt lịch.' });
      }
    } else if (hinhThuc === 'tra_gop') {
      const target50 = Math.round(tongTien * 0.5);
      if (daThanhToan < target50) {
        return res.json({ paid: false, message: 'Gói trị liệu (Trả góp) yêu cầu thanh toán Đợt 1 (tối thiểu 50%) trước khi đặt lịch.' });
      }
    }

    return res.json({ paid: true });
  } catch (error: any) {
    console.error('Lỗi khi kiểm tra thanh toán gói của khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import appointmentService from '../services/appointment.service';
import { createAppointmentSchema, updateAppointmentStatusSchema, createPublicAppointmentSchema, updateMedicalRecordSchema } from '../schemas/appointment.schema';

// Lấy danh sách lịch hẹn
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo lịch hẹn mới
export const createAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = createAppointmentSchema.parse({ body: req.body });
    const appointment = await appointmentService.createAppointment(validated.body);
    return res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message && (error.message.includes('dùng thử') || error.message.includes('trải nghiệm'))) {
      return res.status(400).json({ message: error.message });
    }
    if (error.constraint === 'no_overlap_ktv') {
      return res.status(400).json({ message: 'Kỹ thuật viên đã có lịch trong khung giờ này.' });
    }
    if (error.constraint === 'no_overlap_phong') {
      return res.status(400).json({ message: 'Phòng đã được đặt trong khung giờ này.' });
    }
    if (error.constraint === 'no_overlap_khach_hang') {
      return res.status(400).json({ message: 'Khách hàng đã có lịch hẹn hoặc ca điều trị khác trong khung giờ này.' });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo lịch hẹn từ Website (Public)
export const createPublicAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = createPublicAppointmentSchema.parse({ body: req.body });
    const appointment = await appointmentService.createPublicAppointment(validated.body);
    return res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch hẹn public:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message && (
      error.message.includes('hết chỗ') || 
      error.message.includes('Đã hết thiết bị') ||
      error.message.includes('quá tải') ||
      error.message.includes('đã có lịch')
    )) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật trạng thái
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = updateAppointmentStatusSchema.parse({ params: req.params, body: req.body });
    const { id } = validated.params;

    const appointment = await appointmentService.updateAppointmentStatus(id, validated.body);
    return res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Không tìm thấy lịch hẹn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.constraint === 'no_overlap_ktv') {
      return res.status(400).json({ message: 'Kỹ thuật viên đã có lịch trong khung giờ này.' });
    }
    if (error.constraint === 'no_overlap_phong') {
      return res.status(400).json({ message: 'Phòng đã được đặt trong khung giờ này.' });
    }
    if (error.constraint === 'no_overlap_khach_hang') {
      return res.status(400).json({ message: 'Khách hàng đã có lịch hẹn hoặc ca điều trị khác trong khung giờ này.' });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật hồ sơ bệnh án (Bác sĩ)
export const updateMedicalRecord = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = updateMedicalRecordSchema.parse({ params: req.params, body: req.body });
    const { id } = validated.params;

    const appointment = await appointmentService.updateMedicalRecord(id, validated.body);
    return res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi cập nhật hồ sơ bệnh án:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Không tìm thấy lịch khám để cập nhật hồ sơ') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy danh sách lịch hẹn của Khách hàng đang đăng nhập
export const getCustomerAppointments = async (req: Request, res: Response): Promise<any> => {
  try {
    const nguoi_dung_id = (req as any).user.id;
    const appointments = await appointmentService.getCustomerAppointments(nguoi_dung_id);
    return res.json(appointments);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn của khách hàng:', error);
    return res.status(500).json({ message: 'Lỗi server khi truy vấn lịch hẹn.' });
  }
};

// Khách hàng tự hủy lịch hẹn của mình
export const cancelCustomerAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const nguoi_dung_id = (req as any).user.id;
    const ly_do_huy = req.body.ly_do_huy as string;

    if (!ly_do_huy) {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do hủy lịch hẹn.' });
    }

    const appointment = await appointmentService.cancelCustomerAppointment(id, nguoi_dung_id, ly_do_huy);
    return res.json({ success: true, message: 'Đã hủy lịch hẹn thành công.', appointment });
  } catch (error: any) {
    console.error('Lỗi khi khách hàng hủy lịch:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server khi hủy lịch hẹn.' });
  }
};

// Hủy tự động tất cả các lịch nằm trong giờ nghỉ trưa
export const cancelBreakTimeAppointments = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await appointmentService.cancelBreakTimeAppointments();
    return res.json({
      success: true,
      message: `Đã hủy tự động ${result.cancelled_count} lịch hẹn nằm trong giờ nghỉ trưa.`,
      cancelledCount: result.cancelled_count
    });
  } catch (error: any) {
    console.error('Lỗi khi dọn lịch giờ nghỉ trưa:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server khi dọn dẹp lịch giờ nghỉ.' });
  }
};

// Lấy danh sách khung giờ đã đặt cho ngày cụ thể (public - dùng cho trang booking client)
export const getBookedSlots = async (req: Request, res: Response): Promise<any> => {
  try {
    const { date, userId, phone, duration } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số ngày (date=YYYY-MM-DD)' });
    }
    const durationNum = duration ? parseInt(duration as string, 10) : 30;
    const bookedSlots = await appointmentService.getBookedSlots(
      date,
      typeof userId === 'string' ? userId : undefined,
      typeof phone === 'string' ? phone : undefined,
      durationNum
    );

    let hasExistingClinicalExam = false;
    if (typeof userId === 'string' || typeof phone === 'string') {
      hasExistingClinicalExam = await appointmentService.checkCustomerHasClinicalExamOnDate(
        typeof userId === 'string' ? userId : undefined,
        typeof phone === 'string' ? phone : undefined,
        date
      );
    }

    return res.json({ bookedSlots, hasExistingClinicalExam });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách giờ đã đặt:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Lấy danh sách các ngày có lịch trực của Bác sĩ (public - dùng cho trang booking client)
export const getActiveDoctorDates = async (req: Request, res: Response): Promise<any> => {
  try {
    const dates = await appointmentService.getActiveDoctorDates();
    return res.json({ dates });
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách ngày có lịch trực của Bác sĩ:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Lấy danh sách dịch vụ công khai cho khách hàng đặt lịch trực tiếp
export const getPublicServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const services = await appointmentService.getPublicServices();
    return res.json(services);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách dịch vụ công khai:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Lấy chi tiết lịch hẹn công khai (dành cho theo dõi tiến trình)
export const getPublicAppointmentById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: 'Mã lịch hẹn không hợp lệ.' });
    }

    const appointment = await appointmentService.getPublicAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin lịch hẹn.' });
    }

    return res.json(appointment);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn công khai:', error);
    return res.status(500).json({ message: 'Lỗi server khi truy vấn lịch hẹn.' });
  }
};

export const getCustomerMedicalRecord = async (req: Request, res: Response): Promise<any> => {
  try {
    const nguoi_dung_id = (req as any).user.id;
    const record = await appointmentService.getCustomerMedicalRecord(nguoi_dung_id);
    return res.json(record);
  } catch (error) {
    console.error('Lỗi khi lấy bệnh án khách hàng:', error);
    return res.status(500).json({ message: 'Lỗi server khi truy vấn bệnh án.' });
  }
};

export const getCustomerTreatmentSessions = async (req: Request, res: Response): Promise<any> => {
  try {
    const nguoi_dung_id = (req as any).user.id;
    const sessions = await appointmentService.getCustomerTreatmentSessions(nguoi_dung_id);
    return res.json(sessions);
  } catch (error) {
    console.error('Lỗi khi lấy ca điều trị khách hàng:', error);
    return res.status(500).json({ message: 'Lỗi server khi truy vấn ca điều trị.' });
  }
};

export const getWatchdogStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const status = await appointmentService.getWatchdogStatus();
    return res.json(status);
  } catch (error: any) {
    console.error('Lỗi khi lấy trạng thái watchdog:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

export const runWatchdogManually = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await appointmentService.runWatchdogManually();
    return res.json(result);
  } catch (error: any) {
    console.error('Lỗi khi chạy watchdog thủ công:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

export const keepAliveAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const appointment = await appointmentService.keepAliveAppointment(id);
    return res.json({ success: true, appointment });
  } catch (error: any) {
    console.error('Lỗi khi gia hạn giữ chỗ lịch hẹn:', error);
    return res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

export const confirmEmailAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await appointmentService.confirmEmailAppointment(id);
    return res.redirect(`http://localhost:3000/booking/success/${id}?confirmed=true`);
  } catch (error: any) {
    console.error('Lỗi khi xác nhận lịch qua email:', error);
    return res.status(400).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #ef4444;">Xác nhận không thành công</h2>
        <p>${error.message || 'Lỗi hệ thống'}</p>
        <a href="http://localhost:3000/" style="color: #2EC4B6; font-weight: bold; text-decoration: none;">Quay lại Trang chủ</a>
      </div>
    `);
  }
};

export const resendConfirmationEmail = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await appointmentService.resendConfirmationEmail(id);
    return res.json({ success: true, message: 'Đã gửi lại email xác nhận thành công!' });
  } catch (error: any) {
    console.error('Lỗi khi gửi lại email xác nhận:', error);
    return res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};


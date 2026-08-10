import { Request, Response } from 'express';
import { ZodError } from 'zod';
import appointmentService from '../services/appointment.service';
import { createAppointmentSchema, updateAppointmentStatusSchema, createPublicAppointmentSchema } from '../schemas/appointment.schema';

// Lấy danh sách lịch hẹn
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : undefined;
    const appointments = await appointmentService.getAllAppointments(userRole);
    res.json(appointments);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const validated = createAppointmentSchema.parse({ body: req.body });
    const appointment = await appointmentService.createAppointment({
      ...validated.body,
      nguoi_tao_id: req.user?.id ? Number(req.user.id) : null
    });
    return res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message && (error.message.includes('dùng thử') || error.message.includes('trải nghiệm') || error.message.includes('giới hạn') || error.message.includes('tối đa') || error.message.includes('đạt giới hạn'))) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message && !error.stack?.includes('pg') && !error.stack?.includes('Prisma') && !error.message.includes('connection') && !error.message.includes('database')) {
      return res.status(400).json({ message: error.message });
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
    if (error.message && !error.stack?.includes('pg') && !error.stack?.includes('Prisma') && !error.message.includes('connection')) {
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
    const actorRoleId = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : undefined;

    const appointment = await appointmentService.updateAppointmentStatus(id, validated.body, actorRoleId);
    return res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    if (error.message === 'Không tìm thấy lịch hẹn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    // Lỗi nghiệp vụ từ service/repository (vd "Gói trị liệu liên kết chưa được thanh toán...")
    // không đặt statusCode riêng — vẫn phải trả message gốc dạng 400, không được nuốt thành 500
    // chung chung (quy tắc bất di bất dịch #5).
    if (error.message && !error.stack?.includes('pg') && !error.stack?.includes('Prisma') && !error.message.includes('connection') && !error.message.includes('database')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// B11 (bản Lễ tân) — đẩy 1 lịch hẹn xuống cuối hàng đợi (khách rời chỗ chờ, không phải "không đến")
export const pushBackAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const result = await appointmentService.pushBackAppointment(id);
    return res.json(result);
  } catch (error: any) {
    console.error('Lỗi khi đẩy lịch hẹn xuống hàng đợi:', error);
    if (error.message && !error.stack?.includes('pg') && !error.stack?.includes('Prisma') && !error.message.includes('connection')) {
      return res.status(400).json({ message: error.message });
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
    const ly_do_huy = (req.body.ghi_chu_noi_bo || req.body.ly_do_huy) as string;

    if (!ly_do_huy) {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do hủy lịch hẹn.' });
    }

    const appointment = await appointmentService.cancelCustomerAppointment(id, nguoi_dung_id, ly_do_huy);
    return res.json({ success: true, message: 'Đã hủy lịch hẹn thành công.', appointment });
  } catch (error: any) {
    console.error('Lỗi khi khách hàng hủy lịch:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    // Lỗi nghiệp vụ (message có sẵn, không phải lỗi hạ tầng pg/Prisma) → 400 kèm message gốc.
    const status = error.message && !error.stack?.includes('pg') && !error.stack?.includes('Prisma') ? 400 : 500;
    return res.status(status).json({ message: error.message || 'Lỗi server khi hủy lịch hẹn.' });
  }
};

// Khách hàng tự đổi lịch hẹn đã thanh toán của mình
export const rescheduleCustomerAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const nguoi_dung_id = (req as any).user.id;
    const { new_date, new_buoi, new_staff_id } = req.body;

    if (!new_date || !new_buoi) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày và buổi mới.' });
    }

    const appointment = await appointmentService.rescheduleCustomerAppointment(id, nguoi_dung_id, new_date, new_buoi, new_staff_id);
    return res.json({ success: true, message: 'Đổi lịch hẹn thành công.', appointment });
  } catch (error: any) {
    console.error('Lỗi khi khách hàng đổi lịch:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    const status = error.message && !error.stack?.includes('pg') && !error.stack?.includes('Prisma') ? 400 : 500;
    return res.status(status).json({ message: error.message || 'Lỗi server khi đổi lịch hẹn.' });
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

// Sức chứa 2 buổi (sáng/chiều) cho 1 ngày — nguồn dữ liệu cho màn hình đặt lịch (A1, thay
// getBookedSlots dạng lưới giờ cố định cũ).
export const getBuoiAvailability = async (req: Request, res: Response): Promise<any> => {
  try {
    const { date, userId, phone, dichVuId, dich_vu_id } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số ngày (date=YYYY-MM-DD)' });
    }
    const serviceId = (typeof dichVuId === 'string' ? dichVuId : (typeof dich_vu_id === 'string' ? dich_vu_id : undefined));
    const result = await appointmentService.getBuoiAvailability(
      date,
      serviceId,
      typeof userId === 'string' ? userId : undefined,
      typeof phone === 'string' ? phone : undefined
    );

    let isPhoneTakenByOther = false;
    if (typeof userId === 'string' && userId && typeof phone === 'string' && phone.trim()) {
      isPhoneTakenByOther = await appointmentService.checkPhoneTakenByOther(phone.trim(), userId);
    }

    return res.json({ ...result, isPhoneTakenByOther });
  } catch (error: any) {
    console.error('Lỗi khi lấy sức chứa theo buổi:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// Lấy danh sách các ngày có lịch trực của Bác sĩ (public - dùng cho trang booking client)
// B15 — ngân sách phút còn lại của từng nhân sự cho 1 buổi/ngày, dùng khi Admin/Quản lý đổi nhân sự.
export const getStaffBudgetForBuoi = async (req: Request, res: Response): Promise<any> => {
  try {
    const { date, buoi, loai, excludeApptId } = req.query;
    if (typeof date !== 'string' || (buoi !== 'sang' && buoi !== 'chieu') || typeof loai !== 'string') {
      return res.status(400).json({ message: 'Thiếu hoặc sai tham số date/buoi/loai' });
    }
    const result = await appointmentService.getStaffBudgetForBuoi(
      date,
      buoi,
      loai,
      typeof excludeApptId === 'string' ? excludeApptId : undefined
    );
    return res.json(result);
  } catch (error: any) {
    console.error('Lỗi khi lấy ngân sách phút của nhân sự:', error);
    return res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

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
    return res.status(500).json({ message: 'Lỗi server khi truy vấn bệnh án.', detail: (error as any)?.message || String(error) });
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

export const getCustomerInvoices = async (req: Request, res: Response): Promise<any> => {
  try {
    const nguoi_dung_id = (req as any).user.id;
    const data = await appointmentService.getCustomerInvoices(nguoi_dung_id);
    return res.json(data);
  } catch (error) {
    console.error('Lỗi khi lấy hóa đơn khách hàng:', error);
    return res.status(500).json({ message: 'Lỗi server khi truy vấn hóa đơn.' });
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



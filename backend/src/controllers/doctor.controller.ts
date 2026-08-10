import { Request, Response } from 'express';
import doctorService from '../services/doctor.service';
import adminService from '../services/admin.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    vai_tro_id: number;
  };
}

// GET /api/doctor/queue
export const getQueue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const queue = await doctorService.getQueue(userId, userRole);
    res.json(queue);
  } catch (error: any) {
    console.error('Lỗi khi lấy hàng đợi bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/appointments
export const getAppointments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    
    const appointments = await doctorService.getAppointments(userId, userRole, startDate, endDate);
    res.json(appointments);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách lịch hẹn bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/patients/:patientId/profile
export const getPatientProfile = async (req: Request, res: Response) => {
  try {
    let { patientId } = req.params as { patientId: string };
    const userRole = Number((req as any).user?.vai_tro_id || 0);
    const userId = String((req as any).user?.id || '');

    // Nếu là Khách hàng (role 1), mặc định lấy hồ sơ của chính mình nếu patientId là 'me' hoặc rỗng
    if (userRole === 1 && (!patientId || patientId === 'me' || patientId === 'my-profile')) {
      patientId = userId;
    }

    if (!patientId) {
      return res.status(400).json({ message: 'Thiếu ID khách hàng.' });
    }
    const profile = await doctorService.getPatientMedicalProfile(patientId);
    res.json(profile);
  } catch (error: any) {
    console.error('Lỗi khi lấy hồ sơ bệnh án khách hàng:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/appointments/:id
export const getAppointmentDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;
    if (!id) {
      return res.status(400).json({ message: 'Thiếu ID lịch hẹn.' });
    }
    const detail = await doctorService.getAppointmentDetail(id, userId);
    res.json(detail);
  } catch (error: any) {
    console.error('Lỗi khi lấy chi tiết ca khám:', error);
    res.status(400).json({
      message: error.message || 'Lỗi server',
      activeSessionId: error.activeSessionId,
      errorCode: error.errorCode
    });
  }
};

// POST /api/doctor/appointments/assess
export const saveAssessment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      lich_dat_id, chan_doan, chong_chi_dinh, goi_dich_vu_id, ghi_chu,
      resolvePendingConflict, is_reassessment, han_tai_kham,
      vas_score, rom_data, mmt_data
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    if (!lich_dat_id) {
      return res.status(400).json({ message: 'Thiếu mã lịch khám.' });
    }

    const finalChanDoan = chan_doan?.trim() || 'Chưa điền';
    const finalChongChiDinh = chong_chi_dinh?.trim() || 'Chưa điền';
    const finalGhiChu = ghi_chu?.trim() || null;

    const result = await doctorService.saveAssessment(userId, {
      lich_dat_id,
      chan_doan: finalChanDoan,
      chong_chi_dinh: finalChongChiDinh,
      goi_dich_vu_id: goi_dich_vu_id || null,
      ghi_chu: finalGhiChu,
      resolvePendingConflict,
      is_reassessment: Boolean(is_reassessment),
      han_tai_kham: han_tai_kham || null,
      vas_score: vas_score != null ? Number(vas_score) : null,
      rom_data: rom_data || null,
      mmt_data: mmt_data || null,
    });

    res.json({
      message: is_reassessment ? 'Hẹn tái khám thành công! Lịch hẹn đã chuyển sang Chờ tái lượng giá.' : 'Ghi nhận chẩn đoán lâm sàng và hoàn thành ca khám thành công!',
      ...result,
    });
  } catch (error: any) {
    if (error.errorCode === 'ACTIVE_LIEU_TRINH_CONFLICT' || error.errorCode === 'PENDING_LIEU_TRINH_CONFLICT') {
      return res.status(409).json({
        message: error.message,
        errorCode: error.errorCode,
      });
    }
    console.error('Lỗi khi lưu chẩn đoán:', error);
    res.status(500).json({ message: error.message || 'Lỗi server khi lưu chẩn đoán.' });
  }
};

// POST /api/doctor/appointments/draft
export const saveAssessmentDraft = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      lich_dat_id, chan_doan, chong_chi_dinh, ghi_chu,
      vas_score, rom_data, mmt_data, selected_package_id
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    if (!lich_dat_id) {
      return res.status(400).json({ message: 'Thiếu mã lịch khám.' });
    }

    const result = await doctorService.saveAssessmentDraft(userId, {
      lich_dat_id,
      chan_doan,
      chong_chi_dinh,
      ghi_chu,
      vas_score: vas_score != null ? Number(vas_score) : undefined,
      rom_data,
      mmt_data,
      selected_package_id,
    });

    res.json({
      message: 'Đã lưu nháp kết quả lượng giá.',
      ...result,
    });
  } catch (error: any) {
    console.error('Lỗi khi lưu nháp lượng giá:', error);
    res.status(500).json({ message: error.message || 'Lỗi server khi lưu nháp lượng giá.' });
  }
};

// GET /api/doctor/packages
export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await adminService.getPackages();
    // Lọc ra các gói liệu trình (LIEU_TRINH) đang hoạt động
    const activePackages = packages.filter((pkg: any) => pkg.loai_goi === 'LIEU_TRINH' && pkg.trang_thai === 'hoat_dong');
    res.json(activePackages);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách gói cho bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/schedules
export const getSchedules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const schedules = await doctorService.getSchedules(userId);
    res.json(schedules);
  } catch (error: any) {
    console.error('Lỗi khi lấy lịch trực của bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/doctor/patients
export const getPatients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const patients = await doctorService.getPatients(userId);
    res.json(patients);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách bệnh nhân cho bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/doctor/queue/:id/call-in
export const callInPatient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
    const { id } = req.params as { id: string };
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const result = await doctorService.callInPatient(id, userId, userRole);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi khi gọi bệnh nhân vào phòng:', error);
    res.status(400).json({ message: error.message || 'Không thể gọi bệnh nhân vào phòng.' });
  }
};

// POST /api/doctor/queue/:id/mark-absent
export const markPatientAbsent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.vai_tro_id ? Number(req.user.vai_tro_id) : 4;
    const { id } = req.params as { id: string };
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const result = await doctorService.markPatientAbsent(id, userId, userRole);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi khi đánh dấu bệnh nhân không có mặt:', error);
    res.status(400).json({ message: error.message || 'Không thể đánh dấu không có mặt.' });
  }
};

// GET /api/doctor/active-session
export const getActiveSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
    }
    const activeSession = await doctorService.getActiveSession(userId);
    res.json(activeSession);
  } catch (error: any) {
    console.error('Lỗi khi lấy ca khám đang chạy dở của bác sĩ:', error);
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import adminService from '../services/admin.service';
import { packageSchema, staffSchema, roomSchema, equipmentSchema } from '../schemas/admin.schema';
import { refundSchema, packageRefundSchema, expirePackageNoRefundSchema } from '../schemas/finance.schema';
import { voucherSchema } from '../schemas/marketing.schema';

// --- QUẢN LÝ PHÒNG KHÁM ---

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await adminService.getRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phòng', error });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = roomSchema.parse({ body: req.body });
    const room = await adminService.createRoom(body);
    res.status(201).json(room);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server khi tạo phòng', error });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = roomSchema.parse({ body: req.body });
    const room = await adminService.updateRoom(id, body);
    res.json(room);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật phòng', error });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const room = await adminService.deleteRoom(id);
    res.json({ message: 'Xóa phòng thành công', room });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa phòng', error });
  }
};

// --- QUẢN LÝ GÓI ĐIỀU TRỊ ---

export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await adminService.getPackages();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy gói điều trị' });
  }
};

export const createPackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = packageSchema.parse({ body: req.body });
    const packageData = await adminService.createPackage(body);

    res.status(201).json(packageData);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error instanceof Error) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updatePackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = packageSchema.parse({ body: req.body });
    const packageData = await adminService.updatePackage(id, body);

    res.json(packageData);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error instanceof Error) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deletePackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    await adminService.deletePackage(id);

    res.json({ message: 'Xóa gói điều trị thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa gói điều trị' });
  }
};

// --- QUẢN LÝ DANH MỤC GÓI ---
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await adminService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách danh mục' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await adminService.createCategory(req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo danh mục' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const category = await adminService.updateCategory(id, req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật danh mục' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await adminService.deleteCategory(id);
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa danh mục' });
  }
};

// --- QUẢN LÝ NHÂN SỰ ---

export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await adminService.getStaff();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhân sự' });
  }
};

export const createStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = staffSchema.parse({ body: req.body });
    
    const staff = await adminService.createStaff(body);

    const { mat_khau: _, ...logPayload } = body;

    res.status(201).json(staff);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.message === 'Email đã được sử dụng') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateStaffStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { trang_thai } = req.body;
    
    if (!['hoat_dong', 'vo_hieu'].includes(trang_thai)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const staff = await adminService.updateStaffStatus(id, trang_thai);

    res.json(staff);
  } catch (error: any) {
    if (error.message === 'Không tìm thấy nhân sự') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhân sự' });
  }
};

export const updateStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { ho_ten, so_dien_thoai, vai_tro_id, so_nam_kinh_nghiem, bang_cap_chung_chi, mo_ta, the_manh } = req.body;
    
    if (!ho_ten) {
      return res.status(400).json({ message: 'Họ tên là bắt buộc' });
    }
    if (!vai_tro_id || ![2, 3, 4, 5, 6].includes(Number(vai_tro_id))) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    const staff = await adminService.updateStaffDetails(id, {
      ho_ten,
      so_dien_thoai,
      vai_tro_id,
      so_nam_kinh_nghiem,
      bang_cap_chung_chi,
      mo_ta,
      the_manh
    });

    res.json(staff);
  } catch (error: any) {
    if (error.message === 'Không tìm thấy nhân sự') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhân sự' });
  }
};

export const resetStaffPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const staff = await adminService.resetStaffPassword(id);
    res.json({ message: 'Reset mật khẩu thành công về 123456', staff });
  } catch (error: any) {
    if (error.message === 'Không tìm thấy nhân sự') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi reset mật khẩu' });
  }
};

// --- QUẢN LÝ KHÁCH HÀNG ---

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await adminService.getCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
};


export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await adminService.updateCustomer(id, req.body);
    res.json({ message: 'Cập nhật khách hàng thành công', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật khách hàng' });
  }
};

export const toggleCustomerLock = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isLocked } = req.body;
    const updated = await adminService.updateCustomerLock(id, isLocked);
    res.json({ message: isLocked ? 'Khóa tài khoản thành công' : 'Mở khóa tài khoản thành công', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi khóa/mở khóa tài khoản khách hàng' });
  }
};

const VALID_CUSTOMER_STATUS_FILTERS = ['none', 'le', 'pending', 'progress', 'done', 'cancel', 'any_plan', 'locked'];

export const getCustomersOverview = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(s => VALID_CUSTOMER_STATUS_FILTERS.includes(s));
    const repTierRaw = String(req.query.repTier ?? '');
    const repTier = (['low', 'mid', 'high'] as const).includes(repTierRaw as any) ? (repTierRaw as 'low' | 'mid' | 'high') : undefined;
    const result = await adminService.getCustomersOverview({ page, pageSize, search, status, repTier });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
};

export const getCustomerEmr = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const record = await adminService.getCustomerEmr(id);
    res.json(record);
  } catch (error: any) {
    if (error.message === 'Không tìm thấy khách hàng') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ khách hàng' });
  }
};

// --- QUẢN LÝ THIẾT BỊ Y TẾ ---

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = await adminService.getEquipment();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách thiết bị' });
  }
};

export const createEquipment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = equipmentSchema.parse({ body: req.body });
    const equipment = await adminService.createEquipment(body);

    res.status(201).json(equipment);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi tạo thiết bị' });
  }
};

export const updateEquipment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = equipmentSchema.parse({ body: req.body });
    const equipment = await adminService.updateEquipment(id, body);

    res.json(equipment);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật thiết bị', error });
  }
};

export const deleteEquipment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const equipment = await adminService.deleteEquipment(id);

    res.json({ message: 'Xóa thiết bị thành công', equipment });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa thiết bị', error });
  }
};

// --- QUẢN LÝ LỊCH LÀM VIỆC (CA LÀM VIỆC) ---

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await adminService.getSchedules();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy lịch làm việc' });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = require('../schemas/admin.schema').scheduleSchema.parse({ body: req.body });
    const schedule = await adminService.createSchedule(body);

    res.status(201).json(schedule);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const schedule = await adminService.updateSchedule(id, req.body);
    res.json(schedule);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Lỗi server khi cập nhật lịch trực' });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    await adminService.deleteSchedule(id);
    res.json({ message: 'Xóa lịch trực thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa lịch trực' });
  }
};

// --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ (READ-ONLY) ---

export const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const records = await adminService.getMedicalRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ điều trị' });
  }
};



// --- QUẢN LÝ TÀI CHÍNH (INVOICES & PAYMENTS) ---

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await adminService.getInvoices();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách hóa đơn' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await adminService.getPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách giao dịch' });
  }
};

export const handleRefund = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = refundSchema.parse({ body: req.body });

    const result = await adminService.handleRefund(id, body);

    res.json({ message: 'Hoàn tiền thành công', invoice: result.invoice });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.code && typeof error.code === 'number' && error.code >= 100 && error.code < 600) {
      return res.status(error.code).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Lỗi server khi xử lý hoàn tiền' });
  }
};

export const handlePackageRefund = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = packageRefundSchema.parse({ body: req.body });
    const user = (req as any).user;
    const userId = user ? Number(user.id) : 1;

    const result = await adminService.handlePackageRefund(id, body, userId);

    res.json({
      message: 'Hủy gói và hoàn tiền thành công',
      invoice: result.invoice,
      so_tien_hoan_tra: result.so_tien_hoan_tra
    });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.code && typeof error.code === 'number' && error.code >= 100 && error.code < 600) {
      return res.status(error.code).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Lỗi server khi xử lý hủy gói và hoàn tiền' });
  }
};

export const handleExpirePackageNoRefund = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = expirePackageNoRefundSchema.parse({ body: req.body });
    const user = (req as any).user;
    const userId = user ? Number(user.id) : 1;

    const result = await adminService.expirePackageNoRefund(id, body, userId);

    res.json({
      message: 'Đã hủy gói do quá hạn sử dụng (không hoàn tiền)',
      invoice: result.invoice,
      so_tien_giu_lai: result.so_tien_giu_lai
    });
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.code && typeof error.code === 'number' && error.code >= 100 && error.code < 600) {
      return res.status(error.code).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Lỗi server khi xử lý hủy gói quá hạn' });
  }
};

// --- QUẢN LÝ MARKETING (VOUCHERS) ---

export const getVouchers = async (req: Request, res: Response) => {
  try {
    const vouchers = await adminService.getVouchers();
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách voucher' });
  }
};

export const createVoucher = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = voucherSchema.parse({ body: req.body });
    const userId = (req as any).user.id;
    
    const voucher = await adminService.createVoucher(body, userId);

    res.status(201).json(voucher);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.message === 'Mã voucher đã tồn tại') return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi tạo voucher' });
  }
};

export const updateVoucher = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = voucherSchema.parse({ body: req.body });

    const voucher = await adminService.updateVoucher(id, body);

    res.json(voucher);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    if (error.message === 'Không tìm thấy voucher') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi cập nhật voucher' });
  }
};

export const deleteVoucher = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    
    const voucher = await adminService.deleteVoucher(id);

    res.json({ message: 'Xóa voucher thành công' });
  } catch (error: any) {
    if (error.message === 'Không tìm thấy voucher') return res.status(404).json({ message: error.message });
    res.status(500).json({ message: 'Lỗi server khi xóa voucher' });
  }
};

// --- QUẢN LÝ ĐÁNH GIÁ (FEEDBACK) ---

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await adminService.getFeedback();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đánh giá' });
  }
};

// --- BÁO CÁO & THỐNG KÊ (ANALYTICS) ---

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const summary = await adminService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy tổng quan dashboard' });
  }
};

export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query as {
      type?: string;
      startDate?: string;
      endDate?: string;
    };
    const stats = await adminService.getRevenueStats(type, startDate, endDate);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê doanh thu' });
  }
};

export const getStaffPerformance = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getStaffPerformance();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy hiệu suất nhân viên' });
  }
};

export const getTopPackages = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getTopPackages();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy top gói dịch vụ' });
  }
};

export const getTopVipCustomers = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getTopVipCustomers();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy top khách hàng VIP' });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getReviews();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đánh giá' });
  }
};

export const getAvailableStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dich_vu_id, dang_ky_goi_id, ngay, gio_bat_dau } = req.query as {
      dich_vu_id?: string;
      dang_ky_goi_id?: string;
      ngay?: string;
      gio_bat_dau?: string;
    };

    if (!ngay || !gio_bat_dau) {
      return res.status(400).json({ message: 'Thiếu thông tin ngày hoặc giờ bắt đầu' });
    }

    const availableStaff = await adminService.getAvailableStaff(
      dich_vu_id || null,
      dang_ky_goi_id || null,
      ngay,
      gio_bat_dau
    );

    res.json(availableStaff);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách kỹ thuật viên khả dụng:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy kỹ thuật viên khả dụng' });
  }
};
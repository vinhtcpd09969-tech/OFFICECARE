import { Router } from 'express';
import { 
  createPublicAppointment, 
  getCustomerAppointments, 
  cancelCustomerAppointment, 
  getBookedSlots, 
  getPublicServices, 
  getPublicAppointmentById, 
  getCustomerMedicalRecord, 
  getCustomerTreatmentSessions,
  confirmEmailAppointment
} from '../controllers/appointment.controller';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import adminService from '../services/admin.service';

const router = Router();

// API Đặt lịch cho khách vãng lai
router.post('/appointments/public', createPublicAppointment);
router.get('/appointments/public/track/:id', getPublicAppointmentById);
router.get('/appointments/public/confirm-email/:id', confirmEmailAppointment);

// API công khai để lấy danh mục, dịch vụ và gói trị liệu
router.get('/services', async (req, res) => {
  try {
    const services = await adminService.getServices();
    const publicServices = services.filter((s: any) => s.hien_thi_website !== false && s.trang_thai === 'hoat_dong');
    res.json(publicServices);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ' });
  }
});

router.get('/packages', async (req, res) => {
  try {
    const packages = await adminService.getPackages();
    const publicPackages = packages.filter((p: any) => p.hien_thi_website !== false && p.trang_thai === 'hoat_dong');
    res.json(publicPackages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói dịch vụ' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await adminService.getCategories();
    const publicCategories = categories.filter((c: any) => c.an_hien !== false);
    res.json(publicCategories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
});

// API public - lấy danh sách giờ đã đặt theo ngày (không cần xác thực)
router.get('/appointments/booked-slots', getBookedSlots);

// API public - lấy danh sách dịch vụ hoạt động hiển thị trên website
router.get('/services', getPublicServices);

// API có bảo mật cho Khách hàng
router.get('/appointments', verifyToken, getCustomerAppointments);
router.patch('/appointments/:id/cancel', verifyToken, cancelCustomerAppointment);
router.get('/medical-record', verifyToken, getCustomerMedicalRecord);
router.get('/treatment-sessions', verifyToken, getCustomerTreatmentSessions);

// API Thông báo cho khách hàng
router.get('/notifications', verifyToken, getNotifications);
router.patch('/notifications/read-all', verifyToken, markAllAsRead);
router.patch('/notifications/:id/read', verifyToken, markAsRead);

export default router;

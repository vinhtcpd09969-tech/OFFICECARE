import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as adminController from '../controllers/admin.controller';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập và có quyền Admin (vai_tro_id = 5)
router.use(verifyToken);
router.use(authorizeRoles(5));

// Danh mục & Dịch vụ
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.get('/services', adminController.getServices);
router.post('/services', adminController.createService);

// Gói điều trị
router.get('/packages', adminController.getPackages);
router.post('/packages', adminController.createPackage);

// Nhân sự (Staff)
router.get('/staff', adminController.getStaff);
router.post('/staff', adminController.createStaff);

// Khách hàng
router.get('/customers', adminController.getCustomers);

// Thiết bị
router.get('/equipment', adminController.getEquipment);
router.post('/equipment', adminController.createEquipment);

// Ca làm việc / Lịch làm việc
router.get('/schedules', adminController.getSchedules);
router.post('/schedules', adminController.createSchedule);

// Hồ sơ điều trị (Tra cứu Bệnh án)
router.get('/medical-records', adminController.getMedicalRecords);

// Nhật ký hệ thống (Audit Logs)
router.get('/audit-logs', adminController.getAuditLogs);

// Quản lý Lịch hẹn (Admin Master View)
router.get('/appointments', appointmentController.getAllAppointments);
router.post('/appointments', appointmentController.createAppointment);
router.patch('/appointments/:id/status', appointmentController.updateAppointmentStatus);

export default router;

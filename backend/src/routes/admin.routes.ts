import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import * as adminController from '../controllers/admin.controller';
import * as appointmentController from '../controllers/appointment.controller';
import * as treatmentRecordController from '../controllers/treatment-record.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Nhân sự
 *     description: Quản lý nhân viên, vai trò và quyền hạn
 *   - name: Admin - Danh mục & Dịch vụ
 *     description: Quản lý danh mục và dịch vụ điều trị
 *   - name: Admin - Phòng & Thiết bị
 *     description: Quản lý phòng khám và thiết bị y tế
 *   - name: Admin - Lịch hẹn
 *     description: Quản lý toàn bộ lịch hẹn (Admin master view)
 *   - name: Admin - Tài chính
 *     description: Quản lý hóa đơn, thanh toán và hoàn tiền
 *   - name: Admin - Báo cáo
 *     description: Thống kê, báo cáo doanh thu và hiệu suất nhân viên
 */

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(verifyToken);

// ─── NHÂN SỰ ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/staff/available:
 *   get:
 *     summary: Lấy danh sách nhân sự đang sẵn sàng làm việc (để phân công lịch hẹn)
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách nhân sự đang hoạt động
 */
router.get('/staff/available', authorizeRoles(2, 3, 4, 5, 6), adminController.getAvailableStaff);

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Lấy toàn bộ danh sách nhân sự
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách toàn bộ nhân sự trong hệ thống
 *   post:
 *     summary: Tạo tài khoản nhân sự mới (chỉ Admin)
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - ho_ten
 *               - vai_tro_id
 *             properties:
 *               email:
 *                 type: string
 *                 example: bacsi.moi@physioflow.vn
 *               ho_ten:
 *                 type: string
 *                 example: BS. Nguyễn Văn Tuấn
 *               so_dien_thoai:
 *                 type: string
 *                 example: "0923456789"
 *               vai_tro_id:
 *                 type: integer
 *                 description: "2=Lễ tân, 3=KTV, 4=Bác sĩ, 5=Admin, 6=Quản lý"
 *                 example: 4
 *               mat_khau:
 *                 type: string
 *                 example: "TempPass@123"
 *     responses:
 *       201:
 *         description: Tạo tài khoản nhân sự thành công
 */
router.get('/staff', authorizeRoles(2, 3, 4, 5, 6), adminController.getStaff);
router.post('/staff', authorizeRoles(5), adminController.createStaff);

/**
 * @swagger
 * /admin/staff/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hoạt động của nhân sự (kích hoạt / vô hiệu hóa)
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID nhân sự
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [hoat_dong, khoa]
 *                 example: khoa
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
router.patch('/staff/:id/status', authorizeRoles(5), adminController.updateStaffStatus);

// ─── DANH MỤC & DỊCH VỤ ──────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Lấy danh sách danh mục dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục (khám lâm sàng, điều trị, ...)
 *   post:
 *     summary: Tạo danh mục mới (Admin/Quản lý)
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_danh_muc:
 *                 type: string
 *                 example: Phục hồi chức năng
 *     responses:
 *       201:
 *         description: Danh mục được tạo thành công
 */
router.get('/categories', authorizeRoles(2, 3, 4, 5, 6), adminController.getCategories);
router.post('/categories', authorizeRoles(5, 6), adminController.createCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh mục đã được cập nhật
 *   delete:
 *     summary: Xóa danh mục
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh mục đã được xóa
 */
router.put('/categories/:id', authorizeRoles(5, 6), adminController.updateCategory);
router.delete('/categories/:id', authorizeRoles(5, 6), adminController.deleteCategory);

/**
 * @swagger
 * /admin/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ điều trị
 *   post:
 *     summary: Tạo dịch vụ mới
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten_dich_vu:
 *                 type: string
 *                 example: Sóng xung kích trị liệu (ESWT)
 *               gia:
 *                 type: number
 *                 example: 350000
 *               danh_muc_id:
 *                 type: integer
 *                 example: 2
 *               thoi_luong_phut:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       201:
 *         description: Dịch vụ được tạo thành công
 */
router.get('/services', authorizeRoles(2, 3, 4, 5, 6), adminController.getServices);
router.post('/services', authorizeRoles(5, 6), adminController.createService);

/**
 * @swagger
 * /admin/services/{id}:
 *   put:
 *     summary: Cập nhật thông tin dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa dịch vụ
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/services/:id', authorizeRoles(5, 6), adminController.updateService);
router.delete('/services/:id', authorizeRoles(5, 6), adminController.deleteService);

// ─── GÓI ĐIỀU TRỊ ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/packages:
 *   get:
 *     summary: Lấy danh sách gói điều trị
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gói điều trị (bao gồm số buổi, tổng giá, dịch vụ đi kèm)
 *   post:
 *     summary: Tạo gói điều trị mới
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Gói điều trị được tạo thành công
 */
router.get('/packages', authorizeRoles(2, 3, 4, 5, 6), adminController.getPackages);
router.post('/packages', authorizeRoles(5, 6), adminController.createPackage);

/**
 * @swagger
 * /admin/packages/{id}:
 *   put:
 *     summary: Cập nhật gói điều trị
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa gói điều trị
 *     tags: [Admin - Danh mục & Dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/packages/:id', authorizeRoles(5, 6), adminController.updatePackage);
router.delete('/packages/:id', authorizeRoles(5, 6), adminController.deletePackage);

// ─── PHÒNG KHÁM ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/rooms:
 *   get:
 *     summary: Lấy danh sách phòng khám và phòng trị liệu
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phòng (kham_benh, tri_lieu, phong_tap, ...)
 *   post:
 *     summary: Tạo phòng khám mới
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Phòng được tạo thành công
 */
router.get('/rooms', authorizeRoles(2, 3, 4, 5, 6), adminController.getRooms);
router.post('/rooms', authorizeRoles(5, 6), adminController.createRoom);
router.put('/rooms/:id', authorizeRoles(5, 6), adminController.updateRoom);
router.delete('/rooms/:id', authorizeRoles(5, 6), adminController.deleteRoom);

// ─── THIẾT BỊ ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/equipment:
 *   get:
 *     summary: Lấy danh sách thiết bị y tế
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thiết bị kèm trạng thái, loại thiết bị
 *   post:
 *     summary: Thêm thiết bị y tế mới
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Thiết bị được thêm thành công
 */
router.get('/equipment', authorizeRoles(2, 3, 4, 5, 6), adminController.getEquipment);
router.post('/equipment', authorizeRoles(5, 6), adminController.createEquipment);
router.put('/equipment/:id', authorizeRoles(5, 6), adminController.updateEquipment);
router.delete('/equipment/:id', authorizeRoles(5, 6), adminController.deleteEquipment);

/**
 * @swagger
 * /admin/equipment-types:
 *   get:
 *     summary: Lấy danh sách phân loại thiết bị
 *     tags: [Admin - Phòng & Thiết bị]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách loại thiết bị
 */
router.get('/equipment-types', authorizeRoles(2, 3, 4, 5, 6), adminController.getEquipmentTypes);
router.post('/equipment-types', authorizeRoles(5, 6), adminController.createEquipmentType);
router.put('/equipment-types/:id', authorizeRoles(5, 6), adminController.updateEquipmentType);
router.delete('/equipment-types/:id', authorizeRoles(5, 6), adminController.deleteEquipmentType);

// ─── LỊCH LÀM VIỆC ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/schedules:
 *   get:
 *     summary: Lấy lịch làm việc của tất cả nhân sự
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch làm việc theo tuần
 *   post:
 *     summary: Tạo ca làm việc mới cho nhân sự
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Ca làm việc được tạo thành công
 */
router.get('/schedules', authorizeRoles(2, 3, 4, 5, 6), adminController.getSchedules);
router.post('/schedules', authorizeRoles(5, 6), adminController.createSchedule);
router.put('/schedules/:id', authorizeRoles(5, 6), adminController.updateSchedule);
router.delete('/schedules/:id', authorizeRoles(5, 6), adminController.deleteSchedule);

// ─── KHÁCH HÀNG ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Lấy danh sách toàn bộ khách hàng
 *     tags: [Admin - Nhân sự]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khách hàng kèm thông tin cơ bản
 */
router.get('/customers', authorizeRoles(2, 4, 5, 6), adminController.getCustomers);

// ─── HỒ SƠ ĐIỀU TRỊ ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/medical-records:
 *   get:
 *     summary: Tra cứu hồ sơ bệnh án của khách hàng
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hồ sơ bệnh án
 */
router.get('/medical-records', authorizeRoles(2, 4, 5, 6), adminController.getMedicalRecords);

// ─── TÀI CHÍNH ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/invoices:
 *   get:
 *     summary: Lấy danh sách hóa đơn
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hóa đơn kèm trạng thái thanh toán
 */
router.get('/invoices', authorizeRoles(2, 5, 6), adminController.getInvoices);

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     summary: Lấy lịch sử thanh toán
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách giao dịch thanh toán
 */
router.get('/payments', authorizeRoles(2, 5, 6), adminController.getPayments);

/**
 * @swagger
 * /admin/payments/{id}/refund:
 *   post:
 *     summary: Xử lý hoàn tiền cho giao dịch
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giao dịch thanh toán
 *     responses:
 *       200:
 *         description: Hoàn tiền thành công
 */
router.post('/payments/:id/refund', authorizeRoles(5, 6), adminController.handleRefund);

// ─── MARKETING ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     summary: Lấy danh sách voucher khuyến mãi
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách voucher
 *   post:
 *     summary: Tạo voucher mới
 *     tags: [Admin - Tài chính]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Voucher được tạo thành công
 */
router.get('/vouchers', authorizeRoles(2, 5, 6), adminController.getVouchers);
router.post('/vouchers', authorizeRoles(5, 6), adminController.createVoucher);
router.put('/vouchers/:id', authorizeRoles(5, 6), adminController.updateVoucher);
router.delete('/vouchers/:id', authorizeRoles(5, 6), adminController.deleteVoucher);

/**
 * @swagger
 * /admin/feedback:
 *   get:
 *     summary: Lấy danh sách đánh giá của khách hàng
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phản hồi và đánh giá từ khách hàng
 */
router.get('/feedback', authorizeRoles(5, 6), adminController.getFeedback);

// ─── BÁO CÁO ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/analytics/summary:
 *   get:
 *     summary: Lấy tổng quan dashboard (lịch hẹn, doanh thu, khách mới)
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số liệu tổng quan dashboard
 */
router.get('/analytics/summary', authorizeRoles(2, 5, 6), adminController.getDashboardSummary);

/**
 * @swagger
 * /admin/analytics/revenue:
 *   get:
 *     summary: Thống kê doanh thu theo khoảng thời gian
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-06-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-06-30"
 *     responses:
 *       200:
 *         description: Báo cáo doanh thu chi tiết
 */
router.get('/analytics/revenue', authorizeRoles(5, 6), adminController.getRevenueStats);

/**
 * @swagger
 * /admin/analytics/performance:
 *   get:
 *     summary: Thống kê hiệu suất làm việc của nhân sự
 *     tags: [Admin - Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Báo cáo hiệu suất từng nhân viên
 */
router.get('/analytics/performance', authorizeRoles(5, 6), adminController.getStaffPerformance);

// ─── LỊCH HẸN (ADMIN MASTER VIEW) ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/appointments:
 *   get:
 *     summary: Lấy toàn bộ lịch hẹn trong hệ thống (Admin view)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc theo ngày (YYYY-MM-DD)
 *       - in: query
 *         name: trang_thai
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái lịch hẹn
 *     responses:
 *       200:
 *         description: Danh sách lịch hẹn toàn hệ thống
 *   post:
 *     summary: Tạo lịch hẹn mới (Staff tạo hộ)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Lịch hẹn được tạo thành công
 */
router.get('/appointments', authorizeRoles(2, 4, 5, 6), appointmentController.getAllAppointments);
router.post('/appointments', authorizeRoles(2, 5, 6), appointmentController.createAppointment);

/**
 * @swagger
 * /admin/appointments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái lịch hẹn (Admin/Lễ tân)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trạng thái đã được cập nhật
 */
router.patch('/appointments/:id/status', authorizeRoles(2, 4, 5, 6), appointmentController.updateAppointmentStatus);

/**
 * @swagger
 * /admin/appointments/{id}/medical-record:
 *   put:
 *     summary: Cập nhật hồ sơ bệnh án cho lịch hẹn (KTV/Bác sĩ)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hồ sơ bệnh án đã được cập nhật
 */
router.put('/appointments/:id/medical-record', authorizeRoles(4, 5, 6), appointmentController.updateMedicalRecord);

/**
 * @swagger
 * /admin/appointments/break-time:
 *   delete:
 *     summary: Xóa các lịch giữ chỗ break-time không còn cần thiết
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch break-time đã được dọn dẹp
 */
router.delete('/appointments/break-time', authorizeRoles(5, 6), appointmentController.cancelBreakTimeAppointments);

/**
 * @swagger
 * /admin/appointments/watchdog/status:
 *   get:
 *     summary: Kiểm tra trạng thái watchdog tự động hủy lịch hẹn quá hạn
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trạng thái watchdog (running / stopped, lần chạy cuối)
 */
router.get('/appointments/watchdog/status', authorizeRoles(5, 6), appointmentController.getWatchdogStatus);

/**
 * @swagger
 * /admin/appointments/watchdog/run:
 *   post:
 *     summary: Chạy thủ công watchdog để xử lý lịch hẹn quá hạn ngay lập tức
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watchdog đã được chạy, kết quả xử lý được trả về
 */
router.post('/appointments/watchdog/run', authorizeRoles(5, 6), appointmentController.runWatchdogManually);

/**
 * @swagger
 * /admin/appointments/{id}/keep-alive:
 *   post:
 *     summary: Gia hạn thời gian chờ xác nhận của lịch hẹn (không để watchdog tự hủy)
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lịch hẹn đã được gia hạn
 */
router.post('/appointments/:id/keep-alive', authorizeRoles(2, 5, 6), appointmentController.keepAliveAppointment);

// ─── HỒ SƠ ĐIỀU TRỊ (NEW WORKFLOW) ────────────────────────────────────────────

/**
 * @swagger
 * /admin/treatment-records:
 *   get:
 *     summary: Lấy danh sách hồ sơ điều trị
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách hồ sơ điều trị toàn hệ thống
 *   post:
 *     summary: Tạo hồ sơ điều trị mới cho bệnh nhân
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Hồ sơ điều trị được tạo thành công
 */
router.get('/treatment-records', authorizeRoles(2, 3, 4, 5, 6), treatmentRecordController.getTreatmentRecords);
router.post('/treatment-records', authorizeRoles(4, 5, 6), treatmentRecordController.createTreatmentRecord);

/**
 * @swagger
 * /admin/treatment-records/{id}/assign:
 *   patch:
 *     summary: Phân công KTV/Bác sĩ cho hồ sơ điều trị
 *     tags: [Admin - Lịch hẹn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phân công thành công
 */
router.patch('/treatment-records/:id/assign', authorizeRoles(2, 5, 6), treatmentRecordController.assignTreatmentRecord);

export default router;

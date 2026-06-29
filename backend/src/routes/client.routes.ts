import { Router } from 'express';
import {
  createPublicAppointment,
  getCustomerAppointments,
  cancelCustomerAppointment,
  getBookedSlots,
  getActiveDoctorDates,
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

/**
 * @swagger
 * tags:
 *   name: Khách hàng - Client
 *   description: API dành cho khách hàng - đặt lịch, xem lịch sử, bệnh án và thông báo
 */

/**
 * @swagger
 * /client/appointments/public:
 *   post:
 *     summary: Đặt lịch khám lâm sàng (khách vãng lai, không cần đăng nhập)
 *     tags: [Khách hàng - Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ho_ten
 *               - so_dien_thoai
 *               - ngay_gio_bat_dau
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: Nguyễn Thị B
 *               so_dien_thoai:
 *                 type: string
 *                 example: "0909123456"
 *               email:
 *                 type: string
 *                 example: khach@gmail.com
 *               ngay_gio_bat_dau:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-01T08:00:00+07:00"
 *               ghi_chu:
 *                 type: string
 *                 example: Đau vai gáy vùng cổ
 *               dich_vu_id:
 *                 type: integer
 *                 example: null
 *               voucher_code:
 *                 type: string
 *                 example: null
 *     responses:
 *       201:
 *         description: Đặt lịch thành công, email xác nhận được gửi cho khách
 *       400:
 *         description: Khung giờ đã bận hoặc dữ liệu không hợp lệ
 */
router.post('/appointments/public', createPublicAppointment);

/**
 * @swagger
 * /client/appointments/public/track/{id}:
 *   get:
 *     summary: Tra cứu lịch hẹn theo ID (không cần đăng nhập)
 *     tags: [Khách hàng - Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch hẹn
 *     responses:
 *       200:
 *         description: Thông tin chi tiết lịch hẹn
 *       404:
 *         description: Không tìm thấy lịch hẹn
 */
router.get('/appointments/public/track/:id', getPublicAppointmentById);

/**
 * @swagger
 * /client/appointments/public/confirm-email/{id}:
 *   get:
 *     summary: Xác nhận lịch hẹn qua link email
 *     tags: [Khách hàng - Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch hẹn cần xác nhận
 *     responses:
 *       200:
 *         description: Xác nhận thành công
 */
router.get('/appointments/public/confirm-email/:id', confirmEmailAppointment);

/**
 * @swagger
 * /client/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ đang hoạt động hiển thị trên website
 *     tags: [Khách hàng - Client]
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ công khai
 */
router.get('/services', async (req, res) => {
  try {
    const services = await adminService.getServices();
    const publicServices = services.filter((s: any) => s.hien_thi_website !== false && s.trang_thai === 'hoat_dong');
    res.json(publicServices);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ' });
  }
});

/**
 * @swagger
 * /client/packages:
 *   get:
 *     summary: Lấy danh sách gói điều trị đang hiển thị trên website
 *     tags: [Khách hàng - Client]
 *     responses:
 *       200:
 *         description: Danh sách gói điều trị công khai
 */
router.get('/packages', async (req, res) => {
  try {
    const packages = await adminService.getPackages();
    const publicPackages = packages.filter((p: any) => p.hien_thi_website !== false && p.trang_thai === 'hoat_dong');
    res.json(publicPackages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói dịch vụ' });
  }
});

/**
 * @swagger
 * /client/categories:
 *   get:
 *     summary: Lấy danh mục dịch vụ (công khai)
 *     tags: [Khách hàng - Client]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await adminService.getCategories();
    const publicCategories = categories.filter((c: any) => c.an_hien !== false);
    res.json(publicCategories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
});

/**
 * @swagger
 * /client/appointments/booked-slots:
 *   get:
 *     summary: Lấy danh sách khung giờ đã đặt theo ngày (không cần đăng nhập)
 *     tags: [Khách hàng - Client]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-07-01"
 *         description: Ngày cần kiểm tra (YYYY-MM-DD)
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Số điện thoại khách để kiểm tra giới hạn tuần
 *     responses:
 *       200:
 *         description: Danh sách giờ đã bận trong ngày
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookedSlots:
 *                   type: array
 *                   items:
 *                     type: string
 *                 hasReachedWeeklyLimit:
 *                   type: boolean
 *                   description: Khách đã đặt đủ 2 lịch khám lâm sàng trong tuần này chưa
 */
router.get('/appointments/booked-slots', getBookedSlots);

/**
 * @swagger
 * /client/appointments/active-doctor-dates:
 *   get:
 *     summary: Lấy danh sách ngày có bác sĩ làm việc (công khai)
 *     tags: [Khách hàng - Client]
 *     responses:
 *       200:
 *         description: Danh sách ngày có bác sĩ hoạt động
 */
router.get('/appointments/active-doctor-dates', getActiveDoctorDates);

/**
 * @swagger
 * /client/appointments:
 *   get:
 *     summary: Lấy lịch sử lịch hẹn của khách hàng đang đăng nhập
 *     tags: [Khách hàng - Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch hẹn của khách hàng
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/appointments', verifyToken, getCustomerAppointments);

/**
 * @swagger
 * /client/appointments/{id}/cancel:
 *   patch:
 *     summary: Hủy lịch hẹn của khách hàng
 *     tags: [Khách hàng - Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch hẹn cần hủy
 *     responses:
 *       200:
 *         description: Hủy lịch thành công
 *       403:
 *         description: Không có quyền hủy lịch này
 */
router.patch('/appointments/:id/cancel', verifyToken, cancelCustomerAppointment);

/**
 * @swagger
 * /client/medical-record:
 *   get:
 *     summary: Lấy hồ sơ bệnh án của khách hàng đang đăng nhập
 *     tags: [Khách hàng - Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hồ sơ bệnh án chi tiết (chẩn đoán, phác đồ điều trị, đánh giá)
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/medical-record', verifyToken, getCustomerMedicalRecord);

/**
 * @swagger
 * /client/treatment-sessions:
 *   get:
 *     summary: Lấy lịch sử các buổi trị liệu của khách hàng đang đăng nhập
 *     tags: [Khách hàng - Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách các buổi trị liệu đã thực hiện
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/treatment-sessions', verifyToken, getCustomerTreatmentSessions);

/**
 * @swagger
 * /client/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của khách hàng
 *     tags: [Khách hàng - Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 */
router.get('/notifications', verifyToken, getNotifications);

/**
 * @swagger
 * /client/notifications/read-all:
 *   patch:
 *     summary: Đánh dấu tất cả thông báo là đã đọc
 *     tags: [Khách hàng - Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tất cả thông báo đã được đánh dấu đã đọc
 */
router.patch('/notifications/read-all', verifyToken, markAllAsRead);

/**
 * @swagger
 * /client/notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu một thông báo là đã đọc
 *     tags: [Khách hàng - Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thông báo
 *     responses:
 *       200:
 *         description: Thông báo đã được đánh dấu đã đọc
 */
router.patch('/notifications/:id/read', verifyToken, markAsRead);

export default router;

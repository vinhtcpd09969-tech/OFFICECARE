import { Router } from 'express';
import { getAllAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointment.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Yêu cầu đăng nhập cho tất cả các route lịch hẹn
router.use(verifyToken);

router.get('/', getAllAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;

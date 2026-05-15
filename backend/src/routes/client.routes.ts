import { Router } from 'express';
import { createPublicAppointment } from '../controllers/appointment.controller';

const router = Router();

// API Đặt lịch cho khách vãng lai
router.post('/appointments/public', createPublicAppointment);

export default router;

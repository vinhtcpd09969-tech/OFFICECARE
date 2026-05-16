import { Router } from 'express';
import { getTodayAppointments, updateAppointmentStatus, getReceptionistStats, handleWalkInBooking, createBillingFromAppointment, processPayment } from '../controllers/receptionist.controller';

const router = Router();

router.get('/today-appointments', getTodayAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.get('/stats', getReceptionistStats);
router.post('/walk-in', handleWalkInBooking);
router.post('/billing', createBillingFromAppointment);
router.post('/payment', processPayment);

export default router;

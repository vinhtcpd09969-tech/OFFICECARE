import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import adminRoutes from './admin.routes';
import receptionistRoutes from './receptionist.routes';
import doctorRoutes from './doctor.routes';
import technicianRoutes from './technician.routes';
import aiRoutes from './ai.routes';
import { payosWebhookHandler } from '../controllers/payos_webhook.controller';

const router = Router();

router.use('/auth', authRoutes);
router.use('/client', clientRoutes);
router.use('/admin', adminRoutes);
router.use('/receptionist', receptionistRoutes);
router.use('/doctor', doctorRoutes);
router.use('/technician', technicianRoutes);
router.use('/ai', aiRoutes);

// Public payment webhook for PayOS
router.post('/payment/payos-webhook', payosWebhookHandler);

export default router;

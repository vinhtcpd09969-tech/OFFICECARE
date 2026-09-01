import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import adminRoutes from './admin.routes';
import receptionistRoutes from './receptionist.routes';
import doctorRoutes from './doctor.routes';
import technicianRoutes from './technician.routes';
import aiRoutes from './ai.routes';
import { payosWebhookHandler } from '../controllers/payos_webhook.controller';

import { getTransporter } from '../utils/mailer';

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

// Live SMTP diagnostic endpoint
router.get('/test-smtp', async (req, res) => {
  const targetEmail = (req.query.to as string) || 'kinquan0506@gmail.com';
  const emailUser = process.env.EMAIL_USER || '';
  const emailPass = process.env.EMAIL_PASS || '';
  const emailHost = process.env.EMAIL_HOST || '';
  const emailPort = process.env.EMAIL_PORT || '';

  const maskedPass = emailPass ? `${emailPass.slice(0, 3)}****${emailPass.slice(-3)}` : 'NOT_SET';

  const diagnostics: any = {
    env: {
      EMAIL_HOST: emailHost || 'NOT_SET',
      EMAIL_PORT: emailPort || 'NOT_SET',
      EMAIL_USER: emailUser || 'NOT_SET',
      EMAIL_PASS: maskedPass,
      isConfigured: Boolean(emailUser && emailPass && emailUser !== 'your_email@gmail.com')
    },
    targetEmail
  };

  try {
    const transporter = await getTransporter();
    diagnostics.transporterType = transporter ? 'INITIALIZED' : 'NULL';
    
    // Verify SMTP connection
    const verifyStart = Date.now();
    await transporter.verify();
    diagnostics.smtpVerify = {
      success: true,
      latencyMs: Date.now() - verifyStart
    };

    // Attempt sending test email
    const sendStart = Date.now();
    const info = await transporter.sendMail({
      from: `"OfficeCare Diagnostics" <${emailUser}>`,
      to: targetEmail,
      subject: `[OfficeCare Live Test] Kiểm tra gửi mail từ Render lúc ${new Date().toLocaleTimeString('vi-VN')}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #0D9488; border-radius: 8px;">
          <h2 style="color: #0D9488;">✅ Kết nối Gmail SMTP trên Render HOẠT ĐỘNG TỐT!</h2>
          <p>Email này được gửi trực tiếp từ máy chủ Render của bạn tới <strong>${targetEmail}</strong>.</p>
          <p>Thời gian gửi: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
          <hr/>
          <small>Hệ thống Quản lý Y tế Phục hồi chức năng OfficeCare</small>
        </div>
      `
    });

    diagnostics.sendMail = {
      success: true,
      messageId: info.messageId,
      response: info.response,
      latencyMs: Date.now() - sendStart
    };

    res.json({
      status: 'success',
      message: 'SMTP connection and email dispatch succeeded!',
      diagnostics
    });
  } catch (err: any) {
    diagnostics.error = {
      message: err.message,
      code: err.code,
      command: err.command,
      stack: err.stack
    };
    res.status(500).json({
      status: 'error',
      message: 'SMTP failed on Render',
      diagnostics
    });
  }
});

export default router;

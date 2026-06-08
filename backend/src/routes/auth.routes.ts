import { Router } from 'express';
import { login, register, verifyEmail, refreshToken, getMe, resendOTP } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/refresh-token', refreshToken);
router.get('/me', verifyToken, getMe);

export default router;

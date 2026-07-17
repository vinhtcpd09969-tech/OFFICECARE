import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import { resendConfirmationEmail } from '../controllers/appointment.controller';
import {
  getTodayAppointments,
  getDashboardData,
  updateAppointmentStatus,
  getReceptionistStats,
  handleWalkInBooking,
  createBillingFromAppointment,
  processPayment,
  calculateBilling,
  getActiveVouchers,
  applyVoucher,
  createBillingDirect,
  getPackagesForReceptionist,
  searchCustomers,
  getCustomerTreatmentPlans,
  getAppointmentBillingInfo,
  checkCustomerLimit,
  checkPackagePayment,
  getBillingInfoByPackage,
  createPayOSPaymentLink,
  cancelPayOSPaymentLink,
  getInvoiceStatus
} from '../controllers/receptionist.controller';

const router = Router();

// Tất cả các route của Lễ tân đều yêu cầu đăng nhập và có vai trò Lễ tân (2) hoặc Admin (5)
router.use(verifyToken);
router.use(authorizeRoles(2, 5));

router.get('/today-appointments', getTodayAppointments);
router.get('/dashboard', getDashboardData);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.post('/appointments/:id/resend-email', resendConfirmationEmail);
router.get('/stats', getReceptionistStats);
router.post('/walk-in', handleWalkInBooking);
router.post('/billing', createBillingFromAppointment);
router.post('/payment', processPayment);
router.post('/billing/calculate', calculateBilling);
router.get('/vouchers/active', getActiveVouchers);
router.post('/vouchers/apply', applyVoucher);
router.post('/billing/create', createBillingDirect);
router.get('/packages', getPackagesForReceptionist);
router.get('/customers/search', searchCustomers);
router.get('/customers/:id/treatment-plans', getCustomerTreatmentPlans);
router.get('/appointments/:id/billing-info', getAppointmentBillingInfo);
router.get('/customers/:id/check-limit', checkCustomerLimit);
router.get('/customers/:id/check-package-payment', checkPackagePayment);
router.get('/customers/:id/billing-info-by-package', getBillingInfoByPackage);

// PayOS integration routes
router.post('/payment/create-payos-link', createPayOSPaymentLink);
router.post('/payment/cancel-payos-link', cancelPayOSPaymentLink);
router.get('/payment/status/:id', getInvoiceStatus);

export default router;

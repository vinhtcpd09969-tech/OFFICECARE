import { Router } from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import {
  updateAppointmentStatus,
  createBillingFromAppointment,
  processPayment,
  calculateBilling,
  getActiveVouchers,
  applyVoucher,
  createBillingDirect,
  getPackagesForReceptionist,
  searchCustomers,
  getCustomerTreatmentPlans,
  getCustomerRoster,
  getCustomerHistory,
  getAppointmentBillingInfo,
  checkCustomerLimit,
  checkPackagePayment,
  getBillingInfoByPackage,
  createPayOSPaymentLink,
  cancelPayOSPaymentLink,
  getInvoiceStatus
} from '../controllers/receptionist.controller';

const router = Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
router.use(verifyToken);

router.patch('/appointments/:id/status', authorizeRoles(2, 5), updateAppointmentStatus);
router.post('/billing', authorizeRoles(2, 5), createBillingFromAppointment);
router.post('/payment', authorizeRoles(2, 5), processPayment);
router.post('/billing/calculate', authorizeRoles(2, 5), calculateBilling);
router.get('/vouchers/active', authorizeRoles(2, 5), getActiveVouchers);
router.post('/vouchers/apply', authorizeRoles(2, 5), applyVoucher);
router.post('/billing/create', authorizeRoles(2, 5), createBillingDirect);
router.get('/packages', authorizeRoles(2, 5), getPackagesForReceptionist);
router.get('/customers/search', authorizeRoles(2, 5), searchCustomers);
router.get('/customers/roster', authorizeRoles(2, 5), getCustomerRoster);
router.get('/customers/:id/treatment-plans', authorizeRoles(2, 5), getCustomerTreatmentPlans);
router.get('/customers/:id/history', authorizeRoles(2, 5), getCustomerHistory);
router.get('/appointments/:id/billing-info', authorizeRoles(2, 5), getAppointmentBillingInfo);
router.get('/customers/:id/check-limit', authorizeRoles(2, 5), checkCustomerLimit);
router.get('/customers/:id/check-package-payment', authorizeRoles(2, 5), checkPackagePayment);
router.get('/customers/:id/billing-info-by-package', authorizeRoles(2, 5), getBillingInfoByPackage);

// PayOS integration routes
router.post('/payment/create-payos-link', authorizeRoles(2, 5), createPayOSPaymentLink);
router.post('/payment/cancel-payos-link', authorizeRoles(2, 5), cancelPayOSPaymentLink);
router.get('/payment/status/:id', authorizeRoles(2, 5), getInvoiceStatus);

export default router;

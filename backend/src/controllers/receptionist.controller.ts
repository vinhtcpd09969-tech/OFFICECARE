import { Request, Response } from 'express';
import receptionistService from '../services/receptionist.service';
import receptionistRepository from '../repositories/receptionist.repository';
import { getMinPaymentRequired } from '../domain/billing';
import { DEFAULT_FOLLOW_UP_STALE_DAYS } from '../domain/customerFollowUp';
import { HinhThucThanhToanGoi } from '../domain/types';
import { VAI_TRO_ID_KTV } from '../domain/capacity';
import { payos } from '../config/payos';
import { pool } from '../config/db';

// PATCH /api/receptionist/appointments/:id/status
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { trang_thai, ghi_chu_noi_bo } = req.body;
    const effectiveReason = ghi_chu_noi_bo && ghi_chu_noi_bo.trim() ? ghi_chu_noi_bo.trim() : undefined;
    if (['da_huy', 'khong_den'].includes(trang_thai)) {
      if (!effectiveReason) {
        return res.status(400).json({ message: 'Lý do hủy/vắng mặt là bắt buộc.' });
      }
    }
    const appointment = await receptionistService.updateAppointmentStatus(id, trang_thai, effectiveReason);
    res.json(appointment);
  } catch (error: any) {
    console.error('Lỗi cập nhật trạng thái:', error);
    if (error.message === 'Không tìm thấy lịch hẹn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'ROOM_UNAVAILABLE') {
      return res.status(400).json({ message: 'Không có phòng trống cho dịch vụ này tại thời điểm hiện tại.' });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/stats
// POST /api/receptionist/billing
export const createBillingFromAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { lich_dat_id } = req.body;
    const result = await receptionistService.createBillingFromAppointment(lich_dat_id);
    res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
  } catch (error: any) {
    console.error('Lỗi khi tạo hóa đơn:', error);
    if (error.message === 'Lịch hẹn không hợp lệ hoặc chưa hoàn thành') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/payment
export const processPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.processPayment(req.body);
    res.json({ message: 'Thanh toán thành công', ...result });
  } catch (error: any) {
    console.error('Lỗi thanh toán:', error);
    if (error.message === 'Không tìm thấy hóa đơn') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Số tiền nhận không đủ')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/billing/calculate
export const calculateBilling = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.calculateBilling(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi tính hóa đơn:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/receptionist/vouchers/active
export const getActiveVouchers = async (req: Request, res: Response): Promise<any> => {
  try {
    const khach_hang_id = req.query.khach_hang_id ? String(req.query.khach_hang_id) : undefined;
    const vouchers = await receptionistService.getActiveVouchers(khach_hang_id);
    res.json({ vouchers });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách voucher khả dụng:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/receptionist/vouchers/apply
export const applyVoucher = async (req: Request, res: Response): Promise<any> => {
  try {
    const { ma_voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi } = req.body;
    if (!ma_voucher || !String(ma_voucher).trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
    }
    const voucher = await receptionistService.applyVoucher(ma_voucher, loai_thanh_toan, khach_hang_id, kenh, loai_goi);
    res.json({ voucher });
  } catch (error: any) {
    console.error('Lỗi áp dụng voucher:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// POST /api/receptionist/billing/create
export const createBillingDirect = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.createBillingDirect(req.body);
    res.json({ message: 'Tạo hóa đơn thành công', hoa_don: result });
  } catch (error: any) {
    console.error('Lỗi tạo hóa đơn direct:', error);
    res.status(400).json({ message: error.message || 'Lỗi server' });
  }
};

// GET /api/receptionist/packages
export const getPackagesForReceptionist = async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await receptionistService.getActivePackages();
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách gói trị liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/search
export const searchCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    const result = await receptionistService.searchCustomers(q);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi tìm kiếm khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/treatment-plans
export const getCustomerTreatmentPlans = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const result = await receptionistService.getCustomerTreatmentPlans(id);
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách phác đồ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/roster
export const getCustomerRoster = async (req: Request, res: Response): Promise<any> => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
    const search = String(req.query.search ?? '').trim();
    const canLienHe = String(req.query.canLienHe ?? '') === 'true';
    const staleDays = Math.max(1, parseInt(String(req.query.staleDays ?? String(DEFAULT_FOLLOW_UP_STALE_DAYS)), 10) || DEFAULT_FOLLOW_UP_STALE_DAYS);
    const result = await receptionistService.getCustomerRoster({ page, pageSize, search, canLienHe, staleDays });
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/history
export const getCustomerHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const staleDays = Math.max(1, parseInt(String(req.query.staleDays ?? String(DEFAULT_FOLLOW_UP_STALE_DAYS)), 10) || DEFAULT_FOLLOW_UP_STALE_DAYS);
    const result = await receptionistService.getCustomerHistory(id, staleDays);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Không tìm thấy khách hàng') return res.status(404).json({ message: error.message });
    console.error('Lỗi lấy lịch sử khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/appointments/:id/billing-info
export const getAppointmentBillingInfo = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const result = await receptionistService.getAppointmentBillingInfo(id);
    if (!result) {
      return res.status(444).json({ message: 'Không tìm thấy lịch hẹn hoặc hóa đơn liên quan' });
    }
    res.json(result);
  } catch (error: any) {
    console.error('Lỗi lấy thông tin thanh toán lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/billing-info-by-package
export const getBillingInfoByPackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: customerId } = req.params;
    const { package_id } = req.query;
    if (!package_id || typeof package_id !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số package_id' });
    }
    const result = await receptionistService.getBillingInfoByPackage(customerId as string, package_id as string);
    if (!result) {
      return res.status(444).json({ message: 'Không tìm thấy thông tin' });
    }
    res.json(result);
  } catch (error) {
    console.error('Lỗi lấy thông tin thanh toán gói:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/check-limit
export const checkCustomerLimit = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số date (YYYY-MM-DD)' });
    }

    // Giới hạn giờ tính TOÀN THỜI GIAN (không theo ngày) — `date` giữ lại trên route/FE cho
    // tương thích ngược, không còn ảnh hưởng tới kết quả kiểm tra.
    const appointmentRepository = require('../repositories/appointment.repository').default;
    const limitReached = await appointmentRepository.checkCustomerActiveLimit(id, null);

    return res.json({ limitReached });
  } catch (error: any) {
    console.error('Lỗi khi kiểm tra giới hạn đặt lịch của khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/customers/:id/check-package-payment
export const checkPackagePayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: customerId } = req.params;
    const { package_id: packageId } = req.query;
    if (!packageId || typeof packageId !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số package_id' });
    }

    const { pool } = require('../config/db');
    const gdvRes = await pool.query('SELECT loai_goi FROM goi_dich_vu WHERE id = $1', [packageId]);
    if (gdvRes.rows.length > 0 && gdvRes.rows[0].loai_goi === 'LE') {
      return res.json({ paid: true });
    }

    const { rows } = await pool.query(`
      SELECT hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.hinh_thuc_thanh_toan_goi, hd.trang_thai, pd.tong_so_buoi,
             hd.tong_tien_goc, hd.so_tien_giam_voucher,
             (
               SELECT COUNT(*)::int
               FROM cuoc_hen
               WHERE phac_do_dieu_tri_id = pd.id AND loai = 'DIEU_TRI'
             ) as so_buoi_da_dat
      FROM phac_do_dieu_tri pd
      JOIN hoa_don hd ON hd.phac_do_dieu_tri_id = pd.id
      WHERE pd.khach_hang_id = $1 AND pd.goi_dich_vu_id = $2
      ORDER BY hd.ngay_tao DESC LIMIT 1
    `, [customerId, packageId]);

    if (rows.length === 0) {
      return res.json({ paid: false, message: 'Chưa thanh toán/đăng ký gói trị liệu này.' });
    }

    const invoiceObj = rows[0];
    const tongTien = Number(invoiceObj.tong_tien_phai_tra || 0);
    const daThanhToan = Number(invoiceObj.so_tien_da_tra || 0);
    const hinhThuc: HinhThucThanhToanGoi = invoiceObj.hinh_thuc_thanh_toan_goi || 'tra_thang';
    const tongSoBuoi = Number(invoiceObj.tong_so_buoi || 10);
    const grossBeforeExamDeduction = Number(invoiceObj.tong_tien_goc || 0)
      - Number(invoiceObj.so_tien_giam_voucher || 0);

    // Buổi sắp được đặt = số buổi DIEU_TRI đã tạo + 1 — khớp đúng cách appointment.repository.ts
    // resolve so_thu_tu_buoi khi tạo lịch, để pre-check này không báo "đã đủ tiền" rồi backend lại chặn ở submit.
    const nextSessionNum = Number(invoiceObj.so_buoi_da_dat || 0) + 1;

    const minRequired = getMinPaymentRequired(hinhThuc, tongTien, tongSoBuoi, nextSessionNum, grossBeforeExamDeduction);
    if (daThanhToan < minRequired) {
      const label = hinhThuc === 'tung_buoi' ? 'Trả từng buổi' : 'Trả thẳng 100%';
      const conThieu = minRequired - daThanhToan;
      return res.json({
        paid: false,
        nextSessionNum,
        soTienConThieu: conThieu,
        message: `Gói trị liệu (${label}) yêu cầu thanh toán tối thiểu trước khi đặt buổi số ${nextSessionNum}.`
      });
    }

    return res.json({ paid: true, nextSessionNum });
  } catch (error: any) {
    console.error('Lỗi khi kiểm tra thanh toán gói của khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/receptionist/payment/create-payos-link
export const createPayOSPaymentLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { hoa_don_id, so_thu_tu_buoi } = req.body;
    // Dùng chung đúng công thức với processPayment (tiền mặt) — KHÔNG tự tính
    // tong_tien_thanh_toan - da_thanh_toan ở đây nữa, vì với gói trả từng buổi con số đó là cả
    // số dư còn lại của gói, không phải đúng phần của buổi/đợt đang thu.
    const { hd, requiredAmount: amount } = await receptionistService.getRequiredPaymentAmount(hoa_don_id, so_thu_tu_buoi);
    if (amount <= 0) {
      return res.status(400).json({ message: 'Hóa đơn đã được thanh toán đầy đủ' });
    }

    const khRes = await pool.query('SELECT ho_ten FROM khach_hang WHERE id = $1', [hd.khach_hang_id]);
    const hoTen = khRes.rows[0]?.ho_ten || '';
    const removeAccents = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 ]/g, '');
    };
    const cleanName = removeAccents(hoTen).replace(/\s+/g, '').toUpperCase().substring(0, 10);

    const cleanUuid = hoa_don_id.replace(/-/g, '');
    const orderCode = Date.now() % 2000000000;
    const description = `TTHD ${cleanUuid.substring(0, 8).toUpperCase()} ${cleanName}`.substring(0, 25).trim();

    const cancelUrl = `http://localhost:3000/admin/quick-billing`;
    const returnUrl = `http://localhost:3000/admin/quick-billing`;

    const paymentData = {
      orderCode,
      amount,
      description,
      cancelUrl,
      returnUrl,
      expiredAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    };

    const paymentLinkRes = await payos.paymentRequests.create(paymentData);

    // A15 — khóa hủy phía khách ngay khi link vừa tạo (giao dịch coi như đang treo từ đây, không
    // đợi khách thật sự quét mã) — an toàn hơn: nếu không ai quét, sweep 15 phút tự đảo lại.
    await receptionistService.markPayOSLinkCreated(hoa_don_id);

    return res.json({
      ...paymentLinkRes,
      orderCode,
      amount
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo link thanh toán PayOS:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo link thanh toán', error: error.message });
  }
};

// POST /api/receptionist/payment/cancel-payos-link
export const cancelPayOSPaymentLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { hoa_don_id, orderCode, order_code } = req.body;
    let targetOrderCode = orderCode || order_code;

    if (!targetOrderCode) {
      const cleanUuid = hoa_don_id.replace(/-/g, '');
      targetOrderCode = parseInt(cleanUuid.substring(0, 7), 16);
    }

    try {
      await payos.paymentRequests.cancel(Number(targetOrderCode));
    } catch (payosError: any) {
      console.warn('Lỗi từ PayOS khi hủy link (có thể đã hủy trước đó):', payosError.message);
    }

    // A15 — Lễ tân chủ động hủy link thì đảo NGAY, không đợi sweep 15 phút.
    if (hoa_don_id) {
      await receptionistService.revertPayOSPending(hoa_don_id);
    }

    res.json({ message: 'Đã hủy link thanh toán thành công' });
  } catch (error: any) {
    console.error('Lỗi khi hủy link thanh toán PayOS:', error);
    res.status(500).json({ message: 'Lỗi server khi hủy link thanh toán' });
  }
};

// GET /api/receptionist/payment/status/:id
export const getInvoiceStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { orderCode } = req.query;

    let hd = await receptionistRepository.getInvoiceById(id as string);
    if (!hd) {
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }

    // Backup check via PayOS API if database is unpaid and orderCode is provided
    if (hd.trang_thai === 'chua_thanh_toan' && orderCode) {
      try {
        const paymentLinkInfo = await payos.paymentRequests.get(Number(orderCode));
        if (paymentLinkInfo.status === 'PAID') {
          console.log(`Polling phát hiện hóa đơn ${hd.id} đã thanh toán trên PayOS. Cập nhật DB...`);
          await receptionistService.processPayment({
            hoa_don_id: hd.id,
            phuong_thuc: 'chuyen_khoan',
            so_tien_nhan: paymentLinkInfo.amountPaid.toString()
          });
          // Re-query database to get updated status
          hd = await receptionistRepository.getInvoiceById(id as string);
        }
      } catch (payosErr: any) {
        console.warn('Lỗi khi check status từ PayOS API:', payosErr.message);
      }
    }

    res.json({
      trang_thai: hd.trang_thai,
      so_tien_da_tra: hd.da_thanh_toan,
      da_thanh_toan: hd.da_thanh_toan,
      tong_tien_phai_tra: hd.tong_tien_thanh_toan,
      tong_tien_thanh_toan: hd.tong_tien_thanh_toan,
      id: hd.id
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy trạng thái hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/receptionist/staff-workload
export const getStaffWorkload = async (req: Request, res: Response): Promise<any> => {
  try {
    const { date } = req.query;
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];

    const queryStr = `
      SELECT 
        ns.id as nhan_su_id,
        ns.ho_ten,
        ns.vai_tro_id,
        vt.ten_vai_tro,
        CASE WHEN ns.vai_tro_id = ${VAI_TRO_ID_KTV} THEN 2 ELSE 1 END as so_khach_song_song,
        to_char(lt.gio_bat_dau, 'HH24:MI') as gio_bat_dau,
        to_char(lt.gio_ket_thuc, 'HH24:MI') as gio_ket_thuc,
        p.ten_phong,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai = 'dang_kham')::integer as so_ca_dang_lam,
        COUNT(DISTINCT ch.id) FILTER (WHERE ch.trang_thai IN ('da_checkin', 'cho_tai_luong_gia'))::integer as so_ca_cho,
        MAX(ch.thoi_gian_bat_dau + (COALESCE(ch.thoi_luong_phut, g.thoi_luong_phut, 30) || ' minutes')::interval) FILTER (WHERE ch.trang_thai = 'dang_kham') as thoi_gian_xong_du_kien_muon_nhat
      FROM lich_truc_nhan_su lt
      JOIN nguoi_dung ns ON lt.nhan_su_id = ns.id
      JOIN vai_tro vt ON ns.vai_tro_id = vt.id
      LEFT JOIN phong_lam_viec p ON lt.phong_id = p.id
      LEFT JOIN cuoc_hen ch ON ch.nhan_su_id = ns.id 
          AND ch.trang_thai IN ('dang_kham', 'da_checkin', 'cho_tai_luong_gia') 
          AND (DATE(ch.ngay_gio_bat_dau AT TIME ZONE 'Asia/Ho_Chi_Minh') = $1::date)
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      WHERE lt.ngay_truc = $1::date
      GROUP BY ns.id, ns.ho_ten, ns.vai_tro_id, vt.ten_vai_tro, lt.gio_bat_dau, lt.gio_ket_thuc, p.ten_phong
      ORDER BY ns.vai_tro_id DESC, ns.ho_ten ASC;
    `;
    const { rows } = await pool.query(queryStr, [targetDate]);
    res.json(rows);
  } catch (error: any) {
    console.error('Lỗi khi lấy tải làm việc của nhân sự:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tải làm việc nhân sự' });
  }
};

// POST /api/receptionist/appointments/:id/unassign
export const unassignAppointmentStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const queryStr = `
      UPDATE cuoc_hen
      SET nhan_su_id = NULL
      WHERE id = $1::uuid AND trang_thai IN ('da_xac_nhan', 'da_checkin')
      RETURNING id, nhan_su_id, trang_thai;
    `;
    const { rows } = await pool.query(queryStr, [id]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Không thể rút chỉ định nhân sự ca này (ca đã bắt đầu hoặc không tồn tại).' });
    }
    res.json({ message: 'Đã rút khỏi chỉ định đích danh và đưa ca hẹn về hàng chờ chung.', appointment: rows[0] });
  } catch (error: any) {
    console.error('Lỗi khi rút chỉ định nhân sự:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};


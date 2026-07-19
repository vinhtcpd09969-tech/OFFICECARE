import { Router } from 'express';
import axios from 'axios';
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
  getCustomerInvoices,
  confirmEmailAppointment,
  confirmOTPAppointment,
  resendConfirmationEmail,
  createTempHold,
  releaseTempHold
} from '../controllers/appointment.controller';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';
import { getPublicArticles, getPublicArticleBySlug } from '../controllers/article.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import adminService from '../services/admin.service';
import { pool } from '../config/db';

const router = Router();

router.post('/appointments/public', createPublicAppointment);
router.get('/appointments/public/track/:id', getPublicAppointmentById);
router.get('/appointments/public/confirm-email/:id', confirmEmailAppointment);
router.post('/appointments/public/confirm-otp', confirmOTPAppointment);
router.post('/appointments/public/:id/resend-otp', resendConfirmationEmail);
router.post('/appointments/hold', createTempHold);
router.delete('/appointments/hold/:session_id', releaseTempHold);

router.get('/services', async (req, res) => {
  try {
    const packages = await adminService.getPackages();
    // Trả về gói lẻ (LE) và gói khám (KHAM) làm danh sách dịch vụ
    const publicServices = packages
      .filter((pkg: any) => (pkg.loai_goi === 'LE' || pkg.loai_goi === 'KHAM') && pkg.trang_thai === 'hoat_dong')
      .map((pkg: any) => ({
        id: pkg.id,
        ten_goi: pkg.ten_goi,
        ten_dich_vu: pkg.ten_goi, // backward compatibility
        don_gia: Number(pkg.don_gia),
        thoi_luong_phut: pkg.thoi_luong_phut,
        loai_goi: pkg.loai_goi,
        loai_dich_vu: pkg.loai_goi === 'KHAM' ? 'KHAM' : 'DIEU_TRI', // backward compatibility
        trang_thai: pkg.trang_thai,
        dang_hoat_dong: pkg.trang_thai === 'hoat_dong',
        hien_thi_website: pkg.trang_thai === 'hoat_dong',
        quy_trinh: pkg.quy_trinh,
        muc_tieu: pkg.muc_tieu,
        anh_goi: pkg.anh_goi,
        anh_gallery: pkg.anh_gallery || [],
        danh_muc_goi_id: pkg.danh_muc_id,
        danh_muc_id: pkg.danh_muc_id, // backward compatibility
        luot_dung: Number(pkg.luot_dung || 0),
      }));
    res.json(publicServices);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ' });
  }
});

router.get('/packages', async (req, res) => {
  try {
    const packages = await adminService.getPackages();
    // Trả về gói liệu trình (LIEU_TRINH) làm danh sách gói
    const publicPackages = packages.filter((p: any) => p.loai_goi === 'LIEU_TRINH' && p.trang_thai === 'hoat_dong');
    res.json(publicPackages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói dịch vụ' });
  }
});

router.get('/top-services', async (req, res) => {
  try {
    const queryStr = `
      SELECT gdv.id, gdv.ten_goi, gdv.loai_goi, gdv.tong_so_buoi, gdv.thoi_luong_phut, gdv.don_gia, gdv.anh_goi,
             COUNT(ch.id) AS luot_dung
      FROM goi_dich_vu gdv
      LEFT JOIN cuoc_hen ch ON gdv.id = ch.goi_dich_vu_id
      WHERE gdv.trang_thai = 'hoat_dong'
      GROUP BY gdv.id
      ORDER BY luot_dung DESC, gdv.ten_goi ASC
      LIMIT 3
    `;
    const { rows } = await pool.query(queryStr);
    const formatted = rows.map((p: any) => ({
      id: p.id,
      ten_goi: p.ten_goi,
      loai_goi: p.loai_goi,
      tong_so_buoi: p.tong_so_buoi,
      thoi_luong_phut: p.thoi_luong_phut,
      don_gia: Number(p.don_gia),
      anh_goi: p.anh_goi,
      luot_dung: Number(p.luot_dung)
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Lỗi khi lấy top dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy top dịch vụ' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, ten_danh_muc, mo_ta, loai_goi_ap_dung FROM danh_muc_goi ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
});

router.get('/specialists', async (req, res) => {
  try {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN danh_gia_nhan_su dg ON nd.id = dg.nhan_su_id
      WHERE nd.vai_tro_id IN (3, 4) AND nd.trang_thai = 'hoat_dong'
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh
      ORDER BY nd.vai_tro_id DESC, nd.ho_ten ASC
    `;
    const { rows } = await pool.query(queryStr);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách chuyên gia' });
  }
});

router.get('/specialists/:id', async (req, res) => {
  try {
    const queryStr = `
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro as vai_tro,
             hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh,
             COALESCE(AVG(dg.so_sao)::numeric(3,1), 5.0) as trung_binh_sao,
             COUNT(dg.id)::int as tong_danh_gia
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      LEFT JOIN ho_so_chuyen_gia hs ON nd.id = hs.nguoi_dung_id
      LEFT JOIN danh_gia_nhan_su dg ON nd.id = dg.nhan_su_id
      WHERE nd.id = $1 AND nd.vai_tro_id IN (3, 4)
      GROUP BY nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.anh_dai_dien, vt.ten_vai_tro, hs.so_nam_kinh_nghiem, hs.bang_cap_chung_chi, hs.mo_ta, hs.the_manh
    `;
    const { rows } = await pool.query(queryStr, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chuyên gia' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin chi tiết chuyên gia' });
  }
});

router.get('/specialists/:id/reviews', async (req, res) => {
  try {
    const queryStr = `
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, kh.ho_ten as name, dg.ngay_cap_nhat as date, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia_nhan_su dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      WHERE dg.nhan_su_id = $1
      ORDER BY dg.ngay_cap_nhat DESC
    `;
    const { rows } = await pool.query(queryStr, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá của chuyên gia' });
  }
});

router.get('/services/:id/reviews', async (req, res) => {
  try {
    const queryStr = `
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, kh.ho_ten as name, dg.ngay_cap_nhat as date, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia_goi_dich_vu dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      WHERE dg.goi_dich_vu_id = $1
      ORDER BY dg.ngay_cap_nhat DESC
    `;
    const { rows } = await pool.query(queryStr, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá của gói dịch vụ' });
  }
});

router.get('/testimonials', async (req, res) => {
  try {
    const queryStr = `
      SELECT dg.id, dg.so_sao, dg.nhan_xet, kh.ho_ten, kh.gioi_tinh, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia_goi_dich_vu dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      ORDER BY dg.ngay_cap_nhat DESC
    `;
    const { rows } = await pool.query(queryStr);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
  }
});

router.get('/articles', getPublicArticles);
router.get('/articles/:slug', getPublicArticleBySlug);

router.get('/appointments/booked-slots', getBookedSlots);
router.get('/appointments/active-doctor-dates', getActiveDoctorDates);
router.get('/appointments', verifyToken, getCustomerAppointments);
router.patch('/appointments/:id/cancel', verifyToken, cancelCustomerAppointment);

router.get('/appointments/pending-rating', verifyToken, async (req, res) => {
  try {
    const khach_hang_id = (req as any).user.id;
    const queryStr = `
      SELECT ch.id, ch.ngay_gio_bat_dau, g.ten_goi as ten_dich_vu, nd.ho_ten as ten_bac_si, ch.goi_dich_vu_id, ch.nhan_su_id, g.loai_goi
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN nguoi_dung nd ON ch.nhan_su_id = nd.id
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      LEFT JOIN danh_gia_goi_dich_vu dg_g ON (dg_g.khach_hang_id = ch.khach_hang_id AND dg_g.goi_dich_vu_id = ch.goi_dich_vu_id)
      LEFT JOIN danh_gia_nhan_su dg_n ON (dg_n.khach_hang_id = ch.khach_hang_id AND dg_n.nhan_su_id = ch.nhan_su_id)
      WHERE ch.khach_hang_id = $1 
        AND ch.trang_thai = 'hoan_thanh'
        AND (
          -- KTV is not rated yet
          dg_n.id IS NULL 
          OR 
          -- OR package/service is not rated yet (and if it's LIEU_TRINH, it must be finished/cancelled)
          (
            dg_g.id IS NULL 
            AND (g.loai_goi IN ('LE', 'KHAM') OR pddt.trang_thai IN ('hoan_thanh', 'huy_ngang'))
          )
        )
      ORDER BY ch.ngay_gio_bat_dau DESC
    `;
    const { rows } = await pool.query(queryStr, [khach_hang_id]);
    res.json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn chưa đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/appointments/:id/rate', verifyToken, async (req, res) => {
  try {
    let { rating_dich_vu, comment_dich_vu, rating_ktv, comment_ktv, so_sao, nhan_xet } = req.body;
    if (so_sao) {
      if (rating_dich_vu === undefined) rating_dich_vu = so_sao;
      if (comment_dich_vu === undefined) comment_dich_vu = nhan_xet;
      if (rating_ktv === undefined) rating_ktv = so_sao;
      if (comment_ktv === undefined) comment_ktv = nhan_xet;
    }
    const cuoc_hen_id = req.params.id;
    const khach_hang_id = (req as any).user.id;

    // Fetch appointment and check ownership/status
    const { rows: apptRows } = await pool.query(`
      SELECT ch.id, ch.trang_thai, ch.khach_hang_id, ch.goi_dich_vu_id, ch.nhan_su_id, ch.phac_do_dieu_tri_id,
             g.loai_goi, pddt.trang_thai as phac_do_status
      FROM cuoc_hen ch
      LEFT JOIN goi_dich_vu g ON ch.goi_dich_vu_id = g.id
      LEFT JOIN phac_do_dieu_tri pddt ON ch.phac_do_dieu_tri_id = pddt.id
      WHERE ch.id = $1
    `, [cuoc_hen_id]);

    if (apptRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    const appt = apptRows[0];
    if (appt.khach_hang_id !== khach_hang_id) {
      return res.status(403).json({ message: 'Không có quyền đánh giá lịch hẹn này' });
    }

    if (appt.trang_thai !== 'hoan_thanh') {
      return res.status(400).json({ message: 'Chỉ có thể đánh giá các lịch hẹn đã hoàn thành khám' });
    }

    // 1. Insert/Update KTV review
    if (rating_ktv && appt.nhan_su_id) {
      await pool.query(`
        INSERT INTO danh_gia_nhan_su (khach_hang_id, nhan_su_id, cuoc_hen_id, so_sao, nhan_xet, ngay_cap_nhat)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (khach_hang_id, nhan_su_id)
        DO UPDATE SET so_sao = EXCLUDED.so_sao, nhan_xet = EXCLUDED.nhan_xet, cuoc_hen_id = EXCLUDED.cuoc_hen_id, ngay_cap_nhat = NOW()
      `, [khach_hang_id, appt.nhan_su_id, cuoc_hen_id, Number(rating_ktv), comment_ktv]);
    }

    // 2. Insert/Update Service package review
    if (rating_dich_vu && appt.goi_dich_vu_id) {
      // If it's a package session, verify that it's the final session (phac_do status is hoan_thanh or huy_ngang)
      if (appt.loai_goi === 'LIEU_TRINH') {
        const isValidPackageEnd = appt.phac_do_status === 'hoan_thanh' || appt.phac_do_status === 'huy_ngang';
        if (!isValidPackageEnd) {
          return res.status(400).json({ message: 'Gói liệu trình chưa hoàn thành hoặc chưa bị hủy để đánh giá dịch vụ' });
        }
      }
      
      await pool.query(`
        INSERT INTO danh_gia_goi_dich_vu (khach_hang_id, goi_dich_vu_id, cuoc_hen_id, so_sao, nhan_xet, ngay_cap_nhat)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (khach_hang_id, goi_dich_vu_id)
        DO UPDATE SET so_sao = EXCLUDED.so_sao, nhan_xet = EXCLUDED.nhan_xet, cuoc_hen_id = EXCLUDED.cuoc_hen_id, ngay_cap_nhat = NOW()
      `, [khach_hang_id, appt.goi_dich_vu_id, cuoc_hen_id, Number(rating_dich_vu), comment_dich_vu]);
    }

    // Trigger low rating notifications if either is low (<= 2)
    const minStars = Math.min(
      rating_dich_vu ? Number(rating_dich_vu) : 5,
      rating_ktv ? Number(rating_ktv) : 5
    );
    if (minStars <= 2) {
      try {
        const { default: notificationService } = require('../services/notification.service');
        const lowComment = [comment_dich_vu, comment_ktv].filter(Boolean).join(' | ');
        notificationService.triggerLowRatingToAdmins(cuoc_hen_id, minStars, lowComment).catch((err: any) => {
          console.error('Lỗi khi gửi thông báo đánh giá tệ:', err);
        });
      } catch (err) {
        console.error('Lỗi nạp notificationService:', err);
      }
    }

    res.status(200).json({ message: 'Lưu đánh giá thành công!' });
  } catch (error) {
    console.error('Lỗi khi lưu đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi lưu đánh giá' });
  }
});

router.get('/reviews/my-reviews', verifyToken, async (req, res) => {
  try {
    const khach_hang_id = (req as any).user.id;
    
    // Service reviews
    const { rows: serviceReviews } = await pool.query(`
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, dg.ngay_cap_nhat as date, g.ten_goi as service_name, dg.goi_dich_vu_id, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia_goi_dich_vu dg
      JOIN goi_dich_vu g ON dg.goi_dich_vu_id = g.id
      WHERE dg.khach_hang_id = $1
      ORDER BY dg.ngay_cap_nhat DESC
    `, [khach_hang_id]);

    // Staff reviews
    const { rows: staffReviews } = await pool.query(`
      SELECT dg.id, dg.so_sao as rating, dg.nhan_xet as comment, dg.ngay_cap_nhat as date, nd.ho_ten as staff_name, dg.nhan_su_id, dg.phan_hoi_nhan_xet as reply
      FROM danh_gia_nhan_su dg
      JOIN nguoi_dung nd ON dg.nhan_su_id = nd.id
      WHERE dg.khach_hang_id = $1
      ORDER BY dg.ngay_cap_nhat DESC
    `, [khach_hang_id]);

    res.json({ serviceReviews, staffReviews });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá của khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.put('/reviews/service/:id', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.id;
    const khach_hang_id = (req as any).user.id;

    await pool.query(`
      UPDATE danh_gia_goi_dich_vu 
      SET so_sao = $1, nhan_xet = $2, ngay_cap_nhat = NOW() 
      WHERE id = $3 AND khach_hang_id = $4
    `, [Number(rating), comment, reviewId, khach_hang_id]);

    res.json({ message: 'Cập nhật đánh giá dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật đánh giá' });
  }
});

router.put('/reviews/staff/:id', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const reviewId = req.params.id;
    const khach_hang_id = (req as any).user.id;

    await pool.query(`
      UPDATE danh_gia_nhan_su 
      SET so_sao = $1, nhan_xet = $2, ngay_cap_nhat = NOW() 
      WHERE id = $3 AND khach_hang_id = $4
    `, [Number(rating), comment, reviewId, khach_hang_id]);

    res.json({ message: 'Cập nhật đánh giá nhân sự thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật đánh giá' });
  }
});

router.delete('/reviews/service/:id', verifyToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const khach_hang_id = (req as any).user.id;

    await pool.query(`
      DELETE FROM danh_gia_goi_dich_vu 
      WHERE id = $1 AND khach_hang_id = $2
    `, [reviewId, khach_hang_id]);

    res.json({ message: 'Xóa đánh giá dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa đánh giá' });
  }
});

router.delete('/reviews/staff/:id', verifyToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const khach_hang_id = (req as any).user.id;

    await pool.query(`
      DELETE FROM danh_gia_nhan_su 
      WHERE id = $1 AND khach_hang_id = $2
    `, [reviewId, khach_hang_id]);

    res.json({ message: 'Xóa đánh giá nhân sự thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa đánh giá' });
  }
});
router.get('/medical-record', verifyToken, getCustomerMedicalRecord);
router.get('/treatment-sessions', verifyToken, getCustomerTreatmentSessions);
router.get('/invoices', verifyToken, getCustomerInvoices);
router.get('/notifications', verifyToken, getNotifications);
router.patch('/notifications/read-all', verifyToken, markAllAsRead);
router.patch('/notifications/:id/read', verifyToken, markAsRead);
router.post('/agree-terms', verifyToken, async (req, res) => {
  try {
    const khach_hang_id = (req as any).user.id;
    await pool.query(
      `UPDATE khach_hang SET ngay_dong_y_dieu_khoan = NOW() WHERE id = $1`,
      [khach_hang_id]
    );
    res.json({ success: true, message: 'Đồng ý điều khoản thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đồng ý điều khoản' });
  }
});

// TTS Proxy Route for high-quality Vietnamese audio
router.get('/tts', async (req, res) => {
  const text = req.query.text as string;
  if (!text) {
    return res.status(400).send('Missing text parameter');
  }

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error: any) {
    console.error('TTS proxy error:', error.message);
    res.status(500).send('Error generating TTS');
  }
});

export default router;

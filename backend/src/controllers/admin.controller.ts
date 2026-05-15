import { Request, Response } from 'express';
import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import { categorySchema, serviceSchema, packageSchema, staffSchema } from '../schemas/admin.schema';
import { logAudit } from '../utils/audit.util';

// --- QUẢN LÝ DỊCH VỤ & DANH MỤC ---

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM danh_muc_dich_vu ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = categorySchema.parse({ body: req.body });
    const { rows } = await pool.query(
      'INSERT INTO danh_muc_dich_vu (ten_danh_muc, mo_ta, trang_thai) VALUES ($1, $2, $3) RETURNING *',
      [body.ten_danh_muc, body.mo_ta, body.trang_thai]
    );
    await logAudit(req, 'CREATE_CATEGORY', 'CATEGORY', rows[0].id.toString(), body);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT dv.*, dm.ten_danh_muc 
      FROM dich_vu dv
      JOIN danh_muc_dich_vu dm ON dv.danh_muc_id = dm.id
      ORDER BY dv.danh_muc_id, dv.ten_dich_vu
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy dịch vụ' });
  }
};

export const createService = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = serviceSchema.parse({ body: req.body });
    const { rows } = await pool.query(
      `INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, mo_ta, thoi_gian_uoc_tinh, thiet_bi_yeu_cau, trang_thai) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [body.danh_muc_id, body.ten_dich_vu, body.mo_ta, body.thoi_gian_uoc_tinh, body.thiet_bi_yeu_cau, body.trang_thai]
    );
    await logAudit(req, 'CREATE_SERVICE', 'SERVICE', rows[0].id.toString(), body);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ GÓI ĐIỀU TRỊ ---

export const getPackages = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goi_dieu_tri ORDER BY gia_tien ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy gói điều trị' });
  }
};

export const createPackage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = packageSchema.parse({ body: req.body });
    const { rows } = await pool.query(
      `INSERT INTO goi_dieu_tri (ten_goi, mo_ta, tong_so_buoi, gia_tien, trang_thai) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [body.ten_goi, body.mo_ta, body.tong_so_buoi, body.gia_tien, body.trang_thai]
    );
    await logAudit(req, 'CREATE_PACKAGE', 'PACKAGE', rows[0].id.toString(), body);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ NHÂN SỰ ---

export const getStaff = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.trang_thai, vt.ten_hien_thi as vai_tro
      FROM nguoi_dung nd
      JOIN vai_tro vt ON nd.vai_tro_id = vt.id
      WHERE nd.vai_tro_id IN (2, 3, 4, 5) AND nd.deleted_at IS NULL
      ORDER BY nd.vai_tro_id, nd.ho_ten
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhân sự' });
  }
};

export const createStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = staffSchema.parse({ body: req.body });
    
    // Check email exists
    const { rows: existing } = await pool.query('SELECT id FROM nguoi_dung WHERE email = $1', [body.email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(body.mat_khau, salt);

    const { rows } = await pool.query(
      `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, so_dien_thoai, trang_thai, da_xac_thuc_email) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id, ho_ten, email`,
      [body.ho_ten, body.email, hash, body.vai_tro_id, body.so_dien_thoai, body.trang_thai]
    );

    // Xóa mật khẩu khỏi payload log để bảo mật
    const { mat_khau: _, ...logPayload } = body;
    await logAudit(req, 'CREATE_STAFF', 'USER', rows[0].id, logPayload);

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ KHÁCH HÀNG ---

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT kh.id as khach_hang_id, kh.ma_khach_hang, kh.ngay_sinh, kh.gioi_tinh, kh.dia_chi, kh.tien_su_benh,
             nd.id as nguoi_dung_id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.trang_thai, nd.created_at
      FROM khach_hang kh
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      WHERE nd.deleted_at IS NULL
      ORDER BY nd.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
};

// --- QUẢN LÝ THIẾT BỊ Y TẾ ---

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT tb.*, p.ten_phong 
      FROM thiet_bi_y_te tb
      LEFT JOIN phong p ON tb.phong_id_hien_tai = p.id
      ORDER BY tb.thoi_gian_tao DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách thiết bị' });
  }
};

export const createEquipment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = require('../schemas/admin.schema').equipmentSchema.parse({ body: req.body });
    
    const ma_thiet_bi = 'TB-' + Math.floor(1000 + Math.random() * 9000);

    const { rows } = await pool.query(
      `INSERT INTO thiet_bi_y_te (ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, ngay_bao_tri_tiep_theo, trang_thai, phong_id_hien_tai, ghi_chu) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [ma_thiet_bi, body.ten_thiet_bi, body.loai_thiet_bi || null, body.ngay_mua || null, body.ngay_bao_tri_tiep_theo || null, body.trang_thai, body.phong_id_hien_tai || null, body.ghi_chu || null]
    );

    await logAudit(req, 'CREATE_EQUIPMENT', 'EQUIPMENT', rows[0].id.toString(), body);

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ LỊCH LÀM VIỆC (CA LÀM VIỆC) ---

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT llv.*, nd.ho_ten as ten_ky_thuat_vien
      FROM lich_lam_viec_ktv llv
      JOIN ky_thuat_vien ktv ON llv.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      ORDER BY nd.ho_ten, llv.thu_trong_tuan
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy lịch làm việc' });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = require('../schemas/admin.schema').scheduleSchema.parse({ body: req.body });
    
    // Check if KTV already has a schedule for this day and time overlap
    // (Simplified for now, just inserting)
    
    const { rows } = await pool.query(
      `INSERT INTO lich_lam_viec_ktv (ky_thuat_vien_id, thu_trong_tuan, gio_bat_dau, gio_ket_thuc, trang_thai) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [body.ky_thuat_vien_id, body.thu_trong_tuan, body.gio_bat_dau, body.gio_ket_thuc, body.trang_thai]
    );

    await logAudit(req, 'CREATE_SCHEDULE', 'SCHEDULE', rows[0].id.toString(), body);

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- QUẢN LÝ HỒ SƠ ĐIỀU TRỊ (READ-ONLY) ---

export const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT dg.id, dg.ma_danh_gia, dg.ngay_danh_gia, dg.chan_doan, dg.trang_thai,
             nd_kh.ho_ten as ten_khach_hang, kh.ma_khach_hang,
             nd_ktv.ho_ten as ten_ky_thuat_vien
      FROM danh_gia dg
      JOIN khach_hang kh ON dg.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN ky_thuat_vien ktv ON dg.ky_thuat_vien_id = ktv.id
      JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      ORDER BY dg.ngay_danh_gia DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ điều trị' });
  }
};

// --- AUDIT LOGS ---

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, nd.email as user_email 
      FROM system_audit_log a
      LEFT JOIN nguoi_dung nd ON a.user_id = nd.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy audit log' });
  }
};

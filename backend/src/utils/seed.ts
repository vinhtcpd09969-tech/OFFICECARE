import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('Seeding data...');

    // 1. Kỹ thuật viên (Nguoi dung + Ky thuat vien)
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const { rows: ndKtv } = await pool.query(
      `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, da_xac_thuc_email) 
       VALUES ('KTV Minh Tú', 'minhtu@physioflow.com', $1, 3, TRUE) 
       ON CONFLICT (email) DO UPDATE SET ho_ten = EXCLUDED.ho_ten RETURNING id`,
      [hash]
    );
    const ktvUserId = ndKtv[0].id;

    const { rows: ktv } = await pool.query(
      `INSERT INTO ky_thuat_vien (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh) 
       VALUES ($1, 'KTV001', 'Vật lý trị liệu cơ xương khớp') 
       ON CONFLICT (ma_nhan_vien) DO UPDATE SET chuyen_mon_chinh = EXCLUDED.chuyen_mon_chinh RETURNING id`,
      [ktvUserId]
    );
    const ktvId = ktv[0].id;

    // 2. Khách hàng (Nguoi dung + Khach hang)
    const { rows: ndKh } = await pool.query(
      `INSERT INTO nguoi_dung (ho_ten, email, mat_khau_hash, vai_tro_id, da_xac_thuc_email) 
       VALUES ('Nguyễn Văn A', 'nguyenvana@gmail.com', $1, 1, TRUE) 
       ON CONFLICT (email) DO UPDATE SET ho_ten = EXCLUDED.ho_ten RETURNING id`,
      [hash]
    );
    const khUserId = ndKh[0].id;

    const { rows: kh } = await pool.query(
      `INSERT INTO khach_hang (nguoi_dung_id, gioi_tinh, nghe_nghiep) 
       VALUES ($1, 'nam', 'Nhân viên văn phòng') 
       ON CONFLICT (nguoi_dung_id) DO UPDATE SET nghe_nghiep = EXCLUDED.nghe_nghiep RETURNING id`,
      [khUserId]
    );
    const khId = kh[0].id;

    // 3. Dịch vụ
    const { rows: danhMuc } = await pool.query(
      `INSERT INTO danh_muc_dich_vu (ten_danh_muc, thu_tu_hien_thi) 
       VALUES ('Trị liệu vùng cổ vai gáy', 1) 
       ON CONFLICT (ten_danh_muc) DO UPDATE SET thu_tu_hien_thi = EXCLUDED.thu_tu_hien_thi RETURNING id`
    );
    const danhMucId = danhMuc[0].id;

    const { rows: dichVu } = await pool.query(
      `SELECT id FROM dich_vu WHERE ten_dich_vu = 'Trị liệu Cổ vai gáy chuyên sâu'`
    );
    let dvId;
    if (dichVu.length === 0) {
      const { rows: newDv } = await pool.query(
        `INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, thoi_luong_phut, don_gia) 
         VALUES ($1, 'Trị liệu Cổ vai gáy chuyên sâu', 60, 500000) RETURNING id`,
        [danhMucId]
      );
      dvId = newDv[0].id;
    } else {
      dvId = dichVu[0].id;
    }

    // 4. Phòng
    const { rows: phong } = await pool.query(
      `INSERT INTO phong (ten_phong, ma_phong, trang_thai) 
       VALUES ('Phòng VIP 1', 'P-VIP-1', 'san_sang') 
       ON CONFLICT (ma_phong) DO UPDATE SET ten_phong = EXCLUDED.ten_phong RETURNING id`
    );
    const phongId = phong[0].id;

    // 5. Lịch hẹn (Xóa lịch cũ trước để khỏi bị trùng constraint)
    await pool.query(`DELETE FROM lich_dat`);
    
    // Tạo 3 lịch: 1 cái hnay 14:00 (chờ xác nhận), 1 cái hnay 16:00 (đã xác nhận), 1 cái mai 09:00 (đã checkin)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const hnay14 = new Date(today); hnay14.setHours(14,0,0,0);
    const hnay15 = new Date(today); hnay15.setHours(15,0,0,0);

    const hnay16 = new Date(today); hnay16.setHours(16,0,0,0);
    const hnay17 = new Date(today); hnay17.setHours(17,0,0,0);

    const mai09 = new Date(today); mai09.setDate(mai09.getDate() + 1); mai09.setHours(9,0,0,0);
    const mai10 = new Date(mai09); mai10.setHours(10,0,0,0);

    await pool.query(
      `INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai, nguoi_tao) VALUES 
       ('LD-1001', $1, $2, $3, $4, $5, $6, 'cho_xac_nhan', 'khach_hang'),
       ('LD-1002', $1, $2, $3, $4, $7, $8, 'da_xac_nhan', 'le_tan'),
       ('LD-1003', $1, $2, $3, $4, $9, $10, 'da_checkin', 'admin')`,
       [khId, dvId, ktvId, phongId, hnay14, hnay15, hnay16, hnay17, mai09, mai10]
    );

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();

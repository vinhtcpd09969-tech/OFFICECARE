import { pool } from '../config/db';

class AppointmentRepository {
  async getAllAppointments() {
    const query = `
      SELECT 
        ld.id, ld.ma_lich_dat, ld.ngay_gio_bat_dau, ld.ngay_gio_ket_thuc, ld.trang_thai, ld.loai_lich,
        nd_kh.ho_ten AS ten_khach_hang, kh.nguoi_dung_id as khach_hang_id,
        dv.ten_dich_vu,
        nd_ktv.ho_ten AS ten_ky_thuat_vien,
        p.ten_phong
      FROM lich_dat ld
      JOIN khach_hang kh ON ld.khach_hang_id = kh.id
      JOIN nguoi_dung nd_kh ON kh.nguoi_dung_id = nd_kh.id
      JOIN dich_vu dv ON ld.dich_vu_id = dv.id
      LEFT JOIN ky_thuat_vien ktv ON ld.ky_thuat_vien_id = ktv.id
      LEFT JOIN nguoi_dung nd_ktv ON ktv.nguoi_dung_id = nd_ktv.id
      LEFT JOIN phong p ON ld.phong_id = p.id
      ORDER BY ld.ngay_gio_bat_dau ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async createAppointment(ma_lich_dat: string, data: any) {
    const { khach_hang_id, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich } = data;
    const query = `
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich, nguoi_tao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'le_tan')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, khach_hang_id, dich_vu_id, ky_thuat_vien_id || null, phong_id || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, ghi_chu_dat_lich
    ]);
    return rows[0];
  }

  async createPublicAppointment(ma_lich_dat: string, data: any) {
    const { ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, trieu_chung, ly_do_kham, anh_dinh_kem_url } = data;
    const query = `
      INSERT INTO lich_dat (ma_lich_dat, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, ngay_gio_bat_dau, ngay_gio_ket_thuc, trieu_chung, ly_do_kham, anh_dinh_kem_url, nguoi_tao, loai_lich)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'guest', 'kham_moi')
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      ma_lich_dat, ho_ten_khach, so_dien_thoai, gioi_tinh_khach || null, ngay_gio_bat_dau, ngay_gio_ket_thuc, trieu_chung || null, ly_do_kham || null, anh_dinh_kem_url || null
    ]);
    return rows[0];
  }

  async updateAppointmentStatus(id: string, trang_thai: string) {
    const query = `
      UPDATE lich_dat 
      SET trang_thai = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const { rows } = await pool.query(query, [trang_thai, id]);
    return rows[0];
  }
}

export default new AppointmentRepository();

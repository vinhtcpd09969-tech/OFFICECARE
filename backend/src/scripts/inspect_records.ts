import { pool } from '../config/db';

async function main() {
  try {
    console.log('--- KIỂM TRA TOÀN BỘ CÁC BẢNG TRONG HỆ THỐNG ---');
    const tables = [
      'vai_tro', 'nguoi_dung', 'khach_hang', 'chuyen_gia_y_te', 
      'phong', 'thiet_bi_y_te', 'lich_lam_viec', 'lich_dat', 
      'hoa_don', 'thanh_toan', 'buoi_tri_lieu', 'ho_so_dieu_tri'
    ];

    for (const table of tables) {
      const { rows } = await pool.query(`SELECT count(*) FROM ${table}`);
      console.log(`Bảng ${table.padEnd(20)}: ${rows[0].count} dòng`);
    }

    console.log('\n--- TÀI KHOẢN NGƯỜI DÙNG HIỆN TẠI ---');
    const { rows: users } = await pool.query(
      `SELECT n.id, n.ho_ten, n.email, v.ten_hien_thi as vai_tro 
       FROM nguoi_dung n 
       JOIN vai_tro v ON n.vai_tro_id = v.id 
       ORDER BY v.id`
    );
    users.forEach(u => console.log(`  - [${u.vai_tro}] ${u.ho_ten} (${u.email})`));

  } catch (err) {
    console.error('Lỗi khi kiểm tra các bảng:', err);
  } finally {
    await pool.end();
  }
}

main();

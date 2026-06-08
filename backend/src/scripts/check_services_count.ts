import { pool } from '../config/db';

async function main() {
  try {
    console.log('--- KIỂM TRA DỮ LIỆU DỊCH VỤ & GÓI ---');
    
    const { rows: dmCount } = await pool.query('SELECT count(*) FROM danh_muc_dich_vu');
    console.log(`Số lượng danh mục dịch vụ: ${dmCount[0].count}`);

    const { rows: dvCount } = await pool.query('SELECT count(*) FROM dich_vu');
    console.log(`Số lượng dịch vụ: ${dvCount[0].count}`);

    const { rows: goiCount } = await pool.query('SELECT count(*) FROM goi_dich_vu');
    console.log(`Số lượng gói dịch vụ: ${goiCount[0].count}`);

    const { rows: chiTietCount } = await pool.query('SELECT count(*) FROM goi_dich_vu_chi_tiet');
    console.log(`Số lượng chi tiết gói dịch vụ: ${chiTietCount[0].count}`);

    console.log('\n--- DANH SÁCH DANH MỤC ---');
    const { rows: categories } = await pool.query('SELECT id, ten_danh_muc, loai_danh_muc FROM danh_muc_dich_vu ORDER BY loai_danh_muc, id');
    categories.forEach(c => console.log(`  - [ID: ${c.id}] ${c.ten_danh_muc} (${c.loai_danh_muc})`));

    console.log('\n--- MỘT SỐ DỊCH VỤ TIÊU BIỂU ---');
    const { rows: services } = await pool.query('SELECT id, ten_dich_vu, don_gia, loai_dich_vu FROM dich_vu LIMIT 5');
    services.forEach(s => console.log(`  - [ID: ${s.id}] ${s.ten_dich_vu} - Đơn giá: ${s.don_gia} VND (${s.loai_dich_vu})`));

    console.log('\n--- MỘT SỐ GÓI DỊCH VỤ ---');
    const { rows: packages } = await pool.query('SELECT id, ten_goi, gia_goi FROM goi_dich_vu LIMIT 5');
    packages.forEach(p => console.log(`  - [ID: ${p.id}] ${p.ten_goi} - Giá gói: ${p.gia_goi} VND`));

  } catch (err) {
    console.error('Lỗi kiểm tra:', err);
  } finally {
    await pool.end();
  }
}

main();

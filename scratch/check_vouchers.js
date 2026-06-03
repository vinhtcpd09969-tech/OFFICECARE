const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const vouchers = await pool.query('SELECT * FROM voucher');
    console.log('--- VOUCHERS ---');
    console.table(vouchers.rows.map(r => ({
      id: r.id,
      ma_voucher: r.ma_voucher,
      ten_chien_dich: r.ten_chien_dich,
      tu_dong_ap_dung: r.tu_dong_ap_dung,
      trang_thai: r.trang_thai,
      ngay_bat_dau: r.ngay_bat_dau,
      ngay_het_han: r.ngay_het_han,
      ap_dung_cho: r.ap_dung_cho,
      yeu_cau_thanh_toan: r.yeu_cau_thanh_toan,
      gia_tri_giam: r.gia_tri_giam,
      loai_giam: r.loai_giam
    })));

    const relations = await pool.query('SELECT * FROM voucher_goi_dich_vu');
    console.log('\n--- VOUCHER GOI DICH VU ---');
    console.table(relations.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care?options=-c%20timezone=UTC',
});

async function main() {
  try {
    const invoices = await pool.query(`
      SELECT hd.id, hd.tong_tien_phai_tra, hd.so_tien_da_tra, hd.trang_thai, hd.hinh_thuc_thanh_toan_goi
      FROM hoa_don hd
      JOIN khach_hang kh ON kh.id = hd.khach_hang_id
      WHERE kh.so_dien_thoai = '0912000011'
    `);
    console.log('Invoices for Nguyen Van An:', invoices.rows);

    const gdRes = await pool.query(`
      SELECT gd.id, gd.hoa_don_id, gd.so_tien, gd.ma_tham_chieu, gd.ngay_giao_dich
      FROM giao_dich_thanh_toan gd
      JOIN hoa_don hd ON hd.id = gd.hoa_don_id
      JOIN khach_hang kh ON kh.id = hd.khach_hang_id
      WHERE kh.so_dien_thoai = '0912000011'
    `);
    console.log('Transactions for Nguyen Van An:', gdRes.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();

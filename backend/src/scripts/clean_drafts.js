const { pool } = require('../../dist/config/db');

async function cleanDrafts() {
  try {
    const res1 = await pool.query(`
      UPDATE phac_do_dieu_tri pd
      SET trang_thai = 'cho_kich_hoat', ngay_kich_hoat = NULL
      WHERE pd.trang_thai = 'dang_dieu_tri'
        AND COALESCE((SELECT COUNT(*) FROM cuoc_hen WHERE phac_do_dieu_tri_id = pd.id AND trang_thai = 'hoan_thanh'), 0) = 0
        AND COALESCE((SELECT SUM(da_thanh_toan) FROM hoa_don WHERE phac_do_dieu_tri_id = pd.id), 0) = 0
    `);
    console.log('Cleaned unpaid regimens to cho_kich_hoat:', res1.rowCount);

    const res2 = await pool.query(`
      DELETE FROM hoa_don
      WHERE trang_thai = 'chua_thanh_toan'
        AND da_thanh_toan = 0
        AND id NOT IN (SELECT DISTINCT hoa_don_id FROM giao_dich_thanh_toan)
    `);
    console.log('Cleaned auto-created draft invoices:', res2.rowCount);
  } catch (err) {
    console.error('Error cleaning drafts:', err);
  } finally {
    process.exit(0);
  }
}

cleanDrafts();

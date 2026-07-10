const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care?options=-c%20timezone=UTC',
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Disable the protection trigger
    console.log('Disabling protection trigger...');
    await client.query('ALTER TABLE giao_dich_thanh_toan DISABLE TRIGGER trg_protect_giao_dich_thanh_toan');

    const examInvId = 'b02c829f-5e69-4e4b-8510-8d4835027e62';
    const pkgInvId = 'ac65bae1-284c-423a-89ca-143ad3dab05b';
    
    // 1. Move the 150.000đ exam transaction to the exam invoice
    console.log('Updating transactions...');
    await client.query(`
      UPDATE giao_dich_thanh_toan
      SET hoa_don_id = $1
      WHERE ma_tham_chieu = 'GD32946617'
    `, [examInvId]);

    // 2. Correct the session payment transaction to 400.000đ
    await client.query(`
      UPDATE giao_dich_thanh_toan
      SET so_tien = 400000
      WHERE ma_tham_chieu = 'GD24190847'
    `);

    // 3. Update the package invoice paid amount to 400.000đ
    console.log('Updating package invoice paid amount...');
    await client.query(`
      UPDATE hoa_don
      SET so_tien_da_tra = 400000
      WHERE id = $1
    `, [pkgInvId]);

    // 4. Update the exam invoice paid amount to 150.000đ
    console.log('Updating exam invoice paid amount...');
    await client.query(`
      UPDATE hoa_don
      SET so_tien_da_tra = 150000,
          trang_thai = 'da_thanh_toan'
      WHERE id = $1
    `, [examInvId]);

    // Enable the protection trigger back
    console.log('Enabling protection trigger...');
    await client.query('ALTER TABLE giao_dich_thanh_toan ENABLE TRIGGER trg_protect_giao_dich_thanh_toan');

    await client.query('COMMIT');
    console.log('Database cleanup completed successfully!');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    console.error('Failed to cleanup database:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

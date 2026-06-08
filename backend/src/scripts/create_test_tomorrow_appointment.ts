import { pool } from '../config/db';

async function createTestTomorrowAppointment() {
  console.log('--- START CREATING TEST TOMORROW APPOINTMENT ---');
  const client = await pool.connect();
  try {
    // 1. Lấy ID dịch vụ Khám lâm sàng
    let { rows: services } = await pool.query("SELECT id, ten_dich_vu FROM dich_vu WHERE ten_dich_vu LIKE '%Khám%' OR ten_dich_vu LIKE '%khám%' LIMIT 1");
    if (services.length === 0) {
      const res = await pool.query('SELECT id, ten_dich_vu FROM dich_vu LIMIT 1');
      services = res.rows;
    }
    const serviceId = services[0]?.id;
    console.log('Service ID:', serviceId);

    // 2. Lấy khách hàng mẫu
    const { rows: customers } = await pool.query(`
      SELECT kh.id, nd.ho_ten, nd.so_dien_thoai
      FROM khach_hang kh
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      LIMIT 1
    `);
    const customer = customers[0];
    console.log('Customer:', customer);

    // 3. Đặt lịch ngày mai lúc 14:00 VN (07:00 UTC)
    // Ngày mai: 2026-06-07
    const tomorrow = '2026-06-07';
    
    // Xóa lịch cũ nếu trùng mã kiểm thử
    await pool.query("DELETE FROM lich_dat WHERE ma_lich_dat = 'LK-TEST-TM'");

    await pool.query(`
      INSERT INTO lich_dat (
        ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, 
        dich_vu_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, 
        trang_thai, ly_do_kham, nguoi_tao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'guest')
    `, [
      'LK-TEST-TM',
      customer ? customer.id : null,
      customer ? customer.ho_ten : 'Nguyễn Văn Test',
      customer ? customer.so_dien_thoai : '0987654321',
      'nam',
      serviceId || null,
      `${tomorrow}T07:00:00.000Z`, // 14:00 VN
      `${tomorrow}T07:30:00.000Z`, // 14:30 VN
      'cho_xac_nhan',
      'Kiểm tra khớp gối và cột sống thắt lưng'
    ]);

    console.log('--- TEST APPOINTMENT CREATED SUCCESSFULLY FOR TOMORROW AT 14:00 VN ---');
  } catch (error) {
    console.error('Error creating test tomorrow appointment:', error);
  } finally {
    client.release();
  }
}

createTestTomorrowAppointment().then(() => process.exit(0));

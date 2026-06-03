const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    console.log('Retrieving valid entities from database...');

    // 1. Get first active customer
    const customerRes = await pool.query(`
      SELECT kh.id, nd.ho_ten, nd.so_dien_thoai
      FROM khach_hang kh
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      WHERE nd.trang_thai = 'hoat_dong'
      LIMIT 1
    `);
    
    if (customerRes.rows.length === 0) {
      throw new Error('No active customer found in database. Please run seed script first.');
    }
    const customer = customerRes.rows[0];
    console.log(`Found Customer: ${customer.ho_ten} (ID: ${customer.id})`);

    // 2. Get first active doctor/technician
    const doctorRes = await pool.query(`
      SELECT cgyt.id, nd.ho_ten
      FROM chuyen_gia_y_te cgyt
      JOIN nguoi_dung nd ON cgyt.nguoi_dung_id = nd.id
      WHERE cgyt.trang_thai = 'hoat_dong'
      LIMIT 1
    `);
    if (doctorRes.rows.length === 0) {
      throw new Error('No active doctor/technician found in database.');
    }
    const doctor = doctorRes.rows[0];
    console.log(`Found Doctor/Tech: ${doctor.ho_ten} (ID: ${doctor.id})`);

    // 3. Get first service
    const serviceRes = await pool.query(`
      SELECT id, ten_dich_vu, don_gia
      FROM dich_vu
      WHERE trang_thai = 'hoat_dong'
      LIMIT 1
    `);
    if (serviceRes.rows.length === 0) {
      throw new Error('No active service found in database.');
    }
    const service = serviceRes.rows[0];
    console.log(`Found Service: ${service.ten_dich_vu} (ID: ${service.id})`);

    // 4. Get first active package
    const packageRes = await pool.query(`
      SELECT id, ten_goi, gia_goi
      FROM goi_dich_vu
      WHERE trang_thai = 'hoat_dong'
      LIMIT 1
    `);
    if (packageRes.rows.length === 0) {
      throw new Error('No active package found in database.');
    }
    const packageInfo = packageRes.rows[0];
    console.log(`Found Package: ${packageInfo.ten_goi} (ID: ${packageInfo.id})`);

    // 5. Get first ready room
    const roomRes = await pool.query(`
      SELECT id, ten_phong
      FROM phong
      WHERE trang_thai = 'san_sang'
      LIMIT 1
    `);
    const room = roomRes.rows.length > 0 ? roomRes.rows[0] : null;
    if (room) {
      console.log(`Found Room: ${room.ten_phong} (ID: ${room.id})`);
    }

    // 6. Generate test booking
    const maLichDat = `LD${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 3600000); // 2 hours ago
    const endTime = new Date(now.getTime() - 1 * 3600000);  // 1 hour ago
    
    console.log('\nInserting completed test booking (lich_dat) into database...');
    
    const insertRes = await pool.query(`
      INSERT INTO lich_dat (
        ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach,
        dich_vu_id, ky_thuat_vien_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc,
        ly_do_kham, trang_thai, thoi_gian_checkin, nguoi_tao,
        chan_doan, chong_chi_dinh, khuyen_nghi_goi_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, ma_lich_dat, trang_thai
    `, [
      maLichDat,
      customer.id,
      customer.ho_ten,
      customer.so_dien_thoai,
      'Nam', // gender
      service.id,
      doctor.id,
      room ? room.id : null,
      startTime,
      endTime,
      'Đau cổ vai gáy cấp, cứng cổ khó quay đầu sang bên trái.', // lý do khám
      'hoan_thanh', // Trạng thái hoàn thành để Lễ tân tạo gói điều trị
      startTime, // check-in
      'le_tan',
      'Thoái hóa cột sống cổ C4-C5, hội chứng cổ vai gáy cơ năng.', // chẩn đoán
      'Chống chỉ định: Không dùng dòng điện xung vùng cổ sau, chú ý lực xoa bóp.', // chống chỉ định
      packageInfo.id // Khuyên nghị gói để test luồng tạo gói combo
    ]);

    const createdBooking = insertRes.rows[0];
    console.log('\n✅ Created test appointment successfully!');
    console.log(`- Mã lịch khám: ${createdBooking.ma_lich_dat}`);
    console.log(`- ID lịch khám: ${createdBooking.id}`);
    console.log(`- Trạng thái: ${createdBooking.trang_thai}`);
    console.log(`- Khách hàng: ${customer.ho_ten}`);
    console.log(`- Khuyên nghị gói: ${packageInfo.ten_goi}`);
    console.log('\nBạn có thể vào giao diện Lễ tân để kiểm tra luồng tạo gói và lịch điều trị từ lịch khám này.');

  } catch (err) {
    console.error('❌ Error seeding test appointment:', err);
  } finally {
    await pool.end();
  }
}

main();

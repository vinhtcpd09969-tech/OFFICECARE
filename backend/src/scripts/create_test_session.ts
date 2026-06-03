import { pool } from '../config/db';

async function run() {
  console.log('--- Bắt đầu khởi tạo dữ liệu mẫu Lịch điều trị & Buổi 1 Hoàn thành ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lấy một khách hàng bất kỳ
    const { rows: khs } = await client.query(`
      SELECT kh.id, nd.ho_ten, nd.so_dien_thoai 
      FROM khach_hang kh
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      LIMIT 1
    `);
    if (khs.length === 0) {
      throw new Error('Không tìm thấy bất kỳ khách hàng nào trong DB để gán lịch điều trị.');
    }
    const kh = khs[0];
    console.log(`- Đã chọn khách hàng: ${kh.ho_ten} (${kh.so_dien_thoai})`);

    // 2. Lấy một gói dịch vụ bất kỳ
    const { rows: pkgs } = await client.query(`
      SELECT id, ten_goi, tong_so_buoi FROM goi_dich_vu LIMIT 1
    `);
    if (pkgs.length === 0) {
      throw new Error('Không tìm thấy bất kỳ gói dịch vụ nào trong DB.');
    }
    const pkg = pkgs[0];
    console.log(`- Đã chọn Gói điều trị: ${pkg.ten_goi} (Tổng ${pkg.tong_so_buoi} buổi)`);

    // 3. Lấy một dịch vụ liên kết bất kỳ
    const { rows: svcs } = await client.query(`
      SELECT id, ten_dich_vu FROM dich_vu LIMIT 1
    `);
    if (svcs.length === 0) {
      throw new Error('Không tìm thấy bất kỳ dịch vụ nào trong DB.');
    }
    const svc = svcs[0];
    console.log(`- Đã chọn Dịch vụ: ${svc.ten_dich_vu}`);

    // 4. Lấy một kỹ thuật viên/chuyên gia y tế bất kỳ
    const { rows: ktvs } = await client.query(`
      SELECT ktv.id, nd.ho_ten 
      FROM chuyen_gia_y_te ktv
      JOIN nguoi_dung nd ON ktv.nguoi_dung_id = nd.id
      LIMIT 1
    `);
    if (ktvs.length === 0) {
      throw new Error('Không tìm thấy bất kỳ kỹ thuật viên nào trong DB.');
    }
    const ktv = ktvs[0];
    console.log(`- Đã chọn Kỹ thuật viên: ${ktv.ho_ten}`);

    // 5. Lấy một phòng bất kỳ
    const { rows: rooms } = await client.query(`
      SELECT id, ten_phong FROM phong LIMIT 1
    `);
    if (rooms.length === 0) {
      throw new Error('Không tìm thấy bất kỳ phòng nào trong DB.');
    }
    const room = rooms[0];
    console.log(`- Đã chọn Phòng: ${room.ten_phong}`);

    // 6. Xóa các dữ liệu lịch điều trị test cũ nếu có trùng mã để tránh lỗi UNIQUE constraint
    const testMaLDT = 'LDT-TESTGOI01';
    await client.query('DELETE FROM buoi_tri_lieu WHERE lich_dieu_tri_id IN (SELECT id FROM lich_dieu_tri WHERE ma_lich_dieu_tri = $1)', [testMaLDT]);
    await client.query('DELETE FROM hoa_don WHERE lich_dieu_tri_id IN (SELECT id FROM lich_dieu_tri WHERE ma_lich_dieu_tri = $1)', [testMaLDT]);
    await client.query('DELETE FROM lich_dieu_tri WHERE ma_lich_dieu_tri = $1', [testMaLDT]);

    // 7. Tạo lịch điều trị mới (lich_dieu_tri)
    const { rows: ldtRows } = await client.query(`
      INSERT INTO lich_dieu_tri (
        khach_hang_id, loai_dieu_tri, goi_dich_vu_id, tong_so_buoi, 
        so_buoi_da_dung, trang_thai, ma_lich_dieu_tri, ho_ten_khach, 
        so_dien_thoai, phong_id, ngay_bat_dau, ngay_ket_thuc
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW() + INTERVAL '30 days')
      RETURNING id, ma_lich_dieu_tri
    `, [
      kh.id,
      'theo_goi',
      pkg.id,
      pkg.tong_so_buoi,
      1, // Đang ở buổi 1 hoàn thành (số buổi đã dùng = 1)
      'dang_dieu_tri',
      testMaLDT,
      kh.ho_ten,
      kh.so_dien_thoai,
      room.id
    ]);
    const ldt = ldtRows[0];
    console.log(`- Đã tạo Lịch điều trị thành công với mã: ${ldt.ma_lich_dieu_tri}`);

    // 8. Tạo buổi trị liệu số 1 đã hoàn thành (buoi_tri_lieu)
    const { rows: btlRows } = await client.query(`
      INSERT INTO buoi_tri_lieu (
        lich_dieu_tri_id, khach_hang_id, ky_thuat_vien_id, phong_id, dich_vu_id,
        thoi_gian_bat_dau, thoi_gian_ket_thuc, so_thu_tu_buoi, trang_thai,
        danh_gia_truoc_buoi, danh_gia_sau_buoi, danh_gia_hieu_qua, ai_tom_tat_ngan
      ) VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 hours', NOW(), 1, $6, 5, 5, 5, $7)
      RETURNING id
    `, [
      ldt.id,
      kh.id,
      ktv.id,
      room.id,
      svc.id,
      'hoan_thanh', // Trạng thái buổi trị liệu: hoàn thành
      'Bệnh nhân đáp ứng tốt trong buổi phục hồi chức năng cơ bản đầu tiên.'
    ]);
    console.log(`- Đã tạo Buổi trị liệu số 1 hoàn thành thành công (ID: ${btlRows[0].id})`);

    await client.query('COMMIT');
    console.log('✅ Giao dịch hoàn tất! Đã tạo dữ liệu mẫu thành công.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi khởi tạo dữ liệu mẫu:', error);
  } finally {
    client.release();
  }
}

run();

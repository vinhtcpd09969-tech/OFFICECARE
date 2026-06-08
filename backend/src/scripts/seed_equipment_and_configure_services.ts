import { pool } from '../config/db';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Cấu hình & Cập nhật danh sách Phòng y tế chuẩn theo Phương án 2...');
    const roomsToUpsert = [
      { ten_phong: 'Phòng khám lâm sàng 1', ma_phong: 'P101', loai_phong: 'kham_benh', tang: 'Tang 1' },
      { ten_phong: 'Phòng khám tổng quát', ma_phong: 'P102', loai_phong: 'kham_benh', tang: 'Tang 1' },
      { ten_phong: 'Phòng thiết bị trung tâm', ma_phong: 'P200', loai_phong: 'kho_thiet_bi', tang: 'Tang 2' },
      { ten_phong: 'Phòng vật lý trị liệu 201', ma_phong: 'P201', loai_phong: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten_phong: 'Phòng vật lý trị liệu 202', ma_phong: 'P202', loai_phong: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten_phong: 'Phòng vật lý trị liệu 203', ma_phong: 'P203', loai_phong: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten_phong: 'Phòng vật lý trị liệu 204', ma_phong: 'P204', loai_phong: 'phong_tri_lieu_chuan', tang: 'Tang 2' },
      { ten_phong: 'Phòng máy trị liệu kéo giãn', ma_phong: 'P205', loai_phong: 'phong_may_co_dinh', tang: 'Tang 2' },
      { ten_phong: 'Khu tập VLTL & PHCN 1', ma_phong: 'P301', loai_phong: 'phong_tap_phcn', tang: 'Tang 3' },
      { ten_phong: 'Khu tập VLTL & PHCN 2', ma_phong: 'P302', loai_phong: 'phong_tap_phcn', tang: 'Tang 3' }
    ];

    for (const r of roomsToUpsert) {
      const { rows: existing } = await client.query('SELECT id FROM phong WHERE ma_phong = $1', [r.ma_phong]);
      if (existing.length > 0) {
        await client.query(
          `UPDATE phong 
           SET ten_phong = $1, loai_phong = $2, tang = $3
           WHERE ma_phong = $4`,
          [r.ten_phong, r.loai_phong, r.tang, r.ma_phong]
        );
        console.log(`- Đã cập nhật phòng: ${r.ma_phong} -> ${r.ten_phong} (${r.loai_phong})`);
      } else {
        await client.query(
          `INSERT INTO phong (ten_phong, ma_phong, loai_phong, tang, trang_thai)
           VALUES ($1, $2, $3, $4, 'san_sang')`,
          [r.ten_phong, r.ma_phong, r.loai_phong, r.tang]
        );
        console.log(`- Đã tạo mới phòng: ${r.ma_phong} -> ${r.ten_phong} (${r.loai_phong})`);
      }
    }

    console.log('\n2. Cập nhật thiết bị yêu cầu (thiet_bi_yeu_cau) cho các dịch vụ...');

    // Cập nhật các dịch vụ cụ thể yêu cầu thiết bị
    const updates = [
      { ten: 'Điện xung giảm đau', thiet_bi: 'Máy điện xung' },
      { ten: 'Nhiệt trị liệu', thiet_bi: 'Đèn hồng ngoại' },
      { ten: 'Kéo giãn cột sống', thiet_bi: 'Giường kéo giãn' },
      { ten: 'Kéo giãn vùng cổ', thiet_bi: 'Máy kéo giãn cổ' },
      { ten: 'Trị liệu kéo giãn', thiet_bi: 'Giường kéo giãn' }
    ];

    for (const update of updates) {
      await client.query(
        'UPDATE dich_vu SET thiet_bi_yeu_cau = $1 WHERE ten_dich_vu = $2',
        [update.thiet_bi, update.ten]
      );
      console.log(`- Đã cập nhật dịch vụ: "${update.ten}" -> Yêu cầu: "${update.thiet_bi}"`);
    }

    // Đặt 'không có' cho các dịch vụ còn lại để đồng bộ hóa
    await client.query(
      `UPDATE dich_vu 
       SET thiet_bi_yeu_cau = 'không có' 
       WHERE ten_dich_vu NOT IN ('Điện xung giảm đau', 'Nhiệt trị liệu', 'Kéo giãn cột sống', 'Kéo giãn vùng cổ', 'Trị liệu kéo giãn')`
    );
    console.log('- Đã đặt "không có" thiết bị cho tất cả các dịch vụ điều trị thủ công bằng tay.');

    console.log('\n3. Truy vấn danh sách ID phòng/giường để liên kết thiết bị...');
    const { rows: rooms } = await client.query('SELECT id, ma_phong, ten_phong FROM phong');
    const roomMap = new Map<string, string>();
    rooms.forEach(r => {
      roomMap.set(r.ma_phong, r.id);
    });

    console.log('4. Xóa sạch dữ liệu thiết bị cũ (nếu có) để chuẩn bị seed mới...');
    await client.query('DELETE FROM thiet_bi_y_te');

    console.log('5. Seeding danh sách thiết bị y tế thực tế cấp cao (Góc nhìn KTV Trưởng)...');

    // Lịch bảo trì tiếp theo: 2 tháng tới
    const nextMaintenanceDate = new Date();
    nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 2);
    const dateStr = nextMaintenanceDate.toISOString().split('T')[0];

    // Lịch bảo trì quá hạn: 1 tháng trước (để tạo cảnh báo trực quan cho Admin)
    const overdueDate = new Date();
    overdueDate.setMonth(overdueDate.getMonth() - 1);
    const overdueStr = overdueDate.toISOString().split('T')[0];

    const equipmentList = [
      {
        ma_thiet_bi: 'EQP-LAS01',
        ten_thiet_bi: 'Máy Laser công suất cao BTL-6000 20W',
        loai_thiet_bi: 'Máy laser',
        phong_code: 'P200', // Phòng thiết bị trung tâm (Thiết bị di động)
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Phát laser cường độ cao trị liệu sâu, chú ý kính bảo hộ.'
      },
      {
        ma_thiet_bi: 'EQP-SW01',
        ten_thiet_bi: 'Máy sóng xung kích trị liệu BTL-6000 Shockwave',
        loai_thiet_bi: 'Máy Shockwave',
        phong_code: 'P200', // Phòng thiết bị trung tâm (Thiết bị di động)
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Đầu phát đa tần số, bôi gel trước khi vận hành đầu phát.'
      },
      {
        ma_thiet_bi: 'EQP-US01',
        ten_thiet_bi: 'Máy siêu âm điều trị đa tần BTL-4710 Smart',
        loai_thiet_bi: 'Máy siêu âm',
        phong_code: 'P200', // Phòng thiết bị trung tâm (Thiết bị di động)
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Đầu phát siêu âm rảnh tay kết hợp trị liệu nhiệt ấm.'
      },
      {
        ma_thiet_bi: 'EQP-ELT01',
        ten_thiet_bi: 'Máy điện xung 4 kênh kết hợp giác hút BTL-4625',
        loai_thiet_bi: 'Máy điện xung',
        phong_code: 'P200', // Phòng thiết bị trung tâm (Thiết bị di động)
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Dòng điện TENS, xung giao thoa giảm đau cơ xương khớp.'
      },
      {
        ma_thiet_bi: 'EQP-IR01',
        ten_thiet_bi: 'Đèn hồng ngoại Philips Infraphil 300W',
        loai_thiet_bi: 'Đèn hồng ngoại',
        phong_code: 'P200', // Phòng thiết bị trung tâm (Thiết bị di động)
        ngay_bao_tri: overdueStr, // Cảnh báo quá hạn
        trang_thai: 'san_sang',
        ghi_chu: 'Sưởi ấm trị liệu tăng tuần hoàn, bóng 300W chân đứng.'
      },
      {
        ma_thiet_bi: 'EQP-COM01',
        ten_thiet_bi: 'Hệ thống nén ép áp lực hơi BTL-6000 Lymphastim',
        loai_thiet_bi: 'Máy nén ép',
        phong_code: 'P200', // Phòng thiết bị trung tâm (Thiết bị di động)
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Bộ ủng 12 khoang ép xả liên hoàn hỗ trợ lưu thông chi dưới.'
      },
      {
        ma_thiet_bi: 'EQP-DTS01',
        ten_thiet_bi: 'Hệ thống giường kéo giãn cột sống DTS Triton',
        loai_thiet_bi: 'Giường kéo giãn',
        phong_code: 'P205', // Phòng máy cố định
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Kéo giãn giảm áp đĩa đệm thắt lưng tự động kiểm soát lực.'
      },
      {
        ma_thiet_bi: 'EQP-CST01',
        ten_thiet_bi: 'Khung kéo giãn cột sống cổ treo tường BTL',
        loai_thiet_bi: 'Máy kéo giãn cổ',
        phong_code: 'P205', // Phòng máy cố định
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Hệ ròng rọc kéo giãn giảm tải áp lực cột sống cổ.'
      },
      {
        ma_thiet_bi: 'EQP-SIS01',
        ten_thiet_bi: 'Hệ thống từ trường siêu dẫn công suất cao BTL-6000 SIS',
        loai_thiet_bi: 'Máy từ trường',
        phong_code: 'P205', // Phòng máy cố định
        ngay_bao_tri: dateStr,
        trang_thai: 'san_sang',
        ghi_chu: 'Kích thích điện từ siêu dẫn giảm đau thần kinh, co thắt khớp.'
      },
      {
        ma_thiet_bi: 'EQP-US02',
        ten_thiet_bi: 'Máy siêu âm xách tay giảm đau cấp',
        loai_thiet_bi: 'Máy siêu âm',
        phong_code: 'P200', // Phòng thiết bị trung tâm (Thiết bị di động)
        ngay_bao_tri: dateStr,
        trang_thai: 'dang_bao_tri', // Trạng thái bảo trì
        ghi_chu: 'Thiết bị dự phòng xách tay đi tua hoặc lâm sàng khẩn cấp.'
      }
    ];

    for (const eq of equipmentList) {
      const phongId = eq.phong_code ? roomMap.get(eq.phong_code) : null;
      
      await client.query(
        `INSERT INTO thiet_bi_y_te (ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, ngay_bao_tri_tiep_theo, trang_thai, phong_id_hien_tai, ghi_chu)
         VALUES ($1, $2, $3, NOW() - INTERVAL '6 months', $4, $5, $6, $7)`,
        [
          eq.ma_thiet_bi,
          eq.ten_thiet_bi,
          eq.loai_thiet_bi,
          eq.ngay_bao_tri,
          eq.trang_thai,
          phongId ? Number(phongId) : null,
          eq.ghi_chu
        ]
      );
      console.log(`- Đã seed thiết bị: [${eq.ma_thiet_bi}] "${eq.ten_thiet_bi}" -> Gán phòng: ${eq.phong_code || 'Kho lưu trữ'}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Cấu hình phòng, dịch vụ và seed thiết bị thành công mỹ mãn!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi thực hiện giao dịch:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();


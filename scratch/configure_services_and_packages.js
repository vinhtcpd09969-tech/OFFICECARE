const { Client } = require('pg');

const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care';

// Configuration of allowed individually (public) vs not allowed individually (internal/private)
const serviceVisibility = {
  // --- CÔNG KHAI WEBSITE (Dùng lẻ cho 1 buổi) ---
  'Khám lượng giá cột sống & tư thế': true,
  'Trải Nghiệm Thư Giãn Wellness Toàn Thân': true,
  'Massage Thư Giãn Phục Hồi': true,
  'Giác Hơi Phục Hồi': true,
  'Trị Liệu Đá Nóng': true,
  'Ngâm Đá Lạnh Phục Hồi': true,
  'Massage Đầu Cổ Vai Gáy': true,
  'Kéo Giãn Toàn Thân Chuyên Sâu': true,
  'Trị Liệu Tinh Dầu Thư Giãn': true,
  'Xông Phục Hồi Cơ Thể': true,
  'Massage Chân Phục Hồi': true,
  'Trị Liệu Ép Phục Hồi Cơ': true,

  // --- NỘI BỘ (Chỉ dùng ghép trong gói liệu trình hoặc gói linh động) ---
  'Kéo giãn cột sống cổ bằng tay': false,
  'Kỹ thuật giải cơ chuyên sâu': false,
  'Trị liệu giảm đau bằng dòng điện xung': false,
  'Hướng dẫn tập phục hồi chức năng': false,
  'Nhiệt trị liệu hồng ngoại': false,
  'Kỹ thuật di động khớp tăng biên độ': false,
  'Di động mô mềm giải phóng cơ': false,
  'Giải phóng cơ hình lê chuyên sâu': false,
  'Vận động trị liệu khớp vai': false,
  'Kéo giãn cột sống thắt lưng bằng máy': false,
  'Kéo giãn cơ toàn thân chủ động': false,
  'Kỹ thuật giải phóng điểm bám gân': false,
  'Vận động trị liệu khớp cổ tay': false,
  'Trị liệu Cổ - Vai - Gáy "Khơi Thông Kinh Lạc"': false,
  'Phục Hồi Đau Lưng - Thoát Vị Đĩa Đệm': false,
  'Giảm Đau Cấp Tốc - Co Thắt Cơ Cấp': false,
  'Trị liệu Hội Chứng Ống Cổ Tay & Tê Bì': false,
  'Trị liệu Đau Nhức Khớp Gối / Khớp Vai': false,
  'Phục Hồi Cơ Bắp Thể Thao Chuyên Sâu': false,
  'Điều Trị Thoái Hóa Khớp (Gối/Vai/Háng)': false,
  'Phục Hồi Sau Chấn Thương / Phẫu Thuật': false,
  'Trị Liệu & Phục Hồi Chức Năng Thần Kinh': false,
  'Trị Liệu Cong Vẹo Cột Sống & Sửa Tư Thế': false
};

async function main() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  try {
    await client.connect();
    console.log('🔗 Đã kết nối cơ sở dữ liệu để thiết lập cấu hình lâm sàng...');

    // 1. Cập nhật cột hien_thi_website cho tất cả dịch vụ
    console.log('⚙️ Đang phân loại dịch vụ Công khai và Nội bộ...');
    for (const [serviceName, isPublic] of Object.entries(serviceVisibility)) {
      const res = await client.query(
        `UPDATE dich_vu 
         SET hien_thi_website = $1 
         WHERE ten_dich_vu = $2 
         RETURNING id`,
        [isPublic, serviceName]
      );
      if (res.rowCount > 0) {
        console.log(` ✅ [${isPublic ? 'CÔNG KHAI' : 'NỘI BỘ'}] -> Dịch vụ: "${serviceName}"`);
      } else {
        console.warn(` ⚠️ Không tìm thấy dịch vụ: "${serviceName}"`);
      }
    }

    // Lấy ID của tất cả dịch vụ để dễ dàng map vào gói
    const servicesRes = await client.query('SELECT id, ten_dich_vu, don_gia FROM dich_vu');
    const serviceMap = {};
    servicesRes.rows.forEach(row => {
      serviceMap[row.ten_dich_vu] = {
        id: row.id,
        price: Number(row.don_gia)
      };
    });

    // 2. Tạo GÓI LIỆU TRÌNH CHUẨN Y KHOA: "Phục hồi Thoát vị đĩa đệm & Thần kinh tọa Chuyên sâu (10 Buổi)"
    const fixedPkgName = 'Gói Phục Hồi Thoát Vị Đĩa Đệm & Thần Kinh Tọa Chuyên Sâu (10 Buổi)';
    const fixedPkgCode = 'PKG-LBR-SCI-10';
    console.log(`\n📦 Đang khởi tạo Gói liệu trình cố định: "${fixedPkgName}"...`);

    // Xóa gói cũ nếu đã tồn tại trùng mã để tránh lỗi xung đột dữ liệu
    await client.query('DELETE FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id IN (SELECT id FROM goi_dich_vu WHERE ma_goi = $1)', [fixedPkgCode]);
    await client.query('DELETE FROM goi_dich_vu WHERE ma_goi = $1', [fixedPkgCode]);

    // Các dịch vụ lâm sàng cấu thành gói liệu trình cố định
    const fixedServices = [
      { name: 'Khám lượng giá cột sống & tư thế', sessions: 1, batBuoc: true, thuTu: 1 },
      { name: 'Nhiệt trị liệu hồng ngoại', sessions: 10, batBuoc: true, thuTu: 2 },
      { name: 'Trị liệu giảm đau bằng dòng điện xung', sessions: 10, batBuoc: true, thuTu: 3 },
      { name: 'Kỹ thuật giải cơ chuyên sâu', sessions: 10, batBuoc: true, thuTu: 4 },
      { name: 'Giải phóng cơ hình lê chuyên sâu', sessions: 10, batBuoc: true, thuTu: 5 },
      { name: 'Kéo giãn cột sống thắt lưng bằng máy', sessions: 10, batBuoc: true, thuTu: 6 },
      { name: 'Hướng dẫn tập phục hồi chức năng', sessions: 10, batBuoc: true, thuTu: 7 }
    ];

    const fixedDetailsJson = [];
    let totalRetailValue = 0;

    fixedServices.forEach(item => {
      const dbSvc = serviceMap[item.name];
      if (dbSvc) {
        totalRetailValue += dbSvc.price * item.sessions;
        fixedDetailsJson.push({
          dich_vu_id: dbSvc.id,
          so_buoi: item.sessions,
          so_lan_toi_da_trong_goi: item.sessions,
          bat_buoc: item.batBuoc,
          thu_tu_thuc_hien: item.thuTu
        });
      } else {
        console.error(`❌ Lỗi: Không tìm thấy dịch vụ "${item.name}" trong cơ sở dữ liệu!`);
      }
    });

    const fixedPkgPrice = 4500000; // Giá ưu đãi trọn gói

    const insertFixedRes = await client.query(
      `INSERT INTO goi_dich_vu (
        ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, 
        hien_thi_website, trang_thai, chi_tiet_dich_vu, so_dv_toi_da_moi_buoi, loai_goi
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        fixedPkgName,
        fixedPkgCode,
        'Phác đồ chuẩn lâm sàng phục hồi cấu trúc đĩa đệm, giải áp cơ hình lê giải phóng dây thần kinh tọa bị chèn ép, thiết lập sự ổn định cột sống thắt lưng.',
        10,
        fixedPkgPrice,
        totalRetailValue,
        6,
        true,
        'hoat_dong',
        JSON.stringify(fixedDetailsJson),
        5,
        'lieu_trinh'
      ]
    );

    const fixedPkgId = insertFixedRes.rows[0].id;
    for (const item of fixedDetailsJson) {
      await client.query(
        `INSERT INTO goi_dich_vu_chi_tiet (
          goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi, so_lan_toi_da_trong_goi, bat_buoc, thu_tu_thuc_hien
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [fixedPkgId, item.dich_vu_id, item.so_buoi, item.so_lan_toi_da_trong_goi, item.bat_buoc, item.thu_tu_thuc_hien]
      );
    }
    console.log(` ✅ Đã tạo thành công Gói liệu trình: "${fixedPkgName}" (Tiết kiệm được ${totalRetailValue - fixedPkgPrice}đ so với giá trị lẻ cộng dồn ${totalRetailValue}đ)`);


    // 3. Tạo GÓI DỊCH VỤ LINH ĐỘNG (FLEXI-CARE): "Gói Trị Liệu Cơ Xương Khớp Linh Động (Flexi-Care)"
    const flexiPkgName = 'Gói Trị Liệu Cơ Xương Khớp Linh Động (Flexi-Care)';
    const flexiPkgCode = 'PKG-FLEXI-CARE';
    console.log(`\n📦 Đang khởi tạo Gói linh động: "${flexiPkgName}"...`);

    await client.query('DELETE FROM goi_dich_vu_chi_tiet WHERE goi_dich_vu_id IN (SELECT id FROM goi_dich_vu WHERE ma_goi = $1)', [flexiPkgCode]);
    await client.query('DELETE FROM goi_dich_vu WHERE ma_goi = $1', [flexiPkgCode]);

    // Các dịch vụ KTV kê đơn linh hoạt trong gói
    const flexiServices = [
      { name: 'Kỹ thuật giải cơ chuyên sâu', maxSessions: 5, batBuoc: false, thuTu: 1 },
      { name: 'Trị liệu giảm đau bằng dòng điện xung', maxSessions: 5, batBuoc: false, thuTu: 2 },
      { name: 'Nhiệt trị liệu hồng ngoại', maxSessions: 5, batBuoc: false, thuTu: 3 },
      { name: 'Di động mô mềm giải phóng cơ', maxSessions: 5, batBuoc: false, thuTu: 4 },
      { name: 'Kéo giãn cột sống cổ bằng tay', maxSessions: 5, batBuoc: false, thuTu: 5 },
      { name: 'Kéo giãn cột sống thắt lưng bằng máy', maxSessions: 5, batBuoc: false, thuTu: 6 },
      { name: 'Massage Đầu Cổ Vai Gáy', maxSessions: 5, batBuoc: false, thuTu: 7 }
    ];

    const flexiDetailsJson = [];
    flexiServices.forEach(item => {
      const dbSvc = serviceMap[item.name];
      if (dbSvc) {
        flexiDetailsJson.push({
          dich_vu_id: dbSvc.id,
          so_buoi: item.maxSessions,
          so_lan_toi_da_trong_goi: item.maxSessions,
          bat_buoc: item.batBuoc,
          thu_tu_thuc_hien: item.thuTu
        });
      }
    });

    const flexiPrice = 600000; // Giá trị mua cho 1 tín dụng buổi linh động

    const insertFlexiRes = await client.query(
      `INSERT INTO goi_dich_vu (
        ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, 
        hien_thi_website, trang_thai, chi_tiet_dich_vu, so_dv_toi_da_moi_buoi, loai_goi
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        flexiPkgName,
        flexiPkgCode,
        'Giải pháp linh động tối ưu cho khách hàng. Số buổi quy định là 1 buổi kiểm soát, Kỹ thuật viên có thể kê đơn kết hợp linh động bất cứ dịch vụ kỹ thuật nào trong danh mục phù hợp nhất với thể trạng thực tế.',
        1,
        flexiPrice,
        flexiPrice,
        3,
        true,
        'hoat_dong',
        JSON.stringify(flexiDetailsJson),
        4,
        'linh_dong'
      ]
    );

    const flexiPkgId = insertFlexiRes.rows[0].id;
    for (const item of flexiDetailsJson) {
      await client.query(
        `INSERT INTO goi_dich_vu_chi_tiet (
          goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi, so_lan_toi_da_trong_goi, bat_buoc, thu_tu_thuc_hien
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [flexiPkgId, item.dich_vu_id, item.so_buoi, item.so_lan_toi_da_trong_goi, item.bat_buoc, item.thu_tu_thuc_hien]
      );
    }
    console.log(` ✅ Đã tạo thành công Gói linh động: "${flexiPkgName}"!`);

    console.log('\n🌟 Đã thiết lập hoàn tất cấu hình dịch vụ lâm sàng và gói chuẩn y khoa thành công!');
  } catch (err) {
    console.error('❌ Lỗi thiết lập cấu hình lâm sàng:', err);
  } finally {
    await client.end();
  }
}

main();

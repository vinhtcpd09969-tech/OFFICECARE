import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

async function seedPTClinic() {
  console.log("=== START SEEDING PHYSICAL THERAPY CLINIC DESIGN ===");
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Truncate existing clinical transaction tables and design tables to avoid constraint violations
    console.log("Truncating existing clinical tables...");
    await client.query(`
      TRUNCATE TABLE 
        buoi_tri_lieu_dich_vu,
        buoi_tri_lieu,
        lich_dieu_tri,
        ho_so_dieu_tri,
        lich_dat,
        lich_lam_viec,
        goi_dich_vu_chi_tiet,
        goi_dich_vu,
        dich_vu,
        danh_muc_dich_vu,
        phong,
        thiet_bi_y_te
      CASCADE;
    `);

    // 2. Insert professional clinic rooms (designed by a PT consultant)
    console.log("Seeding professional clinic rooms...");
    const roomInsertQuery = `
      INSERT INTO phong (id, ten_phong, ma_phong, loai_phong, mo_ta, trang_thai, suc_chua) VALUES
      (1, 'Phòng Lượng Giá & Khám Lâm Sàng 1', 'P101', 'kham_benh', 'Phòng chẩn đoán lâm sàng của BS. Khoa', 'san_sang', 1),
      (2, 'Phòng Lượng Giá & Khám Lâm Sàng 2', 'P102', 'kham_benh', 'Phòng chẩn đoán cột sống & tư thế của BS. Lan Anh', 'san_sang', 1),
      (3, 'Phòng Tập Vận Động Trị Liệu & PHCN', 'P201', 'phong_tap_phcn', 'Khu vực tập vận động tích cực, tập dáng đi và thăng bằng', 'san_sang', 4),
      (4, 'Phòng Điện Trị Liệu & Laser Công Suất Cao', 'P301', 'phong_tri_lieu_chuan', 'Phòng máy vật lý trị liệu giảm sưng viêm', 'san_sang', 3),
      (5, 'Phòng Kéo Giãn Giải Áp & Từ Trường', 'P302', 'phong_tri_lieu_chuan', 'Phòng điều trị thoái vị đĩa đệm, giải áp cột sống', 'san_sang', 3),
      (6, 'Phòng Trị Liệu Bằng Sóng Cơ Học & Siêu Âm', 'P303', 'phong_tri_lieu_chuan', 'Shockwave và Ultrasound tập trung giải điểm đau', 'san_sang', 2),
      (7, 'Phòng Trị Liệu Cơ Xương Khớp Bằng Tay 1', 'P401', 'phong_tri_lieu_chuan', 'Khu vực nắn chỉnh, di động khớp và trị liệu bằng tay', 'san_sang', 2),
      (8, 'Phòng Trị Liệu Cơ Xương Khớp Bằng Tay 2', 'P402', 'phong_tri_lieu_chuan', 'Khu vực nắn chỉnh giải phóng màng cơ sâu', 'san_sang', 2)
    `;
    await client.query(roomInsertQuery);

    // 3. Insert professional treatment categories
    console.log("Seeding treatment categories...");
    const categoryInsertQuery = `
      INSERT INTO danh_muc_dich_vu (id, ten_danh_muc, mo_ta, thu_tu_hien_thi, an_hien, loai_danh_muc) VALUES
      (1, 'Khám Bệnh & Lượng Giá Chuyên Sâu', 'Dịch vụ chẩn đoán lâm sàng, đo tầm vận động khớp và lập phác đồ', 1, true, 'dich_vu'),
      (2, 'Trị Liệu Bằng Tay & Nắn Chỉnh', 'Giải phóng cơ sâu, di động khớp và nắn chỉnh cột sống', 2, true, 'dich_vu'),
      (3, 'Vật Lý Trị Liệu Công Nghệ Cao', 'Các liệu pháp nhiệt, điện xung, siêu âm, laser công suất cao và sóng xung kích', 3, true, 'dich_vu'),
      (4, 'Vận Động Trị Liệu Phục Hồi Chức Năng', 'Tập vận động tích cực ổn định hệ cơ lõi và phục hồi dáng đi', 4, true, 'dich_vu'),
      (5, 'Gói Trị Liệu Cột Sống & Cổ Vai Gáy', 'Các gói combo trị liệu giảm áp đĩa đệm, giải phóng chèn ép rễ thần kinh', 5, true, 'goi_dich_vu'),
      (6, 'Gói Cơ Xương Khớp & Chấn Thương', 'Các gói liệu trình phục hồi chấn thương khớp gối, viêm gân cấp, PHCN dáng đi', 6, true, 'goi_dich_vu')
    `;
    await client.query(categoryInsertQuery);

    // 4. Insert professional physical therapy services
    console.log("Seeding services...");
    const services = [
      // Category 1: Khám & Lượng Giá
      {
        id: 'd1000000-0000-0000-0000-000000000001',
        danh_muc_id: 1,
        ten_dich_vu: 'Khám lâm sàng & Lượng giá chức năng cơ xương khớp',
        mo_ta: 'Bác sĩ kiểm tra tầm vận động, sức mạnh cơ và lập phác đồ trị liệu',
        thoi_luong_phut: 30,
        don_gia: 200000,
        loai_phong_yeu_cau: 'kham_benh',
        thu_tu_hien_thi: 1
      },
      // Category 2: Trị Liệu Bằng Tay
      {
        id: 'd2000000-0000-0000-0000-000000000001',
        danh_muc_id: 2,
        ten_dich_vu: 'Trị liệu giải phóng cơ sâu & màng cơ - Myofascial Release',
        mo_ta: 'Giải phóng căng thẳng các điểm đau kích hoạt vùng cổ vai gáy và thắt lưng',
        thoi_luong_phut: 45,
        don_gia: 350000,
        loai_phong_yeu_cau: 'phong_tri_lieu_chuan',
        thu_tu_hien_thi: 2
      },
      {
        id: 'd2000000-0000-0000-0000-000000000002',
        danh_muc_id: 2,
        ten_dich_vu: 'Di động khớp & Nắn chỉnh cột sống - Chiropractic',
        mo_ta: 'Khôi phục tầm vận động của các đốt sống khớp và cải thiện hệ thần kinh',
        thoi_luong_phut: 30,
        don_gia: 400000,
        loai_phong_yeu_cau: 'phong_tri_lieu_chuan',
        thu_tu_hien_thi: 3
      },
      // Category 3: Công nghệ cao
      {
        id: 'd3000000-0000-0000-0000-000000000001',
        danh_muc_id: 3,
        ten_dich_vu: 'Trị liệu Laser công suất cao giảm sưng viêm',
        mo_ta: 'Kích thích sinh học tế bào giúp lành thương nhanh vùng gân, dây chằng',
        thoi_luong_phut: 15,
        don_gia: 250000,
        loai_phong_yeu_cau: 'phong_tri_lieu_chuan',
        thu_tu_hien_thi: 4
      },
      {
        id: 'd3000000-0000-0000-0000-000000000002',
        danh_muc_id: 3,
        ten_dich_vu: 'Trị liệu sóng xung kích hội tụ - Focused Shockwave',
        mo_ta: 'Phá tan xơ hóa, thúc đẩy tái tạo mạch máu mới vùng gót chân, khớp gối',
        thoi_luong_phut: 20,
        don_gia: 300000,
        loai_phong_yeu_cau: 'phong_tri_lieu_chuan',
        thu_tu_hien_thi: 5
      },
      {
        id: 'd3000000-0000-0000-0000-000000000003',
        danh_muc_id: 3,
        ten_dich_vu: 'Siêu âm trị liệu sâu giải áp điểm đau cơ',
        mo_ta: 'Nhiệt sâu cơ học giúp tăng tuần hoàn cục bộ và giảm co thắt cơ',
        thoi_luong_phut: 15,
        don_gia: 200000,
        loai_phong_yeu_cau: 'phong_tri_lieu_chuan',
        thu_tu_hien_thi: 6
      },
      {
        id: 'd3000000-0000-0000-0000-000000000004',
        danh_muc_id: 3,
        ten_dich_vu: 'Kéo giãn cột sống cổ/thắt lưng giải áp đĩa đệm',
        mo_ta: 'Kéo giãn cơ học giúp gia tăng khoảng cách đốt sống và giảm chèn ép rễ thần kinh',
        thoi_luong_phut: 20,
        don_gia: 200000,
        loai_phong_yeu_cau: 'phong_tri_lieu_chuan',
        thu_tu_hien_thi: 7
      },
      // Category 4: Vận động trị liệu
      {
        id: 'd4000000-0000-0000-0000-000000000001',
        danh_muc_id: 4,
        ten_dich_vu: 'Tập vận động phục hồi chức năng chuyên biệt - Kinetic Rehab',
        mo_ta: 'Các bài tập kéo giãn cơ chủ động, củng cố sức mạnh nhóm cơ yếu dưới sự giám sát',
        thoi_luong_phut: 45,
        don_gia: 300000,
        loai_phong_yeu_cau: 'phong_tap_phcn',
        thu_tu_hien_thi: 8
      },
      {
        id: 'd4000000-0000-0000-0000-000000000002',
        danh_muc_id: 4,
        ten_dich_vu: 'Tập ổn định khớp & Phục hồi chức năng cột sống cổ vai gáy',
        mo_ta: 'Cải thiện tư thế, gia tăng sức mạnh hệ cơ lõi và cơ ổn định cột sống cổ',
        thoi_luong_phut: 45,
        don_gia: 300000,
        loai_phong_yeu_cau: 'phong_tap_phcn',
        thu_tu_hien_thi: 9
      }
    ];
 
    const serviceInsertQuery = `
      INSERT INTO dich_vu (id, danh_muc_id, ten_dich_vu, mo_ta, thoi_luong_phut, don_gia, loai_phong_yeu_cau, trang_thai, thu_tu_hien_thi)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'hoat_dong', $8)
    `;
 
    for (const s of services) {
      await client.query(serviceInsertQuery, [
        s.id,
        s.danh_muc_id,
        s.ten_dich_vu,
        s.mo_ta,
        s.thoi_luong_phut,
        s.don_gia,
        s.loai_phong_yeu_cau,
        s.thu_tu_hien_thi
      ]);
    }

    // 5. Insert professional therapy packages
    console.log("Seeding packages...");
    const packages = [
      {
        id: 'c1000000-0000-0000-0000-000000000001',
        ten_goi: 'Gói Phục Hồi Cột Sống & Đau Vai Gáy Chuyên Sâu',
        ma_goi: 'GOI-VAIGAY-BASIC',
        mo_ta: 'Liệu trình giảm co thắt, phục hồi tầm vận động vùng vai gáy và giải chèn ép rễ thần kinh cánh tay.',
        tong_so_buoi: 8,
        gia_goi: 3200000,
        gia_goc: 4000000,
        han_dung_thang: 6,
        danh_muc_id: 5,
        loai_goi: 'lieu_trinh'
      },
      {
        id: 'c1000000-0000-0000-0000-000000000002',
        ten_goi: 'Gói Trị Liệu Thoát Vị Đĩa Đệm Giải Áp Cột Sống Thắt Lưng',
        ma_goi: 'GOI-DIA-DEM',
        mo_ta: 'Phác đồ kết hợp di động cột sống bằng tay, máy kéo giãn áp lực âm và tập ổn định nhóm cơ lõi cốt lõi.',
        tong_so_buoi: 10,
        gia_goi: 4500000,
        gia_goc: 5500000,
        han_dung_thang: 6,
        danh_muc_id: 5,
        loai_goi: 'lieu_trinh'
      },
      {
        id: 'c1000000-0000-0000-0000-000000000003',
        ten_goi: 'Gói Phục Hồi Chấn Thương Thể Thao & Viêm Gân Cấp',
        ma_goi: 'GOI-THE-THAO',
        mo_ta: 'Tập trung trị liệu giảm đau nhanh bằng laser công suất cao kết hợp sóng xung kích hội tụ và PHCN khớp gối/cổ chân.',
        tong_so_buoi: 12,
        gia_goi: 5400000,
        gia_goc: 6600000,
        han_dung_thang: 6,
        danh_muc_id: 6,
        loai_goi: 'lieu_trinh'
      }
    ];

    const packageInsertQuery = `
      INSERT INTO goi_dich_vu (id, ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, danh_muc_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'hoat_dong', $9)
    `;

    for (const p of packages) {
      await client.query(packageInsertQuery, [
        p.id,
        p.ten_goi,
        p.ma_goi,
        p.mo_ta,
        p.tong_so_buoi,
        p.gia_goi,
        p.gia_goc,
        p.han_dung_thang,
        p.danh_muc_id
      ]);
    }

    // 6. Seed package details (goi_dich_vu_chi_tiet)
    console.log("Seeding package details...");
    const packageDetails = [
      // Gói Vai Gáy (8 buổi)
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000001', dich_vu_id: 'd2000000-0000-0000-0000-000000000001', thu_tu: 1 },
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000001', dich_vu_id: 'd3000000-0000-0000-0000-000000000003', thu_tu: 2 },
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000001', dich_vu_id: 'd4000000-0000-0000-0000-000000000002', thu_tu: 3 },

      // Gói Đĩa Đệm (10 buổi)
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000002', dich_vu_id: 'd2000000-0000-0000-0000-000000000002', thu_tu: 1 },
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000002', dich_vu_id: 'd3000000-0000-0000-0000-000000000004', thu_tu: 2 },
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000002', dich_vu_id: 'd4000000-0000-0000-0000-000000000001', thu_tu: 3 },

      // Gói Chấn thương Thể Thao (12 buổi)
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000003', dich_vu_id: 'd3000000-0000-0000-0000-000000000001', thu_tu: 1 },
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000003', dich_vu_id: 'd3000000-0000-0000-0000-000000000002', thu_tu: 2 },
      { goi_dich_vu_id: 'c1000000-0000-0000-0000-000000000003', dich_vu_id: 'd4000000-0000-0000-0000-000000000001', thu_tu: 3 }
    ];

    const packageDetailInsertQuery = `
      INSERT INTO goi_dich_vu_chi_tiet (goi_dich_vu_id, dich_vu_id, thu_tu_thuc_hien)
      VALUES ($1, $2, $3)
    `;

    for (const d of packageDetails) {
      await client.query(packageDetailInsertQuery, [
        d.goi_dich_vu_id,
        d.dich_vu_id,
        d.thu_tu
      ]);
    }

    // 7. Seed active shifts for ALL Doctors and KTVs for the next 14 days (2 weeks calendar)
    console.log("Seeding calendar shifts for the next 14 days...");
    const nextDays = Array.from({ length: 15 }, (_, idx) => idx); // 0 to 14 days ahead
    
    // Doctor list
    const doctors = [
      { id: '00000000-0000-0000-0000-000000000005', room_id: 1 }, // Dr. Khoa -> P101
      { id: '00000000-0000-0000-0000-000000000006', room_id: 2 }  // Dr. Lan Anh -> P102
    ];

    // KTV list
    const ktvs = [
      { id: '00000000-0000-0000-0000-000000000007', room_id: 7, bed: 1 }, // KTV Tùng -> Manual therapy P401, Bed 1
      { id: '00000000-0000-0000-0000-000000000008', room_id: 4, bed: 1 }, // KTV Bích -> Electrotherapy P301, Bed 1
      { id: '00000000-0000-0000-0000-000000000009', room_id: 5, bed: 1 }, // KTV Minh -> Spinal Decompression P302, Bed 1
      { id: '00000000-0000-0000-0000-000000000010', room_id: 3, bed: 1 }  // KTV Thanh -> Active rehab P201, Bed 1
    ];

    const shiftInsertQuery = `
      INSERT INTO lich_lam_viec (id, nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id, giuong_so)
      VALUES (gen_random_uuid(), $1, CURRENT_DATE + $2::integer, $3, $4, 'hoat_dong', $5, $6)
    `;

    for (const offset of nextDays) {
      // Seed Doctor shifts (08:00 - 17:00)
      for (const doc of doctors) {
        await client.query(shiftInsertQuery, [
          doc.id,
          offset,
          '08:00',
          '17:00',
          doc.room_id,
          null
        ]);
      }

      // Seed KTV shifts (08:00 - 17:00)
      for (const ktv of ktvs) {
        await client.query(shiftInsertQuery, [
          ktv.id,
          offset,
          '08:00',
          '17:00',
          ktv.room_id,
          ktv.bed
        ]);
      }
    }

    // Seeding medical devices (required for booking validations)
    console.log("Seeding medical devices...");
    const devices = [
      { code: 'EQP-GONIO', name: 'Thước đo khớp cơ học', danh_muc_id: null },
      { code: 'EQP-HAMMER', name: 'Búa phản xạ thần kinh Taylor', danh_muc_id: null },
      { code: 'EQP-BED01', name: 'Giường trị liệu bằng tay cao cấp 01', danh_muc_id: 85 },
      { code: 'EQP-BED02', name: 'Giường trị liệu bằng tay cao cấp 02', danh_muc_id: 85 },
      { code: 'EQP-CHIRO', name: 'Giường nắn chỉnh xương khớp chuyên dụng Chiro-Max', danh_muc_id: 85 },
      { code: 'EQP-LASER', name: 'Máy Laser công suất cao BTL-6000 20W', danh_muc_id: 97 },
      { code: 'EQP-SHOCK', name: 'Máy sóng xung kích Shockwave BTL-6000', danh_muc_id: 83 },
      { code: 'EQP-ULTRA', name: 'Máy siêu âm điều trị đa tần BTL-4710', danh_muc_id: 81 },
      { code: 'EQP-TRITON', name: 'Máy kéo giãn cột sống tự động Triton DTS', danh_muc_id: 90 },
      { code: 'EQP-MAT', name: 'Thảm tập Kinetic Rehab', danh_muc_id: null },
      { code: 'EQP-BAND', name: 'Dây kháng lực Theraband', danh_muc_id: null },
      { code: 'EQP-YOGA', name: 'Bóng yoga tròn', danh_muc_id: null },
      { code: 'EQP-BALL', name: 'Bóng tập giữ thăng bằng', danh_muc_id: null },
      { code: 'EQP-STICK', name: 'Gậy gỗ tập vận động khớp vai', danh_muc_id: null },
      { code: 'EQP-MULTI', name: 'Máy tập đa năng phục hồi chức năng', danh_muc_id: null }
    ];

    const deviceQuery = `
      INSERT INTO thiet_bi_y_te (ma_thiet_bi, ten_thiet_bi, trang_thai, ghi_chu, danh_muc_thiet_bi_id)
      VALUES ($1, $2, 'san_sang', 'Dữ liệu được seed tự động.', $3)
    `;

    for (const d of devices) {
      await client.query(deviceQuery, [d.code, d.name, d.danh_muc_id]);
    }

    await client.query('COMMIT');
    console.log("🎉 Seeding completed successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Seeding failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPTClinic();

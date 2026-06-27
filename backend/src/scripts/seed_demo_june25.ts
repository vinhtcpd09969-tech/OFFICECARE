import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

async function seedDemoJune25() {
  console.log("=== SEEDING DEMO APPOINTMENTS FOR 2026-06-25 ===");
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Delete existing appointments for June 25, 2026
    console.log("Deleting existing appointments for 2026-06-25...");
    await client.query(`
      DELETE FROM lich_dat 
      WHERE ngay_gio_bat_dau >= '2026-06-25T00:00:00+07:00' 
        AND ngay_gio_bat_dau <= '2026-06-25T23:59:59+07:00'
    `);

    // 2. Insert demo appointments
    console.log("Inserting demo appointments...");

    const appointments = [
      // 1. Chờ xác nhận - Khóa chọn bác sĩ
      {
        id: '60000000-0000-0000-0000-000000000001',
        ma_lich_dat: 'LH-DEMO-01',
        khach_hang_id: '10000000-0000-0000-0000-000000000011',
        ho_ten_khach: 'Nguyễn Văn Hùng',
        so_dien_thoai: '0901112223',
        gioi_tinh_khach: 'nam',
        dich_vu_id: 'd1000000-0000-0000-0000-000000000001',
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: '2026-06-25T08:00:00+07:00',
        ngay_gio_ket_thuc: '2026-06-25T08:30:00+07:00',
        ly_do_kham: 'Đau cột sống thắt lưng ê ẩm',
        trang_thai: 'chua_xac_nhan',
        ly_do_huy: null,
        thoi_gian_tao: '2026-06-24T22:00:00+07:00',
        han_xac_nhan: '2026-06-25T08:00:00+07:00'
      },
      // 2. Chờ phân bổ (đã gọi xác nhận) - Mở khóa chọn bác sĩ
      {
        id: '60000000-0000-0000-0000-000000000002',
        ma_lich_dat: 'LH-DEMO-02',
        khach_hang_id: '10000000-0000-0000-0000-000000000012',
        ho_ten_khach: 'Trần Minh Quân',
        so_dien_thoai: '0903334445',
        gioi_tinh_khach: 'nam',
        dich_vu_id: 'd1000000-0000-0000-0000-000000000001',
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: '2026-06-25T09:00:00+07:00',
        ngay_gio_ket_thuc: '2026-06-25T09:30:00+07:00',
        ly_do_kham: 'Khám tầm soát vẹo cột sống cổ',
        trang_thai: 'cho_xac_nhan',
        ly_do_huy: null,
        thoi_gian_tao: '2026-06-24T21:00:00+07:00',
        han_xac_nhan: null
      },
      // 3. Đã xác nhận (đã gán BS & Phòng)
      {
        id: '60000000-0000-0000-0000-000000000003',
        ma_lich_dat: 'LH-DEMO-03',
        khach_hang_id: '10000000-0000-0000-0000-000000000013',
        ho_ten_khach: 'Lê Thị Thảo',
        so_dien_thoai: '0902223334',
        gioi_tinh_khach: 'nu',
        dich_vu_id: 'd2000000-0000-0000-0000-000000000001',
        bac_si_id: '20000000-0000-0000-0000-000000000006', // BS Lan Anh
        phong_id: 2, // P102
        ngay_gio_bat_dau: '2026-06-25T10:00:00+07:00',
        ngay_gio_ket_thuc: '2026-06-25T10:30:00+07:00',
        ly_do_kham: 'Đau mỏi bả vai lan xuống cánh tay',
        trang_thai: 'da_xac_nhan',
        ly_do_huy: null,
        thoi_gian_tao: '2026-06-24T18:00:00+07:00',
        han_xac_nhan: null
      },
      // 4. Đã Check-in (Khách đã đến)
      {
        id: '60000000-0000-0000-0000-000000000004',
        ma_lich_dat: 'LH-DEMO-04',
        khach_hang_id: '10000000-0000-0000-0000-000000000014',
        ho_ten_khach: 'Phạm Hồng Nhung',
        so_dien_thoai: '0904445556',
        gioi_tinh_khach: 'nu',
        dich_vu_id: 'd1000000-0000-0000-0000-000000000001',
        bac_si_id: '20000000-0000-0000-0000-000000000005', // BS Khoa
        phong_id: 1, // P101
        ngay_gio_bat_dau: '2026-06-25T11:00:00+07:00',
        ngay_gio_ket_thuc: '2026-06-25T11:30:00+07:00',
        ly_do_kham: 'Khám tầm vận động sau chấn thương đầu gối',
        trang_thai: 'da_checkin',
        ly_do_huy: null,
        thoi_gian_tao: '2026-06-24T15:00:00+07:00',
        han_xac_nhan: null
      },
      // 5. Đang khám (Bác sĩ bắt đầu khám)
      {
        id: '60000000-0000-0000-0000-000000000005',
        ma_lich_dat: 'LH-DEMO-05',
        khach_hang_id: '10000000-0000-0000-0000-000000000015',
        ho_ten_khach: 'Đỗ Quốc Đạt',
        so_dien_thoai: '0905556667',
        gioi_tinh_khach: 'nam',
        dich_vu_id: 'd2000000-0000-0000-0000-000000000001',
        bac_si_id: '20000000-0000-0000-0000-000000000005', // BS Khoa
        phong_id: 1, // P101
        ngay_gio_bat_dau: '2026-06-25T14:00:00+07:00',
        ngay_gio_ket_thuc: '2026-06-25T14:30:00+07:00',
        ly_do_kham: 'Giải phóng điểm đau kích hoạt vùng thắt lưng',
        trang_thai: 'dang_kham',
        ly_do_huy: null,
        thoi_gian_tao: '2026-06-24T14:00:00+07:00',
        han_xac_nhan: null
      },
      // 6. Hoàn thành
      {
        id: '60000000-0000-0000-0000-000000000006',
        ma_lich_dat: 'LH-DEMO-06',
        khach_hang_id: '10000000-0000-0000-0000-000000000011',
        ho_ten_khach: 'Phan Thanh Sơn',
        so_dien_thoai: '0907778889',
        gioi_tinh_khach: 'nam',
        dich_vu_id: 'd1000000-0000-0000-0000-000000000001',
        bac_si_id: '20000000-0000-0000-0000-000000000006', // BS Lan Anh
        phong_id: 2, // P102
        ngay_gio_bat_dau: '2026-06-25T15:00:00+07:00',
        ngay_gio_ket_thuc: '2026-06-25T15:30:00+07:00',
        ly_do_kham: 'Khám phục hồi chức năng thắt lưng',
        trang_thai: 'hoan_thanh',
        ly_do_huy: null,
        thoi_gian_tao: '2026-06-24T09:00:00+07:00',
        han_xac_nhan: null
      },
      // 7. Đã hủy
      {
        id: '60000000-0000-0000-0000-000000000007',
        ma_lich_dat: 'LH-DEMO-07',
        khach_hang_id: '10000000-0000-0000-0000-000000000012',
        ho_ten_khach: 'Ngô Hoàng Nam',
        so_dien_thoai: '0906667778',
        gioi_tinh_khach: 'nam',
        dich_vu_id: 'd1000000-0000-0000-0000-000000000001',
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: '2026-06-25T16:00:00+07:00',
        ngay_gio_ket_thuc: '2026-06-25T16:30:00+07:00',
        ly_do_kham: 'Đau vai gáy cấp tính',
        trang_thai: 'da_huy',
        ly_do_huy: 'Khách báo bận đi công tác đột xuất',
        thoi_gian_tao: '2026-06-24T08:00:00+07:00',
        han_xac_nhan: null
      }
    ];

    const insertQuery = `
      INSERT INTO lich_dat (
        id, ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, 
        dich_vu_id, bac_si_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, 
        ly_do_kham, trang_thai, ly_do_huy, nguoi_tao, thoi_gian_tao, han_xac_nhan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'he_thong', $15, $16)
    `;

    for (const apt of appointments) {
      await client.query(insertQuery, [
        apt.id,
        apt.ma_lich_dat,
        apt.khach_hang_id,
        apt.ho_ten_khach,
        apt.so_dien_thoai,
        apt.gioi_tinh_khach,
        apt.dich_vu_id,
        apt.bac_si_id,
        apt.phong_id,
        apt.ngay_gio_bat_dau,
        apt.ngay_gio_ket_thuc,
        apt.ly_do_kham,
        apt.trang_thai,
        apt.ly_do_huy,
        apt.thoi_gian_tao,
        apt.han_xac_nhan
      ]);
    }

    await client.query('COMMIT');
    console.log("🎉 Seeding demo appointments for June 25, 2026 completed successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Seeding failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoJune25();

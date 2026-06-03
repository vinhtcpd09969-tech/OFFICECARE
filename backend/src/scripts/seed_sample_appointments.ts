import { pool } from '../config/db';

async function seedSampleAppointments() {
  console.log('--- START SEEDING SAMPLE APPOINTMENTS ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Dọn dẹp bảng lịch đặt cũ để tránh rác dữ liệu
    console.log('Cleaning old appointments...');
    await client.query('DELETE FROM lich_dat');

    // 2. Lấy ID dịch vụ Khám lâm sàng
    let { rows: services } = await client.query("SELECT id, ten_dich_vu FROM dich_vu WHERE ten_dich_vu LIKE '%Khám%' OR ten_dich_vu LIKE '%khám%' LIMIT 1");
    if (services.length === 0) {
      const res = await client.query('SELECT id, ten_dich_vu FROM dich_vu LIMIT 1');
      services = res.rows;
    }
    if (services.length === 0) {
      throw new Error('No services found in database to seed appointments.');
    }
    const serviceId = services[0].id;
    console.log(`Using service for demo: ${services[0].ten_dich_vu}`);

    // 3. Lấy danh sách bác sĩ (vai_tro_id = 4)
    const { rows: doctors } = await client.query(`
      SELECT nd.id, nd.ho_ten, cgyt.id as doctor_specialist_id
      FROM nguoi_dung nd
      JOIN chuyen_gia_y_te cgyt ON nd.id = cgyt.nguoi_dung_id
      WHERE nd.vai_tro_id = 4 AND nd.trang_thai = 'hoat_dong'
      LIMIT 2
    `);
    
    if (doctors.length === 0) {
      throw new Error('No active doctors found in database.');
    }
    const doctor1 = doctors[0].doctor_specialist_id;
    const doctor2 = doctors[1] ? doctors[1].doctor_specialist_id : doctor1;
    console.log(`Using doctors for demo: ${doctors[0].ho_ten} (${doctor1}) ${doctors[1] ? 'and ' + doctors[1].ho_ten + ' (' + doctor2 + ')' : ''}`);

    // 4. Lấy danh sách phòng khám
    const { rows: rooms } = await client.query('SELECT id, ten_phong FROM phong LIMIT 2');
    const roomId1 = rooms[0] ? rooms[0].id : 1;
    const roomId2 = rooms[1] ? rooms[1].id : roomId1;

    // 5. Khách hàng mẫu (lấy từ bảng khach_hang kèm thông tin họ tên từ nguoi_dung)
    const { rows: customers } = await client.query(`
      SELECT kh.id, nd.ho_ten, nd.so_dien_thoai
      FROM khach_hang kh
      JOIN nguoi_dung nd ON kh.nguoi_dung_id = nd.id
      LIMIT 10
    `);
    const getCust = (idx: number) => customers[idx] ? customers[idx] : null;

    // Định nghĩa danh sách các ca trực mẫu ngày hôm nay 30/05/2026 từ 14:00 trở đi
    const today = '2026-05-30';
    const appointmentsData = [
      {
        ma_lich_dat: 'LK-1400A',
        ho_ten_khach: 'Nguyễn Văn Anh',
        so_dien_thoai: '0901234567',
        gioi_tinh_khach: 'nam',
        dich_vu_id: serviceId,
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: `${today}T07:00:00.000Z`, // 14:00 VN
        ngay_gio_ket_thuc: `${today}T07:30:00.000Z`,
        trang_thai: 'cho_xac_nhan',
        ly_do_kham: 'Đau mỏi vai gáy cấp tính sau khi ngủ dậy'
      },
      {
        ma_lich_dat: 'LK-1430B',
        ho_ten_khach: 'Trần Thị Bình',
        so_dien_thoai: '0912345678',
        gioi_tinh_khach: 'nu',
        dich_vu_id: serviceId,
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: `${today}T07:30:00.000Z`, // 14:30 VN
        ngay_gio_ket_thuc: `${today}T08:00:00.000Z`,
        trang_thai: 'cho_xac_nhan',
        ly_do_kham: 'Khám lại khớp gối'
      },
      {
        ma_lich_dat: 'LK-1500C',
        ho_ten_khach: 'Lê Hoàng Cường',
        so_dien_thoai: '0923456789',
        gioi_tinh_khach: 'nam',
        dich_vu_id: serviceId,
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: `${today}T08:00:00.000Z`, // 15:00 VN
        ngay_gio_ket_thuc: `${today}T08:30:00.000Z`,
        trang_thai: 'cho_xac_nhan',
        ly_do_kham: 'Tê bì ngón tay kéo dài'
      },
      {
        ma_lich_dat: 'LK-1530D',
        ho_ten_khach: 'Phạm Hồng Dung',
        so_dien_thoai: '0934567890',
        gioi_tinh_khach: 'nu',
        dich_vu_id: serviceId,
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: `${today}T08:30:00.000Z`, // 15:30 VN
        ngay_gio_ket_thuc: `${today}T09:00:00.000Z`,
        trang_thai: 'cho_xac_nhan',
        ly_do_kham: 'Khám thoái hóa đốt sống cổ'
      },
      {
        ma_lich_dat: 'LK-1700E',
        ho_ten_khach: 'Hoàng Văn Em',
        so_dien_thoai: '0945678901',
        gioi_tinh_khach: 'nam',
        dich_vu_id: serviceId,
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: `${today}T10:00:00.000Z`, // 17:00 VN
        ngay_gio_ket_thuc: `${today}T10:30:00.000Z`,
        trang_thai: 'cho_xac_nhan',
        ly_do_kham: 'Trật khớp cổ chân do chơi thể thao'
      },
      {
        ma_lich_dat: 'LK-1800F',
        ho_ten_khach: 'Đỗ Thị Giang',
        so_dien_thoai: '0956789012',
        gioi_tinh_khach: 'nu',
        dich_vu_id: serviceId,
        bac_si_id: null,
        phong_id: null,
        ngay_gio_bat_dau: `${today}T11:00:00.000Z`, // 18:00 VN
        ngay_gio_ket_thuc: `${today}T11:30:00.000Z`,
        trang_thai: 'cho_xac_nhan',
        ly_do_kham: 'Đau mỏi cột sống thắt lưng lưng'
      }
    ];

    for (let i = 0; i < appointmentsData.length; i++) {
      const data = appointmentsData[i];
      const customer = getCust(i);
      const khId = customer ? customer.id : null;
      const hoTenKhach = customer ? customer.ho_ten : data.ho_ten_khach;
      const soDienThoai = customer ? customer.so_dien_thoai : data.so_dien_thoai;

      await client.query(`
        INSERT INTO lich_dat (
          ma_lich_dat, khach_hang_id, ho_ten_khach, so_dien_thoai, gioi_tinh_khach, 
          dich_vu_id, bac_si_id, phong_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, 
          trang_thai, ly_do_kham, nguoi_tao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'le_tan')
      `, [
        data.ma_lich_dat,
        khId,
        hoTenKhach,
        soDienThoai,
        data.gioi_tinh_khach,
        data.dich_vu_id,
        data.bac_si_id,
        data.phong_id,
        data.ngay_gio_bat_dau,
        data.ngay_gio_ket_thuc,
        data.trang_thai,
        data.ly_do_kham
      ]);
    }

    await client.query('COMMIT');
    console.log(`--- SEED SUCCESS: Generated ${appointmentsData.length} sample appointments for today! ---`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding sample appointments:', error);
  } finally {
    client.release();
  }
}

seedSampleAppointments().then(() => process.exit(0));

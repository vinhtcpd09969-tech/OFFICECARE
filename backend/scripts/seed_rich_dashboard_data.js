const { Pool } = require('pg');
const { randomUUID: uuidv4 } = require('crypto');
require('dotenv').config({ path: 'd:\\VLTT\\VLTT\\backend\\.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedRichData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚀 Starting Rich Dashboard Data Seeding...');

    // 1. Fetch staff
    const staffRes = await client.query(`
      SELECT id, ho_ten, vai_tro_id 
      FROM nguoi_dung 
      WHERE trang_thai = 'hoat_dong' AND vai_tro_id IN (2, 3)
    `);
    const doctors = staffRes.rows.filter(s => s.vai_tro_id === 2);
    const technicians = staffRes.rows.filter(s => s.vai_tro_id === 3);
    const allStaff = [...doctors, ...technicians];

    if (allStaff.length === 0) {
      console.log('⚠️ No active doctors or technicians found!');
      return;
    }
    console.log(`👨‍⚕️ Found ${doctors.length} Doctors and ${technicians.length} Technicians.`);

    // 2. Fetch or seed Khách hàng (Customers)
    let custRes = await client.query(`SELECT id, ho_ten, email, so_dien_thoai FROM khach_hang`);
    let customers = custRes.rows;

    const newCustomersData = [
      { name: 'Nguyễn Văn Minh', email: 'minh.nguyen2026@gmail.com', phone: '0912345678', gender: 'nam', birth: '1985-04-12', address: '123 Nguyễn Trãi, Q.5, TP.HCM' },
      { name: 'Trần Thị Thanh Hằng', email: 'thanhhang.tran@gmail.com', phone: '0987654321', gender: 'nu', birth: '1990-08-20', address: '45 Lê Văn Sỹ, Q.3, TP.HCM' },
      { name: 'Phạm Quốc Bảo', email: 'quocbao.pham@gmail.com', phone: '0903112233', gender: 'nam', birth: '1978-11-05', address: '88 Nguyễn Thị Minh Khai, Q.1, TP.HCM' },
      { name: 'Lê Hoàng Yến', email: 'hoangyen.le@gmail.com', phone: '0938889900', gender: 'nu', birth: '1993-01-15', address: '12 Trần Hưng Đạo, Q.1, TP.HCM' },
      { name: 'Vũ Đức Thành', email: 'ducthanh.vu@gmail.com', phone: '0977665544', gender: 'nam', birth: '1982-06-30', address: '56 Hoàng Văn Thụ, Q.Phú Nhuận, TP.HCM' },
      { name: 'Đặng Ngọc Anh', email: 'ngocanh.dang@gmail.com', phone: '0918223344', gender: 'nu', birth: '1995-12-10', address: '102 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM' },
      { name: 'Bùi Anh Tuấn', email: 'anhtuan.bui@gmail.com', phone: '0909556677', gender: 'nam', birth: '1988-09-25', address: '34 Võ Văn Tần, Q.3, TP.HCM' },
      { name: 'Hoàng Mỹ Duyên', email: 'myduyen.hoang@gmail.com', phone: '0944112233', gender: 'nu', birth: '1991-03-18', address: '78 CMT8, Q.10, TP.HCM' },
      { name: 'Đỗ Tiến Dũng', email: 'tiendung.do@gmail.com', phone: '0933778899', gender: 'nam', birth: '1975-07-08', address: '220 Cộng Hòa, Q.Tân Bình, TP.HCM' },
      { name: 'Trịnh Khánh Linh', email: 'khanhlinh.trinh@gmail.com', phone: '0966445566', gender: 'nu', birth: '1998-02-28', address: '15 Nguyễn Đình Chiểu, Q.1, TP.HCM' }
    ];

    for (const c of newCustomersData) {
      const exist = customers.find(x => x.email === c.email);
      if (!exist) {
        const id = uuidv4();
        await client.query(`
          INSERT INTO khach_hang (id, ho_ten, email, mat_khau_hash, so_dien_thoai, gioi_tinh, ngay_sinh, dia_chi, trang_thai, diem_uy_tin, ngay_dong_y_dieu_khoan)
          VALUES ($1, $2, $3, '$2b$10$xyz', $4, $5, $6, $7, 'hoat_dong', 100, NOW() - INTERVAL '60 days')
        `, [id, c.name, c.email, c.phone, c.gender, c.birth, c.address]);
        customers.push({ id, ho_ten: c.name, email: c.email, so_dien_thoai: c.phone });
      }
    }
    console.log(`👥 Total customers ready: ${customers.length}`);

    // 3. Fetch Packages and Rooms
    const pkgRes = await client.query(`SELECT id, ten_goi, don_gia, loai_goi FROM goi_dich_vu WHERE trang_thai = 'dang_hoat_dong' OR trang_thai IS NULL OR trang_thai = 'hoat_dong'`);
    const packages = pkgRes.rows;
    console.log(`📦 Found ${packages.length} active packages.`);

    const roomRes = await client.query(`SELECT id FROM phong_lam_viec`);
    const rooms = roomRes.rows.map(r => r.id);
    console.log(`🚪 Found ${rooms.length} rooms in clinic.`);

    // 4. Seed Phác đồ điều trị (Treatment Plans)
    console.log('🌱 Seeding Phác đồ điều trị...');
    const treatmentPlans = [];
    for (let i = 0; i < 15; i++) {
      const cust = customers[i % customers.length];
      const pkg = packages[i % packages.length] || packages[0];
      const planId = uuidv4();
      const status = i % 5 === 0 ? 'hoan_thanh' : 'dang_dieu_tri';
      const totalSessions = pkg ? (pkg.tong_so_buoi || 10) : 10;
      const usedSessions = status === 'hoan_thanh' ? totalSessions : Math.floor(Math.random() * (totalSessions - 1)) + 1;
      
      await client.query(`
        INSERT INTO phac_do_dieu_tri (id, khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat, han_su_dung)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE - ($7 || ' days')::interval, CURRENT_DATE + ($8 || ' days')::interval)
        ON CONFLICT DO NOTHING
      `, [planId, cust.id, pkg ? pkg.id : null, totalSessions, usedSessions, status, (Math.floor(Math.random() * 40) + 10).toString(), (Math.floor(Math.random() * 60) + 30).toString()]);
      
      treatmentPlans.push({ id: planId, khach_hang_id: cust.id, goi_dich_vu_id: pkg ? pkg.id : null, totalSessions, usedSessions });
    }

    // 5. Seed Cuộc Hẹn (Appointments across May, June, July 2026)
    console.log('📅 Seeding 70+ Cuộc hẹn...');
    const appointmentStatuses = ['hoan_thanh', 'hoan_thanh', 'hoan_thanh', 'da_xac_nhan', 'cho_xac_nhan', 'dang_kham', 'dang_dieu_tri', 'huy'];
    const types = ['KHAM', 'DIEU_TRI_THEO_GOI', 'DICH_VU_LE'];
    const notes = [
      'Bệnh nhân đau mỏi cổ vai gáy kéo dài 2 tuần, tê lan xuống cánh tay.',
      'Khám thoái hóa cột sống thắt lưng L4-L5, vắt lưng khó khăn.',
      'Tập phục hồi chức năng sau mổ tái tạo dây chằng chéo trước gối.',
      'Trị liệu đau khớp gối cơ năng, sưng nhẹ sau khi chơi thể thao.',
      'Khám cong vẹo cột sống thắt lưng tư thế ngồi máy tính nhiều.',
      'Trị liệu giải thắt cơ thang và cơ bả vai bằng sóng xung kích.',
      'Tái khám định kỳ tiến triển phục hồi phác đồ điều trị 10 buổi.'
    ];

    const seededAptIds = [];

    // Historical appointments (past 60 days)
    for (let dayOffset = 60; dayOffset >= 0; dayOffset--) {
      // 1-3 appointments per day
      const dailyCount = (dayOffset === 0) ? 5 : (Math.floor(Math.random() * 3) + 1);
      
      for (let k = 0; k < dailyCount; k++) {
        const aptId = uuidv4();
        const cust = customers[(dayOffset + k) % customers.length];
        const staff = allStaff[(dayOffset + k) % allStaff.length];
        const pkg = packages[(dayOffset + k) % packages.length];
        const plan = treatmentPlans.find(p => p.khach_hang_id === cust.id);

        const type = plan ? 'DIEU_TRI_THEO_GOI' : types[k % types.length];
        let status = 'hoan_thanh';
        if (dayOffset === 0) {
          // Today's appointments
          status = k === 0 ? 'dang_kham' : (k === 1 ? 'dang_dieu_tri' : (k === 2 ? 'cho_xac_nhan' : 'da_xac_nhan'));
        } else if (dayOffset <= 3 && k % 4 === 0) {
          status = 'huy';
        }

        const hour = 8 + (k * 2) + Math.floor(Math.random() * 2);
        const startTime = new Date(Date.now() - dayOffset * 86400000);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(startTime.getTime() + 45 * 60000);

        const checkinTime = status === 'hoan_thanh' || status === 'dang_kham' || status === 'dang_dieu_tri' ? new Date(startTime.getTime() - 10 * 60000) : null;
        const completeTime = status === 'hoan_thanh' ? endTime : null;

        await client.query(`
          INSERT INTO cuoc_hen (
            id, khach_hang_id, nhan_su_id, goi_dich_vu_id, phac_do_dieu_tri_id, 
            so_thu_tu_buoi, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai, 
            ghi_chu_khach_hang, phong_id, ghi_chu_noi_bo, thoi_gian_checkin, thoi_gian_hoan_thanh, thoi_gian_tao
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $7::timestamptz - INTERVAL '2 days')
          ON CONFLICT DO NOTHING
        `, [
          aptId, cust.id, staff.id, pkg ? pkg.id : null, plan ? plan.id : null,
          plan ? Math.floor(Math.random() * 8) + 1 : null,
          startTime, endTime, type, status,
          notes[k % notes.length], rooms.length > 0 ? rooms[k % rooms.length] : null, 'Hồ sơ khám đầy đủ, bệnh nhân tiến triển tốt.',
          checkinTime, completeTime
        ]);

        if (status === 'hoan_thanh') {
          seededAptIds.push({ id: aptId, custId: cust.id, staffId: staff.id, pkgId: pkg ? pkg.id : null, date: startTime });
        }
      }
    }

    // 6. Seed Hóa đơn & Giao dịch thanh toán (Invoices & Payments)
    console.log('💳 Seeding Hóa đơn & Giao dịch thanh toán...');
    for (let i = 0; i < seededAptIds.length; i++) {
      const apt = seededAptIds[i];
      const invId = uuidv4();
      const payId = uuidv4();
      const pkg = packages.find(p => p.id === apt.pkgId);

      const basePrice = pkg ? BigInt(pkg.don_gia || 2500000) : BigInt(350000 + (i % 5) * 150000);
      const discount = i % 4 === 0 ? BigInt(100000) : BigInt(0);
      const finalPrice = basePrice - discount;

      await client.query(`
        INSERT INTO hoa_don (id, khach_hang_id, cuoc_hen_id, tong_tien_goc, ti_le_giam_gia_goi, so_tien_giam_voucher, tong_tien_phai_tra, so_tien_da_tra, trang_thai, ghi_chu, ngay_tao)
        VALUES ($1, $2, $3, $4, 0, $5, $6, $6, 'da_thanh_toan', 'Thanh toán hoàn tất dịch vụ phòng khám', $7)
        ON CONFLICT DO NOTHING
      `, [invId, apt.custId, apt.id, basePrice.toString(), discount.toString(), finalPrice.toString(), apt.date]);

      const payMethods = ['MOMO', 'CHUYEN_KHOAN', 'TIEN_MAT', 'VNPAY'];
      await client.query(`
        INSERT INTO giao_dich_thanh_toan (id, hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich, chi_tiet)
        VALUES ($1, $2, $3, 'THANH_TOAN', $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [
        payId, invId, finalPrice.toString(), payMethods[i % payMethods.length],
        `TXN_${Date.now()}_${i}`, allStaff[i % allStaff.length].id, apt.date,
        JSON.stringify({ note: 'Thanh toán tự động hệ thống PhysioFlow', status: 'SUCCESS' })
      ]);
    }

    // 7. Seed Đánh giá nhân sự & Đánh giá gói dịch vụ (Staff & Package Reviews)
    console.log('⭐ Seeding Đánh giá nhân sự & Gói dịch vụ...');
    const staffReviewComments = [
      { stars: 5, text: 'Bác sĩ thăm khám rất tận tâm, giải thích phác đồ chi tiết rõ ràng. Cảm giác vai gáy đỡ đau hẳn sau buổi đầu!', sentiment: 'TÍCH CỰC' },
      { stars: 5, text: 'Kỹ thuật viên nắn chỉnh cơ rất mát tay, nhẹ nhàng mà đúng điểm đau. Phòng khám sạch sẽ, sang trọng!', sentiment: 'TÍCH CỰC' },
      { stars: 5, text: 'Tay nghề chuyên gia rất cao, máy xung kích chiếu sóng tác dụng cực nhanh. Đã giới thiệu người nhà đến!', sentiment: 'TÍCH CỰC' },
      { stars: 4, text: 'Dịch vụ chu đáo, bác sĩ nhiệt tình. Sẽ tiếp tục theo hết phác đồ 10 buổi.', sentiment: 'TÍCH CỰC' },
      { stars: 5, text: 'Thái độ phục vụ tuyệt vời! Lễ tân đón tiếp chu đáo, bác sĩ chuyên môn vững vàng làm tôi rất yên tâm.', sentiment: 'TÍCH CỰC' },
      { stars: 5, text: 'Liệu trình giảm đau gối rất hiệu quả, sau 3 buổi đã có thể đi lại nhẹ nhàng không bị nhói.', sentiment: 'TÍCH CỰC' }
    ];

    const packageReviewComments = [
      { stars: 5, text: 'Gói trị liệu Cột sống Pro Max rất đáng tiền! Hết hẳn tình trạng đau lưng vắt khi ngồi làm việc lâu.', sentiment: 'TÍCH CỰC' },
      { stars: 5, text: 'Gói Phục hồi Vai Gáy Chuyên Sâu tác dụng vượt mong đợi. Thiết bị hiện đại chuẩn quốc tế.', sentiment: 'TÍCH CỰC' },
      { stars: 4, text: 'Liệu trình khớp gối thiết kế hợp lý, các bài tập về nhà bác sĩ hướng dẫn rất chi tiết.', sentiment: 'TÍCH CỰC' },
      { stars: 5, text: 'Rất hài lòng với liệu trình 10 buổi. Lưng đỡ mỏi 90%, tư thế ngồi cải thiện rõ rệt.', sentiment: 'TÍCH CỰC' }
    ];

    for (let i = 0; i < Math.min(seededAptIds.length, 25); i++) {
      const apt = seededAptIds[i];
      const sRev = staffReviewComments[i % staffReviewComments.length];

      // Staff Review
      await client.query(`
        INSERT INTO danh_gia (
          id, loai_danh_gia, khach_hang_id, nhan_su_id, cuoc_hen_id, so_sao, nhan_xet, ngay_tao,
          ngay_phan_hoi, nguoi_phan_hoi_id, phan_hoi_nhan_xet, cam_xuc, do_tin_cay, ly_do_cam_xuc
        )
        VALUES ($1, 'NHAN_SU', $2, $3, $4, $5, $6, $7, $7::timestamptz + INTERVAL '2 hours', $3, $8, $9, 0.96, 'Khách hàng khen ngợi chuyên môn và thái độ dịch vụ chu đáo')
        ON CONFLICT DO NOTHING
      `, [
        uuidv4(), apt.custId, apt.staffId, apt.id, sRev.stars, sRev.text, apt.date,
        'Cảm ơn quý khách đã tin tưởng và trải nghiệm dịch vụ tại PhysioFlow! Chúc quý khách luôn khỏe mạnh.',
        sRev.sentiment
      ]);

      // Package Review
      if (apt.pkgId) {
        const pRev = packageReviewComments[i % packageReviewComments.length];
        await client.query(`
          INSERT INTO danh_gia (
            id, loai_danh_gia, khach_hang_id, goi_dich_vu_id, cuoc_hen_id, so_sao, nhan_xet, ngay_tao,
            ngay_phan_hoi, nguoi_phan_hoi_id, phan_hoi_nhan_xet, cam_xuc, do_tin_cay
          )
          VALUES ($1, 'GOI_DICH_VU', $2, $3, $4, $5, $6, $7, $7::timestamptz + INTERVAL '3 hours', $8, $9, $10, 0.95)
          ON CONFLICT DO NOTHING
        `, [
          uuidv4(), apt.custId, apt.pkgId, apt.id, pRev.stars, pRev.text, apt.date,
          allStaff[0].id, 'PhysioFlow chân thành cảm ơn đánh giá tuyệt vời của bạn! Hẹn gặp lại bạn ở các buổi trị liệu tiếp theo.',
          pRev.sentiment
        ]);
      }
    }

    await client.query('COMMIT');
    console.log('✨ SUCCESS! Rich data seeded cleanly for Admin Dashboard.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding rich data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedRichData();

import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fakerVI as faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care',
});

const clearDatabase = async () => {
  console.log('Đang xóa dữ liệu cũ...');
  await pool.query(`
    TRUNCATE TABLE 
      buoi_tri_lieu_dich_vu, danh_gia_dich_vu, buoi_tri_lieu, thanh_toan, hoa_don,
      lich_dieu_tri, ho_so_dieu_tri, lich_dat, phong, thiet_bi_y_te, lich_lam_viec,
      chuyen_gia_y_te, khach_hang, refresh_tokens, thong_bao, nguoi_dung, vai_tro,
      voucher_dich_vu, voucher_goi_dich_vu, voucher, goi_dich_vu_chi_tiet,
      goi_dich_vu, dich_vu, danh_muc_dich_vu, otp_codes
    CASCADE;
    ALTER SEQUENCE IF EXISTS vai_tro_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS danh_muc_dich_vu_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS phong_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS goi_dich_vu_chi_tiet_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS refresh_tokens_id_seq RESTART WITH 1;
  `);
};

const seedRoles = async () => {
  console.log('Seeding roles...');
  const { rows } = await pool.query(`
    INSERT INTO vai_tro (ma_vai_tro, ten_hien_thi, mo_ta_quyen) VALUES
      ('khach_hang', 'Khách hàng', 'Xem lịch của mình, đặt lịch, xem gói, gửi feedback'),
      ('le_tan', 'Lễ tân', 'Quản lý lịch hẹn, check-in, tạo hóa đơn, thu tiền'),
      ('ky_thuat_vien', 'Kỹ thuật viên', 'Xem lịch của mình, tạo đánh giá, ghi chú buổi, đề xuất gói'),
      ('bac_si', 'Bác sĩ', 'Quản lý phác đồ điều trị, chẩn đoán, xem hồ sơ bệnh án'),
      ('admin', 'Quản trị viên', 'Toàn quyền hệ thống'),
      ('quan_ly', 'Quản lý', 'Quản lý chung hệ thống phòng khám, nhân sự và tài chính')
    RETURNING id, ma_vai_tro;
  `);
  return rows.reduce((acc, row) => ({ ...acc, [row.ma_vai_tro]: row.id }), {});
};

const seedUsers = async (roles: any) => {
  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // Admin
  const { rows: adminRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Admin Master', 'admin@officecare.com', '0901234567', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['admin']]);
  const adminId = adminRows[0].id;

  // Manager
  await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Quản lý', 'quanli@officecare.com', '0912345678', $1, $2, TRUE)
  `, [passwordHash, roles['quan_ly']]);

  // Lễ tân
  const { rows: leTanRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Lễ tân 1', 'letan@officecare.com', '0901234568', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['le_tan']]);
  const leTanId = leTanRows[0].id;

  await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('Lễ tân 2', 'letan2@officecare.com', '0901234570', $1, $2, TRUE)
  `, [passwordHash, roles['le_tan']]);

  // Bác sĩ
  const { rows: bacSiRows } = await pool.query(`
    INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
    VALUES ('BS Trần Văn Khám', 'bacsi@officecare.com', '0901234569', $1, $2, TRUE) RETURNING id
  `, [passwordHash, roles['bac_si']]);
  const bacSiId = bacSiRows[0].id;

  await pool.query(`
    INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem)
    VALUES ($1, 'BS001', 'Bác sĩ chuyên khoa', 10)
  `, [bacSiId]);

  // KTVs
  const ktvUsers = [];
  for (let i = 1; i <= 2; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
      VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id
    `, [`KTV ${faker.person.fullName()}`, `ktv${i}@officecare.com`, faker.phone.number(), passwordHash, roles['ky_thuat_vien']]);
    ktvUsers.push(rows[0].id);

    await pool.query(`
      INSERT INTO chuyen_gia_y_te (nguoi_dung_id, ma_nhan_vien, chuyen_mon_chinh, so_nam_kinh_nghiem)
      VALUES ($1, $2, $3, $4)
    `, [rows[0].id, `KTV${String(i).padStart(3, '0')}`, 'Vật lý trị liệu', faker.number.int({ min: 1, max: 10 })]);
  }

  // Khách hàng
  const customerUsers = [];
  for (let i = 1; i <= 1; i++) {
    const { rows } = await pool.query(`
      INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, da_xac_thuc_email)
      VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id
    `, ['Khách Hàng Demo 1', 'khachhang1@officecare.com', '0909999999', passwordHash, roles['khach_hang']]);

    const { rows: khRows } = await pool.query(`
      INSERT INTO khach_hang (nguoi_dung_id, ngay_sinh, gioi_tinh, hang_khach_hang)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [rows[0].id, new Date('1995-05-15'), 'nam', 'thuong']);
    customerUsers.push(khRows[0].id);
  }

  return { ktvUsers, customerUsers, adminId, leTanId, bacSiId };
};

const seedServices = async () => {
  console.log('Seeding services...');

  // Danh mục
  const { rows: categories } = await pool.query(`
    INSERT INTO danh_muc_dich_vu (ten_danh_muc, mo_ta) VALUES
    ('Khám & Lượng giá', 'Khám lâm sàng và đánh giá tư thế'),
    ('Trị liệu cơ sâu & Chuyên sâu', 'Các dịch vụ linh động cấu thành liệu trình hoặc bán lẻ'),
    ('Phục hồi & Phòng ngừa', 'Tập luyện phục hồi chức năng và định hình tư thế'),
    ('Dịch vụ bổ trợ (Add-on)', 'Các liệu pháp thư giãn và phục hồi bổ trợ')
    RETURNING id, ten_danh_muc;
  `);

  const catKham = categories.find(c => c.ten_danh_muc.includes('Khám'))?.id;
  const catTriLieu = categories.find(c => c.ten_danh_muc.includes('Trị liệu'))?.id;
  const catPhucHoi = categories.find(c => c.ten_danh_muc.includes('Phục hồi'))?.id;
  const catAddon = categories.find(c => c.ten_danh_muc.includes('bổ trợ'))?.id;

  const services = [
    // 13 Shared services library (loai_dich_vu = 'chinh')
    {
      catId: catTriLieu,
      name: 'Kéo giãn cột sống cổ bằng tay',
      price: 100000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-CST',
      mo_ta_chi_tiet: 'Kỹ thuật viên sử dụng lực tay chuyên môn thực hiện các kỹ thuật kéo giãn dọc trục cột sống cổ, di động nhẹ nhàng nhằm giải áp đĩa đệm vùng cổ vai gáy.',
      loai_dich_vu_ho_tro: [
        'Giải phóng chèn ép rễ thần kinh cổ, giảm nhanh chứng đau vai gáy lan xuống cánh tay.',
        'Phục hồi tầm vận động tự nhiên khi xoay, cúi, nghiêng cổ.',
        'Tăng cường lưu thông tuần hoàn máu não bộ, giảm đau đầu chóng mặt do chèn ép mạch.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Kỹ thuật giải cơ chuyên sâu',
      price: 150000,
      duration: 20,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-DTT',
      mo_ta_chi_tiet: 'Tác động lực vật lý sâu và chậm dọc theo thớ cơ nông đến cơ sâu, xác định và giải phóng các nút thắt cơ (Trigger Points) gây co cứng dai dẳng.',
      loai_dich_vu_ho_tro: [
        'Phá tan các bó cơ co thắt mãn tính, trả lại chiều dài sinh lý tối ưu cho thớ cơ.',
        'Kích thích tuần hoàn máu mang dưỡng chất và oxy đến nuôi dưỡng vùng mô cơ bị xơ hóa.',
        'Giảm nhức mỏi cơ bắp tức thì sau vận động nặng hoặc ngồi làm việc sai tư thế kéo dài.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Trị liệu giảm đau bằng dòng điện xung',
      price: 120000,
      duration: 15,
      type: 'chinh',
      thiet_bi: 'Máy điện xung',
      ma: 'SVC-ELT',
      mo_ta_chi_tiet: 'Dán các điện cực hydrogel y khoa lên vùng cơ đau nhức, sử dụng thiết bị chuyên dụng phát dòng điện xung tần số thấp thích hợp để cắt đứt tín hiệu đau dây thần kinh.',
      loai_dich_vu_ho_tro: [
        'Ức chế lập tức đường truyền tín hiệu đau lên não bộ theo cơ chế cổng kiểm soát đau.',
        'Kích thích cơ thể tự giải phóng Endorphin (hormone giảm đau tự nhiên) để xoa dịu vùng tổn thương.',
        'Kích thích tuần hoàn máu sâu giúp tiêu viêm, giảm sưng nề mô mềm cục bộ.'
      ]
    },
    {
      catId: catPhucHoi,
      name: 'Hướng dẫn tập phục hồi chức năng',
      price: 70000,
      duration: 10,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-CEG',
      mo_ta_chi_tiet: 'Bác sĩ hoặc Kỹ thuật viên trực tiếp hướng dẫn khách thực hiện chuẩn xác các bài tập ổn định khớp, kích hoạt cơ lõi yếu và điều chỉnh tư thế đứng/ngồi chuẩn y khoa.',
      loai_dich_vu_ho_tro: [
        'Tăng cường sức mạnh và độ bền cho các nhóm cơ hỗ trợ bảo vệ cột sống.',
        'Sửa sai lệch tư thế (gù lưng, cổ rùa, lệch xương chậu) tận gốc.',
        'Duy trì hiệu quả trị liệu lâu dài, ngăn ngừa tái phát cơn đau cơ xương khớp.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Nhiệt trị liệu hồng ngoại',
      price: 80000,
      duration: 15,
      type: 'chinh',
      thiet_bi: 'Đèn hồng ngoại',
      ma: 'SVC-HET',
      mo_ta_chi_tiet: 'Sử dụng đèn hồng ngoại y khoa chuyên khoa chiếu tia nhiệt trực tiếp lên vùng khớp viêm hoặc thắt lưng đau nhức ở cự ly y khoa tiêu chuẩn.',
      loai_dich_vu_ho_tro: [
        'Tác dụng nhiệt nóng sâu làm giãn cơ toàn vùng, loại bỏ tình trạng cứng khớp buổi sáng.',
        'Giãn nở mạch máu ngoại vi, đẩy nhanh tốc độ đào thải độc tố và hấp thụ viêm sưng.',
        'Làm dịu hệ thần kinh nhạy cảm, đem lại cảm giác ấm áp và thư giãn sâu cho khách hàng.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Kỹ thuật di động khớp tăng biên độ',
      price: 130000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-JMT',
      mo_ta_chi_tiet: 'Áp dụng kỹ thuật trượt khớp cơ học bậc 1-3 theo chuẩn y khoa quốc tế lên các diện khớp bị hạn chế biên độ vận động do xơ hóa dây chằng.',
      loai_dich_vu_ho_tro: [
        'Kích thích tăng tiết dịch khớp tự nhiên để bôi trơn diện khớp, giảm ma sát gây thoái hóa.',
        'Mở rộng nhanh biên độ khớp bị giới hạn do viêm bám gân hoặc thoái hóa diện khớp.',
        'Ngăn chặn triệt để nguy cơ dính khớp và xơ cứng bao khớp gây tàn tật.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Di động mô mềm giải phóng cơ',
      price: 100000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-MRL',
      mo_ta_chi_tiet: 'Kỹ thuật sử dụng các ngón tay và lòng bàn tay vuốt miết, trượt mô liên kết mềm dọc bó cơ căng thẳng nhằm phá vỡ các điểm kết dính cơ nông.',
      loai_dich_vu_ho_tro: [
        'Tháo xoắn cơ tức thì, loại bỏ cảm giác căng tức bứt rứt khó chịu ở cơ bắp.',
        'Phục hồi độ đàn hồi tự nhiên linh hoạt của hệ thống mô mềm quanh khớp.',
        'Tạo cảm giác nhẹ nhõm, thư thái ngay trong buổi trị liệu.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Giải phóng cơ hình lê chuyên sâu',
      price: 130000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-PMR',
      mo_ta_chi_tiet: 'Kỹ thuật ấn bấm chuyên sâu giải phóng căng cơ vùng mông (đặc biệt cơ hình lê - Piriformis) để giảm áp cho dây thần kinh tọa chạy bên dưới cơ mông.',
      loai_dich_vu_ho_tro: [
        'Cắt đứt ngay cơn đau tê dọc mông lan xuống đùi và bắp chân (đau thần kinh tọa).',
        'Giảm co thắt sâu vùng hông chậu, khôi phục bước đi linh hoạt vững vàng.',
        'Giải phóng tình trạng mỏi khớp háng khi ngồi làm việc quá lâu một chỗ.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Vận động trị liệu khớp vai',
      price: 120000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-SMT',
      mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện các kỹ thuật vận động khớp thụ động và chủ động có trợ giúp khớp vai nhằm khôi phục cơ học xoay vai.',
      loai_dich_vu_ho_tro: [
        'Hỗ trợ phá vỡ tổ chức xơ dính quanh bao khớp vai gây đông cứng vai (frozen shoulder).',
        'Giúp khách hàng dễ dàng thực hiện các động tác sinh hoạt như chải đầu, giơ tay cao, gãi lưng.',
        'Giải tỏa chứng đau mỏi vai sâu bứt rứt gây mất ngủ về đêm.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Kéo giãn cột sống thắt lưng bằng máy',
      price: 100000,
      duration: 15,
      type: 'chinh',
      thiet_bi: 'Giường kéo giãn',
      ma: 'SVC-SST',
      mo_ta_chi_tiet: 'Sử dụng thiết bị kéo giãn cột sống tự động y khoa, cài đặt đai ngực đai chậu và lực kéo kéo - nhả theo chu kỳ phù hợp với trọng lượng cơ thể để giải áp cột sống.',
      loai_dich_vu_ho_tro: [
        'Giảm áp suất nội đĩa đệm thắt lưng tối đa, tạo lực hút âm giúp nhân nhầy thoát vị co hồi về vị trí cũ.',
        'Mở rộng các lỗ liên hợp cột sống giải phóng chèn ép rễ thần kinh thắt lưng.',
        'Cắt cơn đau lưng cấp và tê bì chân do thoát vị đĩa đệm gây ra.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Kéo giãn cơ toàn thân chủ động',
      price: 100000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-STR',
      mo_ta_chi_tiet: 'Kỹ thuật viên phối hợp cùng khách thực hiện các chuỗi động tác kéo giãn cơ chuỗi sau, cơ liên sườn và giải áp toàn bộ các khớp chính.',
      loai_dich_vu_ho_tro: [
        'Gia tăng độ dẻo dai đàn hồi của toàn bộ hệ thống cơ xương khớp.',
        'Giải phóng chứng đau mỏi tích tụ toàn thân do thói quen ngồi lì làm việc cả ngày.',
        'Tăng cường độ linh hoạt, giúp cơ thể chuyển động nhẹ nhàng thanh thoát.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Kỹ thuật giải phóng điểm bám gân',
      price: 120000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-TRT',
      mo_ta_chi_tiet: 'Tác động miết bấm ngang thớ gân cơ bị tổn thương tại khuỷu tay hoặc cổ tay nhằm kích thích tăng sinh tuần hoàn máu tại điểm bám tận của gân.',
      loai_dich_vu_ho_tro: [
        'Đặc trị đau mỏi cổ tay, khuỷu tay (Hội chứng ống cổ tay, viêm gân khuỷu tay Tennis Elbow).',
        'Tiêu trừ các điểm viêm dính vi mô quanh bao gân cơ.',
        'Tăng cường lực cầm nắm của bàn tay, giúp gõ phím di chuột không đau nhức.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Vận động trị liệu khớp cổ tay',
      price: 120000,
      duration: 15,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-WMT',
      mo_ta_chi_tiet: 'Di động nhẹ nhàng và vận động các diện khớp xương nhỏ vùng cổ tay và bàn ngón tay để kéo giãn dây chằng quanh ống cổ tay.',
      loai_dich_vu_ho_tro: [
        'Giải phóng chèn ép thần kinh giữa trong hội chứng ống cổ tay.',
        'Khắc phục chứng tê rần, mất cảm giác hoặc đau buốt ngón tay khi làm việc văn phòng.',
        'Khôi phục khả năng xoay gấp cổ tay mượt mà không lục cục.'
      ]
    },

    // Nhóm Cổ truyền & Chuyên sâu (loai_dich_vu = 'chinh')
    {
      catId: catKham,
      name: 'Khám lượng giá cột sống & tư thế',
      price: 150000,
      duration: 30,
      type: 'chinh',
      thiet_bi: null,
      ma: 'SVC-KHAM',
      mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện quy trình khám lượng giá gồm 5 bước tiêu chuẩn: (1) Khảo sát tư thế 4 chiều (trước, sau, bên trái, bên phải) bằng bàn dọi định vị để phát hiện lệch vai, lệch chậu, cổ nhô trước hoặc vẹo cột sống; (2) Sử dụng thước đo tầm vận động chuyên dụng đánh giá biên độ gập, duỗi, nghiêng, xoay cột sống; (3) Thực hiện nghiệm pháp Spurling chèn ép cổ, SLR test rễ thần kinh tọa và độ giãn thắt lưng; (4) Sờ chẩn xác định điểm đau nhức và vùng bó cơ co cứng; (5) Kết luận và thiết lập phác đồ trị liệu cá nhân hóa.',
      loai_dich_vu_ho_tro: [
        'Định vị chính xác nguyên nhân gốc rễ gây đau cơ xương khớp, loại trừ các nguy cơ bệnh lý thần kinh cột sống nguy hại.',
        'Phát hiện sớm các sai lệch tư thế vi mô (cổ rùa, lệch hông, bả vai cánh chim) để phòng ngừa thoái hóa sụn khớp sớm.',
        'Thiết lập thông số vận hành nền tảng giúp theo dõi và đánh giá chính xác tiến trình phục hồi qua từng buổi trị liệu.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Trị liệu Cổ - Vai - Gáy "Khơi Thông Kinh Lạc"',
      price: 400000,
      duration: 75,
      type: 'chinh',
      thiet_bi: null,
      ma: 'CVG-CS-75',
      mo_ta_chi_tiet: 'Kỹ thuật viên áp dụng liệu pháp kết hợp xoa bóp cơ sâu y khoa và bấm huyệt cổ truyền: (1) Sử dụng kỹ thuật Myofascial Release miết bóc tách cân cơ nông và sâu vùng cơ thang, cơ nâng vai, cơ ức đòn chũm; (2) Bấm huyệt giải tỏa ách tắc các huyệt Phong Trì, Kiên Tỉnh, Đại Chùy, Thiên Tông; (3) Chiếu đèn hồng ngoại hồng ngoại sâu kết hợp đắp thảo dược ấm để làm mềm cơ bắp; (4) Vận động xoay nghiêng cổ thụ động giải tỏa cứng nghẹt khớp cột sống cổ.',
      loai_dich_vu_ho_tro: [
        'Giải phóng tức thì tình trạng căng thắt cơ vai gáy dai dẳng do ít vận động hoặc làm việc máy tính liên tục.',
        'Tăng lưu lượng máu qua động mạch đốt sống thân nền, đẩy lùi cơn đau đầu cơ năng, hoa mắt, chóng mặt và mất ngủ.',
        'Khôi phục hoàn toàn tầm vận động xoay, cúi ngửa của cổ vai gáy, tạo cảm giác nhẹ nhõm tức thì.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Phục Hồi Đau Lưng - Thoát Vị Đĩa Đệm',
      price: 650000,
      duration: 90,
      type: 'chinh',
      thiet_bi: null,
      ma: 'DL-TVDD-90',
      mo_ta_chi_tiet: 'Quy trình phục hồi cột sống chuyên sâu gồm các bước: (1) Kỹ thuật Deep Tissue giải phóng xơ hóa cơ dựng gai và cơ vuông thắt lưng; (2) Kéo giãn thắt lưng bằng máy giường tự động giải áp theo tải lượng chuẩn; (3) Điện dung siêu âm tần số quét sâu chống phù nề và kháng viêm rễ thần kinh; (4) Di động khớp cột sống thắt lưng phục hồi trượt khớp; (5) Hướng dẫn chi tiết bài tập ổn định cơ lõi thắt lưng chậu phòng tái phát.',
      loai_dich_vu_ho_tro: [
        'Giảm áp lực cơ học nội đĩa đệm, tạo lực hút chân không hỗ trợ nhân nhầy đĩa đệm co hồi giảm chèn ép.',
        'Giải phóng rễ thần kinh tọa, triệt tiêu cơn đau buốt buốt rát từ thắt lưng lan dọc xuống mông và chân.',
        'Thiết lập hệ thống cơ bảo vệ thắt lưng bền vững, nâng đỡ an toàn cho cột sống khi sinh hoạt.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Giảm Đau Cấp Tốc - Co Thắt Cơ Cấp',
      price: 450000,
      duration: 60,
      type: 'chinh',
      thiet_bi: null,
      ma: 'GDC-CAP-60',
      mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện can thiệp giảm co rút cấp: (1) Xoa bóp vuốt nhẹ làm quen cơ, tránh co thắt phòng vệ; (2) Điện xung trị liệu tần số giảm đau cấp TENS cắt đứt dẫn truyền thần kinh đau; (3) Chườm nóng ẩm thảo dược giãn mạch hoặc chườm đá y khoa cục bộ tùy tình trạng viêm cơ; (4) Kéo giãn cơ thụ động nhẹ nhàng tăng tiến giúp xả áp nhóm cơ đang khóa chặt.',
      loai_dich_vu_ho_tro: [
        'Phong tỏa ngay tín hiệu đau cấp tính lên não bộ, xoa dịu tức thì vùng cơ bị co xoắn dữ dội.',
        'Hóa giải tình trạng khóa cứng lưng/cổ đột ngột sau chấn thương thể thao, mang vác nặng hay ngủ sai tư thế.',
        'Khôi phục khả năng xoay người, vận động cơ bản để đi lại bình thường ngay sau buổi can thiệp đầu tiên.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Trị liệu Hội Chứng Ống Cổ Tay & Tê Bì',
      price: 300000,
      duration: 45,
      type: 'chinh',
      thiet_bi: null,
      ma: 'CL-HAND-45',
      mo_ta_chi_tiet: 'Can thiệp chuyên sâu vùng cổ tay: (1) Bóc tách mô liên kết mềm vùng cẳng tay và dải gan tay phá vỡ xơ dính; (2) Siêu âm trị liệu sâu làm mềm bao khớp quanh cổ tay; (3) Áp dụng kỹ thuật di động dây thần kinh giữa giúp thần kinh trượt tự do trong ống cổ tay; (4) Chỉnh trục khớp cổ bàn ngón tay thụ động giảm áp.',
      loai_dich_vu_ho_tro: [
        'Tiêu sưng nề mô đệm và bao gân trong ống cổ tay, giải phóng dây thần kinh giữa khỏi nghẹt cứng.',
        'Xóa bỏ dứt điểm chứng tê rần đầu ngón tay như kiến bò, giảm thiểu nguy cơ teo cơ mô ngón cái.',
        'Phục hồi lực cầm nắm khỏe khoắn, giúp gõ phím di chuột linh hoạt không buốt mỏi cổ tay.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Trị liệu Đau Nhức Khớp Gối / Khớp Vai',
      price: 350000,
      duration: 60,
      type: 'chinh',
      thiet_bi: null,
      ma: 'CL-JOINT-60',
      mo_ta_chi_tiet: 'Phác đồ liên hoàn cơ khớp: (1) Giải phóng co thắt nhóm cơ lớn hỗ trợ khớp (cơ đùi trước/sau với gối, cơ quanh đai vai với vai); (2) Di động khớp thụ động bậc I-II bôi trơn ổ khớp; (3) Chiếu laser năng lượng cao đẩy nhanh sinh hóa lành sụn vi mô; (4) Bài tập đồng co cơ đẳng trường tăng cường tính vững khớp.',
      loai_dich_vu_ho_tro: [
        'Kích thích tăng tiết dịch ổ khớp tự nhiên để bôi trơn diện khớp, đẩy lùi tiếng kêu lục cục thoái hóa khớp.',
        'Giải tỏa tình trạng xơ dính bao khớp, khôi phục tối đa biên độ vận động dạng khép và gấp duỗi khớp.',
        'Tiêu dịch viêm và sưng nề khớp gối/vai, mang lại những bước đi và chuyển động tay nhẹ nhàng, tự tin.'
      ]
    },
    {
      catId: catPhucHoi,
      name: 'Phục Hồi Cơ Bắp Thể Thao Chuyên Sâu',
      price: 800000,
      duration: 90,
      type: 'chinh',
      thiet_bi: null,
      ma: 'PT-SPORTS-90',
      mo_ta_chi_tiet: 'Phác đồ xả cơ cho vận động viên: (1) Sử dụng thiết bị trị liệu rung tần số cao giải phóng màng cơ nông; (2) Nhào nặn cơ sâu (Deep Tissue) phá vỡ các liên kết axit lactic ứ đọng; (3) Kéo giãn cơ kỹ thuật PNF kháng lực thụ động kích hoạt đàn hồi cơ; (4) Nén ép áp lực hơi phục hồi tuần hoàn tĩnh mạch; (5) Hướng dẫn bài tập giãn cơ tĩnh chủ động.',
      loai_dich_vu_ho_tro: [
        'Đào thải nhanh chóng axit lactic tích tụ gây đau nhức mỏi cơ sau tập luyện thi đấu cường độ cao.',
        'Giải tỏa căng thắt sợi cơ quá mức, bảo vệ cơ bắp khỏi rách cơ, chuột rút hoặc viêm điểm bám gân.',
        'Khôi phục độ linh hoạt dẻo dai và công suất tối đa của cơ bắp cho buổi tập tiếp theo.'
      ]
    },
    {
      catId: catPhucHoi,
      name: 'Điều Trị Thoái Hóa Khớp (Gối/Vai/Háng)',
      price: 900000,
      duration: 90,
      type: 'chinh',
      thiet_bi: null,
      ma: 'PT-ARTH-90',
      mo_ta_chi_tiet: 'Can thiệp chuyên sâu giảm thoái hóa: (1) Chiếu hồng ngoại làm mềm xơ dính bao khớp; (2) Di động diện khớp bóc tách sụn khớp thoái hóa; (3) Tập cơ tứ đầu đùi, cơ mông khớp háng hoặc cơ quay vai kháng lực nhẹ nhàng tăng tiến; (4) Sóng ngắn hoặc thấu nhiệt vi ba tăng tuần hoàn mạch máu quanh khớp.',
      loai_dich_vu_ho_tro: [
        'Tăng sức mạnh hệ cơ quanh khớp giúp nâng đỡ sụn khớp, giảm đáng kể ma sát cơ học lên diện khớp thoái hóa.',
        'Chặn đứng phản ứng viêm thoái hóa và ngăn ngừa gai xương tiến triển qua cân bằng sinh học cơ học khớp.',
        'Cải thiện đáng kể chức năng di chuyển, lên xuống cầu thang hay đứng lên ngồi xuống thoải mái không đau đớn.'
      ]
    },
    {
      catId: catPhucHoi,
      name: 'Phục Hồi Sau Chấn Thương / Phẫu Thuật',
      price: 1100000,
      duration: 105,
      type: 'chinh',
      thiet_bi: null,
      ma: 'PT-POST-105',
      mo_ta_chi_tiet: 'Can thiệp an toàn theo tiêu chuẩn phục hồi y khoa: (1) Kiểm tra vết mổ và đánh giá teo cơ; (2) Massage bóc tách bao xơ sẹo mổ dưới da chống co rút kéo lệch khớp; (3) Di động khớp nhẹ nhàng thụ động ngăn cứng khớp sớm; (4) Điện kích thích cơ liệt chống teo cơ do bó bột hạn chế vận động; (5) Tập thăng bằng và phục hồi cảm thụ bản thể chân khớp.',
      loai_dich_vu_ho_tro: [
        'Phá vỡ tổ chức xơ dính dưới sẹo mổ phẫu thuật, phòng ngừa tối đa xơ cứng bao khớp vĩnh viễn.',
        'Kích hoạt cơ bắp đang suy yếu teo nhỏ trở lại hoạt động bình thường, đẩy nhanh tiến trình hồi phục gấp đôi.',
        'Tái thiết lập hệ thống cảm nhận bản thể thần kinh cơ, giúp bước đi cân bằng tự nhiên không lệch lệch tư thế.'
      ]
    },
    {
      catId: catPhucHoi,
      name: 'Trị Liệu & Phục Hồi Chức Năng Thần Kinh',
      price: 1300000,
      duration: 120,
      type: 'chinh',
      thiet_bi: null,
      ma: 'PT-NEURO-120',
      mo_ta_chi_tiet: 'Can thiệp chuyên sâu đặc trị thần kinh (sau tai biến, chấn thương cột sống): (1) Đánh giá phản xạ co thắt và trương lực cơ; (2) Áp dụng kỹ thuật PNF kích thích thần kinh cơ tạo thuận mẫu vận động; (3) Hướng dẫn mẫu chuyển động sinh hoạt chức năng cơ bản; (4) Điện xung FES kích thích nhóm cơ liệt co duỗi chủ động.',
      loai_dich_vu_ho_tro: [
        'Kích thích khả năng mềm dẻo thần kinh của não bộ để học lại các chuyển động đã mất sau tai biến.',
        'Điều hòa trương lực cơ hiệu quả, ngăn ngừa co rút gân gập khớp gây biến dạng cong vẹo các chi.',
        'Nâng cao khả năng tự chủ sinh hoạt (đứng, ngồi dậy, tự xúc ăn), mang lại sự tự tin cho người bệnh.'
      ]
    },
    {
      catId: catPhucHoi,
      name: 'Trị Liệu Cong Vẹo Cột Sống & Sửa Tư Thế',
      price: 700000,
      duration: 60,
      type: 'chinh',
      thiet_bi: null,
      ma: 'PT-POSTURE-60',
      mo_ta_chi_tiet: 'Can thiệp định hình không xâm lấn: (1) Kéo giãn cơ chậu sườn thắt lưng bên lõm, co nhỏ cơ căng giãn bên lồi cột sống vẹo; (2) Tập bài tập Schroth điều hướng không gian 3 chiều; (3) Hướng dẫn kỹ thuật thở xoay chiều sườn mở rộng lồng ngực bị ép lép; (4) Tập thăng bằng trên bóng bosu chỉnh trục vai chậu thẳng hàng.',
      loai_dich_vu_ho_tro: [
        'Nắn chỉnh xoay đốt sống cong vẹo cơ học, giảm đáng kể góc vẹo Cobb cột sống tự nhiên.',
        'Thiết lập lại cân bằng vai chậu ngang bằng, sửa lệch trục xương chậu giúp dáng đi thẳng đẹp.',
        'Giải tỏa lực ép sườn lên phổi, tăng dung tích hô hấp mang lại thể trạng khỏe mạnh, năng động.'
      ]
    },
    {
      catId: catTriLieu,
      name: 'Trải Nghiệm Thư Giãn Wellness Toàn Thân',
      price: 500000,
      duration: 90,
      type: 'chinh',
      thiet_bi: null,
      ma: 'WELL-BODY-90',
      mo_ta_chi_tiet: 'Liệu pháp thư giãn phục hồi hệ bạch huyết: (1) Sử dụng tinh dầu cao cấp kích hoạt hệ khứu giác êm dịu; (2) Massage miết dài Thụy Điển nhẹ nhàng dọc cột sống kích hoạt hệ phó giao cảm; (3) Massage bấm huyệt da đầu giải tỏa căng cứng vỏ não; (4) Ủ đá nóng bazan hoặc chăn thảo dược ấm thải độc tuần hoàn bạch huyết.',
      loai_dich_vu_ho_tro: [
        'Đưa cơ thể về trạng thái tĩnh dưỡng sâu nhất, quét sạch hormone stress cortisol gây căng thẳng mệt mỏi.',
        'Kích thích hệ tuần hoàn bạch huyết hoạt động mạnh mẽ, hỗ trợ cơ thể thanh lọc đào thải độc tố cơ khớp.',
        'Xua tan uể oải tinh thần, cải thiện giấc ngủ sinh lý sâu và đem lại nguồn năng lượng tươi trẻ dồi dào.'
      ]
    },

    // 10 Dịch vụ bổ trợ (loai_dich_vu = 'bo_sung')
    {
      catId: catAddon,
      name: 'Massage Thư Giãn Phục Hồi',
      price: 350000,
      duration: 60,
      type: 'bo_sung',
      thiet_bi: null,
      ma: 'ADD-MASSAGE-60',
      mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện xoa bóp, vuốt miết toàn thân nhịp nhàng kết hợp tinh dầu dừa phân đoạn cao cấp giải tỏa cơ nông.',
      loai_dich_vu_ho_tro: [
        'Làm mềm cơ bắp mệt mỏi, xoa dịu các cơn đau cơ nhẹ sau những ngày ngồi làm việc sai tư thế.',
        'Thúc đẩy tuần hoàn máu và đem lại cảm giác nhẹ nhõm, dễ chịu tức thì.'
      ]
    },
    {
      catId: catAddon,
      name: 'Giác Hơi Phục Hồi',
      price: 180000,
      duration: 40,
      type: 'bo_sung',
      thiet_bi: null,
      ma: 'ADD-CUPPING-40',
      mo_ta_chi_tiet: 'Đặt giác ống thủy tinh nóng y khoa lên vùng cơ thắt lưng và vai dày bằng giác hơi lửa chân không truyền thống.',
      loai_dich_vu_ho_tro: [
        'Tạo lực hút âm tách rời lớp mô liên kết cơ kết dính bóc tách xơ dính cơ lưng sâu rộng.',
        'Tăng lưu lượng tuần hoàn máu cục bộ tiêu ứ huyết, đào thải độc tố tích tụ gây mỏi lưng nặng.'
      ]
    },
    {
      catId: catAddon,
      name: 'Trị Liệu Đá Nóng',
      price: 250000,
      duration: 50,
      type: 'bo_sung',
      thiet_bi: null,
      ma: 'ADD-HOTSTONE-50',
      mo_ta_chi_tiet: 'Đặt đá núi lửa bazan giữ nhiệt lâu dọc các huyệt đạo cột sống kết hợp trượt đá nóng làm giãn cơ co rút.',
      loai_dich_vu_ho_tro: [
        'Nhiệt lượng tỏa sâu làm giãn nở toàn bộ mao mạch, giải phóng các thớ cơ co cứng sâu bên trong thắt lưng.',
        'Sưởi ấm cơ thể khí huyết lưu thông tốt, cải thiện giấc ngủ ban đêm và xoa dịu thần kinh nhạy cảm.'
      ]
    },
    {
      catId: catAddon,
      name: 'Ngâm Đá Lạnh Phục Hồi',
      price: 150000,
      duration: 12,
      type: 'bo_sung',
      thiet_bi: 'Bể ngâm lạnh',
      ma: 'ADD-ICEBATH-12',
      mo_ta_chi_tiet: 'Khách hàng ngâm cơ thể hoặc chi dưới trong bể nước đá 8-12 độ C dưới sự giám sát nhịp thở y khoa của Kỹ thuật viên.',
      loai_dich_vu_ho_tro: [
        'Co mạch đột ngột giảm ngay sưng đau cơ viêm cấp do tập luyện thể thao cường độ cao.',
        'Tái lập giãn nở mạch máu mạnh mẽ ngay sau khi kết thúc ngâm, đưa máu tươi oxy nuôi dưỡng cơ.'
      ]
    },
    {
      catId: catAddon,
      name: 'Massage Đầu Cổ Vai Gáy',
      price: 200000,
      duration: 40,
      type: 'bo_sung',
      thiet_bi: null,
      ma: 'ADD-HEADNECK-40',
      mo_ta_chi_tiet: 'Day bấm cục bộ đai vai, cơ thang cổ và xoa bóp cơ da đầu xua tan mỏi đau tức thời.',
      loai_dich_vu_ho_tro: [
        'Giảm căng tức và cứng bả vai gáy do duy trì tư thế cúi gõ phím quá lâu.',
        'Cải thiện tuần hoàn động mạch não bộ, giảm dứt điểm chứng đau đầu do stress mỏi mệt.'
      ]
    },
    {
      catId: catAddon,
      name: 'Kéo Giãn Toàn Thân Chuyên Sâu',
      price: 220000,
      duration: 45,
      type: 'bo_sung',
      thiet_bi: null,
      ma: 'ADD-FULLSTR-45',
      mo_ta_chi_tiet: 'Kỹ thuật viên sử dụng lực kéo cơ học giãn toàn bộ chuỗi cơ sau, cơ liên sườn và khớp chân tay thụ động.',
      loai_dich_vu_ho_tro: [
        'Kéo giãn màng cân cơ bị co rút co cứng, đưa cơ thể về chiều dài sinh lý cân đối.',
        'Tăng tính linh hoạt đàn hồi khớp và phòng ngừa thoái hóa cứng cứng khớp.'
      ]
    },
    {
      catId: catAddon,
      name: 'Trị Liệu Tinh Dầu Thư Giãn',
      price: 230000,
      duration: 45,
      type: 'bo_sung',
      thiet_bi: null,
      ma: 'ADD-AROMA-45',
      mo_ta_chi_tiet: 'Massage vuốt lực nhẹ kết hợp tinh dầu oải hương hoặc sả chanh khuếch tán giải tỏa hệ phó giao cảm.',
      loai_dich_vu_ho_tro: [
        'Giải tỏa áp lực căng thẳng tinh thần, kích hoạt trạng thái thư giãn sâu của cơ thể.',
        'Cung cấp dưỡng chất thiên nhiên cao cấp làm dịu và phục hồi tế bào da.'
      ]
    },
    {
      catId: catAddon,
      name: 'Xông Phục Hồi Cơ Thể',
      price: 130000,
      duration: 25,
      type: 'bo_sung',
      thiet_bi: 'Phòng xông hơi',
      ma: 'ADD-STEAM-25',
      mo_ta_chi_tiet: 'Thư giãn xông hơi ướt 45 độ C cùng tinh chất thảo mộc bạc hà, sả chanh kích hoạt tuyến mồ hôi hoạt động.',
      loai_dich_vu_ho_tro: [
        'Mở rộng lỗ chân lông đào thải muối dư và axit uric tích tụ trong cơ thể.',
        'Làm thông thông thoáng đường hô hấp, làm mềm màng cơ chuẩn bị tốt cho các buổi vận động.'
      ]
    },
    {
      catId: catAddon,
      name: 'Massage Chân Phục Hồi',
      price: 180000,
      duration: 45,
      type: 'bo_sung',
      thiet_bi: null,
      ma: 'ADD-FOOT-45',
      mo_ta_chi_tiet: 'Ấn huyệt phản xạ lòng bàn chân kết hợp massage giải co thắt cơ bắp chân và gót chân.',
      loai_dich_vu_ho_tro: [
        'Giảm đau mỏi gót chân gan bàn chân hiệu quả, giảm căng cứng cơ sinh đôi cẳng chân sau.',
        'Kích thích máu tĩnh mạch chi dưới lưu thông mượt mà tránh tê bì phù chân.'
      ]
    },
    {
      catId: catAddon,
      name: 'Trị Liệu Ép Phục Hồi Cơ',
      price: 160000,
      duration: 25,
      type: 'bo_sung',
      thiet_bi: 'Máy nén ép',
      ma: 'ADD-COMPRESS-25',
      mo_ta_chi_tiet: 'Khách hàng mang ủng nén hơi y khoa, máy ép tự động thực hiện bơm hơi cuộn dọc từ bàn chân lên đùi.',
      loai_dich_vu_ho_tro: [
        'Tạo áp lực hơi ép xả thụ động hỗ trợ tĩnh mạch đẩy chất thải axit lactic ứ đọng đi nhanh hơn gấp 5 lần.',
        'Xóa tan chứng mỏi nặng chân nhanh chóng, thích hợp cho người đi đứng chạy bộ nhiều.'
      ]
    }
  ];

  const serviceIds = [];
  for (const s of services) {
    const { rows } = await pool.query(`
      INSERT INTO dich_vu (danh_muc_id, ten_dich_vu, thoi_luong_phut, don_gia, loai_dich_vu, thiet_bi_yeu_cau, mo_ta_ngan, mo_ta_chi_tiet, loai_dich_vu_ho_tro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [
      s.catId,
      s.name,
      s.duration,
      s.price,
      s.type,
      s.thiet_bi,
      `Dịch vụ ${s.name} (Mã: ${s.ma})`,
      (s as any).mo_ta_chi_tiet || null,
      (s as any).loai_dich_vu_ho_tro ? JSON.stringify((s as any).loai_dich_vu_ho_tro) : '[]'
    ]);
    serviceIds.push({ id: rows[0].id, name: s.name, price: s.price, code: s.ma });
  }

  return serviceIds;
};

const seedPackages = async (services: any[]) => {
  console.log('Seeding packages...');

  // Helper to find service ID by shorthand matching
  const findSvcId = (shorthand: string) => {
    const code = 'SVC-' + shorthand;
    const found = services.find(s => s.code === code);
    if (!found) {
      throw new Error(`Shorthand service not found for code: ${code}`);
    }
    return found.id;
  };

  const officePackages = [
    {
      code: 'PKG-CVG',
      name: 'Cervical Spine Recovery (Trị Liệu Cổ Vai Gáy)',
      desc: 'Liệu trình giảm đau mỏi vai gáy cho người làm việc máy tính nhiều, tái tạo vận động đốt sống cổ.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['DTT', 'ELT', 'HET', 'CST', 'CEG']
    },
    {
      code: 'PKG-LBR',
      name: 'Lower Back Recovery (Trị Liệu Đau Lưng)',
      desc: 'Hỗ trợ giải tỏa căng thẳng vùng thắt lưng, định hình tư thế ngồi, giảm nhức mỏi thắt lưng cấp và mãn tính.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['ELT', 'HET', 'SST', 'CEG']
    },
    {
      code: 'PKG-OPC',
      name: 'Office Posture Correction (Chỉnh Dáng Văn Phòng)',
      desc: 'Khắc phục tư thế cổ rùa, gù lưng, lệch khớp do ngồi sai tư thế nhiều năm.',
      sessions: 12,
      price: 4704000,
      originalPrice: 5880000,
      services: ['MRL', 'SST', 'SMT', 'CEG']
    },
    {
      code: 'PKG-SUR',
      name: 'Shoulder & Upper Back (Phục Hồi Khớp Vai)',
      desc: 'Trị liệu căng cơ bả vai, khó giơ tay, mỏi vùng lưng trên do áp lực làm việc kéo dài.',
      sessions: 10,
      price: 4160000,
      originalPrice: 5200000,
      services: ['DTT', 'ELT', 'HET', 'STR', 'SMT']
    },
    {
      code: 'PKG-SCR',
      name: 'Sciatica Relief (Giải Tỏa Đau Thần Kinh Tọa)',
      desc: 'Tập trung giải phóng chèn ép rễ thần kinh lưng hông và mông, giúp đi lại linh hoạt.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['DTT', 'ELT', 'HET', 'PMR', 'CEG']
    },
    {
      code: 'PKG-WER',
      name: 'Wrist & Elbow Recovery (Trị Liệu Cổ Tay/Khuỷu Tay)',
      desc: 'Đặc trị hội chứng ống cổ tay, mỏi khớp ngón tay gõ phím, khuỷu tay tennis elbow.',
      sessions: 8,
      price: 3136000,
      originalPrice: 3920000,
      services: ['ELT', 'HET', 'WMT', 'TRT', 'CEG']
    },
    {
      code: 'PKG-SRT',
      name: 'Stress Recovery (Hồi Phục Căng Thẳng)',
      desc: 'Liệu trình ngắn ngày kết hợp nhiệt và giải phóng cơ nông giúp ngủ ngon, giải tỏa mệt mỏi hệ thần kinh.',
      sessions: 6,
      price: 2064000,
      originalPrice: 2580000,
      services: ['MRL', 'HET']
    },
    {
      code: 'PKG-FBR',
      name: 'Full Body Office Recovery (Trị Liệu Xương Khớp Toàn Thân)',
      desc: 'Sự kết hợp hoàn hảo từ cột sống cổ đến thắt lưng, giúp cơ thể sảng khoái và tràn đầy năng lượng.',
      sessions: 10,
      price: 4000000,
      originalPrice: 5000000,
      services: ['DTT', 'MRL', 'ELT', 'HET', 'SST']
    },
    {
      code: 'PKG-MFP',
      name: 'Mobility & Flexibility (Tăng Cường Độ Linh Hoạt)',
      desc: 'Kéo giãn và vận động khớp chủ động, lấy lại biên độ chuyển động tự nhiên cho cơ thể.',
      sessions: 8,
      price: 3200000,
      originalPrice: 4000000,
      services: ['MRL', 'STR', 'JMT', 'CEG']
    },
    {
      code: 'PKG-PVC',
      name: 'Preventive Office Care (Chăm Sóc Chủ Động)',
      desc: 'Gói chăm sóc định kỳ hàng tuần ngăn ngừa thoái hóa đốt sống sớm cho quản lý và nhân viên.',
      sessions: 12,
      price: 3648000,
      originalPrice: 4560000,
      services: ['MRL', 'HET', 'STR', 'CEG']
    }
  ];

  for (const pkg of officePackages) {
    const pkgDetailArr = pkg.services.map((svcShort, index) => {
      const svcId = findSvcId(svcShort);
      return {
        dich_vu_id: svcId,
        so_buoi: pkg.sessions,
        so_lan_toi_da_trong_goi: pkg.sessions,
        bat_buoc: true,
        thu_tu_thuc_hien: index + 1
      };
    });

    const { rows } = await pool.query(`
      INSERT INTO goi_dich_vu (ten_goi, ma_goi, mo_ta, tong_so_buoi, gia_goi, gia_goc, han_dung_thang, hien_thi_website, trang_thai, chi_tiet_dich_vu, so_dv_toi_da_moi_buoi, loai_goi)
      VALUES ($1, $2, $3, $4, $5, $6, 6, true, 'hoat_dong', $7, 5, 'lieu_trinh')
      RETURNING id
    `, [pkg.name, pkg.code, pkg.desc, pkg.sessions, pkg.price, pkg.originalPrice, JSON.stringify(pkgDetailArr)]);
    const pkgId = rows[0].id;

    for (const item of pkgDetailArr) {
      await pool.query(`
        INSERT INTO goi_dich_vu_chi_tiet (goi_dich_vu_id, dich_vu_id, so_buoi_trong_goi, so_lan_toi_da_trong_goi, bat_buoc, thu_tu_thuc_hien)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [pkgId, item.dich_vu_id, item.so_buoi, item.so_lan_toi_da_trong_goi, item.bat_buoc, item.thu_tu_thuc_hien]);
    }
  }
};

const seedInvoicesAndAnalytics = async (customerIds: string[], serviceIds: any[]) => {
  console.log('Seeding invoices and analytics...');

  // Tạo dữ liệu doanh thu trong 6 tháng qua
  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const service = faker.helpers.arrayElement(serviceIds);
    const date = faker.date.past({ years: 0.5 }); // Trong 6 tháng qua

    // 1. Tạo hóa đơn
    const { rows: invRows } = await pool.query(`
      INSERT INTO hoa_don (ma_hoa_don, khach_hang_id, loai_hoa_don, tong_tien_truoc_giam, tong_tien_thanh_toan, da_thanh_toan, trang_thai, ngay_tao)
      VALUES ($1, $2, 'dich_vu_don', $3, $3, $3, 'da_thanh_toan', $4) RETURNING id
    `, [`HD${faker.string.numeric(6)}`, customer, service.price, date]);

    // 2. Tạo thanh toán
    await pool.query(`
      INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai, thoi_gian_giao_dich)
      VALUES ($1, $2, $3, 'chuyen_khoan', 'thanh_cong', $4)
    `, [invRows[0].id, `GD${faker.string.numeric(8)}`, service.price, date]);
  }
};

const seedFeedback = async (customerIds: string[]) => {
  console.log('Seeding feedbacks...');

  // Lấy danh sách KTV thực tế
  const { rows: ktvs } = await pool.query('SELECT id FROM chuyen_gia_y_te');

  // Lấy bác sĩ để gán vào lịch đặt khám và hồ sơ bệnh án
  const { rows: doctors } = await pool.query(`
    SELECT c.id FROM chuyen_gia_y_te c
    JOIN nguoi_dung n ON c.nguoi_dung_id = n.id
    JOIN vai_tro v ON n.vai_tro_id = v.id
    WHERE v.ma_vai_tro = 'bac_si' LIMIT 1
  `);
  const doctorId = doctors[0]?.id || null;

  // Cần ít nhất 1 buổi trị liệu để đánh giá
  const { rows: services } = await pool.query('SELECT id, don_gia FROM dich_vu LIMIT 1');
  if (services.length === 0 || ktvs.length === 0) return;

  for (let i = 0; i < 15; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const ktv = faker.helpers.arrayElement(ktvs).id;
    const serviceId = services[0].id;

    // 1. Giả lập lịch đặt khám ban đầu (Bác sĩ khám)
    const { rows: ld } = await pool.query(`
      INSERT INTO lich_dat (ma_lich_dat, khach_hang_id, dich_vu_id, bac_si_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, trang_thai, nguoi_tao)
      VALUES ($1, $2, $3, $4, NOW() - interval '${i + 1} days', NOW() - interval '${i + 1} days' + interval '1 hour', 'hoan_thanh', 'khach_hang') RETURNING id
    `, [`LD${faker.string.numeric(6)}`, customer, serviceId, doctorId]);
    const lichDatId = ld[0].id;

    // 2. Tạo hồ sơ điều trị liên kết 1:1 với lich_dat
    const { rows: hsba } = await pool.query(`
      INSERT INTO ho_so_dieu_tri (lich_dat_id, chuyen_gia_id, chan_doan, chong_chi_dinh, dich_vu_id, ghi_chu, thoi_gian_tao)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [
      lichDatId,
      doctorId,
      faker.helpers.arrayElement(['Đau cổ vai gáy cấp tính', 'Thoát vị đĩa đệm thắt lưng L4-L5', 'Hội chứng ống cổ tay', 'Viêm quanh khớp vai thể đông cứng']),
      faker.helpers.arrayElement(['Không áp dụng nhiệt nóng vùng viêm cấp', 'Tránh kéo giãn cột sống áp lực cao', 'Không có chống chỉ định đặc biệt']),
      serviceId,
      'Bác sĩ đề xuất thực hiện liệu trình giảm đau và tập phục hồi chức năng.',
      new Date(Date.now() - (i + 1) * 24 * 3600 * 1000)
    ]);
    const hoSoBenhAnId = hsba[0].id;

    // 3. Giả lập lịch điều trị liên kết với hồ sơ điều trị
    const { rows: ldt } = await pool.query(`
      INSERT INTO lich_dieu_tri (khach_hang_id, loai_dieu_tri, tong_so_buoi, so_buoi_da_dung, trang_thai, ho_so_dieu_tri_id, ma_lich_dieu_tri)
      VALUES ($1, 'dich_vu_le', 1, 1, 'hoan_thanh', $2, $3) RETURNING id
    `, [customer, hoSoBenhAnId, `LDT${faker.string.numeric(6)}`]);
    const lichDieuTriId = ldt[0].id;

    // 4. Giả lập buổi trị liệu thực tế
    const { rows: btl } = await pool.query(`
      INSERT INTO buoi_tri_lieu (lich_dieu_tri_id, dich_vu_id, ky_thuat_vien_id, khach_hang_id, trang_thai, thoi_gian_bat_dau, thoi_gian_ket_thuc, so_thu_tu_buoi)
      VALUES ($1, $2, $3, $4, 'hoan_thanh', NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '1 hour', 1) RETURNING id
    `, [lichDieuTriId, serviceId, ktv, customer]);
    const buoiTriLieuId = btl[0].id;

    // 5. Thêm dịch vụ sử dụng trong buổi (bảng buoi_tri_lieu_dich_vu mới)
    await pool.query(`
      INSERT INTO buoi_tri_lieu_dich_vu (buoi_tri_lieu_id, dich_vu_id, so_luong, thoi_gian_thuc_hien, ktv_id, loai_dich_vu_su_dung, trang_thai)
      VALUES ($1, $2, 1, NOW() - interval '${i} days', $3, 'trong_goi', 'da_duyet')
    `, [buoiTriLieuId, serviceId, ktv]);

    // 6. Tạo hóa đơn thanh toán cho buổi trị liệu này
    const price = services[0].don_gia;
    const { rows: invRows } = await pool.query(`
      INSERT INTO hoa_don (ma_hoa_don, khach_hang_id, loai_hoa_don, tong_tien_truoc_giam, tong_tien_thanh_toan, da_thanh_toan, trang_thai, ngay_tao, ngay_thanh_toan, lich_dieu_tri_id)
      VALUES ($1, $2, 'dich_vu_don', $3, $3, $3, 'da_thanh_toan', NOW() - interval '${i} days', NOW() - interval '${i} days' + interval '30 minutes', $4) RETURNING id
    `, [`HD${faker.string.numeric(6)}`, customer, price, lichDieuTriId]);

    await pool.query(`
      INSERT INTO thanh_toan (hoa_don_id, ma_giao_dich, so_tien, phuong_thuc, trang_thai, thoi_gian_giao_dich)
      VALUES ($1, $2, $3, 'chuyen_khoan', 'thanh_cong', NOW() - interval '${i} days' + interval '30 minutes')
    `, [invRows[0].id, `GD${faker.string.numeric(8)}`, price]);

    // 7. Lưu feedback
    await pool.query(`
      INSERT INTO danh_gia_dich_vu (khach_hang_id, buoi_tri_lieu_id, ky_thuat_vien_id, so_sao_tong, so_sao_ktv, nhan_xet, hieu_qua_dieu_tri, thoi_gian_danh_gia)
      VALUES ($1, $2, $3, $4, $4, $5, 'tot', NOW() - interval '${i} days' + interval '2 hours')
    `, [customer, buoiTriLieuId, ktv, faker.number.int({ min: 3, max: 5 }), faker.lorem.sentence()]);
  }
};

const seedVouchers = async (adminId: string) => {
  console.log('Seeding vouchers...');
  await pool.query(`
    INSERT INTO voucher (ma_voucher, ten_chien_dich, loai_giam, gia_tri_giam, don_hang_toi_thieu, ngay_bat_dau, ngay_het_han, trang_thai, tao_boi) VALUES
    ('SUMMER2024', 'Khuyến mãi Hè 2024', 'phan_tram', 15, 500000, NOW() - interval '1 month', NOW() + interval '1 month', 'hoat_dong', $1),
    ('NEWUSER', 'Khách hàng mới', 'so_tien_co_dinh', 100000, 0, NOW() - interval '1 year', NOW() + interval '1 year', 'hoat_dong', $1)
  `, [adminId]);
};

const seedSchedules = async (users: any) => {
  console.log('Seeding schedules...');

  // Lấy Thứ 2 của tuần này và tuần sau
  const current = new Date();
  const distanceToMonday = current.getDay() === 0 ? -6 : 1 - current.getDay();
  const thisMonday = new Date(current);
  thisMonday.setDate(current.getDate() + distanceToMonday);

  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getWeekDates = (startMonday: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  };

  const datesThisWeek = getWeekDates(thisMonday);
  const datesNextWeek = getWeekDates(nextMonday);
  const allDates = [...datesThisWeek, ...datesNextWeek];

  const SHIFTS = {
    morning: { gio_bat_dau: '07:00', gio_ket_thuc: '16:00', trang_thai: 'hoat_dong' },
    afternoon: { gio_bat_dau: '11:00', gio_ket_thuc: '20:00', trang_thai: 'hoat_dong' },
    dayoff: { gio_bat_dau: '00:00', gio_ket_thuc: '00:00', trang_thai: 'tam_nghi' }
  };

  // Seed cho Lễ tân (users.leTanId)
  for (const day of allDates) {
    const d = new Date(day);
    const dayOfWeek = (d.getDay() === 0 ? 6 : d.getDay() - 1); // 0 = T2, ..., 6 = CN
    if (dayOfWeek === 6) continue; // Chủ nhật nghỉ
    // Xen kẽ ca sáng/chiều, thứ 4 nghỉ phép
    let shift = dayOfWeek % 2 === 0 ? SHIFTS.morning : SHIFTS.afternoon;
    if (dayOfWeek === 2) shift = SHIFTS.dayoff;
    await pool.query(`
      INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai)
      VALUES ($1, $2, $3, $4, $5)
    `, [users.leTanId, day, shift.gio_bat_dau, shift.gio_ket_thuc, shift.trang_thai]);
  }

  // Seed cho Bác sĩ (users.bacSiId)
  for (const day of allDates) {
    const d = new Date(day);
    const dayOfWeek = (d.getDay() === 0 ? 6 : d.getDay() - 1);
    if (dayOfWeek === 6) continue; // Chủ nhật nghỉ
    // Xen kẽ ca sáng/chiều
    const shift = dayOfWeek % 2 === 0 ? SHIFTS.morning : SHIFTS.afternoon;
    await pool.query(`
      INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai)
      VALUES ($1, $2, $3, $4, $5)
    `, [users.bacSiId, day, shift.gio_bat_dau, shift.gio_ket_thuc, shift.trang_thai]);
  }

  // Seed cho các KTV (users.ktvUsers)
  for (const ktvId of users.ktvUsers) {
    const ktvIdx = users.ktvUsers.indexOf(ktvId);
    for (const day of allDates) {
      const d = new Date(day);
      const dayOfWeek = (d.getDay() === 0 ? 6 : d.getDay() - 1);
      if (dayOfWeek === 6) continue; // Chủ nhật nghỉ

      const offset = ktvIdx % 2;
      let shift = (dayOfWeek + offset) % 2 === 0 ? SHIFTS.morning : SHIFTS.afternoon;

      // Thỉnh thoảng có ngày nghỉ phép
      if (dayOfWeek === 4 && offset === 1) {
        shift = SHIFTS.dayoff;
      }

      await pool.query(`
        INSERT INTO lich_lam_viec (nguoi_dung_id, ngay, gio_bat_dau, gio_ket_thuc, trang_thai)
        VALUES ($1, $2, $3, $4, $5)
      `, [ktvId, day, shift.gio_bat_dau, shift.gio_ket_thuc, shift.trang_thai]);
    }
  }
};

const seedRoomsAndEquipment = async () => {
  console.log('Seeding rooms (standard Phase 2) and equipment...');
  const rooms = [
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

  for (const r of rooms) {
    await pool.query(`
      INSERT INTO phong (ten_phong, ma_phong, loai_phong, tang, trang_thai)
      VALUES ($1, $2, $3, $4, 'san_sang')
    `, [r.ten_phong, r.ma_phong, r.loai_phong, r.tang]);
  }

  console.log('Updating service equipment requirements...');
  const serviceUpdates = [
    { ten: 'Điện xung giảm đau', thiet_bi: 'Máy điện xung' },
    { ten: 'Nhiệt trị liệu', thiet_bi: 'Đèn hồng ngoại' },
    { ten: 'Kéo giãn cột sống', thiet_bi: 'Giường kéo giãn' },
    { ten: 'Kéo giãn vùng cổ', thiet_bi: 'Máy kéo giãn cổ' },
    { ten: 'Trị liệu kéo giãn', thiet_bi: 'Giường kéo giãn' }
  ];

  for (const update of serviceUpdates) {
    await pool.query(
      'UPDATE dich_vu SET thiet_bi_yeu_cau = $1 WHERE ten_dich_vu = $2',
      [update.thiet_bi, update.ten]
    );
  }

  await pool.query(
    `UPDATE dich_vu 
     SET thiet_bi_yeu_cau = 'không có' 
     WHERE ten_dich_vu NOT IN ('Điện xung giảm đau', 'Nhiệt trị liệu', 'Kéo giãn cột sống', 'Kéo giãn vùng cổ', 'Trị liệu kéo giãn')`
  );

  console.log('Seeding equipment...');
  const { rows: dbRooms } = await pool.query('SELECT id, ma_phong FROM phong');
  const roomMap = new Map<string, number>();
  dbRooms.forEach((r: any) => {
    roomMap.set(r.ma_phong, Number(r.id));
  });

  const nextMaintenanceDate = new Date();
  nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 2);
  const dateStr = nextMaintenanceDate.toISOString().split('T')[0];

  const overdueDate = new Date();
  overdueDate.setMonth(overdueDate.getMonth() - 1);
  const overdueStr = overdueDate.toISOString().split('T')[0];

  const equipmentList = [
    {
      ma_thiet_bi: 'EQP-LAS01',
      ten_thiet_bi: 'Máy Laser công suất cao BTL-6000 20W',
      loai_thiet_bi: 'Máy laser',
      phong_code: 'P200',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Phát laser cường độ cao trị liệu sâu, chú ý kính bảo hộ.',
      co_the_di_chuyen: true,
      cap_rui_ro: 'cao',
      tan_suat: 30,
      nguong_canh_bao: 80,
      nguong_bat_buoc: 100
    },
    {
      ma_thiet_bi: 'EQP-SW01',
      ten_thiet_bi: 'Máy sóng xung kích trị liệu BTL-6000 Shockwave',
      loai_thiet_bi: 'Máy Shockwave',
      phong_code: 'P200',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Đầu phát đa tần số, bôi gel trước khi vận hành đầu phát.',
      co_the_di_chuyen: true,
      cap_rui_ro: 'cao',
      tan_suat: 30,
      nguong_canh_bao: 80,
      nguong_bat_buoc: 100
    },
    {
      ma_thiet_bi: 'EQP-US01',
      ten_thiet_bi: 'Máy siêu âm điều trị đa tần BTL-4710 Smart',
      loai_thiet_bi: 'Máy siêu âm',
      phong_code: 'P200',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Đầu phát siêu âm rảnh tay kết hợp trị liệu nhiệt ấm.',
      co_the_di_chuyen: true,
      cap_rui_ro: 'cao',
      tan_suat: 30,
      nguong_canh_bao: 80,
      nguong_bat_buoc: 100
    },
    {
      ma_thiet_bi: 'EQP-ELT01',
      ten_thiet_bi: 'Máy điện xung 4 kênh kết hợp giác hút BTL-4625',
      loai_thiet_bi: 'Máy điện xung',
      phong_code: 'P200',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Dòng điện TENS, xung giao thoa giảm đau cơ xương khớp.',
      co_the_di_chuyen: true,
      cap_rui_ro: 'cao',
      tan_suat: 30,
      nguong_canh_bao: 80,
      nguong_bat_buoc: 100
    },
    {
      ma_thiet_bi: 'EQP-IR01',
      ten_thiet_bi: 'Đèn hồng ngoại Philips Infraphil 300W',
      loai_thiet_bi: 'Đèn hồng ngoại',
      phong_code: 'P200',
      ngay_bao_tri: overdueStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Sưởi ấm trị liệu tăng tuần hoàn, bóng 300W chân đứng.',
      co_the_di_chuyen: true,
      cap_rui_ro: 'trung_binh',
      tan_suat: 45,
      nguong_canh_bao: 120,
      nguong_bat_buoc: 150
    },
    {
      ma_thiet_bi: 'EQP-COM01',
      ten_thiet_bi: 'Hệ thống nén ép áp lực hơi BTL-6000 Lymphastim',
      loai_thiet_bi: 'Máy nén ép',
      phong_code: 'P200',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Bộ ủng 12 khoang ép xả liên hoàn hỗ trợ lưu thông chi dưới.',
      co_the_di_chuyen: true,
      cap_rui_ro: 'trung_binh',
      tan_suat: 45,
      nguong_canh_bao: 120,
      nguong_bat_buoc: 150
    },
    {
      ma_thiet_bi: 'EQP-DTS01',
      ten_thiet_bi: 'Hệ thống giường kéo giãn cột sống DTS Triton',
      loai_thiet_bi: 'Giường kéo giãn',
      phong_code: 'P205',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Kéo giãn giảm áp đĩa đệm thắt lưng tự động kiểm soát lực.',
      co_the_di_chuyen: false,
      cap_rui_ro: 'trung_binh',
      tan_suat: 60,
      nguong_canh_bao: 150,
      nguong_bat_buoc: 200
    },
    {
      ma_thiet_bi: 'EQP-CST01',
      ten_thiet_bi: 'Khung kéo giãn cột sống cổ treo tường BTL',
      loai_thiet_bi: 'Máy kéo giãn cổ',
      phong_code: 'P205',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Hệ ròng rọc kéo giãn giảm tải áp lực cột sống cổ.',
      co_the_di_chuyen: false,
      cap_rui_ro: 'trung_binh',
      tan_suat: 60,
      nguong_canh_bao: 150,
      nguong_bat_buoc: 200
    },
    {
      ma_thiet_bi: 'EQP-SIS01',
      ten_thiet_bi: 'Hệ thống từ trường siêu dẫn công suất cao BTL-6000 SIS',
      loai_thiet_bi: 'Máy từ trường',
      phong_code: 'P205',
      ngay_bao_tri: dateStr,
      trang_thai: 'san_sang',
      ghi_chu: 'Kích thích điện từ siêu dẫn giảm đau thần kinh, co thắt khớp.',
      co_the_di_chuyen: false,
      cap_rui_ro: 'trung_binh',
      tan_suat: 60,
      nguong_canh_bao: 150,
      nguong_bat_buoc: 200
    },
    {
      ma_thiet_bi: 'EQP-US02',
      ten_thiet_bi: 'Máy siêu âm xách tay giảm đau cấp',
      loai_thiet_bi: 'Máy siêu âm',
      phong_code: 'P200',
      ngay_bao_tri: dateStr,
      trang_thai: 'dang_bao_tri',
      ghi_chu: 'Thiết bị dự phòng xách tay đi tua hoặc lâm sàng khẩn cấp.',
      co_the_di_chuyen: true,
      cap_rui_ro: 'cao',
      tan_suat: 30,
      nguong_canh_bao: 80,
      nguong_bat_buoc: 100
    }
  ];

  for (const eq of equipmentList) {
    const phongId = eq.phong_code ? roomMap.get(eq.phong_code) : null;
    await pool.query(
      `INSERT INTO thiet_bi_y_te (
         ma_thiet_bi, ten_thiet_bi, loai_thiet_bi, ngay_mua, ngay_bao_tri_tiep_theo, 
         trang_thai, phong_id_hien_tai, ghi_chu, co_the_di_chuyen, cap_rui_ro, 
         tan_suat_bao_tri_ngay, nguong_canh_bao, nguong_bat_buoc_bao_tri, ngay_bao_tri_gan_nhat
       ) VALUES ($1, $2, $3, NOW() - INTERVAL '6 months', $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE)`,
      [
        eq.ma_thiet_bi,
        eq.ten_thiet_bi,
        eq.loai_thiet_bi,
        eq.ngay_bao_tri,
        eq.trang_thai,
        phongId || null,
        eq.ghi_chu,
        eq.co_the_di_chuyen,
        eq.cap_rui_ro,
        eq.tan_suat,
        eq.nguong_canh_bao,
        eq.nguong_bat_buoc
      ]
    );
  }
};

const importBackupData = async () => {
  console.log('Đang đọc và khôi phục dữ liệu dịch vụ từ backup_services_and_packages.sql...');
  const filePath = path.join(__dirname, '../../../backup_services_and_packages.sql');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file backup tại: ${filePath}`);
  }
  let sqlContent = fs.readFileSync(filePath, 'utf8');
  // Lọc bỏ các dòng psql slash commands (bắt đầu bằng \)
  sqlContent = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('\\'))
    .join('\n');
  await pool.query(sqlContent);
  console.log('✅ Khôi phục dữ liệu dịch vụ từ file backup thành công!');
};

const runSeed = async () => {
  console.log('--- STARTING RUNSEED IN MODIFIED FILE ---');
  try {
    await clearDatabase();
    const roles = await seedRoles();
    const { ktvUsers, customerUsers, adminId, leTanId, bacSiId } = await seedUsers(roles);

    // Nạp dữ liệu cấu hình thực tế từ file backup dịch vụ/gói
    await importBackupData();

    // Reset search_path to public because backup sql sets it to empty
    await pool.query('SET search_path TO public;');

    await seedRoomsAndEquipment();
    await seedVouchers(adminId);
    await seedSchedules({ leTanId, bacSiId, ktvUsers });
    await seedFeedback(customerUsers);

    console.log('✅ Seed dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
  } finally {
    pool.end();
  }
};

runSeed();

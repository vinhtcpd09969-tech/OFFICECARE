import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- BẮT ĐẦU THIẾT LẬP LẠI VÀ CHÈN MỚI DỮ LIỆU ---');

  try {
    // Phase 1: Disable trigger & Clean transactions
    console.log('Phase 1: Đang vô hiệu hóa trigger bảo mật giao dịch...');
    try {
      await pool.query('ALTER TABLE giao_dich_thanh_toan DISABLE TRIGGER trg_protect_giao_dich_thanh_toan');
    } catch (e: any) {
      console.log('Thông báo: Không thể tắt trigger (có thể không tồn tại):', e.message);
    }

    console.log('Phase 1: Đang dọn dẹp các bảng giao dịch cũ...');
    await prisma.giao_dich_thanh_toan.deleteMany();
    await prisma.hoa_don.deleteMany();
    await prisma.danh_gia_goi_dich_vu.deleteMany();
    await prisma.danh_gia_nhan_su.deleteMany();
    await prisma.chi_dinh_buoi.deleteMany();
    await prisma.nhat_ky_buoi_dieu_tri.deleteMany();
    await prisma.cuoc_hen.deleteMany();
    await prisma.phac_do_dieu_tri.deleteMany();
    await prisma.tam_giu_cho.deleteMany();
    await prisma.lich_truc_nhan_su.deleteMany();
    await prisma.bai_viet.deleteMany();

    console.log('Phase 1: Đang dọn dẹp hồ sơ chuyên gia và tài khoản chuyên gia cũ...');
    await prisma.ho_so_chuyen_gia.deleteMany();
    // Delete only users with roles 3 (KTV) and 4 (Doctor)
    await prisma.nguoi_dung.deleteMany({
      where: {
        vai_tro_id: { in: [3, 4] }
      }
    });

    console.log('Phase 1: Đang dọn dẹp danh mục gói và các gói cũ...');
    await prisma.goi_dich_vu.deleteMany();
    await prisma.danh_muc_goi.deleteMany();

    // Reseed Categories
    console.log('Phase 2: Đang khởi tạo lại danh mục gói...');
    await prisma.danh_muc_goi.createMany({
      data: [
        { id: 'd1000000-0000-0000-0000-000000000001', ten_danh_muc: 'Khám & Lượng Giá Chuyên Sâu', mo_ta: 'Khám tầm soát cột sống, lượng giá vận động cổ vai gáy cùng Bác sĩ Chuyên khoa.', loai_goi_ap_dung: 'KHAM' },
        { id: 'd1000000-0000-0000-0000-000000000002', ten_danh_muc: 'Trị Liệu Giải Quyết Cơn Đau', mo_ta: 'Các gói lẻ điện xung, laser, sóng xung kích điều trị các cơ co cứng cấp tính.', loai_goi_ap_dung: 'LE' },
        { id: 'd1000000-0000-0000-0000-000000000003', ten_danh_muc: 'Phục Hồi Chức Năng Chuyên Sâu', mo_ta: 'Liệu trình vật lý trị liệu kết hợp phục hồi chức năng chuyên sâu cột sống, cổ tay.', loai_goi_ap_dung: 'LIEU_TRINH' },
      ]
    });

    // Reseed Gói Khám (KHAM) - Giữ 1 gói duy nhất
    console.log('Phase 2: Đang chèn Gói khám lâm sàng...');
    await prisma.goi_dich_vu.create({
      data: {
        id: 'c1000000-0000-0000-0000-000000000000',
        ten_goi: 'Khám lâm sàng & Lượng giá chức năng cơ xương khớp',
        loai_goi: 'KHAM',
        tong_so_buoi: 1,
        thoi_luong_phut: 30,
        don_gia: BigInt(150000),
        don_gia_theo_buoi: BigInt(150000),
        anh_goi: '/goi/images/kham_sang_loc.png',
        anh_gallery: ['/goi/images/kham_sang_loc.png', '/images/physio_premium_facility.png'],
        danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000001',
        muc_tieu: 'Xác định chính xác nguyên nhân gốc rễ gây đau cơ xương khớp cấp và mạn tính.\nLượng hóa mức độ suy giảm chức năng vận động cột sống.\nPhát hiện sớm các dấu hiệu thoát vị đĩa đệm, thoái hóa khớp tiềm ẩn.\nXây dựng lộ trình trị liệu phục hồi chức năng khoa học, không dùng thuốc.\nTư vấn thay đổi tư thế làm việc công thái học (Ergonomics) tại văn phòng.',
        quy_trinh: 'Đo chỉ số sinh tồn và khai thác bệnh sử chi tiết của bệnh nhân (thói quen sinh hoạt, tư thế làm việc).\nBác sĩ trực tiếp thăm khám lâm sàng vùng cột sống cổ, vai gáy, thắt lưng.\nLượng giá chức năng sinh học vận động, đo tầm vận động (ROM) của các khớp.\nKiểm tra các điểm đau lệch trục cơ thể và các bất thường về tư thế (gù lưng, vai lệch).\nLập phác đồ điều trị phục hồi chức năng cá nhân hóa phù hợp với mức độ tổn thương.',
        trang_thai: 'hoat_dong'
      }
    });

    // Seed 5 Gói Lẻ (LE) cho dân văn phòng (Không có bước khám)
    console.log('Phase 2: Đang chèn các gói lẻ mới tối ưu cho dân văn phòng...');
    await prisma.goi_dich_vu.createMany({
      data: [
        {
          id: 'c1000000-0000-0000-0000-000000000101',
          ten_goi: 'Giải cơ sâu và nhiệt trị liệu cổ vai gáy (Deep Tissue & Thermotherapy)',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 45,
          don_gia: BigInt(350000),
          don_gia_theo_buoi: BigInt(350000),
          anh_goi: '/goi/images/giai_co_sau.png',
          anh_gallery: ['/goi/images/giai_co_sau.png', '/images/therapist_treatment.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          muc_tieu: 'Giải tỏa tức thì tình trạng co thắt, xơ hóa các nhóm cơ thang, cơ nâng vai.\nKích thích tuần hoàn máu vi mạch, giảm axit lactic tích tụ gây mỏi cơ.\nGiảm nhanh cơn đau mỏi ê ẩm bả vai gáy do ngồi máy tính liên tục.\nMang lại cảm giác nhẹ nhõm, thư giãn vùng vai gáy ngay sau buổi trị liệu.',
          quy_trinh: 'Nhiệt trị liệu hồng ngoại làm ấm, giãn nở mạch máu và làm mềm cơ nông vùng cổ vai gáy (15 phút).\nKỹ thuật viên thực hiện các động tác trị liệu giải cơ sâu bằng tay giải tỏa xơ cứng màng cơ (20 phút).\nTác động sâu giải phóng các nút thắt cơ (Trigger Points) gây đau bả vai và đau đầu (10 phút).',
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000102',
          ten_goi: 'Di động khớp cột sống giải tỏa áp lực đĩa đệm (Joint Mobilization)',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 30,
          don_gia: BigInt(400000),
          don_gia_theo_buoi: BigInt(400000),
          anh_goi: '/images/therapist_treatment.png',
          anh_gallery: ['/images/therapist_treatment.png', '/images/therapist_treatment_banner.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          muc_tieu: 'Mở rộng khe khớp, giải phóng chèn ép rễ thần kinh nhẹ.\nTăng tiết dịch khớp bôi trơn đầu xương, giảm ma sát gây đau khi xoay lưng/cổ.\nKhôi phục biên độ vận động tự nhiên của đốt sống thắt lưng và đốt sống cổ.\nCải thiện tình trạng kẹt khớp cơ học do ngồi thụ động ở văn phòng.',
          quy_trinh: 'Kỹ thuật viên thực hiện massage khởi động làm mềm mô mềm xung quanh đốt sống bị kẹt (10 phút).\nChuyên gia thực hiện kỹ thuật di động khớp (Joint Mobilization) giải kẹt khớp cơ học bằng lực tay y khoa chuyên biệt (15 phút).\nThao tác kéo giãn cột sống thụ động nhẹ nhàng phục hồi khe khớp (5 phút).',
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000103',
          ten_goi: 'Điện xung trị liệu giải co thắt cơ lưng (Electrotherapy & EMS)',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 20,
          don_gia: BigInt(200000),
          don_gia_theo_buoi: BigInt(200000),
          anh_goi: '/images/physio_treatment_room.png',
          anh_gallery: ['/images/physio_treatment_room.png', '/images/physio_premium_facility.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          muc_tieu: 'Ức chế đường truyền cảm giác đau lên hệ thần kinh trung ương.\nKích thích co cơ nhẹ nhàng nhịp nhàng, tăng cường thải trừ chất gây đau cơ.\nGiải tỏa căng cơ thắt lưng dưới cấp tính và mạn tính do ngồi lâu.\nHỗ trợ giảm viêm cơ mỏi cơ sâu mà kỹ thuật tay thông thường khó tác động.',
          quy_trinh: 'Lựa chọn và dán các tấm bản cực điện cực y khoa tại vùng cơ lưng dưới bị co thắt (5 phút).\nVận hành máy điện xung phát dòng TENS/EMS ức chế dẫn truyền cảm giác đau (15 phút).\nLau sạch và massage nhẹ thư giãn cơ vùng dán điện cực (2 phút).',
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000104',
          ten_goi: 'Trị liệu Laser công suất cao tiêu viêm rễ thần kinh (High-Intensity Laser)',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 15,
          don_gia: BigInt(300000),
          don_gia_theo_buoi: BigInt(300000),
          anh_goi: '/goi/images/laser_tri_lieu.png',
          anh_gallery: ['/goi/images/laser_tri_lieu.png', '/images/recovery_journey.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          muc_tieu: 'Laser bước sóng đơn sắc năng lượng cao thâm nhập sâu vào các mô cơ khớp bị viêm.\nTiêu viêm nhanh vùng rễ thần kinh cổ/lưng gây đau và tê bì tay chân.\nKích thích tế bào tăng sinh ATP, thúc đẩy quá trình tự lành tổn thương sâu.\nGiảm sưng tấy đau nhức tại các bao gân khuỷu tay hoặc cổ tay.',
          quy_trinh: 'Bệnh nhân và chuyên gia đeo kính bảo hộ chuyên dụng bảo vệ võng mạc (3 phút).\nDùng đầu quét Laser cao tần rà quét đều trên vùng rễ thần kinh hoặc bao gân bị viêm (10 phút).\nKiểm tra phản ứng nhiệt da và bôi kem làm dịu da vùng quét (2 phút).',
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000105',
          ten_goi: 'Trị liệu sóng xung kích Focused Shockwave giải xơ cơ (Trigger Points)',
          loai_goi: 'LE',
          tong_so_buoi: 1,
          thoi_luong_phut: 20,
          don_gia: BigInt(350000),
          don_gia_theo_buoi: BigInt(350000),
          anh_goi: '/goi/images/song_xung_kich.png',
          anh_gallery: ['/goi/images/song_xung_kich.png', '/images/physio_premium_facility.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000002',
          muc_tieu: 'Phá vỡ các mô xơ cơ (trigger points) lâu ngày vùng vai gáy và mông.\nThúc đẩy sản sinh mạch máu mới, tăng cường tưới máu phục hồi mô cơ.\nTái khởi động cơ chế tự chữa lành tự nhiên của các vùng tổn thương mạn tính.\nGiảm nhanh cơn đau nhói sâu trong bả vai bắp đùi.',
          quy_trinh: 'Thoa gel siêu âm chuyên dụng dẫn truyền sóng xung kích cơ học lên da (2 phút).\nĐi máy sóng xung kích bắn tập trung vào các điểm xơ hóa cơ, điểm bám gân mạn tính (15 phút).\nVệ sinh sạch lớp gel dẫn và massage nhẹ làm dịu mô mềm (3 phút).',
          trang_thai: 'hoat_dong'
        }
      ]
    });

    // Seed 4 Gói Liệu trình (LIEU_TRINH) cho dân văn phòng (Không có bước khám)
    console.log('Phase 2: Đang chèn các gói liệu trình mới chuyên biệt...');
    await prisma.goi_dich_vu.createMany({
      data: [
        {
          id: 'c1000000-0000-0000-0000-000000000201',
          ten_goi: 'Liệu trình Chuyên sâu Phục hồi Cổ Vai Gáy Văn phòng (Office Tech-Neck Rehab)',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 7,
          thoi_luong_phut: 60,
          don_gia: BigInt(2200000),
          don_gia_theo_buoi: BigInt(314285),
          anh_goi: '/images/therapist_treatment.png',
          anh_gallery: ['/images/therapist_treatment.png', '/goi/images/giai_co_sau.png', '/images/recovery_journey.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000003',
          muc_tieu: 'Chấm dứt hoàn toàn cơn đau mỏi âm ỉ vùng cổ vai gáy mạn tính của dân văn phòng.\nGiải phóng chèn ép rễ thần kinh cổ, triệt tiêu tê bì lan dọc hai tay.\nTăng cường tuần hoàn máu não, đẩy lùi cơn đau đầu vận mạch, hoa mắt, mất ngủ.\nKhôi phục biên độ vận động cổ (xoay, gập, ngửa cổ linh hoạt).',
          quy_trinh: 'Chiếu hồng ngoại nhiệt trị liệu làm mềm cơ bắp vùng cổ vai gáy (15 phút).\nGiải cơ sâu Myofascial Release bằng tay tác động trực tiếp lên trigger points cơ thang, cơ nâng vai (25 phút).\nĐiện xung y khoa kết hợp siêu âm trị liệu tiêu viêm rễ thần kinh cổ (20 phút).\nHướng dẫn thực hiện bài tập tự giãn cơ bả vai tại bàn làm việc (5 phút).',
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000202',
          ten_goi: 'Liệu trình Giải áp Cột sống Thắt lưng & Tái định hình tư thế (Lower Back & Posture Alignment)',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 10,
          thoi_luong_phut: 75,
          don_gia: BigInt(3500000),
          don_gia_theo_buoi: BigInt(350000),
          anh_goi: '/images/recovery_journey.png',
          anh_gallery: ['/images/recovery_journey.png', '/images/physio_treatment_room.png', '/images/physio_premium_facility.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000003',
          muc_tieu: 'Tạo áp suất âm đĩa đệm, hút nhân nhầy thoát vị co hồi nhẹ về vị trí cũ.\nGiải chèn ép thần kinh tọa, chấm dứt đau buốt từ thắt lưng lan xuống chân.\nTăng sức mạnh nhóm cơ core thắt lưng bụng giữ cột sống vững vàng khi ngồi làm việc.\nĐiều chỉnh tư thế lưng gù vai lệch, tái lập trục tư thế thẳng tự nhiên.',
          quy_trinh: 'Kéo giãn cột sống giảm áp lực đĩa đệm bằng giường kéo giãn kỹ thuật số áp lực âm (20 phút).\nTrị liệu Laser công suất cao tiêu viêm rễ thần kinh cột sống thắt lưng (15 phút).\nBài tập vận động trị liệu Kinetic Rehab phục hồi cơ lõi core lưng bụng và cơ mông (35 phút).\nKỹ thuật viên nắn chỉnh di động khớp thắt lưng bằng tay giải kẹt khớp (5 phút).',
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000203',
          ten_goi: 'Liệu trình Phục hồi Cổ tay & Bàn tay linh hoạt (Carpal Tunnel & Wrist Rehab)',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 5,
          thoi_luong_phut: 45,
          don_gia: BigInt(1400000),
          don_gia_theo_buoi: BigInt(280000),
          anh_goi: '/images/therapist_treatment_banner.png',
          anh_gallery: ['/images/therapist_treatment_banner.png', '/goi/images/laser_tri_lieu.png', '/images/recovery_journey.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000003',
          muc_tieu: 'Giải chèn ép thần kinh giữa trong ống cổ tay.\nTrị dứt điểm tê bì ngón tay cái, ngón trỏ và ngón giữa do gõ phím liên tục.\nKhôi phục lực cầm nắm, sức mạnh cơ ngón tay và cổ tay.\nPhòng ngừa xơ cứng gân gấp ngón tay (hội chứng ngón tay lò xo).',
          quy_trinh: 'Siêu âm trị liệu vùng bao gân cổ tay giúp giảm sưng viêm rãnh thần kinh giữa (15 phút).\nKỹ thuật viên thực hiện nắn chỉnh di động các khớp xương cổ tay giải ép cơ học bằng tay (20 phút).\nBài tập Kinetic tăng sức mạnh cơ cẳng tay và ngón tay phục hồi sự linh hoạt cầm nắm (10 phút).',
          trang_thai: 'hoat_dong'
        },
        {
          id: 'c1000000-0000-0000-0000-000000000204',
          ten_goi: 'Liệu trình Điều chỉnh Tư thế và Cân bằng cơ toàn diện (Posture & Kinetic Core Rehab)',
          loai_goi: 'LIEU_TRINH',
          tong_so_buoi: 12,
          thoi_luong_phut: 60,
          don_gia: BigInt(4200000),
          don_gia_theo_buoi: BigInt(350000),
          anh_goi: '/images/physio_premium_facility.png',
          anh_gallery: ['/images/physio_premium_facility.png', '/goi/images/song_xung_kich.png', '/images/therapist_treatment.png'],
          danh_muc_goi_id: 'd1000000-0000-0000-0000-000000000003',
          muc_tieu: 'Khắc phục hoàn toàn tư thế lệch vai, vai tròn, đầu nhô phía trước do dùng máy tính nhiều.\nPhục hồi sự cân bằng cơ đối kháng (cân bằng giữa cơ ngực trước và cơ bả vai sau).\nTái lập thói quen tư thế đúng cho cột sống khi ngồi và đứng làm việc.\nTăng dung tích thở của lồng ngực bị hạn chế do tư thế gù vai khép ngực.',
          quy_trinh: 'Giải cơ sâu giải phóng các nhóm cơ ngực lớn, cơ chéo cổ trước bị co rút ngắn (20 phút).\nTập Kinetic Rehab chuyên sâu kéo giãn và tăng sức mạnh cơ bả vai sau, cơ lưng trên (30 phút).\nBài tập chuyên biệt chỉnh tư thế đầu nhô ra trước (Forward Head Posture) và vai tròn (Rounded Shoulders) (10 phút).',
          trang_thai: 'hoat_dong'
        }
      ]
    });

    // Phase 3: Expert Database Reconstruction (Bác sĩ & Kỹ thuật viên)
    console.log('Phase 3: Đang chèn tài khoản các Chuyên gia...');
    const hash = '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu'; // admin123

    // Insert Users (Bác sĩ id: 5,6. KTV id: 7,8,9,10)
    await prisma.nguoi_dung.createMany({
      data: [
        {
          id: 5,
          ho_ten: 'BS. CKI Nguyễn Minh Đức',
          email: 'duc.nguyen@officecare.vn',
          so_dien_thoai: '0901000105',
          mat_khau_hash: hash,
          vai_tro_id: 4,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/nhan_su/images/dr_nguyen_van_a.png'
        },
        {
          id: 6,
          ho_ten: 'BS. Trần Thị Thu Trang',
          email: 'trang.tran@officecare.vn',
          so_dien_thoai: '0901000106',
          mat_khau_hash: hash,
          vai_tro_id: 4,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/nhan_su/images/dr_tran_thi_b.png'
        },
        {
          id: 7,
          ho_ten: 'KTV. Lê Văn Dương',
          email: 'duong.le@officecare.vn',
          so_dien_thoai: '0901000107',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/nhan_su/images/ktv_le_van_c.png'
        },
        {
          id: 8,
          ho_ten: 'KTV. Nguyễn Thùy Linh',
          email: 'linh.nguyen@officecare.vn',
          so_dien_thoai: '0901000108',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/nhan_su/images/ktv_pham_thi_d.png'
        },
        {
          id: 9,
          ho_ten: 'KTV. Phạm Thành Nam',
          email: 'nam.pham@officecare.vn',
          so_dien_thoai: '0901000109',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/nhan_su/images/ktv_le_van_c.png'
        },
        {
          id: 10,
          ho_ten: 'KTV. Đặng Minh Anh',
          email: 'anh.dang@officecare.vn',
          so_dien_thoai: '0901000110',
          mat_khau_hash: hash,
          vai_tro_id: 3,
          trang_thai: 'hoat_dong',
          anh_dai_dien: '/nhan_su/images/ktv_pham_thi_d.png'
        }
      ]
    });

    console.log('Phase 3: Đang tạo hồ sơ chi tiết cho các Chuyên gia...');
    await prisma.ho_so_chuyen_gia.createMany({
      data: [
        {
          id: 1,
          nguoi_dung_id: 5,
          so_nam_kinh_nghiem: 12,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Bác sĩ Chuyên khoa I PHCN - ĐH Y Dược TP.HCM\nChứng nhận đào tạo Trị liệu thần kinh cột sống Chiropractic y khoa Singapore\nChứng chỉ hành nghề Phục hồi chức năng cơ xương khớp Bộ Y tế cấp',
            images: ['/nhan_su/images/cert_assess.png', '/nhan_su/images/cert_physio.png']
          }),
          mo_ta: 'Bác sĩ Nguyễn Minh Đức là chuyên gia hàng đầu về cơ xương khớp cột sống với hơn 12 năm kinh nghiệm thực tế. Từng công tác tại các chuyên khoa Phục hồi chức năng lớn, ông nổi tiếng với phương pháp khám cơ sinh học vận động sâu sắc, tìm ra chính xác trục lệch cột sống do ngồi sai tư thế. Bác sĩ Đức đã trực tiếp xây dựng phác đồ phục hồi không dùng thuốc cho hơn 2.000 bệnh nhân văn phòng gặp tình trạng thoát vị đĩa đệm lưng và thoái hóa cột sống cổ, giúp họ giải thoát khỏi cơn đau mạn tính dai dẳng, khôi phục chất lượng cuộc sống cao.',
          the_manh: ['Trị liệu thoát vị đĩa đệm thắt lưng', 'Khám lượng giá sinh cơ học cột sống', 'Điều trị Chiropractic y khoa', 'Thiết lập phác đồ PHCN cá nhân hóa']
        },
        {
          id: 2,
          nguoi_dung_id: 6,
          so_nam_kinh_nghiem: 8,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Thạc sĩ Vật lý trị liệu & PHCN - Đại học Y Hà Nội\nChứng chỉ kỹ thuật Laser siêu cao tần và Shockwave hội tụ chuẩn Quốc tế\nChứng chỉ hành nghề Chuyên môn vật lý trị liệu Bộ Y tế cấp',
            images: ['/nhan_su/images/cert_assess.png', '/nhan_su/images/cert_physio.png']
          }),
          mo_ta: 'Bác sĩ Trần Thị Thu Trang sở hữu chuyên môn vững vàng trong điều trị các bệnh lý đau mỏi vai gáy cấp và mạn tính của dân công sở. Với 8 năm kinh nghiệm chuyên sâu, bà luôn áp dụng sáng tạo các công nghệ y học vật lý như Laser công suất cao tiêu viêm sâu và sóng xung kích Shockwave phá vỡ các điểm xơ cơ (Trigger Points), mang lại hiệu quả giảm đau tức thì cho bệnh nhân mà không gây đau buốt hay cần can thiệp xâm lấn.',
          the_manh: ['Trị liệu hội chứng cổ vai gáy mạn tính', 'Tiêu viêm rễ thần kinh bằng Laser', 'Sóng xung kích giải trigger points', 'Phục hồi chấn thương bả vai']
        },
        {
          id: 3,
          nguoi_dung_id: 7,
          so_nam_kinh_nghiem: 6,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Cử nhân Vật lý trị liệu - Đại học Y Dược TP.HCM\nChứng chỉ kỹ thuật di động khớp khớp cột sống Manual Therapy tiêu chuẩn Úc',
            images: ['/nhan_su/images/cert_physio.png']
          }),
          mo_ta: 'Kỹ thuật viên Lê Văn Dương được mệnh danh là chuyên gia có đôi tay vàng trong trị liệu giải phóng cơ khớp. Với 6 năm kinh nghiệm thực hành trị liệu bằng tay (Manual Therapy) và di động khớp chuyên sâu, anh giúp bệnh nhân khôi phục hoàn toàn biên độ vận động của các khớp đốt sống cổ và thắt lưng bị kẹt do tư thế làm việc gù ngồi kéo dài.',
          the_manh: ['Kỹ thuật di động khớp Manual Therapy', 'Giải cơ sâu Myofascial Release', 'Nắn khớp thắt lưng giải kẹt', 'Xoa bóp cơ học y khoa sâu']
        },
        {
          id: 4,
          nguoi_dung_id: 8,
          so_nam_kinh_nghiem: 5,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Cử nhân Vật lý trị liệu - PHCN Đại học Y Dược\nChứng chỉ bài tập y khoa phục hồi vận động Kinetic Rehab do Hội PHCN cấp',
            images: ['/nhan_su/images/cert_assess.png']
          }),
          mo_ta: 'Kỹ thuật viên Nguyễn Thùy Linh chuyên trách vận động trị liệu chủ động. Cô có hơn 5 năm kinh nghiệm đồng hành cùng bệnh nhân thực hiện các bài tập Kinetic phục hồi tư thế, tăng cơ lõi core lưng bụng. Cô đặc biệt mát tay trong điều trị bảo tồn hội chứng ống cổ tay cho dân IT, thiết kế đồ họa và kế toán.',
          the_manh: ['Vận động trị liệu Kinetic Rehab', 'Phục hồi hội chứng ống cổ tay', 'Hướng dẫn tập chỉnh lệch tư thế', 'Kéo giãn cơ co rút sâu']
        },
        {
          id: 5,
          nguoi_dung_id: 9,
          so_nam_kinh_nghiem: 4,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Chứng chỉ Kỹ thuật viên Vật lý trị liệu Trường Cao đẳng Y tế\nChứng chỉ Vận hành máy trị liệu công nghệ cao Bệnh viện Chợ Rẫy',
            images: ['/nhan_su/images/cert_physio.png']
          }),
          mo_ta: 'Kỹ thuật viên Phạm Thành Nam là chuyên gia vận hành thiết bị vật lý trị liệu hiện đại. Anh chịu trách nhiệm chính điều phối giường kéo giãn cột sống giảm áp áp lực âm kỹ thuật số, cài đặt thông số điện xung giảm đau mỏi lưng dưới. Sự chu đáo và theo dõi thông số chuẩn xác của anh giúp bệnh nhân phục hồi cực kỳ an tâm.',
          the_manh: ['Vận hành máy kéo giãn giảm áp', 'Cài đặt điện xung y khoa', 'Siêu âm bao gân trị liệu', 'Theo dõi thông số an toàn thiết bị']
        },
        {
          id: 6,
          nguoi_dung_id: 10,
          so_nam_kinh_nghiem: 4,
          bang_cap_chung_chi: JSON.stringify({
            text: 'Chứng chỉ Kỹ thuật viên Massage trị liệu y học cổ truyền\nChứng chỉ trị liệu giải phóng màng cơ myofascial sâu Viện PHCN',
            images: ['/nhan_su/images/cert_assess.png']
          }),
          mo_ta: 'Kỹ thuật viên Đặng Minh Anh chuyên sâu về trị liệu giải cơ ngực lớn, cơ chéo cổ trước và phục hồi thẩm mỹ tư thế vai tròn gù lưng. Cô áp dụng nhuần nhuyễn sự kết hợp lực tay mềm mại, ấn huyệt kích hoạt lưu thông máu vùng vai cổ giúp bệnh nhân xua tan căng thẳng thể chất lẫn tinh thần sau ngày làm việc bận rộn.',
          the_manh: ['Điều chỉnh vai tròn gù lưng', 'Giải tỏa cơ co thắt ngực/cổ', 'Massage bấm huyệt trị liệu', 'Giãn cơ sâu thư giãn vùng gáy']
        }
      ]
    });

    // Reset sequences for auto-increments
    await pool.query("SELECT setval('nguoi_dung_id_seq', (SELECT MAX(id) FROM nguoi_dung));");
    await pool.query("SELECT setval('ho_so_chuyen_gia_id_seq', (SELECT MAX(id) FROM ho_so_chuyen_gia));");

    // Phase 4: Create SEO-Optimized Articles
    console.log('Phase 4: Đang chèn 10 bài viết chuẩn SEO chất lượng cao...');

    const articles = [
      // 1. Sức khỏe
      {
        tieu_de: 'Tác hại khôn lường của ngồi sai tư thế đối với dân văn phòng',
        slug: 'tac-hai-ngoi-sai-tu-the-dan-van-phong',
        tom_tat: 'Ngồi làm việc liên tục 8 tiếng sai tư thế tàn phá cột sống thắt lưng và cổ vai gáy của bạn như thế nào? Tìm hiểu ngay tác hại khôn lường và cách khắc phục hiệu quả.',
        danh_muc: 'suc_khoe',
        trang_thai: 'xuat_ban',
        meta_title: 'Tác hại khôn lường của ngồi sai tư thế đối với dân văn phòng',
        meta_description: 'Ngồi sai tư thế khi làm việc 8 tiếng tàn phá cột sống nghiêm trọng. Tìm hiểu các tác hại khôn lường và phương pháp phục hồi cột sống hiệu quả tại OfficeCare.',
        meta_keywords: 'ngồi sai tư thế, đau cột sống, dân văn phòng, thoái hóa cột sống, phục hồi chức năng',
        anh_bia: '/images/physio_hero.png',
        nguoi_viet_id: 1, // Admin
        ngay_dang: new Date(),
        noi_dung: `
          <p>Hơn 80% nhân viên văn phòng gặp các vấn đề về cơ xương khớp do thói quen ngồi làm việc liên tục trước máy tính mà không chú ý đến tư thế đúng. Việc này không chỉ gây ra những cơn mỏi mệt tạm thời mà còn dẫn đến các bệnh lý thoái hóa nghiêm trọng.</p>
          
          <h2>1. Cột sống bị tàn phá do ngồi sai tư thế như thế nào?</h2>
          <p>Khi ngồi gù lưng hoặc nhô đầu về phía trước, trọng lượng đầu tác động lên cột sống cổ tăng gấp 2-3 lần thông thường. Lâu ngày, các đĩa đệm giữa các đốt sống bị ép lệch tâm, dẫn đến thoát vị đĩa đệm, chèn ép rễ thần kinh gây đau đớn và tê bì tay chân.</p>
          
          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_hero.png" alt="Mô phỏng cột sống cổ chịu áp lực khi ngồi sai tư thế" />
          
          <h2>2. Những hội chứng phổ biến nhất ở giới công sở</h2>
          <ul>
            <li><strong>Hội chứng Tech-Neck (Cổ công nghệ):</strong> Do nhô đầu ra trước quá nhiều để nhìn màn hình, cơ cổ sau bị căng giãn quá mức và xơ cứng.</li>
            <li><strong>Đau thắt lưng cơ năng:</strong> Do ngồi thụ động trên ghế không hỗ trợ cột sống, cơ core thắt lưng yếu dẫn đến toàn bộ trọng lượng dồn lên đĩa đệm thắt lưng.</li>
            <li><strong>Hội chứng ống cổ tay:</strong> Cổ tay bị tì đè liên tục lên mặt bàn hoặc chuột máy tính làm chèn ép dây thần kinh giữa.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Khách hàng tập phục hồi chức năng cột sống thắt lưng tại OfficeCare" />

          <h2>3. Giải pháp khắc phục hiệu quả tại OfficeCare</h2>
          <p>Tại OfficeCare, chúng tôi áp dụng phác đồ điều trị <strong>không dùng thuốc - không phẫu thuật</strong>, kết hợp kỹ thuật trị liệu bằng tay giải cơ sâu điểm xơ cơ và các bài tập phục hồi tư thế Kinetic Core. Nếu bạn đang có dấu hiệu đau mỏi kéo dài, hãy liên hệ ngay với chúng tôi để được Bác sĩ lượng giá cột sống cổ và thắt lưng kịp thời.</p>
        `
      },
      {
        tieu_de: 'Chế độ dinh dưỡng và sinh hoạt tối ưu cho hệ xương khớp dẻo dai',
        slug: 'dinh-duong-sinh-hoat-xuong-khop-deo-dai',
        tom_tat: 'Duy trì hệ xương khớp khỏe mạnh cho dân công sở bằng chế độ ăn giàu canxi, vitamin D và thói quen vận động thông minh tại bàn làm việc.',
        danh_muc: 'suc_khoe',
        trang_thai: 'xuat_ban',
        meta_title: 'Dinh dưỡng và sinh hoạt tối ưu giúp xương khớp dẻo dai',
        meta_description: 'Chế độ dinh dưỡng giàu canxi, vitamin D kết hợp thói quen sinh hoạt khoa học là chìa khóa duy trì hệ xương khớp dẻo dai cho dân công sở.',
        meta_keywords: 'dinh dưỡng xương khớp, canxi, vitamin d, dân văn phòng, đau xương khớp',
        anh_bia: '/images/physio_premium_facility.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Xương khớp dẻo dai không chỉ đến từ việc tập luyện mà còn phụ thuộc lớn vào nguồn dinh dưỡng nạp vào hàng ngày và lối sống năng động. Với giới văn phòng thường xuyên làm việc trong máy lạnh, thiếu ánh nắng mặt trời, việc bổ sung vi chất là vô cùng cần thiết.</p>

          <h2>1. Nhóm chất dinh dưỡng vàng cho đĩa đệm và sụn khớp</h2>
          <p>Đĩa đệm cột sống có cấu trúc ngậm nước, do đó uống đủ từ 2-2.5 lít nước mỗi ngày giúp giữ đĩa đệm luôn căng phồng đàn hồi. Bên cạnh đó, các thực phẩm giàu Omega-3 (cá hồi, hạt chia), Canxi (sữa, rau màu xanh đậm) và Vitamin D3-K2 giúp tối ưu hóa mật độ xương, giảm viêm cơ bắp.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Không gian thư giãn bổ sung vi chất sức khỏe tại OfficeCare" />

          <h2>2. Tăng cường vận động chủ động tại văn phòng</h2>
          <p>Tránh ngồi liên tục quá 60 phút. Cứ mỗi giờ làm việc, bạn nên đứng dậy thực hiện vài động tác xoay cổ, nghiêng sườn hoặc đi lại lấy nước. Hoạt động này kích thích sản sinh dịch khớp, bôi trơn các đầu sụn khớp ngăn ngừa thoái hóa sớm.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment.png" alt="Chuyên gia xoa bóp trị liệu giúp tuần hoàn máu lưu thông tốt hơn" />

          <h2>3. Lượng giá và chăm sóc xương khớp định kỳ</h2>
          <p>Định kỳ thăm khám và lượng giá tầm vận động cơ xương khớp giúp phát hiện sớm các điểm lệch cơ sinh học trước khi chúng phát triển thành đau nhức cấp tính. OfficeCare cung cấp gói tầm soát cột sống ban đầu giúp bạn có cái nhìn tổng quan về hệ cơ xương khớp của mình.</p>
        `
      },
      // 2. Điều trị
      {
        tieu_de: 'Trị liệu giải cơ sâu - Khắc tinh của đau vai gáy mãn tính',
        slug: 'tri-lieu-giai-co-sau-dau-vai-gay-man-tinh',
        tom_tat: 'Giải thích nguyên lý khoa học của trị liệu giải cơ sâu (Myofascial Release) trong việc giải phóng các nút thắt cơ đau nhức bả vai ở dân văn phòng.',
        danh_muc: 'dieu_tri',
        trang_thai: 'xuat_ban',
        meta_title: 'Trị liệu giải cơ sâu - Giải pháp đau vai gáy mãn tính',
        meta_description: 'Trị liệu giải cơ sâu Myofascial Release tác động vào điểm xơ cơ bả vai, chấm dứt ngay tình trạng đau mỏi cổ vai gáy mãn tính cho dân văn phòng.',
        meta_keywords: 'giải cơ sâu, myofascial release, đau vai gáy, trigger points, trị liệu bằng tay',
        anh_bia: '/goi/images/giai_co_sau.png',
        nguoi_viet_id: 5, // Bác sĩ Minh Đức
        ngay_dang: new Date(),
        noi_dung: `
          <p>Đau vai gáy mạn tính là nỗi ám ảnh thường trực của dân công sở. Dù đã massage thông thường nhưng cảm giác đau nhức vẫn quay lại sau vài ngày. Đó là do các nút thắt xơ hóa (trigger points) nằm sâu bên dưới màng cơ chưa được giải tỏa hoàn toàn.</p>

          <h2>1. Trị liệu giải cơ sâu Myofascial Release là gì?</h2>
          <p>Khác với massage thư giãn bề mặt, trị liệu giải cơ sâu là kỹ thuật trị liệu bằng tay chuyên khoa. Kỹ thuật viên sẽ sử dụng lực ngón tay và cùi chỏ tác động sâu, liên tục vào lớp màng bao bọc cơ (fascia) bị co thắt, hóa cứng để phá vỡ các nút thắt xơ, phục hồi độ đàn hồi tự nhiên của bó cơ.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/goi/images/giai_co_sau.png" alt="Kỹ thuật viên thực hiện giải cơ sâu vai gáy bằng tay" />

          <h2>2. Tác dụng vượt trội của giải cơ sâu tại OfficeCare</h2>
          <ul>
            <li><strong>Chấm dứt đau nhức tận gốc:</strong> Giải phóng hoàn toàn các sợi cơ bị căng cứng, trả lại trạng thái thư giãn ban đầu.</li>
            <li><strong>Tăng lưu lượng tuần hoàn máu:</strong> Loại bỏ các chất thải chuyển hóa tích tụ trong cơ, giúp máu mang oxy nuôi dưỡng tế bào cơ tốt hơn.</li>
            <li><strong>Khôi phục tầm vận động cổ:</strong> Giúp cổ xoay, nghiêng dễ dàng không còn bị giới hạn biên độ.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment.png" alt="Khách hàng trải nghiệm buổi giải cơ nhiệt trị liệu chuyên nghiệp" />

          <h2>3. Quy trình thực hiện chuẩn y khoa</h2>
          <p>Mỗi ca giải cơ sâu tại OfficeCare đều được chườm nóng hồng ngoại trước để làm mềm mô cơ nông. Sau đó KTV mới thực hiện giải cơ bằng tay và kết hợp tập vận động kéo giãn chủ động. Phác đồ này giúp tối đa hiệu quả giảm đau mà không gây bầm tím tổn thương mô mềm.</p>
        `
      },
      {
        tieu_de: 'Điều trị thoát vị đĩa đệm không phẫu thuật bằng giường kéo giãn giảm áp cột sống',
        slug: 'dieu-tri-thoat-vi-dia-dem-giuong-keo-gian-giam-ap',
        tom_tat: 'Phương pháp kéo giãn giảm áp cột sống bằng giường áp lực âm kỹ thuật số giúp co hồi đĩa đệm thoát vị, giải ép rễ thần kinh an toàn và hiệu quả.',
        danh_muc: 'dieu_tri',
        trang_thai: 'xuat_ban',
        meta_title: 'Kéo giãn giảm áp cột sống trị thoát vị đĩa đệm',
        meta_description: 'Phương pháp kéo giãn cột sống áp lực âm kỹ thuật số tại OfficeCare giúp phục hồi thoát vị đĩa đệm nhẹ và vừa không cần phẫu thuật.',
        meta_keywords: 'kéo giãn cột sống, thoát vị đĩa đệm, giải áp cột sống, giảm đau lưng, vật lý trị liệu',
        anh_bia: '/images/physio_treatment_room.png',
        nguoi_viet_id: 5,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Thoát vị đĩa đệm thắt lưng là hậu quả nghiêm trọng của việc ngồi quá lâu và sai tư thế kéo dài. Rất nhiều người lo lắng phải can thiệp phẫu thuật đau đớn. Tuy nhiên, y học hiện đại đã chứng minh phương pháp kéo giãn giảm áp cột sống có thể điều trị bảo tồn hiệu quả đến 90% các ca bệnh nhẹ và trung bình.</p>

          <h2>1. Nguyên lý cơ học của giường kéo giãn giảm áp cột sống</h2>
          <p>Khi cột sống thắt lưng được kéo giãn nhẹ nhàng với lực kéo được tính toán tự động bằng máy tính dựa trên cân nặng của bệnh nhân, khoảng cách giữa các đốt sống sẽ được mở rộng ra. Quá trình này tạo nên một áp suất âm bên trong đĩa đệm, giúp hút nhân nhầy thoát vị co hồi ngược trở lại vị trí ban đầu.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_treatment_room.png" alt="Hệ thống giường kéo giãn giảm áp thắt lưng tại OfficeCare" />

          <h2>2. Lợi ích của phương pháp kéo giãn giảm áp cột sống</h2>
          <ul>
            <li><strong>Giải phóng chèn ép rễ thần kinh:</strong> Giảm tê bì chân và mông nhanh chóng.</li>
            <li><strong>Tăng cường dinh dưỡng đĩa đệm:</strong> Tạo điều kiện cho oxy, nước và chất dinh dưỡng thấm sâu phục hồi nhân nhầy đĩa đệm.</li>
            <li><strong>An toàn tuyệt đối:</strong> Lực kéo được cá nhân hóa hoàn toàn qua phần mềm y khoa, không gây đau buốt cho người bệnh.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Bác sĩ thăm khám theo dõi thông số kéo giãn đĩa đệm" />

          <h2>3. Liệu trình kết hợp tại OfficeCare</h2>
          <p>Tại OfficeCare, chúng tôi không chỉ kéo giãn cơ học mà còn kết hợp chiếu tia Laser công suất cao để tiêu viêm rễ thần kinh cấp tốc và hướng dẫn các bài tập phục hồi nhóm cơ core giữ vững cột sống lâu dài sau điều trị.</p>
        `
      },
      // 3. Tin tức
      {
        tieu_de: 'OfficeCare khai trương phòng trị liệu và phục hồi chức năng Kinetic Rehab cao cấp',
        slug: 'officecare-khai-truong-phong-tri-lieu-kinetic-rehab',
        tom_tat: 'OfficeCare Premium Rehab chính thức khai trương cơ sở mới, mang đến không gian sang trọng cùng công nghệ phục hồi chức năng vận động Kinetic tối tân nhất.',
        danh_muc: 'tin_tuc',
        trang_thai: 'xuat_ban',
        meta_title: 'Khai trương phòng trị liệu OfficeCare Kinetic Rehab cao cấp',
        meta_description: 'OfficeCare Premium Rehab khai trương cơ sở mới với không gian đẳng cấp, trang thiết bị tối tân chuyên sâu phục hồi cơ xương khớp cho giới văn phòng.',
        meta_keywords: 'officecare khai trương, phòng khám vật lý trị liệu, phục hồi chức năng, quận 1',
        anh_bia: '/images/physio_clinic_villa.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Với mục tiêu nâng tầm chất lượng dịch vụ chăm sóc sức khỏe xương khớp chủ động, OfficeCare chính thức khai trương trung tâm phục hồi chức năng cao cấp chuẩn Premium Rehab tại trung tâm thành phố. Đây hứa hẹn là địa chỉ tin cậy chăm sóc sức khỏe cho giới tri thức và nhân viên văn phòng bận rộn.</p>

          <h2>1. Không gian trị liệu Premium biệt lập và đẳng cấp</h2>
          <p>Được thiết kế theo phong cách tối giản xanh, tinh tế và riêng tư, cơ sở mới của OfficeCare xóa tan cảm giác ngột ngạt của bệnh viện truyền thống. Khách hàng đến khám và trị liệu sẽ được tận hưởng không gian thư thái, biệt lập để vừa phục hồi cột sống vừa tái tạo năng lượng tinh thần.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_clinic_villa.png" alt="Toàn cảnh không gian villa phòng khám cao cấp OfficeCare" />

          <h2>2. Đầu tư công nghệ phục hồi chức năng hàng đầu thế giới</h2>
          <p>Phòng khám được trang bị đầy đủ các máy móc y khoa hiện đại nhất như: Máy sóng xung kích Focused Shockwave, Laser công suất cao thế hệ mới nhất và hệ thống giường kéo giãn kỹ thuật số tự động cân bằng lực kéo. Giúp tối đa hóa hiệu quả giảm đau, đẩy nhanh tiến trình hồi phục của mô cơ khớp bị tổn thương.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Thiết bị máy móc hiện đại tại phòng tập phục hồi chức năng" />

          <h2>3. Đội ngũ chuyên gia bác sĩ tận tâm chuyên nghiệp</h2>
          <p>Đến với cơ sở mới, khách hàng sẽ được trực tiếp thăm khám và lên phác đồ bởi các Bác sĩ chuyên khoa I PHCN và thực hiện kỹ thuật bởi các Kỹ thuật viên tốt nghiệp Đại học Y Dược có tay nghề cao, tận tâm chu đáo.</p>
        `
      },
      {
        tieu_de: 'Xu hướng phục hồi chức năng chủ động: Bước tiến mới trong chăm sóc sức khỏe năm 2026',
        slug: 'xu-huong-phuc-hoi-chuc-nang-chu-dong-nam-2026',
        tom_tat: 'Thay vì lạm dụng thuốc giảm đau gây hại dạ dày, phục hồi chức năng chủ động thông qua trị liệu tay và vận động y khoa đang trở thành lối sống lành mạnh mới.',
        danh_muc: 'tin_tuc',
        trang_thai: 'xuat_ban',
        meta_title: 'Xu hướng phục hồi chức năng cơ xương khớp chủ động 2026',
        meta_description: 'Phục hồi chức năng chủ động không dùng thuốc, không phẫu thuật đang là xu hướng bảo vệ xương khớp văn phòng bền vững nhất hiện nay.',
        meta_keywords: 'phục hồi chức năng chủ động, không dùng thuốc, cơ xương khớp văn phòng, xu hướng sức khỏe',
        anh_bia: '/images/therapist_treatment.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Trong năm 2026, nhận thức của người dân, đặc biệt là giới văn phòng tri thức về sức khỏe cơ xương khớp đã dịch chuyển mạnh mẽ. Thay vì chờ đến khi đau nặng mới uống thuốc hay phẫu thuật, xu hướng chăm sóc sức khỏe chủ động từ sớm đang dần lên ngôi.</p>

          <h2>1. Tại sao không nên lạm dụng thuốc giảm đau?</h2>
          <p>Các loại thuốc giảm đau kháng viêm nhanh chỉ tạm thời làm lu mờ cảm giác đau nhức nhưng không giải quyết được nguyên nhân gốc rễ là sự lệch cơ và chèn ép cơ học cột sống. Hơn nữa, dùng thuốc kéo dài tàn phá niêm mạc dạ dày, gây suy giảm chức năng gan, thận nghiêm trọng.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment.png" alt="Trị liệu bằng tay thay thế phương án sử dụng thuốc giảm đau" />

          <h2>2. Phục hồi chức năng chủ động là gì?</h2>
          <p>Đây là sự kết hợp giữa các tác nhân vật lý (laser, xung điện), các kỹ thuật giải cơ nắn khớp bằng tay của chuyên gia để giải quyết điểm đau cơ học, đồng thời người bệnh được tập luyện các bài tập phục hồi y khoa Kinetic để chủ động củng cố hệ cơ, ngăn ngừa đau quay lại.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Khách hàng tập phục hồi vận động chủ động cùng huấn luyện viên" />

          <h2>3. OfficeCare đi đầu trong xu hướng phục hồi chủ động</h2>
          <p>Chúng tôi tự hào mang đến các gói liệu trình được nghiên cứu chuyên biệt cho giới văn phòng Việt Nam, chú trọng giáo dục tư thế đúng và theo dõi hành trình hồi phục tự nhiên một cách toàn diện nhất.</p>
        `
      },
      // 4. Khuyến mãi
      {
        tieu_de: 'Chương trình OfficeCare Companion: Giải pháp nâng tầm sức khỏe doanh nghiệp công nghệ',
        slug: 'chuong-trinh-officecare-companion-suc-khoe-doanh-nghiep',
        tom_tat: 'Gói chăm sóc cột sống toàn diện tại văn phòng cho các công ty công nghệ và tài chính, giúp nâng cao năng suất và giữ chân nhân tài.',
        danh_muc: 'khuyen_mai',
        trang_thai: 'xuat_ban',
        meta_title: 'OfficeCare Companion - Giải pháp sức khỏe doanh nghiệp',
        meta_description: 'OfficeCare Companion cung cấp dịch vụ khám tầm soát xương khớp và ưu đãi lớn cho các gói tập thể của doanh nghiệp công nghệ, tài chính.',
        meta_keywords: 'sức khỏe doanh nghiệp, officecare companion, tầm soát cột sống, chăm sóc sức khỏe nhân viên',
        anh_bia: '/images/physio_clinic_villa.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Nhân sự ngồi nhiều, đau vai gáy và nghỉ ốm thường xuyên là bài toán đau đầu của nhiều doanh nghiệp công nghệ, tài chính hiện nay. Chương trình <strong>OfficeCare Companion</strong> ra đời để mang giải pháp phục hồi chức năng xương khớp cao cấp đến tận văn phòng của bạn.</p>

          <h2>1. Tầm soát cột sống miễn phí tại văn phòng doanh nghiệp</h2>
          <p>OfficeCare phối hợp tổ chức các buổi Workshop chia sẻ kiến thức tư thế ngồi đúng, kết hợp hoạt động tầm soát cột sống cổ và thắt lưng miễn phí bằng các chuyên gia y tế cho toàn bộ nhân viên trong công ty đối tác.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_clinic_villa.png" alt="Workshop tầm soát sức khỏe xương khớp tại doanh nghiệp công nghệ" />

          <h2>2. Chiết khấu đặc quyền cho gói liệu trình tập thể</h2>
          <p>Các doanh nghiệp đăng ký chương trình Companion sẽ nhận được mức chiết khấu độc quyền lên đến 25% cho toàn bộ nhân sự khi mua các gói liệu trình trị liệu đau vai gáy, thoát vị đĩa đệm thắt lưng hay hội chứng ống cổ tay tại hệ thống phòng khám OfficeCare.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Trải nghiệm trị liệu cao cấp cho nhân viên doanh nghiệp đối tác" />

          <h2>3. Nâng cao năng suất và hạnh phúc nhân viên</h2>
          <p>Nhân viên khỏe mạnh, không còn đau nhức mỏi cổ vai gáy sẽ làm việc tập trung hơn, nâng cao hiệu suất công việc rõ rệt và gắn kết bền vững hơn với doanh nghiệp.</p>
        `
      },
      {
        tieu_de: 'Quà tặng đặc quyền: Miễn phí 100% gói khám lâm sàng ban đầu cho nhân viên văn phòng',
        slug: 'mien-phi-goi-kham-lam-sang-ban-dau-van-phong',
        tom_tat: 'Chào đón tháng mới, OfficeCare gửi tặng 50 suất miễn phí khám lâm sàng ban đầu trị giá 150.000đ dành riêng cho nhân sự khối văn phòng.',
        danh_muc: 'khuyen_mai',
        trang_thai: 'xuat_ban',
        meta_title: 'Miễn phí khám lâm sàng cột sống cổ vai gáy OfficeCare',
        meta_description: 'Nhận ngay đặc quyền ưu đãi miễn phí 100% gói khám lâm sàng ban đầu với Bác sĩ PHCN chuyên sâu cho nhân viên văn phòng. Số lượng có hạn!',
        meta_keywords: 'miễn phí gói khám, khám cột sống miễn phí, officecare ưu đãi, đau vai gáy khám ở đâu',
        anh_bia: '/goi/images/kham_sang_loc.png',
        nguoi_viet_id: 1,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Bạn có đang phải chịu đựng những cơn mỏi cổ vai gáy âm ỉ khi gõ phím? Đừng bỏ qua cơ hội vàng để hiểu rõ tình trạng cột sống của mình hoàn toàn miễn phí cùng đội ngũ bác sĩ hàng đầu tại OfficeCare Premium Rehab.</p>

          <h2>1. Nội dung gói khám lâm sàng được tài trợ 100%</h2>
          <p>Gói khám ban đầu trị giá 150.000đ bao gồm đầy đủ các bước khám lâm sàng chuyên sâu:</p>
          <ul>
            <li>Bác sĩ kiểm tra tầm vận động xoay, cúi nghiêng cột sống cổ và thắt lưng.</li>
            <li>Lượng giá sức mạnh nhóm cơ bả vai và cơ liên sườn.</li>
            <li>Phát hiện các điểm lệch trục vai, gù lưng vai tròn gây mất thẩm mỹ tư thế.</li>
            <li>Thiết lập phác đồ trị liệu khoa học phù hợp riêng cho thể trạng từng người.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/goi/images/kham_sang_loc.png" alt="Bác sĩ khám lâm sàng cột sống cổ cho khách hàng văn phòng" />

          <h2>2. Điều kiện áp dụng chương trình khuyến mãi</h2>
          <p>Chương trình áp dụng cho tất cả khách hàng mới đăng ký qua website hoặc hotline, có mang theo thẻ nhân viên văn phòng hoặc chứng minh công việc văn phòng khi đến thăm khám tại OfficeCare.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_premium_facility.png" alt="Không gian tiếp đón sang trọng hiện đại tại OfficeCare" />

          <h2>3. Đăng ký nhận ưu đãi cực kỳ đơn giản</h2>
          <p>Chỉ cần nhấp vào nút "Đặt lịch hẹn" tại thanh menu, điền thông tin và nhập mã "KHAMFREE2026" để nhận ngay đặc quyền khám miễn phí từ bác sĩ của chúng tôi.</p>
        `
      },
      // 5. Phòng ngừa
      {
        tieu_de: '5 bài tập giãn cơ tại chỗ cực đơn giản giúp ngăn ngừa gù lưng vai tròn',
        slug: '5-bai-tap-gian-co-ngan-ngua-gu-lung-vai-tron',
        tom_tat: 'Dành ra 3 phút mỗi ngày thực hiện các bài tập giãn cơ ngực, cơ cổ vai gáy ngay tại ghế làm việc giúp bảo vệ tư thế chuẩn thẳng đẹp.',
        danh_muc: 'phong_ngua',
        trang_thai: 'xuat_ban',
        meta_title: '5 bài tập giãn cơ tại chỗ ngừa gù lưng vai tròn cho dân công sở',
        meta_description: 'Thực hành ngay 5 bài tập giãn cơ tại chỗ ngay tại văn phòng giúp thư giãn vai gáy và ngăn ngừa hội chứng gù lưng vai tròn hiệu quả.',
        meta_keywords: 'giãn cơ tại chỗ, bài tập gù lưng, phòng ngừa đau vai gáy, bài tập văn phòng, giãn cơ vai gáy',
        anh_bia: '/images/recovery_journey.png',
        nguoi_viet_id: 6, // Bác sĩ Thu Trang
        ngay_dang: new Date(),
        noi_dung: `
          <p>Hội chứng vai tròn gù lưng (Rounded Shoulders) khiến bạn mất đi dáng vẻ tự tin và là nguồn cơn của đau vai gáy mạn tính. Hãy thực hành ngay 5 bài tập giãn cơ y khoa đơn giản ngay tại bàn làm việc để giữ cột sống luôn thẳng đẹp.</p>

          <h2>Bài 1: Giãn cơ ngực lớn chống gù vai</h2>
          <p>Đan hai tay ra sau gáy, từ từ mở rộng khuỷu tay sang hai bên và ưỡn ngực ra trước. Giữ trong 15 giây, lặp lại 3 lần. Bài tập này kéo giãn cơ ngực lớn đang bị co ngắn do gõ phím.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Kỹ thuật viên hướng dẫn bài tập giãn cơ bả vai" />

          <h2>Bài 2: Kéo giãn cơ thang nghiêng cổ</h2>
          <p>Ngồi thẳng ghế, tay phải vòng qua đầu đặt lên tai trái nhẹ nhàng nghiêng đầu sang bên phải cho đến khi cảm thấy cơ cổ trái căng nhẹ. Giữ 15 giây và đổi bên.</p>

          <h2>Bài 3: Bài tập rụt cằm (Chin Tuck) sửa đầu nhô</h2>
          <p>Nhìn thẳng về phía trước, đặt ngón tay lên cằm và đẩy nhẹ cằm ra phía sau giống như tạo cằm đôi (không cúi đầu). Giữ 5 giây rồi thả lỏng. Thực hiện 10 lần.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/therapist_treatment_banner.png" alt="Khách hàng tự thực hành giãn cơ cổ vai gáy theo hướng dẫn chuyên khoa" />

          <h2>Bài 4: Xoay bả vai mở rộng lồng ngực</h2>
          <p>Đặt các đầu ngón tay lên bả vai cùng bên, xoay khủyu tay theo vòng tròn rộng từ trước ra sau 10 lần giúp khôi phục biên độ vận động của khớp vai bả vai.</p>

          <h2>Tập luyện chủ động định kỳ cùng chuyên gia</h2>
          <p>Nếu bạn đã tập các bài tập trên nhưng vẫn cảm thấy cơ bị bó chặt cứng đau mỏi kéo dài, hãy đến ngay OfficeCare để được chuyên gia nắn chỉnh cơ học và hướng dẫn bài tập chuyên sâu thiết kế riêng cho tư thế của bạn.</p>
        `
      },
      {
        tieu_de: 'Hướng dẫn phòng ngừa hội chứng ống cổ tay cho lập trình viên và kế toán',
        slug: 'huong-dan-phong-ngua-hoi-chung-ong-co-tay',
        tom_tat: 'Tê bì ngón cái và ngón trỏ là biểu hiện ban đầu của hội chứng ống cổ tay. Xem ngay hướng dẫn đặt bàn tay đúng chuẩn khoa học để phòng tránh bệnh.',
        danh_muc: 'phong_ngua',
        trang_thai: 'xuat_ban',
        meta_title: 'Cách phòng ngừa hội chứng ống cổ tay hiệu quả cho lập trình viên',
        meta_description: 'Bí quyết đặt tay gõ phím đúng chuẩn công thái học ngăn ngừa hội chứng ống cổ tay tê bì ngón tay cho lập trình viên và kế toán viên.',
        meta_keywords: 'hội chứng ống cổ tay, tê bì tay, chuột công thái học, dân văn phòng phòng ngừa bệnh',
        anh_bia: '/images/physio_treatment_room.png',
        nguoi_viet_id: 6,
        ngay_dang: new Date(),
        noi_dung: `
          <p>Hội chứng ống cổ tay (Carpal Tunnel Syndrome) rất phổ biến ở những người sử dụng máy tính tần suất cao như lập trình viên, kế toán viên và thiết kế đồ họa. Tổn thương này xảy ra do dây thần kinh giữa bị đè nén liên tục khi đi qua ống cổ tay chật hẹp.</p>

          <h2>1. Nhận diện sớm dấu hiệu chèn ép thần kinh cổ tay</h2>
          <p>Nếu bạn có cảm giác tê buốt như kim châm ở ngón tay cái, ngón trỏ và ngón giữa, đặc biệt là tê nhiều hơn vào ban đêm hoặc khi cầm vô lăng lái xe, cầm điện thoại lâu - đó chính là dấu hiệu cảnh báo dây thần kinh cổ tay của bạn đang bị tổn thương.</p>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/physio_treatment_room.png" alt="Khám sàng lọc tầm soát chèn ép thần kinh cổ tay" />

          <h2>2. Nguyên tắc công thái học (Ergonomics) bảo vệ cổ tay</h2>
          <ul>
            <li><strong>Giữ cổ tay luôn thẳng:</strong> Tránh gập cổ tay lên hoặc xuống quá mức khi gõ phím. Sử dụng đệm nâng đỡ cổ tay nếu cần.</li>
            <li><strong>Sử dụng chuột dọc công thái học:</strong> Chuột công thái học giúp bàn tay xoay nghiêng tự nhiên như khi bắt tay, giảm triệt để lực xoắn chèn ép ống cổ tay.</li>
            <li><strong>Nghỉ ngơi giãn cơ tay:</strong> Cứ sau 45 phút gõ phím, hãy dành ra 1 phút gập giãn ngược cổ tay và xoay nhẹ khớp cổ tay.</li>
          </ul>

          <img class="w-full max-h-[400px] object-cover rounded-xl my-6 shadow-md" src="/images/recovery_journey.png" alt="Bài tập giãn cơ cổ tay và bắp tay y khoa tại OfficeCare" />

          <h2>3. Giải quyết hội chứng ống cổ tay từ sớm</h2>
          <p>Tại OfficeCare, chúng tôi điều trị hội chứng ống cổ tay nhẹ và trung bình bằng sóng siêu âm y khoa làm giảm sưng bao gân kết hợp di động xương cổ tay bằng tay giúp giải ép dây thần kinh giữa nhanh chóng mà không cần tiêm thuốc hay phẫu thuật.</p>
        `
      }
    ];

    for (const art of articles) {
      await prisma.bai_viet.create({
        data: art
      });
    }

    console.log('Phase 4: Chèn bài viết chuẩn SEO thành công!');

    // Re-enable trigger
    try {
      await pool.query('ALTER TABLE giao_dich_thanh_toan ENABLE TRIGGER trg_protect_giao_dich_thanh_toan');
    } catch (e) {}

    console.log('🎉 🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC THIẾT LẬP LẠI THÀNH CÔNG HÀM SÚC & ĐỦ ĐẦY 🎉 🎉');
  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình reset và seed dữ liệu:', error);
    try {
      await pool.query('ALTER TABLE giao_dich_thanh_toan ENABLE TRIGGER trg_protect_giao_dich_thanh_toan');
    } catch (e) {}
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

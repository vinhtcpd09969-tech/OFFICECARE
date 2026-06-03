const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres:password@localhost:5432/office_care';

const updates = [
  {
    name: 'Khám lượng giá cột sống & tư thế',
    mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện quy trình khám lượng giá gồm 5 bước tiêu chuẩn: (1) Khảo sát tư thế 4 chiều (trước, sau, bên trái, bên phải) bằng bàn dọi định vị để phát hiện lệch vai, lệch chậu, cổ nhô trước hoặc vẹo cột sống; (2) Sử dụng thước đo tầm vận động chuyên dụng đánh giá biên độ gập, duỗi, nghiêng, xoay cột sống; (3) Thực hiện nghiệm pháp Spurling chèn ép cổ, SLR test rễ thần kinh tọa và độ giãn thắt lưng; (4) Sờ chẩn xác định điểm đau nhức và vùng bó cơ co cứng; (5) Kết luận và thiết lập phác đồ trị liệu cá nhân hóa.',
    loai_dich_vu_ho_tro: [
      'Định vị chính xác nguyên nhân gốc rễ gây đau cơ xương khớp, loại trừ các nguy cơ bệnh lý thần kinh cột sống nguy hại.',
      'Phát hiện sớm các sai lệch tư thế vi mô (cổ rùa, lệch hông, bả vai cánh chim) để phòng ngừa thoái hóa sụn khớp sớm.',
      'Thiết lập thông số vận hành nền tảng giúp theo dõi và đánh giá chính xác tiến trình phục hồi qua từng buổi trị liệu.'
    ]
  },
  {
    name: 'Trị liệu Cổ - Vai - Gáy "Khơi Thông Kinh Lạc"',
    mo_ta_chi_tiet: 'Kỹ thuật viên áp dụng liệu pháp kết hợp xoa bóp cơ sâu y khoa và bấm huyệt cổ truyền: (1) Sử dụng kỹ thuật Myofascial Release miết bóc tách cân cơ nông và sâu vùng cơ thang, cơ nâng vai, cơ ức đòn chũm; (2) Bấm huyệt giải tỏa ách tắc các huyệt Phong Trì, Kiên Tỉnh, Đại Chùy, Thiên Tông; (3) Chiếu đèn hồng ngoại hồng ngoại sâu kết hợp đắp thảo dược ấm để làm mềm cơ bắp; (4) Vận động xoay nghiêng cổ thụ động giải tỏa cứng nghẹt khớp cột sống cổ.',
    loai_dich_vu_ho_tro: [
      'Giải phóng tức thì tình trạng căng thắt cơ vai gáy dai dẳng do ít vận động hoặc làm việc máy tính liên tục.',
      'Tăng lưu lượng máu qua động mạch đốt sống thân nền, đẩy lùi cơn đau đầu cơ năng, hoa mắt, chóng mặt và mất ngủ.',
      'Khôi phục hoàn toàn tầm vận động xoay, cúi ngửa của cổ vai gáy, tạo cảm giác nhẹ nhõm tức thì.'
    ]
  },
  {
    name: 'Phục Hồi Đau Lưng - Thoát Vị Đĩa Đệm',
    mo_ta_chi_tiet: 'Quy trình phục hồi cột sống chuyên sâu gồm các bước: (1) Kỹ thuật Deep Tissue giải phóng xơ hóa cơ dựng gai và cơ vuông thắt lưng; (2) Kéo giãn thắt lưng bằng máy giường tự động giải áp theo tải lượng chuẩn; (3) Điện dung siêu âm tần số quét sâu chống phù nề và kháng viêm rễ thần kinh; (4) Di động khớp cột sống thắt lưng phục hồi trượt khớp; (5) Hướng dẫn chi tiết bài tập ổn định cơ lõi thắt lưng chậu phòng tái phát.',
    loai_dich_vu_ho_tro: [
      'Giảm áp lực cơ học nội đĩa đệm, tạo lực hút chân không hỗ trợ nhân nhầy đĩa đệm co hồi giảm chèn ép.',
      'Giải phóng rễ thần kinh tọa, triệt tiêu cơn đau buốt buốt rát từ thắt lưng lan dọc xuống mông và chân.',
      'Thiết lập hệ thống cơ bảo vệ thắt lưng bền vững, nâng đỡ an toàn cho cột sống khi sinh hoạt.'
    ]
  },
  {
    name: 'Giảm Đau Cấp Tốc - Co Thắt Cơ Cấp',
    mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện can thiệp giảm co rút cấp: (1) Xoa bóp vuốt nhẹ làm quen cơ, tránh co thắt phòng vệ; (2) Điện xung trị liệu tần số giảm đau cấp TENS cắt đứt dẫn truyền thần kinh đau; (3) Chườm nóng ẩm thảo dược giãn mạch hoặc chườm đá y khoa cục bộ tùy tình trạng viêm cơ; (4) Kéo giãn cơ thụ động nhẹ nhàng tăng tiến giúp xả áp nhóm cơ đang khóa chặt.',
    loai_dich_vu_ho_tro: [
      'Phong tỏa ngay tín hiệu đau cấp tính lên não bộ, xoa dịu tức thì vùng cơ bị co xoắn dữ dội.',
      'Hóa giải tình trạng khóa cứng lưng/cổ đột ngột sau chấn thương thể thao, mang vác nặng hay ngủ sai tư thế.',
      'Khôi phục khả năng xoay người, vận động cơ bản để đi lại bình thường ngay sau buổi can thiệp đầu tiên.'
    ]
  },
  {
    name: 'Trị liệu Hội Chứng Ống Cổ Tay & Tê Bì',
    mo_ta_chi_tiet: 'Can thiệp chuyên sâu vùng cổ tay: (1) Bóc tách mô liên kết mềm vùng cẳng tay và dải gan tay phá vỡ xơ dính; (2) Siêu âm trị liệu sâu làm mềm bao khớp quanh cổ tay; (3) Áp dụng kỹ thuật di động dây thần kinh giữa giúp thần kinh trượt tự do trong ống cổ tay; (4) Chỉnh trục khớp cổ bàn ngón tay thụ động giảm áp.',
    loai_dich_vu_ho_tro: [
      'Tiêu sưng nề mô đệm và bao gân trong ống cổ tay, giải phóng dây thần kinh giữa khỏi nghẹt cứng.',
      'Xóa bỏ dứt điểm chứng tê rần đầu ngón tay như kiến bò, giảm thiểu nguy cơ teo cơ mô ngón cái.',
      'Phục hồi lực cầm nắm khỏe khoắn, giúp gõ phím di chuột linh hoạt không buốt mỏi cổ tay.'
    ]
  },
  {
    name: 'Trị liệu Đau Nhức Khớp Gối / Khớp Vai',
    mo_ta_chi_tiet: 'Phác đồ liên hoàn cơ khớp: (1) Giải phóng co thắt nhóm cơ lớn hỗ trợ khớp (cơ đùi trước/sau với gối, cơ quanh đai vai với vai); (2) Di động khớp thụ động bậc I-II bôi trơn ổ khớp; (3) Chiếu laser năng lượng cao đẩy nhanh sinh hóa lành sụn vi mô; (4) Bài tập đồng co cơ đẳng trường tăng cường tính vững khớp.',
    loai_dich_vu_ho_tro: [
      'Kích thích tăng tiết dịch ổ khớp tự nhiên để bôi trơn diện khớp, đẩy lùi tiếng kêu lục cục thoái hóa khớp.',
      'Giải tỏa tình trạng xơ dính bao khớp, khôi phục tối đa biên độ vận động dạng khép và gấp duỗi khớp.',
      'Tiêu dịch viêm và sưng nề khớp gối/vai, mang lại những bước đi và chuyển động tay nhẹ nhàng, tự tin.'
    ]
  },
  {
    name: 'Phục Hồi Cơ Bắp Thể Thao Chuyên Sâu',
    mo_ta_chi_tiet: 'Phác đồ xả cơ cho vận động viên: (1) Sử dụng thiết bị trị liệu rung tần số cao giải phóng màng cơ nông; (2) Nhào nặn cơ sâu (Deep Tissue) phá vỡ các liên kết axit lactic ứ đọng; (3) Kéo giãn cơ kỹ thuật PNF kháng lực thụ động kích hoạt đàn hồi cơ; (4) Nén ép áp lực hơi phục hồi tuần hoàn tĩnh mạch; (5) Hướng dẫn bài tập giãn cơ tĩnh chủ động.',
    loai_dich_vu_ho_tro: [
      'Đào thải nhanh chóng axit lactic tích tụ gây đau nhức mỏi cơ sau tập luyện thi đấu cường độ cao.',
      'Giải tỏa căng thắt sợi cơ quá mức, bảo vệ cơ bắp khỏi rách cơ, chuột rút hoặc viêm điểm bám gân.',
      'Khôi phục độ linh hoạt dẻo dai và công suất tối đa của cơ bắp cho buổi tập tiếp theo.'
    ]
  },
  {
    name: 'Điều Trị Thoái Hóa Khớp (Gối/Vai/Háng)',
    mo_ta_chi_tiet: 'Can thiệp chuyên sâu giảm thoái hóa: (1) Chiếu hồng ngoại làm mềm xơ dính bao khớp; (2) Di động diện khớp bóc tách sụn khớp thoái hóa; (3) Tập cơ tứ đầu đùi, cơ mông khớp háng hoặc cơ quay vai kháng lực nhẹ nhàng tăng tiến; (4) Sóng ngắn hoặc thấu nhiệt vi ba tăng tuần hoàn mạch máu quanh khớp.',
    loai_dich_vu_ho_tro: [
      'Tăng sức mạnh hệ cơ nâng đỡ khớp, chia sẻ bớt tải trọng đè nén lên diện sụn khớp bị bào mòn thoái hóa.',
      'Chặn đứng phản ứng viêm thoái hóa và ngăn ngừa gai xương tiến triển qua cân bằng sinh học cơ học khớp.',
      'Cải thiện đáng kể chức năng di chuyển, lên xuống cầu thang hay đứng lên ngồi xuống thoải mái không đau đớn.'
    ]
  },
  {
    name: 'Phục Hồi Sau Chấn Thương / Phẫu Thuật',
    mo_ta_chi_tiet: 'Can thiệp an toàn theo tiêu chuẩn phục hồi y khoa: (1) Kiểm tra vết mổ và đánh giá teo cơ; (2) Massage bóc tách bao xơ sẹo mổ dưới da chống co rút kéo lệch khớp; (3) Di động khớp nhẹ nhàng thụ động ngăn cứng khớp sớm; (4) Điện kích thích cơ liệt chống teo cơ do bó bột hạn chế vận động; (5) Tập thăng bằng và phục hồi cảm thụ bản thể chân khớp.',
    loai_dich_vu_ho_tro: [
      'Phá vỡ tổ chức xơ dính dưới sẹo mổ phẫu thuật, phòng ngừa tối đa xơ cứng bao khớp vĩnh viễn.',
      'Kích hoạt cơ bắp đang suy yếu teo nhỏ trở lại hoạt động bình thường, đẩy nhanh tiến trình hồi phục gấp đôi.',
      'Tái thiết lập hệ thống cảm nhận bản thể thần kinh cơ, giúp bước đi cân bằng tự nhiên không lệch lệch tư thế.'
    ]
  },
  {
    name: 'Trị Liệu & Phục Hồi Chức Năng Thần Kinh',
    mo_ta_chi_tiet: 'Can thiệp chuyên sâu đặc trị thần kinh (sau tai biến, chấn thương cột sống): (1) Đánh giá phản xạ co thắt và trương lực cơ; (2) Áp dụng kỹ thuật PNF kích thích thần kinh cơ tạo thuận mẫu vận động; (3) Hướng dẫn mẫu chuyển động sinh hoạt chức năng cơ bản; (4) Điện xung FES kích thích nhóm cơ liệt co duỗi chủ động.',
    loai_dich_vu_ho_tro: [
      'Kích thích khả năng mềm dẻo thần kinh của não bộ để học lại các chuyển động đã mất sau tai biến.',
      'Điều hòa trương lực cơ hiệu quả, ngăn ngừa co rút gân gập khớp gây biến dạng cong vẹo các chi.',
      'Nâng cao khả năng tự chủ sinh hoạt (đứng, ngồi dậy, tự xúc ăn), mang lại sự tự tin cho người bệnh.'
    ]
  },
  {
    name: 'Trị Liệu Cong Vẹo Cột Sống & Sửa Tư Thế',
    mo_ta_chi_tiet: 'Can thiệp định hình không xâm lấn: (1) Kéo giãn cơ chậu sườn thắt lưng bên lõm, co nhỏ cơ căng giãn bên lồi cột sống vẹo; (2) Tập bài tập Schroth điều hướng không gian 3 chiều; (3) Hướng dẫn kỹ thuật thở xoay chiều sườn mở rộng lồng ngực bị ép lép; (4) Tập thăng bằng trên bóng bosu chỉnh trục vai chậu thẳng hàng.',
    loai_dich_vu_ho_tro: [
      'Nắn chỉnh xoay đốt sống cong vẹo cơ học, giảm đáng kể góc vẹo Cobb cột sống tự nhiên.',
      'Thiết lập lại cân bằng vai chậu ngang bằng, sửa lệch trục xương chậu giúp dáng đi thẳng đẹp.',
      'Giải tỏa lực ép sườn lên phổi, tăng dung tích hô hấp mang lại thể trạng khỏe mạnh, năng động.'
    ]
  },
  {
    name: 'Trải Nghiệm Thư Giãn Wellness Toàn Thân',
    mo_ta_chi_tiet: 'Liệu pháp thư giãn phục hồi hệ bạch huyết: (1) Sử dụng tinh dầu cao cấp kích hoạt hệ khứu giác êm dịu; (2) Massage miết dài Thụy Điển nhẹ nhàng dọc cột sống kích hoạt hệ phó giao cảm; (3) Massage bấm huyệt da đầu giải tỏa căng cứng vỏ não; (4) Ủ đá nóng bazan hoặc chăn thảo dược ấm thải độc tuần hoàn bạch huyết.',
    loai_dich_vu_ho_tro: [
      'Đưa cơ thể về trạng thái tĩnh dưỡng sâu nhất, quét sạch hormone stress cortisol gây căng thẳng mệt mỏi.',
      'Kích thích hệ tuần hoàn bạch huyết hoạt động mạnh mẽ, hỗ trợ cơ thể thanh lọc đào thải độc tố cơ khớp.',
      'Xua tan uể oải tinh thần, cải thiện giấc ngủ sinh lý sâu và đem lại nguồn năng lượng tươi trẻ dồi dào.'
    ]
  },
  {
    name: 'Massage Thư Giãn Phục Hồi',
    mo_ta_chi_tiet: 'Kỹ thuật viên thực hiện xoa bóp, vuốt miết toàn thân nhịp nhàng kết hợp tinh dầu dừa phân đoạn cao cấp giải tỏa cơ nông.',
    loai_dich_vu_ho_tro: [
      'Làm mềm cơ bắp mệt mỏi, xoa dịu các cơn đau cơ nhẹ sau những ngày ngồi làm việc sai tư thế.',
      'Thúc đẩy tuần hoàn máu và đem lại cảm giác nhẹ nhõm, dễ chịu tức thì.'
    ]
  },
  {
    name: 'Giác Hơi Phục Hồi',
    mo_ta_chi_tiet: 'Đặt giác ống thủy tinh nóng y khoa lên vùng cơ thắt lưng và vai dày bằng giác hơi lửa chân không truyền thống.',
    loai_dich_vu_ho_tro: [
      'Tạo lực hút âm tách rời lớp mô liên kết cơ kết dính bóc tách xơ dính cơ lưng sâu rộng.',
      'Tăng lưu lượng tuần hoàn máu cục bộ tiêu ứ huyết, đào thải độc tố tích tụ gây mỏi lưng nặng.'
    ]
  },
  {
    name: 'Trị Liệu Đá Nóng',
    mo_ta_chi_tiet: 'Đặt đá núi lửa bazan giữ nhiệt lâu dọc các huyệt đạo cột sống kết hợp trượt đá nóng làm giãn cơ co rút.',
    loai_dich_vu_ho_tro: [
      'Nhiệt lượng tỏa sâu làm giãn nở toàn bộ mao mạch, giải phóng các thớ cơ co cứng sâu bên trong thắt lưng.',
      'Sưởi ấm cơ thể khí huyết lưu thông tốt, cải thiện giấc ngủ ban đêm và xoa dịu thần kinh nhạy cảm.'
    ]
  },
  {
    name: 'Ngâm Đá Lạnh Phục Hồi',
    mo_ta_chi_tiet: 'Khách hàng ngâm cơ thể hoặc chi dưới trong bể nước đá 8-12 độ C dưới sự giám sát nhịp thở y khoa của Kỹ thuật viên.',
    loai_dich_vu_ho_tro: [
      'Co mạch đột ngột giảm ngay sưng đau cơ viêm cấp do tập luyện thể thao cường độ cao.',
      'Tái lập giãn nở mạch máu mạnh mẽ ngay sau khi kết thúc ngâm, đưa máu tươi giàu oxy nuôi dưỡng cơ.'
    ]
  },
  {
    name: 'Massage Đầu Cổ Vai Gáy',
    mo_ta_chi_tiet: 'Day bấm cục bộ đai vai, cơ thang cổ và xoa bóp cơ da đầu xua tan mỏi đau tức thời.',
    loai_dich_vu_ho_tro: [
      'Giảm căng tức và cứng bả vai gáy do duy trì tư thế cúi gõ phím quá lâu.',
      'Cải thiện tuần hoàn động mạch não bộ, giảm dứt điểm chứng đau đầu do stress mỏi mệt.'
    ]
  },
  {
    name: 'Kéo Giãn Toàn Thân Chuyên Sâu',
    mo_ta_chi_tiet: 'Kỹ thuật viên sử dụng lực kéo cơ học giãn toàn bộ chuỗi cơ sau, cơ liên sườn và khớp chân tay thụ động.',
    loai_dich_vu_ho_tro: [
      'Kéo giãn màng cân cơ bị co rút co cứng, đưa cơ thể về chiều dài sinh lý cân đối.',
      'Tăng tính linh hoạt đàn hồi khớp và phòng ngừa thoái hóa cứng cứng khớp.'
    ]
  },
  {
    name: 'Trị Liệu Tinh Dầu Thư Giãn',
    mo_ta_chi_tiet: 'Massage vuốt lực nhẹ kết hợp tinh dầu oải hương hoặc sả chanh khuếch tán giải tỏa hệ phó giao cảm.',
    loai_dich_vu_ho_tro: [
      'Giải tỏa áp lực căng thẳng tinh thần, kích hoạt trạng thái thư giãn sâu của cơ thể.',
      'Cung cấp dưỡng chất thiên nhiên cao cấp làm dịu và phục hồi tế bào da.'
    ]
  },
  {
    name: 'Xông Phục Hồi Cơ Thể',
    mo_ta_chi_tiet: 'Thư giãn xông hơi ướt 45 độ C cùng tinh chất thảo mộc bạc hà, sả chanh kích hoạt tuyến mồ hôi hoạt động.',
    loai_dich_vu_ho_tro: [
      'Mở rộng lỗ chân lông đào thải muối dư và axit uric tích tụ trong cơ thể.',
      'Làm thông thông thoáng đường hô hấp, làm mềm màng cơ chuẩn bị tốt cho các buổi vận động.'
    ]
  },
  {
    name: 'Massage Chân Phục Hồi',
    mo_ta_chi_tiet: 'Ấn huyệt phản xạ lòng bàn chân kết hợp massage giải co thắt cơ bắp chân và gót chân.',
    loai_dich_vu_ho_tro: [
      'Giảm đau mỏi gót chân gan bàn chân hiệu quả, giảm căng cứng cơ sinh đôi cẳng chân sau.',
      'Kích thích máu tĩnh mạch chi dưới lưu thông mượt mà tránh tê bì phù chân.'
    ]
  },
  {
    name: 'Trị Liệu Ép Phục Hồi Cơ',
    mo_ta_chi_tiet: 'Khách hàng mang ủng nén hơi y khoa, máy ép tự động thực hiện bơm hơi cuộn dọc từ bàn chân lên đùi.',
    loai_dich_vu_ho_tro: [
      'Tạo áp lực hơi ép xả thụ động hỗ trợ tĩnh mạch đẩy chất thải axit lactic ứ đọng đi nhanh hơn gấp 5 lần.',
      'Xóa tan chứng mỏi nặng chân nhanh chóng, thích hợp cho người đi đứng chạy bộ nhiều.'
    ]
  }
];

async function run() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  try {
    await client.connect();
    console.log('Connected to database to migrate clinical descriptions...');
    
    for (const update of updates) {
      const res = await client.query(
        `UPDATE dich_vu 
         SET mo_ta_chi_tiet = $1, 
             loai_dich_vu_ho_tro = $2::jsonb 
         WHERE ten_dich_vu = $3 
         RETURNING id`,
        [update.mo_ta_chi_tiet, JSON.stringify(update.loai_dich_vu_ho_tro), update.name]
      );
      if (res.rowCount > 0) {
        console.log(`Updated clinical data for: "${update.name}"`);
      } else {
        console.warn(`Could not find service named: "${update.name}" to update.`);
      }
    }
    
    console.log('✅ Clinical data migration complete!');
  } catch (e) {
    console.error('❌ Error during clinical data migration:', e);
  } finally {
    await client.end();
  }
}

run();

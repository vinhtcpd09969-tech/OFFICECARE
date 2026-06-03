const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/office_care'
});

const updates = [
  {
    oldName: "Cervical Stretching / Kéo giãn vùng cổ",
    newName: "Kéo giãn cột sống cổ bằng tay",
    desc: "Kỹ thuật viên sử dụng lực tay chuyên môn thực hiện các kỹ thuật kéo giãn dọc trục cột sống cổ, di động nhẹ nhàng nhằm giải áp đĩa đệm vùng cổ vai gáy.",
    benefits: JSON.stringify([
      "Giải phóng chèn ép rễ thần kinh cổ, giảm nhanh chứng đau vai gáy lan xuống cánh tay.",
      "Phục hồi tầm vận động tự nhiên khi xoay, cúi, nghiêng cổ.",
      "Tăng cường lưu thông tuần hoàn máu não bộ, giảm đau đầu chóng mặt do chèn ép mạch."
    ])
  },
  {
    oldName: "Deep Tissue Therapy / Trị liệu cơ sâu",
    newName: "Kỹ thuật giải cơ chuyên sâu",
    desc: "Tác động lực vật lý sâu và chậm dọc theo thớ cơ nông đến cơ sâu, xác định và giải phóng các nút thắt cơ (Trigger Points) gây co cứng dai dẳng.",
    benefits: JSON.stringify([
      "Phá tan các bó cơ co thắt mãn tính, trả lại chiều dài sinh lý tối ưu cho thớ cơ.",
      "Kích thích tuần hoàn máu mang dưỡng chất và oxy đến nuôi dưỡng vùng mô cơ bị xơ hóa.",
      "Giảm nhức mỏi cơ bắp tức thì sau vận động nặng hoặc ngồi làm việc sai tư thế kéo dài."
    ])
  },
  {
    oldName: "Electrotherapy / Điện xung giảm đau",
    newName: "Trị liệu giảm đau bằng dòng điện xung",
    desc: "Dán các điện cực hydrogel y khoa lên vùng cơ đau nhức, sử dụng thiết bị chuyên dụng phát dòng điện xung tần số thấp thích hợp để cắt đứt tín hiệu đau dây thần kinh.",
    benefits: JSON.stringify([
      "Ức chế lập tức đường truyền tín hiệu đau lên não bộ theo cơ chế cổng kiểm soát đau.",
      "Kích thích cơ thể tự giải phóng Endorphin (hormone giảm đau tự nhiên) để xoa dịu vùng tổn thương.",
      "Kích thích tuần hoàn máu sâu giúp tiêu viêm, giảm sưng nề mô mềm cục bộ."
    ])
  },
  {
    oldName: "Exercise Guidance / Hướng dẫn bài tập",
    newName: "Hướng dẫn tập phục hồi chức năng",
    desc: "Bác sĩ hoặc Kỹ thuật viên trực tiếp hướng dẫn khách thực hiện chuẩn xác các bài tập ổn định khớp, kích hoạt cơ lõi yếu và điều chỉnh tư thế đứng/ngồi chuẩn y khoa.",
    benefits: JSON.stringify([
      "Tăng cường sức mạnh và độ bền cho các nhóm cơ hỗ trợ bảo vệ cột sống.",
      "Sửa sai lệch tư thế (gù lưng, cổ rùa, lệch xương chậu) tận gốc.",
      "Duy trì hiệu quả trị liệu lâu dài, ngăn ngừa tái phát cơn đau cơ xương khớp."
    ])
  },
  {
    oldName: "Heat Therapy / Nhiệt trị liệu",
    newName: "Nhiệt trị liệu hồng ngoại",
    desc: "Sử dụng đèn hồng ngoại y khoa chuyên khoa chiếu tia nhiệt trực tiếp lên vùng khớp viêm hoặc thắt lưng đau nhức ở cự ly y khoa tiêu chuẩn.",
    benefits: JSON.stringify([
      "Tác dụng nhiệt nóng sâu làm giãn cơ toàn vùng, loại bỏ tình trạng cứng khớp buổi sáng.",
      "Giãn nở mạch máu ngoại vi, đẩy nhanh tốc độ đào thải độc tố và hấp thụ viêm sưng.",
      "Làm dịu hệ thần kinh nhạy cảm, đem lại cảm giác ấm áp và thư giãn sâu cho khách hàng."
    ])
  },
  {
    oldName: "Joint Mobility / Trị liệu linh hoạt khớp",
    newName: "Kỹ thuật di động khớp tăng biên độ",
    desc: "Áp dụng kỹ thuật trượt khớp cơ học bậc 1-3 theo chuẩn y khoa quốc tế lên các diện khớp bị hạn chế biên độ vận động do xơ hóa dây chằng.",
    benefits: JSON.stringify([
      "Kích thích tăng tiết dịch khớp tự nhiên để bôi trơn diện khớp, giảm ma sát gây thoái hóa.",
      "Mở rộng nhanh biên độ khớp bị giới hạn do viêm bám gân hoặc thoái hóa diện khớp.",
      "Ngăn chặn triệt để nguy cơ dính khớp và xơ cứng bao khớp gây tàn tật."
    ])
  },
  {
    oldName: "Muscle Release / Giải phóng cơ căng",
    newName: "Di động mô mềm giải phóng cơ",
    desc: "Kỹ thuật sử dụng các ngón tay và lòng bàn tay vuốt miết, trượt mô liên kết mềm dọc bó cơ căng thẳng nhằm phá vỡ các điểm kết dính cơ nông.",
    benefits: JSON.stringify([
      "Tháo xoắn cơ tức thì, loại bỏ cảm giác căng tức bứt rứt khó chịu ở cơ bắp.",
      "Phục hồi độ đàn hồi tự nhiên linh hoạt của hệ thống mô mềm quanh khớp.",
      "Tạo cảm giác nhẹ nhõm, thư thái ngay trong buổi trị liệu."
    ])
  },
  {
    oldName: "Piriformis Release / Giải phóng cơ mông",
    newName: "Giải phóng cơ hình lê chuyên sâu",
    desc: "Kỹ thuật ấn bấm chuyên sâu giải phóng căng cơ vùng mông (đặc biệt cơ hình lê - Piriformis) để giảm áp cho dây thần kinh tọa chạy bên dưới cơ mông.",
    benefits: JSON.stringify([
      "Cắt đứt ngay cơn đau tê dọc mông lan xuống đùi và bắp chân (đau thần kinh tọa).",
      "Giảm co thắt sâu vùng hông chậu, khôi phục bước đi linh hoạt vững vàng.",
      "Giải phóng tình trạng mỏi khớp háng khi ngồi làm việc quá lâu một chỗ."
    ])
  },
  {
    oldName: "Shoulder Mobility / Trị liệu linh hoạt vai",
    newName: "Vận động trị liệu khớp vai",
    desc: "Kỹ thuật viên thực hiện các kỹ thuật vận động khớp thụ động và chủ động có trợ giúp khớp vai nhằm khôi phục cơ học xoay vai.",
    benefits: JSON.stringify([
      "Hỗ trợ phá vỡ tổ chức xơ dính quanh bao khớp vai gây đông cứng vai (frozen shoulder).",
      "Giúp khách hàng dễ dàng thực hiện các động tác sinh hoạt như chải đầu, giơ tay cao, gãi lưng.",
      "Giải tỏa chứng đau mỏi vai sâu bứt rứt gây mất ngủ về đêm."
    ])
  },
  {
    oldName: "Spinal Stretching / Kéo giãn cột sống",
    newName: "Kéo giãn cột sống thắt lưng bằng máy",
    desc: "Sử dụng thiết bị kéo giãn cột sống tự động y khoa, cài đặt đai ngực đai chậu và lực kéo kéo - nhả theo chu kỳ phù hợp với trọng lượng cơ thể để giải áp cột sống.",
    benefits: JSON.stringify([
      "Giảm áp suất nội đĩa đệm thắt lưng tối đa, tạo lực hút âm giúp nhân nhầy thoát vị co hồi về vị trí cũ.",
      "Mở rộng các lỗ liên hợp cột sống giải phóng chèn ép rễ thần kinh thắt lưng.",
      "Cắt cơn đau lưng cấp và tê bì chân do thoát vị đĩa đệm gây ra."
    ])
  },
  {
    oldName: "Stretching Therapy / Trị liệu kéo giãn",
    newName: "Kéo giãn cơ toàn thân chủ động",
    desc: "Kỹ thuật viên phối hợp cùng khách thực hiện các chuỗi động tác kéo giãn cơ chuỗi sau, cơ liên sườn và giải áp toàn bộ các khớp chính.",
    benefits: JSON.stringify([
      "Gia tăng độ dẻo dai đàn hồi của toàn bộ hệ thống cơ xương khớp.",
      "Giải phóng chứng đau mỏi tích tụ toàn thân do thói quen ngồi lì làm việc cả ngày.",
      "Tăng cường độ linh hoạt, giúp cơ thể chuyển động nhẹ nhàng thanh thoát."
    ])
  },
  {
    oldName: "Tendon Release / Giải phóng gân cơ",
    newName: "Kỹ thuật giải phóng điểm bám gân",
    desc: "Tác động miết bấm ngang thớ gân cơ bị tổn thương tại khuỷu tay hoặc cổ tay nhằm kích thích tăng sinh tuần hoàn máu tại điểm bám tận của gân.",
    benefits: JSON.stringify([
      "Đặc trị đau mỏi cổ tay, khuỷu tay (Hội chứng ống cổ tay, viêm gân khuỷu tay Tennis Elbow).",
      "Tiêu trừ các điểm viêm dính vi mô quanh bao gân cơ.",
      "Tăng cường lực cầm nắm của bàn tay, giúp gõ phím di chuột không đau nhức."
    ])
  },
  {
    oldName: "Wrist Mobility / Trị liệu linh hoạt cổ tay",
    newName: "Vận động trị liệu khớp cổ tay",
    desc: "Di động nhẹ nhàng và vận động các diện khớp xương nhỏ vùng cổ tay và bàn ngón tay để kéo giãn dây chằng quanh ống cổ tay.",
    benefits: JSON.stringify([
      "Giải phóng chèn ép thần kinh giữa trong hội chứng ống cổ tay.",
      "Khắc phục chứng tê rần, mất cảm giác hoặc đau buốt ngón tay khi làm việc văn phòng.",
      "Khôi phục khả năng xoay gấp cổ tay mượt mà không lục cục."
    ])
  }
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Starting renaming and updating clinical descriptions for dich_vu...');

    // First add column loai_dich_vu_ho_tro or check jsonb benefits
    await client.query(`
      ALTER TABLE dich_vu 
      ADD COLUMN IF NOT EXISTS loai_dich_vu_ho_tro jsonb DEFAULT '[]'::jsonb;
    `);

    for (const update of updates) {
      console.log(`Renaming: "${update.oldName}" -> "${update.newName}"`);
      await client.query(
        `UPDATE dich_vu 
         SET ten_dich_vu = $1, mo_ta_chi_tiet = $2, loai_dich_vu_ho_tro = $3
         WHERE ten_dich_vu = $4`,
        [update.newName, update.desc, update.benefits, update.oldName]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Services database update successful!');

    // Show current names in DB
    const res = await client.query("SELECT ten_dich_vu, loai_dich_vu_ho_tro FROM dich_vu WHERE loai_dich_vu = 'chinh' LIMIT 5");
    console.log('Sample updated services in DB:', res.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during database migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

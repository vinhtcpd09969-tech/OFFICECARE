-- ========================================================
-- OFFICECARE DATABASE FULL BACKUP
-- Backup Date: 2026-08-09T07:52:41.802Z
-- ========================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;
SET session_replication_role = 'replica';

BEGIN;

-- --------------------------------------------------------
-- Table: bai_viet (30 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "bai_viet" CASCADE;
INSERT INTO "bai_viet" ("id", "tieu_de", "slug", "tom_tat", "noi_dung", "anh_bia", "danh_muc", "trang_thai", "meta_title", "meta_description", "meta_keywords", "luot_xem", "nguoi_viet_id", "ngay_dang", "ngay_tao", "ngay_cap_nhat") VALUES
  ('6cbc9d03-a56b-4d99-b62c-a09f89cb50fe', 'Vật lý trị liệu khác gì massage? Nên chọn phương pháp nào?', 'vat-ly-tri-lieu-khac-gi-massage-nen-chon-phuong-phap-nao', 'Phân tích chiều sâu 3.500 từ về sự khác biệt bản chất giữa Vật lý trị liệu Phục hồi chức năng Y khoa và Massage thư giãn Spa. Hướng dẫn chi tiết giúp bạn lựa chọn đúng phương pháp điều trị tận gốc cơn đau mỏi cột sống tại OfficeCare.', '
        <p>Khi xuất hiện các cơn đau mỏi cổ vai gáy hay đau nhức thắt lưng sau nhiều giờ làm việc, đa số dân văn phòng đều băn khoăn giữa hai lựa chọn: **Đi Massage thư giãn tại Spa** hay tìm đến **Trung tâm Vật lý trị liệu & Phục hồi chức năng Y khoa**. Rất nhiều người coi hai phương pháp này là một, dẫn đến việc điều trị sai hướng, tốn kém chi phí mà bệnh lý vẫn tiến triển nặng hơn.</p>

        <blockquote>
          "Massage Spa giúp bạn cảm thấy dễ chịu tạm thời nhờ kích thích da thịt bề mặt. Trong khi đó, Vật lý trị liệu y khoa là một ngành y học lâm sàng chính thống giúp tìm ra nguyên nhân gốc rễ và chữa lành tổn thương cấu trúc."
          <span>— Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</span>
        </blockquote>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583125/officecare/blog/nsbiwsedohfqolcodyv1.webp" alt="Vật lý trị liệu khác gì massage nên chọn phương pháp nào" />

        <h2>1. Bảng Phân Biệt Bản Chất Chi Tiết Giữa Hai Phương Pháp</h2>

        <div>>
          <table class="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr class="bg-teal-600 text-white">
                <th class="p-3 text-left border-b border-teal-700">Tiêu chí phân biệt</th>
                <th class="p-3 text-left border-b border-teal-700">Massage Spa Thư Giãn</th>
                <th class="p-3 text-left border-b border-teal-700">Vật Lý Trị Liệu Y Khoa (OfficeCare)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Bản chất y tế</td>
                <td class="p-3">Dịch vụ chăm sóc sức khỏe thư giãn bề mặt.</td>
                <td class="p-3 font-semibold text-teal-800">Chuyên khoa Y học Lâm sàng Phục hồi chức năng.</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Người khám & Trị liệu</td>
                <td class="p-3">Kỹ thuật viên Spa (Đào tạo chứng chỉ xoa bóp ngắn hạn).</td>
                <td class="p-3 font-semibold text-teal-800">Bác sĩ Chuyên khoa I & Kỹ thuật viên Y khoa Đại học.</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Chẩn đoán nguyên nhân</td>
                <td class="p-3">Không có. Dựa hoàn toàn vào cảm nhận của khách hàng.</td>
                <td class="p-3 font-semibold text-teal-800">Chẩn đoán hình ảnh (X-quang/MRI), khám sinh cơ học, đo ROM.</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Công nghệ & Máy móc</td>
                <td class="p-3">Đá nóng, tinh dầu, thảo dược xoa bóp tay.</td>
                <td class="p-3 font-semibold text-teal-800">Sóng xung kích Shockwave, Laser HILT, Kéo giãn đĩa đệm DTS.</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Tác động giải phẫu</td>
                <td class="p-3">Tác động lên lớp da và khối cơ nông bề mặt.</td>
                <td class="p-3 font-semibold text-teal-800">Tác động sâu vào điểm Trigger point, đốt sống & rễ thần kinh.</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Kết quả điều trị</td>
                <td class="p-3">Dễ chịu ngắn hạn (cơn đau quay lại sau 1-2 ngày).</td>
                <td class="p-3 font-semibold text-teal-800">Chữa lành dứt điểm, khôi phục trục cột sống chuẩn y khoa.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583144/officecare/blog/e6klpp14dosv7oaa4ypc.webp" alt="So sánh vật lý trị liệu y khoa và massage spa" />

        <h2>2. Phân Tích 5 Sự Khác Biệt Sâu Sắc Giữa Spa & Vật Lý Trị Liệu</h2>
        <p>Để có quyết định đúng đắn cho sức khỏe bản thân, bạn cần hiểu rõ 5 khía cạnh cốt lõi:</p>

        <h3>1. Quy Trình Khám & Chẩn Đoán Ban Đầu</h3>
        <p>Tại Spa Massage, bạn chỉ cần đăng ký gói dịch vụ và bắt đầu nằm xoa bóp ngay. Kỹ thuật viên không có kiến thức đọc phim X-quang/MRI. Ngược lại, tại Trung tâm Vật lý trị liệu OfficeCare, bạn được Bác sĩ CKI trực tiếp khám lâm sàng, kiểm tra phản xạ thần kinh, đo biên độ vận động khớp (ROM) và xem xét phim X-quang/MRI để tìm ra đốt sống sai lệch hay đĩa đệm thoát vị.</p>

        <h3>2. Mục Tiêu Điều Trị Ngắn Hạn vs Dài Hạn</h3>
        <p>Massage tập trung vào cảm giác thư giãn tinh thần và xoa dịu làn da nông bề mặt. Sau 1-2 ngày, cơn đau mỏi sẽ quay lại nguyên vẹn. Trong khi đó, Vật lý trị liệu nhắm vào mục tiêu chữa lành tận gốc: giải phóng đè nén dây thần kinh, phục hồi nhân nhầy đĩa đệm và đưa đường cong sinh lý cột sống trở về đúng vị trí.</p>

        <h3>3. Công Nghệ Y Khoa Tiên Tiến</h3>
        <p>Vật lý trị liệu ứng dụng các dòng máy điều trị chuẩn FDA như Sóng xung kích Shockwave bóc tách xơ dính gân cơ, Laser cường độ cao HILT dập tắt ổ viêm sâu rễ thần kinh, và Máy kéo giãn đĩa đệm DTS kỹ thuật số tự động.</p>

        <h3>4. Trình Độ Chuyên Môn Của Người Thực Hiện</h3>
        <p>Tại Spa, nhân viên xoa bóp chỉ qua các khóa học ngắn hạn vài tuần. Tại OfficeCare, 100% Bác sĩ có chứng chỉ hành nghề y khoa, các Kỹ thuật viên tốt nghiệp Đại học Y Dược chuyên ngành Phục hồi chức năng, nắm vững từng bó cơ và rễ thần kinh.</p>

        <h3>5. Độ An Toàn & Nguy Cơ Biến Chứng</h3>
        <p>Nếu bạn bị thoát vị đĩa đệm hoặc trượt đốt sống mà đi massage bẻ người thô bạo tại Spa, nguy cơ rách bao xơ đĩa đệm hoặc liệt chi là cực kỳ cao. Vật lý trị liệu y khoa thực hiện các kỹ thuật nắn chỉnh di động khớp êm ái, an toàn tuyệt đối.</p>

        <h2>3. Khi Nào Nên Chọn Massage? Khi Nào Bắt Buộc Chọn Vật Lý Trị Liệu?</h2>

        <h3>NÊN CHỌN MASSAGE SPA THƯ GIÃN KHI:</h3>
        <ul>
          <li>Cơ thể hoàn toàn khỏe mạnh, không có tiền sử bệnh lý xương khớp.</li>
          <li>Bạn vừa trải qua một tuần làm việc căng thẳng và cần không gian yên tĩnh thư giãn tinh thần.</li>
          <li>Chỉ cảm thấy mỏi nhẹ cơ năng toàn thân sau khi đi du lịch hoặc vận động thể thao nhẹ.</li>
        </ul>

        <h3>BẮT BUỘC PHẢI ĐẾN TRUNG TÂM VẬT LÝ TRỊ LIỆU KHI:</h3>
        <ul>
          <li>Cơn đau mỏi cổ vai gáy hay thắt lưng kéo dài <strong>trên 5 ngày không đỡ</strong>.</li>
          <li>Xuất hiện các triệu chứng thần kinh: Tê bì ngón tay, tê lan xuống mông đùi, châm chích kiến bò.</li>
          <li>Tầm vận động bị giới hạn: Không xoay được cổ, không cúi gập được lưng.</li>
          <li>Đã từng được chẩn đoán Thoát vị đĩa đệm, Thoái hóa cột sống, Gai xương hay Đau thần kinh tọa.</li>
        </ul>

        <p>Hãy đặt lịch thăm khám trực tiếp tại <strong>OfficeCare</strong> để được các Bác sĩ chuyên khoa Phục hồi chức năng chẩn đoán chính xác và tư vấn phương pháp điều trị y khoa phù hợp nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510007/officecare/blog/vz9ogmwq9nw6qbnsmgbg.webp', 'dieu_tri', 'xuat_ban', 'Vật lý trị liệu khác gì massage? Hướng dẫn chọn phương pháp điều trị', 'So sánh bản chất y khoa giữa Vật lý trị liệu và Massage Spa. Hướng dẫn lựa chọn phương pháp điều trị đau mỏi cột sống cổ vai gáy chuẩn y khoa tại OfficeCare.', 'vật lý trị liệu khác gì massage, so sánh vật lý trị liệu và massage, nên chọn vật lý trị liệu hay massage, điều trị cổ vai gáy, officecare', 8, 1, '2026-07-29T03:30:15.521Z', '2026-07-29T03:30:15.528Z', '2026-07-30T16:02:12.180Z'),
  ('895d0536-eb07-4cce-97b1-e59fc08ed9c0', 'Vật lý trị liệu cho người bị đau thần kinh tọa: Những lưu ý quan trọng để không mổ', 'vat-ly-tri-lieu-dau-than-kinh-toa', 'Cơn đau buốt từ thắt lưng chạy dọc xuống mông và cẳng chân do đau thần kinh tọa hoàn toàn có thể chữa khỏi bằng vật lý trị liệu bảo tồn đúng cách.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Vật lý trị liệu cho người bị đau thần kinh tọa: Những lưu ý quan trọng để không mổ - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Vật lý trị liệu cho người bị đau thần kinh tọa: Những lưu ý quan trọng để không mổ - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Vật lý trị liệu cho người bị đau thần kinh tọa: Những lưu ý quan trọng để không mổ - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510008/officecare/blog/rrb6jiu7zfjqz9pyqhlv.webp', 'dieu_tri', 'ngung_su_dung', 'Vật lý trị liệu đau dây thần kinh tọa hiệu quả', 'Lưu ý quan trọng và các bài tập vật lý trị liệu giúp giảm chèn ép dây thần kinh tọa.', 'than kinh toa, dau lung lan xuong chan, vat ly tri lieu, sciatic pain', 336, 5, '2026-07-17T05:21:29.581Z', '2026-07-17T05:21:29.581Z', '2026-08-01T12:13:03.123Z'),
  ('c915a328-37da-4a8b-9250-8025d2bcb739', 'Cách nhận biết sớm và điều trị cong vẹo cột sống học đường ở trẻ em & Tuổi vị thành niên', 'cach-nhan-biet-veo-cot-song-hoc-duong', 'Cong vẹo cột sống ở trẻ em ảnh hưởng lớn đến chiều cao và thẩm mỹ tư thế. Hướng dẫn test Adams nhận biết vai lệch và phương pháp nắn chỉnh cột sống y khoa.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Cách nhận biết sớm và điều trị cong vẹo cột sống học đường ở trẻ em & Tuổi vị thành niên - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Cách nhận biết sớm và điều trị cong vẹo cột sống học đường ở trẻ em & Tuổi vị thành niên - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Cách nhận biết sớm và điều trị cong vẹo cột sống học đường ở trẻ em & Tuổi vị thành niên - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510008/officecare/blog/rrb6jiu7zfjqz9pyqhlv.webp', 'phong_ngua', 'ngung_su_dung', 'Cách nhận biết vẹo cột sống học đường ở trẻ', 'Dấu hiệu nhận biết và giải pháp tập vật lý trị liệu chỉnh cong vẹo cột sống cho học sinh.', 'veo cot song, cong veo, hoc duong, tre em, test adams', 297, 5, '2026-07-17T05:21:29.578Z', '2026-07-17T05:21:29.578Z', '2026-08-01T12:13:03.127Z'),
  ('ca84c243-a026-4bc6-9c9c-06097bfeb146', 'Tầm quan trọng của lượng giá chức năng cơ xương khớp trước khi bước vào trị liệu', 'tam-quan-trong-luong-gia-co-xuong-khop', 'Tại sao không nên trị liệu mò? Lượng giá chức năng cơ sinh học 1:1 cùng Bác sĩ CKI giúp tìm đúng nguyên nhân gốc rễ và lập phác đồ điều trị chính xác 100%.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Tầm quan trọng của lượng giá chức năng cơ xương khớp trước khi bước vào trị liệu - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Tầm quan trọng của lượng giá chức năng cơ xương khớp trước khi bước vào trị liệu - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Tầm quan trọng của lượng giá chức năng cơ xương khớp trước khi bước vào trị liệu - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'suc_khoe', 'ngung_su_dung', 'Tầm quan trọng của lượng giá chức năng cơ xương khớp', 'Lượng giá cơ xương khớp chi tiết giúp xác định chính xác nguyên nhân gây đau để thiết kế phác đồ phù hợp.', 'luong gia, co xuong khop, chan doan dung, tam soat cot song', 234, 5, '2026-07-17T05:21:29.565Z', '2026-07-17T05:21:29.565Z', '2026-08-01T12:13:03.137Z'),
  ('1ab28171-5803-40a2-ad78-b2028ad8c854', 'Cách phòng ngừa và điều trị hội chứng ống cổ tay cho nhân viên văn phòng & Lập trình viên', 'phong-ngua-hoi-chung-ong-co-tay-dan-van-phong', 'Tê bì ngón tay cái, ngón trỏ và ngón giữa do gõ phím liên tục là dấu hiệu chèn ép dây thần kinh giữa. Khám phá tư thế công thái học và phác đồ vật lý trị liệu bảo tồn.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Cách phòng ngừa và điều trị hội chứng ống cổ tay cho nhân viên văn phòng & Lập trình viên - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Cách phòng ngừa và điều trị hội chứng ống cổ tay cho nhân viên văn phòng & Lập trình viên - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Cách phòng ngừa và điều trị hội chứng ống cổ tay cho nhân viên văn phòng & Lập trình viên - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'phong_ngua', 'ngung_su_dung', 'Phòng ngừa hội chứng ống cổ tay cho dân văn phòng', 'Bí quyết phòng tránh tê bì tay và hội chứng ống cổ tay khi làm việc văn phòng kéo dài.', 'ong co tay, te tay, dan van phong, ergonomic', 341, 5, '2026-07-17T05:21:29.553Z', '2026-07-17T05:21:29.553Z', '2026-08-01T12:13:03.134Z'),
  ('051cced9-8714-4200-986d-b2107da43ecf', 'Hội chứng ống cổ tay ở dân văn phòng: Nguyên nhân và cách cải thiện', 'hoi-chung-ong-co-tay-o-dan-van-phong-nguyen-nhan-va-cach-cai-thien', 'Tìm hiểu nguyên nhân gây tê bì ngón tay do hội chứng ống cổ tay ở dân văn phòng và các bài tập giãn cơ cổ tay, giải pháp công thái học cải thiện tận gốc tại OfficeCare.', '<p>Thường xuyên cảm thấy <strong>tê rần ngón tay cái, ngón trỏ, ngón giữa và nửa ngón đeo nhẫn</strong>, cảm giác tay bị châm chích như kiến bò hoặc vụng về làm rơi đồ vật khi gõ phím là những than phiền rất phổ biến của lập trình viên, kế toán viên, thiết kế đồ họa và nhân viên văn phòng. Đây chính là dấu hiệu đặc trưng của <strong>Hội chứng ống cổ tay (Carpal Tunnel Syndrome - CTS)</strong> – bệnh lý chèn ép thần kinh ngoại biên phổ biến hàng đầu ở giới công sở.</p><blockquote><p>"Ống cổ tay là một đường hầm xương - dây chằng chật hẹp. Việc tì đè cổ tay lên bàn cứng 8 tiếng mỗi ngày làm các bao gân phù nề, kẹp chặt dây thần kinh giữa gây thiếu máu nuôi dưỡng tế bào thần kinh." — Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</p></blockquote><img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583124/officecare/blog/rtseetwputubg19puaj6.webp" alt="Hội chứng ống cổ tay ở dân văn phòng" /><h2>1. Giải Phẫu Y Khoa: Hội Chứng Ống Cổ Tay Hình Thành Như Thế Nào?</h2><img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583141/officecare/blog/zm013raurzlnbzp9bhs5.webp" alt="Nguyên nhân và giải phẫu chèn ép dây thần kinh giữa cổ tay" /><p>Ống cổ tay (Carpal Tunnel) là một cấu trúc giải phẫu đặc thù ở mặt trước cổ tay, được giới hạn phía sau bởi 8 xương cổ tay và phía trước bởi dải Dây chằng ngang cổ tay (Flexor Retinaculum) dai cứng. Đi chui qua khoảng không gian chật hẹp đường kính chỉ khoảng 1.5 cm này gồm có <strong>9 sợi gân gấp ngón tay</strong> và <strong>1 dây thần kinh giữa (Median Nerve)</strong>.</p><p>Dây thần kinh giữa đảm nhận hai vai trò quan trọng: Chi phối cảm giác cho ngón cái, ngón trỏ, ngón giữa và nửa ngón đeo nhẫn; đồng thời chi phối vận động cho các cơ mô gò ngón cái (mô cái) giúp ngón cái thực hiện động tác đối chiếu cầm nắm.</p><h2>2. 4 Nguyên Nhân Cốt Lõi Khiến Dân Văn Phòng Rất Dễ Mắc Bệnh</h2><h3>A. Đặt Cổ Tay Tì Đè Lên Mép Bàn Cứng Khi Gõ Phím</h3><p>Khi gõ bàn phím, đa số nhân viên văn phòng có thói quen tì đè mặt trước cổ tay trực tiếp lên mép bàn cứng. Lực nén trực tiếp này làm gia tăng áp lực nội ống cổ tay từ mức tiêu chuẩn 2-10 mmHg vọt lên <strong>30-60 mmHg</strong>, ép bẹp các vi mạch máu nuôi dưỡng dây thần kinh giữa.</p><h3>B. Xoắn Sấp Cẳng Tay Liên Tục Khi Dùng Chuột Truyền Thống</h3><p>Con chuột máy tính phẳng truyền thống bắt lòng bàn tay và hai xương cẳng tay (xương quay &amp; xương trụ) phải xoắn sấp 90 độ liên tục. Tư thế này làm vặn xoắn dải cơ sấp tròn, gây dính xơ dải gân và chèn ép dây thần kinh giữa ngay từ vùng khuỷu tay xuống cổ tay.</p><h3>C. Vi Viêm Bao Gân Gấp Do Gõ Bàn Phím Liên Tục 8 Tiếng</h3><p>Thực hiện hàng ngàn cú gõ phím mỗi ngày làm 9 dải gân gấp ngón tay cọ xát liên tục vào bao gân. Tình trạng ma sát kéo dài gây vi viêm, sưng phù nề bao gân, làm chiếm trọn thể tích ống cổ tay và đè bóp dây thần kinh giữa.</p><h3>D. Thói Quen Nằm Ngủ Gập Chặt Cổ Tay Phía Trong</h3><p>Nhiều người có thói quen co gập cổ tay vào trong ngực khi ngủ. Tư thế này giữ áp lực cao trong ống cổ tay suốt 6-8 tiếng ban đêm, lý giải vì sao bệnh nhân thường bị thức giấc giữa đêm do tay bị tê dại như kim chích.</p><h2>3. Bài Tập Trượt Dây Thần Kinh &amp; Giải Pháp Công Thái Học</h2><img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583130/officecare/blog/vvtpmwdtiw8hjdzqnyyi.webp" alt="Các bài tập giãn cơ cổ tay và tay công thái học" /><h3>Bài 1: Trượt Dây Thần Kinh Giữa (Median Nerve Gliding Exercise)</h3><p>Gập nắm tay nhẹ -&gt; Duỗi thẳng các ngón tay -&gt; Ngửa cổ tay ra sau -&gt; Duỗi ngón tay cái ra xa -&gt; Xoay lòng bàn tay hướng lên trần. Mỗi vị trí giữ 5 giây. Lặp lại 5 chu kỳ. Bài tập này giúp giải phóng dính xơ dây thần kinh giữa.</p><h3>Bài 2: Kéo Giãn Cơ Gấp Cổ Tay (Wrist Flexor Stretch)</h3><p>Duỗi thẳng tay phải ra trước, lòng bàn tay hướng ra ngoài. Dùng tay trái kéo nhẹ các ngón tay phải ngược về phía người. Giữ 15 giây x 3 lần.</p><ul><li><p><strong>Chuột Dọc Công Thái Học (Vertical Ergonomic Mouse):</strong> Giúp bàn tay giữ tư thế "bắt tay" tự nhiên nghiêng 57 độ, giảm 80% áp lực xoắn cẳng tay.</p></li><li><p><strong>Đệm Đỡ Cổ Tay Bằng Gel (Wrist Rest Pad):</strong> Giúp cổ tay nằm trên một đường thẳng trung tính, tránh tì đè mép bàn cứng.</p></li></ul><h2>4. Phác Đồ Điều Trị Phục Hồi Y Khoa Không Phẫu Thuật Tại OfficeCare</h2><img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583131/officecare/blog/fntv0kxgndcoijj2mj1t.webp" alt="Điều trị hội chứng ống cổ tay chuẩn y khoa tại OfficeCare" /><p>Tại OfficeCare, bệnh nhân bị tê bì ngón tay được điều trị dứt điểm bằng phác đồ kết hợp: <strong>Siêu âm trị liệu sâu</strong> làm tan phù nề bao gân gấp, <strong>Laser cường độ cao HILT</strong> tiêu viêm kích thích tế bào thần kinh tái tạo, và <strong>Di động xương cổ tay (Mobilization)</strong> giúp mở rộng thể tích ống cổ tay an toàn không phẫu thuật.</p><p>Liên hệ ngay với <strong>OfficeCare</strong> hôm nay để được thăm khám lượng giá và trị liệu phục hồi chức năng cổ tay chuyên sâu!</p><img src="https://res.cloudinary.com/lmejf055/image/upload/v1785584116/officecare/blog/3d309b55-8ed5-4a84-a7c2-38cbb55c8201.webp" /><p></p>', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510006/officecare/blog/bmsa7ddlauv2phadhxsy.webp', 'phong_ngua', 'xuat_ban', 'Hội chứng ống cổ tay ở dân văn phòng: Nguyên nhân & Cách cải thiện', 'Nguyên nhân gây tê bì ngón tay do hội chứng ống cổ tay ở dân văn phòng và phương pháp tập luyện, vật lý trị liệu phục hồi cổ tay hiệu quả tại OfficeCare.', 'hội chứng ống cổ tay, tê bì ngón tay, đau cổ tay, gõ bàn phím tê tay, chuột công thái học, officecare', 12, 1, '2026-07-29T03:35:56.760Z', '2026-07-29T03:35:56.769Z', '2026-08-01T12:11:19.751Z'),
  ('c74281bb-a65d-4a16-9824-c3d8453079d8', 'Đau cổ vai gáy ở dân văn phòng: Nguyên nhân, dấu hiệu và cách điều trị hiệu quả', 'dau-co-vai-gay-o-dan-van-phong-nguyen-nhan-dau-hieu-va-cach-dieu-tri-hieu-qua', 'Cẩm nang y khoa toàn diện 3.500 từ về hội chứng đau cổ vai gáy mạn tính ở dân văn phòng: Giải phẫu chi tiết cột sống cổ C1-C7, 4 giai đoạn tiến triển lâm sàng, bài tập giãn cơ 3D và phác đồ trị liệu bảo tồn công nghệ cao không dùng thuốc tại OfficeCare.', '
        <p>Theo các khảo sát dịch tễ học y tế mới nhất tại Việt Nam, có tới <strong>88.5% nhân viên văn phòng, lập trình viên, kế toán và biên tập viên</strong> gặp phải các cơn đau mỏi cổ vai gáy lặp đi lặp lại trong suốt quá trình làm việc. Đau mỏi cổ vai gáy không đơn thuần là cảm giác mỏi cơ sinh lý tạm thời; đây là tín hiệu báo động đỏ cho thấy cấu trúc cơ học của vùng cột sống cổ đang gánh chịu sức nén quá tải nghiêm trọng, dẫn đến nguy cơ thoái hóa đốt sống, phồng đĩa đệm và teo cơ chèn ép thần kinh vĩnh viễn.</p>

        <blockquote>
          "Cột sống cổ con người được thiết kế để di chuyển linh hoạt theo 6 chiều không gian. Việc bắt nó phải gồng giữ cố định ở một tư thế cúi gập trong 8-10 tiếng mỗi ngày là hành vi tàn phá cấu trúc sinh học nặng nề nhất đối với hệ xương khớp."
          <span>— Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</span>
        </blockquote>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583115/officecare/blog/mvrfgbh2jg9dedfpml3a.webp" alt="Đau cổ vai gáy ở dân văn phòng nguyên nhân và cách điều trị hiệu quả" />

        <h2>1. Giải Phẫu Học & Sinh Cơ Học Cột Sống Cổ: Tại Sao Bạn Bị Đau?</h2>
        <p>Vùng cổ vai gáy là một hệ thống giải phẫu cực kỳ phức tạp và tinh vi. Cột sống cổ bao gồm 7 đốt sống được ký hiệu từ <strong>C1 đến C7</strong>:</p>
        <ul>
          <li><strong>Đốt C1 (Đốt đội - Atlas) và C2 (Đốt trục - Axis):</strong> Giúp đầu nâng đỡ và xoay chuyển linh hoạt trái phải.</li>
          <li><strong>Đốt C3 đến C7:</strong> Chịu toàn bộ trọng lượng đầu và làm trụ đỡ kết nối với cột sống ngực.</li>
          <li><strong>Đĩa đệm cột sống cổ:</strong> Nằm giữa các đốt sống, đóng vai trò như những "giảm xóc thủy lực" giúp phân tán lực nén.</li>
          <li><strong>Hệ thống dây thần kinh rễ cổ (Cervical Nerve Roots):</strong> Xuất phát từ tủy sống cổ, chui qua các lỗ liên hợp đi xuống chi phối cảm giác và vận động cho toàn bộ vai, cánh tay, cẳng tay và các ngón tay.</li>
          <li><strong>Các bó cơ vùng gáy:</strong> Bao gồm cơ thang (Trapezius), cơ nâng vai (Levator Scapulae), cơ ức đòn chũm và cơ gối cổ.</li>
        </ul>

        <p>Khi làm việc với máy tính, thói quen nhô đầu về phía trước (Forward Head Posture) khiến đầu bị lệch khỏi trọng tâm tự nhiên. Trọng lượng trung bình của đầu người ở tư thế thẳng đứng là khoảng <strong>5kg</strong>. Tuy nhiên, theo nghiên cứu của Tiến sĩ Kenneth Hansraj (Phẫu thuật viên Cột sống New York):</p>
        <ul>
          <li>Cúi cổ nghiêng 15 độ: Tải trọng nén dồn lên cổ tăng lên <strong>12 kg</strong>.</li>
          <li>Cúi cổ nghiêng 30 độ: Tải trọng dồn lên cổ tăng lên <strong>18 kg</strong>.</li>
          <li>Cúi cổ nghiêng 45 độ: Tải trọng dồn lên cổ tăng lên <strong>22 kg</strong>.</li>
          <li>Cúi cổ nghiêng 60 độ: Tải trọng dồn lên cổ tăng vọt lên <strong>27 kg</strong> (tương đương mang một đứa trẻ 8 tuổi trên cổ!).</li>
        </ul>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583134/officecare/blog/l9uel7z72zuifkk6bxhl.webp" alt="Nguyên nhân tư thế gây áp lực lớn lên đĩa đệm cổ" />

        <h2>2. 4 Giai Đoạn Tiến Triển Bệnh Lý Đau Cổ Vai Gáy Dân Văn Phòng</h2>
        <p>Bệnh đau cổ vai gáy ở dân văn phòng không xảy ra sau một đêm, mà diễn tiến qua 4 giai đoạn lâm sàng rõ rệt:</p>

        <div>>
          <table class="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr class="bg-teal-600 text-white">
                <th class="p-3 text-left border-b border-teal-700">Giai đoạn</th>
                <th class="p-3 text-left border-b border-teal-700">Triệu chứng lâm sàng nhận biết</th>
                <th class="p-3 text-left border-b border-teal-700">Tổn thương giải phẫu nội tại</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-teal-800">Giai đoạn 1: Mỏi cơ cơ năng</td>
                <td class="p-3">Đau mỏi nhẹ vùng gáy vào cuối ngày làm việc. Cổ hơi cứng nhẹ khi vừa ngủ dậy. Hết đau sau khi vặn xoay nhẹ hoặc nghỉ ngơi cuối tuần.</td>
                <td class="p-3">Co thắt nhẹ các sợi cơ thang nông. Đĩa đệm và đốt sống hoàn toàn chưa bị tổn thương cấu trúc.</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-amber-700">Giai đoạn 2: Co thắt cơ mạn tính</td>
                <td class="p-3">Đau nhức kéo dài > 7 ngày. Xuất hiện các cục cơ cứng ngắc (nút thắt cơ - Trigger Points) ở vùng vai. Ấn vào đau điếng. Quay đầu sang bên khó khăn.</td>
                <td class="p-3">Các bó cơ bị xơ hóa co rút ngắn. Đường cong sinh lý cột sống cổ bắt đầu bị duỗi thẳng (mất cong tự nhiên).</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-orange-700">Giai đoạn 3: Chèn ép rễ thần kinh</td>
                <td class="p-3">Cơn đau lan rộng từ gáy xuống bả vai, chạy dọc cẳng tay và gây tê rần các ngón tay. Yếu lực tay khi cầm nắm đồ vật hay vặn nắp chai.</td>
                <td class="p-3">Đĩa đệm cổ C5-C6 hoặc C6-C7 bị phồng/thoát vị, chèn ép trực tiếp lên rễ thần kinh cánh tay. Giảm chiều cao khe khớp.</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-rose-700">Giai đoạn 4: Biến chứng nguy hại</td>
                <td class="p-3">Cơ bắp tay bị teo nhỏ, mất cảm giác da. Thường xuyên hoa mắt, chóng mặt, mất ngủ, ù tai do thiếu máu não mạn tính.</td>
                <td class="p-3">Hẹp ống sống cổ nghiêm trọng, mọc gai xương rãnh thần kinh, nguy cơ hẹp động mạch đốt sống thân nền.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. 6 Nguyên Nhân Tàn Phá Vai Gáy Lớn Nhất Khi Làm Việc</h2>
        <ol>
          <li><strong>Màn hình máy tính đặt quá thấp hoặc quá cao:</strong> Bắt cổ phải liên tục gập xuống hoặc ngước lên suốt 8 tiếng.</li>
          <li><strong>Kẹp điện thoại vào vai khi gõ phím:</strong> Làm gồng thắt lệch nhóm cơ nâng vai một bên cực kỳ nguy hại.</li>
          <li><strong>Gió máy lạnh thổi thẳng vào sau gáy:</strong> Khiến vi mạch máu nuôi cơ bị co rút đột ngột, gây hiện tượng "vẹo cổ cấp tính" vào sáng hôm sau.</li>
          <li><strong>Áp lực deadline & Stress tâm lý:</strong> Khi căng thẳng, hệ thần kinh thực vật tự động kích hoạt phản xạ gồng rụt hai vai up lên tai, làm bó cứng cơ thang mạn tính.</li>
          <li><strong>Lười uống nước & Thói quen nhịn đi lại:</strong> Đĩa đệm thiếu nước bị suy kiệt tính đàn hồi, đẩy nhanh tốc độ thoái hóa.</li>
          <li><strong>Tự ý bẻ cổ kêu "rắc rắc" để hết mỏi:</strong> Tạo ra lực xé rách dải dây chằng bao khớp, khiến khớp cổ bị trượt lệch lỏng lẻo.</li>
        </ol>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583127/officecare/blog/xzlxtzinzmm81n19kks2.webp" alt="Triệu chứng co cứng cơ thang vai gáy mạn tính" />

        <h2>4. Bộ 4 Bài Tập Giãn Cơ 3D Cấp Tốc Ngay Tại Bàn Làm Việc</h2>
        <p>Hãy thực hiện bộ 4 bài tập chuẩn y khoa này cứ mỗi 2 tiếng làm việc để giải tỏa co thắt cơ ngay lập tức:</p>

        <h3>Bài 1: Kéo Giãn Cơ Thang Trên (Upper Trapezius Stretch)</h3>
        <p>Ngồi thẳng lưng, tay trái bám dưới mép ghế. Tay phải vòng qua đỉnh đầu đặt lên tai trái, nghiêng nhẹ đầu sang phải. Giữ <strong>20 giây</strong>, hít thở sâu. Đổi bên. Lặp lại 3 lần.</p>

        <h3>Bài 2: Kéo Giãn Cơ Nâng Vai (Levator Scapulae Stretch)</h3>
        <p>Ngồi thẳng lưng, xoay đầu nghiêng góc 45 độ sang bên phải rồi cúi đầu hướng về phía nách phải. Dùng tay phải đặt sau đầu kéo nhẹ xuống. Giữ <strong>20 giây</strong>. Động tác này đánh tan nút thắt cơ góc vai gáy.</p>

        <h3>Bài 3: Bài Tập Thắt Cằm Chin-Tuck (Củng Cố Cơ Cổ Sâu)</h3>
        <p>Giữ ánh mắt nhìn thẳng, dùng ngón tay ấn nhẹ cằm thu lùi về phía sau (tạo cằm đôi). Giữ trong 5 giây rồi thả lỏng. Thực hiện 10 lần. Đây là bài tập "vàng" khôi phục đường cong sinh lý cột sống cổ.</p>

        <h3>Bài 4: Mở Lồng Ngực & Khép Bả Vai (Scapular Retraction)</h3>
        <p>Đan tay sau lưng, duỗi thẳng cẳng tay ra sau, ép hai bả vai sát vào nhau và đẩy lồng ngực lên cao. Giữ 15 giây. Giúp giải phóng hoàn toàn nhóm cơ ngực bé bị co rút.</p>

        <h2>5. Phác Đồ Điều Trị Bảo Tồn Công Nghệ Cao Chuẩn Y Khoa Tại OfficeCare</h2>
        <p>Đối với các cơn đau vai gáy mạn tính kéo dài trên 1 tuần hoặc đã có dấu hiệu tê tay, việc tự tập luyện chỉ đóng vai trò hỗ trợ. **OfficeCare** áp dụng phác đồ trị liệu bảo tồn đỉnh cao <strong>"3 Không: Không dùng thuốc - Không tiêm - Không phẫu thuật"</strong>:</p>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583128/officecare/blog/mbuta4kbi2962ah3rlif.webp" alt="Phác đồ trị liệu cổ vai gáy công nghệ cao tại OfficeCare" />

        <ul>
          <li><strong>Khám Lượng Giá Sinh Cơ Học Trực Tiếp Với Bác Sĩ CKI:</strong> Đo biên độ vận động ROM, đọc phim X-quang/MRI để xác định chính xác vị trí rễ thần kinh bị chèn ép.</li>
          <li><strong>Trị Liệu Cơ Sâu MRT (Myofascial Release Therapy):</strong> Kỹ thuật viên sử dụng đôi tay y khoa giải phóng hoàn toàn các điểm xơ cơ Trigger Points, khôi phục sự đàn hồi cho cơ bắp.</li>
          <li><strong>Nắn Chỉnh Đốt Sống Chiropractic:</strong> Bác sĩ nắn chỉnh các đốt sống cổ sai lệch về đúng trục sinh lý, giải phóng đè nén thần kinh.</li>
          <li><strong>Sóng Xung Kích Shockwave Công Suất Cao:</strong> Tác động sâu vào mô vôi hóa, bóc tách xơ dính gân cơ, kích thích tái tạo mạch máu mới nuôi dưỡng mô.</li>
          <li><strong>Laser Cường Độ High-Intensity Laser (HILT):</strong> Thấu sâu vào bao khớp và rễ thần kinh, kích thích tế bào tăng sinh ATP, dập tắt ổ viêm tận gốc.</li>
        </ul>

        <h2>6. Giải Đáp Thắc Mắc Thường Gặp (FAQ)</h2>
        <div>>
          <div>>
            <h4>Q: Uống thuốc giảm đau cổ vai gáy có khỏi tận gốc được không?</h4>
            <p>A: Thuốc giảm đau chỉ ngắt tín hiệu đau gửi lên não tạm thời. Thuốc không loại bỏ được điểm xơ cơ, không đưa được đốt sống sai lệch về vị trí cũ và không chữa được đĩa đệm thoát vị. Dùng kéo dài còn gây loét dạ dày, suy gan, suy thận.</p>
          </div>
          <div>>
            <h4>Q: Một liệu trình điều trị đau vai gáy tại OfficeCare kéo dài bao lâu?</h4>
            <p>A: Tùy thuộc vào giai đoạn bệnh. Thông thường một liệu trình chuẩn gồm từ 7 - 10 buổi. Ngay sau buổi trị liệu đầu tiên, bệnh nhân đã cảm nhận được sự thuyên giảm từ 40% - 60% cơn đau.</p>
          </div>
        </div>

        <p>Đừng để cơn đau cổ vai gáy tàn phá sức khỏe và công việc của bạn. Hãy liên hệ ngay với <strong>OfficeCare</strong> hôm nay để đặt lịch thăm khám trực tiếp cùng Đội ngũ Bác sĩ Chuyên khoa hàng đầu!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510000/officecare/blog/jby9fvxbvf55cm70fplo.webp', 'dieu_tri', 'xuat_ban', 'Đau cổ vai gáy ở dân văn phòng: Nguyên nhân & Điều trị dứt điểm', 'Cẩm nang chuyên sâu về nguyên nhân, dấu hiệu 4 giai đoạn và phác đồ điều trị đau cổ vai gáy mạn tính cho dân văn phòng bằng vật lý trị liệu tại OfficeCare.', 'đau cổ vai gáy, dân văn phòng, nguyên nhân đau vai gáy, điều trị vật lý trị liệu, bài tập cổ vai gáy, officecare', 19, 1, '2026-07-29T03:19:25.538Z', '2026-07-29T03:19:25.546Z', '2026-08-02T18:18:49.902Z'),
  ('0b078f6a-bebe-40fc-87f4-de4f81ebc4ea', 'Điều trị viêm quanh khớp vai bằng phương pháp phục hồi chức năng chuyên sâu', 'dieu-tri-viem-quanh-khop-vai', 'Viêm quanh khớp vai thể đông cứng (Frozen Shoulder) gây đau nhức dữ dội và cản trở giơ tay. Khám phá phác đồ điều trị vật lý trị liệu phục hồi biên độ vận động khớp vai an toàn.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Điều trị viêm quanh khớp vai bằng phương pháp phục hồi chức năng chuyên sâu - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Điều trị viêm quanh khớp vai bằng phương pháp phục hồi chức năng chuyên sâu - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Điều trị viêm quanh khớp vai bằng phương pháp phục hồi chức năng chuyên sâu - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510009/officecare/blog/qd5xjqhqwrr3qchh1fvt.webp', 'dieu_tri', 'ngung_su_dung', 'Điều trị viêm quanh khớp vai bằng phục hồi chức năng', 'Phác đồ điều trị đông cứng khớp vai, viêm quanh khớp vai không cần phẫu thuật.', 'viem quanh khop vai, dong cung khop vai, dau vai, vat ly tri lieu vai', 493, 5, '2026-07-17T05:21:29.570Z', '2026-07-17T05:21:29.570Z', '2026-08-01T12:13:03.116Z'),
  ('020f45b8-3082-49cc-b159-a27277e65d69', 'Bài tập vật lý trị liệu giảm đau vai gáy tại nhà hiệu quả', 'bai-tap-vat-ly-tri-lieu-giam-dau-vai-gay-tai-nha', 'Đau mỏi vai gáy tê bì vai cổ gây khó chịu, đau đầu mất ngủ. Dưới đây là 5 bài tập kéo giãn cơ đơn giản bạn có thể tập luyện tại nhà hoặc ngay tại văn phòng để giải phóng căng thẳng cơ vùng cổ.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Bài tập vật lý trị liệu giảm đau vai gáy tại nhà hiệu quả - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Bài tập vật lý trị liệu giảm đau vai gáy tại nhà hiệu quả - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Bài tập vật lý trị liệu giảm đau vai gáy tại nhà hiệu quả - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510009/officecare/blog/qd5xjqhqwrr3qchh1fvt.webp', 'phong_ngua', 'ngung_su_dung', 'Bài tập vật lý trị liệu giảm đau vai gáy tại nhà', 'Hướng dẫn chi tiết 5 bài tập kéo giãn cơ đơn giản giảm đau cổ vai gáy hiệu quả tức thì.', 'dau vai gay, bai tap vai gay, keo gian co co, bai tap tai nha', 227, 5, '2026-07-17T05:21:29.576Z', '2026-07-17T05:21:29.576Z', '2026-08-01T12:13:03.142Z'),
  ('101a74c7-2da9-486e-9b9a-8d136f301127', 'Liệu pháp sóng xung kích (Shockwave Therapy) trong điều trị gai gót chân & viêm gân gót', 'lieu-phap-song-xung-kich-dieu-tri-gai-got-chan', 'Sóng xung kích Shockwave là công nghệ y khoa đột phá giúp phá vỡ canxi hóa gai gót chân, cắt cơn đau buốt gót chân ngay từ buổi trị liệu đầu tiên.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Liệu pháp sóng xung kích (Shockwave Therapy) trong điều trị gai gót chân & viêm gân gót - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Liệu pháp sóng xung kích (Shockwave Therapy) trong điều trị gai gót chân & viêm gân gót - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Liệu pháp sóng xung kích (Shockwave Therapy) trong điều trị gai gót chân & viêm gân gót - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510015/officecare/blog/bmktpkmbteixnpyx5dow.webp', 'dieu_tri', 'ngung_su_dung', 'Sóng xung kích điều trị đau gai gót chân hiệu quả', 'Liệu pháp sóng xung kích Shockwave là tiêu chuẩn vàng giúp giảm đau nhanh cho bệnh nhân gai gót chân.', 'shockwave, gai got chan, viem can gan chan, dau got chan', 443, 5, '2026-07-17T05:21:29.548Z', '2026-07-17T05:21:29.548Z', '2026-08-01T12:13:03.146Z'),
  ('16539e27-d1c5-40b9-8808-abf66bea58ba', 'Phục hồi chức năng sau chấn thương cổ chân (Lật sơ mi / Bông gân) đúng cách', 'phuc-hoi-chan-thuong-co-chan-lat-so-mi', 'Lật sơ mi cổ chân nếu không được trị liệu đúng cách dễ dẫn đến lỏng khớp cổ chân mạn tính. Hướng dẫn phác đồ RICE và bài tập phục hồi cảm nhận bản thể.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Phục hồi chức năng sau chấn thương cổ chân (Lật sơ mi / Bông gân) đúng cách - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Phục hồi chức năng sau chấn thương cổ chân (Lật sơ mi / Bông gân) đúng cách - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Phục hồi chức năng sau chấn thương cổ chân (Lật sơ mi / Bông gân) đúng cách - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'dieu_tri', 'ngung_su_dung', 'Phục hồi chấn thương lật sơ mi cổ chân đúng cách', 'Các bước phục hồi chức năng và ổn định khớp cổ chân sau bong gân lật sơ mi.', 'lat so mi, bong gan co chan, dau co chan, co chan long leo', 575, 5, '2026-07-17T05:21:29.593Z', '2026-07-17T05:21:29.593Z', '2026-08-01T12:13:03.150Z'),
  ('63bb80ff-d9af-4188-9df2-c569150f909b', 'Giải cơ sâu Myofascial Release: Giải pháp cho các điểm đau kích hoạt (Trigger Points)', 'giai-co-sau-myofascial-release', 'Tìm hiểu phương pháp giải cơ sâu Myofascial Release giúp triệt tiêu triệt để các nút thắt xơ cơ bả vai, mông và thắt lưng do ngồi lâu thụ động.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Giải cơ sâu Myofascial Release: Giải pháp cho các điểm đau kích hoạt (Trigger Points) - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Giải cơ sâu Myofascial Release: Giải pháp cho các điểm đau kích hoạt (Trigger Points) - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Giải cơ sâu Myofascial Release: Giải pháp cho các điểm đau kích hoạt (Trigger Points) - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'dieu_tri', 'ngung_su_dung', 'Giải cơ sâu Myofascial Release trị điểm cơ co thắt', 'Giải phóng màng cơ sâu và các điểm đau kích hoạt Trigger Points bằng liệu pháp xoa bóp màng cơ.', 'myofascial release, giai co sau, diem kich hoat, trigger points', 576, 5, '2026-07-17T05:21:29.568Z', '2026-07-17T05:21:29.568Z', '2026-08-01T12:13:03.154Z'),
  ('1664912b-8975-4655-9167-f1d10f0f76c8', 'Lộ trình phục hồi chức năng sau phẫu thuật tái tạo đứt dây chằng chéo trước (ACL)', 'phuc-hoi-dut-day-chang-cheo-truoc-acl', 'Phục hồi chức năng sau mổ đứt dây chằng chéo trước ACL là chìa khóa 70% quyết định khả năng chơi lại thể thao. Hướng dẫn lộ trình tập luyện 4 giai đoạn chuẩn y khoa.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Lộ trình phục hồi chức năng sau phẫu thuật tái tạo đứt dây chằng chéo trước (ACL) - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Lộ trình phục hồi chức năng sau phẫu thuật tái tạo đứt dây chằng chéo trước (ACL) - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Lộ trình phục hồi chức năng sau phẫu thuật tái tạo đứt dây chằng chéo trước (ACL) - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510010/officecare/blog/a2fbmtqiv0yxzyhgwhm5.webp', 'dieu_tri', 'ngung_su_dung', 'Phục hồi đứt dây chằng chéo trước sau mổ', 'Lộ trình tập vật lý trị liệu sau phẫu thuật tái tạo dây chằng chéo trước gối.', 'day chang cheo truoc, dut acl, vat ly tri lieu sau mo, phuc hoi goi', 244, 5, '2026-07-17T05:21:29.573Z', '2026-07-17T05:21:29.573Z', '2026-08-01T12:13:03.158Z'),
  ('4d766b60-8d12-4002-a8ff-2935c4d01dc0', 'Tầm quan trọng của việc giãn cơ (Stretching) sau khi tập luyện thể thao cường độ cao', 'tam-quan-trong-gian-co-sau-tap-luyen', 'Bỏ qua bước giãn cơ sau tập làm cơ bắp bị xơ cứng, tích tụ axit lactic gây đau nhức DOMS và tăng nguy cơ rách cơ. Học ngay các bài tập tĩnh khôi phục dải cơ.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Tầm quan trọng của việc giãn cơ (Stretching) sau khi tập luyện thể thao cường độ cao - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Tầm quan trọng của việc giãn cơ (Stretching) sau khi tập luyện thể thao cường độ cao - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Tầm quan trọng của việc giãn cơ (Stretching) sau khi tập luyện thể thao cường độ cao - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'suc_khoe', 'ngung_su_dung', 'Tầm quan trọng giãn cơ sau khi chơi thể thao', 'Tại sao giãn cơ sau khi tập luyện lại cực kỳ cần thiết để hồi phục cơ bắp và tránh chấn thương gân cơ.', 'gian co, cool down, dau moi co, phuc hoi co bap', 798, 5, '2026-07-17T05:21:29.600Z', '2026-07-17T05:21:29.600Z', '2026-08-01T12:13:03.162Z'),
  ('8c5b60e1-399c-4e5d-abb8-d981920fa47d', 'Vật lý trị liệu cho bệnh nhân thoái hóa khớp gối: Giảm đau khớp không cần dùng thuốc', 'vat-ly-tri-lieu-thoai-hoa-khop-goi', 'Thoái hóa khớp gối gây lạo xạo và đau nhức khi đi cầu thang. Tìm hiểu phác đồ tập luyện tăng cường cơ đùi và chiếu sóng xung kích bảo tồn khớp gối.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Vật lý trị liệu cho bệnh nhân thoái hóa khớp gối: Giảm đau khớp không cần dùng thuốc - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Vật lý trị liệu cho bệnh nhân thoái hóa khớp gối: Giảm đau khớp không cần dùng thuốc - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Vật lý trị liệu cho bệnh nhân thoái hóa khớp gối: Giảm đau khớp không cần dùng thuốc - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510010/officecare/blog/a2fbmtqiv0yxzyhgwhm5.webp', 'dieu_tri', 'ngung_su_dung', 'Vật lý trị liệu thoái hóa khớp gối không dùng thuốc', 'Liệu pháp phục hồi chức năng khớp gối giúp giảm đau, tăng tiết dịch khớp tự nhiên.', 'thoai hoa khop goi, dau goi, dich khop goi, vat ly tri lieu goi', 539, 5, '2026-07-19T11:47:18.701Z', '2026-07-17T05:21:29.598Z', '2026-08-01T12:13:03.166Z'),
  ('b8660bf0-d2d4-43ef-b9e2-f8d2ffacc75c', 'Phục hồi chức năng hô hấp cho bệnh nhân sau tổn thương phổi & Viêm đường hô hấp', 'phuc-hoi-chuc-nang-ho-hap', 'Các bài tập thở cơ hoành và kỹ thuật vỗ rung lồng ngực giúp tống xuất đờm dãi, mở rộng dung tích màng phổi và khôi phục nhịp thở sâu tự nhiên.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Phục hồi chức năng hô hấp cho bệnh nhân sau tổn thương phổi & Viêm đường hô hấp - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Phục hồi chức năng hô hấp cho bệnh nhân sau tổn thương phổi & Viêm đường hô hấp - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Phục hồi chức năng hô hấp cho bệnh nhân sau tổn thương phổi & Viêm đường hô hấp - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'suc_khoe', 'ngung_su_dung', 'Phục hồi chức năng hô hấp và dung tích phổi', 'Các kỹ thuật tập thở cơ hoành, vật lý trị liệu hô hấp phục hồi lá phổi khỏe mạnh.', 'ho hap, phoi, tap tho co hoanh, dung tich phoi, copd', 634, 5, '2026-07-17T05:21:29.583Z', '2026-07-17T05:21:29.583Z', '2026-08-01T12:13:03.170Z'),
  ('baeaf52c-bb70-407e-bbe5-c3662120a60e', 'Điều trị thoát vị đĩa đệm không phẫu thuật: Hiệu quả thực tế & Lộ trình chuẩn Y Khoa', 'dieu-tri-thoat-vi-dia-dem-khong-phau-thuat', 'Phân tích hiệu quả thực tế của phương pháp điều trị bảo tồn thoát vị đĩa đệm bằng kéo giãn cột sống áp lực âm và trị liệu sóng xung kích tại OfficeCare.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Điều trị thoát vị đĩa đệm không phẫu thuật: Hiệu quả thực tế & Lộ trình chuẩn Y Khoa - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Điều trị thoát vị đĩa đệm không phẫu thuật: Hiệu quả thực tế & Lộ trình chuẩn Y Khoa - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Điều trị thoát vị đĩa đệm không phẫu thuật: Hiệu quả thực tế & Lộ trình chuẩn Y Khoa - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510008/officecare/blog/rrb6jiu7zfjqz9pyqhlv.webp', 'dieu_tri', 'ngung_su_dung', 'Điều trị thoát vị đĩa đệm không phẫu thuật', 'Hiệu quả thực tế của các phương pháp bảo tồn và trị liệu thoát vị đĩa đệm cột sống thắt lưng.', 'thoat vi dia dem, bao ton, keo gian cot song, tri lieu than kinh', 421, 5, '2026-07-17T05:21:29.559Z', '2026-07-17T05:21:29.559Z', '2026-08-01T12:13:03.175Z'),
  ('c4928a6b-90d5-44e8-8467-d732358ace6a', 'Laser công suất cao (Class IV): Công nghệ đột phá giảm viêm đau cơ xương khớp nhanh chóng', 'laser-cong-suat-cao-cong-nghe-giam-dau-nhanh', 'Laser công suất cao 30W thâm nhập sâu 12cm vào mô cơ tổn thương, kích thích tổng hợp ATP tế bào, cắt cơn đau nhức và sưng viêm cấp tốc.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Laser công suất cao (Class IV): Công nghệ đột phá giảm viêm đau cơ xương khớp nhanh chóng - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Laser công suất cao (Class IV): Công nghệ đột phá giảm viêm đau cơ xương khớp nhanh chóng - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Laser công suất cao (Class IV): Công nghệ đột phá giảm viêm đau cơ xương khớp nhanh chóng - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510015/officecare/blog/bmktpkmbteixnpyx5dow.webp', 'dieu_tri', 'ngung_su_dung', 'Laser trị liệu công suất cao Class IV giảm viêm đau', 'Trị liệu bằng ánh sáng laser công suất cao giúp phục hồi tế bào tổn thương nhanh chóng.', 'laser class iv, laser cong suat cao, giam dau nhanh, khang viem', 506, 5, '2026-07-17T05:21:29.562Z', '2026-07-17T05:21:29.562Z', '2026-08-01T12:13:03.179Z'),
  ('eb0ad960-77be-4ca4-833b-0d02a5deacaf', 'Phục hồi chức năng thoái hóa cột sống thắt lưng bằng phương pháp bảo tồn tiên tiến', 'phuc-hoi-chuc-nang-thoai-hoa-cot-song-that-lung', 'Thoái hóa cột sống thắt lưng gây đau ê ẩm vùng thắt lưng, cứng lưng buổi sáng. Tìm hiểu phác đồ kết hợp kéo giãn giảm áp DTS và bài tập củng cố cơ lưng.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Phục hồi chức năng thoái hóa cột sống thắt lưng bằng phương pháp bảo tồn tiên tiến - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Phục hồi chức năng thoái hóa cột sống thắt lưng bằng phương pháp bảo tồn tiên tiến - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Phục hồi chức năng thoái hóa cột sống thắt lưng bằng phương pháp bảo tồn tiên tiến - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510008/officecare/blog/rrb6jiu7zfjqz9pyqhlv.webp', 'dieu_tri', 'ngung_su_dung', 'Phục hồi chức năng thoái hóa cột sống thắt lưng', 'Các giải pháp phục hồi chức năng tiên tiến không phẫu thuật cho người thoái hóa cột sống thắt lưng.', 'thoai hoa cot song, thoai hoa that lung, vat ly tri lieu, phuc hoi chuc nang', 382, 5, '2026-07-17T05:21:29.536Z', '2026-07-17T05:21:29.536Z', '2026-08-01T12:13:03.188Z'),
  ('cb6c77f8-4d5a-4aa7-b2a6-74a3358a5a03', 'Liệu pháp nhiệt nóng và nhiệt lạnh trong chấn thương thể thao: Dùng sao cho đúng?', 'lieu-phap-nhiet-nong-lanh-chan-thuong-the-thao', 'Khi nào nên chườm đá lạnh, khi nào nên chườm ấm nóng? Hướng dẫn chuẩn y khoa phân biệt 2 liệu pháp nhiệt giúp giảm sưng đau bầm tím chuẩn xác.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Liệu pháp nhiệt nóng và nhiệt lạnh trong chấn thương thể thao: Dùng sao cho đúng? - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Liệu pháp nhiệt nóng và nhiệt lạnh trong chấn thương thể thao: Dùng sao cho đúng? - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Liệu pháp nhiệt nóng và nhiệt lạnh trong chấn thương thể thao: Dùng sao cho đúng? - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'phong_ngua', 'ngung_su_dung', 'Phân biệt chườm nóng và chườm lạnh trong chấn thương', 'Hướng dẫn sử dụng nhiệt nóng và lạnh đúng cách để điều trị bong gân, chấn thương thể thao.', 'chuom nong, chuom lanh, chan thuong the thao, bong gan, co co', 154, 5, '2026-07-17T05:21:29.589Z', '2026-07-17T05:21:29.589Z', '2026-08-01T12:13:03.184Z'),
  ('9fb9f304-ad0a-4349-8a8d-ff3e802c157b', 'Ngồi làm việc 8 tiếng mỗi ngày ảnh hưởng đến cột sống như thế nào?', 'ngoi-lam-viec-8-tieng-moi-ngay-anh-huong-den-cot-song-nhu-the-nao', 'Phân tích y khoa chuyên sâu 3.500 từ về chuỗi phản ứng tàn phá cột sống của hành vi ngồi tĩnh 8 tiếng: Sự biến đổi áp lực đĩa đệm L4-L5, hội chứng quên cơ mông, vẹo đường cong sinh lý và giải pháp bảo vệ cột sống dẻo dai tại OfficeCare.', '
        <p>Con người được tiến hóa để săn bắn, hái lượm và di chuyển liên tục trong không gian. Tuy nhiên, chỉ trong hơn một thế kỷ trở lại đây, cuộc cách mạng công nghiệp và nền kinh tế tri thức đã đưa hàng trăm triệu lao động vào trạng thái <strong>"ngồi tĩnh tại"</strong> trước màn hình máy tính 8 đến 12 tiếng mỗi ngày. Tổ chức Y tế Thế giới (WHO) đã xếp hành vi ngồi nhiều vào danh sách các nguy cơ sức khỏe hàng đầu, cảnh báo rằng <strong>"Ngồi tĩnh tại chính là việc hút thuốc lá thế hệ mới"</strong> đối với hệ xương khớp và tim mạch.</p>

        <blockquote>
          "Khi bạn ngồi, cột sống thắt lưng của bạn đang phải gánh chịu mức áp lực cơ học cao hơn hẳn so với khi bạn đứng thẳng hay đi lại. Ngồi gù lưng chính là hành động ép đĩa đệm phải làm việc vượt công suất thiết kế sinh học."
          <span>— Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</span>
        </blockquote>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583121/officecare/blog/qv3l3p7qtotnh0laapmr.webp" alt="Tác hại ngồi làm việc 8 tiếng đến cột sống dân văn phòng" />

        <h2>1. Sinh Cơ Học Cột Sống: Biến Đổi Áp Lực Đĩa Đệm Khi Ngồi</h2>
        <p>Đĩa đệm cột sống thắt lưng (đặc biệt là hai đĩa đệm L4-L5 và L5-S1) là nơi chịu tải trọng chính của toàn bộ cơ thể. Cấu trúc đĩa đệm gồm một bao xơ dai cứng bên ngoài và nhân nhầy thủy lực bên trong. Áp lực nội đĩa đệm biến đổi dữ dội tùy theo tư thế cơ thể:</p>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583113/officecare/blog/jl1ovef0z7fptkzltgeq.webp" alt="Sơ đồ nghiên cứu áp lực nội đĩa đệm ở các tư thế" />

        <div>>
          <table class="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr class="bg-teal-600 text-white">
                <th class="p-3 text-left border-b border-teal-700">Tư thế cơ thể</th>
                <th class="p-3 text-left border-b border-teal-700">Áp lực nén lên đĩa đệm L4-L5</th>
                <th class="p-3 text-left border-b border-teal-700">Mức độ nguy cơ tổn thương</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600">
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Nằm ngửa thư giãn</td>
                <td class="p-3 font-bold text-teal-700">25 kg (25%)</td>
                <td class="p-3 text-teal-700">Rất an toàn - Đĩa đệm thẩm thấu nước</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Nằm nghiêng</td>
                <td class="p-3">75 kg (75%)</td>
                <td class="p-3 text-teal-600">An toàn vừa phải</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-800">Đứng thẳng tự nhiên</td>
                <td class="p-3">100 kg (100%)</td>
                <td class="p-3 text-slate-600">Mức chịu tải tiêu chuẩn sinh lý</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-amber-700">Ngồi thẳng lưng chuẩn</td>
                <td class="p-3 font-bold text-amber-700">140 kg (140%)</td>
                <td class="p-3 text-amber-700">Áp lực tăng 40% so với đứng</td>
              </tr>
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-rose-700">Ngồi gù lưng vươn đầu</td>
                <td class="p-3 font-bold text-rose-700">185 kg - 275 kg (185% - 275%)</td>
                <td class="p-3 font-bold text-rose-700">NGUY HIỂM CAO - Nguy cơ thoát vị đĩa đệm!</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>2. Chuỗi Phản Ứng Tàn Phá Cột Sống Do Ngồi 8 Tiếng</h2>

        <h3>A. Đĩa Đệm Bị Mất Nước & Suy Kiệt Khả Năng Thẩm Thấu Dưỡng Chất</h3>
        <p>Đĩa đệm người trưởng thành không có mạch máu nuôi trực tiếp. Nó hoạt động như một miếng bọt biển: khi bạn đi lại vận động, sự thay đổi áp lực bóp - nhả giúp đĩa đệm đẩy chất thải ra ngoài và hút dưỡng chất, nước vào trong. Khi ngồi nén liên tục 8 tiếng, đĩa đệm bị "vắt kiệt nước" mà không thể thẩm thấu lại, làm đĩa đệm mỏng xẹp dần và giòn xơ vỡ bao xơ.</p>
        <p>Việc xẹp đĩa đệm kéo theo tình trạng hẹp các lỗ liên hợp – nơi rễ thần kinh đi ra khỏi tủy sống, gây ra các cơn đau nhói thắt lưng lan xuống đùi và bắp chân.</p>

        <h3>B. "Hội Chứng Quên Cơ Mông" (Gluteal Amnesia / Dead Butt Syndrome)</h3>
        <p>Ngồi đè lên cơ mông lớn (Gluteus Maximus) 8 tiếng khiến não bộ bị "mất kết nối thần kinh" với nhóm cơ này. Cơ mông bị tê liệt thụ động, không còn tham gia nâng đỡ khung chậu. Hậu quả là toàn bộ lực tải trọng khi đứng, đi lại hay cúi người đều dồn hết vào các bó cơ thắt lưng dưới, gây đau lưng mạn tính dai dẳng.</p>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583143/officecare/blog/vaaaiarexdvdamzkhgjr.webp" alt="Tổn thương thoát vị đĩa đệm thắt lưng do ngồi nhiều" />

        <h3>C. Co Rút Cơ Thắt Lưng Chậu (Psoas Muscle Shortening)</h3>
        <p>Tư thế ngồi làm đùi và hông gập góc 90 độ liên tục, làm cơ thắt lưng chậu (Psoas) bị co rút ngắn lại. Khi bạn đứng dậy, sợi cơ bị co rút này sẽ kéo kéo giật đốt sống thắt lưng L1-L5 về phía trước, gây ra hiện tượng đau buốt thắt lưng mỗi khi đứng thẳng người.</p>

        <h3>D. Cản Trở Dòng Máu Vùng Chậu & Tĩnh Mạch Chi Dưới</h3>
        <p>Gập đùi nén động mạch đùi làm giảm 60% lưu lượng máu tuần hoàn xuống chân, gây ra hiện tượng suy giãn tĩnh mạch chi dưới, lạnh chân và tê rần bàn chân khi đứng dậy.</p>

        <h2>3. Giải Pháp "Động Trong Tĩnh" Phòng Ngừa Thoái Hóa Cột Sống</h2>
        <ul>
          <li><strong>Quy tắc 45/5 Pomodoro:</strong> Đặt báo thức mỗi 45 phút đứng dậy đi lại, uống một ngụm nước và vươn vai 60 giây.</li>
          <li><strong>Tự điều chỉnh góc làm việc Ergonomics:</strong> Đặt bàn chân bằng phẳng trên sàn, dùng gối đỡ thắt lưng Lumbar cushion.</li>
          <li><strong>Tập kích hoạt cơ mông & cơ lõi tại nhà:</strong> Thực hiện bài tập Glute Bridge và Plank 5 phút mỗi tối.</li>
        </ul>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583138/officecare/blog/fzic5fpacisxpkurjjuf.webp" alt="Phục hồi chức năng và giải áp cột sống tại OfficeCare" />

        <h2>4. Liệu Trình Phục Hồi Cột Sống Chuyên Sâu Tại OfficeCare</h2>
        <p>Nếu bạn đã bị đau lưng dai dẳng do ngồi lâu, **OfficeCare** cung cấp phác đồ **Giải áp DTS & Huấn luyện Kinetic Core**: Kéo giãn giảm áp đĩa đệm bằng máy kỹ thuật số tự động, kết hợp trị liệu cơ sâu MRT giải tỏa cơ thắt lưng chậu co rút, giúp khôi phục sức chịu tải tự nhiên của cột sống.</p>

        <p>Hãy liên hệ ngay với <strong>OfficeCare</strong> hôm nay để thăm khám lượng giá sức khỏe cột sống thắt lưng của bạn!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510002/officecare/blog/hnvysayldq9c3sg8ykvj.webp', 'suc_khoe', 'xuat_ban', 'Ngồi làm việc 8 tiếng ảnh hưởng cột sống như thế nào? Cẩm nang y khoa', 'Tác hại y khoa của việc ngồi tĩnh 8 tiếng lên đĩa đệm thắt lưng và cột sống cổ. Phân tích nguyên lý sinh cơ học và phương pháp phục hồi cột sống tại OfficeCare.', 'ngồi 8 tiếng, ảnh hưởng cột sống, thoái hóa cột sống, thoát vị đĩa đệm, dân văn phòng, officecare', 16, 1, '2026-07-29T03:23:10.866Z', '2026-07-29T03:23:10.873Z', '2026-08-02T18:16:11.063Z'),
  ('11f7e3ba-b023-4ec2-88c6-cb817b97b477', 'Cách khắc phục chứng mất ngủ dai dẳng do đau mỏi cổ vai gáy mãn tính ở dân văn phòng', 'khac-phuc-mat-ngu-do-dau-co-vai-gay-man-tinh', 'Đau mỏi cổ vai gáy không chỉ gây nhức bả vai mà còn chèn ép mạch máu não gây đau đầu, mất ngủ kéo dài. Khám phá giải pháp trị liệu bảo tồn triệt tiêu cơn đau đêm.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Cách khắc phục chứng mất ngủ dai dẳng do đau mỏi cổ vai gáy mãn tính ở dân văn phòng - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Cách khắc phục chứng mất ngủ dai dẳng do đau mỏi cổ vai gáy mãn tính ở dân văn phòng - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Cách khắc phục chứng mất ngủ dai dẳng do đau mỏi cổ vai gáy mãn tính ở dân văn phòng - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510009/officecare/blog/qd5xjqhqwrr3qchh1fvt.webp', 'suc_khoe', 'ngung_su_dung', 'Mất ngủ do đau mỏi cổ vai gáy mãn tính', 'Cách điều trị đau vai gáy giúp nâng cao chất lượng giấc ngủ tự nhiên không dùng thuốc ngủ.', 'mat ngu, dau vai gay, thoai hoa co, giac ngu ngon', 188, 5, '2026-07-17T05:21:29.591Z', '2026-07-17T05:21:29.591Z', '2026-08-01T12:13:03.196Z'),
  ('ca203770-3541-4ef7-ba28-bca7bbed5103', 'Tác hại nghiêm trọng của việc ngồi sai tư thế làm việc và giải pháp chỉnh sửa tư thế chuẩn', 'tac-hai-ngoi-sai-tu-the-va-giai-phap', 'Ngồi gù lưng, bắt chéo chân hay nhô cổ ra trước tàn phá khung xương của bạn hàng ngày. Xem ngay hướng dẫn cài đặt góc bàn ghế chuẩn công thái học.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Tác hại nghiêm trọng của việc ngồi sai tư thế làm việc và giải pháp chỉnh sửa tư thế chuẩn - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Tác hại nghiêm trọng của việc ngồi sai tư thế làm việc và giải pháp chỉnh sửa tư thế chuẩn - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Tác hại nghiêm trọng của việc ngồi sai tư thế làm việc và giải pháp chỉnh sửa tư thế chuẩn - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'phong_ngua', 'ngung_su_dung', 'Tác hại ngồi sai tư thế và cách ngồi chuẩn', 'Hậu quả khôn lường của thói quen ngồi sai tư thế và hướng dẫn thiết lập tư thế ngồi chuẩn công thái học.', 'ngoi sai tu the, dau lung, cong veo cot song, tu the dung', 364, 5, '2026-07-17T05:21:29.596Z', '2026-07-17T05:21:29.596Z', '2026-08-01T12:13:03.199Z'),
  ('d60ab1e3-0e63-45f2-9bf3-654c26a3bc94', 'Phục hồi chức năng sau tai biến mạch máu nội (Đột quỵ): Thời điểm vàng & Lộ trình', 'phuc-hoi-chuc-nang-sau-tai-bien-mach-mau-nao', 'Tập phục hồi chức năng sớm trong "giai đoạn vàng" 6 tháng đầu sau đột quỵ giúp bệnh nhân liệt nửa người sớm đứng dậy, đi lại và tái hòa nhập cuộc sống.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Phục hồi chức năng sau tai biến mạch máu nội (Đột quỵ): Thời điểm vàng & Lộ trình - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Phục hồi chức năng sau tai biến mạch máu nội (Đột quỵ): Thời điểm vàng & Lộ trình - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Phục hồi chức năng sau tai biến mạch máu nội (Đột quỵ): Thời điểm vàng & Lộ trình - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510022/officecare/blog/gns3ybspvcstkbbofr3v.webp', 'suc_khoe', 'ngung_su_dung', 'Thời điểm vàng phục hồi chức năng sau tai biến', 'Lộ trình phục hồi chức năng toàn diện cho bệnh nhân sau tai biến mạch máu não giai đoạn vàng.', 'tai bien, dot quy, phuc hoi liet, tai hoa nhap', 374, 5, '2026-07-17T05:21:29.556Z', '2026-07-17T05:21:29.556Z', '2026-08-01T12:13:03.203Z'),
  ('fbc76e89-9f32-4d68-b5df-629ee1d9549c', '7 bài tập giãn cơ chỉ mất 5 phút dành cho dân văn phòng', '7-bai-tap-gian-co-chi-mat-5-phut-danh-cho-dan-van-phong', 'Cẩm nang bài tập giãn cơ 5 phút chuyên sâu ngay tại ghế làm việc: Hướng dẫn chi tiết 7 động tác chuẩn y khoa giúp đánh tan bó cơ thang, giải tỏa co thắt lưng dưới, ngăn ngừa hội chứng ống cổ tay và tái nạp oxy cho não bộ.', '
        <p>Làm việc liên tục 8 đến 10 tiếng tại bàn máy tính khiến các khối cơ vùng cổ, vai, lưng dưới và hông mông rơi vào trạng thái co thắt mạn tính. Tuy nhiên, không phải ai cũng có đủ thời gian đến phòng gym hay phòng tập chuyên nghiệp mỗi ngày. **Tin vui dành cho bạn:** Chỉ với <strong>5 phút giải lao ngay tại ghế làm việc</strong>, bộ 7 bài tập giãn cơ chuẩn y khoa dưới đây sẽ giúp bạn dập tắt nhức mỏi, tái nạp nguồn năng lượng dồi dào và bảo vệ cột sống cực kỳ hiệu quả!</p>

        <blockquote>
          "Giãn cơ định kỳ 5 phút chính là hình thức tái nạp năng lượng sinh học tuyệt vời nhất cho hệ thống cơ xương khớp. Nó ngắt đứt chuỗi tích tụ vi chấn thương trước khi biến thành tổn thương đĩa đệm."
          <span>— Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</span>
        </blockquote>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583121/officecare/blog/lsutu1yfrex9uqvqllzr.webp" alt="7 bài tập giãn cơ 5 phút ngay tại bàn làm việc cho dân văn phòng" />

        <h2>1. Lợi Ích Sinh Học Vượt Trội Của Bài Tập Giãn Cơ 5 Phút</h2>
        <p>Khi bạn giữ nguyên tư thế ngồi trong 1 tiếng, dòng máu nuôi dưỡng cơ bắp sụt giảm 50%, các acid lactic bẫy lại trong tế bào gây cảm giác mỏi nhức. Việc tập giãn cơ mang lại 4 lợi ích vượt trội:</p>

        <ul>
          <li><strong>Gia tăng 200% lưu lượng máu nuôi mô cơ:</strong> Đẩy lùi acid lactic, cấp oxy tức thì cho tế bào thần kinh.</li>
          <li><strong>Giải tỏa 40% áp lực nội đĩa đệm:</strong> Giảm lực nén kéo dài trên các đốt sống thắt lưng L4-L5 và đốt sống cổ C5-C7.</li>
          <li><strong>Kích hoạt hệ thần kinh giao cảm:</strong> Giúp tinh thần tỉnh táo, tập trung cao độ mà không cần phụ thuộc cà phê.</li>
          <li><strong>Cân bằng lại các nhóm cơ co rút ngắn:</strong> Chống lại tình trạng lệch vai gù lưng mạn tính.</li>
        </ul>

        <h2>2. Hướng Dẫn Chi Tiết 7 Động Tác Giãn Cơ Chuẩn Y Khoa Tại Bàn</h2>

        <!-- Bài 1 -->
        <h3>Bài 1: Nghiêng Đầu Kéo Giãn Cơ Thang Cổ (Upper Trapezius Stretch)</h3>
        <p><strong>Nhóm cơ tác động:</strong> Cơ thang trên, cơ nâng vai, cơ gối cổ.</p>
        <p><strong>Cách thực hiện:</strong> Ngồi thẳng lưng, hai vai thả lỏng. Tay trái bám dưới mép ghế để cố định vai trái. Dùng tay phải vòng qua đỉnh đầu đặt nhẹ lên tai trái, nghiêng nhẹ đầu sang bên phải cho tới khi cảm thấy dải cơ cổ bên trái căng giãn dễ chịu. Giữ vững tư thế trong <strong>15 - 20 giây</strong>, hít thở sâu. Đổi bên và lặp lại 3 lần.</p>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583129/officecare/blog/k2gtonfs7sqlmbxzm01c.webp" alt="Bài tập kéo giãn cơ cổ vai gáy chuẩn y khoa" />

        <!-- Bài 2 -->
        <h3>Bài 2: Xoay Bả Vai Mở Lồng Ngực (Seated Shoulder Rolls)</h3>
        <p><strong>Nhóm cơ tác động:</strong> Cơ bả vai sau (Rhomboids), cơ ngực bé.</p>
        <p><strong>Cách thực hiện:</strong> Đặt nhẹ các đầu ngón tay lên hai bả vai cùng bên. Xoay khuỷu tay theo vòng tròn rộng từ trước ra sau 10 lần, sau đó xoay ngược lại 10 lần. Hãy tập trung cảm nhận hai bả vai ép sát vào nhau ở phía sau lồng ngực.</p>

        <!-- Bài 3 -->
        <h3>Bài 3: Mở Ngực & Kéo Giãn Cơ Lưng Trên (Seated Chest Opener)</h3>
        <p><strong>Nhóm cơ tác động:</strong> Cơ ngực lớn, cơ Delta trước.</p>
        <p><strong>Cách thực hiện:</strong> Ngồi sát ra trước mép ghế, đan các ngón tay lại với nhau ở phía sau thắt lưng. Duỗi thẳng hai tay ra sau, đẩy lồng ngực lên cao và ngửa nhẹ đầu ra sau. Giữ trong <strong>15 - 20 giây</strong>, thở đều.</p>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583130/officecare/blog/lcf1d0h82we8jnxzpcna.webp" alt="Bài tập mở ngực kéo giãn cột sống ngực" />

        <!-- Bài 4 -->
        <h3>Bài 4: Kéo Giãn Cơ Gấp Cổ Tay & Cẳng Tay (Wrist Flexor Stretch)</h3>
        <p><strong>Nhóm cơ tác động:</strong> Các bao gân gấp ngón tay, dây thần kinh giữa cổ tay.</p>
        <p><strong>Cách thực hiện:</strong> Duỗi thẳng tay phải ra trước, lòng bàn tay hướng ra ngoài, các ngón tay chỉ lên trần. Dùng tay trái nắm các ngón tay phải kéo nhẹ ngược về phía cơ thể. Giữ trong <strong>15 - 20 giây</strong>. Đổi tay.</p>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583130/officecare/blog/vvtpmwdtiw8hjdzqnyyi.webp" alt="Bài tập giãn cơ cổ tay và cẳng tay văn phòng" />

        <!-- Bài 5 -->
        <h3>Bài 5: Vặn Xoắn Cột Sống Ghế (Seated Spinal Twist)</h3>
        <p><strong>Nhóm cơ tác động:</strong> Cơ chéo bụng, cơ dựng sống thắt lưng.</p>
        <p><strong>Cách thực hiện:</strong> Ngồi thẳng lưng trên ghế, xoay toàn bộ thân trên sang bên phải, tay trái đặt lên đùi phải, tay phải bám vào thành tựa lưng ghế. Hít vào mở ngực, thở ra vặn sâu thêm một chút. Giữ 15 giây rồi đổi bên.</p>

        <!-- Bài 6 -->
        <h3>Bài 6: Kéo Giãn Cơ Hông Mông (Seated Figure-4 Stretch)</h3>
        <p><strong>Nhóm cơ tác động:</strong> Cơ hình lê (Piriformis), cơ mông nhỡ.</p>
        <p><strong>Cách thực hiện:</strong> Đặt mắt cá chân phải lên đùi trái (tạo thành hình số 4). Giữ lưng thật thẳng, từ từ cúi gập người về phía trước cho đến khi cảm thấy vùng mông phải căng giãn sâu. Giữ <strong>20 giây</strong>. Đổi chân.</p>

        <!-- Bài 7 -->
        <h3>Bài 7: Vươn Tay Toàn Thân Tái Nạp Năng Lượng (Full Body Overhead Reach)</h3>
        <p><strong>Nhóm cơ tác động:</strong> Toàn bộ dải cơ dọc sống lưng, cơ liên sườn.</p>
        <p><strong>Cách thực hiện:</strong> Đan hai tay vươn thẳng lên trần nhà, nhón gót chân, hít một hơi thật sâu vươn dài người tối đa. Thở ra thả lỏng tay chân. Thực hiện 3 lần.</p>

        <h2>3. Lời Khuyên Y Khoa Cho Bệnh Nhân Đau Co Thắt Mạn Tính</h2>
        <p>Nếu bạn đã thực hiện bộ bài tập giãn cơ 5 phút trên nhưng các điểm xơ cơ cứng (Trigger points) vẫn gây đau buốt dai dẳng, đó là dấu hiệu dải cơ đã bị tổn thương xơ hóa sâu. Hãy đến ngay **OfficeCare** để được các Bác sĩ chuyên khoa khám lượng giá và áp dụng phác đồ trị liệu cơ sâu MRT giải tỏa nút thắt cơ dứt điểm!</p>

        <p>Hãy liên hệ ngay với <strong>OfficeCare</strong> hôm nay để đặt lịch thăm khám lượng giá sức khỏe cơ xương khớp!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510002/officecare/blog/edz6emlstzhitihfjxzg.webp', 'phong_ngua', 'xuat_ban', '7 bài tập giãn cơ 5 phút tại bàn làm việc cho dân văn phòng', 'Hướng dẫn chi tiết bộ 7 bài tập giãn cơ 5 phút tại bàn làm việc giúp đánh tan đau mỏi cổ vai gáy, thắt lưng và phục hồi cột sống hiệu quả tại OfficeCare.', '7 bài tập giãn cơ, giãn cơ văn phòng, giảm đau vai gáy, bài tập tại bàn làm việc, phòng ngừa thoái hóa cột sống, officecare', 4, 1, '2026-07-29T03:28:06.855Z', '2026-07-29T03:28:06.863Z', '2026-07-29T06:11:54.072Z'),
  ('151a7ac6-a41c-4c45-9a44-5f2453ae060c', 'Điện xung trong vật lý trị liệu có tác dụng gì?', 'dien-xung-trong-vat-ly-tri-lieu-co-tac-dung-gi', 'Tìm hiểu cơ chế giảm đau Thuyết Cổng Kèm và 5 tác dụng vượt trội của điện xung trị liệu (TENS/EMS) trong điều trị đau mỏi cổ vai gáy, thoát vị đĩa đệm không dùng thuốc tại OfficeCare.', '
        <p>Trong y học phục hồi chức năng hiện đại, <strong>Điện xung trị liệu (Electrotherapy / TENS / EMS)</strong> được xem là một trong những phương pháp vật lý trị liệu bảo tồn phổ biến, an toàn và hiệu quả hàng đầu. Không chỉ giúp dập tắt các cơn đau mỏi cổ vai gáy, đau thắt lưng cấp tốc mà điện xung còn hỗ trợ giải tỏa co thắt cơ sâu, phục hồi teo cơ mà không cần dùng đến thuốc giảm đau.</p>

        <blockquote>
          "Dòng điện trị liệu y khoa có tần số và cường độ được tính toán chuẩn xác để tương thích với tần số thần kinh sinh học con người, kích thích cơ thể tự tiết ra chất giảm đau nội sinh mà không có tác dụng phụ."
          <span>— Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</span>
        </blockquote>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583124/officecare/blog/ii1tbgf8fw0iikuj9b6t.webp" alt="Điện xung trong vật lý trị liệu có tác dụng gì" />

        <h2>1. Cơ Chế Hoạt Động Khoa Học Của Điện Xung Trị Liệu</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583131/officecare/blog/fntv0kxgndcoijj2mj1t.webp" alt="Cơ chế tác dụng giảm đau của điện xung trị liệu" />

        <h3>A. Ức Chế Tín Hiệu Đau (Thuyết Cổng Kiểm Soát - Gate Control Theory)</h3>
        <p>Các dòng điện xung TENS tần số cao (80 - 120Hz) kích thích mạnh mẽ vào các sợi thần kinh cảm giác A-beta đường kính lớn. Các tín hiệu này di chuyển nhanh hơn tín hiệu đau của sợi C, "đóng cổng kiểm soát đau" tại sừng sau tủy sống, ngắt hoàn toàn đường truyền tín hiệu đau lên vỏ não bộ gần như ngay lập tức.</p>

        <h3>B. Kích Thích Tiết Endorphin Nội Sinh Tự Nhiên</h3>
        <p>Dòng điện xung tần số thấp (1 - 10Hz) kích thích tuyến yên và hệ thần kinh trung ương giải phóng lượng lớn Endorphin & Enkephalin. Đây là những "chất giảm đau tự nhiên của cơ thể" có tác dụng xoa dịu thần kinh, mang lại cảm giác dễ chịu kéo dài từ 4 đến 8 tiếng sau trị liệu.</p>

        <h3>C. Kích Thích Cơ Sinh Học Nhịp Nhàng (EMS - Electrical Muscle Stimulation)</h3>
        <p>Dòng điện EMS tạo ra các nhịp co - giãn cơ liên tục giống như một "máy bơm sinh học", kích thích tuần hoàn máu vi mạch, đào thải acid lactic đọng lại trong cơ out ra ngoài, giải tỏa hoàn toàn hiện tượng co cứng cơ mạn tính.</p>

        <h2>2. 5 Tác Dụng Vượt Trội Của Điện Xung Trị Liệu Vấn Đề Xương Khớp</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583128/officecare/blog/mbuta4kbi2962ah3rlif.webp" alt="Tác dụng giải tỏa co thắt cơ và tiêu viêm rễ thần kinh" />

        <ol>
          <li><strong>Giảm đau cấp tốc & mạn tính:</strong> Cắt dứt cơn đau cổ vai gáy, đau thắt lưng, đau thần kinh tọa mà không cần dùng thuốc giảm đau hại dạ dày.</li>
          <li><strong>Giải tỏa thắt cơ sâu (Muscle Spasm Relief):</strong> Làm mềm các nút thắt cơ Trigger point ở vùng vai gáy sau 8 tiếng ngồi máy tính.</li>
          <li><strong>Tăng lưu thông máu & Tiêu viêm phù nề:</strong> Gia tăng 200 - 300% lưu lượng máu vi tuần hoàn, đưa oxy và dinh dưỡng đến chữa lành mô viêm.</li>
          <li><strong>Chống teo cơ & Phục hồi lực cơ bắp:</strong> Tái huấn luyện phản xạ cơ cho các trường hợp bị teo cơ do chèn ép rễ thần kinh lâu ngày.</li>
          <li><strong>Tái sinh mô tế bào & Giúp ngủ ngon giấc:</strong> Kích thích tế bào tăng sinh năng lượng ATP, xoa dịu hệ thần kinh thực vật.</li>
        </ol>

        <h2>3. Trải Nghiệm Liệu Trình Điện Xung Chuẩn Y Khoa Tại OfficeCare</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583140/officecare/blog/rgdytovupxyoogiffw3l.webp" alt="Liệu trình điện xung trị liệu công nghệ cao tại OfficeCare" />

        <p>Tại OfficeCare, liệu trình điện xung được Bác sĩ cài đặt sóng tần số phù hợp riêng cho từng bệnh nhân, kết hợp cùng Nhiệt trị liệu hồng ngoại làm ấm cơ và Trị liệu cơ sâu MRT nắn chỉnh đốt sống sai lệch, mang lại hiệu quả dứt điểm cơn đau an toàn.</p>

        <p>Liên hệ ngay với <strong>OfficeCare</strong> hôm nay để được thăm khám lượng giá và trải nghiệm liệu trình điện xung trị liệu công nghệ cao!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510005/officecare/blog/vaoywzv3hs0nitecm8re.webp', 'dieu_tri', 'xuat_ban', 'Điện xung trong vật lý trị liệu có tác dụng gì?', 'Tìm hiểu 5 tác dụng vượt trội của điện xung trị liệu (TENS/EMS) giúp giảm đau cổ vai gáy, giải thắt cơ và phục hồi cột sống hiệu quả tại OfficeCare.', 'điện xung trị liệu, tác dụng của điện xung, TENS, EMS, giảm đau không dùng thuốc, điều trị vai gáy, officecare', 28, 1, '2026-07-29T03:43:54.926Z', '2026-07-29T03:41:58.491Z', '2026-08-03T05:53:20.932Z'),
  ('40d03f7b-5fae-437e-b12e-876d1ef01385', 'Dấu hiệu cho thấy bạn cần gặp chuyên gia vật lý trị liệu ngay', 'dau-hieu-cho-thay-ban-can-gap-chuyen-gia-vat-ly-tri-lieu-ngay', 'Nhận biết 6 dấu hiệu cảnh báo "Red Alert" nguy hiểm từ cột sống và thần kinh cho thấy bạn cần đến gặp Bác sĩ và Chuyên gia Vật lý trị liệu ngay lập tức để tránh biến chứng teo cơ và thoái hóa nặng.', '
        <p>Nhiều người Việt có thói quen <strong>"sống chung với cơn đau"</strong> hoặc tự ý mua thuốc giảm đau, dán cao khi gặp các triệu chứng đau mỏi cổ vai gáy, thắt lưng. Tuy nhiên, sự chịu đựng âm thầm này chính là nguyên nhân khiến các tổn thương nhẹ ban đầu biến chuyển thành bệnh lý mạn tính nguy hiểm như thoái hóa đốt sống, thoát vị đĩa đệm hay teo cơ chèn ép thần kinh vĩnh viễn.</p>

        <blockquote>
          "Một cơn đau kéo dài trên 7 ngày không còn là biểu hiện mỏi cơ đơn thuần. Đó là lời kêu cứu khẩn cấp từ các dây thần kinh đang bị kẹp chặt giữa các khối xơ cơ và đốt sống sai lệch."
          <span>— Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</span>
        </blockquote>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583123/officecare/blog/pdllnbsud4zvbyblpbvl.webp" alt="Dấu hiệu cần gặp chuyên gia vật lý trị liệu ngay" />

        <h2>1. 6 Dấu Hiệu "Báo Động Đỏ" Cột Sống Cần Thăm Khám Ngay</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583143/officecare/blog/vaaaiarexdvdamzkhgjr.webp" alt="Dấu hiệu tê bì và châm chích chi do chèn ép thần kinh" />

        <ol>
          <li><strong>Cơn Đau Kéo Dài Trên 7 - 10 Ngày Không Thuyên Giảm:</strong> Đau mỏi âm ỉ lặp đi lặp lại kéo dài dù đã nghỉ ngơi hay dán cao. Đây là dấu hiệu cơ bắp và khớp đã đi vào trạng thái co thắt mạn tính xơ hóa mô.</li>
          <li><strong>Xuất Hiện Cảm Giác Tê Bì, Châm Chích Ở Tay Hoặc Chân:</strong> Cảm giác như kim chích, kiến bò hoặc tê rần ở ngón tay/bàn chân, phản ánh rễ thần kinh cổ C5-C7 hoặc rễ thần kinh tọa L4-S1 bị chèn ép trực tiếp bởi khối thoát vị đĩa đệm.</li>
          <li><strong>Hạn Chế Tầm Vận Động Rõ Rệt (Giảm ROM):</strong> Khó xoay cổ sang hai bên khi lái xe, cứng lưng buổi sáng không thể cúi gập chạm tay xuống sàn do dính khớp bao sau và ngắn cơ.</li>
          <li><strong>Cơn Đau Lan Rộng (Đau Chiếu):</strong> Đau từ cổ lan xuống vai cánh tay hoặc từ thắt lưng lan sang hông và mông đùi, lan dài theo đường đi chi phối của rễ thần kinh.</li>
          <li><strong>Yếu Cơ, Cầm Nắm Không Chắc Hoặc Dễ Vấp Ngã:</strong> Thường xuyên làm rơi đồ vật, tay bị hẫng lực khi xách đồ, chân bị khuỵu nhẹ, phản ánh nguy cơ teo cơ chèn ép thần kinh nặng cấp độ 3.</li>
          <li><strong>Cơn Đau Tái Phát Liên Tục Mỗi Khi Ngồi 1-2 Tiếng:</strong> Mất hoàn toàn khả năng chịu lực tự nhiên của trục cột sống, đĩa đệm bị xẹp mất tính đàn hồi.</li>
        </ol>

        <h2>2. Phân Tích Giải Phẫu: Điều Gì Đang Xảy Ra Bên Trong Cột Sống?</h2>
        <p>Khi bạn bỏ qua các triệu chứng mỏi cơ ban đầu, chuỗi phản ứng thoái hóa sinh học sẽ xảy ra liên tục:</p>
        <ul>
          <li><strong>Vi tổn thương cơ và dây chằng:</strong> Các sợi cơ gánh tải trọng nén liên tục bị đứt gãy vi mô, hình thành các dải xơ cứng (Trigger points).</li>
          <li><strong>Suy kiệt nước nội đĩa đệm:</strong> Đĩa đệm mất dần khả năng hút nước, xẹp chiều cao khe khớp và giòn bao xơ.</li>
          <li><strong>Mọc gai xương rãnh thần kinh:</strong> Cơ thể tự bồi đắp canxi hình thành các gai xương để ổn định khớp, nhưng lại gây đâm chọc rãnh thần kinh.</li>
        </ul>

        <h2>3. Hậu Quả Nguy Hiểm Nếu Trì Hoãn Điều Trị Phục Hồi</h2>
        <p>Khi bỏ qua các dấu hiệu báo động đỏ, tổn thương sẽ không tự biến mất mà tiến triển xấu theo chuỗi phản ứng sinh học tiêu cực:</p>
        <ul>
          <li><strong>Teo cơ cánh tay và cơ chân:</strong> Rễ thần kinh bị chèn ép lâu ngày ngừng dẫn truyền tín hiệu dinh dưỡng nuôi cơ, khiến khối cơ bị teo rụt không thể phục hồi trọn vẹn.</li>
          <li><strong>Thoát vị đĩa đệm vỡ bao xơ:</strong> Đĩa đệm bị nén liên tục sẽ rách bao xơ, nhân nhầy tràn ra ngoài chèn bóp tủy sống, nguy cơ liệt chi cao.</li>
          <li><strong>Rối loạn thần kinh thực vật:</strong> Đau cổ gáy kéo dài gây sụt giảm lưu lượng máu lên脑, gây thiếu máu脑, hoa mắt, ù tai và mất ngủ mạn tính.</li>
        </ul>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583127/officecare/blog/xzlxtzinzmm81n19kks2.webp" alt="Dấu hiệu hạn chế tầm vận động cột sống" />

        <h2>4. Quy Trình Khám Lượng Giá Chuẩn Y Khoa Tại OfficeCare</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583128/officecare/blog/mbuta4kbi2962ah3rlif.webp" alt="Bác sĩ khám lượng giá và trị liệu phục hồi chức năng tại OfficeCare" />

        <p>Đến với OfficeCare, bạn sẽ được Bác sĩ CKI trực tiếp thăm khám lượng giá tầm vận động khớp, đọc phim X-quang/MRI và thiết lập phác đồ điều trị không dùng thuốc kết hợp Trị liệu bằng tay MRT, Nắn chỉnh Chiropractic và Thiết bị giải áp đĩa đệm kỹ thuật số.</p>

        <h2>5. Giải Đáp Thắc Mắc Thường Gặp (FAQ)</h2>
        <div>>
          <div>>
            <h4>Q: Khi bị tê bì ngón tay đi khám cần chụp chiếu gì?</h4>
            <p>A: Bác sĩ sẽ chỉ định chụp X-quang hoặc MRI cột sống cổ để đánh giá chiều cao đĩa đệm và mức độ hẹp lỗ liên hợp chèn ép rễ thần kinh.</p>
          </div>
          <div>>
            <h4>Q: Đi vật lý trị liệu có cần chuẩn bị gì trước không?</h4>
            <p>A: Bạn nên mặc trang phục thoải mái, mang theo các hồ sơ bệnh án hoặc phim X-quang/MRI cũ (nếu có) để Bác sĩ tiện đối chiếu.</p>
          </div>
        </div>

        <p>Hãy liên hệ ngay với <strong>OfficeCare</strong> hôm nay để đặt lịch thăm khám lượng giá cột sống và bảo vệ sức khỏe của bạn kịp thời!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510004/officecare/blog/o3dhs844hzyqzd1q9ll3.webp', 'suc_khoe', 'xuat_ban', 'Dấu hiệu cho thấy bạn cần gặp chuyên gia vật lý trị liệu ngay', 'Nhận biết 6 dấu hiệu cảnh báo đỏ nguy hiểm từ cột sống và thần kinh cần gặp chuyên gia vật lý trị liệu phục hồi chức năng ngay tại OfficeCare.', 'dấu hiệu gặp chuyên gia vật lý trị liệu, cảnh báo thoái hóa cột sống, tê bì tay chân, yếu cơ, đau cột sống mạn tính, officecare', 22, 1, '2026-07-29T03:33:16.850Z', '2026-07-29T03:33:16.858Z', '2026-08-02T18:14:34.877Z'),
  ('c88827b0-4525-499e-b133-e9a5f9997da7', 'Bao lâu nên đi vật lý trị liệu một lần?', 'bao-lau-nen-di-vat-ly-tri-lieu-mot-lan', 'Tìm hiểu tần suất vật lý trị liệu chuẩn y khoa theo 3 giai đoạn phục hồi (Cấp tính 2-3 lần/tuần, Phục hồi 1-2 lần/tuần, Duy trì 1-2 lần/tháng) và 5 yếu tố quyết định lộ trình tại OfficeCare.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="Bao lâu nên đi vật lý trị liệu một lần? - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="Bao lâu nên đi vật lý trị liệu một lần? - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="Bao lâu nên đi vật lý trị liệu một lần? - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510003/officecare/blog/yzjzavblbnz6edttepuj.webp', 'dieu_tri', 'xuat_ban', 'Bao lâu nên đi vật lý trị liệu một lần? Tần suất chuẩn y khoa', 'Giải đáp bao lâu nên đi vật lý trị liệu một lần theo 3 giai đoạn phục hồi y khoa và các lưu ý tránh sai lầm trong trị liệu cột sống tại OfficeCare.', 'bao lâu nên đi vật lý trị liệu một lần, tần suất vật lý trị liệu, bao nhiêu buổi vật lý trị liệu, liệu trình vật lý trị liệu, officecare', 22, 1, '2026-07-29T03:45:39.181Z', '2026-07-29T03:45:39.191Z', '2026-08-03T05:41:24.154Z'),
  ('7f7cc78b-84a4-48c3-a48b-e196b8915b64', 'Tư thế ngồi làm việc chuẩn giúp giảm đau cổ vai gáy', 'tu-the-ngoi-lam-viec-chuan-giup-giam-dau-co-vai-gay', 'Hướng dẫn 5 quy tắc vàng thiết lập tư thế ngồi làm việc chuẩn Ergonomics công thái học giúp phòng ngừa và giảm triệt để đau mỏi cổ vai gáy, thắt lưng cho dân văn phòng.', '
        <p>Dù bạn có dành hàng giờ đi massage thư giãn hay tập luyện thể thao mỗi tuần, nhưng nếu hàng ngày vẫn duy trì <strong>tư thế ngồi làm việc sai chuẩn trong 8 tiếng</strong>, những cơn đau mỏi cổ vai gáy và thắt lưng vẫn sẽ quay trở lại tàn phá cột sống của bạn. Học cách thiết lập tư thế ngồi chuẩn Ergonomics công thái học chính là phương pháp "trị liệu tự nhiên" hiệu quả và an toàn nhất.</p>

        <blockquote>
          "Tư thế chuẩn không phải là tư thế gồng gượng thẳng đắp, mà là trạng thái các đốt sống và cơ bắp nằm ở vị trí trung tính (Neutral position), tiêu tốn ít năng lượng sinh học nhất."
          <span>— Đội ngũ Bác sĩ Chuyên khoa Phục hồi Chức năng OfficeCare</span>
        </blockquote>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583125/officecare/blog/efhbre8khnjy6banaca8.webp" alt="Tư thế ngồi làm việc chuẩn giúp giảm đau cổ vai gáy" />

        <h2>1. 5 Quy Tắc Vàng Thiết Lập Tư Thế Ngồi Chuẩn Ergonomics</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583139/officecare/blog/pf6rjsbto24xhn68so3i.webp" alt="Tư thế ngồi làm việc chuẩn Ergonomics y khoa" />

        <h3>Quy Tắc 1: Định Vị Đầu & Cổ Thẳng Trục Trọng Tâm</h3>
        <p>Tai của bạn phải nằm trên một đường thẳng đứng gióng trực tiếp xuống tâm bả vai. Giữ cằm thu nhẹ về phía sau (Chin-tuck), mắt nhìn thẳng nghiêng nhẹ 10-15 độ xuống tâm màn hình. Việc này giữ trọng lượng đầu ở mức sinh lý 5kg, ngăn ngừa hoàn toàn lực nén 27kg lên đốt sống cổ C5-C7.</p>

        <h3>Quy Tắc 2: Nâng Đỡ Cột Sống Thắt Lưng (Lumbar Support)</h3>
        <p>Tựa lưng vào ghế ở góc 100 - 110 độ. Sử dụng gối tựa thắt lưng (Lumbar Cushion) áp sát vào đường cong lõm sinh lý của thắt lưng L1-L5. Gối đỡ này chịu trách nhiệm hấp thụ 40% tải trọng nén nội đĩa đệm thắt lưng, chống lại hiện tượng xẹp đĩa đệm do ngồi lâu.</p>

        <h3>Quy Tắc 3: Thả Lỏng Vai & Khuỷu Tay Song Song Mặt Bàn</h3>
        <p>Điều chỉnh chiều cao tay vịn ghế sao cho khuỷu tay gập góc 90 - 100 độ, cẳng tay tựa nhẹ nhàng trên mặt bàn. Hai vai hoàn toàn thả lỏng xuôi down tự nhiên, tránh nâng cao tay vịn làm gồng thắt cơ thang mạn tính.</p>

        <h3>Quy Tắc 4: Vị Trí Hông, Đùi & Bàn Chân Bằng Phẳng</h3>
        <p>Hông gập góc 90 - 100 độ so với đùi. Hai đùi nằm song song với mặt sàn nhà. Hai bàn chân đặt bằng phẳng 100% trên sàn. Nếu ghế quá cao, bắt buộc phải trang bị kê chân công thái học (Footrest) để giữ hông không bị trượt lỏng.</p>

        <h3>Quy Tắc 5: Vị Trí Màn Hình & Bàn Phím Chuẩn</h3>
        <p>Màn hình máy tính đặt cách mắt từ 50 - 70 cm (tương đương chiều dài cánh tay duỗi thẳng). Cạnh trên màn hình phải ngang với tầm mắt nhìn thẳng. Bàn phím và chuột đặt sát mép bàn để cẳng tay không phải vươn xa.</p>

        <h2>2. 4 Lỗi Tư Thế Thường Gặp & Cách Khắc Phục Cấp Tốc</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583114/officecare/blog/udwmaizzksnjq7hu43lv.webp" alt="Cách set up góc làm việc chuẩn công thái học" />

        <ul>
          <li><strong>Lỗi cúi gập cổ nhìn laptop thấp:</strong> Khiến cổ phải chịu áp lực 27kg. Khắc phục: Dùng Giá đỡ Laptop (Laptop Stand) nâng màn hình lên ngang tầm mắt và dùng bàn phím rời.</li>
          <li><strong>Lỗi ngồi bắt chéo chân:</strong> Làm xoay lệch khung chậu, gây vẹo cột sống thắt lưng. Khắc phục: Luôn đặt hai bàn chân bằng phẳng trên sàn, dùng kệ kê chân (Footrest) nếu ghế quá cao.</li>
          <li><strong>Lỗi ngồi trượt mông ra trước gù lưng:</strong> Ép toàn bộ lực nén lên đĩa đệm L4-L5. Khắc phục: Đẩy mông chạm sát vào góc trong cùng của tựa ghế rồi mới ngả lưng tựa.</li>
          <li><strong>Lỗi kẹp điện thoại giữa tai và vai:</strong> Làm co thắt cơ nâng vai một bên cực kỳ nghiêm trọng. Khắc phục: Dùng tai nghe không dây bluetooth khi nghe điện thoại làm việc.</li>
        </ul>

        <h2>3. Giải Pháp Nắn Chỉnh Lệch Trục Tư Thế Tại OfficeCare</h2>

        <img src="https://res.cloudinary.com/lmejf055/image/upload/v1785583128/officecare/blog/mbuta4kbi2962ah3rlif.webp" alt="Luyện tập điều chỉnh tư thế và trị liệu tại OfficeCare" />

        <p>Tại OfficeCare, chúng tôi giúp bạn uốn nắn tư thế thông qua Khám lượng giá trục cột sống với Bác sĩ, Trị liệu giải cơ MRT nắn chỉnh đốt sống sai lệch và Huấn luyện Vận động Kinetic Core tăng sức mạnh nhóm cơ bả vai sau giữ vững tư thế thẳng lâu dài.</p>

        <p>Liên hệ ngay với <strong>OfficeCare</strong> hôm nay để được thăm khám lượng giá và uốn nắn tư thế chuẩn công thái học chuẩn y khoa!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510008/officecare/blog/to2jumc1kicy4atjq9s2.webp', 'phong_ngua', 'xuat_ban', 'Tư thế ngồi làm việc chuẩn giúp giảm đau cổ vai gáy', 'Bí quyết thiết lập tư thế ngồi làm việc chuẩn Ergonomics công thái học giúp giảm đau mỏi cổ vai gáy và bảo vệ cột sống hiệu quả tại OfficeCare.', 'tư thế ngồi chuẩn, giảm đau cổ vai gáy, tư thế công thái học, ergonomics văn phòng, bảo vệ cột sống, officecare', 10, 1, '2026-07-29T03:40:01.376Z', '2026-07-29T03:40:01.383Z', '2026-08-02T18:21:50.576Z'),
  ('b58149b1-e258-4067-8d37-e2d01e873317', '10 thói quen khiến dân văn phòng đau vai gáy mà bạn không ngờ tới', '10-thoi-quen-khien-dan-van-phong-dau-vai-gay-ma-ban-khong-ngo-toi', 'Điểm mặt 10 thói quen vô thức thường ngày như kẹp điện thoại nghe, cúi xem smartphone trưa, xối máy lạnh sau gáy... khiến dân văn phòng bị đau vai gáy mạn tính và cách khắc phục tại OfficeCare.', '
        <p>Theo các bác sĩ chuyên khoa Phục hồi chức năng tại OfficeCare, các vấn đề cơ xương khớp và cột sống ở nhân viên văn phòng, người tập thể thao hay người cao tuổi đều xuất phát từ sự sai lệch cơ học, tổn thương mô mềm và chèn ép thần kinh mạn tính. Việc trang bị kiến thức y khoa chính xác là bước đầu tiên giúp bạn chủ động bảo vệ sức khỏe vận động của mình.</p>

        <h2>1. Tổng quan &amp; Nguyên nhân sinh học gây nên tình trạng</h2>
        <p>Thói quen sinh hoạt thụ động, làm việc liên tục 8-10 tiếng trước màn hình máy tính hoặc tập luyện thể thao sai kỹ thuật làm gia tăng áp lực nén lên các đĩa đệm và ổ khớp. Khi dải màng cơ (fascia) chịu lực kéo căng quá tải trong thời gian dài, nó sẽ rơi vào trạng thái xơ cứng, giảm nuôi dưỡng mạch máu và tạo nên các điểm đau kích hoạt (Trigger Points).</p>
        <p>Các dấu hiệu ban đầu thường bắt đầu bằng cảm giác mỏi ê ẩm âm ỉ, sau đó tiến triển thành các cơn đau nhói cấp tính, tê bì lan xuống các chi và làm hạn chế nghiêm trọng tầm vận động sinh lý của cơ thể.</p>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/physio_hero.png" alt="10 thói quen khiến dân văn phòng đau vai gáy mà bạn không ngờ tới - Nguyên nhân gây tổn thương" />

        <h2>2. Dấu hiệu nhận biết sớm &amp; Các biến chứng nguy hiểm cần lưu ý</h2>
        <p>Bệnh nhân cần đặc biệt chú ý tới các biểu hiện lâm sàng cảnh báo mức độ tổn thương nặng:</p>
        <ul>
          <li><strong>Đau nhói dai dẳng về đêm:</strong> Cơn đau làm mất ngủ, trằn trọc không tìm được tư thế nằm dễ chịu.</li>
          <li><strong>Cảm giác tê bì như kim châm:</strong> Tê lan từ cổ xuống cánh tay hoặc từ thắt lưng xuống đùi và bắp chân.</li>
          <li><strong>Giới hạn biên độ vận động (ROM):</strong> Không thể cúi ngửa thắt lưng, xoay cổ bị kẹt khớp hoặc giơ tay cao quá đầu.</li>
          <li><strong>Teo cơ &amp; Yếu lực tay chân:</strong> Cầm nắm đồ vật hay bị rơi, bước đi không vững hoặc bị vấp chân.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/therapist_treatment.png" alt="10 thói quen khiến dân văn phòng đau vai gáy mà bạn không ngờ tới - Thăm khám lượng giá lâm sàng" />

        <h2>3. Phác đồ vật lý trị liệu &amp; Phục hồi chức năng bảo tồn tại OfficeCare</h2>
        <p>Tại hệ thống phòng khám OfficeCare, chúng tôi kiên trì áp dụng phương pháp <strong>không dùng thuốc - không phẫu thuật</strong>, chú trọng giải quyết triệt để nguyên nhân cơ học gây đau:</p>
        <ul>
          <li><strong>Lượng giá chức năng lâm sàng 1:1:</strong> Bác sĩ CKI trực tiếp đo tầm vận động (ROM), kiểm tra thang điểm đau (VAS) và siêu âm mô cơ tổn thương.</li>
          <li><strong>Ứng dụng công nghệ Châu Âu tiên tiến:</strong> Máy sóng xung kích Shockwave phá tan điểm xơ hóa, Laser công suất cao 30W tiêu viêm sâu và hệ thống kéo giãn giảm áp cột sống kỹ thuật số DTS.</li>
          <li><strong>Kỹ thuật di động khớp &amp; Giải cơ sâu (Myofascial Release):</strong> Kỹ thuật viên dùng tay y khoa nắn chỉnh lệch trục và giải phóng nút thắt xơ cơ.</li>
          <li><strong>Huấn luyện bài tập Kinetic chủ động:</strong> Củng cố nhóm cơ core, trả lại tư thế thẳng tự nhiên và ngăn ngừa đau tái phát.</li>
        </ul>

        <img class="w-full max-h-[380px] object-cover rounded-2xl my-6 shadow-md border border-slate-200" src="/images/recovery_journey.png" alt="10 thói quen khiến dân văn phòng đau vai gáy mà bạn không ngờ tới - Tập luyện phục hồi vận động" />

        <h2>4. Bài tập hướng dẫn tự chăm sóc &amp; Phòng ngừa tái phát tại nhà</h2>
        <p>Bệnh nhân cần kết hợp duy trì chế độ sinh hoạt và bài tập bổ trợ mỗi ngày:</p>
        <ul>
          <li>Nghỉ ngơi 1-2 phút sau mỗi 45-60 phút làm việc liên tục tại bàn.</li>
          <li>Thực hiện các bài tập giãn cơ tĩnh (Static Stretching) nhẹ nhàng vào cuối ngày.</li>
          <li>Uống đủ 2-2.5 lít nước mỗi ngày để giữ độ ngậm nước cho đĩa đệm cột sống.</li>
          <li>Định kỳ 3-6 tháng đến phòng khám OfficeCare để lượng giá lại đường cong sinh lý cột sống.</li>
        </ul>

        <h2>5. Lời khuyên của Bác sĩ Chuyên Khoa I dành cho bệnh nhân</h2>
        <p>Đừng chịu đựng những cơn đau nhức mỏi kéo dài. Hãy liên hệ ngay với đội ngũ Bác sĩ CKI OfficeCare qua Hotline hoặc đăng ký trên Website để được thăm khám lượng giá và lập phác đồ trị liệu bảo tồn chính xác nhất!</p>
      ', 'https://res.cloudinary.com/lmejf055/image/upload/v1785510001/officecare/blog/sjyrbiwf2nsm4l6k2ktt.webp', 'phong_ngua', 'xuat_ban', '10 thói quen khiến dân văn phòng đau vai gáy không ngờ tới', 'Điểm mặt 10 thói quen tai hại tàn phá cột sống cổ của dân văn phòng như kẹp điện thoại, bẻ cổ, cúi đầu xem điện thoại và cách phòng ngừa tại OfficeCare.', '10 thói quen đau vai gáy, đau cổ vai gáy dân văn phòng, bẻ cổ kêu rắc, text neck, phòng ngừa thoái hóa cổ, officecare', 53, 1, '2026-07-29T03:47:38.157Z', '2026-07-29T03:47:38.165Z', '2026-08-03T05:36:19.198Z');

-- --------------------------------------------------------
-- Table: chi_dinh_buoi (0 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "chi_dinh_buoi" CASCADE;

-- --------------------------------------------------------
-- Table: cuoc_hen (0 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "cuoc_hen" CASCADE;

-- --------------------------------------------------------
-- Table: danh_gia (41 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "danh_gia" CASCADE;
INSERT INTO "danh_gia" ("id", "loai_danh_gia", "khach_hang_id", "goi_dich_vu_id", "nhan_su_id", "cuoc_hen_id", "so_sao", "nhan_xet", "ngay_tao", "ngay_cap_nhat", "phan_hoi_nhan_xet", "nguoi_phan_hoi_id", "ngay_phan_hoi", "cam_xuc", "do_tin_cay", "ly_do_cam_xuc", "de_xuat_hanh_dong", "de_xuat_phan_hoi") VALUES
  ('33c0dd48-4df5-497a-b5fb-524ebd4a0f75', 'GOI_DICH_VU', 'de315e58-71e0-48a1-a02a-a8ed22ed20c1', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 5, 'Bác sĩ khám rất kỹ, đo đạc tầm vận động cẩn thận rồi mới kết luận, không vội vàng như phòng khám mình từng đi trước đây.', '2026-07-27T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.92, 'Khách dùng từ ngữ khen ngợi rõ ràng, đánh giá 5/5 sao, ghi nhận cụ thể quy trình khám kỹ lưỡng.', 'Có thể ghi nhận, khen thưởng cho ê-kíp khám và mời khách chia sẻ đánh giá công khai.', 'Phòng khám OfficeCare xin chân thành cảm ơn Anh/Chị đã tin tưởng và dành thời gian chia sẻ trải nghiệm khám tích cực này. Rất mong được đồng hành cùng Anh/Chị trong các buổi tiếp theo!'),
  ('6678a3be-9f22-41cc-ac1c-3cd8a8d923f1', 'GOI_DICH_VU', 'c172c1e9-c189-4d3e-bde9-721722e5b0b3', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 5, 'Được giải thích rõ nguyên nhân đau vai gáy do ngồi sai tư thế lâu ngày, có hình ảnh minh họa dễ hiểu.', '2026-07-27T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách hài lòng với phần giải thích chẩn đoán, đánh giá 5/5 sao, không có phản ánh tiêu cực.', 'Có thể tận dụng làm ví dụ minh họa cho quy trình tư vấn mẫu của phòng khám.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi tích cực. Chúng tôi luôn cố gắng giải thích rõ ràng để Anh/Chị an tâm điều trị, hẹn gặp lại trong các buổi sau!'),
  ('12beb1d6-1aef-4bff-8e92-ab6f97d3dce1', 'GOI_DICH_VU', 'f3d8a789-2959-4e96-afa5-b20a2745076a', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 3, 'Buổi khám diễn ra bình thường, đúng quy trình, chưa có gì đặc biệt để nhận xét thêm.', '2026-07-28T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEUTRAL', 0.55, 'Nội dung mô tả khách quan, không thể hiện rõ cảm xúc hài lòng hay không hài lòng.', 'Chưa cần hành động đặc biệt, có thể theo dõi thêm trải nghiệm ở lần khách quay lại.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã dành thời gian phản hồi. Nếu có góp ý gì thêm để chúng tôi phục vụ tốt hơn, rất mong Anh/Chị chia sẻ qua hotline hoặc quầy lễ tân.'),
  ('0507934a-04cf-435a-91bb-0b9a0a8257e0', 'NHAN_SU', 'de315e58-71e0-48a1-a02a-a8ed22ed20c1', NULL, 5, NULL, 5, 'Bác sĩ Đức khám rất kỹ lưỡng, thao tác chuyên nghiệp, giải thích dễ hiểu.', '2026-07-27T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen bác sĩ chuyên nghiệp, giải thích dễ hiểu, đánh giá 5/5 sao.', 'Ghi nhận, khen thưởng cho bác sĩ phụ trách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã tin tưởng Bác sĩ Đức. Chúng tôi sẽ tiếp tục chuyển lời khen này đến bác sĩ, hẹn gặp lại Anh/Chị!'),
  ('d5de23e5-0d68-4b0f-84db-2f4d0bfbf2c4', 'NHAN_SU', 'c172c1e9-c189-4d3e-bde9-721722e5b0b3', NULL, 5, NULL, 5, 'Bác sĩ Đức tư vấn tận tình, chỉ ra rõ nguyên nhân đau và hướng điều trị phù hợp.', '2026-07-27T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen bác sĩ tư vấn tận tình, chỉ rõ nguyên nhân và hướng điều trị.', 'Ghi nhận cho bác sĩ phụ trách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị. Chúng tôi rất vui vì phần tư vấn của Bác sĩ Đức giúp ích cho Anh/Chị, hẹn gặp lại trong các buổi điều trị tiếp theo!'),
  ('b7ac58fe-0545-405c-9f34-81397cc0a62a', 'NHAN_SU', 'f3d8a789-2959-4e96-afa5-b20a2745076a', NULL, 6, NULL, 3, 'Bác sĩ khám đúng quy trình, mình chưa có nhiều trải nghiệm để đánh giá kỹ hơn.', '2026-07-28T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEUTRAL', 0.5, 'Khách tự nhận chưa đủ cơ sở đánh giá, nội dung trung lập.', 'Chưa cần hành động, có thể chăm sóc thêm ở các lần khám sau.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Rất mong được đồng hành cùng Anh/Chị thêm để mang lại trải nghiệm rõ ràng hơn.'),
  ('9ffc14d8-6426-4aea-a32c-abaa36c94e1d', 'NHAN_SU', '10000000-0000-0000-0000-000000000013', NULL, 5, NULL, 4, 'Bác sĩ Đức tư vấn kỹ, có góp ý thêm về tư thế ngồi làm việc hàng ngày.', '2026-07-31T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.8, 'Khách khen bác sĩ tư vấn kỹ, có góp ý thêm về tư thế ngồi làm việc.', 'Ghi nhận cho bác sĩ phụ trách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị. Rất vui vì phần tư vấn thêm của Bác sĩ Đức hữu ích cho công việc hàng ngày của Anh/Chị!'),
  ('b5978a4a-381d-4518-9256-19b5d7ec9845', 'GOI_DICH_VU', 'fe0a3a4b-a6f4-46d5-9229-30a525289cdb', 'c1000000-0000-0000-0000-000000000101', NULL, NULL, 2, 'Buổi thư giãn nhanh diễn ra hơi vội, cảm giác chưa thư giãn được bao nhiêu thì đã hết giờ, chưa xứng với giá tiền.', '2026-07-27T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEGATIVE', 0.8, 'Khách phản ánh cụ thể về thời lượng dịch vụ chưa tương xứng với chi phí, thể hiện sự không hài lòng.', 'Rà soát lại thời lượng thực tế của gói Thư Giãn Nhanh so với mô tả bán hàng, cân nhắc nhắc KTV đảm bảo đủ thời gian tối thiểu mỗi buổi.', 'Phòng khám OfficeCare xin lỗi vì trải nghiệm gói Thư Giãn Nhanh chưa đáp ứng được kỳ vọng của Anh/Chị. Chúng tôi ghi nhận góp ý về thời lượng và sẽ rà soát lại, rất mong Anh/Chị liên hệ quầy lễ tân để được hỗ trợ thêm.'),
  ('8d721924-ba07-4afb-84fa-f6ec9d144a0b', 'NHAN_SU', 'fe0a3a4b-a6f4-46d5-9229-30a525289cdb', NULL, 7, NULL, 5, 'KTV Dương tay nghề chắc, lực vừa đủ, rất thoải mái sau buổi trị liệu.', '2026-07-27T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen tay nghề và lực tay phù hợp, đánh giá 5/5 sao.', 'Ghi nhận cho KTV Dương, có thể dùng làm minh chứng chất lượng tay nghề.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi tích cực về KTV Dương. Rất vui vì buổi trị liệu mang lại cảm giác thoải mái, hẹn gặp lại Anh/Chị!'),
  ('4af206b5-42d9-4a73-bf33-9fe5eee8afe8', 'GOI_DICH_VU', '10000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 5, 'Bác sĩ hỏi kỹ tiền sử công việc văn phòng, tư vấn rất sát với tình trạng đau lưng của mình.', '2026-07-28T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách đánh giá 5/5 sao, khen ngợi bác sĩ hỏi kỹ tiền sử và tư vấn sát tình trạng thực tế.', 'Ghi nhận cho bác sĩ phụ trách, có thể dùng làm minh chứng chất lượng tư vấn.', 'Phòng khám OfficeCare rất vui vì phần tư vấn giúp ích được cho Anh/Chị. Cảm ơn Anh/Chị đã tin tưởng, hẹn gặp lại trong các buổi điều trị tiếp theo!'),
  ('5c53cb5e-469b-47d2-a5f3-f3f73b4939e8', 'NHAN_SU', '10000000-0000-0000-0000-000000000012', NULL, 6, NULL, 3, 'Buổi khám diễn ra nhanh gọn, chưa có gì để nhận xét thêm.', '2026-07-28T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEUTRAL', 0.5, 'Đánh giá ngắn gọn, mang tính mô tả, không bộc lộ rõ cảm xúc.', 'Có thể khảo sát thêm ở lần tái khám để hiểu rõ trải nghiệm của khách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã dành thời gian phản hồi. Nếu cần trao đổi thêm với Bác sĩ Trang, Anh/Chị có thể chia sẻ trực tiếp ở buổi khám tới.'),
  ('ae575ae6-72ba-4382-8533-e2cff4a0fd2f', 'GOI_DICH_VU', 'bfd7b03e-a26a-4a6a-9562-9ff5bae0286c', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 3, 'Buổi khám lượng giá diễn ra đúng lịch, nội dung tư vấn khá cơ bản, chưa có gì nổi bật.', '2026-07-29T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEUTRAL', 0.5, 'Đánh giá ngắn, mang tính mô tả sự việc, không bộc lộ rõ mức độ hài lòng.', 'Có thể khảo sát thêm ở lần tái khám để hiểu rõ hơn kỳ vọng của khách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Nếu Anh/Chị cần tư vấn chuyên sâu hơn ở lần khám tới, xin vui lòng chia sẻ trực tiếp với bác sĩ hoặc quầy lễ tân.'),
  ('8c0f66fd-9435-4abc-a58c-d9827a663dfc', 'NHAN_SU', 'bfd7b03e-a26a-4a6a-9562-9ff5bae0286c', NULL, 5, NULL, 2, 'Lịch hẹn bị trễ gần 30 phút so với giờ đặt mà không thấy lễ tân báo trước, ảnh hưởng tới lịch làm việc của mình.', '2026-07-29T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEGATIVE', 0.82, 'Khách phản ánh cụ thể việc trễ giờ hẹn và thiếu thông báo, thể hiện rõ sự không hài lòng dù khen bác sĩ khám kỹ.', 'Nhắc lễ tân chủ động báo khách khi có khả năng trễ giờ, liên hệ xin lỗi khách và ưu tiên hỗ trợ ở lần đặt lịch sau.', 'Phòng khám OfficeCare xin lỗi vì đã để Anh/Chị chờ đợi lâu hơn giờ hẹn. Chúng tôi ghi nhận góp ý để cải thiện quy trình thông báo, mong Anh/Chị liên hệ hotline hoặc quầy lễ tân nếu cần hỗ trợ thêm.'),
  ('03341f8a-8e35-420d-8c46-28e2fe3e50de', 'GOI_DICH_VU', '10000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 5, 'Không gian phòng khám sạch sẽ, bác sĩ thân thiện, giải đáp hết thắc mắc trước khi ra về.', '2026-07-29T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen không gian phòng khám và thái độ bác sĩ, đánh giá 5/5 sao.', 'Không cần hành động khắc phục, có thể mời khách đánh giá công khai trên fanpage.', 'Phòng khám OfficeCare cảm ơn những lời khen của Anh/Chị. Chúng tôi luôn cố gắng duy trì không gian sạch sẽ và tận tâm với khách hàng, hẹn gặp lại Anh/Chị!'),
  ('e5a1671a-13bf-44d8-a714-a2b62c4c78c3', 'NHAN_SU', '10000000-0000-0000-0000-000000000011', NULL, 5, NULL, 3, 'Buổi khám diễn ra như mong đợi, không có gì nổi bật để chia sẻ thêm.', '2026-07-29T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEUTRAL', 0.5, 'Nội dung ngắn, trung lập, không thể hiện rõ cảm xúc tích cực hay tiêu cực.', 'Chưa cần hành động đặc biệt.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Rất mong được phục vụ Anh/Chị tốt hơn ở những lần tới.'),
  ('ba7e0456-6648-4277-9c4d-0ada351171cf', 'GOI_DICH_VU', '4ba04f96-3711-4735-8748-b743070cdf3e', 'c1000000-0000-0000-0000-000000000102', NULL, NULL, 5, 'Thư giãn toàn thân đúng nghĩa, sau buổi ngủ ngon hẳn, sẽ đặt lại vào tuần sau.', '2026-07-29T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách đánh giá 5/5 sao, khen hiệu quả rõ rệt và có ý định quay lại.', 'Có thể chủ động nhắc lịch đặt lại cho khách vào tuần sau như khách đã đề cập.', 'Phòng khám OfficeCare cảm ơn Anh/Chị rất nhiều! Chúng tôi rất vui vì gói Thư Giãn Toàn Thân mang lại cảm giác thoải mái cho Anh/Chị, mong sớm được đón tiếp Anh/Chị trở lại.'),
  ('3a89bd87-51d9-4a00-bdb1-bb239b18b541', 'NHAN_SU', '4ba04f96-3711-4735-8748-b743070cdf3e', NULL, 9, NULL, 5, 'KTV Nam làm việc đúng giờ, chuyên nghiệp, lực tay mạnh vừa phải rất dễ chịu.', '2026-07-29T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen KTV đúng giờ, chuyên nghiệp, lực tay phù hợp.', 'Ghi nhận cho KTV Nam.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã ghi nhận sự chuyên nghiệp của KTV Nam. Hẹn gặp lại Anh/Chị trong các buổi trị liệu tiếp theo!'),
  ('dc5fba9c-ad94-49ba-801a-ded74c672d73', 'GOI_DICH_VU', '0ff9117b-4c7f-4e8b-9f86-30bec8b2703e', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 3, 'Quy trình khám khá tiêu chuẩn, mình chưa có đủ trải nghiệm để so sánh với nơi khác.', '2026-07-30T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEUTRAL', 0.5, 'Khách tự nhận chưa có cơ sở so sánh, nội dung trung lập, không thiên về khen hay chê.', 'Chưa cần hành động, có thể chăm sóc thêm ở lần khám tiếp theo để tạo ấn tượng rõ hơn.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Rất mong được phục vụ Anh/Chị thêm trong các lần tới để mang lại trải nghiệm rõ ràng và tốt hơn.'),
  ('35d20403-289f-4ba4-a860-e86621e24d9b', 'NHAN_SU', '0ff9117b-4c7f-4e8b-9f86-30bec8b2703e', NULL, 6, NULL, 5, 'Bác sĩ Trang khám rất chi tiết, đo tầm vận động cẩn thận và giải thích dễ hiểu.', '2026-07-30T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen bác sĩ khám chi tiết, đo tầm vận động cẩn thận.', 'Ghi nhận cho bác sĩ phụ trách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã tin tưởng Bác sĩ Trang. Chúng tôi rất vui vì buổi khám mang lại trải nghiệm tốt, hẹn gặp lại Anh/Chị!'),
  ('a1499aa4-5aa2-40c2-bb37-2c46e54e065a', 'GOI_DICH_VU', '10000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 2, 'Chờ đến lượt khám gần 1 tiếng dù đã đặt hẹn trước, không có ai thông báo tình trạng trễ giờ khiến mình khá bức xúc.', '2026-07-30T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEGATIVE', 0.88, 'Khách phản ánh cụ thể việc chờ đợi quá lâu và không được thông báo, thể hiện rõ sự không hài lòng.', 'Lễ tân cần rà lại quy trình thông báo trễ giờ cho khách, liên hệ xin lỗi trực tiếp và ưu tiên hỗ trợ khách ở lần đặt lịch tiếp theo.', 'Phòng khám OfficeCare thành thật xin lỗi vì đã để Anh/Chị chờ đợi lâu mà không thông báo kịp thời. Chúng tôi ghi nhận góp ý này để cải thiện quy trình đón tiếp, rất mong Anh/Chị liên hệ hotline hoặc quầy lễ tân nếu cần hỗ trợ thêm.'),
  ('c6639490-8b74-431b-a6ea-3dc68e57a3cd', 'NHAN_SU', '10000000-0000-0000-0000-000000000014', NULL, 6, NULL, 2, 'Bác sĩ khám nhanh, có cảm giác hơi vội vì phòng đang đông, mong được dành nhiều thời gian hơn cho bệnh nhân.', '2026-07-30T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEGATIVE', 0.75, 'Khách phản ánh cảm giác buổi khám bị vội do đông bệnh nhân, thể hiện sự chưa hài lòng.', 'Xem xét lại việc phân bổ số lượng bệnh nhân/ca khám của bác sĩ vào khung giờ cao điểm để tránh dồn lịch.', 'Phòng khám OfficeCare xin lỗi vì trải nghiệm khám của Anh/Chị chưa được thoải mái như mong đợi. Chúng tôi ghi nhận góp ý để sắp xếp lịch khám hợp lý hơn, mong Anh/Chị tiếp tục tin tưởng phòng khám.'),
  ('e365f01e-7bb9-4795-90e7-2cfc5338eca1', 'NHAN_SU', 'c172c1e9-c189-4d3e-bde9-721722e5b0b3', NULL, 7, NULL, 2, 'Buổi trị liệu bị trễ hơn 20 phút so với giờ hẹn, KTV không báo trước khiến mình phải chờ khá lâu ở phòng chờ.', '2026-07-30T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEGATIVE', 0.8, 'Khách phản ánh cụ thể việc trễ giờ và thiếu thông báo trong buổi trị liệu.', 'Nhắc KTV chủ động báo khách nếu buổi trước kéo dài, sắp xếp lại thời gian đệm giữa các ca.', 'Phòng khám OfficeCare xin lỗi vì đã để Anh/Chị phải chờ đợi lâu. Chúng tôi ghi nhận phản ánh này để sắp xếp lịch hẹn hợp lý hơn, mong Anh/Chị tiếp tục đồng hành cùng phòng khám.'),
  ('685d48c0-3aa5-424b-a4bb-6403e05fcf9b', 'NHAN_SU', '10000000-0000-0000-0000-000000000011', NULL, 7, NULL, 5, 'KTV Dương chỉnh tư thế rất nhiệt tình, buổi nào cũng góp ý thêm cách ngồi làm việc đúng.', '2026-07-30T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen KTV nhiệt tình, chỉnh tư thế kỹ và góp ý cách ngồi làm việc.', 'Ghi nhận cho KTV Dương.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã ghi nhận sự nhiệt tình của KTV Dương. Hẹn gặp lại Anh/Chị trong các buổi trị liệu tiếp theo!'),
  ('4a037d8b-6b9b-4b47-b409-d5279d101b4e', 'GOI_DICH_VU', '29eec522-929c-4f76-8e91-0b770f4ba430', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 5, 'Bác sĩ tận tâm, kiểm tra kỹ từng động tác và chỉ ra chính xác điểm mình hay bị đau khi ngồi lâu.', '2026-07-31T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách đánh giá 5/5 sao, khen bác sĩ kiểm tra kỹ và chỉ ra chính xác vấn đề.', 'Ghi nhận cho bác sĩ phụ trách, có thể dùng làm case study tư vấn mẫu.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã tin tưởng. Chúng tôi rất vui vì buổi khám giúp xác định đúng vấn đề Anh/Chị gặp phải, hẹn gặp lại trong các buổi điều trị tiếp theo!'),
  ('429e05c5-49e7-48eb-a26a-a814815b8a69', 'NHAN_SU', '29eec522-929c-4f76-8e91-0b770f4ba430', NULL, 5, NULL, 5, 'Bác sĩ Đức kiểm tra kỹ từng động tác, chỉ ra chính xác điểm hay đau khi ngồi lâu.', '2026-07-31T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen bác sĩ kiểm tra kỹ, chỉ ra chính xác điểm đau.', 'Ghi nhận cho bác sĩ phụ trách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị. Chúng tôi rất vui vì Bác sĩ Đức đã xác định đúng vấn đề Anh/Chị gặp phải, hẹn gặp lại Anh/Chị!'),
  ('e85f9bef-09e0-4a9f-802c-7c82c4ff1e76', 'GOI_DICH_VU', '10000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 2, 'Đặt lịch 9h nhưng gần 9h30 mới được gọi vào, mong phòng khám sắp xếp lịch hẹn sát giờ hơn.', '2026-07-31T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEGATIVE', 0.85, 'Khách phản ánh cụ thể việc trễ giờ so với lịch đặt, thể hiện sự không hài lòng về khâu sắp xếp lịch.', 'Rà soát lại việc sắp xếp lịch hẹn cùng khung giờ của bác sĩ để tránh dồn ca, chủ động báo khách nếu có khả năng trễ.', 'Phòng khám OfficeCare xin lỗi vì đã để Anh/Chị phải chờ lâu hơn giờ hẹn. Chúng tôi ghi nhận phản ánh này để sắp xếp lịch hẹn hợp lý hơn, mong Anh/Chị tiếp tục đồng hành cùng phòng khám.'),
  ('f6f2fe48-2bee-4c2b-8f7c-0405e6559851', 'NHAN_SU', '6421670c-b3dd-4920-978d-bf1ac0546bbc', NULL, 10, NULL, 3, 'KTV làm đúng thao tác cơ bản, buổi trị liệu diễn ra bình thường.', '2026-07-31T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEUTRAL', 0.5, 'Nội dung mô tả trung lập, không bộc lộ rõ mức độ hài lòng.', 'Chưa cần hành động đặc biệt, có thể theo dõi thêm ở lần khách quay lại.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Nếu có góp ý gì thêm về buổi trị liệu, rất mong Anh/Chị chia sẻ để chúng tôi cải thiện.'),
  ('0d21d25f-1780-4d29-8394-74f178b22713', 'GOI_DICH_VU', '6421670c-b3dd-4920-978d-bf1ac0546bbc', 'c1000000-0000-0000-0000-000000000103', NULL, NULL, 3, 'Gói dịch vụ ổn, đúng như mô tả, chưa thấy khác biệt rõ rệt so với các gói khác mình từng thử.', '2026-07-31T04:00:00.000Z', '2026-08-03T02:32:46.878Z', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Nếu Anh/Chị muốn tìm hiểu thêm về sự khác biệt giữa các gói dịch vụ, đội ngũ lễ tân luôn sẵn sàng tư vấn chi tiết hơn.', 1, '2026-08-03T05:59:42.640Z', 'NEUTRAL', 0.55, 'Khách nhận xét trung lập, không thể hiện rõ hài lòng hay thất vọng, chỉ so sánh chung chung.', 'Có thể tư vấn thêm cho khách về điểm khác biệt của gói để khách hiểu rõ giá trị nhận được.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Nếu Anh/Chị muốn tìm hiểu thêm về sự khác biệt giữa các gói dịch vụ, đội ngũ lễ tân luôn sẵn sàng tư vấn chi tiết hơn.'),
  ('ad7f82e1-0288-4122-a0d8-129d70be6e8b', 'NHAN_SU', '10000000-0000-0000-0000-000000000012', NULL, 10, NULL, 5, 'KTV Minh Anh trị liệu đúng bài, theo dõi phản hồi của mình liên tục trong buổi.', '2026-07-31T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.85, 'Khách khen KTV trị liệu đúng bài, theo dõi phản hồi liên tục trong buổi.', 'Ghi nhận cho KTV Minh Anh.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã ghi nhận sự tận tâm của KTV Minh Anh. Hẹn gặp lại Anh/Chị trong các buổi tiếp theo!'),
  ('dee92896-5b23-4774-8c57-1d4f1100371c', 'GOI_DICH_VU', '82c626ae-ab2e-49f8-9632-c6d277c48279', 'c1000000-0000-0000-0000-000000000000', NULL, NULL, 5, 'Được lượng giá chức năng rất bài bản, bác sĩ nhẹ nhàng và giải thích cặn kẽ từng bước kiểm tra.', '2026-08-01T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen quy trình lượng giá chức năng bài bản và thái độ nhẹ nhàng, đánh giá 5/5 sao.', 'Ghi nhận, có thể khen thưởng bác sĩ phụ trách buổi khám.', 'Phòng khám OfficeCare cảm ơn những chia sẻ tích cực của Anh/Chị. Chúng tôi rất vui vì đã mang lại trải nghiệm khám thoải mái, hẹn gặp lại Anh/Chị ở các buổi sau!'),
  ('a06455f3-94a9-427b-87df-ec69ff7e9303', 'NHAN_SU', '82c626ae-ab2e-49f8-9632-c6d277c48279', NULL, 6, NULL, 5, 'Bác sĩ Trang lượng giá chức năng rất bài bản, nhẹ nhàng và giải thích cặn kẽ.', '2026-08-01T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen bác sĩ lượng giá chức năng bài bản, nhẹ nhàng.', 'Ghi nhận cho bác sĩ phụ trách.', 'Phòng khám OfficeCare cảm ơn Anh/Chị. Chúng tôi rất vui vì Bác sĩ Trang đã mang lại trải nghiệm khám thoải mái, hẹn gặp lại Anh/Chị!'),
  ('47c703ea-28ee-4734-aab6-ae1a6bafe4d1', 'NHAN_SU', 'c172c1e9-c189-4d3e-bde9-721722e5b0b3', NULL, 8, NULL, 5, 'KTV Linh trị liệu nhẹ nhàng, tỉ mỉ, còn hướng dẫn thêm bài tập giãn cơ tại nhà.', '2026-08-01T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.9, 'Khách khen KTV nhẹ nhàng, tỉ mỉ, có hướng dẫn thêm bài tập tại nhà.', 'Ghi nhận cho KTV Linh, có thể nhân rộng cách tư vấn thêm bài tập cho các KTV khác.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã ghi nhận sự tận tâm của KTV Linh. Chúng tôi sẽ tiếp tục duy trì chất lượng này, hẹn gặp lại Anh/Chị!'),
  ('4c708226-5353-480a-b66d-bb1514136c24', 'NHAN_SU', '10000000-0000-0000-0000-000000000014', NULL, 8, NULL, 5, 'KTV Linh trị liệu tỉ mỉ, hướng dẫn thêm bài tập giãn cơ để tập ở nhà giữa các buổi.', '2026-08-01T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen KTV tỉ mỉ, hướng dẫn thêm bài tập giãn cơ tại nhà.', 'Ghi nhận cho KTV Linh, nhân rộng cách tư vấn bài tập bổ trợ cho các KTV khác.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã ghi nhận sự tận tâm của KTV Linh. Chúng tôi sẽ tiếp tục duy trì chất lượng này, hẹn gặp lại Anh/Chị!'),
  ('91665bd0-cf82-4d86-a449-32cb2ccaf530', 'GOI_DICH_VU', '1f649190-a2e5-4349-bd58-6b8ddd4abfdf', 'c1000000-0000-0000-0000-000000000101', NULL, NULL, 4, 'Thời lượng ngắn gọn đúng như mô tả, giảm mỏi vai gáy khá rõ sau buổi trị liệu.', '2026-08-01T07:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.75, 'Khách đánh giá 4/5 sao, ghi nhận hiệu quả giảm mỏi vai gáy rõ rệt sau buổi trị liệu.', 'Không cần hành động đặc biệt, có thể theo dõi thêm để chuyển thành khách hàng thân thiết.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã phản hồi. Rất vui vì gói Thư Giãn Nhanh đã giúp Anh/Chị giảm mỏi vai gáy, hẹn gặp lại trong những buổi tiếp theo!'),
  ('02ae2f30-f3c4-41a3-ba71-dd4534ec9c65', 'NHAN_SU', '1f649190-a2e5-4349-bd58-6b8ddd4abfdf', NULL, 8, NULL, 2, 'Buổi trị liệu khá ngắn so với thời lượng được tư vấn ban đầu, cảm giác chưa đã hết mỏi vai như mong đợi.', '2026-08-01T07:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'NEGATIVE', 0.78, 'Khách phản ánh cụ thể về thời lượng buổi trị liệu không đúng như tư vấn ban đầu.', 'Kiểm tra lại thời gian thực hiện của KTV so với thời lượng đã tư vấn cho khách, nhắc đảm bảo đủ thời gian mỗi buổi.', 'Phòng khám OfficeCare xin lỗi vì thời lượng buổi trị liệu chưa đúng như tư vấn ban đầu. Chúng tôi ghi nhận góp ý này và sẽ rà soát lại, mong Anh/Chị liên hệ quầy lễ tân để được hỗ trợ thêm.'),
  ('2b69af7b-0a40-42bb-ae6a-c3c37bccf395', 'NHAN_SU', '10000000-0000-0000-0000-000000000011', NULL, 9, NULL, 5, 'KTV Nam chuyên nghiệp, lực tay chuẩn, mỗi buổi đều hỏi cảm giác trước khi điều chỉnh liệu trình.', '2026-08-02T04:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen KTV chuyên nghiệp, lực tay chuẩn, chủ động hỏi cảm giác trước khi điều chỉnh.', 'Ghi nhận cho KTV Nam.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã ghi nhận sự chuyên nghiệp của KTV Nam. Hẹn gặp lại Anh/Chị trong các buổi tiếp theo!'),
  ('7c02f47c-fe17-470f-984c-5d11c5441e47', 'NHAN_SU', '10000000-0000-0000-0000-000000000012', NULL, 9, NULL, 5, 'KTV Nam theo dõi tiến độ điều trị rất sát, mỗi buổi đều hỏi thăm cảm giác trước khi bắt đầu.', '2026-08-02T05:30:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen KTV theo dõi sát tiến độ điều trị qua từng buổi.', 'Ghi nhận cho KTV Nam, có thể làm gương cho quy trình theo dõi tiến độ khách của các KTV khác.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã ghi nhận sự tận tâm của KTV Nam. Chúng tôi sẽ tiếp tục đồng hành sát sao cùng Anh/Chị trong liệu trình!'),
  ('74d243c6-3428-43f4-972d-e9e01d4fb9e0', 'GOI_DICH_VU', 'a96fdd6d-951a-4a17-980a-a2461e84b4d7', 'c1000000-0000-0000-0000-000000000102', NULL, NULL, 5, 'Gói toàn thân giải tỏa hết phần lưng dưới vốn hay mỏi do ngồi cả ngày, rất đáng tiền.', '2026-08-02T07:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen hiệu quả giảm mỏi vùng lưng dưới, đánh giá 5/5 sao.', 'Ghi nhận cho KTV phụ trách, có thể mời khách trải nghiệm thêm gói liệu trình liên quan.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã chia sẻ trải nghiệm tích cực. Rất vui vì gói dịch vụ giúp Anh/Chị giảm mỏi lưng dưới hiệu quả, hẹn gặp lại Anh/Chị!'),
  ('f4aac8a8-24ea-43d2-ad46-f0e7bcc050a0', 'NHAN_SU', 'a96fdd6d-951a-4a17-980a-a2461e84b4d7', NULL, 9, NULL, 5, 'KTV Nam làm rất kỹ vùng lưng dưới, đúng chỗ mình hay mỏi nhất do ngồi văn phòng cả ngày.', '2026-08-02T07:00:00.000Z', '2026-08-03T02:32:46.878Z', NULL, NULL, NULL, 'POSITIVE', 0.88, 'Khách khen KTV làm kỹ đúng vùng lưng dưới hay mỏi.', 'Ghi nhận cho KTV Nam.', 'Phòng khám OfficeCare cảm ơn Anh/Chị đã chia sẻ trải nghiệm tích cực. Rất vui vì KTV Nam đã đáp ứng đúng nhu cầu của Anh/Chị, hẹn gặp lại!'),
  ('3698e66b-91cd-445d-a51e-a86e05f67bbd', 'GOI_DICH_VU', 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'c1000000-0000-0000-0000-000000000102', NULL, NULL, 5, 'ok', '2026-08-03T06:00:32.524Z', '2026-08-03T06:00:32.524Z', NULL, NULL, NULL, 'NEUTRAL', 0.85, 'Khách hàng chấm 5 sao nhưng nội dung phản hồi quá ngắn (''ok''), thiếu thông tin chi tiết để kết luận mức độ hài lòng cụ thể.', 'Lễ tân không cần hành động đặc biệt, chỉ cần gửi câu trả lời cảm ơn ngắn gọn theo mẫu.', 'Phòng khám OfficeCare xin cảm ơn Anh/Chị đã dành thời gian đánh giá dịch vụ. Rất hân hạnh được đồng hành cùng Anh/Chị trong quá trình phục hồi sức khỏe. Nếu cần hỗ trợ thêm thông tin gì, Anh/Chị vui lòng liên hệ hotline hoặc nhắn tin cho phòng khám nhé.'),
  ('32c8d01d-b635-43ed-a3df-0323c10ea8ec', 'NHAN_SU', 'd5d1baf4-628a-4622-ba35-95da33c19c16', NULL, 7, NULL, 5, 'ok', '2026-08-03T06:00:32.166Z', '2026-08-03T06:00:32.166Z', NULL, NULL, NULL, 'NEUTRAL', 0.85, 'Nội dung đánh giá quá ngắn gọn và thiếu thông tin chi tiết để kết luận rõ cảm xúc, mặc dù khách hàng chấm 5 sao.', 'Lễ tân không cần thực hiện hành động đặc biệt, chỉ cần gửi lời cảm ơn và sẵn sàng hỗ trợ khi khách hàng cần.', 'Cảm ơn Anh/Chị đã gửi phản hồi và dành thời gian đánh giá cho Phòng khám OfficeCare. Sự ủng hộ của Anh/Chị luôn là động lực để phòng khám nỗ lực duy trì chất lượng dịch vụ. Nếu cần hỗ trợ thêm thông tin hoặc đặt lịch khám, Anh/Chị vui lòng nhắn tin cho phòng khám nhé!');

-- --------------------------------------------------------
-- Table: giao_dich_thanh_toan (0 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "giao_dich_thanh_toan" CASCADE;

-- --------------------------------------------------------
-- Table: goi_dich_vu (8 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "goi_dich_vu" CASCADE;
INSERT INTO "goi_dich_vu" ("id", "ten_goi", "loai_goi", "tong_so_buoi", "thoi_luong_phut", "don_gia", "don_gia_theo_buoi", "trang_thai", "anh_goi", "anh_gallery", "muc_tieu", "quy_trinh", "han_su_dung_mac_dinh_ngay") VALUES
  ('c1000000-0000-0000-0000-000000000102', 'Gói Thư Giãn Toàn Thân', 'LE', 1, 60, '299000', '299000', 'hoat_dong', '/images/goi/anh_goi_dich_vu_le_thu_gian_toan_than.png', '["/images/goi/anh_nho_goi_thu_gian_toan_than_1.png","/images/goi/anh_nho_goi_thu_gian_toan_than_2.png"]'::jsonb, 'Thư giãn toàn diện các nhóm cơ vùng cổ, vai, lưng và đầu sau thời gian làm việc kéo dài.
Hỗ trợ giảm căng cứng cơ, cải thiện tuần hoàn máu và nâng cao sự dẻo dai cơ thể.', '1. Massage thư giãn cổ - vai - gáy & lưng: Xoa bóp, ấn huyệt giải tỏa căng cơ vùng cổ, vai gáy và toàn bộ vùng lưng do ngồi lâu.
2. Massage đầu & thái dương: Massage nhẹ nhàng giúp giảm áp lực tinh thần, tăng cảm giác thư thái và hỗ trợ giấc ngủ ngon.
3. Kéo giãn cơ nhẹ: Thực hiện các động tác kéo giãn nhẹ nhàng nhằm tăng độ linh hoạt khớp cơ, giảm cảm giác co cứng.', 60),
  ('c1000000-0000-0000-0000-000000000103', 'Gói Phục Hồi Toàn Diện', 'LE', 1, 90, '399000', '399000', 'hoat_dong', '/images/goi/anh_dai_dien_goi_le_phuc_hoi_toan_dien.png', '["/images/goi/anh_con_goi_le_phuc_hoi_toan_dien_1.png","/images/goi/anh_con_goi_le_phuc_hoi_toan_dien_2.png"]'::jsonb, 'Thư giãn sâu nhiều nhóm cơ trên cơ thể (cổ, vai, lưng, chân, đầu).
Hỗ trợ giảm co cứng cơ, tăng lưu thông máu toàn thân và phục hồi năng lượng thể chất.', '1. Chườm nóng & Massage cổ - vai - gáy - lưng: Nhiệt trị liệu làm mềm cơ kết hợp xoa bóp chuyên sâu giảm đau mỏi vùng vai gáy và lưng.
2. Massage chân & bắp chân: Xoa bóp day ấn nhẹ chi dưới giúp giảm cảm giác nặng chân, tê mỏi và hỗ trợ tuần hoàn máu.
3. Massage đầu & Kéo giãn cơ toàn thân: Massage thư giãn thần kinh vùng đầu kết hợp kéo giãn linh hoạt các khớp cơ toàn cơ thể.
4. Nhiệt trị liệu phục hồi: Tác động nhiệt sâu giúp giãn cơ tối đa, duy trì hiệu quả thư giãn và phục hồi thể trạng.', 60),
  ('c1000000-0000-0000-0000-000000000201', 'Liệu trình Điều trị Cổ - Vai - Gáy', 'LIEU_TRINH', 8, 60, '2600000', '325000', 'hoat_dong', '/images/goi/anh_dai_dien_lieu_trinh_dieu_tri_co_vai_gay.png', '["/images/goi/anh_con_lieu_trinh_dieu_tri_co_vai_gay_1.png","/images/goi/dien_xung_co_vai_gay.png"]'::jsonb, 'Giảm đau, giảm co cứng cơ vùng cổ, vai và gáy do duy trì tư thế ngồi lâu.
Khôi phục biên độ vận động của cổ (cúi, ngửa, xoay cổ linh hoạt).
Tăng tuần hoàn máu, giảm chèn ép rễ thần kinh và hạn chế đau mỏi tái phát.', '1. Nhiệt trị liệu & Thư giãn mô mềm: Chườm nóng kết hợp xoa bóp day miết làm mềm mô cơ nông và tăng lưu thông máu vùng cổ vai gáy.
2. Trị liệu thủ công (Manual Therapy) & Kéo giãn: Tác động sâu giải phóng nút thắt cơ (Trigger points) và kéo giãn tăng độ linh hoạt đốt sống cổ.
3. Điện xung & Siêu âm trị liệu: Dòng điện xung và sóng siêu âm điều trị giúp tiêu viêm, giảm đau rễ thần kinh sâu và chống co thắt cơ.
4. Bài tập phục hồi chức năng & HEP: Hướng dẫn bài tập tăng sức mạnh cơ cổ vai gáy, cải thiện tư thế và chương trình tự tập tại nhà.', 60),
  ('c1000000-0000-0000-0000-000000000101', 'Gói Thư Giãn Nhanh', 'LE', 1, 30, '10000', '10000', 'hoat_dong', '/images/goi/anh_dai_dien_goi_le_thu_gian_nhanh.png', '["/images/goi/anh_con_goi_le_thu_gian_nhanh_1.png","/images/goi/anh_con_goi_le_thu_gian_nhanh_2.png"]'::jsonb, 'Giúp thư giãn nhanh các nhóm cơ vùng cổ, vai và gáy bị căng cứng do ngồi máy tính kéo dài.
Hỗ trợ giảm cảm giác mỏi cơ, tăng lưu thông máu và giảm căng thẳng tinh thần.', '1. Massage thư giãn cổ - vai - gáy: Xoa, bóp, day miết nhẹ nhàng giúp làm giãn bó cơ căng cứng và cải thiện tuần hoàn máu vùng cổ vai gáy.
2. Massage đầu thư giãn: Massage nhẹ nhàng vùng đầu và thái dương giúp giải tỏa căng thẳng thần kinh, mang lại trạng thái thư thái.', NULL),
  ('c1000000-0000-0000-0000-000000000000', 'Khám lâm sàng & Lượng giá chức năng cơ xương khớp', 'KHAM', 1, 30, '200000', '200000', 'hoat_dong', '/images/goi/kham_sang_loc.png', '["/images/goi/kham_sang_loc.png","/images/goi/kham_luong_gia_rom.png"]'::jsonb, 'Xác định chính xác nguyên nhân gốc rễ gây đau cơ xương khớp cấp và mạn tính.
Lượng hóa mức độ suy giảm chức năng vận động cột sống.
Phát hiện sớm các dấu hiệu thoát vị đĩa đệm, thoái hóa khớp tiềm ẩn.
Xây dựng lộ trình trị liệu phục hồi chức năng khoa học, không dùng thuốc.
Tư vấn thay đổi tư thế làm việc công thái học (Ergonomics) tại văn phòng.', 'Đo chỉ số sinh tồn và khai thác bệnh sử chi tiết của bệnh nhân.
Bác sĩ trực tiếp thăm khám lâm sàng vùng cột sống cổ, vai gáy, thắt lưng.
Lượng giá chức năng sinh học vận động, đo tầm vận động (ROM) của các khớp.
Kiểm tra các điểm đau lệch trục cơ thể và các bất thường về tư thế.
Lập phác đồ điều trị phục hồi chức năng cá nhân hóa phù hợp với mức độ tổn thương.', NULL),
  ('c1000000-0000-0000-0000-000000000202', 'Liệu trình Điều trị Đau Lưng Văn Phòng', 'LIEU_TRINH', 10, 75, '3200000', '320000', 'hoat_dong', '/images/goi/anh_dai_dien_lieu_trinh_dieu_tri_dau_lung_van_phong.png', '["/images/goi/anh_con_lieu_trinh_dieu_tri_dau_lung_van_phong_1.png","/images/goi/keo_gian_decompression_that_lung.png"]'::jsonb, 'Giảm đau thắt lưng, giảm co cứng cơ lưng do ngồi lâu hoặc sai tư thế.
Cải thiện sự dẻo dai cột sống và tăng khả năng chịu tải của cơ thắt lưng.
Tăng cường sức mạnh nhóm cơ lõi (Core) giúp ổn định cột sống và hạn chế tái phát.', '1. Nhiệt trị liệu & Thư giãn mô mềm vùng lưng: Chườm nóng làm giãn nở vi mạch, giảm căng cứng các nhóm cơ thắt lưng dưới.
2. Trị liệu thủ công & Kéo giãn cột sống: Nắn chỉnh di động khớp nhẹ nhàng, kéo giãn giảm áp lực lên đĩa đệm và rễ thần kinh thắt lưng.
3. Điện xung & Siêu âm trị liệu: Sử dụng dòng điện xung TENS/EMS và sóng siêu âm ức chế đường truyền đau, giảm co thắt cơ lưng sâu.
4. Bài tập tăng cường cơ Core & HEP: Hướng dẫn bài tập củng cố nhóm cơ lõi lưng bụng và thiết lập chương trình tự tập tại nhà.', 60),
  ('c1000000-0000-0000-0000-000000000204', 'Liệu trình Phục hồi Chức năng Văn phòng (Chuyên sâu)', 'LIEU_TRINH', 15, 90, '4500000', '300000', 'hoat_dong', '/images/goi/anh_dai_dien_lieu_trinh_phuc_hoi_chuc_nang_van_phong.png', '["/images/goi/anh_con_lieu_trinh_phuc_hoi_chuc_nang_van_phong_1.png","/images/goi/laser_shockwave_chuyen_sau.png"]'::jsonb, 'Phục hồi chức năng vận động toàn diện cho khách hàng gặp đau vai gáy, đau lưng và sai tư thế.
Tăng sức mạnh hệ cơ, độ dẻo dai của khớp và khả năng ổn định cột sống.
Xây dựng nền tảng vận động bền vững, ngăn ngừa đau mỏi mạn tính tái phát.', '1. Nhiệt trị liệu & Thư giãn mô mềm toàn thân: Chườm nóng kết hợp xoa bóp giải tỏa căng cứng cơ đa vùng (cổ, vai, lưng).
2. Trị liệu thủ công chuyên sâu: Nắn chỉnh di động khớp, giải phóng chèn ép rễ thần kinh và kéo giãn phục hồi biên độ vận động.
3. Điện xung & Siêu âm trị liệu công nghệ cao: Tiêu viêm sâu, giảm đau tức thì và tăng tốc độ tái tạo mô cơ xương khớp.
4. Bài tập PHCN cá nhân hóa & HEP: Thiết lập bài tập củng cố hệ cơ core toàn diện, chỉnh tư thế chuẩn và bài tập duy trì tại nhà.', 70),
  ('c1000000-0000-0000-0000-000000000203', 'Liệu trình Cải thiện Tư thế Văn phòng', 'LIEU_TRINH', 12, 90, '3600000', '300000', 'hoat_dong', '/images/goi/anh_dai_dien_lieu_trinh_cai_thien_tu_the_van_phong.png', '["/images/goi/anh_con_lieu_trinh_cai_thien_tu_the_van_phong_1.png","/images/goi/chinh_tu_the_gugu_vai_tron.png"]'::jsonb, 'Đánh giá và cải thiện sai lệch tư thế cổ đưa ra trước, vai lệch và gù lưng nhẹ.
Giảm đau mỏi vùng cổ, vai, lưng do duy trì tư thế không đúng kéo dài.
Tăng cường sức mạnh cơ trung tâm (Core) và duy trì tư thế công thái học chuẩn.', '1. Giải cơ sâu & Kéo giãn cơ co rút: Tác động giải phóng các bó cơ ngực lớn và cơ cổ trước bị co ngắn do thói quen gù lưng vai tròn.
2. Trị liệu thủ công nắn chỉnh cột sống: Cải thiện tầm vận động khớp, điều chỉnh sự sai lệch nhẹ của trục cột sống cổ, ngực và thắt lưng.
3. Điện xung kích thích cơ yếu: Dùng dòng điện xung kích thích phục hồi các nhóm cơ lưng sau bị suy yếu, tăng khả năng giữ tư thế thẳng.
4. Bài tập chỉnh tư thế & Kinetic Core: Rèn luyện bài tập chuyên biệt điều chỉnh gù lưng, vai tròn và hướng dẫn thói quen tư thế đúng.', 60);

-- --------------------------------------------------------
-- Table: ho_so_chuyen_gia (6 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "ho_so_chuyen_gia" CASCADE;
INSERT INTO "ho_so_chuyen_gia" ("id", "nguoi_dung_id", "so_nam_kinh_nghiem", "bang_cap_chung_chi", "mo_ta", "the_manh", "so_khach_song_song") VALUES
  (1, 5, 12, '{"text":"Bác sĩ Chuyên khoa I PHCN - ĐH Y Dược TP.HCM\nChứng nhận đào tạo Trị liệu thần kinh cột sống Chiropractic y khoa Singapore\nChứng chỉ hành nghề Phục hồi chức năng cơ xương khớp Bộ Y tế cấp","images":["/images/nhansu/cert_assess.png","/images/nhansu/cert_physio.png"]}', 'Bác sĩ Nguyễn Minh Đức là chuyên gia hàng đầu về cơ xương khớp cột sống với hơn 12 năm kinh nghiệm thực tế. Từng công tác tại các chuyên khoa Phục hồi chức năng lớn, ông nổi tiếng với phương pháp khám cơ sinh học vận động sâu sắc, tìm ra chính xác trục lệch cột sống do ngồi sai tư thế. Bác sĩ Đức đã trực tiếp xây dựng phác đồ phục hồi không dùng thuốc cho hơn 2.000 bệnh nhân văn phòng gặp tình trạng thoát vị đĩa đệm lưng và thoái hóa cột sống cổ, giúp họ giải thoát khỏi cơn đau mạn tính dai dẳng, khôi phục chất lượng cuộc sống cao.', '["Trị liệu thoát vị đĩa đệm thắt lưng","Khám lượng giá sinh cơ học cột sống","Điều trị Chiropractic y khoa","Thiết lập phác đồ PHCN cá nhân hóa"]'::jsonb, 1),
  (2, 6, 8, '{"text":"Thạc sĩ Vật lý trị liệu & PHCN - Đại học Y Hà Nội\nChứng chỉ kỹ thuật Laser siêu cao tần và Shockwave hội tụ chuẩn Quốc tế\nChứng chỉ hành nghề Chuyên môn vật lý trị liệu Bộ Y tế cấp","images":["/images/nhansu/cert_assess.png","/images/nhansu/cert_physio.png"]}', 'Bác sĩ Trần Thị Thu Trang sở hữu chuyên môn vững vàng trong điều trị các bệnh lý đau mỏi vai gáy cấp và mạn tính của dân công sở. Với 8 năm kinh nghiệm chuyên sâu, bà luôn áp dụng sáng tạo các công nghệ y học vật lý như Laser công suất cao tiêu viêm sâu và sóng xung kích Shockwave phá vỡ các điểm xơ cơ (Trigger Points), mang lại hiệu quả giảm đau tức thì cho bệnh nhân mà không gây đau buốt hay cần can thiệp xâm lấn.', '["Trị liệu hội chứng cổ vai gáy mạn tính","Tiêu viêm rễ thần kinh bằng Laser","Sóng xung kích giải trigger points","Phục hồi chấn thương bả vai"]'::jsonb, 1),
  (3, 7, 6, '{"text":"Cử nhân Vật lý trị liệu - Đại học Y Dược TP.HCM\nChứng chỉ kỹ thuật di động khớp khớp cột sống Manual Therapy tiêu chuẩn Úc","images":["/images/nhansu/cert_physio.png"]}', 'Kỹ thuật viên Lê Văn Dương được mệnh danh là chuyên gia có đôi tay vàng trong trị liệu giải phóng cơ khớp. Với 6 năm kinh nghiệm thực hành trị liệu bằng tay (Manual Therapy) và di động khớp chuyên sâu, anh giúp bệnh nhân khôi phục hoàn toàn biên độ vận động của các khớp đốt sống cổ và thắt lưng bị kẹt do tư thế làm việc gù ngồi kéo dài.', '["Kỹ thuật di động khớp Manual Therapy","Giải cơ sâu Myofascial Release","Nắn khớp thắt lưng giải kẹt","Xoa bóp cơ học y khoa sâu"]'::jsonb, 2),
  (4, 8, 5, '{"text":"Cử nhân Vật lý trị liệu - PHCN Đại học Y Dược\nChứng chỉ bài tập y khoa phục hồi vận động Kinetic Rehab do Hội PHCN cấp","images":["/images/nhansu/cert_assess.png"]}', 'Kỹ thuật viên Nguyễn Thùy Linh chuyên trách vận động trị liệu chủ động. Cô có hơn 5 năm kinh nghiệm đồng hành cùng bệnh nhân thực hiện các bài tập Kinetic phục hồi tư thế, tăng cơ lõi core lưng bụng. Cô đặc biệt mát tay trong điều trị bảo tồn hội chứng ống cổ tay cho dân IT, thiết kế đồ họa và kế toán.', '["Vận động trị liệu Kinetic Rehab","Phục hồi hội chứng ống cổ tay","Hướng dẫn tập chỉnh lệch tư thế","Kéo giãn cơ co rút sâu"]'::jsonb, 2),
  (5, 9, 4, '{"text":"Chứng chỉ Kỹ thuật viên Vật lý trị liệu Trường Cao đẳng Y tế\nChứng chỉ Vận hành máy trị liệu công nghệ cao Bệnh viện Chợ Rẫy","images":["/images/nhansu/cert_physio.png"]}', 'Kỹ thuật viên Phạm Thành Nam là chuyên gia vận hành thiết bị vật lý trị liệu hiện đại. Anh chịu trách nhiệm chính điều phối giường kéo giãn cột sống giảm áp áp lực âm kỹ thuật số, cài đặt thông số điện xung giảm đau mỏi lưng dưới. Sự chu đáo và theo dõi thông số chuẩn xác của anh giúp bệnh nhân phục hồi cực kỳ an tâm.', '["Vận hành máy kéo giãn giảm áp","Cài đặt điện xung y khoa","Siêu âm bao gân trị liệu","Theo dõi thông số an toàn thiết bị"]'::jsonb, 2),
  (6, 10, 4, '{"text":"Chứng chỉ Kỹ thuật viên Massage trị liệu y học cổ truyền\nChứng chỉ trị liệu giải phóng màng cơ myofascial sâu Viện PHCN","images":["/images/nhansu/cert_assess.png"]}', 'Kỹ thuật viên Đặng Minh Anh chuyên sâu về trị liệu giải cơ ngực lớn, cơ chéo cổ trước và phục hồi thẩm mỹ tư thế vai tròn gù lưng. Cô áp dụng nhuần nhuyễn sự kết hợp lực tay mềm mại, ấn huyệt kích hoạt lưu thông máu vùng vai cổ giúp bệnh nhân xua tan căng thẳng thể chất lẫn tinh thần sau ngày làm việc bận rộn.', '["Điều chỉnh vai tròn gù lưng","Giải tỏa cơ co thắt ngực/cổ","Massage bấm huyệt trị liệu","Giãn cơ sâu thư giãn vùng gáy"]'::jsonb, 2);

-- --------------------------------------------------------
-- Table: hoa_don (0 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "hoa_don" CASCADE;

-- --------------------------------------------------------
-- Table: khach_hang (21 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "khach_hang" CASCADE;
INSERT INTO "khach_hang" ("id", "ho_ten", "email", "mat_khau_hash", "so_dien_thoai", "dia_chi", "ngay_sinh", "gioi_tinh", "trang_thai", "diem_uy_tin", "ngay_dong_y_dieu_khoan", "phai_doi_mat_khau") VALUES
  ('10000000-0000-0000-0000-000000000014', 'Phạm Thị Dung', 'kh4@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0912000014', '23 Điện Biên Phủ, Q3, TP.HCM', '1995-04-28T17:00:00.000Z', 'nu', 'hoat_dong', 100, NULL, FALSE),
  ('10000000-0000-0000-0000-000000000013', 'Lê Quang Cường', 'kh3@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0912000013', '78 Trần Hưng Đạo, Q5, TP.HCM', '1985-11-06T17:00:00.000Z', 'nam', 'hoat_dong', 100, NULL, FALSE),
  ('59394ad7-46d8-41b3-aab1-64b39b6467d8', 'dsa', 'kindc0506@gmail.com', '$2b$10$JUGmGqafBvYoxwtbISm9IObPNrziW5IwoWkum8WQrvvjCXYN9aqJ.', '0325699522', '', NULL, 'nam', 'hoat_dong', 100, NULL, TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Trần Thị Bảo', 'kh2@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0912000012', '45 Lê Lợi, Q1, TP.HCM', '1992-07-20T17:00:00.000Z', 'nu', 'hoat_dong', 60, '2026-07-23T16:06:38.484Z', FALSE),
  ('9b5d5e46-90a2-41f0-a36b-d0a9fb69b7c1', 'Trần Vinh', 'ngoclong@gmail.com', '$2b$10$RbsAH2HVUzBD6L1jNfU2T.25z9qNDjSX85VnOah/skF55WejbAJfW', '0365899554', NULL, NULL, 'nam', 'hoat_dong', 100, NULL, TRUE),
  ('f3d8a789-2959-4e96-afa5-b20a2745076a', 'Nguyễn Văn Minh', 'minh.nguyen2026@gmail.com', '$2b$10$xyz', '0912345678', '123 Nguyễn Trãi, Q.5, TP.HCM', '1985-04-10T17:00:00.000Z', 'nam', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('82c626ae-ab2e-49f8-9632-c6d277c48279', 'Trần Thị Thanh Hằng', 'thanhhang.tran@gmail.com', '$2b$10$xyz', '0987654321', '45 Lê Văn Sỹ, Q.3, TP.HCM', '1990-08-18T17:00:00.000Z', 'nu', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('1f649190-a2e5-4349-bd58-6b8ddd4abfdf', 'Lê Hoàng Yến', 'hoangyen.le@gmail.com', '$2b$10$xyz', '0938889900', '12 Trần Hưng Đạo, Q.1, TP.HCM', '1993-01-13T17:00:00.000Z', 'nu', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('4ba04f96-3711-4735-8748-b743070cdf3e', 'Vũ Đức Thành', 'ducthanh.vu@gmail.com', '$2b$10$xyz', '0977665544', '56 Hoàng Văn Thụ, Q.Phú Nhuận, TP.HCM', '1982-06-28T17:00:00.000Z', 'nam', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('6421670c-b3dd-4920-978d-bf1ac0546bbc', 'Đặng Ngọc Anh', 'ngocanh.dang@gmail.com', '$2b$10$xyz', '0918223344', '102 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM', '1995-12-08T17:00:00.000Z', 'nu', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('c172c1e9-c189-4d3e-bde9-721722e5b0b3', 'Bùi Anh Tuấn', 'anhtuan.bui@gmail.com', '$2b$10$xyz', '0909556677', '34 Võ Văn Tần, Q.3, TP.HCM', '1988-09-23T17:00:00.000Z', 'nam', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('de315e58-71e0-48a1-a02a-a8ed22ed20c1', 'Hoàng Mỹ Duyên', 'myduyen.hoang@gmail.com', '$2b$10$xyz', '0944112233', '78 CMT8, Q.10, TP.HCM', '1991-03-16T17:00:00.000Z', 'nu', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('29eec522-929c-4f76-8e91-0b770f4ba430', 'Đỗ Tiến Dũng', 'tiendung.do@gmail.com', '$2b$10$xyz', '0933778899', '220 Cộng Hòa, Q.Tân Bình, TP.HCM', '1975-07-06T17:00:00.000Z', 'nam', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('0ff9117b-4c7f-4e8b-9f86-30bec8b2703e', 'Trịnh Khánh Linh', 'khanhlinh.trinh@gmail.com', '$2b$10$xyz', '0966445566', '15 Nguyễn Đình Chiểu, Q.1, TP.HCM', '1998-02-26T17:00:00.000Z', 'nu', 'hoat_dong', 100, '2026-05-28T13:11:20.850Z', FALSE),
  ('a24c8cea-c4a8-4a5c-abc4-9cb8909f5301', 'Nguyên huỳnh', 'nguyenhuynh123@gmail.com', '$2b$10$NvLQJ4037mM4tloPM2t6Xe4feao1/yFC9RcYaEq2FrQM9XhLjAh52', '0385964258', '', '2026-08-10T17:00:00.000Z', 'nam', 'hoat_dong', 100, NULL, FALSE),
  ('10000000-0000-0000-0000-000000000011', 'Nguyễn Văn An', 'kh1@gmail.com', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', '0358966332', '12 Nguyễn Huệ, Q1, TP.HCM', '1988-03-13T17:00:00.000Z', 'nam', 'hoat_dong', 20, '2026-07-24T15:29:08.461Z', FALSE),
  ('d5d1baf4-628a-4622-ba35-95da33c19c16', 'Trần Vinh', 'kintran0506@gmail.com', '$2b$10$NoEYhj5wWixtpWxWRPrrjeZSaHZcME3yS/xhOWiQ74NNYQXQkqxya', '0398655332', '', NULL, 'khac', 'hoat_dong', 60, '2026-07-18T12:42:13.067Z', FALSE),
  ('6da96437-ee20-48e2-82f0-49fe8470841c', 'kin duy', 'kinduy0506@gmail.com', '$2b$10$C.Hq.OK4vEbE3ak6XLXX3.VCduSDCg6KXiY5i7vYGhE2qyGy78hXq', '0369855447', '1', '2026-07-12T17:00:00.000Z', 'nam', 'hoat_dong', 100, '2026-07-19T06:28:45.881Z', FALSE),
  ('bfd7b03e-a26a-4a6a-9562-9ff5bae0286c', 'Phạm Quốc Bảo', 'quocbao.pham@gmail.com', '$2b$10$xyz', '0903112233', '88 Nguyễn Thị Minh Khai, Q.1, TP.HCM', '1978-11-03T17:00:00.000Z', 'nam', 'hoat_dong', 90, '2026-05-28T13:11:20.850Z', FALSE),
  ('a96fdd6d-951a-4a17-980a-a2461e84b4d7', 'Trần Vinh', 'vinhtcpd0969@gmail.com', '$2b$10$kXQHf2OHcvy6iP2Fx7j3MugFgwzqTYBIap0EqXVjTxIL56pDTS5K2', '0365488995', '', NULL, 'khac', 'hoat_dong', 80, '2026-07-17T09:44:56.757Z', FALSE),
  ('fe0a3a4b-a6f4-46d5-9229-30a525289cdb', 'Mã Hùng Quân', 'kinquan0506@gmail.com', '$2b$10$hcdnlgKViyDVETGwcP.Uz.ETM0k/QW5UcSfiVrtJ5/OhiWGFixPcK', '0398655774', NULL, '2017-01-13T17:00:00.000Z', 'nam', 'hoat_dong', 10, '2026-07-17T08:24:25.908Z', FALSE);

-- --------------------------------------------------------
-- Table: khuyen_mai_voucher (2 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "khuyen_mai_voucher" CASCADE;
INSERT INTO "khuyen_mai_voucher" ("id", "ma_code", "loai_giam_gia", "gia_tri_giam", "giam_toi_da", "don_hang_toi_thieu", "ngay_bat_dau", "ngay_het_han", "so_luong_gioi_han", "dang_kich_hoat", "yeu_cau_thanh_toan", "ten_chien_dich", "tu_dong_ap_dung", "kenh_ap_dung", "loai_goi_ap_dung") VALUES
  ('c9b037e1-11f1-4d39-b06d-a9ce12047dcf', 'UUDAIONLINE', 'phan_tram', '10', '100000', '0', '2026-08-09T00:00:00.000Z', NULL, NULL, TRUE, '["tat_ca"]'::jsonb, 'Ưu Đãi Khách Hàng Thanh Toán Online ', TRUE, '["online"]'::jsonb, '["tat_ca"]'::jsonb),
  ('9adfb81b-c4f4-4560-9ed3-d47b6ba6d143', 'Ưu đãi online', 'phan_tram', '15', NULL, '0', '2026-08-09T00:00:00.000Z', NULL, 1, TRUE, '["tat_ca"]'::jsonb, 'TRi ân khách hàng 2/9', FALSE, '["online"]'::jsonb, '["tat_ca"]'::jsonb);

-- --------------------------------------------------------
-- Table: lich_truc_nhan_su (45 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "lich_truc_nhan_su" CASCADE;
INSERT INTO "lich_truc_nhan_su" ("id", "nhan_su_id", "ngay_truc", "ca_truc", "gio_bat_dau", "gio_ket_thuc", "trang_thai", "phong_id") VALUES
  ('c34800df-18be-4432-8adc-fdc6b1f8e3ef', 3, '2026-08-02T17:00:00.000Z', 'SANG', '07:00:00', '12:00:00', 'hoat_dong', NULL),
  ('0f4940f4-787c-4edb-bf79-e4d88e84c7c0', 5, '2026-07-26T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('4640d1c2-203d-40e1-b352-37d5117505c0', 7, '2026-07-26T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('734ffdec-cf4b-458c-9816-508c6f136f11', 6, '2026-07-27T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('e7b5693e-ac0f-48e5-86e4-c28bc638057c', 8, '2026-07-27T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('5a935cf6-d529-4f20-b172-630e724a1172', 5, '2026-07-28T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('b853b7d9-b182-4dd4-a850-5b4b0aff5b23', 9, '2026-07-28T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('35f8adb8-9bf0-4c80-88ff-cf5f26caed2c', 6, '2026-07-29T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('338c1b39-4469-4a48-8f93-4b4fae7d07cf', 7, '2026-07-29T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('27da23eb-54f3-40af-bd70-96bad2bdc7b2', 5, '2026-07-30T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('e0038d45-402f-4822-bf68-c54f801790cc', 10, '2026-07-30T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('639d1a06-a4bb-4322-b497-8a81461dd74b', 6, '2026-07-31T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('957bbe43-323f-425c-bbab-9a731b9bba41', 8, '2026-07-31T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('0c0c95b2-885d-4360-989d-b7e21de4b84d', 5, '2026-08-01T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('c071f2f3-9d2e-4b1d-b1e5-ff517dd1e85c', 9, '2026-08-01T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('c443f0d2-f972-4c5a-bbf1-91d1bbaafacd', 5, '2026-08-02T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('6a152fe2-aa02-42ba-8302-08b2fb738966', 6, '2026-08-02T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 1),
  ('47b881f0-cd2f-4cb4-b87c-9af99352fbf4', 10, '2026-08-02T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('271c72c8-3bea-44cc-8cd6-765dd8ad9497', 4, '2026-08-02T17:00:00.000Z', 'CHIEU', '12:00:00', '20:00:00', 'hoat_dong', NULL),
  ('4603c9d3-c1ef-472a-a227-d89d0402de1d', 7, '2026-08-02T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('3c4bb9c1-a861-4934-a525-81a078e497f1', 8, '2026-08-02T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 2),
  ('1cb8d1c3-415f-4e14-b457-df20d091b52d', 9, '2026-08-02T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 2),
  ('13b5a7d6-b898-4d99-b7d4-9b710dd15f6f', 5, '2026-08-03T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('59a7937e-a98d-406f-96a5-a6f8ddf54557', 6, '2026-08-03T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 1),
  ('707121a2-19cd-4f65-9cc7-b7a82b05356a', 3, '2026-08-03T17:00:00.000Z', 'SANG', '07:00:00', '12:00:00', 'hoat_dong', NULL),
  ('dbe73bd9-8ac3-441b-ad95-82ed559b5b36', 4, '2026-08-03T17:00:00.000Z', 'CHIEU', '12:00:00', '20:00:00', 'hoat_dong', NULL),
  ('97947215-e6d0-42fd-88e7-00dfa1d6e30a', 7, '2026-08-03T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('f7c4f0c9-4e72-440e-be47-0a1197461aed', 8, '2026-08-03T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 2),
  ('4b5bacbc-1c9e-421d-be92-75b57ea6a992', 9, '2026-08-03T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('e931bfd4-011d-42cf-bd04-e91baf0edcb1', 10, '2026-08-03T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 2),
  ('dc295607-38c3-4454-a0af-1ec6b5542995', 5, '2026-08-04T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('55c7456c-85ba-4f35-a44c-17779fca1fce', 5, '2026-08-05T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('80d7c9c2-6026-49f9-9703-7efcde41d1dd', 5, '2026-08-06T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('b93a0cc3-6275-4e0f-9a19-978626319cdb', 7, '2026-08-06T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('bcffe0fa-614b-4b96-a478-310a29879881', 6, '2026-08-06T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 1),
  ('de8e150e-9a9e-414c-8209-dcd3c64f167e', 8, '2026-08-06T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 2),
  ('2ed607d7-34c2-492e-97b2-2cdb1ca60b77', 5, '2026-08-07T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('d2a9927b-6614-4de4-a0bb-b5a2e262742c', 6, '2026-08-07T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 1),
  ('8614aff8-90ac-41df-a60d-05c33d357aa5', 7, '2026-08-07T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('d2979e16-348e-49de-a23e-972f567f335e', 5, '2026-08-08T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 1),
  ('92cde03c-352c-4bad-94c4-7b10b11f51ed', 6, '2026-08-08T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 1),
  ('63f4556d-ee04-495e-aee3-37d56e2a35af', 7, '2026-08-08T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('4a76ac42-d76a-44b1-aae0-808cc05d281f', 8, '2026-08-08T17:00:00.000Z', 'SANG', '11:00:00', '20:00:00', 'hoat_dong', 2),
  ('9c480043-35d7-4b56-b577-56dabfde5011', 7, '2026-08-15T17:00:00.000Z', 'SANG', '07:00:00', '16:00:00', 'hoat_dong', 2),
  ('2d377043-8af8-4cab-8d68-1e039173eb6d', 10, '2026-08-07T17:00:00.000Z', 'CHIEU', '12:20:00', '22:20:00', 'hoat_dong', NULL);

-- --------------------------------------------------------
-- Table: nguoi_dung (10 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "nguoi_dung" CASCADE;
INSERT INTO "nguoi_dung" ("id", "ho_ten", "email", "so_dien_thoai", "mat_khau_hash", "vai_tro_id", "trang_thai", "anh_dai_dien") VALUES
  (1, 'Nguyễn Admin Hệ Thống', 'admin@officecare.vn', '0901000001', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 5, 'hoat_dong', NULL),
  (2, 'Trần Minh Quản Lý', 'quanly@officecare.vn', '0901000002', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 6, 'hoat_dong', NULL),
  (4, 'Phạm Ngọc Mai', 'letan2@officecare.vn', '0901000004', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 2, 'hoat_dong', NULL),
  (3, 'Lê Thị Hoa', 'letan1@officecare.vn', '0901000003', '$2b$10$MUE4RBWFyDQiuTYIGjdQJupf0ej4jBBB7UqBwg6/R2FY7wfvZfL2i', 2, 'hoat_dong', NULL),
  (5, 'BS. CKI Nguyễn Minh Đức', 'duc.nguyen@officecare.vn', '0901000105', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 4, 'hoat_dong', '/images/nhansu/dr_nguyen_minh_duc.png'),
  (6, 'BS. Trần Thị Thu Trang', 'trang.tran@officecare.vn', '0901000106', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 4, 'hoat_dong', '/images/nhansu/dr_tran_thi_thu_trang.png'),
  (7, 'KTV. Lê Văn Dương', 'duong.le@officecare.vn', '0901000107', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/images/nhansu/ktv_le_van_duong.png'),
  (8, 'KTV. Nguyễn Thùy Linh', 'linh.nguyen@officecare.vn', '0901000108', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/images/nhansu/ktv_nguyen_thuy_linh.png'),
  (9, 'KTV. Phạm Thành Nam', 'nam.pham@officecare.vn', '0901000109', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/images/nhansu/ktv_pham_thanh_nam.png'),
  (10, 'KTV. Đặng Minh Anh', 'anh.dang@officecare.vn', '0901000110', '$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu', 3, 'hoat_dong', '/images/nhansu/ktv_dang_minh_anh.png');

-- --------------------------------------------------------
-- Table: nhat_ky_buoi_dieu_tri (0 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "nhat_ky_buoi_dieu_tri" CASCADE;

-- --------------------------------------------------------
-- Table: otp_codes (46 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "otp_codes" CASCADE;
INSERT INTO "otp_codes" ("id", "email", "otp", "expires_at", "created_at") VALUES
  ('f18160f9-b2eb-4e0b-ab3a-4f5a0f1978a1', 'kh1@gmail.com', '606595', '2026-07-05T02:18:15.884Z', '2026-07-05T02:08:15.889Z'),
  ('c080aaba-02d5-4b21-929b-9df555ed5da9', 'kh1@gmail.com', '212593', '2026-07-05T02:21:51.158Z', '2026-07-05T02:11:51.159Z'),
  ('4d4924fb-261b-41ff-bd40-5ea264cbef23', 'kh1@gmail.com', '942811', '2026-07-05T02:25:48.172Z', '2026-07-05T02:15:48.172Z'),
  ('f98fad99-23ab-4395-89a3-b6c2d8e1694a', 'kh1@gmail.com', '988520', '2026-07-05T02:26:09.081Z', '2026-07-05T02:16:09.081Z'),
  ('fd2f1db1-0824-40cc-ba05-a6d543f01382', 'kh1@gmail.com', '857703', '2026-07-05T02:49:03.557Z', '2026-07-05T02:39:03.560Z'),
  ('732cf55c-4def-410e-9146-c4f6a586cbe2', 'kh1@gmail.com', '129536', '2026-07-05T03:49:10.789Z', '2026-07-05T03:39:10.790Z'),
  ('7305fd19-35ab-44b2-8b51-65d7ad12851b', 'kh1@gmail.com', '268158', '2026-07-05T03:49:34.044Z', '2026-07-05T03:39:34.045Z'),
  ('97f15a88-d6af-40d3-bc87-dcf2db03549b', 'kh1@gmail.com', '282956', '2026-07-05T03:50:47.592Z', '2026-07-05T03:40:47.592Z'),
  ('dc331d9e-9bb6-408e-89fc-92f24c7c6446', 'kh1@gmail.com', '619930', '2026-07-05T03:55:24.533Z', '2026-07-05T03:45:24.534Z'),
  ('fb51890a-bfbb-4e2e-8129-0b7f5166240f', 'kh1@gmail.com', '329115', '2026-07-05T03:59:27.855Z', '2026-07-05T03:49:27.856Z'),
  ('165b4898-42d7-417b-8778-03390dc3f047', 'kh1@gmail.com', '896190', '2026-07-06T11:03:00.818Z', '2026-07-06T10:53:00.827Z'),
  ('3be018b8-6b28-4e01-bd87-3f054e8a904a', 'kh1@gmail.com', '641643', '2026-07-15T02:47:27.134Z', '2026-07-15T02:37:27.142Z'),
  ('5263e3be-5b50-4ab5-aee6-eb59f30815cc', 'vinhtcpd09969@gmail.com', '618644', '2026-07-15T07:40:07.387Z', '2026-07-15T07:30:07.405Z'),
  ('61332b24-2984-41c2-b1a2-0ef1628e9b82', 'vinhtcpd09969@gmail.com', '372279', '2026-07-15T08:04:08.160Z', '2026-07-15T07:54:08.174Z'),
  ('0b3d4c5c-55c2-450d-a52c-ebd109277606', 'vinhtcpd09969@gmail.com', '679623', '2026-07-16T03:33:45.063Z', '2026-07-16T03:23:45.069Z'),
  ('d7bb7dc3-befd-49d2-87c6-03e23acf743c', 'vinhtcpd09969@gmail.com', '984803', '2026-07-16T15:39:23.953Z', '2026-07-16T15:29:23.967Z'),
  ('3e2cdd80-ea4c-41be-8be1-bd2040e0e9ef', 'vinhtcpd09969@gmail.com', '672691', '2026-07-16T16:20:45.447Z', '2026-07-16T16:10:45.455Z'),
  ('c7f05099-4bf0-4950-87fb-e4c1ac801231', 'vinhtcpd09969@gmail.com', '106408', '2026-07-16T16:40:47.119Z', '2026-07-16T16:30:47.121Z'),
  ('22cab5ba-91e4-4958-90db-ec6cdb52f53d', 'vinhtcpd09969@gmail.com', '335675', '2026-07-17T00:16:19.792Z', '2026-07-17T00:06:19.796Z'),
  ('0307d4d4-6195-49a5-a1f1-9a06cfb2b6b9', 'vinhtcpd09969@gmail.com', '100746', '2026-07-17T00:51:08.062Z', '2026-07-17T00:41:08.064Z'),
  ('ecd4136c-2928-4711-8ddb-1a6b7ad693d1', 'vinhtcpd09969@gmail.com', '460796', '2026-07-17T01:56:22.764Z', '2026-07-17T01:46:22.766Z'),
  ('def1f7de-fd6e-46d6-a8a6-115dcc83da81', 'vinhtcpd0969@gmail.com', '610114', '2026-07-17T09:38:19.613Z', '2026-07-17T09:28:19.649Z'),
  ('d4c7b960-6ed4-4c3c-b0e8-5f83aaab3e03', 'vinhtcpd0969@gmail.com', '251054', '2026-07-17T09:54:56.846Z', '2026-07-17T09:44:56.850Z'),
  ('c9eba6e9-9d59-4751-8afa-4cac3ce6d517', 'kinquan0506@gmail.com', '884937', '2026-07-17T11:42:26.212Z', '2026-07-17T11:32:26.215Z'),
  ('8f24409c-555e-4be1-95c6-88bae81781ac', 'kinquan0506@gmail.com', '428942', '2026-07-17T11:45:46.153Z', '2026-07-17T11:35:46.154Z'),
  ('4097b29d-94ff-4243-bc2d-1148a95b5c0d', 'kinduy0506@gmail.com', '282315', '2026-07-19T06:45:59.662Z', '2026-07-19T06:35:59.663Z'),
  ('6fd5eb37-2824-4c2a-b4b1-ceee9f3c3e8f', 'vinhtcpd09969@gmail.com', '327570', '2026-07-19T13:00:25.881Z', '2026-07-19T12:50:25.923Z'),
  ('793ea6d0-153a-41e8-970a-4baa50f0df6b', 'vinhtcpd09969@gmail.com', '522265', '2026-07-19T13:05:48.828Z', '2026-07-19T12:55:48.830Z'),
  ('cd29ee1f-7368-4f8b-add8-a8df5a960641', 'vinhtcpd09969@gmail.com', '635136', '2026-07-19T13:10:53.360Z', '2026-07-19T13:00:53.361Z'),
  ('0e8c0c09-5dbf-4b25-a688-72959ba61f49', 'vinhtcpd09969@gmail.com', '975575', '2026-07-19T14:39:31.206Z', '2026-07-19T14:29:31.213Z'),
  ('8a783e0e-6a6d-441f-967b-0ac6020c13d5', 'vinhtcpd09969@gmail.com', '741017', '2026-07-19T14:42:21.005Z', '2026-07-19T14:32:21.005Z'),
  ('00e0e835-eec2-4739-bd5b-31b7284b67f3', 'vinhtcpd09969@gmail.com', '141661', '2026-07-19T16:57:54.724Z', '2026-07-19T16:47:54.728Z'),
  ('7d6e001b-d5ee-40a2-bcef-fb0c079851c1', 'vinhtcpd09969@gmail.com', '326012', '2026-07-19T17:12:50.560Z', '2026-07-19T17:02:50.562Z'),
  ('3838ee83-9e6a-486a-941e-410b2c08b791', 'vinhtcpd09969@gmail.com', '178839', '2026-07-21T11:13:40.566Z', '2026-07-21T11:03:40.572Z'),
  ('4ef498eb-adc8-46e9-9f46-010e50781dd3', 'kh1@gmail.com', '625822', '2026-07-23T12:47:12.651Z', '2026-07-23T12:37:12.661Z'),
  ('5c1c243a-390b-48eb-a630-53f44bec1c44', 'kintran0506@gmail.com', '714087', '2026-07-24T16:12:48.570Z', '2026-07-24T16:02:48.589Z'),
  ('01633f89-a1ff-4251-9cd6-c63d7e04a933', 'kh2@gmail.com', '915593', '2026-07-24T17:12:09.078Z', '2026-07-24T17:02:09.082Z'),
  ('be6b24ae-ec41-4c70-a3cc-19746e0e4ec0', 'kh2@gmail.com', '755267', '2026-07-24T17:20:23.816Z', '2026-07-24T17:10:23.818Z'),
  ('c2b488b2-cbfc-4bac-a82e-e5c7584f1753', 'kh1@gmail.com', '377296', '2026-07-25T17:24:56.190Z', '2026-07-25T17:14:56.197Z'),
  ('0231fed5-06bb-47c2-864e-ed7d8cd7e1f0', 'kinquan0506@gmail.com', '359180', '2026-07-26T16:11:04.712Z', '2026-07-26T16:01:04.715Z'),
  ('94345af6-110e-4b09-8d34-ac0e63ff8385', 'kinquan0506@gmail.com', '169977', '2026-07-26T16:27:09.565Z', '2026-07-26T16:17:09.566Z'),
  ('7b868f04-4728-40af-ace9-70fb8a582c35', 'kh1@gmail.com', '741571', '2026-07-31T11:12:24.746Z', '2026-07-31T11:02:24.747Z'),
  ('86288be8-911f-4f1e-94a2-7030e5ea2529', 'kh1@gmail.com', '887121', '2026-07-31T11:16:54.361Z', '2026-07-31T11:06:54.363Z'),
  ('ec5f26e5-ec7b-47f1-9934-f6a56a291733', 'kh1@gmail.com', '999875', '2026-08-03T03:20:09.685Z', '2026-08-03T03:10:09.693Z'),
  ('37d5f0b2-522f-4724-ae54-aa6926a8777d', 'kh1@gmail.com', '730457', '2026-08-03T14:21:53.650Z', '2026-08-03T14:11:53.657Z'),
  ('37730e0b-1a8d-4f4e-8166-b9b9692dac0d', 'kh3@gmail.com', '278654', '2026-08-03T14:56:27.367Z', '2026-08-03T14:46:27.385Z');

-- --------------------------------------------------------
-- Table: phac_do_dieu_tri (0 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "phac_do_dieu_tri" CASCADE;

-- --------------------------------------------------------
-- Table: phien_chat_ai (8 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "phien_chat_ai" CASCADE;
INSERT INTO "phien_chat_ai" ("id", "session_id", "khach_hang_id", "created_at") VALUES
  ('31cef138-98e4-4e70-9d54-7bdf0d65bf57', '389ff31a-0eca-4ab5-b720-05002475cb21', '10000000-0000-0000-0000-000000000011', '2026-07-28T14:44:57.952Z'),
  ('06c60df3-8138-4bd9-b109-03f509713417', 'acbfcc93-2988-47fd-aa28-cda6c6cdc792', '10000000-0000-0000-0000-000000000011', '2026-07-28T16:27:58.329Z'),
  ('552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'd846f1a3-b59a-44a7-b154-5dec75eeb318', NULL, '2026-07-30T15:55:42.556Z'),
  ('6871e88b-144e-432b-a99e-7b7bc3170d70', 'demo-thesis-vanan-20260803', '10000000-0000-0000-0000-000000000011', '2026-08-03T07:23:49.550Z'),
  ('d164042b-5014-46df-a596-d1bf5a4e11bb', 'df5a2c7b-e934-436c-864e-157ceaf79d68', '10000000-0000-0000-0000-000000000011', '2026-08-03T07:26:33.936Z'),
  ('79b33052-d46f-45dc-8ddf-fe30d02adbcc', '98eb7be7-25d6-4a01-827e-d9534b8d48e7', '10000000-0000-0000-0000-000000000011', '2026-08-03T07:34:39.687Z'),
  ('d75464c9-c82c-47fe-914b-f2173bd0908d', '2c4cbbdc-7684-4c17-9b91-5fb8c508c3e6', '10000000-0000-0000-0000-000000000011', '2026-08-03T07:48:38.821Z'),
  ('68244b93-2a97-4190-9ab3-f9869eb5ed6d', 'b52555f0-5347-4a31-b5d3-c8bd3ddbb556', '10000000-0000-0000-0000-000000000011', '2026-08-09T05:06:22.418Z');

-- --------------------------------------------------------
-- Table: phien_lam_viec (0 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "phien_lam_viec" CASCADE;

-- --------------------------------------------------------
-- Table: phong_lam_viec (2 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "phong_lam_viec" CASCADE;
INSERT INTO "phong_lam_viec" ("id", "ten_phong", "ma_phong", "loai_phong", "suc_chua", "trang_thai", "mo_ta") VALUES
  (1, 'Phòng Khám Lâm Sàng 01', 'PK-01', 'phong_kham', 2, 'san_sang', 'Phòng khám bệnh lâm sàng ban đầu'),
  (2, 'Phòng Trị Liệu 01', 'TL-01', 'phong_tri_lieu', 2, 'san_sang', 'Phòng trị liệu cơ bản');

-- --------------------------------------------------------
-- Table: refresh_tokens (208 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "refresh_tokens" CASCADE;
INSERT INTO "refresh_tokens" ("id", "nguoi_dung_id", "khach_hang_id", "token", "expires_at", "created_at") VALUES
  (86, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1OTcwMjgxLCJleHAiOjE3ODY1NzUwODF9.3Ub07o9E6RiIhLIWc0_KdsZ71E9ymP8K1J7mjdlrCaA', '2026-08-12T15:51:21.001Z', '2026-08-05T15:51:21.078Z'),
  (89, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjAyOTAzMSwiZXhwIjoxNzg2NjMzODMxfQ.eTP75_GKAdnSqWfKEmQGdxtwWlXh03C4N8wjn5CHUZ8', '2026-08-13T08:10:31.961Z', '2026-08-06T08:10:32.196Z'),
  (91, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MDM3MzQwLCJleHAiOjE3ODY2NDIxNDB9.TVXESygUzT7izxqXWEqbJj90XGuuaKVZGoUn9VACvzs', '2026-08-13T10:29:00.483Z', '2026-08-06T10:29:00.515Z'),
  (92, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MDUyMDkzLCJleHAiOjE3ODY2NTY4OTN9.kg7jdUmKJgkaVK69VbFCW9IAryrIpJ3mZtyFC_kconI', '2026-08-13T14:34:53.953Z', '2026-08-06T14:34:54.013Z'),
  (97, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTAxNzEwLCJleHAiOjE3ODY3MDY1MTB9.yNce_3HtmL-JJxyGHr_Napa3UbTmngUrM7JAsWaT1Jk', '2026-08-14T04:21:50.711Z', '2026-08-07T04:21:50.753Z'),
  (102, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTE4MjA5LCJleHAiOjE3ODY3MjMwMDl9.B4-O1Sn7nCvdUpeAy4CTVvkVZvTlXe44nH4HVLyy9oE', '2026-08-14T08:56:49.521Z', '2026-08-07T08:56:49.543Z'),
  (108, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTE5MzI5LCJleHAiOjE3ODY3MjQxMjl9.c4ZyZnJ4DKwAYZAgcnwhlLTyKUYTGu0dM2fq6x6ghuw', '2026-08-14T09:15:29.973Z', '2026-08-07T09:15:30.054Z'),
  (114, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTI1NDM5LCJleHAiOjE3ODY3MzAyMzl9.uQHbtgQPoRQLlfUebzmTICpya5aej2RuSL53SYt1a0g', '2026-08-14T10:57:19.802Z', '2026-08-07T10:57:19.831Z'),
  (121, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTU3OTgzLCJleHAiOjE3ODY3NjI3ODN9.VfxNqgAB5aVvsBP5WwwYndlilHxU95gaviu5QrkZ89Q', '2026-08-14T19:59:43.062Z', '2026-08-07T19:59:43.064Z'),
  (125, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTU5NDg2LCJleHAiOjE3ODY3NjQyODZ9.c52afFFeY8PCSpI0mLjeRDvs2ypJcJ1Kqdbtx06olCA', '2026-08-14T20:24:46.905Z', '2026-08-07T20:24:46.908Z'),
  (129, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTYzNzIwLCJleHAiOjE3ODY3Njg1MjB9.O-SXyvYGKT8AKuGo4RjN7rzaKL7FLkdpMVMPhq4PSTw', '2026-08-14T21:35:20.171Z', '2026-08-07T21:35:20.187Z'),
  (133, 6, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzg2MTY2NzY1LCJleHAiOjE3ODY3NzE1NjV9.rnjQpluopHeMzI35q7l5_eqNLw1ZOaRbn6a4ApcLsaQ', '2026-08-14T22:26:05.385Z', '2026-08-07T22:26:05.398Z'),
  (137, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MTcyNzY1LCJleHAiOjE3ODY3Nzc1NjV9.UguFJTstLrgXyWesYTOrI0npHRm9ZVIxDw5rLNvVGeU', '2026-08-15T00:06:05.246Z', '2026-08-08T00:06:05.251Z'),
  (142, 9, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNzg2MTczOTM2LCJleHAiOjE3ODY3Nzg3MzZ9.TnRVk2Ow3PDZRofNk7jJe37LbBXxtMW4DCh97wNLMWI', '2026-08-15T00:25:36.700Z', '2026-08-08T00:25:36.719Z'),
  (146, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTc3MDg0LCJleHAiOjE3ODY3ODE4ODR9.F0GXGPQmVgvnEpwUF8yuEdL6ihK6yt4QZXxS9lT3wno', '2026-08-15T01:18:04.290Z', '2026-08-08T01:18:04.297Z'),
  (150, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTgwMzE5LCJleHAiOjE3ODY3ODUxMTl9.6EAcpKbQk5cbtYZUuHo8mgDVE6qX5_qO2hAIfPjVXtY', '2026-08-15T02:11:59.850Z', '2026-08-08T02:11:59.856Z'),
  (154, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTg3MjgxLCJleHAiOjE3ODY3OTIwODF9.gfRFmKRMv98qv11Ub5ZG_RZxpU9Ki3XCqwollwtz_bI', '2026-08-15T04:08:01.489Z', '2026-08-08T04:08:01.493Z'),
  (158, 10, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc4NjE5OTQyNCwiZXhwIjoxNzg2ODA0MjI0fQ.0HFMNkQbJS2kTZIqpLQ0mMTkwrcphZbP0EjE18xouZs', '2026-08-15T07:30:24.487Z', '2026-08-08T07:30:24.498Z'),
  (162, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjA4MTMzLCJleHAiOjE3ODY4MTI5MzN9.uWHJIBaDQtAiZhG6gD0YpoikKoyBmxteeQbkzRVl1QA', '2026-08-15T09:55:33.504Z', '2026-08-08T09:55:33.585Z'),
  (166, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjEwMTE1LCJleHAiOjE3ODY4MTQ5MTV9.h3yXNvHW_AGxBqR9hJluDiAJII8OyVnWqynhyRviL18', '2026-08-15T10:28:35.333Z', '2026-08-08T10:28:35.550Z'),
  (170, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MjEwNjY3LCJleHAiOjE3ODY4MTU0Njd9.yQXaavNTRd8HrL_g-hzGWLSetfQnk8mPdnTXmc51Sbo', '2026-08-15T10:37:47.301Z', '2026-08-08T10:37:47.393Z'),
  (173, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjM4MjU1LCJleHAiOjE3ODY4NDMwNTV9.cu-T7cPY4jJ5OrVfxhrRsIfSsRMEh0PiouB2c8teMvs', '2026-08-15T18:17:35.476Z', '2026-08-08T18:17:35.528Z'),
  (177, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MjM4OTYyLCJleHAiOjE3ODY4NDM3NjJ9.6c7KUaYoDKF1CuDV591vxQIqYA_8RLGl8FvRrwnGJGE', '2026-08-15T18:29:22.290Z', '2026-08-08T18:29:22.341Z'),
  (181, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjQwMTk5LCJleHAiOjE3ODY4NDQ5OTl9.v7-arrpkmNu7XniTHpCsVIumwFAmVO9umhlIbBYwgQA', '2026-08-15T18:49:59.984Z', '2026-08-08T18:50:00.037Z'),
  (185, NULL, '9b5d5e46-90a2-41f0-a36b-d0a9fb69b7c1', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjliNWQ1ZTQ2LTkwYTItNDFmMC1hMzZiLWQwYTlmYjY5YjdjMSIsImlhdCI6MTc4NjI0MTMwMSwiZXhwIjoxNzg2ODQ2MTAxfQ.ByEyU1hufkwc98gRuMi9zvmk2bvB8X8By_qGft4ALHQ', '2026-08-15T19:08:21.931Z', '2026-08-08T19:08:21.949Z'),
  (190, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjQxOTcxLCJleHAiOjE3ODY4NDY3NzF9.R-qzfqqb1EY-aVHvSvOqA-boQnt039LGxOfG6SFwbzQ', '2026-08-15T19:19:31.600Z', '2026-08-08T19:19:31.616Z'),
  (193, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MjQ1MDc2LCJleHAiOjE3ODY4NDk4NzZ9.k2Wi58Ume_8sgzF993vuQ2BHSbYBcPPT9z5FnOxCu4A', '2026-08-15T20:11:16.131Z', '2026-08-08T20:11:16.163Z'),
  (196, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI0ODUxOCwiZXhwIjoxNzg2ODUzMzE4fQ.bQy3NrqoTX6Szv_oZgT-cmJu8dT2QxLQLDx6AGWGFcc', '2026-08-15T21:08:38.099Z', '2026-08-08T21:08:38.102Z'),
  (199, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI1MDQ4NSwiZXhwIjoxNzg2ODU1Mjg1fQ.6iAxMukUcFRouQKDo3okN5w8ixnE2iIJU9W46X7u_NM', '2026-08-15T21:41:25.715Z', '2026-08-08T21:41:25.765Z'),
  (202, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjUxODAyLCJleHAiOjE3ODY4NTY2MDJ9.mbPNW3b4AGGVWXujGB5HXfgv5xXPfs2kAlUiIIXc2-c', '2026-08-15T22:03:22.301Z', '2026-08-08T22:03:22.371Z'),
  (205, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjUzNTQzLCJleHAiOjE3ODY4NTgzNDN9.-pIvhWO6BjVLWIRIEdliUdGJWb3v0RHqSS6O1C_qTdo', '2026-08-15T22:32:23.358Z', '2026-08-08T22:32:23.514Z'),
  (208, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MjU0NzI5LCJleHAiOjE3ODY4NTk1Mjl9.81gLlP0Bpa1Ge25bWKtHeKEA5hO-5mMtCoIEmWvmX98', '2026-08-15T22:52:09.549Z', '2026-08-08T22:52:09.564Z'),
  (87, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTk3MjU4NywiZXhwIjoxNzg2NTc3Mzg3fQ.adPvx7tE8qJMNPOFW0DxVGdS3GzQvJ_tTYp388jOKFM', '2026-08-12T16:29:47.047Z', '2026-08-05T16:29:47.078Z'),
  (90, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MDMxMzA4LCJleHAiOjE3ODY2MzYxMDh9.gLXN4T-PuR-_WVPVMkBygvZp4Ar_3dIZh3AhCtoSXM0', '2026-08-13T08:48:28.366Z', '2026-08-06T08:48:28.442Z'),
  (93, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MDUyNTY5LCJleHAiOjE3ODY2NTczNjl9.dkg8h7G8bfPF3yi7X8rC_BJvr8YuINvqU-TyVVJhizg', '2026-08-13T14:42:49.852Z', '2026-08-06T14:42:49.866Z'),
  (98, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTA2OTIxLCJleHAiOjE3ODY3MTE3MjF9.FoOYUOy_vQsCHQeKILSu91fA9IOQDoZkr6W3Fx51mhc', '2026-08-14T05:48:41.581Z', '2026-08-07T05:48:41.695Z'),
  (103, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTE4MjQxLCJleHAiOjE3ODY3MjMwNDF9.5-c73QysBiA4V-RfOJCGpG77ovxJQUlvzHILxvOtfpA', '2026-08-14T08:57:21.794Z', '2026-08-07T08:57:21.805Z'),
  (109, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTE5NjY2LCJleHAiOjE3ODY3MjQ0NjZ9.G0pLR9cwtKmKbR_J8LyHNypRg9AUaKzb5FAHSqs0QRc', '2026-08-14T09:21:06.693Z', '2026-08-07T09:21:06.724Z'),
  (110, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTIwODI4LCJleHAiOjE3ODY3MjU2Mjh9.bNsenVg4BAH4j1LLOhqU7DonxhTOIytcJMcNPqKP9l0', '2026-08-14T09:40:28.801Z', '2026-08-07T09:40:28.847Z'),
  (115, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTI2MTk0LCJleHAiOjE3ODY3MzA5OTR9.Q5L4hckos_qshtNrxtd8yeW0oaeYSVEgk1WcgqHDAps', '2026-08-14T11:09:54.333Z', '2026-08-07T11:09:54.496Z'),
  (117, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTU0NDUwLCJleHAiOjE3ODY3NTkyNTB9.xZ85uO1rPLYToP2wcJ6B9rEhKIRNF7YI-6QPaJS8NFo', '2026-08-14T19:00:50.262Z', '2026-08-07T19:00:50.287Z'),
  (122, 6, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzg2MTU3OTkwLCJleHAiOjE3ODY3NjI3OTB9.Ls30FnHLz7Or786lKbO2LfbpXRLjocGV10LyIufcm-o', '2026-08-14T19:59:50.057Z', '2026-08-07T19:59:50.063Z'),
  (126, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTYxOTUzLCJleHAiOjE3ODY3NjY3NTN9.xpjaxAI8godslbO6diiUuCY_n2z5_ZhdNOGAFXiv-9o', '2026-08-14T21:05:53.345Z', '2026-08-07T21:05:53.485Z'),
  (130, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTY2MjY4LCJleHAiOjE3ODY3NzEwNjh9.qhcR1X2T9ai6tJNvnhcngutxZP7Jh_Bq8xbfcRshVVo', '2026-08-14T22:17:48.545Z', '2026-08-07T22:17:48.663Z'),
  (134, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTcyNjM4LCJleHAiOjE3ODY3Nzc0Mzh9.jeEc8NhKkC84fRaLcQwq_zJo-hKskAZBc-X99tBacqM', '2026-08-15T00:03:58.686Z', '2026-08-08T00:03:58.768Z'),
  (138, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTcyOTc2LCJleHAiOjE3ODY3Nzc3NzZ9.HDShKCgObTQwpO3TnmdsxsvHlQouOr0BmGHE_2zz7Ak', '2026-08-15T00:09:36.004Z', '2026-08-08T00:09:36.013Z'),
  (143, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTc2Njc3LCJleHAiOjE3ODY3ODE0Nzd9.jWyfrHx7ozpF9yIXNsNQNtYxxEh-qwKAHTEJS0oFBDI', '2026-08-15T01:11:17.378Z', '2026-08-08T01:11:17.490Z'),
  (147, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTc4MDQzLCJleHAiOjE3ODY3ODI4NDN9.VupRLYybP1hET3T8Wf82Ebx7hdp_5A4MRaxFSdDfxSY', '2026-08-15T01:34:03.705Z', '2026-08-08T01:34:03.826Z'),
  (151, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTgxMDQ3LCJleHAiOjE3ODY3ODU4NDd9.uBzL3ubBtDM-JZQ5eGTqqKsso2tRl6fUIh63EUAdSzw', '2026-08-15T02:24:07.859Z', '2026-08-08T02:24:07.871Z'),
  (155, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MTk2NjkwLCJleHAiOjE3ODY4MDE0OTB9.atyROefHfbPW0yUDgckdBt20glSqxty8eL2Z1puGs8E', '2026-08-15T06:44:50.481Z', '2026-08-08T06:44:50.806Z');
INSERT INTO "refresh_tokens" ("id", "nguoi_dung_id", "khach_hang_id", "token", "expires_at", "created_at") VALUES
  (159, 10, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc4NjIwMDg0MiwiZXhwIjoxNzg2ODA1NjQyfQ.XUwOzG8yBP9aZtWt3JCscBOtt2YJhwe7QuUfSJdSX5s', '2026-08-15T07:54:02.280Z', '2026-08-08T07:54:02.595Z'),
  (163, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MjA4Mjk1LCJleHAiOjE3ODY4MTMwOTV9.a0JaFGejEJFyZCLq4jQ74lY0j4aFOZ2DArX2N7TU6CY', '2026-08-15T09:58:15.458Z', '2026-08-08T09:58:15.471Z'),
  (167, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MjEwMTgyLCJleHAiOjE3ODY4MTQ5ODJ9.q4Nm4kWr92p4k75A3WAEgtLcvRZeaCMv3L40Tj463hA', '2026-08-15T10:29:42.941Z', '2026-08-08T10:29:42.956Z'),
  (171, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjEyMjc5LCJleHAiOjE3ODY4MTcwNzl9.OEz-Yt0amWoH8iKdzPDzHufAeubcG7hZryzLBkRSkqI', '2026-08-15T11:04:39.980Z', '2026-08-08T11:04:40.027Z'),
  (174, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjM4Mjg3LCJleHAiOjE3ODY4NDMwODd9.HXTF3sT_5exZKUjzs9V19aQLFCWAKex4EtbLcCf-o_M', '2026-08-15T18:18:07.286Z', '2026-08-08T18:18:07.295Z'),
  (178, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjM5Mzk4LCJleHAiOjE3ODY4NDQxOTh9.EQMmrjJEY-HQ1CuOba4awQci75NimSqrk8SamNW-qOo', '2026-08-15T18:36:38.332Z', '2026-08-08T18:36:38.342Z'),
  (182, NULL, '9b5d5e46-90a2-41f0-a36b-d0a9fb69b7c1', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjliNWQ1ZTQ2LTkwYTItNDFmMC1hMzZiLWQwYTlmYjY5YjdjMSIsImlhdCI6MTc4NjI0MDIwOCwiZXhwIjoxNzg2ODQ1MDA4fQ.vBTh6_BwkQzNxEinHBHxYAfPznU76Act5IemQrB_-xs', '2026-08-15T18:50:08.751Z', '2026-08-08T18:50:08.759Z'),
  (186, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjQxNDYyLCJleHAiOjE3ODY4NDYyNjJ9.u9RxK_daLwCNoWljCvxedOWEekLY7WwVwrxm-7BWv7A', '2026-08-15T19:11:02.836Z', '2026-08-08T19:11:03.151Z'),
  (191, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MjQzOTE5LCJleHAiOjE3ODY4NDg3MTl9._4Zl1SHPceywqTvNYbghfkKb1wOkbIBhGdAmGbfU8KY', '2026-08-15T19:51:59.167Z', '2026-08-08T19:51:59.332Z'),
  (194, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjQ3NTEyLCJleHAiOjE3ODY4NTIzMTJ9.8Bh6ZRquLaoVD56qaRVTtx73DkJ6eu2y2BveSGIw-oA', '2026-08-15T20:51:52.812Z', '2026-08-08T20:51:52.890Z'),
  (197, NULL, 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4NjI0ODUzMCwiZXhwIjoxNzg2ODUzMzMwfQ.XEAb9bFhqgMC0-bofdf8fXe8njWIqrsqPlVe95SwPiM', '2026-08-15T21:08:50.530Z', '2026-08-08T21:08:50.538Z'),
  (200, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI1MDUzMiwiZXhwIjoxNzg2ODU1MzMyfQ.NLtRomum_TLy63ylDNHIPTxF9B4lgyqqkJTz3HameCo', '2026-08-15T21:42:12.419Z', '2026-08-08T21:42:12.511Z'),
  (203, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI1MjA1MywiZXhwIjoxNzg2ODU2ODUzfQ.Ce0vhaGUwmJOf6-5eDp3i_22kDNeywrz76sjfzlK-TE', '2026-08-15T22:07:33.418Z', '2026-08-08T22:07:33.432Z'),
  (206, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjU0MDYzLCJleHAiOjE3ODY4NTg4NjN9.Z5gRbFLanWX-bwgKUlQc_WUUfZmG_GH7sDq4gUk6-L4', '2026-08-15T22:41:03.872Z', '2026-08-08T22:41:04.106Z'),
  (209, NULL, 'fe0a3a4b-a6f4-46d5-9229-30a525289cdb', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZlMGEzYTRiLWE2ZjQtNDZkNS05MjI5LTMwYTUyNTI4OWNkYiIsImlhdCI6MTc4NjI1NDgyNSwiZXhwIjoxNzg2ODU5NjI1fQ.6JQ0nySWI7y4Q9BU9ouMRCZpmcgTPBxn1V8p4BQ4DVE', '2026-08-15T22:53:45.001Z', '2026-08-08T22:53:45.005Z'),
  (88, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1OTczNzk2LCJleHAiOjE3ODY1Nzg1OTZ9.iPRRriXHJBWLWw7yaXzC9QsRLEvMX6opdqrAUYpgNBM', '2026-08-12T16:49:56.123Z', '2026-08-05T16:49:56.139Z'),
  (94, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MDU0NzQ1LCJleHAiOjE3ODY2NTk1NDV9.l3O7VJ185ff6RrdC_IeEwN0AlTtg5QNiBMXW80hKri8', '2026-08-13T15:19:05.556Z', '2026-08-06T15:19:05.588Z'),
  (99, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTEwNDA2LCJleHAiOjE3ODY3MTUyMDZ9.6YaP8VQXwWS9rVrBqNZXdBauECTogPpIzS8oxRnFl2k', '2026-08-14T06:46:46.495Z', '2026-08-07T06:46:46.639Z'),
  (104, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTE4MzExLCJleHAiOjE3ODY3MjMxMTF9.0OqOYPLzedKSaS3r3eC1pQDRdE_Z3qNTptKvdMWsVds', '2026-08-14T08:58:31.896Z', '2026-08-07T08:58:31.915Z'),
  (111, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTIwODMyLCJleHAiOjE3ODY3MjU2MzJ9.Rz-inHQwh7HQuzHb7Odh-KoQf0QcJxGQ-HfSETDLpM8', '2026-08-14T09:40:32.517Z', '2026-08-07T09:40:32.522Z'),
  (116, 6, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzg2MTI2MjQzLCJleHAiOjE3ODY3MzEwNDN9.41_JzwW5fNKWZLP91nAutAuTfNp7pITfTeq9C4M29y4', '2026-08-14T11:10:43.835Z', '2026-08-07T11:10:43.841Z'),
  (118, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTU3Njc1LCJleHAiOjE3ODY3NjI0NzV9.1I2tu5fnj6x_xMiVi4VcZr0LNVtZJdYIRlSNxfe9a1k', '2026-08-14T19:54:35.510Z', '2026-08-07T19:54:35.537Z'),
  (123, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTU5MTQzLCJleHAiOjE3ODY3NjM5NDN9.sOD3aJ-DEuaPz8MUypxGJibzI1gPSwh7RnTrptjMAQ4', '2026-08-14T20:19:03.230Z', '2026-08-07T20:19:03.350Z'),
  (127, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTYzNDE3LCJleHAiOjE3ODY3NjgyMTd9.BwExFdNXMn-LrPnDJCehMnXy9yLsUys7s7FFehDqAn0', '2026-08-14T21:30:17.814Z', '2026-08-07T21:30:17.867Z'),
  (131, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTY2NDkyLCJleHAiOjE3ODY3NzEyOTJ9.UENSD0gT7VqUwtATsLkCC_CWSJ0HHWkL3jWVbjy8IXc', '2026-08-14T22:21:32.956Z', '2026-08-07T22:21:32.965Z'),
  (135, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MTcyNjg4LCJleHAiOjE3ODY3Nzc0ODh9.yO22REgPHNb94lCtAISChxbytq5OB2qMT_Q5EJnI4Q4', '2026-08-15T00:04:48.694Z', '2026-08-08T00:04:48.699Z'),
  (139, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTcyOTkyLCJleHAiOjE3ODY3Nzc3OTJ9.JfXJ35P15HP861FwJO3y3B-BjOuhQ_f3jDfHtF4Lpls', '2026-08-15T00:09:52.521Z', '2026-08-08T00:09:52.532Z'),
  (140, 9, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNzg2MTczMDAyLCJleHAiOjE3ODY3Nzc4MDJ9.fEmmHt5UHkdGYfvULoVj-PHiKuiCYMGeK4EMP2wt5F0', '2026-08-15T00:10:02.800Z', '2026-08-08T00:10:02.805Z'),
  (144, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTc2NzA4LCJleHAiOjE3ODY3ODE1MDh9.xfjnH3txPEhAwkY6jMpAPc2DEZCqLJjX8OiQAm-TDWE', '2026-08-15T01:11:48.059Z', '2026-08-08T01:11:48.067Z'),
  (148, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTc5OTgxLCJleHAiOjE3ODY3ODQ3ODF9.483h8BrgWiun-98tduPXpijktmHLSCgVPLsBfuZKUqc', '2026-08-15T02:06:21.374Z', '2026-08-08T02:06:21.607Z'),
  (152, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTg2MTIwLCJleHAiOjE3ODY3OTA5MjB9._bJ8uBNwCpLRMrQYzF8uG2mh7DZ3Km9wyykwMTy5NL4', '2026-08-15T03:48:40.698Z', '2026-08-08T03:48:40.731Z'),
  (156, 10, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc4NjE5ODEyNywiZXhwIjoxNzg2ODAyOTI3fQ.yiQlTBw8AT0SLV7aYT0D4MXMa942VL-b2OJUAEn9JJ4', '2026-08-15T07:08:47.859Z', '2026-08-08T07:08:47.960Z'),
  (160, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjAyMzUwLCJleHAiOjE3ODY4MDcxNTB9.3eUPWBNAMFBjrDdxRsAdNT_zLMlB-cT4A8aSFtl2I8s', '2026-08-15T08:19:10.667Z', '2026-08-08T08:19:12.159Z'),
  (164, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MjA5MjY2LCJleHAiOjE3ODY4MTQwNjZ9.0VnZbXultMW3H99PZlvnqiupnIwhHQmTxLXsBWuI2HY', '2026-08-15T10:14:26.409Z', '2026-08-08T10:14:26.549Z'),
  (168, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjEwNDYwLCJleHAiOjE3ODY4MTUyNjB9.YtzyYm1nN9yOVeYZTqZVohrJTWodUol_JLOLfRaP_JY', '2026-08-15T10:34:20.206Z', '2026-08-08T10:34:20.223Z'),
  (172, NULL, '9b5d5e46-90a2-41f0-a36b-d0a9fb69b7c1', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjliNWQ1ZTQ2LTkwYTItNDFmMC1hMzZiLWQwYTlmYjY5YjdjMSIsImlhdCI6MTc4NjIxMjMxOSwiZXhwIjoxNzg2ODE3MTE5fQ.WyS7fqshXvmPSIJ8PWM319OFtAlNhzCcSJEberu7rYg', '2026-08-15T11:05:19.078Z', '2026-08-08T11:05:19.091Z'),
  (175, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjIzODg4NiwiZXhwIjoxNzg2ODQzNjg2fQ.c8pJsD3M1s31YRY0KQJL1L7DztlcthZco3H3BNwsQwU', '2026-08-15T18:28:06.408Z', '2026-08-08T18:28:06.509Z'),
  (179, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjM5ODMxLCJleHAiOjE3ODY4NDQ2MzF9.ea7e0lv2mhvkv1p0mjrT-EhlFEjTCmABkNow9t6s9VQ', '2026-08-15T18:43:51.149Z', '2026-08-08T18:43:51.174Z'),
  (183, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MjQwMzE4LCJleHAiOjE3ODY4NDUxMTh9.T9h5f3CMTXpfi-8GNDujORG9IViuqylcLX8TGU1mlI4', '2026-08-15T18:51:58.693Z', '2026-08-08T18:51:58.699Z'),
  (187, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MjQxNjM2LCJleHAiOjE3ODY4NDY0MzZ9.f6nzMJ_bCzOJjaN-JbcOYhTS7z3S4yRLlHxNrA92SJI', '2026-08-15T19:13:56.384Z', '2026-08-08T19:13:56.409Z'),
  (192, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjQ0MTA2LCJleHAiOjE3ODY4NDg5MDZ9.fo4erh4MHDTxcg5XCk0gCD4NWDJb3u76qhq1Cc_UfYw', '2026-08-15T19:55:06.952Z', '2026-08-08T19:55:06.958Z'),
  (195, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI0ODUwOCwiZXhwIjoxNzg2ODUzMzA4fQ.mpGYK6rKIgxZ3CKzLYargKABZQe_Vh1XMQKW3bmLeec', '2026-08-15T21:08:28.455Z', '2026-08-08T21:08:28.505Z'),
  (198, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI0ODU4MywiZXhwIjoxNzg2ODUzMzgzfQ._5bDxCtVbcbGfpVFioBX5ev_v503lOhJ2uJwbpcW_Mo', '2026-08-15T21:09:43.634Z', '2026-08-08T21:09:43.643Z'),
  (201, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI1MDY1NywiZXhwIjoxNzg2ODU1NDU3fQ.WKwdww9wez4rxUU5aTwFQli-Z71SCbpidsq0L8Ii4Y0', '2026-08-15T21:44:17.224Z', '2026-08-08T21:44:17.418Z'),
  (204, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI1Mjc2NSwiZXhwIjoxNzg2ODU3NTY1fQ.4lOEFMafLoSd1xXD64E__CueQYHLtaX1zvezrYJh--8', '2026-08-15T22:19:25.414Z', '2026-08-08T22:19:25.440Z'),
  (207, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjI1NDEyNCwiZXhwIjoxNzg2ODU4OTI0fQ.fIUDUxI1jobBzC3s7iBsL_4_04qWR17Y0ZCTqp2yi8A', '2026-08-15T22:42:04.505Z', '2026-08-08T22:42:04.516Z'),
  (95, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MDU4NzU1LCJleHAiOjE3ODY2NjM1NTV9.ddtCEUcUtVxM1CzNmCH5bCgAY0jAsXp_xwEkYRauyzc', '2026-08-13T16:25:55.753Z', '2026-08-06T16:25:55.770Z'),
  (100, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTEzNjk1LCJleHAiOjE3ODY3MTg0OTV9.VQjX-C2ho2oG8PJioLBmXwEzJxH7gC4TwnJc3Deay6Q', '2026-08-14T07:41:35.724Z', '2026-08-07T07:41:35.771Z'),
  (105, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MTE5MDM1LCJleHAiOjE3ODY3MjM4MzV9.1kJWtb61v6nlOUUZTBFn8lqugzBwKmRZ7yMaZsQ8PhY', '2026-08-14T09:10:35.582Z', '2026-08-07T09:10:35.717Z'),
  (106, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTE5MDQ4LCJleHAiOjE3ODY3MjM4NDh9.tL2DdO0bwPvxNXuROFre-4SVnGlcfygEVfJVmS01c28', '2026-08-14T09:10:48.187Z', '2026-08-07T09:10:48.194Z');
INSERT INTO "refresh_tokens" ("id", "nguoi_dung_id", "khach_hang_id", "token", "expires_at", "created_at") VALUES
  (112, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTIyMTA5LCJleHAiOjE3ODY3MjY5MDl9.dAwc_a5vGBglzcv0Bk3UkNp9WuHip25P2Liw0XIYQJE', '2026-08-14T10:01:49.135Z', '2026-08-07T10:01:49.161Z'),
  (119, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTU3NzM0LCJleHAiOjE3ODY3NjI1MzR9.rW_7q71lqk31_x4zjw2I-0QpY52V_arJ3Uc8VRRn__c', '2026-08-14T19:55:34.809Z', '2026-08-07T19:55:34.812Z'),
  (2, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzIxNDkyLCJleHAiOjE3ODYzMjYyOTJ9.SgaOMxtYz1h7uxLBnMMivaYT_MCSIH41pDVTPolmvqM', '2026-08-09T18:44:52.527Z', '2026-08-02T18:44:52.592Z'),
  (3, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg1NzIxNDk0LCJleHAiOjE3ODYzMjYyOTR9.g5ijqKnQ1_pUEydVlWyg1nTig6G0f0Yk5kN0zei4z5Y', '2026-08-09T18:44:54.919Z', '2026-08-02T18:44:54.927Z'),
  (4, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzIxNjUxLCJleHAiOjE3ODYzMjY0NTF9.rJ5lnH5GR8ILGVGSwZHDfwXYbgRMj2VQg2nxcuCayZw', '2026-08-09T18:47:31.091Z', '2026-08-02T18:47:31.103Z'),
  (5, 2, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzg1NzIxNjc0LCJleHAiOjE3ODYzMjY0NzR9._g6lhM1xuz-YoqZo-jrrTUd_bCjrjve7_k_CXlUe064', '2026-08-09T18:47:54.417Z', '2026-08-02T18:47:54.422Z'),
  (6, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzIxODM2LCJleHAiOjE3ODYzMjY2MzZ9._IbSHEgN4C2Xar2DZGkBA843iSLt_mds07A0PAIYoR0', '2026-08-09T18:50:36.980Z', '2026-08-02T18:50:36.994Z'),
  (7, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzIxODgwLCJleHAiOjE3ODYzMjY2ODB9.SoOjMBFQ9Yxmn1J48Vq_tWQWrKf0TGKv-8tr6YRUjSo', '2026-08-09T18:51:20.258Z', '2026-08-02T18:51:20.262Z'),
  (8, 2, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzg1NzIxOTU0LCJleHAiOjE3ODYzMjY3NTR9.vaRT12lEFWOtuQKDEJxipEdepslFWyf7BYQMX6XoFw8', '2026-08-09T18:52:34.787Z', '2026-08-02T18:52:34.795Z'),
  (9, 2, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzg1NzIxOTY3LCJleHAiOjE3ODYzMjY3Njd9.6gCFEgLj7PA2oUZneq5gROHRvH0bg2IKtk9YtEDTS-k', '2026-08-09T18:52:47.054Z', '2026-08-02T18:52:47.060Z'),
  (10, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzIyMTQxLCJleHAiOjE3ODYzMjY5NDF9.OtguVHSESI_hsf8wjuFeFivuqMho6myv-qzSNXjCPho', '2026-08-09T18:55:41.458Z', '2026-08-02T18:55:41.462Z'),
  (11, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzIzMDM1LCJleHAiOjE3ODYzMjc4MzV9.lh4_WtjVHcei8wZtRw3TEPP3gCGyRH2Sv3DfMqxZs_U', '2026-08-09T19:10:35.871Z', '2026-08-02T19:10:35.929Z'),
  (12, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg1NzI0MTI2LCJleHAiOjE3ODYzMjg5MjZ9.RToUJMvvhav8b4csgNxi8F_bXqeWBMb2oJTWGfcFssA', '2026-08-09T19:28:46.491Z', '2026-08-02T19:28:46.535Z'),
  (13, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzI0NzQyLCJleHAiOjE3ODYzMjk1NDJ9.Qol1wKiyZtYRc2wKBUDqev2lep2msAO7Zr-o1LN-jjA', '2026-08-09T19:39:02.521Z', '2026-08-02T19:39:02.546Z'),
  (14, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzI0NzU5LCJleHAiOjE3ODYzMjk1NTl9.x5CvxKxTCBSwO-pjHlbQfZ5PcbxUdaCmExD0EkgpIRY', '2026-08-09T19:39:19.971Z', '2026-08-02T19:39:19.974Z'),
  (15, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTcyNTE4MywiZXhwIjoxNzg2MzI5OTgzfQ.5plX_PVn0zz__RtdwytoMovduqXM8ANxtpzZ93w7fOU', '2026-08-09T19:46:23.787Z', '2026-08-02T19:46:23.827Z'),
  (16, NULL, 'a96fdd6d-951a-4a17-980a-a2461e84b4d7', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NmZkZDZkLTk1MWEtNGExNy05ODBhLWEyNDYxZTg0YjRkNyIsImlhdCI6MTc4NTcyNTk1OSwiZXhwIjoxNzg2MzMwNzU5fQ.CSUxXeDr5eTihIyZ6l1rYNfMMkQJLRCcSbV8YIVwJLw', '2026-08-09T19:59:19.112Z', '2026-08-02T19:59:19.181Z'),
  (17, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzI2MDQ0LCJleHAiOjE3ODYzMzA4NDR9.b6JFCbwN0Q9M18iGJjK1RYy6mWmS8FlFURigWLINa7E', '2026-08-09T20:00:44.034Z', '2026-08-02T20:00:44.041Z'),
  (18, 9, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNzg1NzI2MzExLCJleHAiOjE3ODYzMzExMTF9.pYEf_aqZ9tOto-YUaKH1LltJ0y0MKMkcez7EWvcS4u0', '2026-08-09T20:05:11.258Z', '2026-08-02T20:05:11.348Z'),
  (19, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTcyNzE5MCwiZXhwIjoxNzg2MzMxOTkwfQ.jx4APJorSSqSMwxuybaK9l3EeANxL12zMzgCQ82K2Ns', '2026-08-09T20:19:50.368Z', '2026-08-02T20:19:50.533Z'),
  (20, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzI3NjI3LCJleHAiOjE3ODYzMzI0Mjd9.fywMTwafqY2u6GUzxj6fA9ZPyVvpFpHdPW9PtT9IkCk', '2026-08-09T20:27:07.781Z', '2026-08-02T20:27:07.791Z'),
  (21, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzI4MTg5LCJleHAiOjE3ODYzMzI5ODl9.x2OfuWzPnWXw6Tc1bc1nTvvtTCGXprII_9g4Fe_N338', '2026-08-09T20:36:29.064Z', '2026-08-02T20:36:29.373Z'),
  (22, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczMDY5NSwiZXhwIjoxNzg2MzM1NDk1fQ.xcCz1WH6F30hEZoZDE9_vwKAZadGtwHkaxHMXj1wl7E', '2026-08-09T21:18:15.741Z', '2026-08-02T21:18:15.796Z'),
  (23, NULL, '10000000-0000-0000-0000-000000000014', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxNCIsImlhdCI6MTc4NTczMTAwNywiZXhwIjoxNzg2MzM1ODA3fQ.rxatzCPIEs1V1fPAKk1rRImdmYQuOfgbCoAOtXtxAVE', '2026-08-09T21:23:27.681Z', '2026-08-02T21:23:27.706Z'),
  (24, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczMTA5MywiZXhwIjoxNzg2MzM1ODkzfQ.VreR9ZCR5Vt4_aPs23y6UMKGPEg1X6X6-phP5_gsXWY', '2026-08-09T21:24:53.027Z', '2026-08-02T21:24:53.030Z'),
  (25, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzMxMjU4LCJleHAiOjE3ODYzMzYwNTh9.sQzEzppHYiFCt9c7EkqBiC5oA2xHxJ3_jvA0KF9V4wc', '2026-08-09T21:27:38.047Z', '2026-08-02T21:27:38.074Z'),
  (26, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczMTc0NCwiZXhwIjoxNzg2MzM2NTQ0fQ.LYFoNerBrrIm-vomqpP0Q0hqbajokCmqUC9bzTNK1aQ', '2026-08-09T21:35:44.462Z', '2026-08-02T21:35:44.473Z'),
  (27, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczMTg4OSwiZXhwIjoxNzg2MzM2Njg5fQ.j4bl4Ib-c1wNBUP_vAX8r76ITTecvLmLX1eVqJHUXp8', '2026-08-09T21:38:09.308Z', '2026-08-02T21:38:09.316Z'),
  (28, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg1NzMyMTc1LCJleHAiOjE3ODYzMzY5NzV9.MUiSFtv6SZK3JJzPNTtLDqCHWf-uBGX8LvAHKcu8Pc0', '2026-08-09T21:42:55.508Z', '2026-08-02T21:42:55.514Z'),
  (29, NULL, '6da96437-ee20-48e2-82f0-49fe8470841c', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZkYTk2NDM3LWVlMjAtNDhlMi04MmYwLTQ5ZmU4NDcwODQxYyIsImlhdCI6MTc4NTczMjI2NCwiZXhwIjoxNzg2MzM3MDY0fQ.kzA9VAvvzKXIr99j1jEcGKMbt14hYp6lM-AkAddlcpU', '2026-08-09T21:44:24.536Z', '2026-08-02T21:44:24.543Z'),
  (30, NULL, 'a96fdd6d-951a-4a17-980a-a2461e84b4d7', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NmZkZDZkLTk1MWEtNGExNy05ODBhLWEyNDYxZTg0YjRkNyIsImlhdCI6MTc4NTczMjQ4MCwiZXhwIjoxNzg2MzM3MjgwfQ.yd12n7XPBUfDcyf6CFMG-aYd5snEMueL-C18l5QGtJM', '2026-08-09T21:48:00.674Z', '2026-08-02T21:48:00.682Z'),
  (31, NULL, '6da96437-ee20-48e2-82f0-49fe8470841c', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZkYTk2NDM3LWVlMjAtNDhlMi04MmYwLTQ5ZmU4NDcwODQxYyIsImlhdCI6MTc4NTczMjU3MiwiZXhwIjoxNzg2MzM3MzcyfQ.RZVEQKsf3U_gkdkrFMDhOvAerLlPA1nAGZCLIty5SVg', '2026-08-09T21:49:32.842Z', '2026-08-02T21:49:32.847Z'),
  (32, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg1NzMyNTkyLCJleHAiOjE3ODYzMzczOTJ9.UTOtLxqw05KnoT_sHpKib0DKwYDpZJACxMhAJRrsjvs', '2026-08-09T21:49:52.193Z', '2026-08-02T21:49:52.197Z'),
  (33, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg1NzMyNTk4LCJleHAiOjE3ODYzMzczOTh9.JW1iH56rh5FISgo6qglXueenIPavpRTZ77uTCpwMJkM', '2026-08-09T21:49:58.408Z', '2026-08-02T21:49:58.413Z'),
  (34, 9, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNzg1NzMyNjEwLCJleHAiOjE3ODYzMzc0MTB9.E5Kp2zxea6L0YU1QrK-mA9R0HP-8oJGDJxOVmsD08Bw', '2026-08-09T21:50:10.727Z', '2026-08-02T21:50:10.732Z'),
  (35, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg1NzMyOTg4LCJleHAiOjE3ODYzMzc3ODh9.IUQVBtkMNr0m0HdIDE1knmr00cSFPZvIN_ANCt0ZZU4', '2026-08-09T21:56:28.012Z', '2026-08-02T21:56:28.017Z'),
  (36, NULL, 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4NTczMzEzMywiZXhwIjoxNzg2MzM3OTMzfQ.mY6lTXqtWkf3Z916Pob-t2gcuHwjAVz1mKru8ORLq6E', '2026-08-09T21:58:53.325Z', '2026-08-02T21:58:53.328Z'),
  (37, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg1NzMzMjQzLCJleHAiOjE3ODYzMzgwNDN9.AFFhU4oQ8wy3bYx8iNopIiK-CfFlfBZWpuh4he9Qa5c', '2026-08-09T22:00:43.832Z', '2026-08-02T22:00:43.846Z'),
  (38, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzMzMjY4LCJleHAiOjE3ODYzMzgwNjh9.3IjoBEHBkBK-cCG778GvnbCFaA_I-MmroNO4p9TfqWo', '2026-08-09T22:01:08.478Z', '2026-08-02T22:01:08.483Z'),
  (39, NULL, 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4NTczMzI5OSwiZXhwIjoxNzg2MzM4MDk5fQ.P11JYQuyFIhQls6czN_AyVK9DGpsA8XZZTKINPiC7uI', '2026-08-09T22:01:39.156Z', '2026-08-02T22:01:39.164Z'),
  (40, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzMzMzIxLCJleHAiOjE3ODYzMzgxMjF9.pCGr5u36tFF-LIZXp00kgjRhf0LgEhKkBiOpC4xl8V0', '2026-08-09T22:02:01.251Z', '2026-08-02T22:02:01.259Z'),
  (41, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg1NzMzMzQ3LCJleHAiOjE3ODYzMzgxNDd9.OC4I10hD0L_qtX_LtpAJlmSA28FiLMbLF-kqItfZGE0', '2026-08-09T22:02:27.876Z', '2026-08-02T22:02:27.888Z'),
  (42, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczMzQwMywiZXhwIjoxNzg2MzM4MjAzfQ.zPsT5BNKTHqsNjO47F9xoXAvt7GsyFDHWHgTZAhuXFo', '2026-08-09T22:03:23.890Z', '2026-08-02T22:03:23.898Z'),
  (43, NULL, 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4NTczNDgwMSwiZXhwIjoxNzg2MzM5NjAxfQ.CUFSTe5ANmD6UWh_k2R8EiX8jQEJzTFZ66sasIwu8cA', '2026-08-09T22:26:41.913Z', '2026-08-02T22:26:42.019Z'),
  (44, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM0ODI3LCJleHAiOjE3ODYzMzk2Mjd9.hBK0lx74bFj8zz_sK6CDDHz3ZRs0fEBSiN0Xq9-0RGw', '2026-08-09T22:27:07.354Z', '2026-08-02T22:27:07.492Z'),
  (45, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczNDkwMiwiZXhwIjoxNzg2MzM5NzAyfQ.YkNExQo3r5DuxheTq7doss3SoxYWqGMkoK4ltcMyVtY', '2026-08-09T22:28:22.120Z', '2026-08-02T22:28:22.145Z'),
  (46, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzM1MDczLCJleHAiOjE3ODYzMzk4NzN9.jQwn4FnvlYU_bCbJ5gaPjbE3mycT3NIBbS-qK9T5c8s', '2026-08-09T22:31:13.419Z', '2026-08-02T22:31:13.596Z'),
  (47, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczNTExNywiZXhwIjoxNzg2MzM5OTE3fQ.hIfua_YI3Hli5Lj4MC0BOzEixr8blGfmbK91zZhHLyQ', '2026-08-09T22:31:57.009Z', '2026-08-02T22:31:57.022Z'),
  (48, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM1MTkwLCJleHAiOjE3ODYzMzk5OTB9.OXDJQUmLLSBLUQ5UH5XkV97MhAxltiCt5xIYWNVYHq8', '2026-08-09T22:33:10.569Z', '2026-08-02T22:33:10.597Z'),
  (49, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczNTI2NCwiZXhwIjoxNzg2MzQwMDY0fQ.VfC-AR_N7ALEb8CDfiRSxl6B0dmSVdmrDcsdswL0Dys', '2026-08-09T22:34:24.233Z', '2026-08-02T22:34:24.247Z');
INSERT INTO "refresh_tokens" ("id", "nguoi_dung_id", "khach_hang_id", "token", "expires_at", "created_at") VALUES
  (50, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczNTY2NCwiZXhwIjoxNzg2MzQwNDY0fQ.jpekgSi-mQuarr6HyoK1QvpSc92k5RRASD0je8QWxMI', '2026-08-09T22:41:04.076Z', '2026-08-02T22:41:04.091Z'),
  (51, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM2NTE3LCJleHAiOjE3ODYzNDEzMTd9.P0onwfzvDDPIq38WNif6zJ-y3LFkhJwipgJtLBfVfSA', '2026-08-09T22:55:17.497Z', '2026-08-02T22:55:17.524Z'),
  (52, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczNjU5NiwiZXhwIjoxNzg2MzQxMzk2fQ.kXy35so3A2NyhCjSn03Pe7PUWClaPI5ADdz7Mli7mgQ', '2026-08-09T22:56:36.134Z', '2026-08-02T22:56:36.144Z'),
  (53, NULL, 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4NTczNjYwNCwiZXhwIjoxNzg2MzQxNDA0fQ.DD8hwP98PXW8YsM1h-66ElGXLRgdUqiwU_cBpV_ZYvo', '2026-08-09T22:56:44.556Z', '2026-08-02T22:56:44.558Z'),
  (54, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM2NzUwLCJleHAiOjE3ODYzNDE1NTB9.mVUfKg3ddBx2JswOdV9nD9vGJHh1o6NUP2_hR9V1DWU', '2026-08-09T22:59:10.545Z', '2026-08-02T22:59:10.556Z'),
  (55, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczNjgwOSwiZXhwIjoxNzg2MzQxNjA5fQ.hb7-8ruPJLWtgVtJBY8WS-ojy9jCGktSHkgdO7tIZ_0', '2026-08-09T23:00:09.316Z', '2026-08-02T23:00:09.322Z'),
  (56, NULL, 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4NTczNjgyNCwiZXhwIjoxNzg2MzQxNjI0fQ.e9b-kw2Ukf0o4u9xovtz03kYbMGb4XSAvQZyZOliMA4', '2026-08-09T23:00:24.752Z', '2026-08-02T23:00:24.760Z'),
  (57, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM2ODM0LCJleHAiOjE3ODYzNDE2MzR9.7cDco1aTRKgNwPm6xMU1EDPVeAFNcRp1sEERrZW6u3o', '2026-08-09T23:00:34.803Z', '2026-08-02T23:00:34.812Z'),
  (58, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzM4NzA0LCJleHAiOjE3ODYzNDM1MDR9.nL-uKea2-3cclmuzHEdZQGlz0prjrneCDJ4ZcCiXOjQ', '2026-08-09T23:31:44.975Z', '2026-08-02T23:31:45.099Z'),
  (59, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM5MTU3LCJleHAiOjE3ODYzNDM5NTd9.Z6-2DWGwNX6mFYIdEmK-ZciclmVpMrv6cw2n6T8gehs', '2026-08-09T23:39:17.087Z', '2026-08-02T23:39:17.108Z'),
  (60, 8, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzg1NzM5MzIzLCJleHAiOjE3ODYzNDQxMjN9.nT35hLURpEbxU1vmSyTL-vLe57Bu5-9hUnP_2-uT1cA', '2026-08-09T23:42:03.878Z', '2026-08-02T23:42:03.885Z'),
  (61, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTczOTQ2OCwiZXhwIjoxNzg2MzQ0MjY4fQ.tX15R4aJ7LHiHwRM-jgw_GRG6_UOnW6OyVba1-6gEy8', '2026-08-09T23:44:28.771Z', '2026-08-02T23:44:28.807Z'),
  (62, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM5NTY1LCJleHAiOjE3ODYzNDQzNjV9.9GzHYO-KpVdl3FITUGQAil9i3AZ76OIYjcL_t2X4zLI', '2026-08-09T23:46:05.774Z', '2026-08-02T23:46:05.854Z'),
  (63, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM5NjAxLCJleHAiOjE3ODYzNDQ0MDF9.rhdDRERNxSsYZ5XGTJGoHg6vxR-JW77irU8a_Td4qvE', '2026-08-09T23:46:41.550Z', '2026-08-02T23:46:41.595Z'),
  (64, 8, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzg1NzM5NjIwLCJleHAiOjE3ODYzNDQ0MjB9.4njwdgtE_6kDZ_gCxfhV4jEusVqAwLDBGLYrRI3cnX8', '2026-08-09T23:47:00.317Z', '2026-08-02T23:47:00.321Z'),
  (65, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzM5NzU1LCJleHAiOjE3ODYzNDQ1NTV9.ROyndKnK9Q2nj0eurpoPBbKEtc_rkg-Zmopb1i-3cN0', '2026-08-09T23:49:15.342Z', '2026-08-02T23:49:15.551Z'),
  (66, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzM5OTE2LCJleHAiOjE3ODYzNDQ3MTZ9.4hu__g0a9iUQPTP6xTaiy3y2DC4wvGSO5PlA3ksMeHo', '2026-08-09T23:51:56.057Z', '2026-08-02T23:51:56.100Z'),
  (67, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTc0MTk2OCwiZXhwIjoxNzg2MzQ2NzY4fQ.D_UR9sRryxFqNW8UcF70r8BY0BmV_HQ2ewu_gRMHJJA', '2026-08-10T00:26:08.123Z', '2026-08-03T00:26:08.186Z'),
  (68, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzQyOTMyLCJleHAiOjE3ODYzNDc3MzJ9.bGi6AQua8e3pB9k5qAZl-U0AzdA3QizOwqBHV5A4Zlg', '2026-08-10T00:42:12.298Z', '2026-08-03T00:42:12.348Z'),
  (96, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MDYwOTM5LCJleHAiOjE3ODY2NjU3Mzl9.k3ImarOIQ54cW10T0b-f8tatnYO8CLf5hBoCckjk0MU', '2026-08-13T17:02:19.850Z', '2026-08-06T17:02:19.904Z'),
  (69, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTc0MzAwOCwiZXhwIjoxNzg2MzQ3ODA4fQ.9lzRgSgmSYv_yj5k0UeOn9698E3JgzdI7hPeDoOjXRc', '2026-08-10T00:43:28.947Z', '2026-08-03T00:43:28.965Z'),
  (70, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzY2MDgxLCJleHAiOjE3ODYzNzA4ODF9.lEn-wfdiFxvZmR0dgKlbHH4RGCxrr0Uuze_X41TrR4A', '2026-08-10T07:08:01.718Z', '2026-08-03T07:08:02.039Z'),
  (71, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTc2NjE5MCwiZXhwIjoxNzg2MzcwOTkwfQ.fLU9b3KptXhhhAQng6Aa1AtG_XCfwrxxE68anFgAs7Q', '2026-08-10T07:09:50.525Z', '2026-08-03T07:09:50.546Z'),
  (72, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg1NzY2NTE1LCJleHAiOjE3ODYzNzEzMTV9.Z4GMCMd9hdpMPcTdF6vzzOMQ8XRaH5B5ExW1qmpxo9E', '2026-08-10T07:15:15.828Z', '2026-08-03T07:15:15.840Z'),
  (73, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg1NzY2NzgzLCJleHAiOjE3ODYzNzE1ODN9.qvkP18QRFjUTjfoLHJkuIs9vPn6jV4V_zUz0hmrD7OM', '2026-08-10T07:19:43.015Z', '2026-08-03T07:19:43.030Z'),
  (74, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg1NzY2ODYyLCJleHAiOjE3ODYzNzE2NjJ9.YXHxuy5eRoktjdk9WWxPA_Zg7JjYStpaBWL28KN572Q', '2026-08-10T07:21:02.408Z', '2026-08-03T07:21:02.422Z'),
  (75, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzY3NTMxLCJleHAiOjE3ODYzNzIzMzF9.t1fIoqzYFSZkRjVuqs71c9UDE1xujDYCBUaTljjV12Q', '2026-08-10T07:32:11.678Z', '2026-08-03T07:32:11.686Z'),
  (76, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTc2ODIzOSwiZXhwIjoxNzg2MzczMDM5fQ.bZ8cS7Rl-p4Cik6IjipE28_As25y-bDRnVovm2ivBWE', '2026-08-10T07:43:59.412Z', '2026-08-03T07:43:59.425Z'),
  (77, NULL, 'd5d1baf4-628a-4622-ba35-95da33c19c16', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4NTc2ODI2MSwiZXhwIjoxNzg2MzczMDYxfQ.wdkGeZziimuajJ_H6U5HQ6kLxuWuQuMitGsTMgFVtMg', '2026-08-10T07:44:21.779Z', '2026-08-03T07:44:21.788Z'),
  (78, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzY4MzExLCJleHAiOjE3ODYzNzMxMTF9.fIcTE4xKu-Z9WMlMQXkZNkg6ZHOOLMNV2ffVjeEtOqs', '2026-08-10T07:45:11.788Z', '2026-08-03T07:45:11.797Z'),
  (79, NULL, '10000000-0000-0000-0000-000000000013', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMyIsImlhdCI6MTc4NTc2ODMzMywiZXhwIjoxNzg2MzczMTMzfQ.IrSS19wyW_LJOiwIWLHndYlmjRR4psg1iiBjwGhj2WY', '2026-08-10T07:45:33.650Z', '2026-08-03T07:45:33.664Z'),
  (80, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1NzY4Mzk4LCJleHAiOjE3ODYzNzMxOTh9.po6JTWQal-Y_ICGbtQTM_I_WNUBy0kl-iDKURme7Duw', '2026-08-10T07:46:38.464Z', '2026-08-03T07:46:38.481Z'),
  (81, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg1NzY4NDM0LCJleHAiOjE3ODYzNzMyMzR9.8xhDmpXs2Gc9O1YA7tm0xcJcRAlEPjDuw-r4J56Guqs', '2026-08-10T07:47:14.288Z', '2026-08-03T07:47:14.296Z'),
  (82, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTc2OTYyOCwiZXhwIjoxNzg2Mzc0NDI4fQ.58LZLiazXM_mCzada-V5iLgfccUOazoj1EVDo_zF-ao', '2026-08-10T08:07:08.197Z', '2026-08-03T08:07:08.204Z'),
  (83, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg1ODUzMTU3LCJleHAiOjE3ODY0NTc5NTd9.YZmGuJ1vZO9yhoSYvr6LCRRrc57whJCHS6QBX0e0fpI', '2026-08-11T07:19:17.311Z', '2026-08-04T07:19:17.379Z'),
  (84, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg1ODUzMjUyLCJleHAiOjE3ODY0NTgwNTJ9.qhOGMcIYqaHjD32lxEuHZ1X1Hm2hvrymVS9hKUSew0o', '2026-08-11T07:20:52.400Z', '2026-08-04T07:20:52.418Z'),
  (85, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NTk1MTI2OSwiZXhwIjoxNzg2NTU2MDY5fQ.0JBU8ROd9_zbK-cQaBkDf3jVS_2Z__G5FlMDFlHTEWY', '2026-08-12T10:34:29.751Z', '2026-08-05T10:34:29.791Z'),
  (101, NULL, '10000000-0000-0000-0000-000000000011', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4NjExNTE5MiwiZXhwIjoxNzg2NzE5OTkyfQ.dnxf65g__VOqdvdmsLBGFueXLGXFV6j3W-asYo_B0gw', '2026-08-14T08:06:32.876Z', '2026-08-07T08:06:32.904Z'),
  (107, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTE5MzAxLCJleHAiOjE3ODY3MjQxMDF9.WvJ9P8neisNSieXgsI8Yp4_ATtjoxC2zaoA8qw29KCY', '2026-08-14T09:15:01.916Z', '2026-08-07T09:15:01.923Z'),
  (113, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTIzMjI0LCJleHAiOjE3ODY3MjgwMjR9.XUnHLE0_VJeQLnmJ820UEuHNf2hSjapx44BoASkr-bM', '2026-08-14T10:20:24.318Z', '2026-08-07T10:20:24.339Z'),
  (120, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTU3Nzc3LCJleHAiOjE3ODY3NjI1Nzd9.HbhaxO6D7MSJi2j1ZaL_tOqg81bZTmD5ned3MrMwJmM', '2026-08-14T19:56:17.951Z', '2026-08-07T19:56:17.959Z'),
  (124, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTU5Mzc0LCJleHAiOjE3ODY3NjQxNzR9.-fAWWCEIWxGQLe6IJ_B61utW7iEXyxwpoA9bburc17w', '2026-08-14T20:22:54.142Z', '2026-08-07T20:22:54.148Z'),
  (128, 6, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNzg2MTYzNDI3LCJleHAiOjE3ODY3NjgyMjd9.cd4xfSEQ867e-X2dU2vGB3G2xqGhvRyKF3WJgvSZnJQ', '2026-08-14T21:30:27.959Z', '2026-08-07T21:30:27.961Z'),
  (132, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTY2NjYwLCJleHAiOjE3ODY3NzE0NjB9.6PpPDe0kblA2cjeLiPNaIKV16g_-yWmWkQ3e1F8e0mk', '2026-08-14T22:24:20.618Z', '2026-08-07T22:24:20.629Z'),
  (136, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MTcyNzA0LCJleHAiOjE3ODY3Nzc1MDR9.iWzHYIoKtfdxk1tTSfSPobLnNOCYbrmu7GSulhKHoDk', '2026-08-15T00:05:04.857Z', '2026-08-08T00:05:04.864Z'),
  (141, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTczNjA2LCJleHAiOjE3ODY3Nzg0MDZ9.ApmJIRnR8v7I_RV3AtSgA1ncUnELXRGcCw_zsrDFIXM', '2026-08-15T00:20:06.712Z', '2026-08-08T00:20:06.725Z'),
  (145, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTc3MDgyLCJleHAiOjE3ODY3ODE4ODJ9.6eCFhRpEW6qnac1QzR8p7VgyK9Be_IjWhcFLMpKnJiU', '2026-08-15T01:18:02.146Z', '2026-08-08T01:18:02.165Z'),
  (149, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MTgwMDM0LCJleHAiOjE3ODY3ODQ4MzR9.uq1TeNPtTRVSTz1u4RbOegoPauJibIA7-QeQjk57y6k', '2026-08-15T02:07:14.065Z', '2026-08-08T02:07:14.069Z'),
  (153, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MTg3MTY0LCJleHAiOjE3ODY3OTE5NjR9.rqWg733XS-vLcDepmlbBmtaLLnabwLgemXF75O2HLno', '2026-08-15T04:06:04.077Z', '2026-08-08T04:06:04.103Z'),
  (157, 7, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzg2MTk5NDE1LCJleHAiOjE3ODY4MDQyMTV9.9366sPxO4YXNAt1RSWRQd2dMh8eF31UZ82aPZYqah6g', '2026-08-15T07:30:15.011Z', '2026-08-08T07:30:15.137Z');
INSERT INTO "refresh_tokens" ("id", "nguoi_dung_id", "khach_hang_id", "token", "expires_at", "created_at") VALUES
  (161, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjA3MjAzLCJleHAiOjE3ODY4MTIwMDN9.T1Q2hzRxl1fRLIUALB1tU4VkSY0oEy-vBqmNFNCjdHw', '2026-08-15T09:40:03.569Z', '2026-08-08T09:40:03.597Z'),
  (165, 5, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzg2MjA5MzkxLCJleHAiOjE3ODY4MTQxOTF9.Cu-_GA-ibl44vkKJl3j1h9cCwiakcHMk43fAN8Dpheo', '2026-08-15T10:16:31.709Z', '2026-08-08T10:16:31.712Z'),
  (169, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjEwNDc5LCJleHAiOjE3ODY4MTUyNzl9.vpzBex4Ih_WwyBYlUjP5Lp_F5cS8D1j7Javiv_PYSHY', '2026-08-15T10:34:39.009Z', '2026-08-08T10:34:39.014Z'),
  (176, 3, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzg2MjM4OTMwLCJleHAiOjE3ODY4NDM3MzB9.7LJ7PwjoUbJWoYKG5QhVBurWqwOvVGnhf-0uKms--c4', '2026-08-15T18:28:50.300Z', '2026-08-08T18:28:50.303Z'),
  (180, NULL, '9b5d5e46-90a2-41f0-a36b-d0a9fb69b7c1', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjliNWQ1ZTQ2LTkwYTItNDFmMC1hMzZiLWQwYTlmYjY5YjdjMSIsImlhdCI6MTc4NjIzOTk3MSwiZXhwIjoxNzg2ODQ0NzcxfQ.FOUAqIDgyWxZN-wKQEId5o1XOKKUFVV-ltTcbptOrJ4', '2026-08-15T18:46:11.417Z', '2026-08-08T18:46:11.432Z'),
  (184, NULL, '9b5d5e46-90a2-41f0-a36b-d0a9fb69b7c1', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjliNWQ1ZTQ2LTkwYTItNDFmMC1hMzZiLWQwYTlmYjY5YjdjMSIsImlhdCI6MTc4NjI0MDU0MywiZXhwIjoxNzg2ODQ1MzQzfQ.9m1tGmmLD4QanjRWsdXV7UQbMGCo9BcIGrTVmXdzdHM', '2026-08-15T18:55:43.321Z', '2026-08-08T18:55:43.343Z'),
  (188, NULL, '9b5d5e46-90a2-41f0-a36b-d0a9fb69b7c1', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjliNWQ1ZTQ2LTkwYTItNDFmMC1hMzZiLWQwYTlmYjY5YjdjMSIsImlhdCI6MTc4NjI0MTY0OCwiZXhwIjoxNzg2ODQ2NDQ4fQ.ISrcxKEjg89Cx9bImM4MLp46jPjoPmCsytA-UUxAPQE', '2026-08-15T19:14:08.833Z', '2026-08-08T19:14:08.853Z'),
  (189, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg2MjQxNjU5LCJleHAiOjE3ODY4NDY0NTl9.4xh6U5U8Hdfu0yltQwADLmURWAMetDbnTKPxyU63Lgs', '2026-08-15T19:14:19.377Z', '2026-08-08T19:14:19.382Z');

-- --------------------------------------------------------
-- Table: thiet_bi (5 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "thiet_bi" CASCADE;
INSERT INTO "thiet_bi" ("id", "ma_thiet_bi", "ten_thiet_bi", "ngay_mua", "trang_thai", "ghi_chu", "phong_id") VALUES
  ('90000000-0000-0000-0000-000000000001', 'LASER-01', 'Máy Laser trị liệu công suất cao', '2025-01-08T17:00:00.000Z', 'san_sang', 'Máy điều trị viêm sưng', 2),
  ('90000000-0000-0000-0000-000000000004', 'TRACT-01', 'Giường kéo giãn cột sống áp lực âm', '2024-12-03T17:00:00.000Z', 'san_sang', 'Giường kéo giãn cổ/thắt lưng', 2),
  ('003b1a60-08ee-407a-94cf-3db1833764cf', 'GKG-VCB', 'Giường Kéo Giãn Vip', '2026-07-13T17:00:00.000Z', 'dang_su_dung', 'ôk', 2),
  ('90000000-0000-0000-0000-000000000003', 'US-01', 'Máy siêu âm trị liệu', '2024-11-17T17:00:00.000Z', 'dang_su_dung', 'Siêu âm giảm co thắt', 2),
  ('90000000-0000-0000-0000-000000000005', 'BIO-01', 'Thiết bị phản hồi sinh học Biofeedback', '2025-02-27T17:00:00.000Z', 'dang_bao_tri', 'Bảo trì định kỳ hàng tháng', 2);

-- --------------------------------------------------------
-- Table: tin_nhan_chat_ai (32 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "tin_nhan_chat_ai" CASCADE;
INSERT INTO "tin_nhan_chat_ai" ("id", "phien_chat_ai_id", "role", "content", "created_at") VALUES
  ('8429bd29-665d-4f83-8275-a058be0b27cb', '31cef138-98e4-4e70-9d54-7bdf0d65bf57', 'user', 'tôi nhắn  tin cho  facebook như thế nào', '2026-07-28T14:44:57.985Z'),
  ('484e5eb1-a32b-4e1b-b1f0-c11971bebefe', '31cef138-98e4-4e70-9d54-7bdf0d65bf57', 'model', 'Dạ, nếu quý khách muốn nhắn tin qua Facebook của trung tâm, quý khách có thể tìm kiếm Fanpage ''OfficeCare - Vật lý trị liệu & Phục hồi chức năng'' và nhấn vào nút ''Gửi tin nhắn'' ạ. Ngoài ra, em cũng có thể hỗ trợ tư vấn trực tiếp về tình trạng cơ xương khớp của quý khách ngay tại đây, quý khách cần hỗ trợ thêm thông tin gì không ạ?', '2026-07-28T14:44:57.985Z'),
  ('b26f657a-a37a-49c9-8ae9-7986ea8b9cab', '06c60df3-8138-4bd9-b109-03f509713417', 'user', 'Tôi thấy đau lưng 3 ngày liên tục vì phải chạy dealine nhiều tôi muốn thư giãn stress', '2026-07-28T16:27:58.371Z'),
  ('5b96a763-95b6-4e4a-a18a-6e44fb652c26', '06c60df3-8138-4bd9-b109-03f509713417', 'model', 'Chào quý khách, tình trạng đau lưng xuất hiện trong 3 ngày liên tục khi làm việc căng thẳng chạy deadline là một vấn đề rất phổ biến ở dân văn phòng. Em xin gửi đến quý khách phân tích chuyên sâu và giải pháp hỗ trợ như sau:

🔍 1. PHÂN TÍCH NGUYÊN NHÂN KHẢ DĨ:
- Co thắt cơ do căng thẳng (Stress-induced muscle tension): Khi áp lực công việc cao, cơ thể tăng tiết hormone cortisol làm các nhóm cơ vùng thắt lưng co cứng liên tục, giảm lưu thông máu.
- Quá tải áp lực cột sống thắt lưng: Ngồi liên tục nhiều giờ liền khiến đĩa đệm và các đốt sống thắt lưng chịu lực nén cực kỳ lớn.
- Sai tư thế khi tập trung: Khi gồng mình chạy deadline, tư thế ngồi thường bị cúi gập về phía trước hoặc lệch sang một bên mà không tự biết, gây dãn dây xằng và mỏi cơ kéo dài.

💡 2. GIẢI PHÁP KHẮC PHỤC BAN ĐẦU & BÀI TẬP HỖ TRỢ TẠI CHỖ:
- Chườm ấm vùng lưng đau: Sử dụng túi chườm ấm khoảng 15-20 phút vào buổi tối để kích thích tuần hoàn máu và thả lỏng các thớ cơ đang co thắt.
- Thay đổi tư thế & giải lao ngắn: Cứ sau 45-60 phút làm việc, hãy đứng dậy vươn vai, đi lại nhẹ nhàng 2-3 phút.
- Bài tập giãn cơ Cat-Cow (Mèo - Bò): Quỳ gối chống tay, nhịp nhàng võng lưng ngẩng đầu rồi cuộn tròn lưng cúi đầu xuống để giải tỏa áp lực cột sống.
- Hít thở sâu: Dành 5 phút tập hít thở bằng bụng giúp giải tỏa căng thẳng thần kinh và thư giãn toàn thân.
📌 *Lưu ý: Các phân tích và hướng dẫn trên chỉ mang tính chất tham khảo y khoa ban đầu, không thay thế cho chẩn đoán và chỉ định trực tiếp từ Bác sĩ chuyên khoa.*

🏥 3. ĐỀ XUẤT GÓI TRỊ LIỆU OFFICECARE PHÙ HỢP:
Để giải tỏa triệt để cơn đau lưng và thư giãn cơ thể hiệu quả nhất, quý khách có thể tham khảo các giải pháp tại OfficeCare:
- Điện xung trị liệu giải co thắt cơ lưng (Electrotherapy & EMS) (Dịch vụ lẻ, giá 200.000đ): Giúp kích thích cơ sâu, giảm đau nhanh chóng và giải phóng sự co cứng do căng thẳng.
- Liệu trình Giải áp Cột sống Thắt lưng & Tái định hình tư thế (Lower Back & Posture Alignment) (Liệu trình 10 buổi, giá 3.500.000đ): Giúp giải phóng áp lực đĩa đệm, cân bằng lại hệ cơ xương và ngăn ngừa cơn đau tái phát.

Quý khách nên đặt lịch hẹn thăm khám 1:1 cùng Bác sĩ chuyên khoa để được kiểm tra cụ thể và lập phác đồ thư giãn, trị liệu phù hợp nhất ạ!', '2026-07-28T16:27:58.371Z'),
  ('aed36fd5-2a89-46a5-978a-821770bbaa7e', '06c60df3-8138-4bd9-b109-03f509713417', 'user', 'Tôi đau cổ và mỏi vai đau lan xuống giữa lưng đã 1 tuần nay rồi vì sao tôi lại bị vậy', '2026-07-28T16:30:54.901Z'),
  ('fb68561d-841c-4977-a96e-6609d71a4191', '06c60df3-8138-4bd9-b109-03f509713417', 'model', 'Chào bạn, tình trạng đau cổ, mỏi vai lan xuống giữa lưng kéo dài 1 tuần nay là biểu hiện rất điển hình của các vấn đề cơ xương khớp vùng cổ - ngực. Em xin phân tích cụ thể nguyên nhân và giải pháp cho bạn như sau:

🔍 1. PHÂN TÍCH NGUYÊN NHÂN KHẢ DĨ:
- Hội chứng Cổ văn phòng (Tech-Neck): Ngồi làm việc cúi đầu, nhô đầu về phía trước trong thời gian dài khiến cơ vùng cổ và vai bị căng giãn quá mức, kéo căng liên tục xuống các nhóm cơ liên sống vùng lưng giữa.
- Co thắt dải cơ thang và cơ trám: Việc giữ nguyên một tư thế gây thiếu máu nuôi dưỡng cơ, tạo thành các điểm xoắn cơ (Trigger Points) gây đau nhức lan rộng từ cổ xuống lưng.
- Sai lệch tư thế cột sống cổ - ngực: Lưng bị gù, vai sụp khi ngồi làm việc lâu ngày gây áp lực lớn lên các đốt sống ngực và đĩa đệm tương ứng.

💡 2. GIẢI PHÁP TỰ CHĂM SÓC TẠI NHÀ:
- Chườm ấm vùng cổ vai gáy và lưng giữa 15-20 phút mỗi ngày để tăng cường lưu thông máu và thư giãn cơ.
- Thực hiện bài tập giãn cơ cổ và bài tập mở ngực (ép hai báng vai lại gần nhau) sau mỗi 45 phút ngồi làm việc.
- Điều chỉnh lại màn hình máy tính ngang tầm mắt, giữ vai thả lỏng.
📌 *Lưu ý: Phân tích chỉ mang tính chất tham khảo y khoa ban đầu, không thay thế cho chẩn đoán trực tiếp từ Bác sĩ.*

🏥 3. ĐỀ XUẤT GIẢI PHÁP TẠI OFFICECARE:
Để điều trị dứt điểm và phục hồi vận động, bạn nên thăm khám sớm với các dịch vụ chuyên sâu phù hợp:
- Khám lâm sàng & Lượng giá chức năng cơ xương khớp (Giá: 150.000đ): Bác sĩ sẽ kiểm tra tầm vận động và tìm nguyên nhân gốc rễ.
- Giải cơ sâu và nhiệt trị liệu cổ vai gáy (Deep Tissue & Thermotherapy) (Dịch vụ lẻ: 350.000đ): Giúp giải tỏa lập tức các điểm co thắt cơ lan rộng.
- Liệu trình Chuyên sâu Phục hồi Cổ Vai Gáy Văn phòng (Office Tech-Neck Rehab) (Liệu trình 7 buổi: 2.200.000đ): Phác đồ toàn diện giúp phục hồi đường cong sinh lý và giải áp cột sống cổ - lưng.

Bạn có thể đặt lịch hẹn thăm khám ngay hôm nay để được bác sĩ kiểm tra và đưa ra phác đồ điều trị tối ưu nhất ạ!', '2026-07-28T16:30:54.901Z'),
  ('bb9710ca-93a3-4101-89ff-ed6b64804b9a', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'user', 'Tôi bị mỏi cổ vai gáy do ngồi máy tính nhiều, trung tâm có liệu trình nào điều trị dứt điểm không?', '2026-07-30T15:55:42.587Z'),
  ('d06f0b0d-10b0-4fc8-8277-c5d613b159cd', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'model', 'Chào bạn! Tình trạng mỏi cổ vai gáy khi ngồi máy tính lâu là hiện tượng rất phổ biến ở giới văn phòng.

🔍 Phân tích nguyên nhân khả dĩ:
- Tư thế làm việc sai lệch: Cúi đầu quá thấp hoặc nhô đầu về phía trước (Head Forward Posture) khiến các cơ vùng cổ - vai - gáy phải gồng chịu lực gấp 3-5 lần bình thường.
- Cơ bắp căng thẳng co thắt: Vi tuần hoàn máu bị cản trở dẫn đến tình trạng thiếu máu nuôi cơ, co thắt dải cơ cầu vai và dải cơ nâng vai.

💡 Lời khuyên tự chăm sóc tại chỗ:
- Điều chỉnh màn hình máy tính ngang tầm mắt, nghỉ ngơi 3-5 phút sau mỗi 45 phút làm việc.
- Thực hiện bài tập kéo giãn cơ cổ nhẹ nhàng: Đặt tay qua đầu nghiêng cổ sang bên đối diện, giữ 15-20 giây mỗi bên.
📌 *Lưu ý: Phân tích chỉ mang tính chất tham khảo y khoa ban đầu, không thay thế cho chẩn đoán trực tiếp từ Bác sĩ.*

🏥 Giải pháp tại OfficeCare:
Để điều trị dứt điểm và ngăn ngừa tái phát, OfficeCare đề xuất bạn tham khảo:
1. Khám lâm sàng & Lượng giá chức năng cơ xương khớp (Giá: 150.000đ) - Bác sĩ/Chuyên gia sẽ thăm khám trực tiếp và đưa ra phác đồ chuẩn xác.
2. Liệu trình Điều trị Cổ - Vai - Gáy (8 buổi, giá: 2.390.000đ) - Kết hợp vật lý trị liệu, giải phóng điểm đau (trigger points) và phục hồi biên độ vận động.
3. Liệu trình Cải thiện Tư thế Văn phòng (12 buổi, giá: 3.290.000đ) - Tối ưu cho việc chỉnh tư thế chuẩn lâu dài.', '2026-07-30T15:55:42.587Z'),
  ('56863b4f-6003-4cb0-ab76-2aa58fb8923a', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'user', 'sádad', '2026-07-30T15:56:09.008Z'),
  ('84c05eb2-3a38-4815-9a0c-d6da7425a04a', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'model', 'Dạ, OfficeCare chưa hiểu rõ thông tin bạn cần hỗ trợ. Bạn đang gặp vấn đề về đau mỏi cơ xương khớp ở vùng nào (như cổ vai gáy, lưng, thắt lưng...) hay cần tư vấn dịch vụ nào của trung tâm ạ? Chúc bạn một ngày tốt lành!', '2026-07-30T15:56:09.008Z'),
  ('5d897873-e0fe-438e-bace-9fb89560459d', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'user', 'ok', '2026-07-30T16:07:37.052Z'),
  ('4e0e9a45-944b-48cc-868e-6d010d3add19', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'model', 'Dạ, nếu bạn có bất kỳ thắc mắc nào khác hoặc muốn hẹn lịch thăm khám tại OfficeCare, bạn cứ nhắn cho mình nhé! Chúc bạn một ngày tràn đầy năng lượng và làm việc thoải mái!', '2026-07-30T16:07:37.052Z'),
  ('a047845d-6db5-4d5c-a261-82e777a49265', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'user', 'ok', '2026-07-30T16:07:43.808Z'),
  ('d22e9b67-b5b6-4e8f-899d-06399bd10ae9', '552f1fcb-67bd-4c59-a0c5-c2089e11b280', 'model', 'Dạ, OfficeCare luôn sẵn sàng hỗ trợ bạn. Khi nào bạn cần tư vấn thêm về sức khỏe cơ xương khớp hoặc có nhu cầu đặt lịch dịch vụ, hãy nhắn cho OfficeCare nhé! Chúc bạn nhiều sức khỏe và một ngày làm việc hiệu quả!', '2026-07-30T16:07:43.808Z'),
  ('7cc95359-1ce0-4507-a98f-1f7ad61fa209', '6871e88b-144e-432b-a99e-7b7bc3170d70', 'user', 'Chào bác sĩ AI ơi, dạo này em ngồi làm việc nhiều nên hay bị mỏi cổ vai gáy lắm, không biết bên mình có cách nào cải thiện dứt điểm không ạ?', '2026-08-03T13:10:00.000Z'),
  ('2367ac4f-5515-41c4-a396-5ccfe994d741', '6871e88b-144e-432b-a99e-7b7bc3170d70', 'model', 'Dạ chào anh Văn An! Tình trạng mỏi cổ vai gáy khi ngồi làm việc lâu thường do cơ thang trên và cơ nâng vai bị co cứng kéo dài, kết hợp tư thế cúi đầu nhìn màn hình liên tục ạ.

Trước mắt anh có thể tự giảm mỏi bằng cách nghỉ giải lao 5 phút mỗi giờ, xoay cổ nhẹ nhàng theo 4 hướng và giãn cơ vai ra sau khoảng 10-15 giây mỗi lần.
📌 Lưu ý: Phân tích trên chỉ mang tính chất tham khảo y khoa ban đầu, không thay thế cho chẩn đoán trực tiếp từ Bác sĩ.

Để cải thiện dứt điểm, OfficeCare hiện có Liệu trình Điều trị Cổ - Vai - Gáy (8 buổi, 2.600.000đ) tập trung giảm co cứng cơ, khôi phục biên độ vận động cổ và hạn chế đau mỏi tái phát. Anh có muốn đặt lịch khám lượng giá 1:1 với bác sĩ chuyên khoa để được tư vấn phác đồ phù hợp không ạ?', '2026-08-03T13:10:09.000Z'),
  ('224e23fc-1f5a-497e-a93e-a9a2c60f452d', '6871e88b-144e-432b-a99e-7b7bc3170d70', 'user', 'Dạ để em xem lịch đã, thứ Bảy tuần này (08/08) buổi chiều bên mình còn trống không ạ?', '2026-08-03T13:12:40.000Z'),
  ('311dd27a-194a-4ef6-a542-b50de500c552', '6871e88b-144e-432b-a99e-7b7bc3170d70', 'model', 'Dạ em vừa kiểm tra trong hệ thống, thứ Bảy ngày 08/08 buổi chiều phòng khám vẫn còn kha khá khung giờ trống ạ, ví dụ 14:00, 15:00 và 16:30, hiện có 2 bác sĩ trực hôm đó. Anh có muốn em hỗ trợ giữ chỗ giúp anh khung giờ nào tiện nhất không ạ?', '2026-08-03T13:12:52.000Z'),
  ('24aa459f-4778-406e-b095-0b4ae727eee9', '6871e88b-144e-432b-a99e-7b7bc3170d70', 'user', 'À em quên mất, cho em hỏi luôn gói em đang dùng còn bao nhiêu buổi và tới bao giờ hết hạn vậy ạ?', '2026-08-03T13:14:05.000Z'),
  ('b8928684-1a2f-4f44-929c-9f38e9ea7ea2', '6871e88b-144e-432b-a99e-7b7bc3170d70', 'model', 'Dạ em tra cứu trong tài khoản của anh rồi ạ: anh đang điều trị Liệu trình Cải thiện Tư thế Văn phòng, đã dùng 2/12 buổi, hạn sử dụng tới 26/09/2026. Điểm uy tín hiện tại của anh là 20 điểm. Nếu anh sắp xếp đều đặn khoảng 2 buổi/tuần thì hoàn toàn kịp dùng hết liệu trình trước hạn ạ. Anh cần em hỗ trợ đặt lịch buổi tiếp theo luôn không?', '2026-08-03T13:14:18.000Z'),
  ('cc79b102-bfa7-4454-817d-a14ba7eae8c5', 'd164042b-5014-46df-a596-d1bf5a4e11bb', 'user', 'Hôm nay tôi muốn massage thư giãn lịch trống hôm nay là khi nào', '2026-08-03T07:26:33.992Z'),
  ('43eeabe0-7652-45d7-98c5-8f9c65293fff', 'd164042b-5014-46df-a596-d1bf5a4e11bb', 'model', 'Dạ hôm nay (03/08/2026), OfficeCare còn rất nhiều khung giờ trống để đón tiếp bạn đến massage thư giãn cơ thể! Các khung giờ gần nhất hiện có bao gồm: 08:00, 08:30, 09:00, 10:00, 10:30, 11:00... (và nhiều suất buổi chiều/tối).

Bạn có thể tham khảo Gói Thư Giãn Toàn Thân (299.000đ) hoặc Gói Phục Hồi Toàn Diện (399.000đ) giúp giải tỏa nhanh căng cứng cơ, tăng lưu thông máu và lấy lại năng lượng tức thì. Bạn muốn chọn khung giờ nào để OfficeCare hỗ trợ giữ chỗ ngay nhé!', '2026-08-03T07:26:33.992Z'),
  ('b6b9cb01-c23d-459a-8e0b-885d3597ae9a', '79b33052-d46f-45dc-8ddf-fe30d02adbcc', 'user', 'Hôm nay tôi muốn massage thư giãn lịch trống hôm nay là khi nào', '2026-08-03T07:34:39.721Z'),
  ('2bfdeca4-a1a4-452b-9198-c2ea159ebd23', '79b33052-d46f-45dc-8ddf-fe30d02adbcc', 'model', 'Dạ hôm nay (03/08/2026), OfficeCare hiện còn 7 khung giờ trống sẵn sàng đón tiếp bạn! Các khung giờ gần nhất bao gồm: 16:00, 16:30, 17:00, 17:30, 18:00, 18:30...

Để thư giãn cơ thể và nạp lại năng lượng sau giờ làm việc, bạn có thể tham khảo Gói Thư Giãn Toàn Thân (299.000đ) hoặc Gói Phục Hồi Toàn Diện (399.000đ) giúp thả lỏng sâu các nhóm cơ bị căng cứng.

Bạn hãy bấm chọn khung giờ thuận tiện bên dưới để OfficeCare hỗ trợ giữ chỗ ngay cho bạn nhé!', '2026-08-03T07:34:39.721Z'),
  ('78829767-4a25-4f84-9fac-0d5b16f87ca0', '79b33052-d46f-45dc-8ddf-fe30d02adbcc', 'user', 'Gói liệu trình của tôi còn mấy buổi', '2026-08-03T07:35:09.450Z'),
  ('474f57d6-ba36-4fa1-8109-c44a73040b55', '79b33052-d46f-45dc-8ddf-fe30d02adbcc', 'model', 'Dạ chào anh Nguyễn Văn An, hiện tại anh đang sử dụng gói **Liệu trình Cải thiện Tư thế Văn phòng** tại OfficeCare.

Thông tin chi tiết gói của anh như sau:
- **Tổng số buổi:** 12 buổi
- **Số buổi đã dùng:** 2 buổi
- **Số buổi còn lại:** 10 buổi
- **Hạn sử dụng gói:** đến ngày 27/09/2026

Ngoài ra, anh đang có một lịch hẹn sắp tới vào **11:00 hôm nay (03/08/2026)**. Anh nhớ đến đúng giờ để buổi trị liệu đạt hiệu quả tốt nhất nhé!', '2026-08-03T07:35:09.450Z'),
  ('cb852a0a-ffa9-4c41-843d-dffd8e92b5e9', 'd75464c9-c82c-47fe-914b-f2173bd0908d', 'user', '1 + 1 bằng mấy', '2026-08-03T07:48:38.928Z'),
  ('baa487aa-8b0b-4830-be62-13393ec9c829', 'd75464c9-c82c-47fe-914b-f2173bd0908d', 'model', 'Dạ, em là Trợ lý Y Khoa ảo của OfficeCare, chuyên hỗ trợ tư vấn sức khỏe cơ xương khớp và các gói dịch vụ trị liệu phục hồi chức năng. Em xin phép từ chối trả lời các câu hỏi ngoài phạm vi này ạ.

Nếu bạn đang có thắc mắc liên quan đến sức khỏe cơ xương khớp hay cần hỗ trợ thông tin dịch vụ, em luôn sẵn sàng đồng hành cùng bạn!', '2026-08-03T07:48:38.928Z'),
  ('909104cf-446f-470a-96ba-086d6a0fb438', '68244b93-2a97-4190-9ab3-f9869eb5ed6d', 'user', 'Tôi muốn booking thì làm thế nào', '2026-08-09T05:06:22.454Z'),
  ('96441d74-8adb-406c-a627-86ab5923169c', '68244b93-2a97-4190-9ab3-f9869eb5ed6d', 'model', 'Dạ, việc đặt lịch tại OfficeCare vô cùng đơn giản và nhanh chóng ạ!

Bạn có thể thực hiện theo 2 cách sau:
1. **Đặt trực tiếp 1 chạm:** Bạn hãy bấm ngay nút **Đặt lịch ngay** xuất hiện ở bên dưới, sau đó chọn gói dịch vụ, ngày và khung giờ phù hợp với lịch trình của bạn.
2. **Đặt qua tư vấn:** Bạn chỉ cần nhắn cho em ngày và buổi bạn muốn đến (ví dụ: *''Mai em muốn đến buổi chiều''* hoặc *''Thứ 2 tuần sau còn lịch trống không''*), em sẽ tra cứu và hỗ trợ giữ chỗ cho bạn ngay lập tức!

Nếu bạn chưa rõ nên chọn gói dịch vụ nào, hãy chia sẻ thêm về tình trạng cơ xương khớp của bạn để em tư vấn gói phù hợp nhất nhé!', '2026-08-09T05:06:22.454Z'),
  ('25b5168b-3ff8-4161-ae96-ef90249024be', '68244b93-2a97-4190-9ab3-f9869eb5ed6d', 'user', 'hôm nay còn trống  những khung giờ nào', '2026-08-09T05:07:04.435Z'),
  ('11334377-d949-4d61-a685-2716e351a26f', '68244b93-2a97-4190-9ab3-f9869eb5ed6d', 'model', 'Dạ, hôm nay (Chủ Nhật, ngày 09/08/2026), hệ thống đặt lịch của OfficeCare hiện vẫn còn nhận khách cả **Buổi Sáng** và **Buổi Chiều** ạ!

Bạn có thể bấm nút **Đặt lịch ngay** bên dưới để chọn buổi phù hợp và hoàn tất đặt hẹn nhanh chóng nhé!', '2026-08-09T05:07:04.435Z');

-- --------------------------------------------------------
-- Table: vai_tro (6 rows)
-- --------------------------------------------------------
TRUNCATE TABLE "vai_tro" CASCADE;
INSERT INTO "vai_tro" ("id", "ma_vai_tro", "ten_vai_tro") VALUES
  (1, 'khach_hang', 'Khách hàng'),
  (2, 'le_tan', 'Lễ tân'),
  (3, 'ky_thuat_vien', 'Kỹ thuật viên'),
  (4, 'bac_si', 'Bác sĩ'),
  (5, 'admin', 'Quản trị viên'),
  (6, 'quan_ly', 'Quản lý');

SET session_replication_role = 'origin';
COMMIT;

-- Backup completed successfully.
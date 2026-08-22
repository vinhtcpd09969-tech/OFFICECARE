export interface TermsSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_EFFECTIVE_DATE = '22/08/2026';

export const TERMS_OF_SERVICE: TermsSection[] = [
  {
    heading: '1. Định nghĩa & Phạm vi hoạt động',
    paragraphs: [
      '1.1 OfficeCare: Trung tâm chuyên khoa Phục Hồi Chức Năng và Vật lý trị liệu bảo tồn cơ xương khớp dành cho dân văn phòng và người lao động. Phương pháp can thiệp hoàn toàn tự nhiên, không xâm lấn, không dùng thuốc và không phẫu thuật.',
      '1.2 Chuyên viên Vật lý trị liệu: Nhân sự chuyên môn y tế có chứng chỉ hành nghề, chịu trách nhiệm trực tiếp lượng giá chức năng vận động, đánh giá tầm vận động khớp, cơ lực, mức độ đau, xác định các yếu tố chống chỉ định và thiết lập Kế hoạch trị liệu cá nhân hóa.',
      '1.3 Kỹ thuật viên (KTV): Nhân sự y tế thực hiện các kỹ thuật trị liệu chuyên sâu bằng tay và vận hành các trang thiết bị vật lý trị liệu công nghệ cao theo đúng kế hoạch được chỉ định.',
      '1.4 Buổi Lượng giá chức năng: Buổi đánh giá chuyên môn ban đầu nhằm đo lường mức độ suy giảm vận động, xác định nguyên nhân co cứng cơ xương khớp và đưa ra giải pháp can thiệp phù hợp.',
      '1.5 Kế hoạch trị liệu: Lộ trình các buổi can thiệp phục hồi chức năng (theo từng buổi dịch vụ lẻ hoặc gói liệu trình chuyên sâu nhiều buổi) được thiết kế riêng biệt cho từng thể trạng khách hàng.',
      '1.6 Tài khoản định danh cá nhân: Mỗi hồ sơ điều trị gắn liền với một tài khoản chính chủ duy nhất (qua số điện thoại và thông tin cá nhân) để đảm bảo tính an toàn, bảo mật và chính xác tuyệt đối của dữ liệu y tế phục hồi.',
    ],
  },
  {
    heading: '2. Quy định đặt lịch hẹn & Khung giờ vận hành',
    paragraphs: [
      '2.1 Khung giờ tiếp nhận theo Buổi: OfficeCare tiếp nhận lịch hẹn theo 2 khung buổi linh hoạt:',
    ],
    bullets: [
      'Buổi Sáng: 07:30 – 12:00',
      'Buổi Chiều: 12:00 – 20:00',
      'Giờ đóng cửa trung tâm: Trung tâm kết thúc ca làm việc vào lúc 20:00 hàng ngày. Đối với các lượt tiếp nhận sát giờ đóng cửa, hệ thống và nhân viên tiếp đón sẽ thông báo trước để trao đổi, thống nhất thời gian thực hiện phù hợp nhằm đảm bảo trọn vẹn chất lượng buổi trị liệu.',
      'Sức chứa & Ngân sách thời gian: Sức chứa phục vụ được tính toán tự động dựa trên tổng thời lượng ca trực của đội ngũ nhân sự chuyên môn. Hệ thống sẽ tạm dừng tiếp nhận khi ngân sách thời gian trong buổi đã đạt công suất tối đa để đảm bảo chất lượng phục vụ tốt nhất.',
      'Lựa chọn Chuyên môn: Khách hàng có thể chủ động chọn Chuyên viên/Kỹ thuật viên mong muốn hoặc chọn "Chuyên gia bất kỳ" để hệ thống tự động phân bổ đến nhân sự sẵn sàng tiếp nhận sớm nhất.',
      'Giới hạn số lượng lịch hẹn: Mỗi tài khoản khách hàng được duy trì tối đa 03 lịch hẹn đang hoạt động (chưa hoàn thành) cùng lúc trên toàn hệ thống.',
    ],
  },
  {
    heading: '3. Tiếp đón, Hàng đợi & Quy trình chuyển tuyến',
    paragraphs: [
      '3.1 Check-in & Lấy số thứ tự: Khi đến Trung tâm, Khách hàng vui lòng xuất trình thông tin tại quầy Lễ tân để hoàn tất thủ tục Check-in và nhận Số thứ tự vào hàng đợi tiếp đón.',
      '3.2 Mô hình tiếp nhận linh hoạt: Chuyên viên và Kỹ thuật viên khi hoàn tất ca trước sẽ chủ động bấm gọi số tiếp theo theo thứ tự check-in thực tế tại quầy để mời khách vào phòng làm việc.',
      '3.3 Quy định khi vắng mặt tại sảnh chờ: Trường hợp được gọi tên nhưng Khách hàng tạm thời chưa có mặt, hệ thống sẽ chuyển lượt xuống cuối hàng đợi để nhường quyền ưu tiên cho khách kế tiếp. Trường hợp gọi đến lần thứ 2 vẫn không có mặt, buổi hẹn sẽ được ghi nhận là vắng mặt không lý do.',
      '3.4 Quy trình Chuyển tuyến ngoài an toàn: Khi phát hiện các dấu hiệu tổn thương nghi ngờ vượt ngoài thẩm quyền phục hồi chức năng ban đầu (cần chụp X-quang, MRI hoặc can thiệp y khoa chuyên sâu), Chuyên viên sẽ tư vấn Chuyển tuyến an toàn sang cơ sở y tế phù hợp và chuyển trạng thái buổi hẹn sang "Chờ tái lượng giá" kèm thời hạn quay lại.',
      '3.5 Ưu đãi tái lượng giá: Khách hàng quay lại trong thời hạn hẹn được ưu tiên tiếp nhận ngay ở đầu hàng đợi để Chuyên viên đọc kết quả phim chụp và hoàn thiện kết luận lượng giá mà HOÀN TOÀN KHÔNG PHÁT SINH THÊM CHI PHÍ LƯỢNG GIÁ LẦN 2. Trường hợp quá thời hạn hẹn mà Khách hàng không quay lại, buổi lượng giá ban đầu sẽ được tự động đóng hoàn tất (không hoàn phí do dịch vụ đánh giá ban đầu và khuyến cáo an toàn đã được cung cấp đầy đủ).',
    ],
  },
  {
    heading: '4. Biểu phí, Thanh toán & Quy định đăng ký gói',
    paragraphs: [
      '4.1 Biểu phí minh bạch: Toàn bộ giá dịch vụ lẻ, buổi lượng giá chức năng và các gói liệu trình được niêm yết công khai trên hệ thống và tại Trung tâm.',
      '4.2 Buổi Lượng giá chức năng: Hoàn tất thanh toán trước khi bắt đầu vào bàn lượng giá (thanh toán trực tuyến khi đặt lịch hoặc thanh toán tại quầy khi check-in).',
      '4.3 Dịch vụ lẻ & Buổi gói: Thanh toán linh hoạt (trả trước trực tuyến, thanh toán tại quầy lúc check-in hoặc sau khi kết thúc buổi trị liệu).',
      '4.4 Gói liệu trình nhiều buổi: Khách hàng có thể lựa chọn hình thức Thanh toán trả thẳng 100% khi đăng ký hoặc hình thức Thanh toán phân kỳ theo từng buổi (chi phí trọn gói được chia đều theo từng buổi đến trị liệu thực tế).',
      '4.5 Nguyên tắc đăng ký gói: Gói liệu trình trị liệu chỉ được phép đăng ký và thanh toán SAU KHI Khách hàng đã hoàn thành buổi lượng giá chức năng ban đầu và có chỉ định lộ trình cụ thể từ Chuyên viên.',
    ],
  },
  {
    heading: '5. Chính sách mã giảm giá (Voucher)',
    paragraphs: [
      '5.1 Điều kiện áp dụng: Mỗi mã Voucher có quy định cụ thể về mức giảm, giá trị đơn hàng tối thiểu, nhóm dịch vụ áp dụng và kênh thanh toán (trực tuyến hoặc trực tiếp tại quầy).',
      '5.2 Mã có cấu hình "Tự động áp dụng": Hệ thống sẽ tự động nhận diện và khấu trừ mức giảm giá ưu đãi cao nhất vào hóa đơn khi đơn hàng thỏa mãn toàn bộ điều kiện.',
      '5.3 Mã ưu đãi thông thường: Nằm trong Kho mã ưu đãi. Khách hàng hoặc thu ngân sẽ tự nhập mã hoặc mở Kho mã để chọn áp dụng khi đủ điều kiện.',
      '5.4 Quy định sử dụng: Mỗi hóa đơn chỉ được áp dụng duy nhất 01 mã giảm giá. Mỗi mã ưu đãi được quản lý giới hạn số lượt sử dụng riêng cho từng tài khoản khách hàng.',
    ],
  },
  {
    heading: '6. Chính sách đổi lịch & Vắng mặt (No-Show)',
    paragraphs: [
      '6.1 Quyền đổi lịch hẹn linh hoạt: Khách hàng có quyền chủ động đổi buổi hẹn sang ngày khác hoặc buổi khác thông qua ứng dụng hoặc liên hệ tổng đài Trung tâm trước khi ca trực kết thúc.',
      '6.2 Xử lý khi vắng mặt (Không đến): Đối với các buổi hẹn đã thanh toán trước (thanh toán trực tuyến hoặc theo gói trả thẳng), trường hợp Khách hàng không đến và không thực hiện đổi lịch trong thời gian ca trực của ngày hẹn, buổi hẹn sẽ được ghi nhận là Đã kết thúc theo ca trực (không áp dụng hoàn phí cho lượt hẹn này) nhằm đảm bảo tính công bằng trong việc điều tiết công suất phục vụ của Trung tâm cho các khách hàng khác. Đối với các buổi hẹn chưa thanh toán, buổi hẹn sẽ tự động đóng khi hết ca trực và ghi nhận lịch sử vắng mặt trên hệ thống.',
    ],
  },
  {
    heading: '7. Chính sách hạn sử dụng gói & Hoàn tiền',
    paragraphs: [
      '7.1 Hạn sử dụng gói liệu trình: Mỗi gói liệu trình có Hạn sử dụng cố định (tính từ ngày kích hoạt cộng số ngày quy định của gói) và hiển thị trực tiếp trong hồ sơ cá nhân. Hạn sử dụng đã chốt cho hợp đồng sẽ không bị thay đổi.',
      '7.2 Gói quá hạn sử dụng: Khi gói liệu trình hết hạn mà Khách hàng chưa sử dụng hết số buổi, gói sẽ tự động đóng lại. Trung tâm không hoàn lại tiền cho các buổi chưa sử dụng và không thu thêm bất kỳ khoản phí nào.',
      '7.3 Đối tượng áp dụng hoàn tiền: Chính sách hoàn tiền CHỈ ÁP DỤNG DUY NHẤT cho các Gói liệu trình đã thanh toán 100% (Trả thẳng) và hợp đồng gói vẫn còn trong Hạn sử dụng. (Các gói thanh toán từng buổi hoặc dịch vụ lẻ không phát sinh hoàn tiền do thực hiện buổi nào thanh toán dứt điểm buổi đó).',
      '7.4 Quy tắc tính toán số tiền hoàn lại: Lấy tổng số tiền thực tế Khách hàng đã thanh toán cho gói liệu trình, trừ đi chi phí của các buổi trị liệu Khách hàng đã thực hiện thực tế (được tính bằng giá trị gói chia đều cho tổng số buổi rồi nhân với số buổi đã dùng), và trừ đi 10% phí quản lý và chấm dứt hợp đồng sớm (tính trên tổng giá trị gói đã ký). Phần tiền còn lại sau khi trừ sẽ được hoàn trả trực tiếp cho Khách hàng. Trường hợp số tiền sau khi trừ nhỏ hơn hoặc bằng 0đ, số tiền hoàn lại là 0đ và Khách hàng không phải đóng thêm bất kỳ chi phí nào.',
    ],
  },
  {
    heading: '8. Bảo mật hồ sơ & Quyền riêng tư dữ liệu',
    paragraphs: [
      '8.1 Bảo mật dữ liệu: Toàn bộ chỉ số lượng giá tầm vận động, cơ lực, mức độ đau, hình ảnh tư thế và tiến trình can thiệp của Quý khách được lưu trữ bảo mật theo tiêu chuẩn dữ liệu y tế điện tử của OfficeCare.',
      '8.2 Quyền tra cứu minh bạch: Khách hàng có quyền truy cập ứng dụng OfficeCare để theo dõi toàn bộ Lịch sử điều trị, hình ảnh bài tập phục hồi chức năng và hóa đơn thanh toán của mình mọi lúc, mọi nơi.',
    ],
  },
];

export interface TermsSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_EFFECTIVE_DATE = '15/07/2026';

export const TERMS_OF_SERVICE: TermsSection[] = [
  {
    heading: '1. Định nghĩa thuật ngữ',
    paragraphs: [
      '1.1 OfficeCare: Thương hiệu thuộc quản lý của Phòng khám Phục hồi chức năng & Trị liệu Cột sống OfficeCare.',
      '1.2 Dịch vụ: Các gói dịch vụ khám lâm sàng, lượng giá cơ sinh học, điều trị vật lý trị liệu (buổi lẻ hoặc liệu trình dài ngày) được mô tả trên hệ thống.',
      '1.3 Phác đồ điều trị: Lộ trình điều trị được Bác sĩ chuyên khoa thiết lập riêng cho từng bệnh nhân dựa trên kết quả lượng giá lâm sàng.',
      '1.4 Tài khoản bệnh nhân: Tài khoản điện tử đăng ký trên website/ứng dụng OfficeCare bằng email và số điện thoại chính chủ để quản lý lịch hẹn, hóa đơn và bệnh án điện tử.',
      '1.5 Điểm uy tín: Chỉ số đánh giá mức độ tuân thủ lịch hẹn của khách hàng. Điểm uy tín mặc định là 100 và sẽ bị khấu trừ nếu vi phạm quy định hủy lịch trễ hoặc tự ý vắng mặt.',
    ],
  },
  {
    heading: '2. Phạm vi dịch vụ & Quy chuẩn y đức',
    paragraphs: [
      'OfficeCare cung cấp các dịch vụ khám và điều trị bảo tồn (không dùng thuốc, không phẫu thuật) đối với các hội giúp đau mỏi cơ xương khớp văn phòng (đau lưng, cổ, vai gáy, tê bì tay...).',
      'Bằng việc đăng ký tài khoản hoặc sử dụng dịch vụ đặt lịch hẹn, Khách hàng xác nhận đã đọc, hiểu và đồng ý tự nguyện tuân thủ toàn bộ các quy định trong Thỏa thuận này.',
    ],
  },
  {
    heading: '3. Quy định đặt lịch & Đặt lịch tuần tự',
    paragraphs: [
      '3.1 Xác nhận lịch hẹn: Lịch hẹn ban đầu ở trạng thái "Chưa xác nhận". Lễ tân sẽ liên hệ xác nhận trực tiếp qua điện thoại. Nếu không thể liên lạc được, OfficeCare có quyền hủy lịch hẹn để giải phóng chỗ cho khách hàng khác.',
      '3.2 Quy tắc đặt lịch tuần tự: Đối với các gói liệu trình, Khách hàng bắt buộc phải hoàn thành buổi điều trị trước đó mới được quyền đặt lịch cho buổi tiếp theo.',
      '3.3 Sức chứa khả dụng: Số lượng lịch hẹn trong mỗi khung giờ được giới hạn dựa trên năng lực phục vụ của phòng khám. Hệ thống sẽ báo "Đầy" hoặc ẩn khung giờ khi đã đạt giới hạn sức chứa, không cho phép đặt lịch vượt tải.',
    ],
  },
  {
    heading: '4. Biểu phí & Hình thức thanh toán gói liệu trình',
    paragraphs: [
      'Khách hàng có thể lựa chọn các hình thức thanh toán sau:',
      '4.1 Thanh toán từng buổi: Khách hàng thanh toán dứt điểm chi phí của buổi hiện tại mới được phép đặt lịch cho buổi kế tiếp.',
      '4.2 Thanh toán trả góp: Khách hàng đóng trước 50% chi phí gói tại thời điểm mua. Số tiền 50% còn lại bắt buộc phải hoàn tất thanh toán trước một buổi điều trị mốc quy định (mốc cụ thể này được hệ thống tự động xác định và hiển thị trực quan trong hồ sơ điều trị cá nhân của bạn).',
      '4.3 Thanh toán trả thẳng: Khách hàng thanh toán 100% giá trị gói ngay khi đăng ký mua.',
    ],
  },
  {
    heading: '5. Chính sách miễn phí khám lâm sàng',
    paragraphs: [
      '5.1 Điều kiện miễn phí: Khách hàng được miễn phí 100% chi phí khám lâm sàng ban đầu khi mua gói dịch vụ theo hình thức Trả thẳng hoặc Trả góp, với điều kiện giá trị gốc của gói dịch vụ (không bao gồm phí khám) đạt từ 1.000.000đ trở lên.',
      '5.2 Đối tượng loại trừ: Chính sách miễn phí khám KHÔNG áp dụng dưới bất kỳ hình thức nào đối với khách hàng lựa chọn hình thức Thanh toán từng buổi.',
    ],
  },
  {
    heading: '6. Chính sách thay đổi lịch hẹn',
    paragraphs: [
      '6.1 Quyền thay đổi lịch hẹn: Khách hàng được phép thay đổi giờ hẹn/ngày hẹn bằng cách liên hệ hotline trước ít nhất 8 tiếng trước giờ bắt đầu của ca hẹn.',
      '6.2 Hạn chế đổi lịch: Trong vòng 8 tiếng trước khi ca hẹn bắt đầu, Khách hàng không thể thực hiện đổi lịch mà chỉ được phép hủy lịch hoặc chấp nhận vắng mặt.',
    ],
  },
  {
    heading: '7. Chính sách vắng mặt & Hủy lịch trễ (No-Show & Penalty)',
    paragraphs: [
      'Để đảm bảo công bằng cho tất cả bệnh nhân và tối ưu hóa thời gian điều trị của bác sĩ, OfficeCare áp dụng khấu trừ điểm uy tín khi vi phạm quy định hủy/vắng mặt:',
      '7.1 Cơ chế ân xá: Đối với gói trả thẳng hoặc trả góp: Vi phạm lần đầu tiên trong phác đồ điều trị được miễn trừ phạt (không trừ điểm uy tín). Áp dụng phạt điểm từ lần vi phạm thứ 2 trở đi.',
      '7.2 Áp dụng ngay: Đối với gói thanh toán từng buổi hoặc buổi lẻ không thuộc gói: Áp dụng phạt trừ điểm uy tín ngay từ lần vi phạm đầu tiên.',
      '7.3 Mức phạt điểm uy tín:',
      '- Trừ 10 điểm: Nếu khách hàng chủ động hủy lịch trên hệ thống hoặc liên hệ báo trước cho Lễ tân trước ca hẹn.',
      '- Trừ 20 điểm: Nếu khách hàng vắng mặt không báo trước (No-show).',
      '7.4 Quyền khóa tài khoản: Nếu điểm uy tín của tài khoản giảm xuống mức thấp, OfficeCare có quyền chủ động tạm khóa hoặc khóa vĩnh viễn tài khoản của Khách hàng thông qua bộ phận kiểm duyệt và lọc thành viên định kỳ.',
    ],
  },
  {
    heading: '8. Chính sách phạt hủy gói & Hoàn tiền (Refund Policy)',
    paragraphs: [
      'Khách hàng có quyền yêu cầu chấm dứt hợp đồng sử dụng gói liệu trình trước thời hạn. Việc hoàn tiền sẽ tuân thủ nghiêm ngặt công thức sau:',
      '8.1 Phí phạt hủy gói: Được tính cố định bằng 10% trên tổng giá trị hợp đồng gói đã chốt theo hình thức thanh toán (không tính trên số tiền thực tế khách hàng đã đóng đến thời điểm hủy).',
      '8.2 Khấu trừ chi phí đã sử dụng: Các buổi điều trị Khách hàng đã thực hiện sẽ được tính theo đơn giá của buổi lẻ thực tế của dịch vụ đó tại thời điểm mua (không tính theo giá chiết khấu của gói).',
      '8.3 Khấu trừ chi phí khám: Chi phí khám lâm sàng ban đầu (nếu có và thuộc diện được miễn phí trước đó) sẽ bị truy thu theo đơn giá niêm yết thực tế của gói khám trên hệ thống tại thời điểm hủy gói.',
      'Số tiền hoàn lại = (Tổng số tiền khách đã đóng) - (Chi phí các buổi lẻ đã sử dụng) - (Chi phí khám lâm sàng truy thu) - (Phí phạt hủy gói 10%).',
    ],
  },
  {
    heading: '9. Tích hợp cổng thanh toán SePay & Bên thứ ba',
    paragraphs: [
      '9.1 Chuyển khoản tự động: OfficeCare sử dụng dịch vụ cổng quét mã chuyển khoản tự động của đối tác thứ ba (SePay) để xác nhận hóa đơn tức thì. Mọi thông tin chuyển khoản phải tuân thủ đúng mã QR hoặc cú pháp nội dung chuyển khoản hệ thống hiển thị.',
      '9.2 Miễn trừ trách nhiệm kỹ thuật: Trường hợp xảy ra lỗi giao dịch do hệ thống ngân hàng hoặc cổng thanh toán SePay (treo tiền, chậm kết nối API), OfficeCare có trách nhiệm phối hợp với đối tác và ngân hàng để đối soát dòng tiền cho Khách hàng trong vòng 07 ngày làm việc. OfficeCare được miễn trừ trách nhiệm bồi thường đối với các sự cố gián đoạn dịch vụ xuất phát trực tiếp từ phía ngân hàng hoặc SePay.',
    ],
  },
  {
    heading: '10. Bảo mật thông tin bệnh án & Dữ liệu cá nhân',
    paragraphs: [
      '10.1 Tiêu chuẩn bảo mật: Toàn bộ dữ liệu bệnh án điện tử, thông tin y khoa, lịch sử điều trị của Khách hàng được bảo mật nghiêm ngặt theo các tiêu chuẩn y tế hiện hành và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
      '10.2 Phạm vi sử dụng: Dữ liệu chỉ được sử dụng cho mục đích theo dõi phác đồ điều trị nội bộ và cải tiến chất lượng y khoa. OfficeCare cam kết không chia sẻ dữ liệu bệnh án cho bất kỳ bên thứ ba nào vì mục đích thương mại khi chưa có sự đồng ý bằng văn bản của Khách hàng.',
    ],
  },
  {
    heading: '11. Miễn trừ trách nhiệm y khoa',
    paragraphs: [
      'Hiệu quả phục hồi chức năng và vật lý trị liệu phụ thuộc lớn vào cơ địa, mức độ tổn thương thực tế, thói quen sinh hoạt và mức độ tuân thủ các bài tập hướng dẫn tại nhà của bệnh nhân.',
      'OfficeCare cam kết thực hiện đúng quy trình chuyên môn y khoa kỹ lượng, nhưng không cam kết hoặc bảo đảm tuyệt đối thời gian phục hồi cụ thể cho bất kỳ trường hợp nào.',
    ],
  },
  {
    heading: '12. Sở hữu trí tuệ, Luật áp dụng & Giải quyết tranh chấp',
    paragraphs: [
      '12.1 Sở hữu trí tuệ: Toàn bộ mã nguồn hệ thống đặt lịch, cấu trúc dữ liệu, nhãn hiệu, logo, các bài viết kiến thức y khoa chuẩn SEO đăng tải trên website OfficeCare đều thuộc sở hữu trí tuệ độc quyền của OfficeCare.',
      '12.2 Luật điều chỉnh: Điều khoản dịch vụ này được điều chỉnh và giải thích theo quy định của pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.',
      '12.3 Giải quyết tranh chấp: Mọi tranh chấp phát sinh trong quá trình sử dụng dịch vụ trước hết sẽ được ưu tiên giải quyết thông qua thương lượng hòa giải. Trường hợp không đạt được đồng thuận, tranh chấp sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh.',
    ],
  },
];
